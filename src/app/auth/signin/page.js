'use client';

import { useState, useEffect, Suspense  } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { enviarMail } from "@/lib/services/sender/resendService";
import Loader from '@/components/Loader';

const SignIn = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [authMethod, setAuthMethod] = useState("credentials"); // "credentials" o "email"
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Manejar errores de URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'invalid_parameters':
          setError("Enlace de acceso inválido o incompleto.");
          break;
        case 'token_invalid':
          setError("El enlace de acceso es inválido o ha expirado.");
          break;
        case 'user_not_found':
          setError("No existe un usuario registrado con este email.");
          break;
        case 'server_error':
          setError("Ocurrió un error en el servidor. Por favor intenta nuevamente.");
          break;
        default:
          setError(decodeURIComponent(errorParam));
      }
    }
  }, [searchParams]);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email) {
      setError("Por favor, ingresa tu correo electrónico");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.ok) {
        setResetEmailSent(true);
      } else {
        setError(data.message || "No se pudo procesar la solicitud");
      }
    } catch (error) {
      console.error("Error al solicitar restablecimiento de contraseña:", error);
      setError("Ocurrió un error al procesar la solicitud. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (authMethod === "credentials") {
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (result.error) {
          setError("Credenciales inválidas");
        } else {
          router.push("/");
          router.refresh();
        }
      } else if (authMethod === "email") {

        // Verificar primero si el usuario existe
        try {
          const userCheckResponse = await fetch(`/api/debug?email=${encodeURIComponent(email)}`);
          const userCheckResult = await userCheckResponse.json();
          
          if (!userCheckResult.userExists) {
            setError(`No existe un usuario registrado con este email. Por favor, regístrese primero.`);
            setLoading(false);
            return;
          }
          
                
          // Almacenar el token en la base de datos
          const tokenResponse = await fetch('/api/auth/email-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email             
            })
          });
          
          const tokenResult = await tokenResponse.json();
          
          if (!tokenResult.success) {
            console.error("Error al registrar token:", tokenResult);
            throw new Error(tokenResult.error || "Error al registrar el token de acceso");
          }
          // Notificar al usuario que se ha enviado el enlace
          setEmailLinkSent(true);
        } catch (err) {
          console.error("Error al procesar la solicitud de inicio de sesión por email:", err);
          setError("Error al procesar la solicitud: " + (err.message || "Intenta nuevamente."));
        }
      }
    } catch (error) {
      console.error("Error durante el inicio de sesión:", error);
      setError("Ocurrió un error durante el inicio de sesión: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-md">
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900">
            {forgotPassword ? (
              <>
                <i className="fa-solid fa-unlock-keyhole text-orange-400 mr-2"></i>Restablecer Contraseña
              </>
            ) : (
              <>
                <i className="fa-solid fa-user-lock text-orange-400 mr-2"></i>Iniciar sesión
              </>
            )}
          </h2>
        </div>
        
        {/* Selector de método de autenticación (solo mostrar si no está en modo recuperación de contraseña) */}
        {!forgotPassword && !resetEmailSent && (
          <div className="flex justify-center gap-4 border-b pb-4">
            <button
              type="button"
              onClick={() => setAuthMethod("credentials")}
              className={`px-4 py-2 rounded-md flex items-center ${
                authMethod === "credentials" 
                  ? "bg-orange-400 text-white" 
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <i className={`fa-solid fa-key mr-2 ${authMethod === "credentials" ? "" : "text-orange-400"}`}></i>
              Email y Contraseña
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod("email")}
              className={`px-4 py-2 rounded-md flex items-center ${
                authMethod === "email" 
                  ? "bg-orange-400 text-white" 
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <i className={`fa-solid fa-envelope mr-2 ${authMethod === "email" ? "" : "text-orange-400"}`}></i>
              Enlace por Email
            </button>
          </div>
        )}
        
        {/* Área de mensajes de error/éxito con altura fija */}
        <div className="min-h-16">
          {error && (
            <div className="rounded-md bg-red-50 p-4 flex">
              <i className="fa-solid fa-circle-exclamation text-red-600 mr-3 mt-0.5"></i>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          
          {emailLinkSent && (
            <div className="rounded-md bg-green-50 p-4 text-center flex items-center justify-center">
              <i className="fa-solid fa-circle-check text-green-600 mr-2"></i>
              <div className="text-sm text-green-700">
                ¡Enlace de acceso enviado! Revisa tu correo electrónico para iniciar sesión.
              </div>
            </div>
          )}

          {resetEmailSent && (
            <div className="rounded-md bg-green-50 p-4 text-center flex items-center justify-center">
              <i className="fa-solid fa-circle-check text-green-600 mr-2"></i>
              <div className="text-sm text-green-700">
                ¡Instrucciones enviadas! Revisa tu correo electrónico para recuperar tu contraseña.
              </div>
            </div>
          )}
        </div>
        
        {/* Formulario con altura fija */}
        <div className="min-h-52">
          {/* Formulario de recuperación de contraseña */}
          {forgotPassword && !resetEmailSent && (
            <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
              <div className="rounded-md shadow-sm min-h-[88px]">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-orange-400">
                    <i className="fa-solid fa-at"></i>
                  </span>
                  <label htmlFor="reset-email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="relative block w-full rounded-md border-0 p-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-orange-400 sm:text-sm sm:leading-6"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full justify-center rounded-md bg-orange-400 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-orange-400 disabled:bg-orange-300"
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane mr-2"></i>
                      Enviar instrucciones
                    </>
                  )}
                </button>
              </div>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  className="text-sm text-orange-500 hover:text-orange-600"
                  onClick={() => setForgotPassword(false)}
                >
                  <i className="fa-solid fa-arrow-left mr-1"></i>
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          )}

          {/* Formulario normal de inicio de sesión */}
          {!forgotPassword && !emailLinkSent && !resetEmailSent && (
            <form 
              className="mt-8 space-y-6" 
              onSubmit={handleSubmit}            
            >
              <div className="rounded-md shadow-sm min-h-[88px]">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-orange-400">
                    <i className="fa-solid fa-at"></i>
                  </span>
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`relative block w-full border-0 p-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-orange-400 sm:text-sm sm:leading-6 ${
                      authMethod === "credentials" ? "rounded-t-md" : "rounded-md"
                    }`}
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                {authMethod === "credentials" && (
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-orange-400">
                      <i className="fa-solid fa-lock"></i>
                    </span>
                    <label htmlFor="password" className="sr-only">
                      Contraseña
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="relative block w-full rounded-b-md border-0 p-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-orange-400 sm:text-sm sm:leading-6"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Botón de olvidé mi contraseña (solo para modo credentials) */}
              {authMethod === "credentials" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-orange-500 hover:text-orange-600 font-bold p-2 border rounded-md shadow-xl"
                    onClick={() => setForgotPassword(true)}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full justify-center rounded-md bg-orange-400 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-orange-400 disabled:bg-orange-300"
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      Procesando...
                    </>
                  ) : authMethod === "credentials" ? (
                    <>
                      <i className="fa-solid fa-right-to-bracket mr-2"></i>
                      Iniciar sesión
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane mr-2"></i>
                      Enviar enlace de acceso
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
        
        {/* Acciones después de enviar correo */}
        {(emailLinkSent || resetEmailSent) && (
          <div className="text-center">
            <button
              onClick={() => {
                setEmailLinkSent(false);
                setResetEmailSent(false);
                setForgotPassword(false);
                setEmail("");
              }}
              className="text-orange-500 hover:text-orange-600"
            >
              <i className="fa-solid fa-arrow-rotate-left mr-1"></i>
              Volver al inicio de sesión
            </button>
          </div>
        )}       
       
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loader titulo="Cargando Información ..." />}>
      <SignIn />
    </Suspense>
  );
}