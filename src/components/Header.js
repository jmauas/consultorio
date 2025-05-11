'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { obtenerConfig } from '@/lib/services/configService.js';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [linkTurnos, setLinkTurnos] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  useEffect(() => {
    // Cargar la URL de la app desde la configuración del consultorio
    const fetchAppUrl = async () => {
      try {
        const config = await obtenerConfig();
        if (config && config.urlApp) {
          setLinkTurnos(config.urlApp);
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

  // No renderizar el encabezado en la página de disponibilidad de turnos
  if (pathname.includes('/turnos/disponibilidad')) {
    return null;
  }

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

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm py-3 px-4 sticky top-0 z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 text-gray-600 hover:text-gray-900 border border-orange-500 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Volver"
          >
            <i className="fa-solid fa-arrow-left fa-lg text-orange-500"></i>
          </button>
          
          <Link href="/" className="p-2 text-gray-600 hover:text-gray-900 border border-orange-500 rounded-md hover:bg-gray-100 transition-colors">
              <i className="fa-solid fa-house fa-lg text-orange-500"></i>
          </Link>

          {/* Mostrar el enlace a turnos si existe */}
          {linkTurnos && (
            <button 
            onClick={() => copyToClipboard(`${linkTurnos}/turnos/disponibilidad`)}
            className="p-2 text-gray-600 hover:text-gray-900 border border-orange-500 rounded-md hover:bg-gray-100 transition-colors"
            title="Copiar URL al portapapeles"
          >
            <i className="fa-solid fa-calendar-check fa-lg text-orange-500"></i>
            <span className="ml-2 hidden sm:inline text-xs">Copiar Url Turnos</span>
          </button>
          )}

          {/* Botón de configuración para usuarios autenticados */}
          {session?.user && (
            <Link
              href="/configuracion" 
              className="p-2 text-gray-600 hover:text-gray-900 border border-orange-500 rounded-md hover:bg-gray-100 transition-colors hidden md:flex items-center"
              title="Panel de Configuración"
            >
              <i className="fa-solid fa-cogs fa-lg text-orange-500 p-2 py-3"></i>
            </Link>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {session?.user && (
            <>
              <div className="text-sm text-gray-700 font-bold">
                {session.user.name || 'Usuario'}
              </div>

              <div className="relative" ref={menuRef}>
                <div 
                  className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center cursor-pointer"
                  onClick={toggleMenu}
                >
                  {session.user.image ? (
                    <Image className="h-8 w-8 rounded-full" src={session.user.image} alt={session.user.name} width={24} height={24}/>
                  ) : (
                    <i className="fa-solid fa-user text-orange-500"></i>
                  )}
                </div>
                
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link 
                      href="/configuracion/usuarios" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setMenuOpen(false)}
                    >
                      <i className="fa-solid fa-users mr-2 text-orange-500"></i>
                      Administrar usuarios
                    </Link>
                    <Link
                      href="/configuracion" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setMenuOpen(false)}
                    >
                      <i className="fa-solid fa-cogs mr-2 text-orange-500"></i>
                      Panel de Configuración
                    </Link>
                    
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <i className="fa-solid fa-sign-out-alt mr-2 text-red-500"></i>
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
              className="p-2 text-orange-600 hover:text-orange-800 border border-orange-500 rounded-md hover:bg-orange-50 transition-colors flex items-center"
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