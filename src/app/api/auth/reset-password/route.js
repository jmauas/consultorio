import { NextResponse } from 'next/server';
import { 
  generatePasswordResetToken, 
  validatePasswordResetToken,
  resetPassword
} from '@/lib/services/users/userService';
import { enviarMailResetPass } from "@/lib/services/sender/resendService";

/**
 * POST - Solicita un token de recuperación de contraseña
 */
export async function POST(request) {
  try {
    const { email } = await request.json();
    
    // Verificar que se proporciona un email
    if (!email) {
      return NextResponse.json({ 
        ok: false, 
        message: 'El correo electrónico es requerido' 
      }, { status: 400 });
    }
    
    // Generar token de recuperación
    const resultado = await generatePasswordResetToken(email);
    
    if (!resultado.ok) {
      return NextResponse.json({ 
        ok: false, 
        message: resultado.message || 'No se pudo generar el token de recuperación' 
      }, { status: 400 });
    }
    
    const res = await enviarMailResetPass(email, resultado.token);
    
      
    return NextResponse.json({ 
      ok: true, 
      message: 'Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña' 
    });
  } catch (emailError) {
    console.error('Error al enviar correo de recuperación:', emailError);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al enviar el correo electrónico de recuperación',
      error: emailError.message 
    }, { status: 500 });
  }
}

/**
 * GET - Valida un token de recuperación de contraseña
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const token = searchParams.get('token');
    
    // Verificar que se proporcionan email y token
    if (!email || !token) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Email y token son requeridos' 
      }, { status: 400 });
    }
    
    // Validar el token
    const validation = await validatePasswordResetToken(email, token);
    
    return NextResponse.json(validation);
    
  } catch (error) {
    console.error('Error al validar token de recuperación:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al procesar la solicitud',
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * PUT - Actualiza la contraseña usando un token de recuperación
 */
export async function PUT(request) {
  try {
    const { email, token, password, confirmPassword } = await request.json();
    
    // Verificar que se proporcionan todos los campos requeridos
    if (!email || !token || !password || !confirmPassword) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Todos los campos son requeridos' 
      }, { status: 400 });
    }
    
    // Verificar que las contraseñas coinciden
    if (password !== confirmPassword) {
      return NextResponse.json({ 
        ok: false, 
        message: 'Las contraseñas no coinciden' 
      }, { status: 400 });
    }
    
    // Validar que la contraseña cumple con requisitos mínimos (al menos 4 caracteres)
    if (password.length < 4) {
      return NextResponse.json({ 
        ok: false, 
        message: 'La contraseña debe tener al menos 4 caracteres' 
      }, { status: 400 });
    }
    
    // Actualizar la contraseña
    const resultado = await resetPassword(email, token, password);
    
    if (!resultado.ok) {
      return NextResponse.json({ 
        ok: false, 
        message: resultado.message || 'Error al restablecer la contraseña' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Contraseña actualizada correctamente' 
    });
    
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al procesar la solicitud',
      error: error.message 
    }, { status: 500 });
  }
}