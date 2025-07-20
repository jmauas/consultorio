"use server";
import { formatoFecha } from '@/lib/utils/dateUtils';
import { obtenerConfig, obtenerCuentasWhatsapp, obtenerUrlApp } from '@/lib/services/configService.js';
import { getTurnoById } from '@/lib/services/turnos/turnosService';

const config = await obtenerConfig();
const cuentas = await obtenerCuentasWhatsapp();
const urlApp = await obtenerUrlApp();
   
/**
 * Servicio para el envío de mensajes por WhatsApp
 */

export const postMessage = async (numero, mensaje, media, url, token) => {
  try {
      let data = {
          numero,
          mensaje,
          media,
          token
      };

      data = await fetch(url, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
      });
      const res = await data.json();
      return res;
  } catch (error) {
      console.error('Error:', error);
      return false
  }
}


export const postAdjunto = async (cel, adj, ruta, externa, urlAdj) => {
  try {
      let media = '';
      let res = '';
      if (!externa === true) {
          // let urlWa = url;
          // urlWa = urlWa.substring(0, urlWa.lastIndexOf('/'))+'/upload';
          // const formData = new FormData();
          // const filePath = path.join(root, '../', ruta, adj);
          // formData.append('myFile', fs.createReadStream(filePath));
          // const data = await fetch(urlWa, {
          //     method: 'POST',
          //     body: formData,
          //     headers: {               
          //         ...formData.getHeaders()
          //     },
          // });
          //res = await data.json();
          media = [adj]
      } else {
          media = [urlAdj];
      }        
      res = await validarYEnviarWhatsapp(cel, ``, media)
      const ext = adj.substring(adj.lastIndexOf('.')+1);
      if (ext === 'html') {
         await validarYEnviarWhatsapp(cel, `Para ver el Diseño, hacé click en el siguiente Link: 
          ${externa === true ? urlAdj : `${urlApp}/api/files/scans/${adj}`}`, '')
      }
      return res;
  } catch (error) {
      console.error('Error:', error);
      return false
  }
}


/**
 * Envía un recordatorio de turno al paciente
 * @param {object} turno - Datos del turno
 * @returns {Promise<object>} - Resultado de la operación
 */
export async function enviarRecordatorioTurno(turno, cambioEstado, confirmacion) {
  try {
    if (!turno) {
      throw new Error('Datos de turno insuficientes');
    }
    
    const msg = cambioEstado === true
      ? await textoCambioEstadoTurno(turno)
      : confirmacion === true
        ? await textoMensajeRecordatorioTurno(turno, confirmacion)  
        : await textoMensajeConfTurno(turno, cambioEstado, confirmacion);

    console.log('Mensaje a enviar:', msg);
    // Normalizar número de celular
    const celularNormalizado = normalizarNumeroCelular(turno.paciente.celular);
    if (!celularNormalizado) {
      throw new Error('Número de celular inválido');
    }
    console.log('cuentas', cuentas);
    if (cuentas.length === 0) {
      throw new Error('No hay cuentas de WhatsApp disponibles para enviar el mensaje');
    }
    const { url, token, nombre } = cuentas[0];

    const res = await postMessage(celularNormalizado, msg, '', `${url}/${nombre}`, token);

    return res
    
  } catch (error) {
    console.error('Error al enviar recordatorio de turno:', error);
    return {
      ok: false,
      error: error.message || 'Error desconocido al enviar recordatorio',
    };
  }
}

export const textoMensajeConfTurno = async (turno, confirmacion) => {
  const enlaceCancelacion = turno.token 
  ? `${urlApp}/turnos/cancelar/${turno.token}`
  : '';
  const enlaceConfirmacion = turno.token && confirmacion && confirmacion === true
  ? `${urlApp}/turnos/confirmar/${turno.token}`
  : '';
//   let msg = `Hola ${turno.paciente.nombre}. 👋
// Desde *${config.nombreConsultorio}*, te confirmamos tu Turno Agendado. 👍

// ✔️ Te Detallamos los datos:
// 🧑‍⚕️ Paciente: ${turno.paciente.nombre} ${turno.paciente.apellido || ''}.
// 📅 Fecha del Turno: *${formatoFecha(turno.desde, true, false, false, true)}*.
// 🦷 Tipo Turno: ${turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado'}.
// 🕧 Duración: ${turno.duracion || 'No especificada'} minutos.
// 💉 Profesional: ${turno.doctor.nombre}.
// 🏥 Domicilio: *${turno.consultorio.direccion || config.domicilio}*.
// 📱 Celular: ${turno.consultorio.telefono || config.telefono}.

// Recordá llegar 5 minutos antes.

// ${enlaceConfirmacion != '' &&
//   `✅ Para confirmar tu asistencia, por favor hacé clic en este Link:
// ${enlaceConfirmacion}`}

// ❌ Si no podés asistir, por favor cancelá tu turno desde el siguiente link: 
// ${enlaceCancelacion}

// Gracias, y que tengas buen día! 👋👋👋.
//       `;
let msg = `Hola ${turno.paciente.nombre}. 👋
Desde *${config.nombreConsultorio}*, te confirmamos tu Turno Agendado. 👍

🏥 Domicilio: *${turno.consultorio.direccion || config.domicilio}*.

Recordá llegar 5 minutos antes.

❌ Si no podés asistir, por favor cancelá tu turno desde el siguiente link: 
${enlaceCancelacion}

Gracias, te esperamos 🩷🦷
      `;
  return msg
}

export const textoCambioEstadoTurno = async (turno) => {
     
//   let msg = `Hola ${turno.paciente.nombre}. 👋
// Desde *${config.nombreConsultorio}*, te notificamos el cambio del estado de tu turno a *${turno.estado.toUpperCase()}* ‼️

// ✅ Te Recordamos los datos del Turno Modificado:
// 🧑‍⚕️ Paciente: ${turno.paciente.nombre} ${turno.paciente.apellido || ''}.
// 📅 Fecha del Turno: *${formatoFecha(turno.desde, true, false, false, true)}*.
// 🦷 Tipo Turno: ${turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado'}.
// 🕧 Duración: ${turno.duracion || 'No especificada'} minutos.
// 💉 Profesional: ${turno.doctor.nombre}.
// 🏥 Domicilio: *${turno.consultorio.direccion || config.domicilio}*.
// 📱 Celular: ${turno.consultorio.telefono || config.telefono}.

// Gracias, y que tengas buen día! 👋👋👋.
//       `;
  let msg = `Hola ${turno.paciente.nombre}. 👋
Desde *${config.nombreConsultorio}*, te notificamos el cambio del estado de tu turno a *${turno.estado.toUpperCase()}* ‼️
📅 Fecha del Turno: *${formatoFecha(turno.desde, true, false, false, true)}*.

Saludos🩷🦷.
      `;
  return msg
}

export const textoMensajeRecordatorioTurno = async (turno, confirmacion) => {
  const enlaceCancelacion = turno.token 
  ? `${urlApp}/turnos/cancelar/${turno.token}`
  : '';
  const enlaceConfirmacion = turno.token && confirmacion && confirmacion === true
  ? `${urlApp}/turnos/confirmar/${turno.token}`
  : '';
//   let msg = `Hola ${turno.paciente.nombre}. 👋
// Desde *${config.nombreConsultorio}*, te confirmamos tu Turno Agendado. 👍

// ✔️ Te Detallamos los datos:
// 🧑‍⚕️ Paciente: ${turno.paciente.nombre} ${turno.paciente.apellido || ''}.
// 📅 Fecha del Turno: *${formatoFecha(turno.desde, true, false, false, true)}*.
// 🦷 Tipo Turno: ${turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado'}.
// 🕧 Duración: ${turno.duracion || 'No especificada'} minutos.
// 💉 Profesional: ${turno.doctor.nombre}.
// 🏥 Domicilio: *${turno.consultorio.direccion || config.domicilio}*.
// 📱 Celular: ${turno.consultorio.telefono || config.telefono}.

// Recordá llegar 5 minutos antes.

// ${enlaceConfirmacion != '' &&
//   `✅ Para confirmar tu asistencia, por favor hacé clic en este Link:
// ${enlaceConfirmacion}`}

// ❌ Si no podés asistir, por favor cancelá tu turno desde el siguiente link: 
// ${enlaceCancelacion}

// Gracias, te esperamos 🩷🦷
//       `;
let msg = `Hola ${turno.paciente.nombre}. 👋
Desde *${config.nombreConsultorio}*, te recordamos que tenes turno odontológico. 👍
📅 Fecha del Turno: *${formatoFecha(turno.desde, true, false, false, true)}*.
💉 Profesional: ${turno.doctor.nombre}.

🏥 Domicilio: *${turno.consultorio.direccion || config.domicilio}*.

${enlaceConfirmacion != '' &&
  `✅ Para confirmar tocá aquí:
${enlaceConfirmacion}`}

❌ Para cancelár y/o sacar uno nuevo tocá aquí: 
${enlaceCancelacion}

Saludos🩷🦷.
`;
  return msg
}

/**
 * Normaliza un número de celular para asegurar que incluya el código de país correcto
 * @param {string} celular - Número de celular
 * @returns {string} - Número de celular normalizado
 */
function normalizarNumeroCelular(celular) {
  // Eliminar espacios, paréntesis y guiones
  let numero = celular.replace(/[\s\(\)\-]/g, '');
  
  // Si comienza con '+', quitar el '+'
  if (numero.startsWith('+')) {
    numero = numero.substring(1);
  }
  
  if (numero == '') return false;
  numero = numero.toString();
  numero = numero.toString().replace(/\D/g, '')//QUITO CUALQUIER COSA QUE NO SEA NUMERO
  if (numero.length < 8) return false;
  if (numero.length === 8) numero = '54911' + numero;
  //if (numero.substr(0, 2) == '15') numero = '54911' + numero.substr(2);
  numero = numero.replace('0011', '11')
  numero = numero.replace('011', '11')
  if (numero.substr(0, 2) != '54') numero = '54' + numero;
  if (numero.substr(0, 3) != '549') numero = '549' + numero.substr(2);
  return numero;
}


export const obtenerMensajeTurno = async (id) => {
  const turno = await getTurnoById(id);
  const msg = textoMensajeConfTurno(turno);
  return msg;
}


