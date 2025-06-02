import { handleExcel } from '@/lib/services/excel';

export async function POST(request) {
  try {
    const { data, nombre } = await request.json();
    
    if (!data || !Array.isArray(data)) {
      return Response.json({ 
        ok: false, 
        error: 'Datos requeridos para exportar' 
      }, { status: 400 });
    }

    if (!nombre || typeof nombre !== 'string') {
      return Response.json({ 
        ok: false, 
        error: 'Nombre del archivo requerido' 
      }, { status: 400 });
    }

    const result = await handleExcel(data, nombre);
    
    return Response.json({ 
      ok: true, 
      data: result 
    });
    
  } catch (error) {
    console.error('Error en exportación Excel:', error);
    return Response.json({ 
      ok: false, 
      error: 'Error al exportar a Excel' 
    }, { status: 500 });
  }
}
