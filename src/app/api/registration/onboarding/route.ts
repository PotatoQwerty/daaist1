import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/auth/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;
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

  const { error: profileError } = await supabaseServer
    .schema("public")
    .from("profiles")
    .upsert({
      user_id: userId,
      firstname,
      lastname,
      username,
      registration_number,
    });

  if (profileError) {
    console.error("Profile update error:", profileError);
    // Handle Unique Violation (Username taken)
    if (profileError.code === "23505") {
      return NextResponse.json(
        { error: "Username or registration number already taken!" },
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
          isdaa: isdaa,
        },
        { onConflict: "user_id" }
      );

    if (enrollmentError) {
      console.error("Enrollment error:", enrollmentError);
      return NextResponse.json({ error: "Enrollment failed" }, { status: 500 });
    }
  }
  const { error: roleError } = await supabaseServer
    .schema("public")
    .from("roles")
    .upsert({
      user_id: userId,
      role: "student",
    });

  if (roleError) {
    console.error("Role update error:", roleError);
    return NextResponse.json({ error: "Role update failed" }, { status: 500 });
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
