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
  
  // Configuración específica para Prisma en Vercel
  serverExternalPackages: ['@prisma/client', 'prisma'],
  
  // Excluir paquetes de desarrollo de la compilación
  outputFileTracingExcludes: {
    '*': [
      'node_modules/supabase/**/*',
    ],
  },
  
  // Configuración del webpack para incluir archivos binarios de Prisma
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      config.externals.push('@prisma/client');
      
      // Excluir Supabase de la compilación de producción
      if (!dev) {
        config.externals.push('supabase');
      }
      
      // Configuración adicional para Prisma en Vercel
      config.module.rules.push({
        test: /\.node$/,
        use: 'raw-loader',
      });
      
      // Optimización para producción
      if (!dev) {
        config.resolve.alias = {
          ...config.resolve.alias,
          '@prisma/client': '@prisma/client',
        };
      }
    }
    return config;
  },
  
  // Configuración específica para serverless
  output: 'standalone',
};

module.exports = nextConfig;
