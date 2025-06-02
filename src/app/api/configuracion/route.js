import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { obtenerConfig, obtenerDoctores, obtenerConsultorios, registrarConfig } from '@/lib/services/configService.js';

/**
 * GET - Obtiene la configuración del consultorio y doctores
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const isPublicEndpoint = request.headers.get('x-api-source') === 'whatsapp';
    
    if (!session && !isPublicEndpoint) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener la configuración del consultorio
    const config = await obtenerConfig();
    
    // Obtener la lista de doctores
    const doctores = await obtenerDoctores();
    
    // Obtener consultorios
    const consultorios = await obtenerConsultorios();
    
    // Combinar toda la información en un solo objeto de respuesta
    const resultado = {
      config,
      doctores,
      consultorios
    };
    
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error al obtener configuración:', error);    return NextResponse.json({ 
      ok: false, 
      message: 'Error al obtener configuración',
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * POST - Guarda la configuración del consultorio
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener el archivo de configuración desde el cuerpo de la petición
    const configData = await request.json();
    
    if (!configData) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Datos de configuración requeridos' 
      }, { status: 400 });
    }
    
    // Guardar la configuración usando el servicio registrarConfig
    const resultado = await registrarConfig(configData, 'completo');
    
    if (resultado) {
      return NextResponse.json({ 
        ok: true, 
        message: 'Configuración guardada correctamente' 
      });
    } else {
      return NextResponse.json({ 
        ok: false, 
        message: 'Error al guardar la configuración' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al guardar configuración',
      error: error.message 
    }, { status: 500 });
  }
}