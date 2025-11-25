/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: "standalone",     // FIXES vercel routes-manifest issue
};

module.exports = nextConfig;
