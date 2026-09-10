import type { NextConfig } from "next";

const supabaseUrl = process.env.SUPABASE_URL || "";
let supabaseHostname = "";
try {
  supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : "";
} catch {
  supabaseHostname = "";
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHostname
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      {
        protocol: "https" as const,
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;