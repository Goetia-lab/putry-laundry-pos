import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    optimizePackageImports: ['react-day-picker', 'react-hook-form'],
  },
};

export default nextConfig;
