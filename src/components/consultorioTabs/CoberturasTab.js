// src/components/consultorio/CoberturasTab.js
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Loader from '@/components/Loader';
import { obtenerCoberturasDesdeDB } from '@/lib/utils/coberturasUtils';
import { isColorLight } from '@/lib/utils/variosUtils';

const CoberturasTab = () => {
  // Estado para manejar coberturas y formulario
  const [coberturas, setCoberturas] = useState([]);
  const [nuevaCobertura, setNuevaCobertura] = useState({ 
    nombre: '', 
    codigo: '', 
    habilitado: true,
    color: '#CCCCCC' 
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Cargar coberturas desde el API al montar el componente
  useEffect(() => {
    const cargarCoberturas = async () => {
      try {
        setCargando(true);
        const coberturasData = await obtenerCoberturasDesdeDB();
        setCoberturas(coberturasData || []);
      } catch (error) {
        console.error('Error al cargar coberturas médicas:', error);
        toast.error('Error al cargar coberturas médicas');
      } finally {
        setCargando(false);
      }
    };
  
    cargarCoberturas();
  }, []);

  const handleAgregarCobertura = async () => {
    if (!nuevaCobertura.nombre) {
      toast.error('El nombre de la cobertura es requerido');
      return;
    }
    try {
      setGuardando(true);
      const response = await fetch('/api/configuracion/coberturas-medicas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nuevaCobertura.nombre,
          codigo: nuevaCobertura.codigo,
          habilitado: nuevaCobertura.habilitado,
          color: nuevaCobertura.color || '#CCCCCC'
        }),
      });

      const data = await response.json();
      
      if (data.ok && data.cobertura) {
        // Agregamos la nueva cobertura al array
        setCoberturas([...coberturas, data.cobertura]);
        // Limpiar el formulario
        setNuevaCobertura({ nombre: '', codigo: '', habilitado: true, color: '#CCCCCC' });
        toast.success('Cobertura médica agregada correctamente');
      } else {
        toast.error(data.error || 'Error al agregar la cobertura');
      }
    } catch (error) {
      console.error('Error al agregar cobertura:', error);
      toast.error('Error al agregar la cobertura');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditarCobertura = (cobertura) => {
    setNuevaCobertura(cobertura);
  };

  const handleActualizarCobertura = async () => {
    if (!nuevaCobertura.id) {
      toast.error('Error: ID de cobertura no disponible');
      return;
    }

    try {
      setGuardando(true);
      const response = await fetch(`/api/configuracion/coberturas-medicas/${nuevaCobertura.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nuevaCobertura.nombre,
          codigo: nuevaCobertura.codigo,
          habilitado: nuevaCobertura.habilitado,
          color: nuevaCobertura.color || '#CCCCCC'
        }),
      });

      const data = await response.json();
      
      if (data.ok && data.cobertura) {
        setCoberturas(coberturas.map(c => 
          c.id === data.cobertura.id ? {...data.cobertura} : c
        ));
        setNuevaCobertura({ nombre: '', codigo: '', habilitado: true, color: '#CCCCCC' });
        toast.success('Cobertura actualizada correctamente');
      } else {
        toast.error(data.error || 'Error al actualizar la cobertura');
      }
    } catch (error) {
      console.error('Error al actualizar cobertura:', error);
      toast.error('Error al actualizar la cobertura');
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelarEdicionCobertura = () => {
    setNuevaCobertura({ nombre: '', codigo: '', habilitado: true, color: '#CCCCCC' });
  };

  // Componente de Card para mostrar en pantallas pequeñas
  const CoberturaCard = ({ cobertura }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-lg font-medium text-gray-900">{cobertura.nombre}</h4>
        <span className={`text-xs font-bold p-2 rounded-2xl ${cobertura.fondo} ${cobertura.color}`}>
          {cobertura.codigo ? cobertura.codigo.toUpperCase() : '--'}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <p className="text-xs text-gray-500">Código</p>
          <p className="text-sm text-gray-700">{cobertura.codigo || '--'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Estado</p>
          {cobertura.habilitado ? (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
              Activa
            </span>
          ) : (
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
              Inactiva
            </span>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500">Color</p>
          <div className="flex items-center space-x-2 mt-1">
            <div 
              className="w-4 h-4 rounded-full border border-gray-300" 
              style={{ backgroundColor: cobertura.color || '#CCCCCC' }}
            ></div>
            <span className="text-xs">{cobertura.color || '#CCCCCC'}</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => handleEditarCobertura(cobertura)}
          className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50 flex items-center"
          disabled={guardando}
        >
          <i className="fas fa-edit mr-1"></i>
          Editar
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold mb-4">Coberturas Médicas</h3>
      
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="nombreCobertura" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Cobertura*
            </label>
            <input
              type="text"
              id="nombreCobertura"
              value={nuevaCobertura.nombre}
              onChange={(e) => setNuevaCobertura({...nuevaCobertura, nombre: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ej: OSDE"
            />
          </div>
          
          <div>
            <label htmlFor="codigoCobertura" className="block text-sm font-medium text-gray-700 mb-1">
              Código
            </label>
            <input
              type="text"
              id="codigoCobertura"
              value={nuevaCobertura.codigo || ''}
              onChange={(e) => setNuevaCobertura({...nuevaCobertura, codigo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ej: osde"
            />
          </div>

          {/* Nuevo campo para el color */}
          <div>
            <label htmlFor="colorCobertura" className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                id="colorCobertura"
                value={nuevaCobertura.color || '#CCCCCC'}
                onChange={(e) => setNuevaCobertura({...nuevaCobertura, color: e.target.value})}
                className="h-10 w-16 p-0 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                id="colorCoberturaText"
                value={nuevaCobertura.color || '#CCCCCC'}
                onChange={(e) => setNuevaCobertura({...nuevaCobertura, color: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                placeholder="#CCCCCC"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center mt-3">
          <input
            type="checkbox"
            id="habilitadoCobertura"
            checked={nuevaCobertura.habilitado !== false}
            onChange={(e) => setNuevaCobertura({...nuevaCobertura, habilitado: e.target.checked})}
            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
          />
          <label htmlFor="habilitadoCobertura" className="ml-2 text-sm text-gray-700">
            Habilitado
          </label>
        </div>
        
        {nuevaCobertura.id ? (
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleActualizarCobertura}
              disabled={guardando}
              className={`mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors ${guardando ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {guardando ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Guardar Cambios
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleCancelarEdicionCobertura}
              disabled={guardando}
              className="mt-2 px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
            >
              <i className="fas fa-times mr-2"></i>
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAgregarCobertura}
            disabled={guardando}
            className={`mt-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors ${guardando ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {guardando ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Agregando...
              </>
            ) : (
              <>
                <i className="fas fa-plus mr-2"></i>
                Agregar Cobertura
              </>
            )}
          </button>
        )}
      </div>
      
      {cargando ? (
        <Loader titulo={'Cargando Coberturas ...'}/>
      ) : coberturas.length === 0 ? (
        <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">No hay coberturas médicas registradas</p>
        </div>
      ) : (
        <>
          {/* Vista de tabla para pantallas medianas y grandes */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vista Previa
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coberturas.map((cobertura) => (
                  <tr key={cobertura.id}>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{cobertura.nombre}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-gray-700">{cobertura.codigo || '--'}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {cobertura.habilitado ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Activa
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Inactiva
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-6 h-6 rounded-full border border-gray-300" 
                          style={{ backgroundColor: cobertura.color || '#CCCCCC' }}
                        ></div>
                        <span>{cobertura.color || '#CCCCCC'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                        <span 
                          className="px-2 py-1 inline-flex text-sm font-medium rounded-lg"
                          style={{ 
                            backgroundColor: cobertura.color || '#CCCCCC',
                            color: isColorLight(cobertura.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
                          }}
                        >
                          {cobertura.codigo ? cobertura.codigo.toUpperCase() : '--'}
                        </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditarCobertura(cobertura)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50"
                          disabled={guardando}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Vista de cards para pantallas pequeñas */}
          <div className="md:hidden">
            {coberturas.map((cobertura) => (
              <CoberturaCard key={cobertura.id} cobertura={cobertura} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CoberturasTab;