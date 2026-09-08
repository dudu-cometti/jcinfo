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
  //
  // allowedOrigins: the custom domain redirects the bare apex to `www` at
  // Vercel's edge (Project Settings > Domains). If a Server Action's POST
  // ever originates from the apex host, Next.js's own CSRF check compares
  // the browser's Origin header against the host that actually handled the
  // request (www, post-redirect) and rejects the mismatch — every domain
  // this app is reachable on needs to be listed here so that never happens.
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
      allowedOrigins: ["lojajcinfo.com.br", "www.lojajcinfo.com.br", "jcinfo.vercel.app"],
    },
  },
};

export default nextConfig;
