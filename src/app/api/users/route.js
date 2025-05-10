import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { 
  getAllUsers, 
  createUser,
  searchUsers
} from '@/lib/services/users/userService';

/**
 * GET - Obtiene usuarios según criterios de búsqueda o todos
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    // Si hay consulta de búsqueda, buscamos usuarios que coincidan
    if (query) {
      const resultado = await searchUsers(query);
      return NextResponse.json(resultado);
    }
    
    // Si no hay consulta, obtener todos los usuarios
    const resultado = await getAllUsers();
    return NextResponse.json(resultado);
    
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al buscar usuarios',
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * POST - Crea un nuevo usuario
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener datos del usuario del cuerpo de la solicitud
    const userData = await request.json();
    
    // Validar datos mínimos
    if (!userData.email) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Falta el correo electrónico' 
      }, { status: 400 });
    }
    
    // Crear el usuario
    const resultado = await createUser(userData);
    
    if (resultado.ok) {
      return NextResponse.json({ 
        ok: true, 
        message: 'Usuario creado correctamente',
        user: resultado.user
      });
    } else {
      return NextResponse.json({ 
        ok: false, 
        message: resultado.message || 'No se pudo crear el usuario' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al crear usuario',
      error: error.message 
    }, { status: 500 });
  }
}