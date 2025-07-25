import { enviarRecordatorioTurno } from '@/lib/services/sender/whatsappService';

export async function POST(request) {
  try {
    const { turno, cambioEstado, confirmacion } = await request.json();
    
    if (!turno) {
      return Response.json({ 
        ok: false, 
        error: 'Datos del turno requeridos' 
      }, { status: 400 });
    }

    const result = await enviarRecordatorioTurno(turno, cambioEstado, confirmacion);
    
    return Response.json({ 
      ok: result.ok, 
      error: result.msgError || null,
    });
    
  } catch (error) {
    console.error('Error al enviar recordatorio WhatsApp:', error);
    return Response.json({ 
      ok: false, 
      error: 'Error al enviar recordatorio por WhatsApp' 
    }, { status: 500 });
  }
}
