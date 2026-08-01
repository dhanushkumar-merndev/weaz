import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["192.168.1.18", "192.168.1.10"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "connect.facebook.net",
      },
      {
        protocol: "https",
        hostname: "www.facebook.com",
      },
    ],
  },
};

export default nextConfig;
