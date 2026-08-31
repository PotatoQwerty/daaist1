import type { CookieOptions } from "@supabase/ssr";

/**
 * Cookie settings for the Supabase auth token.
 *
 * @supabase/ssr defaults to `{ path: "/", sameSite: "lax", httpOnly: false,
 * maxAge: 400 days }` and nothing here overrode them, so the session cookie
 * was sent over plain HTTP and lived for over a year.
 *
 * `httpOnly` stays false: the browser client reads this cookie through
 * document.cookie, so it cannot be anything else. That is why the CSP in
 * next.config.ts matters - any script execution on the origin is a session
 * compromise.
 *
 * Shared by the browser, server and auth clients so the three cannot drift.
 */
export const SUPABASE_COOKIE_OPTIONS: CookieOptions = {
  path: "/",
  sameSite: "lax",
  // Off in development, where localhost is plain HTTP and a secure cookie
  // would simply never be stored.
  secure: process.env.NODE_ENV === "production",
  // 30 days rather than 400. These accounts are used on shared campus
  // machines, so a year-long cookie is a long time to leave one behind.
  maxAge: 60 * 60 * 24 * 30,
};
