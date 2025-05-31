
// Duración estándar de cada turno en minutos (configurable)
export const DURACION_TURNO_MINUTOS = 15;

/**
 * Processes consultorio data to create time slots with doctor availability and assigned turnos
 * @param {Array} consultorios - Array of consultorios with doctor availability
 * @param {Array} turnos - Array of turnos (appointments) for the day
 * @returns {Array} - Array of time slots with consultorio, doctor availability and turnos
 */
export const procesarAgendaConsultorios = (consultorios, turnos = []) => {
  // Find earliest start time and latest end time across all doctors
  let horaInicio = "23:59";
  let horaFin = "00:00";
  const slotDuration = DURACION_TURNO_MINUTOS; // Use global configurable duration
  
  consultorios.forEach(consultorio => {
    consultorio.doctores.forEach(doctor => {
      if (doctor.desde && doctor.desde < horaInicio) {
        horaInicio = doctor.desde;
      }
      if (doctor.hasta && doctor.hasta > horaFin) {
        horaFin = doctor.hasta;
      }
    });
  });
  
  // If no doctors found, return empty array
  if (horaInicio === "23:59" || horaFin === "00:00") {
    return [];
  }
  
  // Parse the earliest and latest times
  const [inicioHora, inicioMinuto] = horaInicio.split(":").map(Number);
  const [finHora, finMinuto] = horaFin.split(":").map(Number);
  
  // Create agenda with time slots
  const agenda = [];
  
  // Generate time slots
  let currentHour = inicioHora;
  let currentMinute = inicioMinuto - (inicioMinuto % slotDuration); // Round down to nearest slot duration
  
  while (currentHour < finHora || (currentHour === finHora && currentMinute <= finMinuto)) {
    // Format current time
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    // Calculate the start and end of this time slot
    const slotStartHour = currentHour;
    const slotStartMinute = currentMinute;
    let slotEndHour = currentHour;
    let slotEndMinute = currentMinute + slotDuration;
    
    if (slotEndMinute >= 60) {
      slotEndHour++;
      slotEndMinute -= 60;
    }
    
    // Create a time slot with all consultorios
    const timeSlot = {
      hora: timeString,
      consultorios: []
    };
    
    let hayAtencionEnAlgunConsultorio = false;
    let hayTurnosEnEstaFranja = false;
    
    // Check each consultorio
    consultorios.forEach(consultorio => {
      const consultorioInfo = {
        consultorioId: consultorio.consultorioId,
        nombre: consultorio.nombre,
        color: consultorio.color,
        doctores: [],
        turnos: []
      };
      
      // Check which doctors are available at this time
      consultorio.doctores.forEach(doctor => {
        // Check if doctor is available at this time
        const disponible = isDoctorAvailable(doctor, currentHour, currentMinute);
        
        // Add doctor info with availability status
        consultorioInfo.doctores.push({
          id: doctor.id,
          nombre: doctor.nombre,
          emoji: doctor.emoji,
          color: doctor.color,
          atencion: disponible
        });
        
        if (disponible) {
          hayAtencionEnAlgunConsultorio = true;
        }
      });
      
      // Add turnos that overlap with this time slot for this consultorio
      if (turnos && turnos.length > 0) {
        // Get date from the first consultorio's fecha (assuming all have the same date)
        const fecha = new Date(consultorio.fecha);
        const fechaStr = fecha.toISOString().split('T')[0]; // Extract YYYY-MM-DD
        
        // Filter turnos for this consultorio and time slot
        const turnosEnEstaFranja = turnos.filter(turno => {
          // Check if turno belongs to this consultorio
          if (turno.consultorioId !== consultorio.consultorioId) {
            return false;
          }

          if (turno.yaAgregado) {
            return false; // Skip already added turnos
          }
          
          // Parse turno times
          const desdeDate = new Date(turno.desde);
          const hastaDate = new Date(turno.hasta);
          
          // Create datetime objects for the current time slot
          const slotStartDate = new Date(`${fechaStr}T${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')}:00`);
          const slotEndDate = new Date(`${fechaStr}T${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}:00`);
          
          // Check for overlap: turno starts before slot ends AND turno ends after slot starts
          return desdeDate < slotEndDate && hastaDate > slotStartDate;
        });
        
        // marco los turnos encontrados como ya agregados a la agenda
        turnos = turnos.map(turno => {
          const turnoEncontrado = turnosEnEstaFranja.find(t => t.id === turno.id);
          if (turnoEncontrado) {
            return { ...turno, yaAgregado: true };
          }
          return turno;
        });
        // Add matching turnos to the consultorio
        consultorioInfo.turnos = turnosEnEstaFranja;
        // calculo cuantos slots van a ocupar estos turnos
        const slotsOcupados = turnosEnEstaFranja.reduce((total, turno) => {
          const desdeDate = new Date(turno.desde);
          const hastaDate = new Date(turno.hasta);
          
          // Determinar en qué slot inicia (redondeando hacia abajo)
          const desdeMinutos = desdeDate.getHours() * 60 + desdeDate.getMinutes();
          const slotInicio = Math.floor(desdeMinutos / slotDuration);
          
          // Determinar en qué slot termina (redondeando hacia arriba si no cae exacto en un límite)
          const hastaMinutos = hastaDate.getHours() * 60 + hastaDate.getMinutes();
          const slotFin = Math.ceil(hastaMinutos / slotDuration);
          
          // La cantidad de slots es la diferencia entre el slot final y el inicial
          return total + (slotFin - slotInicio);
        }, 0);        
        consultorioInfo.slotsOcupados = slotsOcupados;
        if (turnosEnEstaFranja.length > 0) {
          hayTurnosEnEstaFranja = true;
        }
      }
      
      timeSlot.consultorios.push(consultorioInfo);
    });
    
    // Only add time slot if at least one doctor is available or if there are turnos
    //if (hayAtencionEnAlgunConsultorio || hayTurnosEnEstaFranja) {
      agenda.push(timeSlot);
    //}
    
    // Advance to next slot
    currentMinute += slotDuration;
    if (currentMinute >= 60) {
      currentHour++;
      currentMinute = 0;
    }
  }
  
  return agenda;
}

/**
 * Checks if a doctor is available at the specified time
 * @param {Object} doctor - Doctor information with desde, hasta, corteDesde, corteHasta
 * @param {Number} hour - Current hour to check
 * @param {Number} minute - Current minute to check
 * @returns {Boolean} - Whether the doctor is available
 */
function isDoctorAvailable(doctor, hour, minute) {
  if (doctor.noLaborable) {
    return false; // Doctor is not available
  }
  // Parse desde and hasta times
  const [desdeHora, desdeMinuto] = doctor.desde.split(":").map(Number);
  const [hastaHora, hastaMinuto] = doctor.hasta.split(":").map(Number);
  
  // Check if current time is within doctor's working hours
  const currentTimeValue = hour * 60 + minute;
  const desdeTimeValue = desdeHora * 60 + desdeMinuto;
  const hastaTimeValue = hastaHora * 60 + hastaMinuto;
  
  if (currentTimeValue < desdeTimeValue || currentTimeValue >= hastaTimeValue) {
    return false;
  }
  
  // Check if current time is within break time
  if (doctor.corteDesde && doctor.corteHasta) {
    const [corteDesdeHora, corteDesdeMinuto] = doctor.corteDesde.split(":").map(Number);
    const [corteHastaHora, corteHastaMinuto] = doctor.corteHasta.split(":").map(Number);
    
    const corteDesdeValue = corteDesdeHora * 60 + corteDesdeMinuto;
    const corteHastaValue = corteHastaHora * 60 + corteHastaMinuto;
    
    if (currentTimeValue >= corteDesdeValue && currentTimeValue < corteHastaValue) {
      return false;
    }
  }
  
  return true;
}

/**
 * Calcula la cantidad de turnos disponibles entre dos fechas
 * @param {Date} fechaDesde - Fecha de inicio del rango
 * @param {Date} fechaHasta - Fecha de fin del rango
 * @param {Array} configuracion - Configuración que incluye feriados
 * @param {Array} doctores - Array de doctores con sus agendas
 * @param {Array} consultorios - Array de consultorios
 * @param {Array} turnosExistentes - Array de turnos ya programados (opcional)
 * @returns {Array} - Array con información de turnos disponibles por día
 */
export const calcularTurnosDisponiblesPorRango = (fechaDesde, fechaHasta, configuracion, doctores, consultorios, turnosExistentes = []) => {
  const resultado = [];
  
  // Agregar feriados de la configuración
  const agregarFeriados = (actual, agregar) => {
    if (!actual) actual = [];
    if (!agregar || agregar.length === 0) return actual;
    agregar.forEach(f => {
        if (f.indexOf('|') >= 0) {
            let fecha1 = new Date(f.split('|')[0]);
            let fecha2 = new Date(f.split('|')[1]);
            fecha1.setHours(fecha1.getHours() + 3);
            fecha2.setHours(fecha2.getHours() + 3);
            while (fecha1 <= fecha2) {
                actual.push(new Date(fecha1));
                fecha1.setDate(fecha1.getDate() + 1);
            }
        } else {
          let fecha1 = new Date(f);
          fecha1.setHours(fecha1.getHours() + 3);
          actual.push(fecha1);
        }
    });
    return actual;
  };

  // Función para verificar si dos fechas son la misma
  const sonMismaFecha = (fecha1, fecha2) => {
    return (
        fecha1.getDate() === fecha2.getDate() &&
        fecha1.getMonth() === fecha2.getMonth() &&
        fecha1.getFullYear() === fecha2.getFullYear()
    );
  };

  // Procesar cada día en el rango
  const fechaActual = new Date(fechaDesde);
  while (fechaActual <= fechaHasta) {
    const diaSemana = fechaActual.getDay();
    const feriados = agregarFeriados([], configuracion.feriados);
    
    let esFeriado = false;
    if (feriados && feriados.length > 0) {
        esFeriado = feriados.some(f => sonMismaFecha(f, fechaActual));
    }

    // Filtrar turnos existentes para este día
    const turnosDelDia = turnosExistentes.filter(turno => {
      const fechaTurno = new Date(turno.desde);
      return sonMismaFecha(fechaTurno, fechaActual) && turno.estado !== 'cancelado';
    });

    // Crear agendas para este día siguiendo la misma lógica de fetchData
    const agendas = [];
    consultorios.forEach(consultorio => {
        const agenda = {
            consultorioId: consultorio.id,
            diaSemana: diaSemana,
            fecha: new Date(fechaActual),
            doctores: [],
            color: consultorio.color,
            nombre: consultorio.nombre,
        };
        
        doctores.forEach(doctor => {
            let atencionHoy = doctor.agenda.find(age => age.dia == diaSemana && age.consultorioId === consultorio.id && age.atencion === true);

            let noLaborable = false;            
            if (esFeriado) noLaborable = true;
            
            const noLaborablesDoctor = agregarFeriados([], doctor.feriados);
            if (noLaborablesDoctor && noLaborablesDoctor.length > 0) {
                const esNoLaborable = noLaborablesDoctor.some(f => sonMismaFecha(f, fechaActual));
                if (esNoLaborable) noLaborable = true;
            }
            
            if (!atencionHoy) {
                const agendaFecha = doctor.agenda.find(age =>
                    age.consultorioId === consultorio.id &&
                    age.atencion === true &&
                    age.dia === 99 &&
                    sonMismaFecha(new Date(age.fecha), fechaActual)
                );
                if (agendaFecha) {
                    atencionHoy = agendaFecha;
                    noLaborable = false;
                }
            }
            if (atencionHoy) {
                agenda.doctores.push({
                    id: doctor.id,
                    nombre: doctor.nombre,
                    emoji: doctor.emoji,
                    color: doctor.color,
                    desde: atencionHoy.desde,
                    hasta: atencionHoy.hasta,
                    corteDesde: atencionHoy.corteDesde,
                    corteHasta: atencionHoy.corteHasta,
                    noLaborable: noLaborable,
                });
            } 
        });
        agendas.push(agenda);
    });    
    // Procesar agenda usando la función existente
    const agendaDelDia = procesarAgendaConsultorios(agendas, turnosDelDia);
  
    // Calcular turnos disponibles
    let turnosDisponibles = 0;
    let turnosOcupados = 0;
    let totalSlots = 0;

    agendaDelDia.forEach(franjaHoraria => {
      franjaHoraria.consultorios.forEach(consultorio => {
        // Contar doctores disponibles en esta franja
        const doctoresDisponibles = consultorio.doctores.filter(doctor => doctor.atencion === true);
        
        if (doctoresDisponibles.length > 0) {
          // Cada slot de 15 minutos puede tener un turno por doctor disponible
          const slotsDisponiblesEnFranja = doctoresDisponibles.length;
          totalSlots += slotsDisponiblesEnFranja;
          
          // Contar turnos ocupados en esta franja (cada turno puede ocupar múltiples slots)
          let slotsOcupados = 0;
          if (consultorio.turnos && consultorio.turnos.length > 0) {
            consultorio.turnos.forEach(turno => {
              // Calcular cuántos slots de 15 minutos ocupa este turno
              const duracionTurno = turno.duracion || DURACION_TURNO_MINUTOS;
              const slotsQueOcupa = Math.ceil(duracionTurno / DURACION_TURNO_MINUTOS);
              slotsOcupados += slotsQueOcupa;
            });
          }
          // Sumar los slots ocupados
          turnosOcupados += slotsOcupados;
          
          // Los slots restantes están disponibles para nuevos turnos
          const slotsLibresEnFranja = slotsDisponiblesEnFranja - slotsOcupados;
          turnosDisponibles += slotsLibresEnFranja;
        }
      });
    });

    // Agregar resultado para este día
    resultado.push({
      fecha: new Date(fechaActual),
      fechaFormateada: fechaActual.toLocaleDateString('es-AR'),
      diaSemana: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][diaSemana],
      diaSemanaCorto: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][diaSemana],
      esFeriado,
      turnosDisponibles,
      turnosOcupados,
      totalSlots,
      porcentajeOcupacion: totalSlots > 0 ? Math.round((turnosOcupados / totalSlots) * 100) : 0
    });

    // Avanzar al siguiente día
    fechaActual.setDate(fechaActual.getDate() + 1);
  }

  return resultado;
};