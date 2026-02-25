import type { NextConfig } from "next";

// Bundle Analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Monaco Editor configuration
    config.module.rules.push({
      test: /\.m?js/,
      type: "javascript/auto",
      resolve: {
        fullySpecified: false,
      },
    });
    return config;
  },
  // SSR: Monaco is client-side only
  transpilePackages: ["monaco-editor"],
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Security headers fallback (primary headers set via middleware.ts)
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
};

export default withBundleAnalyzer(nextConfig);
