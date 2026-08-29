import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/auth/server";

/**
 * Restrict post-login redirects to paths on this site.
 *
 * `new URL(value, origin)` ignores the base whenever `value` is absolute, so
 * passing the raw parameter through sent users straight to any external site
 * immediately after signing in. Only a single-slash path is accepted here:
 * that rejects absolute URLs, protocol-relative `//evil.com`, and the
 * backslash variants browsers normalise into one.
 */
function safeRedirectPath(value: string | null) {
  if (!value) return "/";

  const candidate = value.trim();

  if (!candidate.startsWith("/")) return "/";
  if (candidate.startsWith("//")) return "/";
  if (candidate.startsWith("/\\")) return "/";
  if (candidate.includes("\\")) return "/";
  // A control character can be stripped by the browser and change how the
  // rest of the string parses.
  if (/[\u0000-\u001f\u007f]/.test(candidate)) return "/";

  return candidate;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = safeRedirectPath(requestUrl.searchParams.get("redirect_to"));

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
