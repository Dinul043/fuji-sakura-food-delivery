import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable all development indicators
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  // Disable React DevTools in production-like development
  reactStrictMode: true,
  // Disable source maps in development for cleaner experience
  productionBrowserSourceMaps: false,
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
