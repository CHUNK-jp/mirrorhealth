/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow large health XML files (up to 500MB)
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
  },
};

export default nextConfig;
