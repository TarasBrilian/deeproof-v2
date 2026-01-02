import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile reown packages for proper ESM handling
  transpilePackages: [
    "@reown/appkit",
    "@reown/appkit-adapter-wagmi",
  ],
  // Empty turbopack config to allow both webpack and turbopack
  turbopack: {},
  // Webpack config to handle optional Solana dependencies
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    // Stub out Solana packages that are optional in coinbase SDK
    config.resolve.alias = {
      ...config.resolve.alias,
      "@solana/kit": false,
      "@solana-program/system": false,
      "@solana-program/token": false,
    };
    return config;
  },
};

export default nextConfig;




