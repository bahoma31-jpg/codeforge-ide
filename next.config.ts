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
};

export default withBundleAnalyzer(nextConfig);
