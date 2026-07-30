import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};
module.exports = {
  allowedDevOrigins: ['192.168.1.18',"192.168.1.10"],
}
export default nextConfig;
