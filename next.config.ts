import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",   // emit static HTML to out/
  trailingSlash: true, // GCS serves index.html from directory paths
  images: {
    unoptimized: true, // next/image optimisation requires a server; disable for static
  },
};

export default nextConfig;
