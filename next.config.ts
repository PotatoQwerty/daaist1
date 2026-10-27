import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const SUPABASE_ORIGIN =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://*.supabase.co";

const r2Endpoint = process.env.R2_ENDPOINT
  ? new URL(process.env.R2_ENDPOINT)
  : null;
// S3 can sign either path-style or bucket-subdomain upload URLs.
const R2_UPLOAD_ORIGINS = r2Endpoint
  ? [
      r2Endpoint.origin,
      ...(process.env.R2_BUCKET_NAME
        ? [`${r2Endpoint.protocol}//${process.env.R2_BUCKET_NAME}.${r2Endpoint.host}`]
        : []),
    ].join(" ")
  : "";

/**
 * Content Security Policy.
 *
 * This matters more here than in most apps: @supabase/ssr keeps the auth
 * token in a cookie the browser client has to read, so it cannot be
 * httpOnly, and any script execution on this origin is a session
 * compromise. `script-src 'self'` is what stops a script hosted on
 * cdn.daaist.com from running as part of this page.
 *
 * 'unsafe-inline' is still needed for Next's bootstrap and hydration
 * scripts; moving to nonces is the follow-up. 'unsafe-eval' is dev-only,
 * where React Refresh needs it.
 */
function contentSecurityPolicy() {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
    // Typekit serves the Kabel kit loaded in both layouts.
    "style-src 'self' 'unsafe-inline' https://use.typekit.net https://p.typekit.net",
    "font-src 'self' data: https://use.typekit.net https://p.typekit.net",
    // The three hosts in remotePatterns, plus blob/data for local previews
    // in the upload and avatar forms.
    `img-src 'self' data: blob: https://cdn.daaist.com https://lh3.googleusercontent.com ${SUPABASE_ORIGIN}`,
    // wss: is required - the chat subscribes to a Supabase Realtime channel.
    `connect-src 'self' ${SUPABASE_ORIGIN} wss://*.supabase.co https://cdn.daaist.com ${R2_UPLOAD_ORIGINS}`,
    "media-src 'self'",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

const nextConfig: NextConfig = {
  // Nothing gained by advertising the framework version.
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        // port: "",
      },
      {
        protocol: "https",
        hostname: "wnwewkiuabnwsegldtbq.supabase.co",
        // Scoped to the public bucket. The optimizer decodes whatever it
        // fetches with sharp/libvips, and users control the bytes in this
        // bucket, so it should not be able to reach anything else on the host.
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "cdn.daaist.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy(),
          },
          {
            // Without this the auth cookie can be sent over plain http on a
            // first visit, before any redirect happens.
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // frame-ancestors above covers modern browsers; this is the
          // fallback, and it is what stops the admin dashboard being framed.
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // camera stays on: the check-in desk scans QR codes.
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
