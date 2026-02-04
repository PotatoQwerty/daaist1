import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

function sanitizeRedirectTo(value: string | null) {
  // Prevent open-redirects. Only allow same-origin relative paths.
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = sanitizeRedirectTo(
    requestUrl.searchParams.get("redirect_to")
  );

  // Capture cookies that Supabase wants to set, then apply them to our redirect response.
  let cookiesToSet: any[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(nextCookiesToSet) {
          cookiesToSet = nextCookiesToSet as any[];
        },
      },
    }
  );

  let userId: string | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      userId = data.user?.id ?? data.session?.user?.id ?? null;
    }
  }

  // If the user is not onboarded, send them straight to onboarding (avoids "first-hit" race on `/`).
  let finalRedirectTo = redirectTo;
  if (userId) {
    const { data, error } = await supabaseServer
      .schema("public")
      .from("onboarding_status")
      .select("onboarded")
      .eq("user_id", userId)
      .maybeSingle();

    const onboarded = !error && Boolean(data?.onboarded);
    if (!onboarded) {
      finalRedirectTo = "/onboarding";
    }
  }

  const response = NextResponse.redirect(
    new URL(finalRedirectTo, requestUrl.origin)
  );

  for (const cookie of cookiesToSet) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;
}
