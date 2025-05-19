import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const doctores = await prisma.doctor.findMany({
      include: {
        AgendaDoctor: true,
        TipoTurnoDoctor: {
          include: {
            consultorios: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    
    // Transform the data to match the expected structure in the frontend
    const doctoresFormateados = doctores.map(doctor => ({
      ...doctor,
      agenda: doctor.AgendaDoctor || [],
      tiposTurno: doctor.TipoTurnoDoctor ? doctor.TipoTurnoDoctor.map(tipo => ({
        ...tipo,
        consultorioIds: tipo.consultorios.map(c => c.id),
        consultorios: tipo.consultorios
      })) : [],
      // Remove the capitalized fields to avoid duplication
      AgendaDoctor: undefined,
      TipoTurnoDoctor: undefined
    }));
    
    return NextResponse.json({ 
      ok: true, 
      doctores: doctoresFormateados
    });
  } catch (error) {
    console.error('Error al obtener doctores:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al obtener los doctores' }, 
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
    
    // Crear el doctor con los datos básicos
    const nuevoDoctor = await prisma.doctor.create({
      data: {
        nombre: data.nombre,
        emoji: data.emoji || '👨‍⚕️',
        feriados: data.feriados || [],
        color: data.color || '#000000',
      }
    });
    
    // Si hay datos de agenda, crearla
    if (data.agenda && Array.isArray(data.agenda)) {
      for (const item of data.agenda) {
        // Preparar datos base para la agenda
        const agendaData = {
          doctorId: nuevoDoctor.id,
          dia: item.dia,
          nombre: item.nombre,
          atencion: item.atencion,
          desde: item.desde,
          hasta: item.hasta,
          corteDesde: item.corteDesde,
          corteHasta: item.corteHasta
        };
        
        // Si hay consultorio, agregarlo
        if (item.consultorioId) {
          agendaData.consultorioId = item.consultorioId;
        }
        
        // Si es una fecha específica (dia 99), agregar el campo fecha
        if (item.dia === 99 && item.fecha) {
          agendaData.fecha = new Date(item.fecha);
        }
        
        await prisma.agendaDoctor.create({
          data: agendaData
        });
      }
    }
    
    // Si hay tipos de turno, crearlos
    if (data.tiposTurno && Array.isArray(data.tiposTurno)) {
      for (const tipo of data.tiposTurno) {
        // Crear el tipo de turno
        const tipoTurno = await prisma.tipoTurnoDoctor.create({
          data: {
            doctorId: nuevoDoctor.id,
            nombre: tipo.nombre,
            duracion: tipo.duracion,
            habilitado: tipo.habilitado !== false,
            publico: tipo.publico !== false
          }
        });
        
        // Si tiene consultoriosIds, establecer la relación
        if (tipo.consultorioIds && Array.isArray(tipo.consultorioIds) && tipo.consultorioIds.length > 0) {
          await prisma.tipoTurnoDoctor.update({
            where: { id: tipoTurno.id },
            data: {
              consultorios: {
                connect: tipo.consultorioIds.map(id => ({ id }))
              }
            }
          });
        }
      }
    }
    
    // Devolver el doctor creado con sus relaciones
    const doctorCompleto = await prisma.doctor.findUnique({
      where: { id: nuevoDoctor.id },
      include: {
        AgendaDoctor: true,
        TipoTurnoDoctor: {
          include: {
            consultorios: true
          }
        }
      }
    });
    
    // Transform the data to match the expected structure
    const doctorFormateado = {
      ...doctorCompleto,
      agenda: doctorCompleto.AgendaDoctor || [],
      tiposTurno: doctorCompleto.TipoTurnoDoctor ? doctorCompleto.TipoTurnoDoctor.map(tipo => ({
        ...tipo,
        consultorioIds: tipo.consultorios.map(c => c.id),
        consultorios: undefined
      })) : [],
      // Remove the capitalized fields to avoid duplication
      AgendaDoctor: undefined,
      TipoTurnoDoctor: undefined
    };
    
    return NextResponse.json({ 
      ok: true, 
      doctor: doctorFormateado
    });
  } catch (error) {
    console.error('Error al crear doctor:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al crear el doctor' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    
    // Validar datos requeridos
    if (!data.id || !data.nombre) {
      return NextResponse.json(
        { ok: false, error: 'El ID y nombre son campos requeridos' }, 
        { status: 400 }
      );
    }
    
    // Actualizar el doctor con los datos básicos
    const doctorActualizado = await prisma.doctor.update({
      where: { id: data.id },
      data: {
        nombre: data.nombre,
        emoji: data.emoji || '👨‍⚕️',
        feriados: data.feriados || [],
        color: data.color || '#000000',
      }
    });
    
    // Actualizar agenda del doctor - eliminar todos los registros existentes y crear nuevos
    await prisma.agendaDoctor.deleteMany({
      where: { doctorId: data.id }
    });
    
    if (data.agenda && Array.isArray(data.agenda)) {
      for (const item of data.agenda) {
        // Preparar datos base para la agenda
        const agendaData = {
          doctorId: data.id,
          consultorioId: item.consultorioId || null,
          dia: item.dia,
          nombre: item.nombre,
          atencion: item.atencion,
          desde: item.desde,
          hasta: item.hasta,
          corteDesde: item.corteDesde,
          corteHasta: item.corteHasta
        };
        
        // Si es una fecha específica (dia 99), agregar el campo fecha
        if (item.dia === 99 && item.fecha) {
          agendaData.fecha = new Date(item.fecha);
        }
        
        await prisma.agendaDoctor.create({
          data: agendaData
        });
      }
    }
    
    // Actualizar tipos de turno - eliminar todos los registros existentes y crear nuevos
    await prisma.tipoTurnoDoctor.deleteMany({
      where: { doctorId: data.id }
    });
    
    if (data.tiposTurno && Array.isArray(data.tiposTurno)) {
      for (const tipo of data.tiposTurno) {
        // Crear el tipo de turno
        const tipoTurno = await prisma.tipoTurnoDoctor.create({
          data: {
            doctorId: data.id,
            nombre: tipo.nombre,
            duracion: tipo.duracion,
            habilitado: tipo.habilitado !== false,
            publico: tipo.publico !== false,
          }
        });
        
        // Si tiene consultoriosIds, establecer la relación
        if (tipo.consultorioIds && Array.isArray(tipo.consultorioIds) && tipo.consultorioIds.length > 0) {
          await prisma.tipoTurnoDoctor.update({
            where: { id: tipoTurno.id },
            data: {
              consultorios: {
                connect: tipo.consultorioIds.map(id => ({ id }))
              }
            }
          });
        }
      }
    }
    
    // Devolver el doctor actualizado con sus relaciones
    const doctorCompleto = await prisma.doctor.findUnique({
      where: { id: data.id },
      include: {
        AgendaDoctor: true,
        TipoTurnoDoctor: {
          include: {
            consultorios: true
          }
        }
      }
    });
    
    // Transform the data to match the expected structure
    const doctorFormateado = {
      ...doctorCompleto,
      agenda: doctorCompleto.AgendaDoctor || [],
      tiposTurno: doctorCompleto.TipoTurnoDoctor ? doctorCompleto.TipoTurnoDoctor.map(tipo => ({
        ...tipo,
        consultorioIds: tipo.consultorios.map(c => c.id),
        consultorios: undefined
      })) : [],
      // Remove the capitalized fields to avoid duplication
      AgendaDoctor: undefined,
      TipoTurnoDoctor: undefined
    };
    
    return NextResponse.json({ 
      ok: true, 
      doctor: doctorFormateado
    });
  } catch (error) {
    console.error('Error al actualizar doctor:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al actualizar el doctor' }, 
      { status: 500 }
    );
  }
}