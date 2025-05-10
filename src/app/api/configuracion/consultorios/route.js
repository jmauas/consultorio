import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const consultorios = await prisma.consultorio.findMany({
      orderBy: {
        nombre: 'asc'
      }
    });
    
    return NextResponse.json({ 
      ok: true, 
      consultorios 
    });
  } catch (error) {
    console.error('Error al obtener consultorios:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al obtener los consultorios' }, 
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.nombre) {
      return NextResponse.json(
        { ok: false, error: 'El nombre es un campo requerido' }, 
        { status: 400 }
      );
    }
    
    // Crear el consultorio con los datos básicos
    const nuevoConsultorio = await prisma.consultorio.create({
      data: {
        nombre: data.nombre,
        direccion: data.direccion || '',
        telefono: data.telefono || '',
        email: data.email || '',
        color: data.color || '#CCCCCC'
      }
    });
    
    return NextResponse.json({ 
      ok: true, 
      consultorio: nuevoConsultorio 
    });
  } catch (error) {
    console.error('Error al crear consultorio:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al crear el consultorio' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'ID del consultorio es requerido' }, 
        { status: 400 }
      );
    }
    
    // Verificar si hay agendas asociadas con este consultorio
    const agendasRelacionadas = await prisma.agendaDoctor.findMany({
      where: {
        consultorioId: id
      }
    });
    
    // Si hay agendas relacionadas, eliminar primero las relaciones
    if (agendasRelacionadas.length > 0) {
      // Actualizar las agendas para eliminar la referencia al consultorio
      await prisma.agendaDoctor.updateMany({
        where: {
          consultorioId: id
        },
        data: {
          consultorioId: null
        }
      });
    }
    
    // Verificar si hay turnos asociados con este consultorio
    const turnosRelacionados = await prisma.turno.findMany({
      where: {
        consultorioId: id
      }
    });
    
    // Si hay turnos relacionados, no permitir la eliminación
    if (turnosRelacionados.length > 0) {
      return NextResponse.json(
        { ok: false, error: 'No se puede eliminar el consultorio porque tiene turnos asociados' }, 
        { status: 400 }
      );
    }
    
    // Eliminar el consultorio
    await prisma.consultorio.delete({
      where: {
        id
      }
    });
    
    return NextResponse.json({ 
      ok: true, 
      mensaje: 'Consultorio eliminado correctamente' 
    });
  } catch (error) {
    console.error('Error al eliminar consultorio:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al eliminar el consultorio' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.id) {
      return NextResponse.json(
        { ok: false, error: 'El ID del consultorio es requerido' }, 
        { status: 400 }
      );
    }
    
    if (!data.nombre) {
      return NextResponse.json(
        { ok: false, error: 'El nombre es un campo requerido' }, 
        { status: 400 }
      );
    }
    
    // Actualizar el consultorio
    const consultorioActualizado = await prisma.consultorio.update({
      where: {
        id: data.id
      },
      data: {
        nombre: data.nombre,
        direccion: data.direccion || '',
        telefono: data.telefono || '',
        email: data.email || '',
        color: data.color || '#CCCCCC'
      }
    });
    
    return NextResponse.json({ 
      ok: true, 
      consultorio: consultorioActualizado 
    });
  } catch (error) {
    console.error('Error al actualizar consultorio:', error);
    
    // Si el error es porque no existe el ID
    if (error.code === 'P2025') {
      return NextResponse.json(
        { ok: false, error: 'Consultorio no encontrado' }, 
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { ok: false, error: 'Error al actualizar el consultorio' }, 
      { status: 500 }
    );
  }
}