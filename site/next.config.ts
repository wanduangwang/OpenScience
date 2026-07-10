import type { NextConfig } from 'next';

// GitHub Pages project sites are served under /<repo>/ (here /OpenScience/).
// All asset + route URLs must be prefixed with that base path so they don't
// 404 against the repo root. Apply it only for production builds — local
// `next dev` stays at the root path for a frictionless preview.
const isProd = process.env.NODE_ENV === 'production';
const BASE_PATH = isProd ? '/OpenScience' : '';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: BASE_PATH,
  trailingSlash: true,
  images: { unoptimized: true },
};

// Guide page rewrites for dev mode only.
// In production (next build), output:'export' doesn't support rewrites,
// so we handle Guide pages via trailingSlash + directory-based output.
if (!isProd) {
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
