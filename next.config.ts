import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
