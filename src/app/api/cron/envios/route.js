import { NextResponse } from 'next/server';
import { obtenerConfig } from '@/lib/services/configService.js';
const { prisma } = require('@/lib/prisma');
import { enviarRecordatorioTurno } from '@/lib/services/sender/whatsappService';
import { enviarMailConfTurno } from "@/lib/services/sender/resendService";

export async function GET(request) {
  try {
    // Verificar que la request venga de Vercel Cron o de un origen autorizado
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!process.env.CRON_SECRET) {
      console.error('CRON_SECRET no está configurado');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    if (authHeader !== expectedAuth) {
      console.error('Intento de acceso no autorizado al cron job');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const timestamp = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
    console.log(`${timestamp} - Ejecutando envíos automáticos`);

    const config = await obtenerConfig();
    const { envio, horaEnvio, diasEnvio, envioMail, horaEnvioMail, diasEnvioMail } = config;

    const results = {
      whatsapp: { executed: false, count: 0, errors: [] },
      email: { executed: false, count: 0, errors: [] }
    };

    // Verificar si es la hora correcta para WhatsApp
    if (envio && envio === true) {
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
      const [hour, minute] = horaEnvio.split(':');
      const cronHour = parseInt(hour);
      const cronMinute = parseInt(minute);
      
      // Permitir un margen de ±5 minutos para ejecutar
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (currentHour === cronHour && Math.abs(currentMinute - cronMinute) <= 5) {
        try {
          const turnos = await getTurnos(diasEnvio);
          results.whatsapp.executed = true;
          results.whatsapp.count = turnos.length;
            for (const turno of turnos) {
            try {
              const res = await enviarRecordatorioTurno(turno);
              console.log(`${timestamp} - WhatsApp enviado: ${res}`);
              // Esperar un breve tiempo entre envíos
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
              console.error(`Error al enviar WhatsApp a turno ${turno.id}: ${error}`);
              results.whatsapp.errors.push(`Turno ${turno.id}: ${error.message}`);
            }
          }
        } catch (error) {
          console.error('Error en envío WhatsApp:', error);
          results.whatsapp.errors.push(error.message);
        }
      }
    }

    // Verificar si es la hora correcta para Email
    if (envioMail && envioMail === true) {
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
      const [hour, minute] = horaEnvioMail.split(':');
      const cronHour = parseInt(hour);
      const cronMinute = parseInt(minute);
      
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      if (currentHour === cronHour && Math.abs(currentMinute - cronMinute) <= 5) {
        try {
          const turnos = await getTurnos(diasEnvioMail);
          results.email.executed = true;
          results.email.count = turnos.length;
            for (const turno of turnos) {
            try {
              const res = await enviarMailConfTurno(turno);
              console.log(`${timestamp} - Email enviado: ${res}`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
              console.error(`Error al enviar email a turno ${turno.id}: ${error}`);
              results.email.errors.push(`Turno ${turno.id}: ${error.message}`);
            }
          }
        } catch (error) {
          console.error('Error en envío Email:', error);
          results.email.errors.push(error.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    console.error('Error en cron job:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

const getTurnos = async (diasEnvio) => {
  const hoy = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
  hoy.setDate(hoy.getDate() + 1);
  const desde = new Date(hoy);
  desde.setHours(0, 0, 0, 0);
  hoy.setDate(hoy.getDate() + (Number(diasEnvio) - 1));
  const hasta = new Date(hoy);
  hasta.setHours(23, 59, 59, 999);

  const turnos = await prisma.turno.findMany({
    where: {
      desde: {
        gte: desde,
        lte: hasta
      },
      estado: {
        not: 'cancelado'
      }
    },
    include: {
      paciente: true,
      doctor: true,
      coberturaMedica: true,
      consultorio: true,
    }
  });

  return turnos;
};
