'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export default function Modal({ isOpen, onClose, children, size = 'medium', title = '' }) {
  // Estado local para manejar la animación y visibilidad
  const [isVisible, setIsVisible] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // Ajustar el tamaño del modal según la propiedad size
  const modalSizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl',
    full: 'max-w-full mx-4'
  };
  
  const sizeClass = modalSizeClasses[size] || modalSizeClasses.medium;

  // Manejar la animación al abrir/cerrar
  useEffect(() => {
    if (isOpen) {
      // Primero renderizamos el componente, luego aplicamos la transición
      setIsVisible(true);
    } else {
      // Al cerrar, primero animamos la salida y después ocultamos
      setIsVisible(false);
    }
  }, [isOpen]);

  // Bloquear el scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Limpiar el efecto cuando el componente se desmonte
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Manejar el cierre con ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Cerrar al hacer clic en el overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // No renderizar nada si el modal está cerrado
  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs transition-opacity duration-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleOverlayClick}
    >      <div 
        className={`relative ${theme==='light' ? 'bg-white' : 'bg-slate-800'} rounded-lg shadow-xl overflow-hidden w-full ${sizeClass} max-h-[90vh] flex flex-col transition-all duration-300 ease-out transform ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
      >
        {/* Cabecera del modal con título y botón de cierre */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-red-400 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none"
            aria-label="Cerrar"
          >
            <i className="fa-solid fa-square-xmark fa-2xl"></i>
          </button>
        </div>
        
        {/* Contenido del modal */}
        <div className="overflow-y-auto flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
}