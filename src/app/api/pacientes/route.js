import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { 
  buscarPacientes, 
  obtenerTodosPacientes,
  savePaciente 
} from '@/lib/services/pacientes/pacientesService';

/**
 * GET - Obtiene pacientes según criterios de búsqueda
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const isPublicEndpoint = request.headers.get('x-api-source') === 'whatsapp';
    
    if (!session && !isPublicEndpoint) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get('dni');
    const celular = searchParams.get('celular');
    const nombre = searchParams.get('nombre');
    const todos = searchParams.get('todos');
    const cobertura = searchParams.get('cobertura');
    
    // Si se solicitan todos los pacientes
    if (todos === 'true') {
      const resultado = await obtenerTodosPacientes();
      return NextResponse.json(resultado);
    }
    
    // Buscar pacientes según los criterios proporcionados
    const resultado = await buscarPacientes({ dni, celular, nombre, cobertura });
    
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Error al buscar pacientes:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al buscar pacientes',
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * POST - Registra un nuevo paciente o actualiza uno existente
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const isPublicEndpoint = request.headers.get('x-api-source') === 'whatsapp';
    
    if (!session && !isPublicEndpoint) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener datos del paciente del cuerpo de la solicitud
    const paciente = await request.json();
    
    // Validar datos mínimos
    if (!paciente.nombre || !paciente.dni || !paciente.celular) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Faltan datos obligatorios (nombre, dni, celular)' 
      }, { status: 400 });
    }
    if (paciente.celular && paciente.celular.length > 4) {
      if (paciente.celular.substring(0, 3) != '549') paciente.celular = '549' + paciente.celular;
    }
    
    // Obtener el ID del usuario de la sesión si existe
    const userId = session?.user?.id || null;
    
    // Guardar el paciente con el ID del usuario
    const resultado = await savePaciente(paciente, userId);
    
    if (resultado) {
      return NextResponse.json({ 
        ok: true, 
        message: 'Paciente guardado correctamente',
        paciente
      });
    } else {
      return NextResponse.json({ 
        ok: false, 
        message: 'No se pudo guardar el paciente' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error al guardar paciente:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al guardar paciente',
      error: error.message 
    }, { status: 500 });
  }
}