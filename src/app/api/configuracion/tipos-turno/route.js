import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Obtener todos los tipos de turno
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const doctorId = searchParams.get('doctorId');
    
    let whereClause = {};
    
    if (id) {
      whereClause.id = id;
    }
    
    if (doctorId) {
      whereClause.doctorId = doctorId;
    }
    
    const tiposTurno = await prisma.tipoTurnoDoctor.findMany({
      where: whereClause,
      include: {
        consultorios: true,
        doctor: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    
    return NextResponse.json({
      ok: true,
      tiposTurno
    });
  } catch (error) {
    console.error('Error al obtener tipos de turno:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al obtener los tipos de turno' },
      { status: 500 }
    );
  }
}

// POST: Crear un nuevo tipo de turno
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
    
    if (!data.duracion) {
      return NextResponse.json(
        { ok: false, error: 'La duración es un campo requerido' }, 
        { status: 400 }
      );
    }
    
    if (!data.doctorId) {
      return NextResponse.json(
        { ok: false, error: 'El ID del doctor es un campo requerido' }, 
        { status: 400 }
      );
    }
    
    if (!data.consultorioIds || !Array.isArray(data.consultorioIds) || data.consultorioIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Debe seleccionar al menos un consultorio' }, 
        { status: 400 }
      );
    }
    
    // Filtrar los consultorioIds para eliminar cualquier valor nulo o indefinido
    const consultorioIdsValidos = data.consultorioIds.filter(id => id !== null && id !== undefined);
    
    if (consultorioIdsValidos.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Debe seleccionar al menos un consultorio válido' }, 
        { status: 400 }
      );
    }
    
    // Crear el tipo de turno
    const nuevoTipoTurno = await prisma.tipoTurnoDoctor.create({
      data: {
        nombre: data.nombre,
        duracion: data.duracion,
        habilitado: data.habilitado !== false,
        doctorId: data.doctorId,
        consultorios: {
          connect: consultorioIdsValidos.map(id => ({ id }))
        }
      },
    });
    
    // Obtener el tipo de turno creado con sus relaciones
    const tipoTurnoCompleto = await prisma.tipoTurnoDoctor.findUnique({
      where: { id: nuevoTipoTurno.id },
      include: {
        consultorios: true,
        doctor: true
      }
    });
    
    return NextResponse.json({ 
      ok: true, 
      tipoTurno: tipoTurnoCompleto
    });
  } catch (error) {
    console.error('Error al crear tipo de turno:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al crear el tipo de turno: ' + error.message }, 
      { status: 500 }
    );
  }
}

// PUT: Actualizar un tipo de turno existente
export async function PUT(request) {
  try {
    const data = await request.json();
    
    // Validar que existe el ID del tipo de turno
    if (!data.id) {
      return NextResponse.json(
        { ok: false, error: 'El ID del tipo de turno es requerido para actualizar' }, 
        { status: 400 }
      );
    }
    
    // Validar datos requeridos
    if (!data.nombre) {
      return NextResponse.json(
        { ok: false, error: 'El nombre es un campo requerido' }, 
        { status: 400 }
      );
    }
    
    if (!data.duracion) {
      return NextResponse.json(
        { ok: false, error: 'La duración es un campo requerido' }, 
        { status: 400 }
      );
    }
    
    if (!data.consultorioIds || !Array.isArray(data.consultorioIds) || data.consultorioIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Debe seleccionar al menos un consultorio' }, 
        { status: 400 }
      );
    }
    
    // Filtrar los consultorioIds para eliminar cualquier valor nulo o indefinido
    const consultorioIdsValidos = data.consultorioIds.filter(id => id !== null && id !== undefined);
    
    if (consultorioIdsValidos.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Debe seleccionar al menos un consultorio válido' }, 
        { status: 400 }
      );
    }
    
    // Primero obtenemos los consultorios actuales para desconectarlos
    const tipoTurnoActual = await prisma.tipoTurnoDoctor.findUnique({
      where: {
        id: data.id
      },
      include: {
        consultorios: true
      }
    });

    if (!tipoTurnoActual) {
      return NextResponse.json(
        { ok: false, error: 'El tipo de turno no existe' }, 
        { status: 404 }
      );
    }

    // Actualizar el tipo de turno
    // En Prisma, para actualizar una relación many-to-many necesitamos desconectar los consultorios existentes
    // y luego conectar los nuevos
    const tipoTurnoActualizado = await prisma.tipoTurnoDoctor.update({
      where: {
        id: data.id
      },
      data: {
        nombre: data.nombre,
        duracion: data.duracion,
        habilitado: data.habilitado !== false,
        consultorios: {
          // Desconectar todos los consultorios actuales
          disconnect: tipoTurnoActual.consultorios.map(c => ({ id: c.id })),
          // Conectar los nuevos consultorios seleccionados usando solo IDs válidos
          connect: consultorioIdsValidos.map(id => ({ id }))
        }
      },
      include: {
        consultorios: true,
        doctor: true
      }
    });
    
    return NextResponse.json({ 
      ok: true, 
      tipoTurno: tipoTurnoActualizado
    });
  } catch (error) {
    console.error('Error al actualizar tipo de turno:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al actualizar el tipo de turno: ' + error.message }, 
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un tipo de turno
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'El ID del tipo de turno es requerido para eliminar' }, 
        { status: 400 }
      );
    }
    
    const tipoTurnoActual = await prisma.tipoTurnoDoctor.findUnique({
      where: {
        id
      },
      include: {
        consultorios: true
      }
    });

    if (!tipoTurnoActual) {
      return NextResponse.json(
        { ok: false, error: 'El tipo de turno no existe' }, 
        { status: 404 }
      );
    }
    
    // En Prisma, necesitamos desconectar las relaciones antes de eliminar el registro
    // para mantener la integridad referencial
    await prisma.tipoTurnoDoctor.update({
      where: {
        id
      },
      data: {
        consultorios: {
          disconnect: tipoTurnoActual.consultorios.map(c => ({ id: c.id }))
        }
      }
    });
    
    // Una vez desconectadas las relaciones, eliminamos el tipo de turno
    await prisma.tipoTurnoDoctor.delete({
      where: {
        id
      }
    });
    
    return NextResponse.json({ 
      ok: true, 
      mensaje: 'Tipo de turno eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar tipo de turno:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al eliminar el tipo de turno: ' + error.message }, 
      { status: 500 }
    );
  }
}