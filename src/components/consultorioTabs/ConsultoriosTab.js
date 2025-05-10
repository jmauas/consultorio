// src/components/consultorio/ConsultoriosTab.js
import React from 'react';
import toast from 'react-hot-toast';
import { isColorLight } from '@/lib/utils/variosUtils';

const ConsultoriosTab = ({ 
  consultorios, 
  setConsultorios, 
  nuevoConsultorio, 
  setNuevoConsultorio 
}) => {
  // Componente Card para pantallas pequeñas
  const ConsultorioCard = ({ consultorio }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-lg font-medium text-gray-900">{consultorio.nombre}</h4>
        <div 
          className="w-6 h-6 rounded-full border border-gray-300" 
          style={{ backgroundColor: consultorio.color || '#CCCCCC' }}
          title={consultorio.color || '#CCCCCC'}
        ></div>
      </div>
      
      <div className="space-y-2 mb-3">
        <div>
          <p className="text-xs text-gray-500">Dirección</p>
          <p className="text-sm text-gray-700">{consultorio.direccion || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Teléfono</p>
          <p className="text-sm text-gray-700">{consultorio.telefono || '-'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Email</p>
          <p className="text-sm text-gray-700">{consultorio.email || '-'}</p>
        </div>
      </div>
      <span 
        className="px-2 py-1 inline-flex text-sm font-medium rounded-lg"
        style={{ 
          backgroundColor: consultorio.color || '#CCCCCC',
          color: isColorLight(consultorio.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
        }}
      >
        {consultorio.nombre ? consultorio.nombre : '--'}
      </span>
      
      <div className="flex justify-end border-t border-gray-100 pt-3 space-x-2">
        <button
          type="button"
          onClick={() => {
            setNuevoConsultorio({
              id: consultorio.id,
              nombre: consultorio.nombre,
              direccion: consultorio.direccion || '',
              telefono: consultorio.telefono || '',
              email: consultorio.email || '',
              color: consultorio.color || '#CCCCCC'
            });
          }}
          className="text-blue-600 hover:text-blue-800 border rounded-lg p-2 hover:bg-blue-50 flex items-center"
        >
          <i className="fas fa-edit mr-1"></i>
          Editar
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              const response = await fetch(`/api/configuracion/consultorios?id=${consultorio.id}`, {
                method: 'DELETE',
              });
              
              if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
              }
              
              const data = await response.json();
              
              if (data.ok) {
                setConsultorios(consultorios.filter(c => c.id !== consultorio.id));
                toast.success('Consultorio eliminado correctamente');
              } else {
                toast.error(data.error || 'Error al eliminar consultorio');
              }
            } catch (error) {
              console.error('Error al eliminar consultorio:', error);
              toast.error(`Error: ${error.message}`);
            }
          }}
          className="text-red-600 hover:text-red-900 border rounded-lg p-2 hover:bg-red-50 flex items-center"
        >
          <i className="fas fa-trash mr-1"></i>
          Eliminar
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold mb-4">Consultorios/Sucursales</h3>
      
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="nombreConsultorio" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Consultorio*
            </label>
            <input
              type="text"
              id="nombreConsultorio"
              value={nuevoConsultorio?.nombre || ''}
              onChange={(e) => setNuevoConsultorio({...nuevoConsultorio || {}, nombre: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ej: Consultorio 1"
            />
          </div>
          
          <div>
            <label htmlFor="direccionConsultorio" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              id="direccionConsultorio"
              value={nuevoConsultorio?.direccion || ''}
              onChange={(e) => setNuevoConsultorio({...nuevoConsultorio || {}, direccion: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ej: Av. Rivadavia 1234"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="telefonoConsultorio" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="text"
              id="telefonoConsultorio"
              value={nuevoConsultorio?.telefono || ''}
              onChange={(e) => setNuevoConsultorio({...nuevoConsultorio || {}, telefono: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ej: 11 1234-5678"
            />
          </div>
          
          <div>
            <label htmlFor="emailConsultorio" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="emailConsultorio"
              value={nuevoConsultorio?.email || ''}
              onChange={(e) => setNuevoConsultorio({...nuevoConsultorio || {}, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ej: consultorio@ejemplo.com"
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="colorConsultorio" className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="color"
              id="colorConsultorio"
              value={nuevoConsultorio?.color || '#CCCCCC'}
              onChange={(e) => setNuevoConsultorio({...nuevoConsultorio || {}, color: e.target.value})}
              className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
            />
            <div className="flex items-center space-x-2">
              <div 
                className="w-10 h-10 rounded-full border border-gray-300" 
                style={{ backgroundColor: nuevoConsultorio?.color || '#CCCCCC' }}
              ></div>
              <span className="text-sm text-gray-500">{nuevoConsultorio?.color || '#CCCCCC'}</span>
            </div>
          </div>
        </div>
        
        {nuevoConsultorio?.id ? (
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const response = await fetch(`/api/configuracion/consultorios`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(nuevoConsultorio),
                  });
                  
                  if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                  }
                  
                  const data = await response.json();
                  
                  if (data.ok) {
                    // Actualizar la lista de consultorios
                    setConsultorios(prevConsultorios => 
                      prevConsultorios.map(c => 
                        c.id === nuevoConsultorio.id ? data.consultorio : c
                      )
                    );
                    
                    // Limpiar el formulario
                    setNuevoConsultorio({
                      nombre: '',
                      direccion: '',
                      telefono: '',
                      email: '',
                      color: '#CCCCCC'
                    });
                    
                    toast.success('Consultorio actualizado correctamente');
                  } else {
                    toast.error(data.error || 'Error al actualizar consultorio');
                  }
                } catch (error) {
                  console.error('Error al actualizar consultorio:', error);
                  toast.error(`Error: ${error.message}`);
                }
              }}
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <i className="fas fa-save mr-2"></i>
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={() => {
                setNuevoConsultorio({
                  nombre: '',
                  direccion: '',
                  telefono: '',
                  email: '',
                  color: '#CCCCCC'
                });
              }}
              className="mt-4 px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
            >
              <i className="fas fa-times mr-2"></i>
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={async () => {
              if (!nuevoConsultorio?.nombre) {
                toast.error('El nombre del consultorio es requerido');
                return;
              }
              
              try {
                const response = await fetch('/api/configuracion/consultorios', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(nuevoConsultorio),
                });
                
                if (!response.ok) {
                  throw new Error(`Error: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data.ok) {
                  setConsultorios([...consultorios, data.consultorio]);
                  setNuevoConsultorio({
                    nombre: '',
                    direccion: '',
                    telefono: '',
                    email: '',
                    color: '#CCCCCC'
                  });
                  toast.success('Consultorio agregado correctamente');
                } else {
                  toast.error(data.error || 'Error al agregar consultorio');
                }
              } catch (error) {
                console.error('Error al agregar consultorio:', error);
                toast.error(`Error: ${error.message}`);
              }
            }}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>
            Agregar Consultorio
          </button>
        )}
      </div>
      
      {consultorios.length === 0 ? (
        <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">No hay consultorios registrados</p>
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
                    Color
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
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
                {consultorios.map((consultorio) => (
                  <tr key={consultorio.id}>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{consultorio.nombre}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div 
                          className="w-6 h-6 rounded-full border border-gray-300 mr-2" 
                          style={{ backgroundColor: consultorio.color || '#CCCCCC' }}
                        ></div>
                        <span>{consultorio.color || '#CCCCCC'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {consultorio.direccion || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {consultorio.telefono || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {consultorio.email || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                        <span 
                          className="px-2 py-1 inline-flex text-sm font-medium rounded-lg"
                          style={{ 
                            backgroundColor: consultorio.color || '#CCCCCC',
                            color: isColorLight(consultorio.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
                          }}
                        >
                          {consultorio.nombre ? consultorio.nombre : '--'}
                        </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNuevoConsultorio({
                              id: consultorio.id,
                              nombre: consultorio.nombre,
                              direccion: consultorio.direccion || '',
                              telefono: consultorio.telefono || '',
                              email: consultorio.email || '',
                              color: consultorio.color || '#CCCCCC'
                            });
                          }}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/configuracion/consultorios?id=${consultorio.id}`, {
                                method: 'DELETE',
                              });
                              
                              if (!response.ok) {
                                throw new Error(`Error: ${response.status}`);
                              }
                              
                              const data = await response.json();
                              
                              if (data.ok) {
                                setConsultorios(consultorios.filter(c => c.id !== consultorio.id));
                                toast.success('Consultorio eliminado correctamente');
                              } else {
                                toast.error(data.error || 'Error al eliminar consultorio');
                              }
                            } catch (error) {
                              console.error('Error al eliminar consultorio:', error);
                              toast.error(`Error: ${error.message}`);
                            }
                          }}
                          className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
                        >
                          <i className="fas fa-trash"></i>
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
            {consultorios.map((consultorio) => (
              <ConsultorioCard key={consultorio.id} consultorio={consultorio} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ConsultoriosTab;