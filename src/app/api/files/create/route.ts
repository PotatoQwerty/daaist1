import { getUserRoles } from "@/lib/supabase/actions";
import { createClient, supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { canUpload } = await getUserRoles(user.id);
  if (!canUpload) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  const { error } = await supabaseServer.schema("public").from("files").insert({
    file_name: body.file_name,
    url: body.url,
    size: body.size,
    type: body.type,
    category: body.category,
    level: body.level,
    subject: body.subject,
    issum: body.issum,
    uploaded_by: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
