import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // @node-rs/argon2 is a native NAPI module; keep it server-side only.
  serverExternalPackages: ["@node-rs/argon2"],
};

export default nextConfig;
