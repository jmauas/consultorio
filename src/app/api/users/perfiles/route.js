import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getPerfilesUsuario } from '@/lib/services/users/userService';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar si el usuario está autenticado
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener todos los perfiles
    const perfiles = getPerfilesUsuario();
    
    return NextResponse.json({ 
      ok: true, 
      perfiles
    });
  } catch (error) {
    console.error('Error al obtener perfiles:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al obtener perfiles',
      error: error.message 
    }, { status: 500 });
  }
}
