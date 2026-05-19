/** @type {import('next').NextConfig} */

// In Docker the API container is reachable via its service name.
// Locally it defaults to localhost:8000.
const API_URL = process.env.API_URL || "http://localhost:8000";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
