import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { verificarDirectorio } from '@/lib/services/configService.js';

/**
 * POST - Sube un archivo de logo para la empresa
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Procesar el FormData
    const formData = await request.formData();
    const logoFile = formData.get('logo');
    
    if (!logoFile) {
      return NextResponse.json({ error: 'No se ha proporcionado un archivo' }, { status: 400 });
    }
    
    // Verificar que el archivo sea una imagen
    if (!logoFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'El archivo debe ser una imagen' }, { status: 400 });
    }
    
    // Crear directorio locales/img en la carpeta padre si no existe
    const imgDir = path.join(process.cwd(), '..', 'locales', 'img');
    await verificarDirectorio(imgDir);
    
    // Generar un nombre único para el archivo
    const fileExt = logoFile.name.split('.').pop();
    const fileName = `logo-${uuidv4()}.${fileExt}`;
    const filePath = path.join(imgDir, fileName);
    
    // Convertir el archivo a un buffer
    const arrayBuffer = await logoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Guardar el archivo en el sistema de archivos (carpeta padre)
    await fs.writeFile(filePath, buffer);
    
    // Construir la URL para devolver (usando el endpoint API)
    const logoUrl = `/api/locales/img/${fileName}`;
    
    return NextResponse.json({ 
      success: true, 
      logoUrl: logoUrl,
      message: 'Logo subido correctamente'
    });
  } catch (error) {
    console.error('Error al subir logo:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      message: 'Error al subir el logo'
    }, { status: 500 });
  }
}