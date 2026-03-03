import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React DevTools in production-like development
  reactStrictMode: true,
  // Disable source maps in development for cleaner experience
  productionBrowserSourceMaps: false,
  images: {
    // Allow external domains for uploaded images
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '8000',
        pathname: '/uploads/**',
      },
    ],
    // Allow local images
    localPatterns: [
      {
        pathname: '/images/**',
        search: '',
      },
      {
        pathname: '/icons/**',
        search: '',
      },
    ],
  },
};

export default nextConfig;
