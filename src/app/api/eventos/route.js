import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generarToken } from '@/lib/utils/tokenUtils';
import { prisma } from '@/lib/prisma';

// Función para obtener o crear el paciente especial para eventos
async function obtenerPacienteEventos() {
    let pacienteEventos = await prisma.paciente.findFirst({
        where: {
            dni: 'EVENTO',
            nombre: 'EVENTO ESPECIAL'
        }
    });

    if (!pacienteEventos) {
        pacienteEventos = await prisma.paciente.create({
            data: {
                nombre: 'EVENTO ESPECIAL',
                apellido: 'SISTEMA',
                dni: 'EVENTO',
                celular: '0000000000',
                email: '',
                cobertura: 'EVENTO',
                observaciones: 'Paciente especial para registrar eventos del sistema'
            }
        });
    }

    return pacienteEventos;
}

// Crear un nuevo evento
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        const datos = await request.json();
        
        console.log('Datos recibidos para crear evento:', datos);
          // Validar campos requeridos
        const camposRequeridos = ['doctorId', 'consultorioId', 'desde', 'hasta', 'observaciones'];
        for (const campo of camposRequeridos) {
            if (!datos[campo]) {
                return NextResponse.json({ 
                    ok: false, 
                    message: `El campo ${campo} es requerido` 
                }, { status: 400 });
            }
        }

        // Validar que el evento sea del mismo día
        const fechaDesde = new Date(datos.desde);
        const fechaHasta = new Date(datos.hasta);
        
        if (fechaDesde.toDateString() !== fechaHasta.toDateString()) {
            return NextResponse.json({ 
                ok: false, 
                message: 'Los eventos solo pueden durar un día. La fecha de inicio y fin deben ser el mismo día.' 
            }, { status: 400 });
        }

        // Validar que la hora desde sea anterior a la hora hasta
        if (fechaDesde >= fechaHasta) {
            return NextResponse.json({ 
                ok: false, 
                message: 'La hora de inicio debe ser anterior a la hora de fin' 
            }, { status: 400 });
        }

        // Verificar que doctor existe
        const doctor = await prisma.doctor.findFirst({
            where: { id: datos.doctorId }
        });
        
        if (!doctor) {
            return NextResponse.json({ 
                ok: false, 
                message: 'No se encontró el doctor especificado' 
            }, { status: 400 });
        }

        // Verificar que consultorio existe
        const consultorio = await prisma.consultorio.findFirst({
            where: { id: datos.consultorioId }
        });
      
        if (!consultorio) {
            return NextResponse.json({ 
                ok: false, 
                message: 'No se encontró el consultorio especificado' 
            }, { status: 400 });
        }

        // Verificar disponibilidad del horario
        const turnosExistentes = await prisma.turno.findMany({
            where: {
                consultorioId: datos.consultorioId,
                OR: [
                    // El evento comienza durante otro turno/evento
                    {
                        desde: { lte: new Date(datos.desde) },
                        hasta: { gt: new Date(datos.desde) }
                    },
                    // El evento termina durante otro turno/evento
                    {
                        desde: { lt: new Date(datos.hasta) },
                        hasta: { gte: new Date(datos.hasta) }
                    },
                    // El evento abarca completamente a otro
                    {
                        desde: { gte: new Date(datos.desde) },
                        hasta: { lte: new Date(datos.hasta) }
                    }
                ],
                estado: { not: 'cancelado' }
            }
        });
        
        if (turnosExistentes.length > 0) {
            return NextResponse.json({ 
                ok: false, 
                message: 'Ya hay un turno o evento en ese horario', 
                conflictos: turnosExistentes 
            }, { status: 409 });
        }

        // Obtener o crear el paciente especial para eventos
        const pacienteEventos = await obtenerPacienteEventos();

        // Obtener el ID del usuario de la sesión si existe
        const userId = session?.user?.id || null;

        // Crear el evento como un turno especial
        const token = generarToken(50);
        const evento = await prisma.turno.create({
            data: {
                desde: new Date(datos.desde),
                hasta: new Date(datos.hasta),
                servicio: 'EVENTO', // Identificador especial para eventos
                duracion: datos.duracion || 0,
                pacienteId: pacienteEventos.id, // Usar el paciente especial
                confirmado: true, // Los eventos se consideran confirmados automáticamente
                estado: 'confirmado',
                consultorioId: consultorio.id,
                doctorId: doctor.id,
                observaciones: datos.observaciones,
                token: token,
                createdById: userId,
                updatedById: userId
            },
            include: {
                paciente: true,
                doctor: true,
                consultorio: true,
                coberturaMedica: true,
                tipoDeTurno: true
            }
        });

        console.log('Evento creado:', evento);
        
        // Formato de respuesta
        const eventoResponse = {
            id: evento.id,
            desde: evento.desde.toISOString(),
            hasta: evento.hasta.toISOString(),
            doctor: evento.doctor,
            servicio: evento.servicio,
            duracion: evento.duracion,
            observaciones: evento.observaciones,
            consultorio: evento.consultorio,
            estado: evento.estado,
            esEvento: true // Bandera para identificar que es un evento
        };
        
        return NextResponse.json({ 
            ok: true, 
            message: 'Evento creado con éxito',
            evento: eventoResponse
        });

    } catch (error) {
        console.error('Error al crear evento:', error);
        return NextResponse.json({ 
            ok: false, 
            message: 'Error interno del servidor',
            error: error.message 
        }, { status: 500 });
    }
}

// Obtener eventos (opcional - para futuras funcionalidades)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const doctorId = searchParams.get('doctorId');
        const consultorioId = searchParams.get('consultorioId');
        const desde = searchParams.get('desde');
        const hasta = searchParams.get('hasta');

        let whereClause = {
            servicio: 'EVENTO' // Solo obtener turnos que son eventos
        };

        if (doctorId) {
            whereClause.doctorId = doctorId;
        }

        if (consultorioId) {
            whereClause.consultorioId = consultorioId;
        }

        if (desde && hasta) {
            whereClause.desde = {
                gte: new Date(desde),
                lte: new Date(hasta)
            };
        }

        const eventos = await prisma.turno.findMany({
            where: whereClause,
            include: {
                doctor: true,
                consultorio: true
            },
            orderBy: {
                desde: 'asc'
            }
        });

        return NextResponse.json({ 
            ok: true, 
            eventos: eventos.map(evento => ({
                id: evento.id,
                desde: evento.desde.toISOString(),
                hasta: evento.hasta.toISOString(),
                doctor: evento.doctor,
                servicio: evento.servicio,
                duracion: evento.duracion,
                observaciones: evento.observaciones,
                consultorio: evento.consultorio,
                estado: evento.estado,
                esEvento: true
            }))
        });

    } catch (error) {
        console.error('Error al obtener eventos:', error);
        return NextResponse.json({ 
            ok: false, 
            message: 'Error interno del servidor',
            error: error.message 
        }, { status: 500 });
    }
}
