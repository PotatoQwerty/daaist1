import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ onboarded: null }, { status: 401 });
  }

  return NextResponse.json({ onboarded: session.user?.onboarded ?? false });
}
