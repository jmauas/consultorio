'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [linkTurnos, setLinkTurnos] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { theme, setTheme } = useTheme(); // Obtenemos el tema actual y la función para cambiarlo
  const [mounted, setMounted] = useState(false);
  
  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
          toast.success(`URL ${text} copiada al portapapeles`);
      })
      .catch(err => {
        console.error('Error al copiar al portapapeles: ', err);
      });
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

   useEffect(() => {
    // Cargar la URL de la app desde la configuración del consultorio
    const fetchAppUrl = async () => {
      try {
        const response = await fetch('/api/configuracion/empresa');
        if (!response.ok) {
          throw new Error('Error al obtener la configuración del consultorio');
        }
        const data = await response.json();
        const url = data.config?.urlApp || data.config?.urlAppDev || '';
        if (url) {
          setLinkTurnos(url);
        } else {
          console.error('No se encontró la URL de la app en la configuración del consultorio');
        }
      } catch (error) {
        console.error('Error al obtener la configuración del consultorio:', error);
      }
    };
    fetchAppUrl();
  }, []);

  // Cerrar el menú cuando se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);

  // Añadir este useEffect
  useEffect(() => {
    setMounted(true);
  }, []);

  // No renderizar el encabezado en la página de disponibilidad de turnos
  if (pathname.includes('/turnos/disponibilidad')) {
    return null;
  }

  return (
    <header className="border-b border-gray-200 shadow-sm py-3 px-4 sticky top-0 z-50 bg-[var(--background)]">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 md:gap-4">          
          <button 
            onClick={() => router.back()}
            className="p-2 border border-[var(--color-primary)] dark:border-[var(--color-primary)] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Volver"
          >
            <i className="fa-solid fa-arrow-left fa-lg text-[var(--color-primary)] dark:text-[var(--color-primary)]"></i>
          </button>
            <Link href="/" className="p-2 border border-[var(--color-primary)] dark:border-[var(--color-primary)] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <i className="fa-solid fa-house fa-lg text-[var(--color-primary)] dark:text-[var(--color-primary)]"></i>
          </Link>


          {/* Mostrar el enlace a turnos si existe */}
          {linkTurnos && (
            <button 
              onClick={() => copyToClipboard(`${linkTurnos}/turnos/disponibilidad`)}              
              className="p-2 border border-[var(--color-primary)] dark:border-[var(--color-primary)] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Copiar URL al portapapeles"
            >
              <i className="fa-solid fa-calendar-check fa-lg text-[var(--color-primary)] dark:text-[var(--color-primary)]"></i>
              <span className="ml-2 hidden sm:inline text-xs dark:text-gray-300">Copiar Url Turnos</span>
            </button>
          )}

          {/* Botón de configuración para usuarios autenticados */}
          {session?.user && session.user.perfil && Number(session.user.perfil.id) == 100 && (
            <Link
              href="/configuracion"             
              className="p-2 border border-[var(--color-primary)] dark:border-[var(--color-primary)] rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors hidden md:flex items-center"
              title="Panel de Configuración"
            >
              <i className="fa-solid fa-cogs fa-lg text-[var(--color-primary)] dark:text-[var(--color-primary)] p-2 py-3"></i>
            </Link>
          )}
          {/* Botón para alternar entre modo claro y oscuro */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="py-3 px-1 border border-[var(--color-primary)] rounded-md transition-colors"
          >
            {mounted ? (   
              <div className="flex items-center gap-1 text-[var(--color-primary)] py-2 cursor-pointer">         
                {theme === 'dark' ? (<>
                    <i className="fa-solid fa-toggle-on fa-xl"></i>
                    <i className="fa-solid fa-sun fa-lg w-6"></i>
                </>
                ) : (<>
                    <i className="fa-solid fa-toggle-off fa-xl"></i>
                   <i className="fa-solid fa-moon fa-lg w-6"></i>
                </>
                )}
              </div>
              ) : (
              <div className="flex items-center gap-1 text-[var(--color-primary)] py-2">
                <i className="fa-solid fa-circle-notch fa-spin fa-xl"></i>
                <span className="w-6"></span>
              </div>
            )}
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          {session?.user && (
            <>
              <span className="flex flex-col items-start justify-center">
                <span className="text-sm font-bold flex items-center justify-center gap-1">
                  <span className="text-sm md:text-lg text-center">
                    {session.user.name || 'Usuario'}
                  </span>
                  <span className="text-lg md:hidden">
                    {session.user.perfil && session.user.perfil.emoji}
                  </span>
                </span>
                <span className="text-xs hidden md:flex items-center gap-1">
                  {session.user.perfil && session.user.perfil.nombre} {session.user.perfil && session.user.perfil.emoji}
                </span>
              </span>

              <div className="relative" ref={menuRef}>
                <div 
                  className="h-8 w-8 rounded-full bg-[var(--color-secondary)] dark:bg-[var(--color-primary-dark)] flex items-center justify-center cursor-pointer"
                  onClick={toggleMenu}
                >
                  {session.user.image ? (
                    <Image className="h-8 w-8 rounded-full" src={session.user.image} alt={session.user.name} width={24} height={24}/>
                  ) : (
                    <i className="fa-solid fa-user text-[var(--color-primary)] dark:text-[var(--color-primary)]"></i>
                  )}
                </div>
                
                {menuOpen && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 border border-gray-200 ${theme==='light' ? 'bg-white' : 'bg-black'}`}>
                    {session?.user && session.user.perfil && Number(session.user.perfil.id) == 100 && (<>
                    <Link 
                      href="/configuracion/usuarios" 
                      className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      <i className="fa-solid fa-users mr-2 text-[var(--color-primary)] dark:text-[var(--color-primary)]"></i>
                      Administrar usuarios
                    </Link>
                    <Link
                      href="/configuracion" 
                      className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setMenuOpen(false)}
                    >
                      <i className="fa-solid fa-cogs mr-2 text-[var(--color-primary)] dark:text-[var(--color-primary)]"></i>
                      Panel de Configuración
                    </Link>
                    </>)}
                    
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <i className="fa-solid fa-sign-out-alt mr-2 text-red-500 dark:text-red-400"></i>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {!session?.user && (
            <Link
              href="/auth/signin" 
              className="p-2 text-[var(--color-primary)] dark:text-[var(--color-primary-dark)] hover:text-[var(--color-primary-dark)] dark:hover:text-[var(--color-primary)] border border-[var(--color-primary)] dark:border-[var(--color-primary)] rounded-md hover:bg-[var(--color-secondary)] dark:hover:bg-[var(--color-secondary)] transition-colors flex items-center"
            >
              <i className="fa-solid fa-sign-in-alt mr-1"></i>
              <span>Iniciar sesión</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}