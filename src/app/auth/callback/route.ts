import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

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

  const redirectUrl = new URL(redirectTo, requestUrl.origin);
  const response = NextResponse.redirect(redirectUrl);

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );
    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}
