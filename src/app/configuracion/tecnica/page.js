'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function TecnicaPage() {
  const [datos, setDatos] = useState({
    urlApp: '',
    urlAppDev: ''
  });
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);
        const rspa = await fetch('/api/configuracion/empresa')
        const data = await rspa.json();
        const config = data.config;
        
        setDatos({
          urlApp: config.urlApp || '',
          urlAppDev: config.urlAppDev || ''
        });
      } catch (error) {
        console.error('Error al cargar opciones técnicas:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setDatos(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      
      // Preparar solo los datos de la sección técnica
      // Solo incluir campos que existen en el modelo ConfiguracionConsultorio
      const datosTecnicos = {
        urlApp: datos.urlApp,
        urlAppDev: datos.urlAppDev      };
      
      // Enviar datos al endpoint /api/configuracion
      const response = await fetch('/api/configuracion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosTecnicos)
      });

      const result = await response.json();
      
      if (result.ok) {
        toast.success('Opciones técnicas guardadas correctamente');
      } else {
        throw new Error(result.message || 'Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error al guardar opciones técnicas:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return <div className="text-center">Cargando datos...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Opciones Técnicas</h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="p-6 rounded-lg shadow-sm border border-gray-200">          
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-2">
                URL de la aplicación
              </label>
              <input
                type="text"
                name="urlApp"
                value={datos.urlApp}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="block font-medium mb-2">
                URL de la aplicación en desarrollo
              </label>
              <input
                type="text"
                name="urlAppDev"
                value={datos.urlAppDev}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              />
            </div>
          </div>
        </section>
        
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={guardando}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {guardando ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}