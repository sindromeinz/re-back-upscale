/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/re-back-upscale', // This tells Next.js where it lives
  images: {
    unoptimized: true, // Required for GitHub Pages
  },
};

export default nextConfig;
