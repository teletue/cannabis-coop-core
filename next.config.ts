import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve the static noir notebook at the clean /notesbogen URL
  async rewrites() {
    return [
      { source: "/notesbogen", destination: "/notesbogen/index.html" },
      { source: "/redaktionen/:path*", destination: "/redaktoeren/:path*" },
      { source: "/editor/:path*", destination: "/redaktoeren/:path*" },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
