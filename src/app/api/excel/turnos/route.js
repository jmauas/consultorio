import { handleExcelTurnos } from '@/lib/services/excel';

export async function POST(request) {
  try {
    const { data } = await request.json();
    
    if (!data || !Array.isArray(data)) {
      return Response.json({ 
        ok: false, 
        error: 'Datos de turnos requeridos' 
      }, { status: 400 });
    }

    const result = await handleExcelTurnos(data);
    
    return Response.json({ 
      ok: true, 
      data: result 
    });
    
  } catch (error) {
    console.error('Error en exportación Excel de turnos:', error);
    return Response.json({ 
      ok: false, 
      error: 'Error al exportar turnos a Excel' 
    }, { status: 500 });
  }
}
