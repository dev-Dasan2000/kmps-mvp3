import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  //output: 'export',

  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // Disable ESLint during build
  },
  typescript: {
    ignoreBuildErrors: true, // Disable TypeScript errors during build
  },
  webpack: (config, { isServer }) => {
    // Add custom Webpack configuration to ignore case sensitivity warnings
    config.ignoreWarnings = [
      {
        module: /node_modules/, // Ignore node_modules warnings
      },
      {
        file: /.*/, // Ignore all files
        message: /There are multiple modules with names that only differ in casing/,
      },
    ];
    return config;
  },
};

export default nextConfig;
