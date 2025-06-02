import { NextResponse } from 'next/server';
import { getTurnoById } from '@/lib/services/turnos/turnosService.js';

/**
 * GET - Obtiene un turno específico por ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ 
        ok: false, 
        message: 'ID del turno requerido' 
      }, { status: 400 });
    }

    const turno = await getTurnoById(id);
    
    if (!turno) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Turno no encontrado' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      ok: true, 
      turno: turno 
    });
  } catch (error) {
    console.error('Error al obtener turno:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error interno del servidor',
      error: error.message 
    }, { status: 500 });
  }
}
