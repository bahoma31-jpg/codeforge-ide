import type { NextConfig } from "next";

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
};

export default nextConfig;
