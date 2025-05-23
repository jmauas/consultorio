"use server";
import { prisma } from '@/lib/prisma';
import { obtenerConfig } from '@/lib/services/configService.js';
import { agregarFeriados } from '@/lib/utils/variosUtils.js';
import { enviarRecordatorioTurno } from '@/lib/services/sender/whatsappService';
import { enviarMailConfTurno } from "@/lib/services/sender/resendService";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sonMismaFecha } from  '@/lib/utils/dateUtils';

export const getTurnoById = async (id) => {
    try {
        const turno = await prisma.turno.findUnique({
        where: { id },
        include: {
            paciente: {
                include: {
                  coberturaMedica: true,
                }
            },
            consultorio: true,
            doctor: true,
            coberturaMedica: true,
        },
        });
        return turno;
    } catch (error) {
        console.error('Error al obtener el turno:', error);
        return null;
    }
}

export const updateTurnoService = async (id, datos) => {
  try {
      console.log('ID del turno:', id);
     
      if (!id) {
        return { 
          ok: false, 
          message: 'ID del turno no proporcionado' 
        };
      }
  
      // Verificar si el turno existe
      const turnoExistente = await prisma.turno.findUnique({
        where: { id }
      });
  
      if (!turnoExistente) {
        return { 
          ok: false, 
          message: 'Turno no encontrado' 
        }
      }
  
      let notificar = false;
      
      if (datos && datos.estado === 'cancelado' && turnoExistente.estado !== 'cancelado') {
        notificar = true
        const fhTurno = new Date(turnoExistente.desde);
        const ahora = new Date();
        const diffInMs = fhTurno - ahora;
        console.log(new Date().toLocaleString()+'  -  '+'Diferencia en ms:', diffInMs)
        const diffInHours = diffInMs / 1000 / 60 / 60;
        console.log(new Date().toLocaleString()+'  -  '+'Diferencia en horas:', diffInHours)
        datos.hsAviso = diffInHours.toString();
        datos.fhCambioEstado = new Date().toISOString();
        if (diffInHours <= 0) {
            datos.penal = 'asa';
        } else if (diffInHours < 48) {
            datos.penal = 'ccr';
        }
      }    
      if (datos && datos.estado != turnoExistente.estado) {
        notificar = true
      }
      const session = await getServerSession(authOptions);
      // Obtener el ID del usuario si existe sesión
      const userId = session?.user?.id || null;
      datos.updatedById = userId;
      
      // Actualizar el turno
      const turnoActualizado = await prisma.turno.update({
        where: { id },
        data: datos,
        include: {
          paciente: true,
          doctor: true,
          consultorio: true,
          coberturaMedica: true,
          tipoDeTurno: true // Incluir el tipo de turno en la respuesta
        }
      });
  
      if (notificar) {
        // Enviar notificación por WhatsApp
        await enviarRecordatorioTurno(turnoActualizado, true);
        
        // Enviar correo electrónico
        await enviarMailConfTurno(turnoActualizado, true);
      }
      return {
        ok: true,
        message: 'Turno cancelado exitosamente',
        turno: turnoActualizado
      };
    } catch (error) {
      console.error('Error al cancelar el turno:', error);
      return {
        ok: false,
        message: 'Error al cancelar el turno',
        error: error.message
      };
    }
  }   



export const disponibilidadDeTurnos = async (doctor, tipoDeTurno, minutosTurno, asa, ccr) => {
  try {
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
              id: tipoDeTurno
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
        return { 
          ok: false, 
          message: 'No se encontraron doctores' 
        }
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
            const esFeriado = feriados.some(f => sonMismaFecha(f, fechaFer));
            const diasNoAitende = agregarFeriados([], doctor.feriados);
            const noAtiende = diasNoAitende.some(f => sonMismaFecha(f, fechaFer));
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
               const agendaFecha = agenda.find(age =>
                    age.atencion === true &&
                    age.dia === 99 &&
                    sonMismaFecha(new Date(age.fecha), fecha)
                );              
                if (agendaFecha) {
                    aten.atencion = true;
                    aten.desde = agendaFecha.desde;
                    aten.hasta = agendaFecha.hasta;
                    aten.corteDesde = agendaFecha.corteDesde;
                    aten.corteHasta = agendaFecha.corteHasta;
                }
                if (!aten.atencion) {
                  hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
                  hoy.setDate(hoy.getDate() + 1);
                  hoy.setMinutes(hoy.getMinutes() - minutosTurno);
                  continue;
                }
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
            const consultorioId = aten.consultorioId;
            const turnoAgregar = {
              hora: hr,
              min: min,
              doctor: {
                id: doctor.id,
                nombre: doctor.nombre,
                emoji: doctor.emoji
              },
              consultorioId,
              tipoTurno: tipoDeTurno,
              tipoDeTurnoId: tipoDeTurno, // Agregamos el campo tipoDeTurnoId con el mismo valor que tipoTurno
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
      return { 
        ok: true, 
        turnos: disp,
        mensaje: 'Turnos disponibles obtenidos correctamente'
      }
    } catch (error) {
      console.error('Error al obtener turnos disponibles:', error);
      return { 
        ok: false, 
        message: 'Error al obtener los turnos disponibles', 
        error: error.message
      }
    }
  }

export const analizarTurnosDisponibles = async (turnos) => {
    // Obtener la agenda del doctor para ese día
    const diaSemana = new Date(turnos[0].desde).getDay(); // 0 es domingo, 1 es lunes, etc.
    // busco los ditintos doctores y consultorios en los turnos
    const doctores = [];
    for await (const turno of turnos) {
      if (!doctores.some(doc => doc.doctorId === turno.doctor.id && doc.consultorioId === turno.consultorio.id)) {
        const agenda = await prisma.agendaDoctor.findFirst({
          where: {
            doctorId: turno.doctor.id,
            consultorioId: turno.consultorio.id,
            dia: diaSemana,
            atencion: true
          }
        });
        doctores.push({
          doctorId: turno.doctor.id,
          consultorioId: turno.consultorio.id,
          agenda
        });
      }
    };
  
    if (doctores.length > 0) {
      turnos = turnos.map((turno, i) => {
          const doc = doctores.find(doc => doc.doctorId === turno.doctor.id && doc.consultorioId === turno.consultorio.id);
          const agendaDoctor = doc.agenda;
          if (!agendaDoctor) return turno; // Si no hay agenda, no se puede calcular disponibilidad
          const horarioInicio = convertirHoraAMinutos(agendaDoctor.desde);
          const horarioFin = convertirHoraAMinutos(agendaDoctor.hasta);
          const corteDesde = agendaDoctor.corteDesde ? convertirHoraAMinutos(agendaDoctor.corteDesde) : null;
          const corteHasta = agendaDoctor.corteHasta ? convertirHoraAMinutos(agendaDoctor.corteHasta) : null;
          
          let turnoAnterior = null;
          let turnoSiguiente = null;
          // buscar turno anterior, que no esté en estado cancelado
          if (i > 0) {
            for (let j = i - 1; j >= 0; j--) {
              if (turnos[j].estado !== 'cancelado') {
                turnoAnterior = turnos[j];
                break;
              }
            }
          }       
          // buscar turno siguiente, que no esté en estado cancelado
          if (i < turnos.length - 1) {
            for (let j = i + 1; j < turnos.length; j++) {
              if (turnos[j].estado !== 'cancelado') {
                turnoSiguiente = turnos[j];
                break;
              }
            }
          }

          // Convertir horas de turno a minutos desde medianoche
          const turnoDesdeMin = convertirFechaAMinutos(turno.desde);
          const turnoHastaMin = convertirFechaAMinutos(turno.hasta);

          if (turno.estado==='cancelado') {
            const turnoAnteriorHastaMin = convertirFechaAMinutos(turno.desde);
            const minDiferencia = turnoDesdeMin - turnoAnteriorHastaMin;
            
            if (minDiferencia >= turno.duracion) {
              // Comprobar que está dentro del horario del doctor y fuera del corte
              const disponibleDesdeMin = turnoAnteriorHastaMin;
              const disponibleHastaMin = turnoDesdeMin;
              
              // Verificar que está dentro del horario de atención y fuera del corte
              if (estaDisponible(disponibleDesdeMin, disponibleHastaMin, horarioInicio, horarioFin, corteDesde, corteHasta)) {
                turno = agregarDispoRemplazo(turno);
              }
            }
            return turno;
          }
          
          // Verificar disponibilidad antes del turno
          if (turnoAnterior) {
            const turnoAnteriorHastaMin = convertirFechaAMinutos(turnoAnterior.hasta);
            const minDiferencia = turnoDesdeMin - turnoAnteriorHastaMin;
            
            if (minDiferencia >= turno.duracion) {
              // Comprobar que está dentro del horario del doctor y fuera del corte
              const disponibleDesdeMin = turnoAnteriorHastaMin;
              const disponibleHastaMin = turnoDesdeMin;
              
              // Verificar que está dentro del horario de atención y fuera del corte
              if (estaDisponible(disponibleDesdeMin, disponibleHastaMin, horarioInicio, horarioFin, corteDesde, corteHasta)) {
                turno = agregarDispoAnterior(turno);
              }
            }
          } else {
            // Es el primer turno del día, ver si hay disponibilidad desde el inicio del horario
            const minDiferencia = turnoDesdeMin - horarioInicio;
            
            if (minDiferencia >= turno.duracion) {
              // Verificar que no hay corte en ese intervalo
              if (estaDisponible(horarioInicio, turnoDesdeMin, horarioInicio, horarioFin, corteDesde, corteHasta)) {
                turno = agregarDispoAnterior(turno);
              }
            }
          }
          
          // Verificar disponibilidad después del turno
          if (turnoSiguiente) {
            const turnoSiguienteDesdeMin = convertirFechaAMinutos(turnoSiguiente.desde);
            const minDiferencia = turnoSiguienteDesdeMin - turnoHastaMin;
            
            if (minDiferencia >= turno.duracion) {
              // Verificar que está dentro del horario de atención y fuera del corte
              if (estaDisponible(turnoHastaMin, turnoSiguienteDesdeMin, horarioInicio, horarioFin, corteDesde, corteHasta)) {
                turno = agregarDispoPosterior(turno);
              }
            }
          } else {
            // Es el último turno del día, ver si hay disponibilidad hasta el fin del horario
            const minDiferencia = horarioFin - turnoHastaMin;
            
            if (minDiferencia >= turno.duracion) {              
              // Verificar que no hay corte en ese intervalo
              if (estaDisponible(turnoHastaMin, horarioFin, horarioInicio, horarioFin, corteDesde, corteHasta)) {
                turno = agregarDispoPosterior(turno);
              }
            }
          }
          return turno;       
        });
    }
    return turnos;
  }
  
  function convertirHoraAMinutos(hora) {
    const [horas, minutos] = hora.split(':').map(Number);
    return horas * 60 + minutos;
  }
  
  function convertirFechaAMinutos(fecha) {
    return fecha.getHours() * 60 + fecha.getMinutes();
  }
  
  function estaDisponible(inicioIntervalo, finIntervalo, horarioInicio, horarioFin, corteDesde, corteHasta) {
    // Verificar que el intervalo está dentro del horario de atención
    if (inicioIntervalo < horarioInicio || finIntervalo > horarioFin) {
      return false;
    }
    
    // Verificar que el intervalo no se solapa con el horario de corte
    if (corteDesde && corteHasta) {
      // Verificar si hay alguna superposición entre el intervalo y el corte
      if (!(finIntervalo <= corteDesde || inicioIntervalo >= corteHasta)) {
        return false;
      }
    }
    
    return true;
  }

  const agregarDispoRemplazo = (turno) => {
    // Crear una fecha para el horario de inicio del doctor
    const desde = new Date(turno.desde);
    const hasta = new Date(turno.hasta);
    turno.disponibilidadAnterior = {
      desde,
      hasta,
      duracion: turno.duracion,
      doctor: turno.doctor,
      consultorio: turno.consultorio,
    };
    return turno;
  }
  
  const agregarDispoAnterior = (turno) => {
    // Crear una fecha para el horario de inicio del doctor
    const desde = new Date(turno.desde);
    desde.setMinutes(desde.getMinutes() - turno.duracion);
    const hasta = new Date(turno.desde);
    turno.disponibilidadAnterior = {
      desde,
      hasta,
      duracion: turno.duracion,
      doctor: turno.doctor,
      consultorio: turno.consultorio,
    };
    return turno;
  }
  
  const agregarDispoPosterior = (turno) => {
    // Crear una fecha para el horario de inicio del doctor
    const desde = new Date(turno.hasta);
    const hasta = new Date(turno.hasta);
    hasta.setMinutes(hasta.getMinutes() + turno.duracion);
    turno.disponibilidadPosterior = {
      desde,
      hasta,
      duracion: turno.duracion,
      doctor: turno.doctor,
      consultorio: turno.consultorio,
    };
    return turno;
  }


  export const disponibilidadTurnosEnFecha = async (fechaDesde, fechaHasta, doctorId, consultorioId) => {
    try {
      // Obtener la configuración
      const config = await obtenerConfig();
      let feriados = agregarFeriados([], config.feriados);

      // Asegurar que las fechas están en formato Date
      const fechaDesdeObj = new Date(fechaDesde.getFullYear(), fechaDesde.getMonth(), fechaDesde.getDate(), fechaDesde.getHours(), fechaDesde.getMinutes());
      const fechaHastaObj = new Date(fechaHasta.getFullYear(), fechaHasta.getMonth(), fechaHasta.getDate(), fechaHasta.getHours(), fechaHasta.getMinutes());  
      // Asegurarse que solo estamos analizando un día (el de fechaDesde)
      const fechaInicioDia = new Date(fechaDesdeObj.getFullYear(), fechaDesdeObj.getMonth(), fechaDesdeObj.getDate());
      // fechaInicioDia.setHours(0, 0, 0, 0);
      
      const fechaFinDia = new Date(fechaInicioDia.getFullYear(), fechaInicioDia.getMonth(), fechaInicioDia.getDate());
      fechaFinDia.setHours(23, 59, 59, 999);

      // Obtener el doctor específico
      const doctor = await prisma.doctor.findFirst({
        where: { id: doctorId },
      });

      if (!doctor) {
        return { 
          ok: false, 
          message: 'No se encontró el doctor especificado' 
        };
      }

      // Obtener el consultorio específico
      const consultorio = await prisma.consultorio.findFirst({
        where: { id: consultorioId },
      });

      if (!consultorio) {
        return { 
          ok: false, 
          message: 'No se encontró el consultorio especificado' 
        };
      }

      // Buscar la agenda del doctor para ese consultorio
      const agenda = await prisma.agendaDoctor.findMany({
        where: { 
          doctorId: doctor.id,
          consultorioId: consultorio.id
        },
        orderBy: { dia: 'asc' }
      });

      if (!agenda || agenda.length === 0) {
        return { 
          ok: false, 
          message: 'El doctor no tiene agenda definida para este consultorio' 
        };
      }

      // Calculo duracion por diferencia de minutos de fechas desde y hasta
      const minutosTurno = Math.abs((fechaHastaObj - fechaDesdeObj) / 60000);

      // Obtener turnos existentes para el día
      const turnos = await prisma.turno.findMany({
        where: {
          desde: { gte: fechaInicioDia },
          hasta: { lte: fechaFinDia },
          estado: { not: 'cancelado' },
          doctorId: doctorId,
          consultorioId: consultorioId
        }
      });

      // Crear lista de disponibilidades
      const disp = [];
      
      // Determinar el día de la semana (0 = domingo, 1 = lunes, etc.)
      const dia = fechaInicioDia.getUTCDay();
      
      // Buscar la agenda para ese día de la semana
      const aten = agenda.find(d => d.dia === dia);
      const atenEnFeriado = agenda.find(d => d.dia === 9); // Día 9 parece ser el indicador para feriados
      
      // Si no hay atención para ese día, retornar vacío
      if (!aten) {
        return {
          ok: true,
          turnos: disp,
          mensaje: 'No hay atención para el día seleccionado'
        };
      }

      // Verificar si es feriado
      const fechaFer = new Date(fechaInicioDia);
      fechaFer.setHours(fechaFer.getHours() - 3);
      
      const esFeriado = feriados.some(f =>
        f.getDate() === fechaFer.getDate() &&
        f.getMonth() === fechaFer.getMonth() &&
        f.getFullYear() === fechaFer.getFullYear()
      );
      
      // Verificar días que no atiende el doctor
      const diasNoAtiende = agregarFeriados([], doctor.feriados);
      const noAtiende = diasNoAtiende.some(f =>
        f.getDate() === fechaFer.getDate() &&
        f.getMonth() === fechaFer.getMonth() &&
        f.getFullYear() === fechaFer.getFullYear()
      );
      
      // Ajustar la atención según si es feriado o día que no atiende
      let atencion = { ...aten };
      
      if (noAtiende) {
        atencion.atencion = false;
      } else if (atenEnFeriado && esFeriado) {
        atencion.atencion = atenEnFeriado.atencion;
        atencion.desde = atenEnFeriado.desde;
        atencion.hasta = atenEnFeriado.hasta;
        atencion.corteDesde = atenEnFeriado.corteDesde;
        atencion.corteHasta = atenEnFeriado.corteHasta;
      }
      
      // Si no hay atención, retornar vacío
      if (!atencion.atencion) {
        return {
          ok: true,
          turnos: disp,
          mensaje: 'No hay atención para el día seleccionado'
        };
      }

      // Calcular los horarios de inicio y fin
      const hrInicio = Number(atencion.desde.split(':')[0]);
      const minInicio = Number(atencion.desde.split(':')[1]);
      const hrFin = Number(atencion.hasta.split(':')[0]);
      const minFin = Number(atencion.hasta.split(':')[1]);
      const hrCorteDesde = atencion.corteDesde ? Number(atencion.corteDesde.split(':')[0]) : null;
      const minCorteDesde = atencion.corteDesde ? Number(atencion.corteDesde.split(':')[1]) : 0;
      const hrCorteHasta = atencion.corteHasta ? Number(atencion.corteHasta.split(':')[0]) : null;
      const minCorteHasta = atencion.corteHasta ? Number(atencion.corteHasta.split(':')[1]) : 0;

      // Iniciar desde la hora de inicio de atención o la fechaDesde, la que sea posterior
      let hoy = new Date(fechaInicioDia);
      hoy.setHours(hrInicio, minInicio, 0, 0);

      // Limitar al fin del día o fechaHasta, lo que sea anterior
      const limiteHora = new Date(fechaInicioDia);
      limiteHora.setHours(hrFin, minFin, 0, 0);

      // Restar la duración del turno para que el primer cálculo la agregue
      hoy.setMinutes(hoy.getMinutes() - minutosTurno);
      try {
        // Iterar a través de los posibles horarios
        while (hoy <= limiteHora) {
          hoy.setMinutes(hoy.getMinutes() + minutosTurno);
          
          // Si ya pasamos el límite, salimos
          if (hoy > limiteHora) break;
          
          const hora = hoy.getHours();
          const minutos = hoy.getMinutes();

          // Verificar si estamos en horario de corte
          if (hrCorteDesde !== null && hrCorteHasta !== null) {
            if (hora > hrCorteDesde && hora < hrCorteHasta) {
              hoy.setHours(hrCorteHasta);
              hoy.setMinutes(minCorteHasta);
              continue;
            }
            
            if ((hora === hrCorteDesde && minutos >= minCorteDesde) || 
                (hora === hrCorteHasta && minutos < minCorteHasta)) {
              hoy.setHours(hrCorteHasta);
              hoy.setMinutes(minCorteHasta);
              continue;
            }
          }

          // Verificar superposición con turnos existentes
          const turnoSuperpuesto = turnos.find(t => {
            const inicioTurno = new Date(t.desde);
            const finTurno = new Date(t.hasta);
            const inicioNuevo = new Date(hoy);
            const finNuevo = new Date(hoy);
            finNuevo.setMinutes(finNuevo.getMinutes() + minutosTurno);
            
            // Verificar superposición
            return (
              (inicioTurno <= inicioNuevo && finTurno > inicioNuevo) || 
              (inicioTurno >= inicioNuevo && inicioTurno < finNuevo)
            );
          });
          
          if (turnoSuperpuesto) {
            // Saltar al final de este turno
            const fin = new Date(turnoSuperpuesto.hasta);
            hoy = new Date(fin);
            continue;
          }
          
          // Formato de fecha
          const fecha = `${hoy.getFullYear()}-${(hoy.getMonth() + 1)}-${hoy.getDate()}`;
          
          // Buscar el día en la lista de disponibilidades o crear uno nuevo
          let dia = disp.find(turno => turno.fecha === fecha);
          
          const turnoAgregar = {
            hora: hora,
            min: minutos,
            doctor: {
              id: doctor.id,
              nombre: doctor.nombre,
              emoji: doctor.emoji
            },
            consultorioId,
            duracion: minutosTurno
          };
          
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
        
        return { 
          ok: true, 
          turnos: disp,
          mensaje: 'Turnos disponibles obtenidos correctamente'
        };
      } catch (error) {
        console.log('Error al calcular disponibilidad:', error);
        return {
          ok: false,
          message: 'Error al calcular la disponibilidad',
          error: error.message
        };
      }
    } catch (error) {
      console.error('Error al obtener turnos disponibles:', error);
      return { 
        ok: false, 
        message: 'Error al obtener los turnos disponibles', 
        error: error.message
      };
    }
};

