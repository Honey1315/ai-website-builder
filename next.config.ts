import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://*.googleusercontent.com",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in https://integrate.api.nvidia.com https://openrouter.ai https://api.github.com https://api.vercel.com https://*.codesandbox.io https://*.csb.app https://cdn.jsdelivr.net https://unpkg.com",
      "frame-src 'self' blob: https://codesandbox.io https://*.codesandbox.io https://*.csb.app",
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/auth/login",
        destination: "/",
        permanent: false,
      },
      {
        source: "/auth/signup",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
