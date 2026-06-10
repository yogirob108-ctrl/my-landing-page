import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Keep generated srcsets focused on sizes this one-page site actually renders.
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [128, 256, 384],
    // Next 16 requires explicit allow-listing for any non-default quality values.
    qualities: [70, 72, 75, 82, 85],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
