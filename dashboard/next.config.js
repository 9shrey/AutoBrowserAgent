/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow serving screenshots from the sessions directory
  async rewrites() {
    return [
      {
        source: "/sessions/:path*",
        destination: "/api/sessions",
      },
    ];
  },
};

module.exports = nextConfig;
