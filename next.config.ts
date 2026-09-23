import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block the page from being embedded in an iframe (clickjacking protection)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Legacy XSS filter for older browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Limit referrer information sent to third-party sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict access to sensitive browser APIs
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Content Security Policy — allows same-origin + Supabase auth + CDNs used in previews
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // scripts: same-origin, inline (Next.js needs this), Sandpack CDN
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net",
      // styles: same-origin, inline (Tailwind/CSS-in-JS), fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // fonts
      "font-src 'self' https://fonts.gstatic.com",
      // images: same-origin + data URIs + Supabase storage
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
      // connections: same-origin + Supabase + AI APIs + Sandpack
      "connect-src 'self' https://*.supabase.co https://*.supabase.in https://integrate.api.nvidia.com https://openrouter.ai https://api.github.com https://api.vercel.com https://*.codesandbox.io https://*.csb.app https://cdn.jsdelivr.net https://unpkg.com",
      // frames: Sandpack preview runs in an iframe
      "frame-src 'self' blob: https://codesandbox.io https://*.codesandbox.io https://*.csb.app",
      // workers: Sandpack bundler and editor web workers
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
