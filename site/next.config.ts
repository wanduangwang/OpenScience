import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

// Guide page rewrites for dev mode only.
// In production (next build), output:'export' doesn't support rewrites,
// so we handle Guide pages via trailingSlash + directory-based output.
if (process.env.NODE_ENV !== 'production') {
  nextConfig.rewrites = async () => [
    // MyST EN book pages
    { source: '/guide/en', destination: '/guide/en/index.html' },
    { source: '/guide/en/:slug', destination: '/guide/en/:slug/index.html' },
    // MyST ZH book pages
    { source: '/guide/zh', destination: '/guide/zh/index.html' },
    { source: '/guide/zh/:slug', destination: '/guide/zh/:slug/index.html' },
  ];
}

export default nextConfig;
