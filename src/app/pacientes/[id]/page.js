'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';
import DetalleTurno from '@/components/DetalleTurno';
import { obtenerCoberturasDesdeDB } from '@/lib/utils/coberturasUtils';
import Loader from '@/components/Loader';
import { formatoFecha } from '@/lib/utils/dateUtils';
import { useTheme } from 'next-themes';

export default function PacienteDetallePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { theme, setTheme } = useTheme();
  
  const [paciente, setPaciente] = useState(null);
  const [asa, setAsa] = useState(false);
  const [ccr, setCcr] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    celular: '',
    email: '',
    cobertura: '',
    observaciones: ''
  });
  const [viewOpacity, setViewOpacity] = useState(1);
  const [editOpacity, setEditOpacity] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const [turnos, setTurnos] = useState({
    proximos: [],
    pasados: [],
    cancelados: []
  });

  const [coberturasDisponibles, setCoberturasDisponibles] = useState([]);

  const cargarPaciente = async (pacienteId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/pacientes/${pacienteId}`);
      
      if (!response.ok) {
        throw new Error(`Error al cargar datos del paciente: ${response.error || response.statusText}`);
      }
      
      const data = await response.json();
      if (data.ok && data.pacientes && data.pacientes.length > 0) {
        const pacienteData = data.pacientes[0];
        setPaciente(pacienteData);
        
        setFormData({
          nombre: pacienteData.nombre || '',
          apellido: pacienteData.apellido || '',
          dni: pacienteData.dni || '',
          celular: pacienteData.celular || '',
          email: pacienteData.email || '',
          cobertura: pacienteData.cobertura || '',
          observaciones: pacienteData.observaciones || ''
        });

        if (pacienteData.turnos) {
          procesarTurnos(pacienteData.turnos);
          setAsa(pacienteData.asa || false);
          setCcr(pacienteData.ccr || false);
        }
      } else {
        throw new Error('No se encontró información del paciente');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const procesarTurnos = (turnosData) => {
    const turnosProcesados = {
      proximos: [],
      pasados: [],
      cancelados: []
    };

    if (Array.isArray(turnosData)) {
      const ahora = new Date();
      turnosData.forEach(turno => {
        const fechaTurno = new Date(turno.desde);
        const esCancelado = turno.estado.toLowerCase().includes('cancelado');
        
        if (esCancelado) {
          turnosProcesados.cancelados.push(turno);
        } else if (fechaTurno > ahora) {
          turnosProcesados.proximos.push(turno);
        } else {
          turnosProcesados.pasados.push(turno);
        }
      });
    }

    setTurnos(turnosProcesados);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCoberturaChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      cobertura: coberturasDisponibles.find(c => c.id === value)?.codigo || ''
    }));
  };

  const handleCancelarEdicion = () => {
    setIsTransitioning(true);
    setEditOpacity(0);
    
    setTimeout(() => {
      setEditing(false);
      setViewOpacity(1);
      setIsTransitioning(false);
      
      if (paciente) {
        setFormData({
          nombre: paciente.nombre || '',
          apellido: paciente.apellido || '',
          dni: paciente.dni || '',
          celular: paciente.celular || '',
          email: paciente.email || '',
          cobertura: paciente.cobertura || '',
          coberturaMedicaId: paciente.coberturaMedicaId || '',
          observaciones: paciente.observaciones || ''
        });
      }
    }, 600);
  };

  const handleEditClick = () => {
    setIsTransitioning(true);
    setViewOpacity(0);
    
    setTimeout(() => {
      setEditing(true);
      setEditOpacity(1);
      setIsTransitioning(false);
    }, 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const response = await fetch(`/api/pacientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`Error al guardar cambios: ${response.error || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.ok) {
        setPaciente({
          ...paciente,
          ...formData
        });
        setEditing(false);
        
        toast.success('Datos actualizados correctamente');
      } else {
        throw new Error(data.message || 'Error al actualizar datos');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const abrirModalTurno = (turno) => {
    setTurnoSeleccionado({...turno, paciente: paciente});
    setModalAbierto(true);
  };

  const cerrarModalTurno = () => {
    setModalAbierto(false);
    setTurnoSeleccionado(null);
  };

  useEffect(() => {
    if (id) {
      cargarPaciente(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const cargarCoberturas = async () => {
      const coberturas = await obtenerCoberturasDesdeDB();
      setCoberturasDisponibles(coberturas);
    };
    cargarCoberturas();
  }, []);

  if (loading) {
    return (
      <Loader titulo={'Cargando Información del Paciente ...'}/>      
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => router.push('/pacientes')}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Volver a la lista de pacientes
          </button>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded relative mb-6">
          <strong className="font-bold">Aviso: </strong>
          <span className="block sm:inline">No se encontró información del paciente.</span>
        </div>
        <div className="flex justify-center">
          <button
            onClick={() => router.push('/pacientes')}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Volver a la lista de pacientes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link href="/pacientes" className="text-blue-500 hover:text-blue-700">
            &larr; Volver a la lista de pacientes
          </Link>
          <h1 className="text-2xl font-bold mt-1">
            {paciente.nombre} {paciente.apellido}
          </h1>
        </div>
        {!editing ? (
          <button
            onClick={handleEditClick}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Editar Paciente
          </button>
        ) : null}
      </div>

      <div className="shadow rounded-lg overflow-hidden mb-6 relative">
        <div 
          className={`transition-opacity duration-600 ${editing ? 'opacity-0 pointer-events-none' : ''}`} 
          style={{ 
            opacity: viewOpacity,
            transition: 'opacity 600ms ease-in-out',
            position: editing ? 'absolute' : 'relative',
            width: '100%',
            zIndex: editing ? 0 : 1,
          }}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Información del Paciente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <h3 className="text-sm font-medium">Nombre Completo</h3>
                <p className="mt-1 text-base font-bold">{paciente.nombre} {paciente.apellido || ''}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">DNI</h3>
                <p className="mt-1 text-base font-bold">{paciente.dni || '-'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Celular</h3>
                <p className="mt-1 text-base font-bold">{paciente.celular}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Email</h3>
                <p className="mt-1 text-base font-bold">{paciente.email || '-'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium">Cobertura Médica</h3>
                <p className="mt-1 text-base font-bold">{paciente.cobertura || '-'}</p>
              </div>
              
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium">Observaciones</h3>
                <p className="mt-1 text-base font-bold">
                  {paciente.observaciones || 'No hay observaciones registradas.'}
                </p>
              </div>
            </div>
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="space-y-3">
                <div className="flex justify-start items-center gap-4 ">
                  <p className="text-sm">Creado:</p>
                  <p className="font-medium">{formatoFecha(paciente.createdAt, true, true, false, true, false, false) || 'No especificado'}</p>
                  <p className="text-sm">Por:</p>
                  <p className="font-medium">{paciente.createdBy?.name || 'No especificado'}</p>
                </div>
                <div className="flex justify-start items-center gap-4 ">
                  <p className="text-sm">Modificado:</p>
                  <p className="font-medium">{formatoFecha(paciente.updatedAt, true, true, false, true, false, false) || 'No especificado'}</p>
                  <p className="text-sm">Por:</p>
                  <p className="font-medium">{paciente.updatedBy?.name || 'No especificado'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div 
          className={`transition-opacity duration-600 ${!editing ? 'opacity-0 pointer-events-none' : ''}`} 
          style={{ 
            opacity: editOpacity,
            transition: 'opacity 600ms ease-in-out',
            position: !editing ? 'absolute' : 'relative',
            width: '100%',
            zIndex: editing ? 1 : 0,
          }}
        >
          <form onSubmit={handleSubmit} className="p-6">
            <h2 className="text-lg font-semibold mb-4">Editar Información del Paciente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium mb-1">
                  Nombre*
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="apellido" className="block text-sm font-medium mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="dni" className="block text-sm font-medium mb-1">
                  DNI
                </label>
                <input
                  type="number"
                  inputMode="tel"
                  id="dni"
                  name="dni"
                  value={formData.dni}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="celular" className="block text-sm font-medium mb-1">
                  Celular*
                </label>
                <input
                  type="number"
                  inputMode="tel"
                  id="celular"
                  name="celular"
                  value={formData.celular}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  inputMode="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="cobertura" className="block text-sm font-medium mb-1">
                  Cobertura Médica
                </label>
                <select
                  id="cobertura"
                  name="coberturaMedicaId"
                  value={formData.coberturaMedicaId}
                  onChange={handleCoberturaChange}
                  className={`px-3 py-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme==='dark' ? 'bg-slate-900 text-slate-200' : 'bg-slate-200 text-slate-900'}`}
                >
                  <option value="" disabled>Seleccionar Cobertura</option>
                  {coberturasDisponibles.map((cobertura) => (
                    <option key={cobertura.id} value={cobertura.id}>
                      {cobertura.nombre} ({cobertura.codigo})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="observaciones" className="block text-sm font-medium mb-1">
                Observaciones
              </label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows="3"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCancelarEdicion}
                disabled={saving}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center"
              >
                {saving ? (
                  <Loader titulo={'Guardando ...'}/>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Historial de Turnos</h2>
            <Link 
              href={`/turnos/nuevo?pacienteId=${id}`}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a 1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Nuevo Turno
            </Link>
          </div>
        </div>
        <div className="flex justify-center items-center mt-4 mb-4 flex-wrap">
          {asa && (
            <span className="m-5 p-5 text-md bg-red-200 font-bold text-red-700 rounded-lg">
                <i className="fa-solid fa-ban mr-4 fa-xl"></i>
                ASA - Paciente con Cancelación sin Previo Aviso.
                <i className="fa-solid fa-ban ml-4 fa-xl"></i>
            </span>
          )}
          {ccr && (
            <span className="m-5 p-5 text-md bg-yellow-200 font-bold text-yellow-700 rounded-lg">
                <i className="fas fa-exclamation-triangle mr-4 fa-xl"></i>
                CCR - Paciente con Cancelación dentro de las 48 Hs.
                <i className="fas fa-exclamation-triangle ml-4 fa-xl"></i>
            </span>
          )}
        </div>

        <div className="p-6">
            {turnos.cancelados && turnos.cancelados.length > 0 && (
            <div className="mb-6">
              <h3 className="text-md font-medium mb-2">Turnos Cancelados</h3>
              <div className="border rounded-md divide-y divide-gray-200">
                {turnos.cancelados.map((turno) => (
                  <div key={turno.id} className={`p-3 hover:bg-slate-300 ${theme==='dark' ? 'bg-slate-900 text-white' : 'bg-red-50'}`}>
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{new Date(turno.desde).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}</p>
                        <p className="text-sm">
                          {new Date(turno.desde).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        <div className='flex items-center gap-3'>
                          <p className="text-sm mt-1 text-red-600">CANCELADO</p>
                          {turno.penal == 'asa' && <i className="fa-solid fa-ban fa-lg text-red-500 p-4 border rounded-lg"></i>}          
                          {turno.penal == 'ccr' && <i className="fas fa-exclamation-triangle fa-lg text-yellow-500 p-4 border rounded-lg"></i>}
                        </div>
                      </div>
                      <div>
                        <button 
                          onClick={() => abrirModalTurno(turno)}
                          className="text-blue-500 hover:text-blue-700 text-sm p-4 border-1 border-blue-500 rounded-lg"
                          title="Ver detalle"
                        >
                          <i className="fas fa-eye fa-lg"></i>
                        </button>                       
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mb-6">
            <h3 className="text-md font-medium mb-2">Próximos Turnos</h3>
            {turnos.proximos && turnos.proximos.length > 0 ? (
              <div className="border rounded-md divide-y divide-gray-200">
                {turnos.proximos.map((turno) => (
                  <div key={turno.id} className="p-3 hover:bg-slate-300">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{new Date(turno.desde).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}</p>
                        <p className="text-sm">
                          {new Date(turno.desde).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                          {' - '}
                          {new Date(turno.hasta).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        <p className="text-sm mt-1">
                          {turno.doctor.nombre || 'Sin doctor asignado'}
                          {' - '}
                          {turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado'}
                        </p>
                      </div>
                      <div>
                      <button 
                          onClick={() => abrirModalTurno(turno)}
                          className="text-blue-500 hover:text-blue-700 text-sm p-4 border-1 border-blue-500 rounded-lg"
                          title="Ver detalle"
                        >
                          <i className="fas fa-eye fa-lg"></i>
                        </button>  
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm italic">No hay turnos próximos programados.</p>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-md font-medium mb-2">Historial de Turnos</h3>
            {turnos.pasados && turnos.pasados.length > 0 ? (
              <div className="border rounded-md divide-y divide-gray-200">
                {turnos.pasados.map((turno) => (
                  <div key={turno.id} className="p-3 hover:bg-slate-300">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{new Date(turno.desde).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}</p>
                        <p className="text-sm">
                          {new Date(turno.desde).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        <p className="text-sm mt-1">
                          {turno.doctor.nombre || 'Sin doctor asignado'}
                          {' - '}
                          {turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado'}
                        </p>
                      </div>
                      <div>
                      <button 
                          onClick={() => abrirModalTurno(turno)}
                          className="text-blue-500 hover:text-blue-700 text-sm p-4 border-1 border-blue-500 rounded-lg"
                          title="Ver detalle"
                        >
                          <i className="fas fa-eye fa-lg"></i>
                        </button>  
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm italic">No hay historial de turnos anteriores.</p>
            )}
          </div>          
        </div>
      </div>

      <Modal
        isOpen={modalAbierto}
        onClose={cerrarModalTurno}
        size="large"
        title="Detalle de Turno"
      >
        {turnoSeleccionado && (
          <DetalleTurno 
            turno={turnoSeleccionado}
            onClose={cerrarModalTurno}
            onSuccess={(tipo, datos) => {
              if (tipo === 'delete' || tipo === 'update') {
                cargarPaciente(id);
              }
              if (tipo === 'delete') {
                setTimeout(() => cerrarModalTurno(), 1500);
              }
            }}
            isModal={true}
          />
        )}
      </Modal>
    </div>
  );
}