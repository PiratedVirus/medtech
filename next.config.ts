import dotenv from "dotenv";
import type { NextConfig } from "next";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "dev"}`,
});

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Basic configuration to ensure build completes
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  // Basic configuration
  reactStrictMode: true,
  
  // Skip type checking during build to avoid memory issues
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;