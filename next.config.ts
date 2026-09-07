import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  // Server Actions default to a 1MB request body limit — too small for the
  // 5MB image uploads allowed by uploadProductImage/uploadHomeBannerImage
  // (src/app/admin/produtos/actions.ts, src/app/admin/destaques/actions.ts).
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
