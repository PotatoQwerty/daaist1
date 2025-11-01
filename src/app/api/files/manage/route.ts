import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { data, error } = await supabaseServer
    .schema("public")
    .from("files_with_users")
    .select("*");
  if (error) return NextResponse.json({ error: error }, { status: 500 });
  return NextResponse.json({ files: data }, { status: 200 });
}
