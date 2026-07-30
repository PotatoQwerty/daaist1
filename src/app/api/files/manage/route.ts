import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { getUserRoles } from "@/lib/supabase/actions";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { isAdmin, isSuperAdmin } = await getUserRoles(user.id);
  if (!isAdmin && !isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseServer.schema("public").from("files")
    .select(`
      id,
      url,
      created_at,
      file_name,
      type,
      category,
      level,
      subject,
      issum,
      size,
      profiles (
        username
      )
    `);

  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json({ files: data }, { status: 200 });
}
