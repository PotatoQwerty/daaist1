import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const session = await auth();

  // 1️⃣ Check if logged in
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  //   // 2️⃣ Check if user is admin
  if (session.user.role !== "admin") {
    return NextResponse.json(
      { error: "You do not have permission to do this action" },
      { status: 403 }
    );
  }

  // 3️⃣ Fetch users from Supabase
  const { data, error } = await supabaseServer
    .from("users")
    .select(
      "firstname, lastname, registration_number,role,isdaa,username,id,studyyear"
    );

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }

  return NextResponse.json({ users: data }, { status: 200 });
}
