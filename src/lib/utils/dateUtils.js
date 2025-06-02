/**
 * Funciones de utilidad para manejar fechas y validaciones
 */

/**
 * Formatea una fecha en diferentes formatos
 * @param {Date|string} sfecha - Fecha a formatear
 * @param {boolean} hs - Incluir horas y minutos
 * @param {boolean} sec - Incluir segundos
 * @param {boolean} americana - Formato americano (YYYY-MM-DD)
 * @param {boolean} diaSem - Incluir el día de la semana
 * @returns {string} Fecha formateada
 */
export const formatoFecha = (sfecha, hs = false, sec = false, americana = false, diaSem = false, soloHora = false, sinAno = false) => {
  if (sfecha !== undefined) {
    let fh;
    let fallbackMode = false;    
    try {
      // Mejor manejo para dispositivos iOS
      if (typeof sfecha === 'string') {
        // Normalizar el formato de fecha para iOS
        const normalizedDate = sfecha
          .toString()
          .replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1") // Convertir DD/MM/YYYY a YYYY-MM-DD
          .replace(/\s+/g, 'T');  // Reemplazar TODOS los espacios con T
        
        fh = new Date(normalizedDate);
      } else {
        fh = new Date(sfecha);
      }
      
      // Verificación adicional para iOS
      if (isNaN(fh.getTime())) {
        // Si aún falla, intentar con formato ISO explícito
        if (typeof sfecha === 'string' && sfecha.includes('/')) {
          const parts = sfecha.split(/[\/\s:]/);
          if (parts.length >= 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            const hours = parts.length > 3 ? parseInt(parts[3], 10) : 0;
            const minutes = parts.length > 4 ? parseInt(parts[4], 10) : 0;
            fh = new Date(year, month, day, hours, minutes);
          }
        }
        
        // Si sigue siendo inválido, usar una fecha por defecto
        if (isNaN(fh.getTime())) {
          console.warn('Fecha inválida, usando valor por defecto:', sfecha);
          fh = new Date(); // Usar fecha actual como fallback
          fallbackMode = true;
        }
      }
    } catch (error) {
      console.warn('Error al procesar fecha:', error);
      fh = new Date(); // Usar fecha actual como fallback
      fallbackMode = true;
    }
    
    try {
      // Verificar que fh sea un objeto Date válido antes de usar sus métodos
      if (!(fh instanceof Date) || isNaN(fh.getTime())) {
        fh = new Date(); // Asegurar que sea un Date válido
        fallbackMode = true;
      }
      
      // Si estamos en modo fallback y la fecha original era un string, intentar devolverlo formateado básicamente
      if (fallbackMode && typeof sfecha === 'string') {
        if (sfecha.includes('-')) {
          const parts = sfecha.split('-');
          if (parts.length >= 3) {
            const year = parts[0];
            const month = parts[1];
            const day = parts[2].split(' ')[0]; // Ignorar la hora si existe
            return `${zfill(day, 2)}/${zfill(month, 2)}/${zfill(year, 2)}`; // Devolver en formato DD/MM/YYYY
          }
        }
        return sfecha; // Devolver el string original si no pudimos parsearlo
      }
      
      // FORMATEO EXPLÍCITO - FUNCIONA EN TODAS LAS PLATAFORMAS
      // A partir de aquí fh es un objeto Date válido
      const dia = zfill(fh.getDate(), 2);
      const mes = zfill((fh.getMonth() + 1), 2);
      const anio = fh.getFullYear();
      
      let fhtxt = '';
      
      // Crear el formato de fecha manualmente para evitar problemas de plataforma
      // Obtener la hora en zona horaria -3 (America/Argentina/Buenos_Aires)
      fh = new Date(fh.toLocaleString("en-US", {timeZone: "America/Argentina/Buenos_Aires"}));
      if (soloHora) {
        fhtxt = zfill(fh.getHours(), 2) + ':' + zfill(fh.getMinutes(), 2);
        if (sec) {
          fhtxt += ':' + zfill(fh.getSeconds(), 2);
        }
        return fhtxt;
      }
      if (americana) {
        fhtxt = anio + '-' + mes + '-' + dia;
      } else {
        fhtxt = dia + '/' + mes;
        if (!sinAno) fhtxt += '/' + anio;
      }
      
      if (hs) {
        fhtxt += ' ' + zfill(fh.getHours(), 2) + ':' + zfill(fh.getMinutes(), 2);
        if (sec) {
          fhtxt += ':' + zfill(fh.getSeconds(), 2);
        }
      }
      
      if (diaSem) {
        fhtxt += ' ' + diaSemana(fh.getDay());
      }
      
      return fhtxt;
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return typeof sfecha === 'string' ? sfecha : '01/01/1900';
    }
  } else {
    return '01/01/1900';
  }
};

/**
 * Alias de formatoFecha para mantener compatibilidad
 * @param {Date|string} fecha - Fecha a formatear
 * @param {boolean} conHora - Incluir horas y minutos
 * @param {boolean} conSegundos - Incluir segundos
 * @param {boolean} formatoAmericano - Formato americano (YYYY-MM-DD)
 * @param {boolean} conDia - Incluir el día de la semana
 * @returns {string} Fecha formateada
 */
export const formatearFecha = (fecha, conHora = false, conSegundos = false, formatoAmericano = false, conDia = false) => {
  return formatoFecha(fecha, conHora, conSegundos, formatoAmericano, conDia);
};

/**
 * Devuelve el nombre del día de la semana
 * @param {number} dia - Número del día (0-6, donde 0 es domingo)
 * @returns {string} Nombre del día
 */
export const diaSemana = (dia) => {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[dia] || '';
};

/**
 * Convierte una fecha en formato DD/MM/YYYY a formato YYYY-MM-DD
 * @param {string} f - Fecha en formato DD/MM/YYYY
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const fechaAmericana = (f) => {
  const ano = f.substring(6, 10) * 1;
  const mes = f.substring(3, 5) * 1;
  const dia = f.substring(0, 2) * 1;
  return `${zfill(ano, 4)}-${zfill(mes, 2)}-${zfill(dia, 2)}`;
};

/**
 * Valida si una fecha es válida
 * @param {Date} d - Fecha a validar
 * @returns {boolean} true si es una fecha válida
 */
export const fechaValida = (d) => {
  if (Object.prototype.toString.call(d) === "[object Date]") {
    return !isNaN(d.getTime());
  }
  return false;
};

/**
 * Rellena un número con ceros a la izquierda
 * @param {number} number - Número a rellenar
 * @param {number} width - Ancho deseado
 * @param {number} deci - Decimales (opcional)
 * @returns {string} Número con ceros a la izquierda
 */
export const zfill = (number, width, deci) => {
  let numberOutput = Math.abs(number);
  
  if (deci !== undefined) {
    numberOutput = Number.parseFloat(numberOutput).toFixed(deci).toString();
  }
  
  const length = numberOutput.toString().length;
  const zero = "0";
  
  if (width <= length) {
    if (number < 0) {
      return ("-" + numberOutput.toString());
    } else {
      return numberOutput.toString();
    }
  } else {
    if (number < 0) {
      return ("-" + (zero.repeat(width - length - 1)) + numberOutput.toString());
    } else {
      return zero.repeat(width - length) + numberOutput.toString();
    }
  }
};

/**
 * Verifica si un texto es un número válido
 * @param {string} txt - Texto a verificar
 * @returns {boolean} true si es un número válido
 */
export const esNumero = (txt) => {
  if (txt === undefined) {
    txt = '';
  }
  
  txt = txt.toString();
  const num = txt.replaceAll(',', '.');
  
  return num !== '' && !isNaN(num);
};

/**
 * Formatea un número con separadores de miles
 * @param {number} valor - Valor a formatear
 * @param {number} deci - Cantidad de decimales
 * @returns {string} Número formateado
 */
export const formatoSepMiles = (valor, deci = 0) => {
  valor = Number(valor);
  
  if (isNaN(valor)) {
    valor = 0;
  }
  
  return new Intl.NumberFormat("de-DE", {
    style: 'decimal',
    minimumFractionDigits: deci,
    maximumFractionDigits: deci
  }).format(valor);
};

/**
 * Valida un email
 * @param {string} mail - Email a validar
 * @returns {boolean} true si es un email válido
 */
export const validarEmail = (mail) => {
  if (!mail) return false;
  
  const validEmail = /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/;
  return validEmail.test(mail);
};

/**
 * Obtiene la fecha actual en formato ISO
 * @returns {string} Fecha actual en formato ISO
 */
export const obtenerFechaActual = () => {
  return new Date().toISOString();
};

/**
 * Suma días a una fecha
 * @param {Date} fecha - Fecha base
 * @param {number} dias - Días a sumar
 * @returns {Date} Nueva fecha
 */
export const sumarDias = (fecha, dias) => {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
};

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {Date} fecha1 - Primera fecha
 * @param {Date} fecha2 - Segunda fecha
 * @returns {number} Diferencia en días
 */
export const diferenciaDias = (fecha1, fecha2) => {
  const diferenciaMs = Math.abs(fecha2 - fecha1);
  return Math.round(diferenciaMs / (1000 * 60 * 60 * 24));
};

/**
 * Formatea una duración en minutos a formato de horas y minutos
 * @param {number} minutos - Duración en minutos
 * @returns {string} Duración formateada
 */
export const formatoDuracion = (minutos) => {
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  
  if (horas > 0) {
    return `${horas}h ${mins > 0 ? mins + 'm' : ''}`;
  } else {
    return `${mins}m`;
  }
};

/**
 * Calcula un array con los próximos N días a partir de una fecha
 * @param {Date|string} fechaInicio - Fecha de inicio (por defecto es hoy)
 * @param {number} numeroDias - Número de días a calcular
 * @param {boolean} incluirFinDeSemana - Si es false, excluye sábados y domingos
 * @returns {Array} Array de objetos de fecha con formato {fecha, diaSemana, esHoy}
 */
export const calcularProximosDias = (fechaInicio = new Date(), numeroDias = 7, incluirFinDeSemana = true) => {
  const resultado = [];
  const fechaActual = new Date();
  const hoy = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate());
  
  let fecha = new Date(fechaInicio);
  if (typeof fechaInicio === 'string') {
    fecha = new Date(fechaInicio);
  }
  
  // Asegurarse de que solo tenemos la fecha sin la hora
  fecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  
  let diasAgregados = 0;
  let diasIterados = 0;
  
  while (diasAgregados < numeroDias && diasIterados < numeroDias * 2) {
    const diaSemanaNumero = fecha.getDay(); // 0 es domingo, 6 es sábado
    const esFinDeSemana = diaSemanaNumero === 0 || diaSemanaNumero === 6;
    
    if (incluirFinDeSemana || !esFinDeSemana) {
      resultado.push({
        fecha: new Date(fecha),
        diaSemana: diaSemana(diaSemanaNumero),
        diaSemanaCorto: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][diaSemanaNumero],
        diaSemanaNumero,
        esHoy: fecha.getTime() === hoy.getTime(),
        esFinDeSemana,
        fechaFormateada: formatoFecha(fecha, false, false, false, false)
      });
      diasAgregados++;
    }
    
    fecha.setDate(fecha.getDate() + 1);
    diasIterados++;
  }
  
  return resultado;
};

export const sonMismaFecha = (fecha1, fecha2) => {
  return (
      fecha1.getDate() === fecha2.getDate() &&
      fecha1.getMonth() === fecha2.getMonth() &&
      fecha1.getFullYear() === fecha2.getFullYear()
  )
}