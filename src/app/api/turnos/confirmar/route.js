import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obtenerConfig, obtenerUrlApp } from '@/lib/services/configService.js';
import { updateTurnoService } from '@/lib/services/turnos/turnosService.js'; 
   
// Ruta para manejar la confirmación de turnos mediante token
export async function POST(request) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Token no proporcionado' 
      }, { status: 400 });
    }
    
    // Buscar el turno utilizando el token
    const turno = await prisma.turno.findUnique({
      where: { token },
      include: {
        paciente: true,
        doctor: true,
        consultorio: true,
        tipoDeTurno: true
      }
    });
    
    if (!turno) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Token no válido o turno no encontrado' 
      }, { status: 404 });
    }
      // Verificar que el turno no esté ya confirmado
    if (turno.estado === 'confirmado') {
      return NextResponse.json({ 
        ok: false, 
        message: 'Este turno ya ha sido confirmado anteriormente',
        turno
      }, { status: 400 });
    }
    
    // Verificar que el turno no esté cancelado
    if (turno.estado === 'cancelado') {
      return NextResponse.json({ 
        ok: false, 
        message: 'No se puede confirmar un turno que ha sido cancelado'
      }, { status: 400 });
    }
    
    // Verificar que el turno esté en un estado que permita confirmación
    const estadosPermitidos = ['sin confirmar', 'pendiente', null, undefined, ''];
    if (!estadosPermitidos.includes(turno.estado)) {
      return NextResponse.json({ 
        ok: false, 
        message: `No se puede confirmar este turno. Estado actual: ${turno.estado || 'indefinido'}`
      }, { status: 400 });
    }
    
    const res = await updateTurnoService(turno.id, {
        estado: 'confirmado',
        fhCambioEstado: new Date().toISOString()
      });
    
    if (!res.ok) {
      throw new Error('Error al actualizar el estado del turno');
    }

    console.log('Turno confirmado exitosamente:', res);
    
    return NextResponse.json(res, { status: 200 });
    
  } catch (error) {
    console.error('Error al confirmar turno:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al procesar la solicitud',
      error: error.message
    }, { status: 500 });
  }
}

// Ruta para verificar un token antes de proceder con la confirmación
export async function GET(request) {
  try {
    // Obtener el token desde los parámetros de la URL
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    console.log('Token recibido:', token);
    if (!token) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Token no proporcionado' 
      }, { status: 400 });
    }
    
    // Buscar el turno utilizando el token
    const turno = await prisma.turno.findUnique({
      where: { token },
      include: {
        paciente: true,
        doctor: true,
        consultorio: true,
        tipoDeTurno: true
      }
    });
    
    if (!turno) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Token no válido o turno no encontrado' 
      }, { status: 404 });
    }
    
    // Verificar que el turno no esté ya confirmado
    if (turno.estado === 'confirmado') {
      return NextResponse.json({ 
        ok: true, 
        message: 'Este turno ya ha sido confirmado anteriormente',
        turno,
        yaConfirmado: true
      });
    }
      // Verificar que el turno no esté cancelado
    if (turno.estado === 'cancelado') {
      return NextResponse.json({ 
        ok: false, 
        message: 'No se puede confirmar un turno que ha sido cancelado',
        turno
      }, { status: 400 });
    }
    
    // Verificar que el turno esté en un estado que permita confirmación
    const estadosPermitidos = ['sin confirmar', 'pendiente', null, undefined, ''];
    if (!estadosPermitidos.includes(turno.estado)) {
      return NextResponse.json({ 
        ok: false, 
        message: `No se puede confirmar este turno. Estado actual: ${turno.estado || 'indefinido'}`,
        turno
      }, { status: 400 });
    }
    
    // El turno existe y puede ser confirmado
    return NextResponse.json({ 
      ok: true, 
      message: 'Token válido',
      turno
    });
    
  } catch (error) {
    console.error('Error al verificar token:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al procesar la solicitud',
      error: error.message
    }, { status: 500 });
  }
}
