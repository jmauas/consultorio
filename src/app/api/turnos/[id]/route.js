import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Esta función permite obtener un turno específico por ID
export async function GET(request, { params }) {
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
    
    // Obtener el ID del usuario si existe sesión
    const userId = session?.user?.id || null;
    
    // Verificar autenticación excepto para endpoints públicos
    if (!session && !isPublicEndpoint) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    params = await params;
    const { id } = params;
    const datos = await request.json();
    
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

    if (datos && datos.estado === 'cancelado' && turnoExistente.estado !== 'cancelado') {
      const fhTurno = new Date(turnoExistente.desde);
      const ahora = new Date();
      const diffInMs = fhTurno - ahora;
      console.log(new Date().toLocaleString()+'  -  '+'Diferencia en ms:', diffInMs)
      const diffInHours = diffInMs / 1000 / 60 / 60;
      console.log(new Date().toLocaleString()+'  -  '+'Diferencia en horas:', diffInHours)
      datos.hsAviso = diffInHours.toString();
      datos.fhCambioEstado = new Date().toISOString();
      if (diffInHours <= 0) {
          datos.penal = 'asa';
      } else if (diffInHours < 48) {
          datos.penal = 'ccr';
      }
    }    
    
    // Agregar el ID del usuario que actualiza el registro
    datos.updatedById = userId;
    
    // Actualizar el turno
    const turnoActualizado = await prisma.turno.update({
      where: { id },
      data: datos,
      include: {
        paciente: true,
        doctor: true,
        consultorio: true,
        coberturaMedica: true,
        tipoDeTurno: true // Incluir el tipo de turno en la respuesta
      }
    });
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Turno actualizado correctamente',
      turno: turnoActualizado
    });
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