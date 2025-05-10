import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { 
  getUserById, 
  updateUser,
  deleteUser
} from '@/lib/services/users/userService';

/**
 * GET - Obtiene un usuario por su ID
 */
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    params = await params || {};
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ 
        ok: false, 
        message: 'ID de usuario no especificado' 
      }, { status: 400 });
    }
    
    // Obtener el usuario
    const resultado = await getUserById(id);
    
    if (!resultado.ok) {
      return NextResponse.json({
        ok: false,
        message: resultado.message || 'Usuario no encontrado'
      }, { status: 404 });
    }
    
    return NextResponse.json(resultado);
    
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al obtener usuario',
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * PUT - Actualiza un usuario por su ID
 */
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    params = await params || {};
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ 
        ok: false, 
        message: 'ID de usuario no especificado' 
      }, { status: 400 });
    }
    
    // Obtener datos de actualización del cuerpo
    const userData = await request.json();
    
    // Actualizar el usuario
    const resultado = await updateUser(id, userData);
    
    if (!resultado.ok) {
      return NextResponse.json({
        ok: false,
        message: resultado.message || 'Error al actualizar usuario'
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Usuario actualizado correctamente',
      user: resultado.user
    });
    
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al actualizar usuario',
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * DELETE - Elimina un usuario por su ID
 */
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    params = await params || {};
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ 
        ok: false, 
        message: 'ID de usuario no especificado' 
      }, { status: 400 });
    }
    
    // Eliminar el usuario
    const resultado = await deleteUser(id);
    
    if (!resultado.ok) {
      return NextResponse.json({
        ok: false,
        message: resultado.message || 'Error al eliminar usuario'
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Usuario eliminado correctamente'
    });
    
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al eliminar usuario',
      error: error.message 
    }, { status: 500 });
  }
}