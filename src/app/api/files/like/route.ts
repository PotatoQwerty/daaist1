import { NextResponse } from "next/server";
import { createClient, supabaseServer } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  const userId = user?.id;
  const { fileId } = await req.json();

  if (error || !userId || !fileId)
    return NextResponse.json(
      { error: "You are not signed in || the file does not exist anymore" },
      { status: 401 }
    );

  // first check if it exists in the likes table
  const { data: exists, error: selectErr } = await supabaseServer
    .schema("public")
    .from("likes")
    .select("id, user_id, post_id")
    .eq("user_id", userId)
    .eq("post_id", fileId)
    .single();
  if (selectErr && selectErr.code !== "PGRST116") {
    // (PGRST116 = no rows found)
    return NextResponse.json({ error: selectErr.message }, { status: 500 });
  }

  // unlike here
  if (exists) {
    const { error: deleteErr } = await supabaseServer
      .schema("public")
      .from("likes")
      .delete()
      .eq("id", exists.id);
    if (deleteErr)
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });

    return NextResponse.json({ status: "unliked" }, { status: 200 });
  } else {
    //like here
    const { data, error } = await supabaseServer
      .schema("public")
      .from("likes")
      .insert([{ user_id: userId, post_id: fileId }])
      .select();
    if (error) return NextResponse.json({ error: error }, { status: 500 });
    return NextResponse.json({ data }, { status: 200 });
  }
}
