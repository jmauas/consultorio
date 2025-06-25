import { enviarMailConfTurno } from '@/lib/services/sender/resendService';

export async function POST(request) {
  try {
    const { turno, cambioEstado, confirmacion } = await request.json();
    
        if (!turno) {
      return Response.json({ 
        ok: false, 
        error: 'Datos del turno requeridos' 
      }, { status: 400 });
    }

    const result = await enviarMailConfTurno(turno, cambioEstado, confirmacion);

    return Response.json({
      ok: true,
      data: result 
    });
    
  } catch (error) {
    console.error('Error al enviar email de confirmación:', error);
    return Response.json({ 
      ok: false, 
      error: 'Error al enviar email de confirmación' 
    }, { status: 500 });
  }
}
