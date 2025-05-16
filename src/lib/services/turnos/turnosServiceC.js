
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
  const slotDuration = 15; // minutes
  
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