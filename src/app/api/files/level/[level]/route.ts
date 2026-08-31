import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ level: string }> }
) {
  const { level } = await params;

  // The /courses and /docs pages require a session, so this route must
  // too. It previously served the whole archive to anonymous callers.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  } catch (error) {
    console.error("Level file fetch failed:", error);
    return NextResponse.json(
      { error: "Could not load files for that level" },
      { status: 500 }
    );
  }
}
