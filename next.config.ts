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
  },
  // API route configuration
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Allow larger payloads (adjust based on Vercel plan)
    },
    responseLimit: '50mb',
  },
};

export default nextConfig;