/** @type {import('next').NextConfig} */
const nextConfig = {
  // Отключаем экспериментальные фичи для стабильности в Docker
  experimental: {
    serverComponentsExternalPackages: [],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  images: {
    domains: ['localhost'],
    // Отключаем оптимизацию изображений для Docker
    unoptimized: true,
  },
  output: 'standalone',
  // Улучшаем производительность в Docker
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig