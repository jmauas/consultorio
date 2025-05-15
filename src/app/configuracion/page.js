'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { obtenerConfig } from '@/lib/services/configService.js';
import Loader from '@/components/Loader';


export default function ConfiguracionPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarConfig() {
      try {
        setLoading(true);
        const configData = await obtenerConfig();
        setConfig(configData);
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      } finally {
        setLoading(false);
      }
    }

    cargarConfig();
  }, []);

  const menuItems = [
    { 
      label: 'Datos de la Empresa', 
      href: '/configuracion/empresa',
      icon: 'fas fa-building',
      description: 'Configure los datos del negocio, logo e información de contacto',
      color: 'bg-blue-500'
    },
    { 
      label: 'Configuración del Consultorio', 
      href: '/configuracion/consultorio',
      icon: 'fas fa-user-md',
      description: 'Gestione servicios, profesionales, horarios de atención y feriados',
      color: 'bg-indigo-500'
    },
    { 
      label: 'Cuentas de WhatsApp', 
      href: '/configuracion/cuentas',
      icon: 'fab fa-whatsapp',
      description: 'Administre las cuentas de WhatsApp conectadas al sistema',
      color: 'bg-green-500' 
    },
    { 
      label: 'Administración de Usuarios', 
      href: '/configuracion/usuarios',
      icon: 'fas fa-users',
      description: 'Gestione las cuentas de usuarios y sus permisos de acceso',
      color: 'bg-[var(--color-primary)]or-primary)]' 
    },
    { 
      label: 'Opciones Técnicas', 
      href: '/configuracion/tecnica',
      icon: 'fas fa-cogs',
      description: 'Configure opciones avanzadas, conexiones y base de datos',
      color: 'bg-gray-700'
    }
  ];

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Panel de Configuración</h1>
          <p>Administre todos los aspectos de su sistema desde aquí</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="block rounded-lg shadow-sm overflow-hidden border hover:shadow-md transition-shadow"
          >
            <div className={`${item.color} p-4 flex items-center text-white`}>
              <i className={`${item.icon} text-2xl mr-3`}></i>
              <h2 className="text-lg font-semibold">{item.label}</h2>
            </div>
            <div className="p-4">
              <p>{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}