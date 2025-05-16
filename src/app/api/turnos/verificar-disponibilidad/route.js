import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { disponibilidadTurnosEnFecha } from '@/lib/services/turnos/turnosService.js';

/**
 * Verifica si existe algún conflicto en el horario especificado
 * GET - /api/turnos/verificar-disponibilidad?desde=FECHA_INICIO&hasta=FECHA_FIN
 */
export async function GET(request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    const isPublicEndpoint = request.headers.get('x-api-source') === 'whatsapp';
    
    if (!session && !isPublicEndpoint) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener parámetros de fecha desde la URL
    const { searchParams } = new URL(request.url);
    const desdeStr = searchParams.get('desde');
    const hastaStr = searchParams.get('hasta');
    const consultorioId = searchParams.get('consultorioId');
    const doctorId = searchParams.get('doctorId');
    
    if (!desdeStr || !hastaStr) {
      return NextResponse.json({
        disponible: false,
        mensaje: 'Faltan parámetros de fecha (desde y hasta)'
      }, { status: 400 });
    }
    
    const desde = new Date(desdeStr);
    const hasta = new Date(hastaStr);
    
    // Buscar turnos que se solapan con el rango especificado
    // Usamos la siguiente lógica: (turno.desde < hasta) && (turno.hasta > desde)
    const turnosConflicto = await prisma.turno.findFirst({
      where: {
        // Excluimos los turnos cancelados
        estado: {
          not: 'cancelado'
        },
        // Verificamos solapamiento de tiempo:
        AND: [
          { desde: { lt: hasta } },
          { hasta: { gt: desde } }
        ],
        // Verificamos el consultorio
        consultorioId: consultorioId,
      },
      include: {
        paciente: true,
        doctor: true
      }
    });
    
    // Si no hay conflictos, el horario está disponible
    if (!turnosConflicto) {
      return NextResponse.json({
        disponible: true,
        mensaje: 'Horario disponible'
      });
    }

    // si hay conflicto busco los turnos disponibles lo mas cercano posible
    const disponibles = await disponibilidadTurnosEnFecha(desde, hasta, doctorId, consultorioId)

    console.log('disponibles', disponibles)

    // Si encontramos un turno que se solapa, devolver información sobre el conflicto
    return NextResponse.json({
      disponible: false,
      mensaje: 'Horario no disponible, hay un turno existente que se solapa',
      disponibles: disponibles.ok === true  ? disponibles.turnos : [],
      turno: {
        id: turnosConflicto.id,
        desde: turnosConflicto.desde,
        hasta: turnosConflicto.hasta,
        doctor: turnosConflicto.doctor,
        paciente: {
          nombre: turnosConflicto.paciente.nombre,
          apellido: turnosConflicto.paciente.apellido
        }
      }
    });
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    return NextResponse.json({
      disponible: false,
      mensaje: 'Error al verificar disponibilidad: ' + error.message
    }, { status: 500 });
  }
}