import dotenv from "dotenv";
import type { NextConfig } from "next";
import path from "path";

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
    // Fix webpack cache issues with minimal configuration
    if (dev) {
      config.cache = {
        type: 'filesystem',
        cacheDirectory: path.resolve('.next/cache/webpack'),
        compression: 'gzip',
      };
    }

    // Ensure proper module resolution for caching
    config.resolve = {
      ...config.resolve,
      symlinks: false,
      cacheWithContext: false,
    };

    // Optimize bundle splitting for faster compilation
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
      };
      
      // Simplified splitChunks to avoid cache conflicts
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
            reuseExistingChunk: true,
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
    // Fix webpack cache issues
    webpackBuildWorker: true,
  },

};

export default nextConfig;