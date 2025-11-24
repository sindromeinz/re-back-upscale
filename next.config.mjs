/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/re-back-upscale',
  output: 'export',
  images: {
    unoptimized: true, // Required for GitHub Pages
  },
};

export default nextConfig;
