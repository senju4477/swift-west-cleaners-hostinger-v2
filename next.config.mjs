const indexable = process.env.SITE_INDEXABLE === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ...(!indexable ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }] : []),
      ],
    }];
  },
};

export default nextConfig;
