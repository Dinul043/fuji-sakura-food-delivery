import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow query strings for cache busting
    localPatterns: [
      {
        pathname: '/images/**',
        search: '',
      },
    ],
  },
};

export default nextConfig;
