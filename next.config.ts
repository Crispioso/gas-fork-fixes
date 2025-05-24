/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... any other existing configurations you have ...

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '', // Optional: specify port if not standard (usually empty for https)
        pathname: '/dkm3vd6cx/image/upload/**', // Optional: be more specific with the path
                                               // Using '/**' allows any path on that hostname.
                                               // Your URL path starts with /dkm3vd6cx/image/upload/
                                               // so this is a good specific pattern.
      },
      // ... any other remote patterns you might have ...
    ],
    // If you were using the older 'domains' configuration (less common now):
    // domains: ['res.cloudinary.com'],
  },

  // ... any other existing configurations you have ...
};

export default nextConfig;
