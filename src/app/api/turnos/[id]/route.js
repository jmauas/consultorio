import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { updateTurnoService } from '@/lib/services/turnos/turnosService.js';  

// Esta función permite obtener un turno específico por ID
export async function GET(request, { params }) {
  try {
   
    const isPublicEndpoint = request.headers.get('x-api-source') === 'whatsapp' || 
                             request.headers.get('x-api-source') === 'cancelacion-token';
    const session = await getServerSession(authOptions);
    // Verificar autenticación excepto para endpoints públicos
    if (!session && !isPublicEndpoint) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    params = await params;
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ 
        ok: false, 
        message: 'ID del turno no proporcionado' 
      }, { status: 400 });
    }
    
    // Buscar el turno en la base de datos
    const turno = await prisma.turno.findUnique({
      where: { id },
      include: {
        paciente: {
          include: {
            coberturaMedica: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            updatedBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        doctor: true,
        consultorio: true,
        coberturaMedica: true,
        tipoDeTurno: true, // Incluir el tipo de turno
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!turno) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Turno no encontrado' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      ok: true, 
      turno 
    });
  } catch (error) {
    console.error('Error al obtener turno:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al procesar la solicitud',
      error: error.message
    }, { status: 500 });
  }
}

// Esta función permite actualizar un turno específico por ID
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    const isPublicEndpoint = request.headers.get('x-api-source') === 'whatsapp' || 
                             request.headers.get('x-api-source') === 'cancelacion-token';
    
    // Verificar autenticación excepto para endpoints públicos
    if (!session && !isPublicEndpoint) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    params = await params;
    const { id } = params;
    const datos = await request.json();

    const res = await updateTurnoService(id, datos);    
    
    return NextResponse.json(res);
  } catch (error) {
    console.error('Error al actualizar turno:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al procesar la solicitud',
      error: error.message
    }, { status: 500 });
  }
}

// Esta función permite eliminar un turno específico por ID
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    // Para eliminar, siempre requerimos autenticación
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
     params = await params;
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ 
        ok: false, 
        message: 'ID del turno no proporcionado' 
      }, { status: 400 });
    }
    
    // Verificar si el turno existe
    const turnoExistente = await prisma.turno.findUnique({
      where: { id }
    });
    
    if (!turnoExistente) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Turno no encontrado' 
      }, { status: 404 });
    }
    
    // Eliminar el turno (opcional: podrías preferir marcar como cancelado en lugar de eliminar)
    await prisma.turno.delete({
      where: { id }
    });
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Turno eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar turno:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al procesar la solicitud',
      error: error.message
    }, { status: 500 });
  }
}