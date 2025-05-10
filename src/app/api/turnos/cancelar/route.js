import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obtenerConfig } from '@/lib/services/configService.js';

const config = await obtenerConfig();
    

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
    
    // Hacer una llamada a la API de turnos para actualizar el estado
    const actualizacionResponse = await fetch(`${config.urlApp || 'http://localhost:3000'}/api/turnos/${turno.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-source': 'cancelacion-token'
      },
      body: JSON.stringify({
        estado: 'cancelado',
        fhCambioEstado: new Date().toISOString()
      })
    });
    
    if (!actualizacionResponse.ok) {
      throw new Error('Error al actualizar el estado del turno');
    }
    
    const resultado = await actualizacionResponse.json();
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Turno cancelado exitosamente',
      turno: resultado.turno
    });
    
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