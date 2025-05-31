const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tu configuración existente
  
  // Permitir imágenes desde el dominio propio
  images: {
    domains: ['localhost'],
    // Permitir imágenes locales
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Configuración específica para Prisma en Vercel
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma']
  },
  
  // Configuración del webpack para incluir archivos binarios de Prisma
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        '@prisma/client': '@prisma/client',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
