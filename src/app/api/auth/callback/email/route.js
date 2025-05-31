import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const token = searchParams.get("token");
    
    
    // Validate parameters
    if (!email || !token) {
      console.error("Missing email or token in email callback");
      return NextResponse.redirect(new URL('/auth/signin?error=invalid_parameters', request.url));
    }
    
    // Validate the token using existing endpoint
    const validationUrl = `${request.nextUrl.origin}/api/auth/email-token?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}&source=callback`;
    const validationResponse = await fetch(validationUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    const validationResult = await validationResponse.json();
    
    if (!validationResult.valid) {
      console.error("Token validation failed:", validationResult.error);
      return NextResponse.redirect(new URL(`/auth/signin?error=${encodeURIComponent(validationResult.error || 'token_invalid')}`, request.url));
    }
    
    // If token is valid, user is confirmed
    const user = validationResult.user;
    
    if (!user || !user.id) {
      console.error("User not found after token validation");
      return NextResponse.redirect(new URL('/auth/signin?error=user_not_found', request.url));
    }

    // Método mejorado: Redirigir a una página especial que inicia sesión con credenciales
    // Crear una URL de redirección con parámetros especiales
    const signInUrl = new URL('/auth/complete-signin', request.nextUrl.origin);
    signInUrl.searchParams.set('userId', user.id);
    signInUrl.searchParams.set('email', email);
    // Usar un token especial para validar la autenticidad de la solicitud
    signInUrl.searchParams.set('authToken', token);
    
    return NextResponse.redirect(signInUrl);
    
  } catch (error) {
    console.error("Error in email callback:", error);
    return NextResponse.redirect(new URL('/auth/signin?error=server_error', request.url));
  }
}