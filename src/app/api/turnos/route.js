import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { analizarTurnosDisponibles } from '@/lib/services/turnos/turnosService';
import { enviarRecordatorioTurno } from '@/lib/services/sender/whatsappService';
import { enviarMailConfTurno } from "@/lib/services/sender/resendService";
import { generarToken } from '@/lib/utils/tokenUtils';

import { prisma } from '@/lib/prisma';

// Esta función manejará la creación de un nuevo turno
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado (solo para usuarios internos)
    // Para la API pública (desde WhatsApp) no requeriría autenticación
    const isPublicEndpoint = request.headers.get('x-api-source') === 'whatsapp';
    
    if (!session && !isPublicEndpoint) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener los datos del turno del cuerpo de la solicitud
    const datos = await request.json();    
   
    console.log('Datos recibidos para crear turno:', datos);
    // Buscar doctor por nombre
    const doctor = await prisma.doctor.findFirst({
      where: { id: datos.doctorId}
    });
    
    if (!doctor) {
      return NextResponse.json({ 
        ok: false, 
        message: 'No se encontró el doctor especificado' 
      }, { status: 400 });
    }
    
    // Buscar o crear un consultorio
    let consultorio = await prisma.consultorio.findFirst({
      where: { id: datos.consultorioId }
    });
    
    if (!consultorio) {
      // Si no hay consultorios, 
      return NextResponse.json({ 
        ok: false, 
        message: 'No se encontró el consultorio' 
      }, { status: 400 });
    }
    
    // Verificar disponibilidad del horario
    const turnosExistentes = await prisma.turno.findMany({
      where: {
        consultorioId: datos.consultorioId,
        OR: [
          // El turno comienza durante otro turno
          {
            desde: { lte: new Date(datos.desde) },
            hasta: { gt: new Date(datos.desde) }
          },
          // El turno termina durante otro turno
          {
            desde: { lt: new Date(datos.hasta) },
            hasta: { gte: new Date(datos.hasta) }
          },
          // El turno abarca completamente a otro
          {
            desde: { gte: new Date(datos.desde) },
            hasta: { lte: new Date(datos.hasta) }
          }
        ],
        estado: { not: 'cancelado' }
      }
    });
    
    if (turnosExistentes.length > 0 && !datos.confirmado) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Ya hay un turno en ese horario', 
        turno: turnosExistentes[0] 
      });
    }
    
    // Buscar o crear paciente
    let paciente = null;
    if (!datos.pacienteId || datos.pacienteId == '' || datos.pacienteId == 'null') {
      if (datos.dni && datos.dni.length > 6) {
        paciente = await prisma.paciente.findFirst({
          where: {
            dni: datos.dni
           }
        });        
      }
    } else {
      paciente = {id: datos.pacienteId};
    }

    if (datos.celular && datos.celular.length > 4) {
      if (datos.celular.substring(0, 3) != '549') datos.celular = '549' + datos.celular;
    }

    // Obtener el ID del usuario de la sesión si existe
    const userId = session?.user?.id || null;

    if (!paciente) {
      // Buscar la cobertura médica por id si se proporciona
      let coberturaMedicaId = datos.coberturaMedicaId || null;
      
      paciente = await prisma.paciente.create({
        data: {
          nombre: datos.nombre,
          apellido: datos.apellido || '',
          dni: datos.dni || '',
          celular: datos.celular,
          email: datos.email || '',
          cobertura: datos.cobertura || '', // Mantenemos este campo por compatibilidad
          coberturaMedicaId: coberturaMedicaId, // Nuevo campo para la relación
          observaciones: datos.observaciones || '',
          createdById: userId, // Registramos el usuario que crea
          updatedById: userId  // También establecemos el actualizador inicial
        }
      });
    } else {
      // Actualizar datos del paciente si es necesario
      paciente = await prisma.paciente.update({
        where: { id: paciente.id },
        data: {
          nombre: datos.nombre || paciente.nombre,
          apellido: datos.apellido || paciente.apellido,
          dni: datos.dni || paciente.dni,
          celular: datos.celular || paciente.celular,
          email: datos.email || paciente.email,
          cobertura: datos.cobertura || paciente.cobertura, // Mantenemos este campo por compatibilidad
          coberturaMedicaId: datos.coberturaMedicaId || paciente.coberturaMedicaId, // Actualizamos la relación
          observaciones: datos.observaciones || paciente.observaciones,
          updatedById: userId // Registramos el usuario que actualiza
        }
      });
    }
    
    const coberId = datos.coberturaMedicaId || paciente.coberturaMedicaId;
    
    // Crear el turno en la base de datos usando los campos existentes
    const token = generarToken(50);
    const turno = await prisma.turno.create({
      data: {
        desde: new Date(datos.desde),
        hasta: new Date(datos.hasta),
        servicio: datos.servicio,
        duracion: Number(datos.duracion),
        pacienteId: paciente.id,
        confirmado: false,
        estado: 'sin confirmar',
        consultorioId: consultorio.id,
        doctorId: doctor.id,
        coberturaMedicaId: coberId,
        observaciones: datos.observaciones || '',
        token: token, // Guardar el token generado
        createdById: userId, // Registramos el usuario que crea
        updatedById: userId,  // También establecemos el actualizador inicial
        tipoDeTurnoId: datos.tipoDeTurnoId || null // Nuevo campo para el tipo de turno
      },
      include: {
        paciente: true,
        doctor: true,
        consultorio: true,
        coberturaMedica: true, // Incluir la cobertura médica en la respuesta
        tipoDeTurno: true // Incluir el tipo de turno en la respuesta
      }
    });
    
    // Enviar confirmación por WhatsApp si hay número de celular
    if (paciente.celular && paciente.celular.length >= 10) {
      enviarRecordatorioTurno(turno);
    }

    // Enviar confirmación por email si hay dirección de email
    enviarMailConfTurno(turno)
    
    // Formato de respuesta para mantener compatibilidad con código existente
    const turnoResponse = {
      id: turno.id,
      desde: turno.desde.toISOString(),
      hasta: turno.hasta.toISOString(),
      doctor: turno.doctor,
      emoji: turno.emoji,
      servicio: turno.servicio,
      duracion: turno.duracion,
      nombre: paciente.nombre,
      apellido: paciente.apellido,
      dni: paciente.dni,
      celular: paciente.celular,
      email: paciente.email,
      cobertura: turno.coberturaMedica,
      observaciones: paciente.observaciones,
      consultorio: consultorio.nombre,
      tipoDeTurno: turno.tipoDeTurno,
      estado: turno.estado
    };
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Turno creado con éxito',
      turno: turnoResponse
    });
    
  } catch (error) {
    console.error('Error al crear turno:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al procesar la solicitud',
      error: error.message
    }, { status: 500 });
  }
}

// Esta función manejará la obtención de todos los turnos
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');
    const fecha = searchParams.get('fecha');
    const celular = searchParams.get('celular');
    const dni = searchParams.get('dni');
    const estado = searchParams.get('estado');
    
    // Nuevos parámetros de filtro
    const doctorId = searchParams.get('doctorId');
    const consultorioId = searchParams.get('consultorioId');
    const tipoTurno = searchParams.get('tipoTurno');
    const nombrePaciente = searchParams.get('nombrePaciente');
    const celularPaciente = searchParams.get('celularPaciente');
    const dniPaciente = searchParams.get('dniPaciente');
    const coberturaId = searchParams.get('coberturaId');
    let turnosDisponibles = false;
    
    // Construir filtros para la consulta
    const where = {};
    
    // Filtrar por fechas
    if (desde) {
      where.desde = { gte: new Date(desde) };
    }
    
    if (hasta) {
      where.hasta = { lte: new Date(hasta) };
    }

    if (fecha) {
      turnosDisponibles = true;
      const d = new Date(fecha);
      const h = new Date(d);
      // Establecer la hora al final del día
      h.setDate(h.getDate() + 1);
      
      where.desde = { gte: d };
      where.hasta = { lte: h };
    }
    
    // Filtrar por doctor
    if (doctorId && doctorId !== 'todos') {
      where.doctorId = doctorId;
    }

    // Filtrar por estado
    if (estado && estado !== 'todos') {
      where.estado = estado;
    }
    
    // Filtrar por consultorio
    if (consultorioId && consultorioId !== 'todos') {
      where.consultorioId = consultorioId;
    }
    
    // Filtrar por tipo de turno (servicio)
    if (tipoTurno && tipoTurno !== 'todos') {
      // Primero buscamos el tipo de turno para obtener su nombre
      try {
        const tipoTurnoObj = await prisma.tipoTurnoDoctor.findUnique({
          where: { id: tipoTurno }
        });
        
        if (tipoTurnoObj) {
          where.servicio = tipoTurnoObj.nombre;
        }
      } catch (error) {
        console.error('Error al buscar tipo de turno:', error);
      }
    }
    
    // Filtros relacionados con el paciente
    const pacienteWhere = {};
    
    // Filtro por nombre o apellido del paciente (búsqueda parcial)
    if (nombrePaciente) {
      pacienteWhere.OR = [
        { nombre: { contains: nombrePaciente, mode: 'insensitive' } },
        { apellido: { contains: nombrePaciente, mode: 'insensitive' } }
      ];
    }
    
    // Filtro por celular del paciente (búsqueda parcial)
    if (celularPaciente) {
      if (!pacienteWhere.OR) {
        pacienteWhere.celular = { contains: celularPaciente };
      } else {
        pacienteWhere.AND = [{ celular: { contains: celularPaciente } }];
      }
    }
    
    // Filtro por DNI del paciente (búsqueda parcial)
    if (dniPaciente) {
      if (!pacienteWhere.OR && !pacienteWhere.AND) {
        pacienteWhere.dni = { contains: dniPaciente };
      } else {
        if (!pacienteWhere.AND) pacienteWhere.AND = [];
        pacienteWhere.AND.push({ dni: { contains: dniPaciente } });
      }
    }
    
    // Agregar filtros de paciente si hay alguno
    if (Object.keys(pacienteWhere).length > 0) {
      where.paciente = pacienteWhere;
    }
    
    // Filtrar por cobertura médica
    if (coberturaId) {
      where.coberturaMedicaId = coberturaId;
    }
    
    // Filtrar por paciente (compatibilidad con la versión anterior)
    if (celular || dni) {
      where.paciente = where.paciente || {};
      where.paciente.OR = where.paciente.OR || [];
      
      if (celular) {
        where.paciente.OR.push({ celular });
      }
      
      if (dni) {
        where.paciente.OR.push({ dni });
      }
    }

    // Obtener turnos de la base de datos
    let turnos = await prisma.turno.findMany({
      where,
      include: {
        paciente: true,
        doctor: true,
        consultorio: true,
        coberturaMedica: true,
        tipoDeTurno: true,
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
      },
      orderBy: {
        desde: 'asc'
      }
    });

    if (turnosDisponibles === true && turnos.length > 0) {
      turnos = await analizarTurnosDisponibles(turnos);
    }
    
    return NextResponse.json({ 
      ok: true, 
      turnos: turnos
    });
    
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al obtener turnos',
      error: error.message
    }, { status: 500 });
  }
}