'use client';

import { useEffect, useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Loader from '@/components/Loader';

// Componente interno que utiliza useSearchParams
function CompleteSignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Completando autenticación...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const autoSignIn = async () => {
      try {
        // Obtener los parámetros pasados desde la ruta de callback
        const userId = searchParams.get('userId');
        const email = searchParams.get('email');
        const authToken = searchParams.get('authToken');

        // Validar que tenemos todos los parámetros necesarios
        if (!userId || !email || !authToken) {
          setError('Parámetros de autenticación incompletos');
          return;
        }

        setStatus('Iniciando sesión...');

        // Usar signIn con el proveedor "credentials" pero con un flag especial
        // que indica que es una autenticación por email validada
        const result = await signIn('credentials', {
          email,
          emailToken: authToken,  // Esta credencial especial indica que viene de validación de email
          userId,
          redirect: false,
        });

        if (result?.error) {
          setError(`Error al iniciar sesión: ${result.error}`);
        } else {
          // Éxito - redirigir al dashboard o página principal
          setStatus('Autenticación completada');
          router.push('/');
          router.refresh(); // Importante para actualizar la UI con el estado de sesión
        }
      } catch (err) {
        setError(`Error inesperado: ${err.message}`);
      }
    };

    autoSignIn();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex flex-col items-center justify-center">
            <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
              Autenticación en progreso
            </h2>
            
            <div className="mt-8 w-full">
              {error ? (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                        <button
                          className="mt-4 inline-flex w-full justify-center rounded-md border border-transparent bg-orange-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                          onClick={() => router.push('/auth/signin')}
                        >
                          Volver a iniciar sesión
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-center text-gray-600 mb-4">{status}</p>
                  <Loader />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente principal que usa Suspense
export default function Page() {
  return (
    <Suspense fallback={<Loader titulo={'Cargando autenticación'}/>}>
      <CompleteSignInForm />
    </Suspense>
  );
}