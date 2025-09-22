import dotenv from "dotenv";
import type { NextConfig } from "next";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "dev"}`,
});

// Development-specific configuration with disabled caching and chunking
const nextDevConfig: NextConfig = {
  // Disable SWC minification for faster builds
  swcMinify: false,
  
  // Basic image configuration without aggressive caching
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    // Disable image caching for development
    minimumCacheTTL: 0,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compiler optimizations - keep console logs in development
  compiler: {
    removeConsole: false,
  },

  // Development webpack configuration - disable chunking and caching
  webpack: (config, { dev, isServer }) => {
    // Always disable splitting and caching in development
    if (dev) {
      // Disable all caching
      config.cache = false;
      
      // Disable chunk splitting for faster rebuilds
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'async',
          cacheGroups: {
            default: false,
            vendors: false,
          },
        },
        runtimeChunk: false,
        moduleIds: 'named',
        chunkIds: 'named',
      };

      // Disable persistent caching
      config.snapshot = {
        managedPaths: [],
        immutablePaths: [],
        buildDependencies: {
          hash: true,
          timestamp: true,
        },
        module: {
          timestamp: true,
          hash: true,
        },
        resolve: {
          timestamp: true,
          hash: true,
        },
        resolveBuildDependencies: {
          timestamp: true,
          hash: true,
        },
      };

      // Force webpack to rebuild everything
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }
    
    // Keep server-side externals for functionality
    if (isServer) {
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

  // Disable aggressive headers and caching for development
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          },
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
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // External packages for server components
  serverExternalPackages: [
    'pdf-parse',
    '@react-pdf/renderer',
    '@google-cloud/vision',
    '@google-cloud/storage',
    'googleapis',
    'firebase-admin',
    'web-push',
    'ioredis',
    '@upstash/redis',
    'axios',
    'bottleneck',
    'razorpay',
    'msg91',
    'twilio',
    'crypto-js',
    'bcryptjs',
    'html2canvas',
    'jspdf',
    'qrcode',
    'rss-parser'
  ],
  
  // Development-specific experimental features
  experimental: {
    // Enable modern bundling but disable caching
    esmExternals: true,
    // Disable build cache
    appDir: true,
  },

  // Output configuration for development
  output: 'standalone',
  
  // Disable compression for faster builds
  compress: false,
  
  // Disable powered by header
  poweredByHeader: false,
  
  // Enable React strict mode for development
  reactStrictMode: true,

  // Development-specific optimizations
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
};

export default nextDevConfig;
