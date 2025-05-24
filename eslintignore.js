module.exports = {
  // ... your other ESLint settings ...
  ignorePatterns: [
    // ... other ignored patterns ...
    "src/generated/prisma/",
    "node_modules/", // Good to have this too
    ".next/",       // And this
    "dist/",        // If you have a dist folder
  ],
};