import { NextResponse } from 'next/server';
import { obtenerConfig } from '@/lib/services/configService.js';
import { savePaciente, getPaciente } from '@/lib/services/pacientes/pacientesService';
import { prisma } from '@/lib/prisma';

/**
 * Endpoint para solicitar un turno desde WhatsApp
 */
export async function POST(request) {
  try {
    // Verificar que la petición venga de WhatsApp mediante un token
    const authorization = request.headers.get('authorization');
    const config = await obtenerConfig();
    
    if (!authorization || authorization !== `Bearer ${process.env.WHATSAPP_API_TOKEN}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Extraer datos de la solicitud
    const datos = await request.json();
    const { celular, mensaje, fecha, dni, nombre, apellido, email, servicio } = datos;
    
    // Si no se proporciona el número de celular, devolver error
    if (!celular) {
      return NextResponse.json({ 
        error: 'Número de celular no proporcionado' 
      }, { status: 400 });
    }
    
    // Si es una consulta de turnos existentes
    if (mensaje && mensaje.toLowerCase().includes('consultar turnos')) {
      const resultado = await consultarTurnosPorCelular(celular);
      return NextResponse.json(resultado);
    }
    
    // Si no hay fecha, interpretar como solicitud de información de turnos disponibles
    if (!fecha) {
      const turnos = await obtenerTurnosDisponibles();
      return NextResponse.json({
        ok: true,
        mensaje: 'Turnos disponibles',
        turnos
      });
    }
    
    // Si falta información del paciente, intentar obtenerla de la base de datos
    let pacienteData = { celular, dni, nombre, apellido, email };
    if (!dni || !nombre) {
      const pacienteExistente = await getPaciente('celular', celular);
      if (pacienteExistente.ok && pacienteExistente.paciente.length > 0) {
        pacienteData = { ...pacienteExistente.paciente[0], ...pacienteData };
      } else {
        return NextResponse.json({ 
          ok: false, 
          mensaje: 'Se requiere información del paciente (dni, nombre)' 
        }, { status: 400 });
      }
    }
    
    // Crear el turno
    const fechaInicio = new Date(fecha);
    const duracion = await obtenerDuracionServicio(servicio);
    const fechaFin = new Date(fechaInicio);
    fechaFin.setMinutes(fechaFin.getMinutes() + duracion);
    
    // Verificar disponibilidad
    const disponibilidad = await verificarDisponibilidad(fechaInicio, fechaFin);
    if (!disponibilidad.disponible) {
      return NextResponse.json({ 
        ok: false, 
        mensaje: 'El horario seleccionado no está disponible',
        alternativas: disponibilidad.alternativas
      });
    }
    
    // Obtener doctor disponible
    const doctor = await obtenerDoctorDisponible();
    
    // Buscar o crear paciente en la base de datos
    let paciente = null;
    if (pacienteData.dni || pacienteData.celular) {
      paciente = await prisma.paciente.findFirst({
        where: {
          OR: [
            { dni: pacienteData.dni },
            { celular: pacienteData.celular }
          ]
        }
      });
    }
    
    if (!paciente) {
      paciente = await prisma.paciente.create({
        data: {
          nombre: pacienteData.nombre,
          apellido: pacienteData.apellido || '',
          dni: pacienteData.dni || '',
          celular: pacienteData.celular,
          email: pacienteData.email || '',
          cobertura: pacienteData.cobertura || '',
          observaciones: ''
        }
      });
    }
    
    // Buscar o crear un consultorio (por defecto usamos el primero)
    let consultorio = await prisma.consultorio.findFirst();
    
    if (!consultorio) {
      // Si no hay consultorios, crear uno por defecto
      consultorio = await prisma.consultorio.create({
        data: {
          nombre: 'Consultorio Principal',
          direccion: config.domicilio || 'Dirección desconocida',
          telefono: config.telefono || '',
          email: config.mail || ''
        }
      });
    }
    
    // Buscar en la base de datos
    const tipoTurno = await prisma.tipoTurnoDoctor.findFirst({
      where: {
        nombre: { contains: servicio, mode: 'insensitive' },
        habilitado: true
      }
    });
    
    // Crear el turno en la base de datos
    const turnoCreado = await prisma.turno.create({
      data: {
        desde: fechaInicio,
        hasta: fechaFin,
        doctorId: doctor.id,
        consultorioId: consultorio.id,
        servicio: servicio || 'Consulta',
        duracion: duracion,
        pacienteId: paciente.id,
        confirmado: true,
        estado: 'confirmado',
        createdById: null, // API de WhatsApp, no hay usuario autenticado
        updatedById: null,  // API de WhatsApp, no hay usuario autenticado
        tipoDeTurnoId: tipoTurno ? tipoTurno.id : null // Vinculación con el tipo de turno
      },
      include: {
        paciente: true,
        doctor: true,
        consultorio: true,
        tipoDeTurno: true // Incluir tipo de turno en la respuesta
      }
    });
    
    // Formatear la respuesta
    const turnoResponse = {
      id: turnoCreado.id,
      desde: turnoCreado.desde.toISOString(),
      hasta: turnoCreado.hasta.toISOString(),
      doctor: turnoCreado.doctor.nombre,
      emoji: turnoCreado.doctor.emoji,
      servicio: turnoCreado.servicio,
      duracion: turnoCreado.duracion,
      nombre: turnoCreado.paciente.nombre,
      apellido: turnoCreado.paciente.apellido,
      dni: turnoCreado.paciente.dni,
      celular: turnoCreado.paciente.celular,
      email: turnoCreado.paciente.email,
      cobertura: turnoCreado.paciente.cobertura
    };
    
    // Responder con confirmación
    return NextResponse.json({
      ok: true,
      mensaje: 'Turno confirmado',
      turno: turnoResponse
    });
    
  } catch (error) {
    console.error('Error al procesar solicitud de WhatsApp:', error);
    return NextResponse.json({ 
      ok: false, 
      mensaje: 'Error al procesar la solicitud',
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * Obtiene los turnos de un paciente por su número de celular
 * @param {string} celular - Número de celular
 * @returns {Object} - Resultado de la consulta
 */
async function consultarTurnosPorCelular(celular) {
  try {
    // Obtener fecha actual
    const fechaActual = new Date();
    
    // Buscar paciente por celular
    const paciente = await prisma.paciente.findFirst({
      where: { celular }
    });
    
    if (!paciente) {
      return {
        ok: true,
        mensaje: 'No se encontró un paciente con ese número de celular',
        turnos: []
      };
    }
    
    // Consultar turnos del paciente
    const turnos = await prisma.turno.findMany({
      where: {
        pacienteId: paciente.id,
        desde: { gte: fechaActual },
        estado: { not: 'cancelado' }
      },
      include: {
        doctor: true,
        consultorio: true
      },
      orderBy: {
        desde: 'asc'
      }
    });
    
    if (!turnos || turnos.length === 0) {
      return {
        ok: true,
        mensaje: 'No tienes turnos programados',
        turnos: []
      };
    }
    
    // Formatear turnos para mantener compatibilidad
    const turnosFormateados = turnos.map(turno => ({
      id: turno.id,
      summary: `${turno.doctor.emoji} TURNO ${paciente.nombre} ${paciente.apellido || ''}`,
      start: {
        dateTime: turno.desde.toISOString()
      },
      end: {
        dateTime: turno.hasta.toISOString()
      },
      extendedProperties: {
        private: {
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          dni: paciente.dni,
          celular: paciente.celular,
          email: paciente.email,
          cobertura: paciente.cobertura,
          doctor: turno.doctor.nombre,
          emoji: turno.doctor.emoji,
          servicio: turno.servicio,
          duracion: turno.duracion.toString(),
          estado: turno.estado
        }
      }
    }));
    
    return {
      ok: true,
      mensaje: turnosFormateados.length > 0 
        ? `Tienes ${turnosFormateados.length} turno(s) programado(s)` 
        : 'No tienes turnos activos programados',
      turnos: turnosFormateados
    };
    
  } catch (error) {
    console.error('Error al consultar turnos por celular:', error);
    return {
      ok: false,
      mensaje: 'Error al consultar turnos',
      error: error.message
    };
  }
}

/**
 * Obtiene los turnos disponibles en el sistema
 * @returns {Array} - Lista de turnos disponibles
 */
async function obtenerTurnosDisponibles() {
  try {
    const config = await obtenerConfig();
    const fechaActual = new Date();
    const fechaLimite = new Date(fechaActual);
    fechaLimite.setDate(fechaLimite.getDate() + 15); // Próximos 15 días
    
    // Obtener todos los doctores
    const doctores = await prisma.doctor.findMany({
      include: { agenda: true }
    });
    
    if (doctores.length === 0) {
      return [];
    }
    
    // Consultar turnos existentes
    const turnosExistentes = await prisma.turno.findMany({
      where: {
        desde: { gte: fechaActual },
        hasta: { lte: fechaLimite },
        estado: { not: 'cancelado' }
      }
    });
    
    // Generar horarios disponibles
    const horariosDisponibles = [];
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const duracionTurno = config.duracionTurnoDefault || 30;
    
    // Para cada día en el rango
    for (let d = 0; d < 15; d++) {
      const fecha = new Date(fechaActual);
      fecha.setDate(fecha.getDate() + d);
      
      // Formatear fecha para comparaciones
      const fechaString = fecha.toISOString().split('T')[0];
      const diaSemana = fecha.getDay(); // 0 = domingo, 6 = sábado
      
      // Verificar si es feriado general
      const esFeriado = config.feriados && Array.isArray(config.feriados) && 
                       config.feriados.includes(fechaString);
      
      if (esFeriado) continue;
      
      // Para cada doctor
      for (const doctor of doctores) {
        // Verificar si el doctor trabaja este día
        const agendaDelDia = doctor.agenda.find(h => h.dia === diaSemana && h.atencion);
        
        // Verificar si es feriado personal del doctor
        const esFeriadoPersonal = doctor.feriados && Array.isArray(doctor.feriados) && 
                                 doctor.feriados.includes(fechaString);
        
        if (!agendaDelDia || esFeriadoPersonal) continue;
        
        // Obtener horarios de inicio y fin
        const horarioInicio = agendaDelDia.desde.split(':');
        const horarioFin = agendaDelDia.hasta.split(':');
        
        let horaInicio = Number(horarioInicio[0]);
        let minInicio = Number(horarioInicio[1]);
        const horaFin = Number(horarioFin[0]);
        const minFin = Number(horarioFin[1]);
        
        // Generar slots de tiempo
        for (let h = horaInicio; h <= horaFin; h++) {
          for (let m = (h === horaInicio ? minInicio : 0); m < (h === horaFin ? minFin : 60); m += duracionTurno) {
            const horario = new Date(fecha);
            horario.setHours(h, m, 0, 0);
            
            // Si el horario ya pasó, omitirlo
            if (horario <= fechaActual) continue;
            
            // Verificar si hay corte de horario (ej. almuerzo)
            let enHorarioCorte = false;
            if (agendaDelDia.corteDesde && agendaDelDia.corteHasta) {
              const corteDesde = agendaDelDia.corteDesde.split(':');
              const corteHasta = agendaDelDia.corteHasta.split(':');
              
              const inicioCorte = new Date(fecha);
              inicioCorte.setHours(Number(corteDesde[0]), Number(corteDesde[1]), 0, 0);
              
              const finCorte = new Date(fecha);
              finCorte.setHours(Number(corteHasta[0]), Number(corteHasta[1]), 0, 0);
              
              if (horario >= inicioCorte && horario < finCorte) {
                enHorarioCorte = true;
              }
            }
            
            if (enHorarioCorte) continue;
            
            // Verificar si el horario coincide con algún turno existente
            const finSlot = new Date(horario);
            finSlot.setMinutes(finSlot.getMinutes() + duracionTurno);
            
            const estaOcupado = turnosExistentes.some(turno => {
              if (turno.doctorId !== doctor.id) return false;
              
              const inicioTurno = new Date(turno.desde);
              const finTurno = new Date(turno.hasta);
              
              return (
                (horario >= inicioTurno && horario < finTurno) ||
                (finSlot > inicioTurno && finSlot <= finTurno) ||
                (horario <= inicioTurno && finSlot >= finTurno)
              );
            });
            
            if (!estaOcupado) {
              horariosDisponibles.push({
                fecha: horario.toISOString(),
                hora: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
                dia: diasSemana[diaSemana],
                doctor: doctor.nombre,
                doctorId: doctor.id
              });
            }
          }
        }
      }
    }
    
    return horariosDisponibles.slice(0, 20); // Limitar a 20 resultados
    
  } catch (error) {
    console.error('Error al obtener turnos disponibles:', error);
    return [];
  }
}

/**
 * Verifica la disponibilidad para un rango de fechas
 * @param {Date} fechaInicio - Fecha de inicio
 * @param {Date} fechaFin - Fecha de fin
 * @returns {Object} - Resultado de la verificación
 */
async function verificarDisponibilidad(fechaInicio, fechaFin) {
  try {
    // Obtener turnos en el rango
    const turnosExistentes = await prisma.turno.findMany({
      where: {
        OR: [
          // El nuevo turno comienza durante otro turno
          {
            desde: { lte: fechaInicio },
            hasta: { gt: fechaInicio }
          },
          // El nuevo turno termina durante otro turno
          {
            desde: { lt: fechaFin },
            hasta: { gte: fechaFin }
          },
          // El nuevo turno abarca completamente a otro
          {
            desde: { gte: fechaInicio },
            hasta: { lte: fechaFin }
          }
        ],
        estado: { not: 'cancelado' }
      }
    });
    
    // Si hay turnos en el rango, buscar alternativas
    if (turnosExistentes.length > 0) {
      const alternativas = await obtenerTurnosDisponibles();
      return {
        disponible: false,
        alternativas: alternativas.slice(0, 5) // Las primeras 5 alternativas
      };
    }
    
    return {
      disponible: true,
      alternativas: []
    };
    
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    return {
      disponible: false,
      alternativas: [],
      error: error.message
    };
  }
}

/**
 * Obtiene la duración de un servicio
 * @param {string} servicio - Nombre del servicio
 * @returns {number} - Duración en minutos
 */
async function obtenerDuracionServicio(servicio) {
  try {
    if (!servicio) {
      const config = await obtenerConfig();
      return config.duracionTurnoDefault || 30;
    }
    
    // Buscar en la base de datos
    const tipoTurno = await prisma.tipoTurnoDoctor.findFirst({
      where: {
        nombre: { contains: servicio, mode: 'insensitive' },
        habilitado: true
      }
    });
    
    if (tipoTurno) {
      return Number(tipoTurno.duracion);
    }
    
    // Si no se encuentra, usar valor por defecto
    const config = await obtenerConfig();
    return config.duracionTurnoDefault || 30;
    
  } catch (error) {
    console.error('Error al obtener duración de servicio:', error);
    return 30; // Duración por defecto
  }
}

/**
 * Obtiene un doctor disponible
 * @returns {Object} - Doctor disponible
 */
async function obtenerDoctorDisponible() {
  try {
    // Buscar el primer doctor activo
    const doctor = await prisma.doctor.findFirst();
    
    if (!doctor) {
      return {
        id: 'default',
        nombre: 'Indistinto',
        emoji: '🩺'
      };
    }
    
    return doctor;
    
  } catch (error) {
    console.error('Error al obtener doctor disponible:', error);
    return {
      id: 'default',
      nombre: 'Indistinto',
      emoji: '🩺'
    };
  }
}