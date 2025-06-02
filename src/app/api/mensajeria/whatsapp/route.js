import { enviarRecordatorioTurno } from '@/lib/services/sender/whatsappService';

export async function POST(request) {
  try {
    const { turno, cambioEstado } = await request.json();
    
    if (!turno) {
      return Response.json({ 
        ok: false, 
        error: 'Datos del turno requeridos' 
      }, { status: 400 });
    }

    const result = await enviarRecordatorioTurno(turno, cambioEstado);
    
    return Response.json({ 
      ok: true, 
      data: result 
    });
    
  } catch (error) {
    console.error('Error al enviar recordatorio WhatsApp:', error);
    return Response.json({ 
      ok: false, 
      error: 'Error al enviar recordatorio por WhatsApp' 
    }, { status: 500 });
  }
}
