const apiOrigin = process.env.API_ORIGIN || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000');

if (!apiOrigin) {
  throw new Error('API_ORIGIN is required for production. Set it to your deployed backend URL in Vercel.');
}

try {
  new URL(apiOrigin);
} catch {
  throw new Error('API_ORIGIN must be a full URL, for example https://your-api.onrender.com.');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async redirects() {
    return [{ source: '/crm', destination: '/admin', permanent: true }];
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }];
  },
};

export default nextConfig;
