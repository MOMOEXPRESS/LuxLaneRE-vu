/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Exclude prisma-dependent files from the build
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
}

export default nextConfig
