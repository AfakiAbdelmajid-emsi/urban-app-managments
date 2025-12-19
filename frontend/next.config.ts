import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ['react-map-gl', 'mapbox-gl'],
  webpack: (config, { isServer }) => {
    // Add support for mapbox-gl
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'mapbox-gl': 'mapbox-gl/dist/mapbox-gl.js',
      };
    }
    return config;
  },
};

export default nextConfig;
