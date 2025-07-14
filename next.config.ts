// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dkm3vd6cx/image/upload/**',
      },
      {
        protocol: 'https',
        hostname: 'images.pokemontcg.io',
        pathname: '/**',
      },
    ],
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/shop',
        permanent: true,
      },
    ];
  },

  // Remove or comment out the 'experimental' block if you get the error
  // experimental: {
  //   allowedDevOrigins: ['http://192.168.0.71:3000'],
  // },
};

module.exports = nextConfig;