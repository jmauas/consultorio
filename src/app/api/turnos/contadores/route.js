import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fechasParam = searchParams.get('fechas');
    const estado = searchParams.get('estado');

    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session || !session.user || !session.user.perfil) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Validar que se proporcionen fechas
    if (!fechasParam) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro fechas' },
        { status: 400 }
      );
    }
    
    // Separar las fechas en un array
    const fechas = fechasParam.split(',');
    
    // Crear el filtro de estado si está definido
    const filtroEstado = {};
    if (estado) {
      if (estado === 'activo') {
        // Si el estado es "activo", incluir todos los estados excepto "cancelado"
        filtroEstado.NOT = { estado: 'cancelado' };
      } else {
        // De lo contrario, filtrar por el estado específico
        filtroEstado.estado = estado;
      }
    }

    
    // Crear un objeto para almacenar los contadores
    const contadores = {};
    
    // Inicializar todas las fechas solicitadas con contador 0
    fechas.forEach(fecha => {
      contadores[fecha] = 0;
    });

    const where = {}
    // filtro por perfil de usuario
    if (Number(session.user.perfil.id) < 50) {
      const dres = session.user.doctores;
      if (dres && dres.length > 0) {
        where.doctorId = { in: dres.map(d => d.id) };
      } else {
        return NextResponse.json({ 
          ok: false, 
          message: 'No se encontraron doctores asociados al usuario' 
        }, { status: 400 });
      }
    }
    
    // Realizar una consulta para contar los turnos por fecha
    const turnosPorFecha = await Promise.all(
      fechas.map(async (fecha) => {
        // Crear fecha de inicio (00:00:00 del día proporcionado)
        const fechaInicio = new Date(fecha);
        // fechaInicio.setHours(0, 0, 0, 0);
        
        // Crear fecha de fin (00:00:00 del día siguiente)
        const fechaFin = new Date(fecha);
        fechaFin.setDate(fechaFin.getDate() + 1);
        // fechaFin.setHours(0, 0, 0, 0);
        
        // Contar los turnos entre la fecha inicio y fin
        const conteo = await prisma.turno.count({
          where: {
            desde: {
              gte: fechaInicio,
              lt: fechaFin
            },
            ...where,
            ...filtroEstado,
          }
        });
        
        return {
          fecha,
          conteo
        };
      })
    );
    
    // Actualizar el objeto de contadores con los resultados
    turnosPorFecha.forEach(item => {
      contadores[item.fecha] = item.conteo;
    });
    
    // Devolver los contadores
    return NextResponse.json({
      contadores,
      total: Object.values(contadores).reduce((acc, val) => acc + val, 0)
    });
    
  } catch (error) {
    console.error('Error al obtener contadores de turnos:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
} 