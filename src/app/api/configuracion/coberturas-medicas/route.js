"use server"
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';

// GET - Obtener todas las coberturas médicas
export async function GET() {
  try {
    const coberturas = await prisma.coberturaMedica.findMany({
      orderBy: { nombre: 'asc' }
    });
    return NextResponse.json({ ok: true, coberturas });
  } catch (error) {
    console.error('Error al obtener coberturas médicas:', error);
    return NextResponse.json({ ok: false, error: 'Error al obtener coberturas médicas' }, { status: 500 });
  }
}

// POST - Crear una nueva cobertura médica
export async function POST(request) {
  try {
    const { nombre, codigo, habilitado = true, color = '#CCCCCC' } = await request.json();
    
    if (!nombre) {
      return NextResponse.json({ ok: false, error: 'El nombre de la cobertura es obligatorio' }, { status: 400 });
    }

    // Verificar si ya existe una cobertura con ese nombre o código
    const existente = await prisma.coberturaMedica.findFirst({
      where: {
        OR: [
          { nombre: { equals: nombre, mode: 'insensitive' } },
          { codigo: codigo ? { equals: codigo, mode: 'insensitive' } : undefined }
        ]
      }
    });

    if (existente) {
      return NextResponse.json({ 
        ok: false, 
        error: `Ya existe una cobertura con ese ${existente.nombre === nombre ? 'nombre' : 'código'}`
      }, { status: 400 });
    }

    // Crear la cobertura
    const cobertura = await prisma.coberturaMedica.create({
      data: {
        nombre,
        codigo,
        habilitado,
        color
      }
    });

    return NextResponse.json({ ok: true, cobertura });
  } catch (error) {
    console.error('Error al crear cobertura médica:', error);
    return NextResponse.json({ ok: false, error: 'Error al crear la cobertura médica' }, { status: 500 });
  }
}