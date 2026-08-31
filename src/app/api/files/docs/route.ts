import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  // The /courses and /docs pages require a session, so this route must
  // too. It previously served the whole archive to anonymous callers.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: files, error } = await supabaseServer
      .schema("public")
      .from("files")
      .select("*")
      .eq("category", "doc");

    if (error) throw error;

    return NextResponse.json({ files }, { status: 200 });
  } catch (error) {
    console.error("Docs fetch failed:", error);
    return NextResponse.json(
      { error: "Could not load documents" },
      { status: 500 },
    );
  }
}
