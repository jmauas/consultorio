// src/components/consultorio/DoctoresTab.js
import React from 'react';
import toast from 'react-hot-toast';

const DoctoresTab = ({ 
  config, 
  setConfig, 
  nuevoDoctor, 
  setNuevoDoctor, 
  nuevoFeriadoDoctor, 
  setNuevoFeriadoDoctor,
  consultorios
}) => {

  const handleAgregarDoctor = () => {
    if (!nuevoDoctor.nombre) {
      toast.error('El nombre del doctor es requerido');
      return;
    }
    
    setConfig({
      ...config,
      doctores: [
        ...config.doctores,
        {
          ...nuevoDoctor,
          id: Date.now().toString()
        }
      ]
    });
    
    setNuevoDoctor({
      nombre: '',
      emoji: '👨‍⚕️',
      feriados: []
    });
  };

  const handleEliminarDoctor = (id) => {
    setConfig({
      ...config,
      doctores: config.doctores.filter(doctor => doctor.id !== id)
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold mb-4">Doctores/Profesionales</h3>
      
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="nombreDoctor" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo*
            </label>
            <input
              type="text"
              id="nombreDoctor"
              value={nuevoDoctor.nombre}
              onChange={(e) => setNuevoDoctor({...nuevoDoctor, nombre: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ej: Dr. Juan Pérez"
            />
          </div>
          <div>
            <label htmlFor="emojiDoctor" className="block text-sm font-medium text-gray-700 mb-1">
              Emoji
            </label>
            <input
              type="text"
              id="emojiDoctor"
              value={nuevoDoctor.emoji}
              onChange={(e) => setNuevoDoctor({...nuevoDoctor, emoji: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ej: 👨‍⚕️"
            />
          </div>
        </div>
        
        {nuevoDoctor.id ? (
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => {
                const doctorIndex = config.doctores.findIndex(d => d.id === nuevoDoctor.id);
                if (doctorIndex !== -1) {
                  // Actualizar doctor existente
                  const newDoctores = [...config.doctores];
                  newDoctores[doctorIndex] = {
                    ...newDoctores[doctorIndex],
                    nombre: nuevoDoctor.nombre,
                    emoji: nuevoDoctor.emoji
                  };
                  setConfig({...config, doctores: newDoctores});
                  toast.success('Doctor actualizado correctamente');
                }
                // Limpiar el formulario
                setNuevoDoctor({
                  nombre: '',
                  emoji: '👨‍⚕️',
                  feriados: []
                });
              }}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              <i className="fas fa-save mr-2"></i>
              Guardar Cambios
            </button>
            <button
              type="button"
              onClick={() => {
                // Cancelar edición
                setNuevoDoctor({
                  nombre: '',
                  emoji: '👨‍⚕️',
                  feriados: []
                });
              }}
              className="mt-2 px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
            >
              <i className="fas fa-times mr-2"></i>
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAgregarDoctor}
            className="mt-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
          >
            <i className="fas fa-plus mr-2"></i>
            Agregar Doctor
          </button>
        )}
      </div>
      
      {config.doctores.length === 0 ? (
        <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">No hay doctores/profesionales registrados</p>
        </div>
      ) : (
        <div className="space-y-6">
          {config.doctores.map((doctor, doctorIndex) => (
            <div key={doctor.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="text-lg font-medium">
                    {doctor.emoji} {doctor.nombre}
                  </h4>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNuevoDoctor({
                        id: doctor.id,
                        nombre: doctor.nombre,
                        emoji: doctor.emoji,
                        feriados: doctor.feriados || []
                      });
                    }}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded-md hover:bg-blue-50"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEliminarDoctor(doctor.id)}
                    className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              
              {/* Sección Tipos de Turno */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Tipos de Turno:</h5>
                
                <div className="bg-white p-3 rounded-md border border-gray-200 mb-3">
                  <div className="text-sm font-medium text-gray-800 mb-2">Agregar nuevo tipo de turno</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <div>
                      <label htmlFor={`nombreTipoTurno-${doctor.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                        Nombre*
                      </label>
                      <input
                        type="text"
                        id={`nombreTipoTurno-${doctor.id}`}
                        value={doctor.nuevoTipoTurno?.nombre || ''}
                        onChange={(e) => {
                          const newDoctores = [...config.doctores];
                          const doctorIndex = newDoctores.findIndex(d => d.id === doctor.id);
                          if (doctorIndex !== -1) {
                            newDoctores[doctorIndex].nuevoTipoTurno = {
                              ...(newDoctores[doctorIndex].nuevoTipoTurno || {}),
                              nombre: e.target.value
                            };
                            setConfig({...config, doctores: newDoctores});
                          }
                        }}
                        placeholder="Ej: Consulta general"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label htmlFor={`duracionTipoTurno-${doctor.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                        Duración (minutos)*
                      </label>
                      <input
                        type="number"
                        id={`duracionTipoTurno-${doctor.id}`}
                        value={doctor.nuevoTipoTurno?.duracion || ''}
                        onChange={(e) => {
                          const newDoctores = [...config.doctores];
                          const doctorIndex = newDoctores.findIndex(d => d.id === doctor.id);
                          if (doctorIndex !== -1) {
                            newDoctores[doctorIndex].nuevoTipoTurno = {
                              ...(newDoctores[doctorIndex].nuevoTipoTurno || {}),
                              duracion: e.target.value
                            };
                            setConfig({...config, doctores: newDoctores});
                          }
                        }}
                        placeholder="30"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Consultorios donde aplica*
                    </label>
                    <div className="max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-md bg-gray-50">
                      {consultorios.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No hay consultorios disponibles</p>
                      ) : (
                        consultorios.map(consultorio => (
                          <div key={consultorio.id} className="flex items-center mb-1">
                            <input
                              type="checkbox"
                              id={`consultorio-${doctor.id}-${consultorio.id}`}
                              checked={doctor.nuevoTipoTurno?.consultorioIds?.includes(consultorio.id) || false}
                              onChange={(e) => {
                                const newDoctores = [...config.doctores];
                                const doctorIndex = newDoctores.findIndex(d => d.id === doctor.id);
                                if (doctorIndex !== -1) {
                                  const currentConsultorioIds = newDoctores[doctorIndex].nuevoTipoTurno?.consultorioIds || [];
                                  
                                  newDoctores[doctorIndex].nuevoTipoTurno = {
                                    ...(newDoctores[doctorIndex].nuevoTipoTurno || {}),
                                    consultorioIds: e.target.checked
                                      ? [...currentConsultorioIds, consultorio.id]
                                      : currentConsultorioIds.filter(id => id !== consultorio.id)
                                  };
                                  setConfig({...config, doctores: newDoctores});
                                }
                              }}
                              className="h-3 w-3 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`consultorio-${doctor.id}-${consultorio.id}`} className="ml-2 text-xs text-gray-700">
                              {consultorio.nombre}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`habilitado-${doctor.id}`}
                      checked={doctor.nuevoTipoTurno?.habilitado !== false}
                      onChange={(e) => {
                        const newDoctores = [...config.doctores];
                        const doctorIndex = newDoctores.findIndex(d => d.id === doctor.id);
                        if (doctorIndex !== -1) {
                          newDoctores[doctorIndex].nuevoTipoTurno = {
                            ...(newDoctores[doctorIndex].nuevoTipoTurno || {}),
                            habilitado: e.target.checked
                          };
                          setConfig({...config, doctores: newDoctores});
                        }
                      }}
                      className="h-3 w-3 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`habilitado-${doctor.id}`} className="ml-2 text-xs text-gray-700">
                      Habilitado
                    </label>
                  </div>
                  
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={async () => {
                        // Lógica para agregar o actualizar tipo de turno
                        const newDoctores = [...config.doctores];
                        const doctorIndex = newDoctores.findIndex(d => d.id === doctor.id);
                        
                        if (doctorIndex === -1) return;
                        
                        const nuevoTipo = newDoctores[doctorIndex].nuevoTipoTurno;
                        if (!nuevoTipo?.nombre) {
                          toast.error('El nombre del tipo de turno es requerido');
                          return;
                        }
                        if (!nuevoTipo?.duracion) {
                          toast.error('La duración del tipo de turno es requerida');
                          return;
                        }
                        if (!nuevoTipo?.consultorioIds || nuevoTipo.consultorioIds.length === 0) {
                          toast.error('Debe seleccionar al menos un consultorio');
                          return;
                        }
                        
                        try {
                          const isEditing = !!nuevoTipo.id;
                          
                          const response = await fetch('/api/configuracion/tipos-turno', {
                            method: isEditing ? 'PUT' : 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              id: nuevoTipo.id,
                              doctorId: doctor.id,
                              nombre: nuevoTipo.nombre,
                              duracion: nuevoTipo.duracion,
                              habilitado: nuevoTipo.habilitado !== false,
                              consultorioIds: nuevoTipo.consultorioIds
                            }),
                          });
                          
                          if (!response.ok) {
                            throw new Error(`Error: ${response.status}`);
                          }
                          
                          const data = await response.json();
                          
                          if (data.ok) {
                            // Actualizar doctores en el estado
                            const updatedDoctores = [...config.doctores];
                            const updatedDoctorIndex = updatedDoctores.findIndex(d => d.id === doctor.id);
                            
                            if (updatedDoctorIndex !== -1) {
                              // Si estamos editando, actualizar el tipo existente
                              if (isEditing && updatedDoctores[updatedDoctorIndex].tiposTurno) {
                                const tipoIndex = updatedDoctores[updatedDoctorIndex].tiposTurno.findIndex(t => t.id === nuevoTipo.id);
                                if (tipoIndex !== -1) {
                                  updatedDoctores[updatedDoctorIndex].tiposTurno[tipoIndex] = data.tipoTurno;
                                }
                              } 
                              // Si es nuevo, añadirlo al array
                              else {
                                if (!updatedDoctores[updatedDoctorIndex].tiposTurno) {
                                  updatedDoctores[updatedDoctorIndex].tiposTurno = [];
                                }
                                updatedDoctores[updatedDoctorIndex].tiposTurno.push(data.tipoTurno);
                              }
                              
                              // Limpiar el formulario
                              updatedDoctores[updatedDoctorIndex].nuevoTipoTurno = {
                                nombre: '',
                                duracion: '30',
                                habilitado: true,
                                consultorioIds: []
                              };
                              
                              setConfig({...config, doctores: updatedDoctores});
                              toast.success(isEditing ? 'Tipo de turno actualizado' : 'Tipo de turno agregado');
                            }
                          } else {
                            toast.error(data.error || 'Error al procesar el tipo de turno');
                          }
                        } catch (error) {
                          console.error('Error:', error);
                          toast.error(`Error: ${error.message}`);
                        }
                      }}
                      className={`px-3 py-1 ${doctor.nuevoTipoTurno?.id ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'} text-white text-xs rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
                    >
                      <i className={`fas ${doctor.nuevoTipoTurno?.id ? 'fa-save' : 'fa-plus'} mr-1`}></i>
                      {doctor.nuevoTipoTurno?.id ? 'Guardar Cambios' : 'Agregar Tipo de Turno'}
                    </button>
                    
                    {doctor.nuevoTipoTurno?.id && (
                      <button
                        type="button"
                        onClick={() => {
                          const newDoctores = [...config.doctores];
                          const doctorIndex = newDoctores.findIndex(d => d.id === doctor.id);
                          if (doctorIndex !== -1) {
                            newDoctores[doctorIndex].nuevoTipoTurno = {
                              nombre: '',
                              duracion: '30',
                              habilitado: true,
                              consultorioIds: []
                            };
                            setConfig({...config, doctores: newDoctores});
                          }
                        }}
                        className="ml-2 px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white text-xs rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                      >
                        <i className="fas fa-times mr-1"></i>
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Lista de tipos de turno */}
                {(!doctor.tiposTurno || doctor.tiposTurno.length === 0) ? (
                  <p className="text-sm text-gray-500 italic">No hay tipos de turno registrados</p>
                ) : (
                  <div className="space-y-2">
                    {doctor.tiposTurno.map((tipo) => (
                      <div key={tipo.id} className={`p-3 rounded-md border ${tipo.habilitado ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex justify-between">
                          <div>
                            <h6 className="font-medium text-gray-800 text-sm flex items-center">
                              {tipo.habilitado ? (
                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                              ) : (
                                <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                              )}
                              {tipo.nombre}
                              <span className="ml-2 text-xs text-gray-500">({tipo.duracion} min)</span>
                            </h6>
                            <div className="mt-1">
                              <span className="text-xs text-gray-600 font-medium">Consultorios: </span>
                              <span className="text-xs text-gray-500">
                                {tipo.consultorios && tipo.consultorios.length > 0 ? 
                                  tipo.consultorios.map(c => c.nombre).join(', ') : 
                                  'Ninguno asignado'}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                const newDoctores = [...config.doctores];
                                const doctorIndex = newDoctores.findIndex(d => d.id === doctor.id);
                                if (doctorIndex !== -1) {
                                  // Asegurarse de que se incluyan todos los consultorioIds correctamente
                                  const consultorioIds = tipo.consultorios?.map(c => c.id) || [];
                                  newDoctores[doctorIndex].nuevoTipoTurno = {
                                    id: tipo.id,
                                    nombre: tipo.nombre,
                                    duracion: tipo.duracion,
                                    habilitado: tipo.habilitado,
                                    consultorioIds: consultorioIds
                                  };
                                  setConfig({...config, doctores: newDoctores});
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            >
                              <i className="fas fa-edit text-xs"></i>
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm('¿Está seguro de eliminar este tipo de turno?')) {
                                  try {
                                    const response = await fetch(`/api/configuracion/tipos-turno?id=${tipo.id}`, {
                                      method: 'DELETE',
                                    });
                                    
                                    if (!response.ok) {
                                      throw new Error(`Error: ${response.status}`);
                                    }
                                    
                                    const data = await response.json();
                                    
                                    if (data.ok) {
                                      const newDoctores = [...config.doctores];
                                      const doctorIndex = newDoctores.findIndex(d => d.id === doctor.id);
                                      
                                      if (doctorIndex !== -1 && newDoctores[doctorIndex].tiposTurno) {
                                        newDoctores[doctorIndex].tiposTurno = newDoctores[doctorIndex].tiposTurno
                                          .filter(t => t.id !== tipo.id);
                                        setConfig({...config, doctores: newDoctores});
                                      }
                                      
                                      toast.success('Tipo de turno eliminado');
                                    } else {
                                      toast.error(data.error || 'Error al eliminar');
                                    }
                                  } catch (error) {
                                    console.error('Error:', error);
                                    toast.error(`Error: ${error.message}`);
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            >
                              <i className="fas fa-trash text-xs"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Días que no trabaja:</h5>
                
                {doctor.feriados && doctor.feriados.length > 0 ? (
                  <ul className="divide-y divide-gray-200 bg-white border border-gray-200 rounded-md">
                    {doctor.feriados.map((feriado, index) => (
                      <li key={index} className="px-4 py-3 flex justify-between items-center">
                        <span className="text-sm text-gray-800">
                          {feriado.includes('|') ? (
                            (() => {
                              const [fechaDesde, fechaHasta] = feriado.split('|');
                              const desde = new Date(`${fechaDesde}T00:00:00-03:00`);
                              const hasta = new Date(`${fechaHasta}T00:00:00-03:00`);
                              return (
                                <span className="flex items-center">
                                  <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-0.5 rounded mr-2">Rango</span>
                                  {desde.toLocaleDateString('es-AR', {day: 'numeric', month: 'short'})} al {hasta.toLocaleDateString('es-AR', {day: 'numeric', month: 'short', year: 'numeric'})}
                                </span>
                              );
                            })()
                          ) : (
                            <span className="flex items-center">
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded mr-2">No atiende</span>
                              {new Date(`${feriado}T00:00:00-03:00`).toLocaleDateString('es-AR', {day: 'numeric', month: 'long', year: 'numeric'})}
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newDoctores = [...config.doctores];
                            newDoctores[doctorIndex].feriados = newDoctores[doctorIndex].feriados.filter((_, i) => i !== index);
                            setConfig({...config, doctores: newDoctores});
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No hay días registrados</p>
                )}
              </div>
              
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Agregar día no laborable:</h5>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[200px]">
                    <label htmlFor={`fechaDesde${doctor.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                      Fecha desde*
                    </label>
                    <input
                      type="date"
                      id={`fechaDesde${doctor.id}`}
                      value={nuevoFeriadoDoctor.fechaDesde}
                      onChange={(e) => {
                        const fechaDesde = e.target.value;
                        setNuevoFeriadoDoctor({
                          fechaDesde,
                          fechaHasta: fechaDesde
                        });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label htmlFor={`fechaHasta${doctor.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                      Fecha hasta
                    </label>
                    <input
                      type="date"
                      id={`fechaHasta${doctor.id}`}
                      value={nuevoFeriadoDoctor.fechaHasta}
                      onChange={(e) => setNuevoFeriadoDoctor({...nuevoFeriadoDoctor, fechaHasta: e.target.value})}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!nuevoFeriadoDoctor.fechaDesde) {
                        toast.error('La fecha desde es requerida');
                        return;
                      }
                      
                      const newDoctores = [...config.doctores];
                      if (!newDoctores[doctorIndex].feriados) {
                        newDoctores[doctorIndex].feriados = [];
                      }
                      
                      const fechaDesde = nuevoFeriadoDoctor.fechaDesde;
                      const fechaHasta = nuevoFeriadoDoctor.fechaHasta;
                      
                      const feriadoStr = fechaDesde === fechaHasta 
                        ? fechaDesde 
                        : `${fechaDesde}|${fechaHasta}`;
                      
                      newDoctores[doctorIndex].feriados.push(feriadoStr);
                      setConfig({...config, doctores: newDoctores});
                      
                      setNuevoFeriadoDoctor({
                        fechaDesde: '',
                        fechaHasta: ''
                      });
                    }}
                    className="px-4 py-1.5 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors h-[34px] w-auto"
                  >
                    <i className="fas fa-plus mr-1"></i>
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctoresTab;