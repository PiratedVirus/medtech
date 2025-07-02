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
};

export default nextConfig;