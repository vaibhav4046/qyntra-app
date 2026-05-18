import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/dashboard", destination: "/home", permanent: false },
      { source: "/dashboard/:path*", destination: "/home", permanent: false },
      { source: "/workspace", destination: "/home", permanent: false },
      { source: "/wiki/home", destination: "/wiki", permanent: false },
      { source: "/map", destination: "/map-3d", permanent: false },
    ];
  },
};

export default nextConfig;
