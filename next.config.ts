import type { NextConfig } from 'next';

const config: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    ppr: true,
    dynamicIO: true,
    serverSourceMaps: true,
  },
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/f/inbox',
        permanent: false,
      },
    ];
  },
};

export default config;
