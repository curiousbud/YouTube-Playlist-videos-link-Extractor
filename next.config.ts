const nextConfig = {
  // Pin the workspace root so Turbopack ignores stray lockfiles elsewhere on disk.
  turbopack: {
    root: __dirname,
  },
  // Allow accessing the dev server over the local network (e.g. via LAN IP)
  // without Next.js blocking cross-origin HMR/font requests.
  allowedDevOrigins: ['169.254.171.105'],
  images: {
    // Serve YouTube thumbnails directly from the CDN instead of routing them
    // through Vercel's Image Optimization (which is metered and, once the free
    // tier is exhausted, fails and hides images in production).
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
  },
  // ...other config
};

export default nextConfig;
