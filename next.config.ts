import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['images.unsplash.com', 'cdn-images-1.medium.com'],

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
        search: '',
      },
        {
          protocol: 'https',
          hostname: 'cdn-images-1.medium.com',
          port: '',
          pathname: '/**',
          search: '',
        },
    ],
  },
};

