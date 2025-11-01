import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
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
        // port: "",
      },
      {
        protocol: "https",
        hostname: "cdn.daaist.com",
        // port: "",
      },
    ],
  },
};

export default nextConfig;
