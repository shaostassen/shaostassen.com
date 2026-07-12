import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Host-portability rule (docs/PLAN.md §3): everything must render as a
  // static export so GitHub Pages remains a zero-friction fallback.
  output: "export",
  // Pin the workspace root: a stray lockfile in a parent directory
  // otherwise makes turbopack scan far too much.
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
