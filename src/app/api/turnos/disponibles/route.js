import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { disponibilidadDeTurnos } from '@/lib/services/turnos/turnosService.js';

// Handle GET request for available appointments
export async function GET(request) {
  try {
    // Check if it's a public request from a whatsapp source or authenticated
    const session = await getServerSession(authOptions);
    const isPublicEndpoint = request.headers.get('x-api-source') === 'whatsapp';
    const url = new URL(request.url);
    
    // Extract query parametersf
    const doctor = url.searchParams.get('doctor');
    const tipo = url.searchParams.get('tipo');
    const minutosTurno = Number(url.searchParams.get('duracion'));
    const asa = url.searchParams.get('asa') === 'si';
    const ccr = url.searchParams.get('ccr') === 'si';
 
    // Check for authorization
    if (!session && !isPublicEndpoint) {
      return NextResponse.json({ 
        ok: false, 
        message: 'No autorizado'
      }, { status: 401 });
    }
    
    // Validate required parameters
    if (!minutosTurno) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Se requiere el parámetro duracion'
      }, { status: 400 });
    }
    
    const res = await disponibilidadDeTurnos(doctor, tipo, minutosTurno, asa, ccr)
    return NextResponse.json(res, { status: 200 });
    
  } catch (error) {
    console.error('Error al obtener turnos disponibles:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al obtener los turnos disponibles', 
      error: error.message
    }, { status: 500 });
  }
}  

