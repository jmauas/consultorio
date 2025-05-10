/**
 * Funciones de utilidad para manejar fechas y validaciones
 */

/**
 * Formatea una fecha en diferentes formatos
 * @param {Date|string} sfecha - Fecha a formatear
 * @param {boolean} hs - Incluir horas y minutos
 * @param {boolean} sec - Incluir segundos
 * @param {boolean} americana - Formato americano (YYYY-MM-DD)
 * @param {boolean} dia - Incluir el día de la semana
 * @returns {string} Fecha formateada
 */
export const formatoFecha = (sfecha, hs = false, sec = false, americana = false, dia = false, soloHora = false, sinAno = false) => {
  if (sfecha !== undefined) {
    let fh;
    try {
      fh = new Date(sfecha.toString().replace(/\s/, 'T'));
      if (fh.toString() === "Invalid Date") {
        fh = sfecha;
      }
    } catch {
      fh = sfecha;
    }
    
    let fhtxt = zfill(parseInt(fh.getDate()), 2) + '/' + zfill((parseInt(fh.getMonth()) + 1), 2);
    if (!sinAno) fhtxt += "/" + parseInt(fh.getFullYear());
    
    if (americana) {
      fhtxt = fechaAmericana(fhtxt);
    }
    
    if (hs) {
      fhtxt += ' ' + zfill(parseInt(fh.getHours()), 2) + ':' + zfill(parseInt(fh.getMinutes()), 2);
    }
    
    if (sec) {
      fhtxt += ':' + zfill(parseInt(fh.getSeconds()), 2);
    }
    
    if (dia) {
      fhtxt += ' ' + diaSemana(fh.getDay());
    }

    if (soloHora) {
      fhtxt = zfill(parseInt(fh.getHours()), 2) + ':' + zfill(parseInt(fh.getMinutes()), 2);
      if (sec) {
        fhtxt += ':' + zfill(parseInt(fh.getSeconds()), 2);
      }
    }
    
    return fhtxt;
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