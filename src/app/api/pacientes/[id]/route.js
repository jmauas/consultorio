import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET: Obtener un paciente específico por ID
export async function GET(request, { params }) {
  try {
    params = await params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Se requiere un ID de paciente' },
        { status: 400 }
      );
    }

    // Buscar paciente por ID
    const pacienteDB = await prisma.paciente.findUnique({
      where: {
        id: id
      },
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
        },
        turnos: {
          include: {
            doctor: true,
            consultorio: true,
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
            },
          },
          orderBy: {
            desde: 'asc'
          }
        }
      }
    });

    if (!pacienteDB) {
      return NextResponse.json(
        { ok: false, error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }
    // Buscar turnos en un rango de 90 días antes y después
    const fh1 = new Date();
    fh1.setDate(fh1.getDate() - 90);
    const fh2 = new Date();
    fh2.setDate(fh2.getDate() + 90);
    
    // Obtener turnos del paciente
    const turnos = await prisma.turno.findMany({
      where: {
        pacienteId: id,
        desde: { gte: fh1, lte: fh2 }
      },
    });

    // Contar turnos con penalidades
    const asa = turnos.filter(turno => turno.penal=='asa').length > 0;
    const ccr = turnos.filter(turno => turno.penal=='ccr').length > 0;

    // Crear objeto de paciente con formato esperado por el frontend
    const paciente = {
      ...pacienteDB,
      asa, 
      ccr
    };

    return NextResponse.json({
      ok: true,
      pacientes: [paciente] // Se mantiene como array para compatibilidad con frontend existente
    });
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al obtener el paciente: ' + error.message },
      { status: 500 }
    );
  }
}

// PUT: Actualizar un paciente específico por ID
export async function PUT(request, { params }) {
  try {
    params = await params;
    const { id } = params;
    const data = await request.json();

    // Obtener sesión para identificar al usuario
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Se requiere un ID de paciente' },
        { status: 400 }
      );
    }

    // Verificar si el paciente existe
    const pacienteExistente = await prisma.paciente.findUnique({
      where: { id: id }
    });

    if (!pacienteExistente) {
      return NextResponse.json(
        { ok: false, error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    if (data.celular && data.celular.length > 4) {
      if (data.celular.substring(0, 3) != '549') data.celular = '549' + data.celular;
    }

    // Verificar si otro paciente ya tiene ese número de teléfono o DNI
    if (data.celular && data.celular !== pacienteExistente.celular) {
      const pacienteConCelular = await prisma.paciente.findFirst({
        where: {
          celular: data.celular,
          id: { not: id }
        }
      });

      if (pacienteConCelular) {
        return NextResponse.json(
          { ok: false, error: 'Ya existe otro paciente con ese número de teléfono' },
          { status: 400 }
        );
      }
    }

    if (data.dni && data.dni !== pacienteExistente.dni) {
      // Limpiar DNI si existe
      data.dni = data.dni.replaceAll('.', '').replaceAll('-', '').replaceAll(' ', '');
      
      const pacienteConDNI = await prisma.paciente.findFirst({
        where: {
          dni: data.dni,
          id: { not: id }
        }
      });

      if (pacienteConDNI) {
        return NextResponse.json(
          { ok: false, error: 'Ya existe otro paciente con ese DNI' },
          { status: 400 }
        );
      }
    }

    // Actualizar paciente
    const pacienteActualizado = await prisma.paciente.update({
      where: { id: id },
      data: {
        nombre: data.nombre || pacienteExistente.nombre,
        apellido: data.apellido || null,
        dni: data.dni || null,
        celular: data.celular || pacienteExistente.celular,
        email: data.email || null,
        cobertura: data.cobertura ? data.cobertura.toLowerCase() : '',
        observaciones: data.observaciones || null,
        updatedAt: new Date(),
        coberturaMedicaId: data.coberturaMedicaId || null,
        updatedById: userId // Registramos el usuario que actualiza
      }
    });

    return NextResponse.json({
      ok: true,
      pacientes: pacienteActualizado
    });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al actualizar el paciente: ' + error.message },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un paciente específico por ID
export async function DELETE(request, { params }) {
  try {
    params = await params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Se requiere un ID de paciente' },
        { status: 400 }
      );
    }

    // Verificar si el paciente existe
    const pacienteExistente = await prisma.paciente.findUnique({
      where: { id: id }
    });

    if (!pacienteExistente) {
      return NextResponse.json(
        { ok: false, error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el paciente tiene turnos asociados
    const turnos = await prisma.turno.findMany({
      where: { pacienteId: id }
    });

    if (turnos.length > 0) {
      // Verificar si hay turnos futuros
      const turnosFuturos = turnos.filter(t => new Date(t.desde) > new Date());
      
      if (turnosFuturos.length > 0) {
        return NextResponse.json(
          { ok: false, error: 'No se puede eliminar el paciente porque tiene turnos futuros programados' },
          { status: 400 }
        );
      }
    }

    // Eliminar paciente y sus turnos asociados (gracias a la configuración onDelete: Cascade)
    await prisma.paciente.delete({
      where: { id: id }
    });

    return NextResponse.json({
      ok: true,
      mensaje: 'Paciente eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al eliminar el paciente: ' + error.message },
      { status: 500 }
    );
  }
}