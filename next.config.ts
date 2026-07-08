import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Host-portability rule (docs/PLAN.md §3): everything must render as a
  // static export so GitHub Pages remains a zero-friction fallback.
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
