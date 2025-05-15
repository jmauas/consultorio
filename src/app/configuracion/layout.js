'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';

export default function ConfiguracionLayout({ children }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  
  const menuItems = [
    { 
      label: 'Empresa', 
      href: '/configuracion/empresa',
      icon: 'fas fa-building',
      description: 'Datos del negocio, logo, información de contacto' 
    },
    { 
      label: 'Consultorio', 
      href: '/configuracion/consultorio',
      icon: 'fas fa-user-md',
      description: 'Configuración de servicios, profesionales y horarios' 
    },
    { 
      label: 'Usuarios', 
      href: '/configuracion/usuarios',
      icon: 'fas fa-users',
      description: 'Administración de usuarios del sistema' 
    },
    { 
      label: 'Cuentas', 
      href: '/configuracion/cuentas',
      icon: 'fab fa-whatsapp',
      description: 'Configuración de cuentas de WhatsApp' 
    },
    { 
      label: 'Técnica', 
      href: '/configuracion/tecnica',
      icon: 'fas fa-cogs',
      description: 'Opciones técnicas, conexiones, base de datos' 
    }
  ];
  
  const isActive = (path) => {
    if (path === '/configuracion' && pathname === '/configuracion') {
      return true;
    }
    return pathname.startsWith(path);
  };
  
  return (
    <div className="flex flex-col md:flex-row gap-6 p-4">
      {/* Barra lateral con navegación */}
      <aside className="w-full md:w-64 flex-shrink-0">
        <div className="rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-[var(--color-primary)] text-white">
            <h2 className="text-xl font-semibold">Configuración</h2>
            <p className="text-orange-100 text-sm">Ajustes del sistema</p>
          </div>
          
          <nav className="p-2">
            <ul className="space-y-1">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                      isActive(item.href) 
                        ? theme==='dark' ? 'bg-slate-500 text-orange-700' : 'bg-orange-100 text-orange-700' 
                        : theme==='dark' ? 'bg-black text-slate-200' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <i className={`${item.icon} w-5 text-center mr-2 ${isActive(item.href) ? 'text-[var(--color-primary)]' : 'text-gray-500'}`}></i>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="px-4 py-3 border-t">
            <Link
              href="/"
              className="flex items-center hover:text-[var(--color-primary)] transition-colors"
            >
              <i className="fa-solid fa-arrow-left fa-lg mr-2"></i>
              <span>Volver al inicio</span>
            </Link>
          </div>
        </div>
        
        <div className={`rounded-lg mt-4 p-4 text-sm ${theme==='dark' ? 'bg-slate-700 text-slate-200' : 'bg-blue-100 text-blue-800' }`}>
          <h3 className="font-semibold flex items-center text-blue-700">
            <i className="fas fa-info-circle mr-2"></i>
            Ayuda
          </h3>
          <p className="mt-2">
            Utilice las diferentes secciones para configurar el sistema según sus necesidades.
            Los cambios se guardan automáticamente al hacer clic en los botones de guardar.
          </p>
        </div>
      </aside>
      
      {/* Contenido principal */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}