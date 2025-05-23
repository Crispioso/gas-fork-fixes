// postcss.config.mjs
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // Use the object syntax
    'autoprefixer': {},         // Add autoprefixer
  },
};

export default config;