import type { NextConfig } from 'next';

const config: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',
  publicRuntimeConfig: {
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
    assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',
  },
  output: 'standalone',
  distDir: '.next',
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
  serverExternalPackages: ['mjml', 'uglify-js', 'html-minifier', 'mjml-core', 'mjml-parser-xml', 'mjml-validator'],
  webpack: (config) => {
    // Exclude problematic packages from webpack bundling
    config.externals.push('html-minifier');
    config.externals.push('uglify-js');
    config.externals.push('mjml');
    config.externals.push('mjml-core');
    config.externals.push('mjml-parser-xml');
    config.externals.push('mjml-validator');
    return config;
  }
};

export default config;
