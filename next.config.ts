import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These packages talk to the database and must run as plain Node.js modules.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        // The browser SDK is loaded from students' websites (any origin).
        source: "/sdk/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=300" },
        ],
      },
    ];
  },
};

export default nextConfig;
