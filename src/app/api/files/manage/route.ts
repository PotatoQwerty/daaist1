import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
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
