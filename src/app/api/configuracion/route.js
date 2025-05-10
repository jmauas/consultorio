import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { obtenerConfig, obtenerDoctores, obtenerConsultorios } from '@/lib/services/configService.js';

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
    console.error('Error al obtener configuración:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al obtener configuración',
      error: error.message 
    }, { status: 500 });
  }
}