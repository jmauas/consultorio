import { NextResponse } from 'next/server';
import { obtenerConfig } from '@/lib/services/configService.js';
import { tareaEnvioWA } from '@/lib/services/agendarEnvios.js';

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
    const { envio, horaEnvio, diasEnvio } = config;

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
      
      // if (currentHour === cronHour && Math.abs(currentMinute - cronMinute) <= 5) {
        try {
          await tareaEnvioWA(diasEnvio);
        } catch (error) {
          console.error('Error en envío WhatsApp:', error);
          results.whatsapp.errors.push(error.message);
        }
      // }
    }

    return NextResponse.json({
      success: true,
      ok: true,
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
