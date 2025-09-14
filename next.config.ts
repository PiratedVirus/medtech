import dotenv from "dotenv";
import type { NextConfig } from "next";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "dev"}`,
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  // Enhanced configuration for PDF processing
  experimental: {
    // Disable ISR cache for large files
    // isrMemoryCacheSize: 0,
  }
};

export default nextConfig;