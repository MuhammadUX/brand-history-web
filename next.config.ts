import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Do not fail the production build on lint errors (Sprint-0).
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
