import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/auth/server";
import { validateUsername } from "@/lib/username";
import {
  UNIQUE_VIOLATION,
  uniqueViolationMessage,
  validateShortText,
  PROFILE_LIMITS,
} from "@/lib/profile-validation";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  const limited = enforceRateLimit(request, RATE_LIMITS.onboarding, {
    bucket: "onboarding",
    userId,
  });
  if (limited) return limited;

  // Onboarding runs once. Without this an already-onboarded user could POST
  // here again at any time to rewrite their registration number, their DAA
  // status, or their name.
  const { data: existingOnboarding } = await supabaseServer
    .schema("public")
    .from("onboarding_status")
    .select("onboarded")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingOnboarding?.onboarded) {
    return NextResponse.json(
      { error: "You have already completed onboarding." },
      { status: 409 },
    );
  }

  // Make sure to parse the body correctly based on how you send it
  // If you send JSON.stringify({ form: values }), this is correct.
  const { form } = await request.json();

  const {
    firstname,
    lastname,
    username,
    registration_number,
    studyyear,
    isdaa,
  } = form || {};

  /* The username was written straight through. The student form checks it in
     the browser, and the invite path runs it through validateUsername, but
     this route accepted anything - so the documented rule was skippable by
     posting here directly. Validated before the roster lookup so a bad
     username costs nothing. */
  const usernameCheck = validateUsername(username);
  if (!usernameCheck.ok) {
    return NextResponse.json({ error: usernameCheck.error }, { status: 400 });
  }
  const validUsername = usernameCheck.username;

  // A claim of DAA membership is verified here rather than trusted from the
  // request body. The client checks the matricule against this same table
  // before submitting, so a genuine student sees no change; what this stops
  // is someone posting a registration number that is not theirs (they are
  // easy to guess, and printed on student cards) to pass as a real student.
  let verifiedRegistrationNumber: string | null = null;
  let verifiedFirstname = firstname;
  let verifiedLastname = lastname;
  const claimsDaa = isdaa === true;

  if (claimsDaa) {
    const matricule =
      typeof registration_number === "string" ? registration_number.trim() : "";

    if (!matricule) {
      return NextResponse.json(
        { error: "A registration number is required for DAA students." },
        { status: 400 },
      );
    }

    const { data: student } = await supabaseServer
      .schema("public")
      .from("students-data")
      .select("firstname, lastname")
      .eq("registration_number", matricule)
      .maybeSingle();

    if (!student) {
      return NextResponse.json(
        { error: "That registration number is not on the DAA student list." },
        { status: 400 },
      );
    }

    // The roster is the source of truth for the name, not the form.
    verifiedRegistrationNumber = matricule;
    verifiedFirstname = student.firstname;
    verifiedLastname = student.lastname;
  } else {
    // Non-DAA accounts have no roster to check against, so the form is the
    // only source for the name. It still has to be bounded text.
    for (const [label, value] of [
      ["First name", verifiedFirstname],
      ["Last name", verifiedLastname],
    ] as const) {
      const check = validateShortText(value, label, PROFILE_LIMITS.name);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
    }

    verifiedFirstname = String(verifiedFirstname).trim();
    verifiedLastname = String(verifiedLastname).trim();
  }

  const { error: profileError } = await supabaseServer
    .schema("public")
    .from("profiles")
    .upsert({
      user_id: userId,
      firstname: verifiedFirstname,
      lastname: verifiedLastname,
      username: validUsername,
      registration_number: verifiedRegistrationNumber,
    });

  if (profileError) {
    console.error("Profile update error:", profileError);
    // Names the field that actually clashed, instead of making the person
    // guess which of the two to change.
    if (profileError.code === UNIQUE_VIOLATION) {
      return NextResponse.json(
        { error: uniqueViolationMessage(profileError.details) },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Profile update failed" },
      { status: 500 }
    );
  }

  /* ---------------------------------------------------------
     2️⃣ Student Enrollment (CHANGED TO UPSERT)
     --------------------------------------------------------- */
  // Only run if we actually have data to save
  if (studyyear || isdaa !== undefined) {
    // We use upsert to prevent duplicate rows if the user clicks twice.
    // NOTE: This assumes 'user_id' has a UNIQUE constraint in your DB schema
    // for the 'student_enrollments' table.
    const { error: enrollmentError } = await supabaseServer
      .schema("public")
      .from("student_enrollments")
      .upsert(
        {
          user_id: userId,
          study_year: studyyear,
          // Verified above, so an unverified claim cannot set this true.
          isdaa: claimsDaa,
        },
        { onConflict: "user_id" }
      );

    if (enrollmentError) {
      console.error("Enrollment error:", enrollmentError);
      return NextResponse.json({ error: "Enrollment failed" }, { status: 500 });
    }
  }
  // Only seed the default role when the account has none. The previous
  // upsert could replace an existing role with "student".
  const { data: currentRoles } = await supabaseServer
    .schema("public")
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (!currentRoles || currentRoles.length === 0) {
    const { error: roleError } = await supabaseServer
      .schema("public")
      .from("user_roles")
      .insert({
        user_id: userId,
        role: "student",
      });

    if (roleError) {
      console.error("Role update error:", roleError);
      return NextResponse.json(
        { error: "Role update failed" },
        { status: 500 },
      );
    }
  }

  /* ---------------------------------------------------------
     3️⃣ Mark Onboarding Complete
     --------------------------------------------------------- */
  const { error: onboardingError } = await supabaseServer
    .schema("public")
    .from("onboarding_status")
    .upsert({
      user_id: userId,
      onboarded: true,
      onboarded_at: new Date().toISOString(),
    });

  if (onboardingError) {
    console.error("Onboarding status error:", onboardingError);
    // This is critical logic, so we should probably fail the request
    // so the frontend knows to try again.
    return NextResponse.json(
      { error: "Finalizing onboarding failed" },
      { status: 500 }
    );
  }

  // Return success
  return NextResponse.json({ success: true }, { status: 200 });
}
