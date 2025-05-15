import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * GET - Sirve una imagen desde la carpeta padre/locales/img
 */
export async function GET(request, { params }) {
  try {
    // Obtener el slug para construir la ruta del archivo
    params = await params;
    const { slug } = params;
    const fileName = Array.isArray(slug) ? slug.join('/') : slug;
    
    // Construir la ruta al archivo en la carpeta padre
    const filePath = path.resolve(process.cwd(), '..', 'locales', 'img', fileName);
    
    // Leer el archivo
    const fileBuffer = await fs.readFile(filePath);
    
    // Determinar el tipo MIME basado en la extensión del archivo
    const fileExt = fileName.split('.').pop().toLowerCase();
    let contentType = 'application/octet-stream'; // Por defecto
    
    switch (fileExt) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
    }
    
    // Devolver la imagen con el tipo MIME correcto
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache durante 24 horas
      }
    });
  } catch (error) {
    console.error('Error al servir el archivo:', error);
    
    return NextResponse.json(
      { error: 'Archivo no encontrado' },
      { status: 404 }
    );
  }
}