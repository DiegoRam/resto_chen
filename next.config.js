/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
  },
  // Disable ESLint during the build process
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Other Next.js config options can go here
};

module.exports = nextConfig; 