/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... any other existing configurations you have ...

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        // port: '', // Port is optional and usually not needed for https
        pathname: '/dkm3vd6cx/image/upload/**', // Your specific Cloudinary path
      },
      {
        protocol: 'https',
        hostname: 'images.pokemontcg.io',
        pathname: '/**', // Allows any path on this hostname for Pokemon images
      },
      // ... you can add more patterns here if needed in the future ...
    ],
  },

  // ... any other existing configurations you have ...
};

export default nextConfig;