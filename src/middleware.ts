export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/admin/:path*", "/upload", "/onboarding"], // Protects /dashboard and /admin and their sub-routes
};
