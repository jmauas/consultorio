"use server";
import { prisma } from '@/lib/prisma';

export const getTurnoById = async (id) => {
    try {
        const turno = await prisma.turno.findUnique({
        where: { id },
        include: {
            paciente: true,
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