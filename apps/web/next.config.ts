import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@pronto/shared", "@pronto/ui"],
};

export default nextConfig;
