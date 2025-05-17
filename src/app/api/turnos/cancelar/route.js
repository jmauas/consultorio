import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obtenerConfig, obtenerUrlApp } from '@/lib/services/configService.js';
import { updateTurnoService } from '@/lib/services/turnos/turnosService.js'; 
   
// Ruta para manejar la cancelación de turnos mediante token
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
        consultorio: true
      }
    });
    
    if (!turno) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Token no válido o turno no encontrado' 
      }, { status: 404 });
    }
    
    // Verificar que el turno no esté ya cancelado
    if (turno.estado === 'cancelado') {
      return NextResponse.json({ 
        ok: false, 
        message: 'Este turno ya ha sido cancelado anteriormente',
        turno
      }, { status: 400 });
    }
    
   const res = await updateTurnoService(turno.id, {
        estado: 'cancelado',
        fhCambioEstado: new Date().toISOString()
      });
    
    if (!res.ok) {
      throw new Error('Error al actualizar el estado del turno');
    }
    
    return NextResponse.json(res, { status: 200 });
    
  } catch (error) {
    console.error('Error al cancelar turno:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al procesar la solicitud',
      error: error.message
    }, { status: 500 });
  }
}

// Ruta para verificar un token antes de proceder con la cancelación
export async function GET(request) {
  try {
    // Obtener el token desde los parámetros de la URL
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
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
        consultorio: true
      }
    });
    
    if (!turno) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Token no válido o turno no encontrado' 
      }, { status: 404 });
    }
    
    // Verificar que el turno no esté ya cancelado
    if (turno.estado === 'cancelado') {
      return NextResponse.json({ 
        ok: true, 
        message: 'Este turno ya ha sido cancelado anteriormente',
        turno,
        yaCancelado: true
      });
    }
    
    // El turno existe y no está cancelado
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