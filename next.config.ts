import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

/**
 * Asset host. In production this is the Cloudflare R2 public bucket (§2, §14).
 * 3D assets are NEVER served from /public.
 */
const assetBase = process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? '';
const assetHost = assetBase ? new URL(assetBase).hostname : null;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: assetHost
      ? [{ protocol: 'https', hostname: assetHost, pathname: '/**' }]
      : [],
  },

  experimental: {
    // three.js is huge; keep its named-export tree-shaking honest. lucide-react is a barrel
    // of ~1,500 icon modules and this site imports two of them, so it belongs here for the
    // same reason.
    optimizePackageImports: ['@react-three/drei', 'motion', 'lucide-react'],
  },

  /**
   * Vehicles, prospects and captures are read from `data/` at request time so that adding
   * one is only a new JSON file (§10). Next cannot trace a readdir, so the directory is
   * included explicitly — without this, `/for/[slug]` 404s in production and nowhere else.
   */
  outputFileTracingIncludes: {
    '/**': ['./data/**/*'],
  },

  async headers() {
    return [
      {
        // Hashed, immutable local assets (posters, 360 frames served locally in dev).
        source: '/:path*.(glb|hdr|ktx2|webp|avif|woff2|mp3|ogg)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/for/:slug*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
