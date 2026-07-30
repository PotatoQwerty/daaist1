import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ level: string }> }
) {
  const { level } = await params;

  if (!level) {
    return NextResponse.json({ error: "Level is required" }, { status: 400 });
  }

  try {
    const { data: files, error } = await supabaseServer
      .schema("public")
      .from("files")
      .select("*")
      .eq("level", level); // Ensure the column name matches your database schema

    if (error) {
      throw error;
    }

    return NextResponse.json({ files }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
