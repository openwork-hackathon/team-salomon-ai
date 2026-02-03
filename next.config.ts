import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid Next.js picking a parent directory as the workspace root when other lockfiles exist.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
