import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { obtenerConfig } from '@/lib/services/configService.js';

// Handle GET request for available appointments
export async function GET(request) {
  try {
    // Check if it's a public request from a whatsapp source or authenticated
    const session = await getServerSession(authOptions);
    const isPublicEndpoint = request.headers.get('x-api-source') === 'whatsapp';
    const url = new URL(request.url);
    
    // Extract query parametersf
    const doctor = url.searchParams.get('doctor');
    const tipo = url.searchParams.get('tipo') || 'turno';
    const minutosTurno = Number(url.searchParams.get('duracion'));
    const asa = url.searchParams.get('asa') === 'si';
    const ccr = url.searchParams.get('ccr') === 'si';
 
    // Check for authorization
    if (!session && !isPublicEndpoint) {
      return NextResponse.json({ 
        ok: false, 
        message: 'No autorizado'
      }, { status: 401 });
    }
    
    // Validate required parameters
    if (!minutosTurno) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Se requiere el parámetro duracion'
      }, { status: 400 });
    }
    
    // Obtener la configuración
    const config = await obtenerConfig();
    let limite = new Date(config.limite);
    limite = limite.setDate(limite.getDate() + 1);
    let feriados = agregarFeriados([], config.feriados);
    // Obtengo los consultorios relacionados con el tipo de turno especificado
    const consultorios = await prisma.consultorio.findMany({
      where: {
        tiposTurno: {
          some: {
            id: tipo
          }
        }
      },
    });
    
    // Obtener todos los doctores o el doctor específico
    let doctores = [];
    if (doctor && doctor !== 'Indistinto') {
      const dr = await prisma.doctor.findFirst({
        where: { id: doctor },
      });
      if (dr) {
        const consultoriosIds = consultorios.map(c => c.id);
        const agenda = await prisma.agendaDoctor.findMany({
          where: { 
            doctorId: dr.id,
            consultorioId: {
              in: consultoriosIds
            }
          },
          orderBy: { dia: 'asc' }
        });
        dr.agenda = agenda;
        doctores.push(dr);
      }
    } else {
      doctores = await prisma.doctor.findMany({
        include: { 
          AgendaDoctor: {
            where: {
              consultorioId: {
                in: consultorios.map(c => c.id)
              }
            }
          }
        }
      });
      
      // Rename AgendaDoctor to agenda for consistency
      doctores = doctores.map(doc => ({
        ...doc,
        agenda: doc.AgendaDoctor || [],
        AgendaDoctor: undefined
      }));
    }

    if (doctores.length === 0) {
      return NextResponse.json({ 
        ok: false, 
        message: 'No se encontraron doctores' 
      }, { status: 404 });
    }

    // Calcular fechas para buscar disponibilidad
    const ahora = new Date();
    const finPeriodo = new Date(config.limite);

    // Ajustar para penalidades
    let fechaInicioBusqueda = new Date(ahora);
    
    // Si tiene penalidades, aplicar restricciones
    if (asa && config.diasAsa > 0) {
      fechaInicioBusqueda.setDate(fechaInicioBusqueda.getDate() + Number(config.diasAsa || 0));
    } else if (ccr && config.diasCcr > 0) {
      fechaInicioBusqueda.setDate(fechaInicioBusqueda.getDate() + Number(config.diasCcr || 0));
    }

    // Obtener turnos existentes para el periodo
    const turnos = await prisma.turno.findMany({
      where: {
        desde: { gte: fechaInicioBusqueda },
        hasta: { lte: finPeriodo },
        estado: { not: 'cancelado' }
      }
    });
    const disp = [];
    doctores.forEach(doctor => {
      // Verificar si el doctor tiene agenda
      if (!doctor.agenda || doctor.agenda.length === 0) {
        console.log(`Doctor ${doctor.nombre} no tiene agenda definida.`);
        return;
      }
      const agenda = doctor.agenda;
      let hoy = new Date();
      hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      hoy.setDate(hoy.getDate() + 1);
      //ANALIZO PENALIZACIÓN
      if (asa && asa === 'si') {
        hoy.setDate(hoy.getDate() + 30)
      } else if (ccr && ccr === 'si') {
        hoy.setDate(hoy.getDate() + 7)
      }
      hoy.setMinutes(hoy.getMinutes() - minutosTurno);
      const atenEnFeriado = { ...agenda.find(d => d.dia === 9) };
      try {
        while (hoy <= limite) {
          hoy.setMinutes(hoy.getMinutes() + minutosTurno);
          let fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
          const fechaFer = new Date(fecha);
          fechaFer.setHours(fechaFer.getHours() - 3);
          let dia = hoy.getUTCDay();
          const aten = { ...agenda.find(d => d.dia === dia) };
          const esFeriado = feriados.some(f =>
            f.getDate() === fechaFer.getDate() &&
            f.getMonth() === fechaFer.getMonth() &&
            f.getFullYear() === fechaFer.getFullYear()
          );
          const diasNoAitende = agregarFeriados([], doctor.feriados);
          const noAtiende = diasNoAitende.some(f =>
            f.getDate() === fechaFer.getDate() &&
            f.getMonth() === fechaFer.getMonth() &&
            f.getFullYear() === fechaFer.getFullYear()
          );
          if (noAtiende) {
            aten.atencion = false;
          } else if (atenEnFeriado && esFeriado) {
            aten.atencion = atenEnFeriado.atencion;
            aten.desde = atenEnFeriado.desde;
            aten.hasta = atenEnFeriado.hasta;
            aten.corteDesde = atenEnFeriado.corteDesde;
            aten.corteHasta = atenEnFeriado.corteHasta;
          }
          if (!aten.atencion) {
            hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            hoy.setDate(hoy.getDate() + 1);
            hoy.setMinutes(hoy.getMinutes() - minutosTurno);
            continue;
          }
          const hora = hoy.getHours();
          const minutos = hoy.getMinutes();
          const hrInicio = Number(aten.desde.split(':')[0]);
          const minInicio = Number(aten.desde.split(':')[1]);
          const hrFin = Number(aten.hasta.split(':')[0]);
          const minFin = Number(aten.hasta.split(':')[1]);
          const hrCorteDesde = Number(aten.corteDesde.split(':')[0]);
          const hrCorteHasta = Number(aten.corteHasta.split(':')[0]);
          const minCorteDesde = aten.corteDesde.split(':')[1] ? Number(aten.corteDesde.split(':')[1]): 0;
          const minCorteHasta = aten.corteHasta.split(':')[1] ? Number(aten.corteHasta.split(':')[1]) : 0;

          //console.log(new Date().toLocaleString()+'  -  '+'diaSemana', dia, 'hoy', hoy, 'Fecha para feriado', fechaFer, 'fecha', fecha, 'hora', hora, 'minutos', minutos, 'hrInicio', hrInicio, 'minInicio', minInicio, 'hrFin', hrFin, 'minFin', minFin)
          //console.log(new Date().toLocaleString()+'  -  '+'hora', hora, 'minutos', minutos, 'hrCorte', hrCorteDesde, minCorteDesde, 'hrCorteHasta', hrCorteHasta, minCorteHasta)
          if (hora < hrInicio) {
            hoy.setHours(hrInicio);
            hoy.setMinutes(hoy.getMinutes() - minutosTurno);
            continue;
          }
          if (hora === hrInicio && minutos < minInicio) {
            hoy.setMinutes(minInicio);
            hoy.setMinutes(hoy.getMinutes() - minutosTurno);
            continue;
          }
          if (hora > hrFin) {
            hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            hoy.setDate(hoy.getDate() + 1);
            hoy.setMinutes(hoy.getMinutes() - minutosTurno);
            continue;
          }
          if (hora === hrFin && minutos >= minFin) {
            hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            hoy.setDate(hoy.getDate() + 1);
            hoy.setMinutes(hoy.getMinutes() - minutosTurno);
            continue;
          }
          if (hora > hrCorteDesde && hora < hrCorteHasta) {
            hoy.setHours(hrCorteHasta);
            hoy.setMinutes(minCorteHasta - minutosTurno);
            continue;
          }
          if ((hora === hrCorteDesde && minutos > minCorteDesde) || (hora === hrCorteHasta && minutos < minCorteHasta)) {
            hoy.setHours(hrCorteHasta);
            //hoy.setMinutes(minCorteHasta - minutosTurno);
            //continue;
          }
          const turno = turnos.filter(t => {
            const inicioTurno = new Date(t.desde);
            const finTurno = new Date(t.hasta);
            const finHoy = new Date(hoy).setMinutes(hoy.getMinutes() + minutosTurno);
            if ((inicioTurno < hoy && finTurno > hoy) || (inicioTurno >= hoy && inicioTurno < finHoy) || (finTurno > hoy && finTurno <= finHoy)) {
              return true;
            } else {
              return false
            }
          });
          if (turno && turno.length > 0) {
            const fin = new Date(turno[turno.length - 1].hasta);
            hoy = new Date(fin);
            hoy.setMinutes(hoy.getMinutes() - minutosTurno);
            continue;
          }
          //const fh = hoy.getFullYear() + '-' + (hoy.getMonth() + 1) + '-' + hoy.getDate() + ' ' + hoy.getHours() + ':' + hoy.getMinutes() + ':00';
          fecha = hoy.getFullYear() + '-' + (hoy.getMonth() + 1) + '-' + hoy.getDate();
          const hr = hoy.getHours();
          const min = hoy.getMinutes();
          dia = disp.find(turno => turno.fecha == fecha);
          const turnoAgregar = {
            hora: hr,
            min: min,
            doctor: {
              id: doctor.id,
              nombre: doctor.nombre,
              emoji: doctor.emoji
            },
            consultorio: consultorios,
            tipoTurno: tipo,
            tipoDeTurnoId: tipo, // Agregamos el campo tipoDeTurnoId con el mismo valor que tipoTurno
            duracion: minutosTurno
          }
          if (!dia) {
            disp.push({
              fecha: fecha,
              diaSemana: new Date(hoy).toLocaleDateString('es-ES', { weekday: 'long' }),
              turnos: [turnoAgregar],
            });
          } else {
            const index = disp.indexOf(dia);
            dia.turnos.push(turnoAgregar);
            disp[index] = dia;
          }
        }
      } catch (error) {
        console.log(new Date().toLocaleString()+'  -  '+'Error en disponibilidad', error);
      }
    });
    return NextResponse.json({ 
      ok: true, 
      turnos: disp,
      mensaje: 'Turnos disponibles obtenidos correctamente'
    });
  } catch (error) {
    console.error('Error al obtener turnos disponibles:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al obtener los turnos disponibles', 
      error: error.message
    }, { status: 500 });
  }
}  

const agregarFeriados = (actual, agregar) => {
  if (!actual) actual = [];
  if (!agregar) return actual;
  agregar.forEach(f => {
      if (f.indexOf('|') >= 0) {
          let fecha1 = new Date(f.split('|')[0]);
          let fecha2 = new Date(f.split('|')[1]);
          while (fecha1 <= fecha2) {
              actual.push(new Date(fecha1));
              fecha1.setDate(fecha1.getDate() + 1);
          }
      } else {
          actual.push(new Date(f));
      }
  });
  return actual;
}