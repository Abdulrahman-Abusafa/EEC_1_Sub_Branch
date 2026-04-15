import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "table.inmakan.com",
      },
    ],
  },
};

export default nextConfig;

