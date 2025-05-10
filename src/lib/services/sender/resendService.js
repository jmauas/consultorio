"use server";
import { Resend } from 'resend';
import { obtenerConfig } from '@/lib/services/configService.js';
import { formatoFecha } from '@/lib/utils/dateUtils';
import { createEvent } from 'ics';
import { ValidarEmail } from "@/lib/utils/mailsUtils.js";

const config = await obtenerConfig();

const resendApiKey = process.env.RESEND_API_KEY;
const resendRte = process.env.RESEND_RTE || 'no-reply@yourdomain.com'; // Fallback default

// Verificación para debugging
if (!resendApiKey) {
  console.warn("ADVERTENCIA: RESEND_API_KEY no está definida en las variables de entorno");
}

if (!resendRte) {
  console.warn("ADVERTENCIA: RESEND_RTE no está definida en las variables de entorno");
}

// Solo crear la instancia de Resend si existe una API key
const resend = resendApiKey ? new Resend(resendApiKey) : null;


export const enviarMailConfTurno = async (turno) => {   
    const mail = ValidarEmail(turno.paciente.email);
    if (mail && mail !== '') {
        // Enviar el correo usando el servicio de Resend
        const html = await htmlMensajeConfTurno(turno);
        const ics = await generarArchivoICS(turno);
        const text = await textoMailConfTurno(turno); 
        const result = await enviarMail(
            mail,
            `Recordatorio Turno ${formatoFecha(turno.desde, true, false, false, true)} - ${config.nombreConsultorio}`,
            html,
            ics,
            text,
        );
        console.log('Resultado del envío de correo:', result);
    }
    return true;
}

export const enviarMail = async (email, asunto, mensaje, ics = null, text = null) => {
    try {
        if (!resend) {
            throw new Error('RESEND_API_KEY no está configurada. No se puede enviar el correo.');
        }
        const prop = {
            from: resendRte,
            to: email,
            subject: asunto,
            html: mensaje,
            replyTo: config.mail || resendRte,
        }
        if (ics) {
            // Mejorar el manejo del archivo ICS para mayor compatibilidad con clientes de correo
            prop.attachments = [
                {
                    filename: 'turno.ics',
                    content: ics,
                    contentType: 'text/calendar; charset=utf-8; method=REQUEST; component=VEVENT',
                    contentDisposition: 'attachment',
                    encoding: 'base64'
                }
            ];
            
            // Encabezados específicos para mejorar la integración con calendarios
            prop.headers = {
                'Content-class': 'urn:content-classes:calendarmessage',
                'Content-ID': `<calendar_message_${Date.now()}@${config.dominio || 'turnos.app'}>`,
                'X-Mailer': 'Sistema de Turnos',
                'X-MS-TNEF-Correlator': `calendar-event-${Date.now()}@${config.dominio || 'turnos.app'}`,
                'X-MS-Exchange-Calendar-Series-Instance-ID': `calendar-event-${Date.now()}@${config.dominio || 'turnos.app'}`,
                'X-Calstart': new Date(Date.now()).toISOString(),
                'X-CalId': `calendar-event-${Date.now()}@${config.dominio || 'turnos.app'}`,
                'X-Calendar-Event-Id': `event-${Date.now()}`,
                'X-Microsoft-Disallow-Audio-Conferencing': 'True',
                'X-Microsoft-Is-Metered-Conference': 'False',
                'X-Microsoft-Is-From-Calendar': 'True'
            }
            
            // Agregar un tipo de contenido mixto para mejor compatibilidad
            prop.text = text;
            prop.calendar = { 
                method: 'REQUEST',
                content: ics,
                encoding: 'base64',
                contentType: 'text/calendar; charset=utf-8; method=REQUEST; component=VEVENT',
                contentDisposition: 'attachment',
                filename: 'turno.ics',
                contentId: `<calendar_message_${Date.now()}@${config.dominio || 'turnos.app'}>`,
            };
        } else if (text) {
            prop.text = text;
        }
        
        const res = await resend.emails.send(prop);
        if (res && res.error & res.error != '') {
            console.log(new Date().toLocaleString() + ' - Error al Enviar el Mail:', res.error.message, email);
        } else {
            console.log(new Date().toLocaleString() + ' -  Email enviado:', email);
        }
        return res;
    } catch (error) {
        console.error(new Date().toLocaleString() + '  -  Error al enviar email:', error);
        throw error;
    }
}


export const htmlMensajeConfTurno = async (turno) => {
    // Construir enlace de cancelación si existe token
    const enlaceCancelacion = turno.token 
        ? `${config.urlApp}/turnos/cancelar/${turno.token}`
        : '';

    const htmlMsg = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmación de Turno</title>
        <style>
            body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            }
            .header {
            background-color: #FFEBCC; /* Cambiado a naranja claro */
            color: black; /* Cambiado a negro */
            padding: 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
            }
            .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 0 0 10px 10px;
            border: 1px solid #ddd;
            }
            .greeting {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            color: black; /* Cambiado a negro */
            }
            .confirmation {
            font-size: 22px;
            font-weight: bold;
            color: black; /* Cambiado a negro */
            margin-bottom: 20px;
            }
            .details {
            background-color: white;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .detail-item {
            font-size: 18px;
            margin-bottom: 10px;
            padding-left: 10px;
            border-left: 4px solid #FFEBCC; /* Cambiado a naranja claro */
            color: black; /* Texto negro */
            }
            .highlight {
            font-weight: normal; /* Cambiado a normal */
            color: black; /* Cambiado a negro */
            }
            .reminder {
            font-size: 20px;
            font-weight: bold;
            color: black; /* Negro */
            margin: 20px 0;
            background-color: #FFEBCC; /* Naranja claro */
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            }
            .footer {
            font-size: 18px;
            margin-top: 30px;
            text-align: center;
            }
            .emoji {
            font-size: 24px;
            vertical-align: middle;
            margin-right: 5px;
            }
            .info-box {
            font-size: 18px;
            text-align: center;
            margin: 25px 0;
            background-color: #FFEBCC; /* Naranja claro */
            padding: 15px;
            border-radius: 10px;
            color: black; /* Texto negro */
            }
            .cancel-button {
            display: block;
            margin: 25px auto;
            padding: 12px 25px;
            background-color: #ff6b6b;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            text-align: center;
            width: fit-content;
            }
            .cancel-button:hover {
            background-color: #ff5252;
            }
            .cancel-notice {
            font-size: 16px;
            text-align: center;
            color: #666;
            margin-bottom: 10px;
            }
        </style>
        </head>
        <body>
        <div class="header">
            <h1>Confirmación de Turno</h1>
        </div>
        <div class="content">
            <div class="greeting">
            <span class="emoji">👋</span> Hola ${turno.paciente.nombre}!
            </div>
            
            <div class="confirmation">
            <span class="emoji">👍</span> Desde ${config.nombreConsultorio}, te confirmamos tu turno agendado.
            </div>
            
            <h2><span class="emoji">✅</span> Detalles del turno:</h2>
            
            <div class="details">
            <div class="detail-item">
                <span class="emoji">🧑‍⚕️</span> <strong>Paciente:</strong> ${turno.paciente.nombre} ${turno.paciente.apellido || ''}
            </div>
            
            <div class="detail-item">
                <span class="emoji">📅</span> <strong>Fecha del Turno:</strong> ${formatoFecha(turno.desde, true, false, false, true)}
            </div>
            
            <div class="detail-item">
                <span class="emoji">🦷</span> <strong>Tipo de Turno:</strong> ${turno.servicio}
            </div>
            
            <div class="detail-item">
                <span class="emoji">💉</span> <strong>Profesional:</strong> ${turno.doctor.nombre}
            </div>
            
            <div class="detail-item">
                <span class="emoji">🏥</span> <strong>Domicilio:</strong> ${turno.consultorio.direccion || config.domicilio}
            </div>
            
            <div class="detail-item">
                <span class="emoji">📧</span> <strong>Email de contacto:</strong> ${turno.consultorio.email || config.mail}
            </div>

            <div class="detail-item">
                <span class="emoji">📱</span> <strong>Celular contacto:</strong> ${turno.consultorio.telefono || config.celular}
            </div>
            </div>
            
            <div class="reminder">
            <span class="emoji">⏰</span> Recordá llegar 5 minutos antes de tu turno
            </div>
            
            <div class="info-box">
            <strong>Por favor confirma tu asistencia respondiendo a este mensaje</strong>
            </div>

            <div class="info-box">
                <span class="emoji">📅</span> <strong>Podes agregar este turno a tu calendario abriendo el archivo adjunto "turno.ics"</strong>
            </div>
            
            ${turno.token ? `
            <div class="cancel-notice">
                <p>Si necesitas cancelar tu turno, por favor utiliza el siguiente enlace:</p>
            </div>
            <a href="${enlaceCancelacion}" class="cancel-button">
                <span class="emoji">❌</span> Cancelar Turno
            </a>
            ` : ''}
            
            <div class="footer">
            <p>Gracias, y que tengas buen día! <span class="emoji">👋👋👋</span></p>
            </div>
        </div>
        </body>
        </html>
    `;
    return htmlMsg;
}

export const textoMailConfTurno = async (turno) => {
    const enlaceCancelacion = turno.token 
        ? `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/cancelar-turno/${turno.token}`
        : '';

    const textoMsg = `👋 Hola ${turno.paciente.nombre}!
  
  👍 Desde ${config.nombreConsultorio}, te confirmamos tu turno agendado.
  
  ✅ DETALLES DEL TURNO:
  -----------------------------------------
  
  🧑‍⚕️ Paciente: ${turno.paciente.nombre} ${turno.paciente.apellido || ''}
  
  📅 Fecha del Turno: ${formatoFecha(turno.desde, true, false, false, true)}
  
  🦷 Tipo de Turno: ${turno.servicio}
  
  💉 Profesional: ${turno.doctor.nombre}
  
  🏥 Domicilio: ${turno.consultorio.direccion || config.domicilio}
  
  📧 Email de contacto: ${turno.consultorio.email || config.mail}

  📱 Celular Contacto: ${turno.consultorio.telefono || config.celular}
  
  -----------------------------------------
  
  ⏰ RECORDÁ LLEGAR 5 MINUTOS ANTES DE TU TURNO
  
  ❗ POR FAVOR CONFIRMA TU ASISTENCIA RESPONDIENDO A ESTE MENSAJE ❗
  
  📅 Podes agregar este turno a tu calendario abriendo el archivo adjunto "turno.ics"
  
  ${turno.token ? `❌ Si necesitas cancelar tu turno, por favor utiliza el siguiente enlace: ${enlaceCancelacion}` : ''}
  
  👋👋👋 Gracias, y que tengas buen día!
  `;
  
    return textoMsg;
  }


// Función para generar archivo ICS (iCalendar)
export const generarArchivoICS = async (turno) => {
    return new Promise((resolve, reject) => {
      // Convertir fecha y hora de inicio a formato array para la librería ICS
      const fechaInicio = new Date(turno.desde);
      const fechaFin = new Date(turno.hasta || new Date(fechaInicio.getTime() + 30 * 60000));
      
      // Generar ID único para el evento (ayuda a prevenir duplicados)
      const eventoId = `turno-${turno.id || Math.random().toString(36).substring(2, 15)}@${config.dominio || 'turnos.app'}`;
      
      // La librería ICS usa meses 1-12 en lugar de 0-11 de JavaScript
      const inicio = [
        fechaInicio.getFullYear(),
        fechaInicio.getMonth() + 1,
        fechaInicio.getDate(),
        fechaInicio.getHours(),
        fechaInicio.getMinutes()
      ];
      
      const fin = [
        fechaFin.getFullYear(),
        fechaFin.getMonth() + 1,
        fechaFin.getDate(),
        fechaFin.getHours(),
        fechaFin.getMinutes()
      ];

      const url = `${config.url}/turnos/${turno.id}`;
      
      // Mejorar la información del evento para aumentar compatibilidad
      const evento = {
        uid: eventoId,
        sequence: 0,
        start: inicio,
        end: fin,
        startInputType: 'local', // Indica que la hora es local respecto a la zona horaria
        endInputType: 'local',
        startOutputType: 'local',
        endOutputType: 'local',
        title: `Turno: ${config.nombreConsultorio} - ${turno.servicio}`,
        location: turno.consultorio.direccion || config.domicilio,
        description: `Paciente: ${turno.paciente.nombre} ${turno.paciente.apellido || ''}\nProfesional: ${turno.doctor.nombre}\nTipo: ${turno.servicio}\n\nPor favor, confirme su asistencia a través del siguiente enlace.\n\n${url}`,
        //url: url,
        status: 'CONFIRMED',
        busyStatus: 'BUSY',
        method: 'REQUEST',
        organizer: { name: config.nombreConsultorio, email: config.mail },
        attendees: [
          { 
            name: turno.paciente.nombre + ' ' + (turno.paciente.apellido || ''), 
            email: turno.paciente.email, 
            rsvp: true, 
            partstat: 'NEEDS-ACTION',  // Solicita acción del destinatario
            role: 'REQ-PARTICIPANT',
            cutype: 'INDIVIDUAL',
          }
        ],
        alarms: [
          { action: 'display', trigger: { hours: 24, before: true }, description: 'Recordatorio: Tienes un turno mañana' },
          { action: 'display', trigger: { hours: 1, before: true }, description: 'Recordatorio: Tienes un turno en 1 hora' }
        ],
        productId: '-//Sistema de Turnos//App v1.0//ES',  // Identificador del software que genera el ICS
        created: [
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          new Date().getDate(),
          new Date().getHours(),
          new Date().getMinutes()
        ],
        lastModified: [
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          new Date().getDate(),
          new Date().getHours(),
          new Date().getMinutes()
        ],
        transp: 'OPAQUE',  // Indica que el evento es privado
      };
      
      createEvent(evento, (error, value) => {
        if (error) {
          reject(error);
        } else {
          resolve(value);
        }
      });
    });
  }


  export const enviarMailRecuperarPass = async (email, token) => {
    // Crear la URL de autenticación con el token (y asegurar que incluya source=email-link)
    const signinUrl = `${config.urlApp}/api/auth/callback/email?token=${token}&email=${encodeURIComponent(email)}&source=email-link`;              
    // Preparar el mensaje HTML con el enlace
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Enlace de acceso a la aplicación</h2>
        <p>Has solicitado iniciar sesión en nuestra aplicación. Haz clic en el siguiente enlace para acceder:</p>
        <p style="margin: 30px 0; text-align: start;">
          <a href="${signinUrl}" style="font-size: 24px; font-weight: bold; color: black; background-color: white; padding: 30px 30px; text-decoration: none; border-radius: 20px; display: inline-block;">
            Iniciar sesión
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">Este enlace expirará en 15 minutos y solo puede usarse una vez.</p>
        <p style="color: #666; font-size: 14px;">Si no solicitaste este correo, podés ignorarlo de forma segura.</p>
        <hr style="margin: 20px 0; border: 0; height: 1px; background-color: #eee;" />        
      </div>
    `;
          
    // Enviar el correo usando el servicio de Resend
    const result = await enviarMail(
      email,
      "Tu Enlace de Acceso",
      htmlMessage
    );
    console.log('Resultado del envío de correo:', result);
    return result;

  }


  export const enviarMailResetPass = async (email, token) => {
    // Crear la URL de recuperación de contraseña
    const resetUrl = `${config.urlApp || 'http://localhost:3000'}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    // Preparar el correo electrónico
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 1px solid #eee; padding-bottom: 10px;">Recuperación de Contraseña</h2>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Restablecer Contraseña
          </a>
        </p>
        <p>Este enlace expirará en 15 minutos.</p>
        <p>Si no has solicitado restablecer tu contraseña, podés ignorar este mensaje.</p>
        <p style="margin-top: 40px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px;">
          Este es un mensaje automático, por favor no respondas a este correo.
        </p>
      </div>
    `;
    
    // Enviar el correo electrónico
    try {
      const result = await enviarMail(
        email,
        'Recuperación de Contraseña',
        htmlMessage
      );   
      console.log('Resultado del envío de correo:', result);
      return result;
    } catch (error) {
      console.error('Error al enviar el correo de recuperación de contraseña:', error);
      throw error;
    }
  }