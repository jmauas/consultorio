'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Loader from '@/components/Loader';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [resetCompleted, setResetCompleted] = useState(false);
  const [error, setError] = useState('');

  // Obtener email y token de la URL al cargar la página
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');

    if (emailParam && tokenParam) {
      setEmail(emailParam);
      setToken(tokenParam);

      // Validar el token
      validateToken(emailParam, tokenParam);
    } else {
      setValidatingToken(false);
      setError('Enlace de recuperación inválido o incompleto. Por favor solicita un nuevo enlace de recuperación.');
    }
  }, [searchParams]);

  // Función para validar el token
  const validateToken = async (emailToValidate, tokenToValidate) => {
    try {
      setValidatingToken(true);
      const response = await fetch(`/api/auth/reset-password?email=${encodeURIComponent(emailToValidate)}&token=${encodeURIComponent(tokenToValidate)}`);
      const data = await response.json();

      if (data.ok && data.valid) {
        setTokenValid(true);
      } else {
        setError(data.message || 'El enlace de recuperación ha expirado o es inválido.');
      }
    } catch (error) {
      setError('Error al validar el token. Por favor intenta nuevamente.');
      console.error('Error validando token:', error);
    } finally {
      setValidatingToken(false);
      setLoading(false);
    }
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar que las contraseñas coinciden
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    // Validar longitud mínima de contraseña
    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setResetCompleted(true);
      } else {
        setError(data.message || 'No se pudo restablecer la contraseña.');
      }
    } catch (error) {
      setError('Error al restablecer la contraseña. Por favor intenta nuevamente.');
      console.error('Error restableciendo contraseña:', error);
    } finally {
      setLoading(false);
    }
  };

  // Redireccionar al inicio de sesión después de completar el restablecimiento
  useEffect(() => {
    let redirectTimer;
    if (resetCompleted) {
      redirectTimer = setTimeout(() => {
        router.push('/auth/signin?message=password_reset_success');
      }, 5000);
    }

    return () => clearTimeout(redirectTimer);
  }, [resetCompleted, router]);

  // Renderizado condicional según el estado
  if (validatingToken) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-2">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-md">
          <div className="text-center">
            <i className="fa-solid fa-spinner fa-spin text-[var(--color-primary)] text-3xl mb-4"></i>
            <h2 className="text-xl font-semibold">Validando enlace de recuperación...</h2>
            <p className="mt-2 text-gray-600">Por favor espera mientras verificamos tu solicitud.</p>
          </div>
        </div>
      </div>
    );
  }

  if (resetCompleted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-2">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-md">
          <div className="text-center">
            <i className="fa-solid fa-check-circle text-green-500 text-5xl mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-900">¡Contraseña restablecida!</h2>
            <p className="mt-2 text-gray-600">Tu contraseña ha sido actualizada correctamente.</p>
            <p className="mt-4 text-sm text-gray-500">Serás redirigido al inicio de sesión en unos segundos...</p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="mt-6 inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary)]"
            >
              <i className="fa-solid fa-arrow-right-to-bracket mr-2"></i>
              Ir a iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            <i className="fa-solid fa-unlock-keyhole text-[var(--color-primary)] mr-2"></i>
            Restablecer contraseña
          </h2>
          {tokenValid ? (
            <p className="mt-2 text-sm text-gray-600">
              Ingresa tu nueva contraseña para la cuenta asociada con {email}
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              Ha habido un problema con tu solicitud de recuperación.
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 flex">
            <i className="fa-solid fa-circle-exclamation text-red-600 mr-3 mt-0.5"></i>
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {tokenValid ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--color-primary)]">
                  <i className="fa-solid fa-lock"></i>
                </span>
                <label htmlFor="password" className="sr-only">
                  Nueva contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="relative block w-full rounded-md border-0 p-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-[var(--color-primary)] sm:text-sm sm:leading-6"
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[var(--color-primary)]">
                  <i className="fa-solid fa-lock"></i>
                </span>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirmar contraseña
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  required
                  className="relative block w-full rounded-md border-0 p-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-[var(--color-primary)] sm:text-sm sm:leading-6"
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:bg-orange-300"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Procesando...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check mr-2"></i>
                    Restablecer contraseña
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/auth/signin')}
              className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary)]"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>
              Volver al inicio de sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente principal que usa Suspense
export default function Page() {
  return (
    <Suspense fallback={<Loader titulo={'Cargando autenticación'} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}