import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { auth } from "@/auth";

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = session.user.role === "admin";
    const body = await req.json();
    const { registration_number, role, ...updateFields } = body;

    const finalUpdateFields = { ...updateFields };

    if (isAdmin && role) {
      finalUpdateFields.role = role;
    }

    let query = supabaseServer.from("users").update(finalUpdateFields);

    // Hybrid Logic:
    // 1. If Admin AND registration_number provided -> Update user by matricule
    // 2. Else -> Update self (session user)
    if (isAdmin && registration_number) {
      query = query.eq("registration_number", registration_number);
    } else {
      query = query.eq("id", session.user.id);
    }

    const { data, error } = await query.select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data[0] });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
