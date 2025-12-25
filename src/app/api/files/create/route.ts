import { auth } from "@/auth";
import { getUserRoles } from "@/lib/supabase/actions";
import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { isAdmin } = await getUserRoles(session.user.id);
  if (!isAdmin) {
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
    uploaded_by: session.user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
