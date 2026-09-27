import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allows production builds to successfully complete even if there are type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allows production builds to successfully complete even if there are ESLint warnings/errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;