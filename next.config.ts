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
  
  // Performance optimizations for faster compilation
  transpilePackages: ['lucide-react'], // Pre-transpile heavy packages
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting for faster compilation
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**'],
      };
      
      // Reduce bundle size for faster compilation
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'lucide',
            chunks: 'all',
          },
          prisma: {
            test: /[\\/]node_modules[\\/]@prisma[\\/]/,
            name: 'prisma',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
  
  // Enhanced configuration for PDF processing
  experimental: {
    // Improve compilation speed
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
    // Disable ISR cache for large files
    // isrMemoryCacheSize: 0,
  },

};

export default nextConfig;