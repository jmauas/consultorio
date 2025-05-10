import { NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma';

const prisma = new PrismaClient();

// GET - Obtener una cobertura médica por ID
export async function GET(request, { params }) {
  try {
    params = await params;
    const { id } = params;
    
    const cobertura = await prisma.coberturaMedica.findUnique({
      where: { id }
    });

    if (!cobertura) {
      return NextResponse.json({ ok: false, error: 'Cobertura médica no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, cobertura });
  } catch (error) {
    console.error('Error al obtener cobertura médica:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener la cobertura médica' }, { status: 500 });
  }
}

// PUT - Actualizar una cobertura médica
export async function PUT(request, { params }) {
  try {
    params = await params;
    const { id } = params;
    const { nombre, codigo, habilitado, color } = await request.json();
    
    // Verificar si existe la cobertura
    const existeCobertura = await prisma.coberturaMedica.findUnique({
      where: { id }
    });

    if (!existeCobertura) {
      return NextResponse.json({ ok: false, error: 'Cobertura médica no encontrada' }, { status: 404 });
    }

    // Verificar si ya existe otra cobertura con el mismo nombre o código
    if (nombre || codigo) {
      const existente = await prisma.coberturaMedica.findFirst({
        where: {
          id: { not: id },
          OR: [
            nombre ? { nombre: { equals: nombre, mode: 'insensitive' } } : {},
            codigo ? { codigo: { equals: codigo, mode: 'insensitive' } } : {}
          ]
        }
      });

      if (existente) {
        const campoExistente = existente.nombre.toLowerCase() === nombre?.toLowerCase() ? 'nombre' : 'código';
        return NextResponse.json({ 
          ok: false, 
          error: `Ya existe otra cobertura con ese ${campoExistente}`
        }, { status: 400 });
      }
    }

    // Actualizar la cobertura
    const cobertura = await prisma.coberturaMedica.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(codigo !== undefined && { codigo }),
        ...(habilitado !== undefined && { habilitado }),
        ...(color !== undefined && { color })
      }
    });

    return NextResponse.json({ ok: true, cobertura });
  } catch (error) {
    console.error('Error al actualizar cobertura médica:', error);
    return NextResponse.json({ ok: false, error: 'Error al actualizar la cobertura médica' }, { status: 500 });
  }
}

// DELETE - Eliminar una cobertura médica
export async function DELETE(request, { params }) {
  try {
    params = await params;
    const { id } = params;
    
    // Verificar si existe la cobertura
    const existeCobertura = await prisma.coberturaMedica.findUnique({
      where: { id }
    });

    if (!existeCobertura) {
      return NextResponse.json({ ok: false, error: 'Cobertura médica no encontrada' }, { status: 404 });
    }

    // Eliminar la cobertura
    await prisma.coberturaMedica.delete({
      where: { id }
    });

    return NextResponse.json({ ok: true, mensaje: 'Cobertura médica eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar cobertura médica:', error);
    return NextResponse.json({ ok: false, error: 'Error al eliminar la cobertura médica' }, { status: 500 });
  }
}