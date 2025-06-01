const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // Permitir imágenes desde el dominio propio y Cloudinary
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
    // Permitir imágenes locales
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Configuración específica para Prisma en Vercel (actualizada para Next.js 15+)
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  
  // Configuración del webpack para incluir archivos binarios de Prisma
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client');
      
      // Configuración adicional para Prisma en Vercel
      config.module.rules.push({
        test: /\.node$/,
        use: 'raw-loader',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
