import type { NextConfig } from "next";

const previewHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors https://app.moona365.com",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/__preview", headers: previewHeaders },
      { source: "/api/preview", headers: previewHeaders },
    ];
  },
};

export default nextConfig;
