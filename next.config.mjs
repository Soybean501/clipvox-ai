/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    }
  },
  eslint: {
    dirs: ['src']
  }
};

export default nextConfig;
