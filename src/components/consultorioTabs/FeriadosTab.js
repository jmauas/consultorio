import React from 'react';
import toast from 'react-hot-toast';
import { useTheme } from 'next-themes';

const FeriadosTab = ({ config, setConfig, nuevoFeriado, setNuevoFeriado }) => {
  const { theme, setTheme } = useTheme();
  const handleAgregarFeriado = () => {
    if (!nuevoFeriado.fechaDesde) {
      toast.error('Debe ingresar al menos la fecha de inicio del feriado');
      return;
    }
    
    // Si las fechas son iguales, guardamos solo la fecha
    // Si son diferentes, guardamos fechaDesde|fechaHasta
    const fecha = nuevoFeriado.fechaDesde === nuevoFeriado.fechaHasta ? 
      nuevoFeriado.fechaDesde : 
      `${nuevoFeriado.fechaDesde}|${nuevoFeriado.fechaHasta}`;
    
    setConfig({
      ...config,
      feriados: [
        ...config.feriados,
        {
          fecha,
          id: Date.now().toString()
        }
      ]
    });
    
    setNuevoFeriado({
      fechaDesde: '',
      fechaHasta: ''
    });
  };

  const handleEliminarFeriado = (id) => {
    setConfig({
      ...config,
      feriados: config.feriados.filter(feriado => feriado.id !== id)
    });
  };

  // Componente Card para pantallas pequeñas
  const FeriadoCard = ({ feriado }) => (
    <div className="p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="flex justify-between items-center">
        <div className="font-medium">
          {feriado.fecha.includes('|') ? (
            <div className="space-y-1">
              <p className="text-sm">Periodo:</p>
              <p>
                <span className="block text-base">
                  Del{' '}
                  {new Date(`${feriado.fecha.split('|')[0]}T00:00:00-03:00`).toLocaleDateString('es-AR', {
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })}
                </span>
                <span className="block text-base">
                  al{' '}
                  {new Date(`${feriado.fecha.split('|')[1]}T00:00:00-03:00`).toLocaleDateString('es-AR', {
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })}
                </span>
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm">Fecha:</p>
              <p className="text-base">
                {new Date(`${feriado.fecha}T00:00:00-03:00`).toLocaleDateString('es-AR', {
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleEliminarFeriado(feriado.id)}
          className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold mb-4">Feriados y Días No Laborables</h3>
      
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="fechaDesde" className="block text-sm font-medium mb-1">
              Fecha desde*
            </label>
            <input
              type="date"
              id="fechaDesde"
              value={nuevoFeriado.fechaDesde || ''}
              onChange={(e) => {
                const fechaDesde = e.target.value;
                setNuevoFeriado({
                  fechaDesde,
                  fechaHasta: fechaDesde // La fecha hasta se iguala automáticamente
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
            />
          </div>
          
          <div>
            <label htmlFor="fechaHasta" className="block text-sm font-medium  mb-1">
              Fecha hasta
            </label>
            <input
              type="date"
              id="fechaHasta"
              value={nuevoFeriado.fechaHasta || ''}
              onChange={(e) => setNuevoFeriado({...nuevoFeriado, fechaHasta: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              min={nuevoFeriado.fechaDesde || ''}
            />
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleAgregarFeriado}
          className="mt-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 transition-colors"
        >
          <i className="fas fa-plus mr-2"></i>
          Agregar Feriado
        </button>
      </div>
      
      {config.feriados.length === 0 ? (
        <div className="text-center py-4 rounded-lg border border-gray-200">
          <p className="">No hay feriados registrados</p>
        </div>
      ) : (
        <>
          {/* Vista de tabla para pantallas medianas y grandes */}
          <div className="hidden md:block overflow-x-auto border border-gray-200">
            <table className={`min-w-full ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
              <thead className="">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium  uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium  uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {config.feriados
                  .sort((a, b) => new Date(a.fecha.split('|')[0]) - new Date(b.fecha.split('|')[0]))
                  .map((feriado) => (
                    <tr key={feriado.id}>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold">
                          {feriado.fecha.includes('|') ? (
                            <span>
                              Del {new Date(`${feriado.fecha.split('|')[0]}T00:00:00-03:00`).toLocaleDateString('es-AR', {
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric'
                              })} al {new Date(`${feriado.fecha.split('|')[1]}T00:00:00-03:00`).toLocaleDateString('es-AR', {
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric'
                              })}
                            </span>
                          ) : (
                            new Date(`${feriado.fecha}T00:00:00-03:00`).toLocaleDateString('es-AR', {
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric'
                            })
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleEliminarFeriado(feriado.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          {/* Vista de cards para pantallas pequeñas */}
          <div className="md:hidden">
            {config.feriados
              .sort((a, b) => new Date(a.fecha.split('|')[0]) - new Date(b.fecha.split('|')[0]))
              .map((feriado) => (
                <FeriadoCard key={feriado.id} feriado={feriado} />
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FeriadosTab;