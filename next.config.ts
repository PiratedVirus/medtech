import dotenv from "dotenv";
import type { NextConfig } from "next";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "dev"}`,
});

// Check if we should use development config
if (process.env.NEXT_CONFIG === 'dev') {
  // Import and export development config directly
  module.exports = require('./next.config.dev.ts').default;
}

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // SWC minification is enabled by default in Next.js 15+
  
  // Optimize images with better caching and formats
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    // Enable modern image formats for better performance
    formats: ['image/webp', 'image/avif'],
    // Optimize image loading
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production unless DEBUG_LOGS is enabled
    removeConsole: process.env.NODE_ENV === 'production' && !process.env.DEBUG_LOGS,
  },

  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting for client-side
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }
    
    // Server-side optimizations
    if (isServer) {
      // Exclude heavy packages from server bundle
      config.externals = config.externals || [];
      config.externals.push({
        'pdf-parse': 'commonjs pdf-parse',
        '@react-pdf/renderer': 'commonjs @react-pdf/renderer',
        'firebase-admin': 'commonjs firebase-admin',
        'web-push': 'commonjs web-push',
        'ioredis': 'commonjs ioredis',
        '@upstash/redis': 'commonjs @upstash/redis',
        'axios': 'commonjs axios',
        'bottleneck': 'commonjs bottleneck',
        'razorpay': 'commonjs razorpay',
        'msg91': 'commonjs msg91',
        'twilio': 'commonjs twilio',
        'crypto-js': 'commonjs crypto-js',
        'bcryptjs': 'commonjs bcryptjs',
        'html2canvas': 'commonjs html2canvas',
        'jspdf': 'commonjs jspdf',
        'qrcode': 'commonjs qrcode',
        'rss-parser': 'commonjs rss-parser',
        '@google-cloud/vision': 'commonjs @google-cloud/vision',
        '@google-cloud/storage': 'commonjs @google-cloud/storage',
        'googleapis': 'commonjs googleapis'
      });
    }
    
    return config;
  },

  // Headers for better caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // External packages for server components - prevents bundling heavy server dependencies
  serverExternalPackages: [
    // PDF Processing
    'pdf-parse',
    '@react-pdf/renderer',
    
    // Google Cloud Services
    '@google-cloud/vision',
    '@google-cloud/storage',
    'googleapis',
    
    // Firebase & Push Notifications
    'firebase-admin',
    'web-push',
    
    // Database & Caching
    'ioredis',
    '@upstash/redis',
    
    // HTTP & Rate Limiting
    'axios',
    'bottleneck',
    
    // Payment Processing
    'razorpay',
    
    // SMS Services
    'msg91',
    'twilio',
    
    // Other heavy dependencies
    'crypto-js',
    'bcryptjs',
    'html2canvas',
    'jspdf',
    'qrcode',
    'rss-parser'
  ],
  
  // Enhanced configuration for PDF processing and performance
  experimental: {
    // Enable modern bundling
    esmExternals: true,
  },

  // Output configuration for better performance
  output: 'standalone',
  
  // Enable compression
  compress: true,
  
  // Optimize for production
  poweredByHeader: false,
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,
};

// Only export if not using dev config
if (process.env.NEXT_CONFIG !== 'dev') {
  module.exports = withBundleAnalyzer(nextConfig);
}