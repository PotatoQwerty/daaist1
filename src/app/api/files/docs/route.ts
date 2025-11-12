import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { data: files, error } = await supabaseServer
      .schema("public")
      .from("files")
      .select("*")
      .eq("category", "doc");

    if (error) throw new TypeError(error.message);

    return NextResponse.json({ files }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
