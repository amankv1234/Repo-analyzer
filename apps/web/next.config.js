process.env.NEXT_IGNORE_INCORRECT_LOCKFILE = "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@repomentor/shared"],
  webpack: (config) => {
    // Disable persistent filesystem cache on Windows/pnpm to avoid
    // "Unable to snapshot resolve dependencies" errors caused by
    // inaccessible package-lock.json in parent directories.
    config.cache = false;
    return config;
  },
};

module.exports = nextConfig;

