/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for @mysten/dapp-kit CSS import
  transpilePackages: ["@mysten/dapp-kit"],
};

module.exports = nextConfig;
