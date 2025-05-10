import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Configuración de rutas
const publicRoutes = [
  '/auth/signin',
  '/auth/reset-password', 
  '/api/auth',
  '/favicon.ico',
  '/logo.png',
  '/logo.jpg',
  '/tn-logo.png',
  '/google-calendar-logo.png',
  '/api/debug',
];

// Verificar si una ruta es pública
const isPublicRoute = (pathname) => {
  // Verificar rutas exactas
  if (publicRoutes.includes(pathname)) return true;
  
  // Verificar rutas que comienzan con patrones específicos
  return (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/auth/reset-password/') ||
    pathname.startsWith('/auth/complete-signin/')
  );
};

export async function middleware(request) {
  // Obtener la ruta actual
  const { pathname } = request.nextUrl;
  
  // Verificar si es la página principal
  const isHome = pathname === '/';
  
  // Obtener el token de autenticación
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // Redirigir a la página de inicio de sesión si no está autenticado y la ruta no es pública
  if (!token && !isPublicRoute(pathname) && !isHome) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // Si está en la página de inicio de sesión pero ya está autenticado, redirigir al dashboard
  if (token && pathname.startsWith('/auth/signin')) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }
  
  // Continuar con la solicitud normal
  return NextResponse.next();
}

// Configurar las rutas a las que se aplica el middleware
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * 1. Todos los archivos con extensión (por ejemplo, imagenes, CSS, JS)
     * 2. /api/auth/* - APIs de NextAuth
     * 3. /_next - Archivos de Next.js
     * 4. /_vercel - Archivos de Vercel
     */
    '/((?!_next|_vercel|.*\\..*|api/auth).*)',
  ],
};
