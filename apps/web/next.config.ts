import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@nexora/shared", "@nexora/ui"],
};

export default nextConfig;
