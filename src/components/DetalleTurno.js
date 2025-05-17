'use client';

import { useState, useEffect } from 'react';
import { formatoFecha, formatoDuracion } from '@/lib/utils/dateUtils';
import { enviarRecordatorioTurno } from '@/lib/services/sender/whatsappService';
import { obtenerCoberturasDesdeDB } from '@/lib/utils/coberturasUtils';
import { obtenerEstados } from '@/lib/utils/estadosUtils';
import { isColorLight } from '@/lib/utils/variosUtils';
import Link from 'next/link';
import Loader from '@/components/Loader';

export default function DetalleTurno({ 
  turno, 
  onClose, 
  onSuccess, 
  isModal = false 
}) {
  // const [turno, setTurno] = useState(null);
  const turnoId = turno?.id || null;
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState('');


  // Estado para controlar el modo de edición
  const [modoEdicion, setModoEdicion] = useState(false);
  
  // Estados para almacenar los datos editables
  const [datosEditados, setDatosEditados] = useState({
    servicio: '',
    duracion: 0,
    desde: '',
    observaciones: '',
    coberturaMedicaId: '',
  });

  // Agregando estado para las coberturas y estados disponibles
  const [coberturas, setCoberturas] = useState([]);
  const [estados, setEstados] = useState([]);

  const cargarTurno = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/turnos/${id}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar datos del turno');
      }
      
      const data = await response.json();
      
      if (data.ok && data.turno) {
        turno = data.turno;
        // Inicializar los datos editables con los valores actuales del turno
        inicializarDatosEditables(data.turno);
      } else {
        throw new Error(data.message || 'No se pudo obtener información del turno');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para inicializar los datos editables cuando se carga el turno
  const inicializarDatosEditables = (turnoData) => {
    if (!turnoData) return;
    
    // Convertir la fecha a formato para input datetime-local
    const desde = new Date(turnoData.desde);
    const fechaHoraLocal = new Date(desde.getTime() - desde.getTimezoneOffset() * 60000)
      .toISOString()
      .substring(0, 16);
    
    setDatosEditados({
      servicio: turnoData.servicio || '',
      duracion: turnoData.duracion || 30,
      desde: fechaHoraLocal,
      observaciones: turnoData.observaciones || '',
      coberturaMedicaId: turnoData.coberturaMedicaId
    });
  };
  
  
  // Manejar cambios en otros datos del turno
  const handleTurnoChange = (e) => {
    const { name, value } = e.target;
    setDatosEditados(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  // Función para guardar todos los cambios
  const handleGuardarCambios = async () => {
    try {
      setLoadingAction(true);
      setError(null);
      setSuccess(null);

      let hasta = new Date(datosEditados.desde);
      hasta.setMinutes(hasta.getMinutes() +  Number(datosEditados.duracion));
      
      const datosActualizados = {
        servicio: datosEditados.servicio,
        duracion: Number(datosEditados.duracion),
        desde: new Date(datosEditados.desde).toISOString(),
        hasta: hasta.toISOString(),
        observaciones: datosEditados.observaciones,
        coberturaMedicaId: datosEditados.coberturaMedicaId
      };
      
      const response = await fetch(`/api/turnos/${turnoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosActualizados),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar turno');
      }
      
      const data = await response.json();
      
      if (data.ok) {
        setSuccess('Turno actualizado correctamente');
        // Recargar los datos del turno
        cargarTurno(turnoId);
        // Salir del modo edición
        setModoEdicion(false);
        
        // Notificar al componente padre del cambio exitoso
        if (onSuccess) {
          onSuccess('update', data.turno);
        }
      } else {
        throw new Error(data.message || 'Error al actualizar turno');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoadingAction(false);
    }
  };
  
  // Toggle modo edición
  const toggleModoEdicion = () => {
    if (!modoEdicion) {
      // Si estamos saliendo del modo edición, reinicializar los datos
      inicializarDatosEditables(turno);
    }
    setModoEdicion(!modoEdicion);
  };

  const handleCambiarEstado = async () => {
    try {
      if (!nuevoEstado) {
        setError('Debe seleccionar un estado');
        return;
      }
      
      setLoadingAction(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/turnos/${turnoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      
      if (!response.ok) {
        throw new Error('Error al cambiar estado');
      }
      
      const data = await response.json();
      
      if (data.ok) {
        setSuccess(`Estado cambiado a ${nuevoEstado} correctamente`);
        // Recargar los datos del turno
        cargarTurno(turnoId);
        // Limpiar el campo de selección
        setNuevoEstado('');
        
        // Notificar al componente padre del cambio exitoso
        if (onSuccess) {
          onSuccess('update', data.turno);
        }
      } else {
        throw new Error(data.message || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEliminarTurno = async () => {
    try {
      if (!confirm('¿Está seguro de eliminar este turno? Esta acción no se puede deshacer.')) {
        return;
      }
      
      setLoadingAction(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/turnos/${turnoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Error al eliminar turno');
      }
      
      const data = await response.json();
      
      if (data.ok) {
        setSuccess('Turno eliminado correctamente');
        
        // Notificar al componente padre del cambio exitoso
        if (onSuccess) {
          onSuccess('delete', turnoId);
        }
        
        // Si es modal, cerrar después de un breve delay
        if (isModal && onClose) {
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } else {
        throw new Error(data.message || 'Error al eliminar turno');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEnviarRecordatorio = async () => {
    try {
      if (!turno || !turno.extendedProperties?.private) {
        throw new Error('No hay información suficiente del turno');
      }
      
      setLoadingAction(true);
      setError(null);
      setSuccess(null);
      
      if (celular.length >= 8) {
        const res = await enviarRecordatorioTurno(turno);
      }
      // const fechaTurno = formatoFecha(turno.desde, true, false, false, true);
      
      // const mensaje = `Hola ${turno.nombre}, te recordamos tu turno de ${turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado'} con el Dr. ${turno.doctor} para el día ${fechaTurno}. Por favor confirma tu asistencia respondiendo a este mensaje. Gracias!`;
      
      // const resultado = await enviarMensaje(turno.celular, mensaje);
      
      // if (resultado.ok) {
      //   setSuccess('Recordatorio enviado correctamente');
      // } else {
      //   throw new Error(resultado.error || 'Error al enviar recordatorio');
      // }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleLimpiarPenalidad = async () => {
    try {
      setLoadingAction(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch(`/api/turnos/${turnoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ penal: '' }),
      });
      
      if (!response.ok) {
        throw new Error('Error al limpiar penalidad');
      }
      
      const data = await response.json();
      
      if (data.ok) {
        setSuccess('Penalidad eliminada correctamente');
        // Recargar los datos del turno
        cargarTurno(turnoId);
        
        // Notificar al componente padre del cambio exitoso
        if (onSuccess) {
          onSuccess('update', data.turno);
        }
      } else {
        throw new Error(data.message || 'Error al actualizar penalidad');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoadingAction(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    // if (turnoId) {
    //   cargarTurno(turnoId);
    // }   
    
    // Cargar los estados disponibles
    const estadosDisponibles = obtenerEstados();
    setEstados(estadosDisponibles);
    // Cargar las coberturas disponibles
    const cober = async () => {
      const coberturasDisponibles = await obtenerCoberturasDesdeDB();
      setCoberturas(coberturasDisponibles);
      setLoading(false);
    };
    cober();
    
  }, [turnoId]);

  // Función para obtener el color del estado
  const obtenerColorEstado = (estadoId) => {
    const estadoEncontrado = estados.find(e => e.id === estadoId);
    return estadoEncontrado ? estadoEncontrado.color : 'bg-gray-100 border-gray-500 text-gray-700';
  };

  // Función para obtener el nombre formateado del estado
  const obtenerNombreEstado = (estadoId) => {
    const estadoEncontrado = estados.find(e => e.id === estadoId);
    return estadoEncontrado ? estadoEncontrado.nombre : estadoId;
  };


  if (loading) {
    return (
      <div className={`${isModal ? 'p-6' : 'container mx-auto px-4 py-8'}`}>
        <Loader titulo={'Buscando Datos del Turno ...'}/>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Detalle de Turno</h1>
          {!isModal && (
            <Link 
              href="/turnos" 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded"
            >
              Volver
            </Link>
          )}
        </div>
      </div>
    )
  }

  if (error && !turno) {
    return (
      <div className={`${isModal ? 'p-6' : 'container mx-auto px-4 py-8'}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Detalle de Turno</h1>
          {!isModal && (
            <Link 
              href="/turnos" 
              className=" py-2 px-4 rounded"
            >
              Volver
            </Link>
          )}
        </div>
        <div className="shadow rounded-lg p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold mt-2">Error</h2>
          </div>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => cargarTurno(turnoId)}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!turno) {
    return (
      <div className={`${isModal ? 'p-6' : 'container mx-auto px-4 py-8'}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold ">Detalle de Turno</h1>
          {!isModal && (
            <Link 
              href="/turnos" 
              className="py-2 px-4 rounded"
            >
              Volver
            </Link>
          )}
        </div>
        <div className="shadow rounded-lg p-6 text-center">
          <p className="">No se encontró información del turno</p>
        </div>
      </div>
    );
  }

  const estado = turno.estado || 'sin confirmar';
  const estadoMostrado = obtenerNombreEstado(estado);

  return (
    <div className={`${isModal ? 'px-6 pb-6' : 'container mx-auto px-4 py-8'}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Detalle del Turno</h1>
        {!isModal && (
          <Link 
            href="/turnos" 
            className=" text-gray-800 py-2 px-4 rounded"
          >
            Volver
          </Link>
        )}
      </div>

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="shadow rounded-lg overflow-hidden">
        {/* Cabecera del turno */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-xl font-semibold">
                Turno {turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado' || 'Médico'}
              </h2>
              <p className=" mt-1">
                {formatoFecha(turno.desde, true, false, false, true)}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${obtenerColorEstado(turno.estado)}`}>
                {estadoMostrado}
              </span>
            </div>
          </div>
        </div>
        
        {/* Cuerpo con datos del turno */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información del paciente */}
            <div>
              <h3 className="text-lg font-bold mb-3">Información del Paciente</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm ">Nombre</p>
                  <p className="font-bold">{turno.paciente.nombre} {turno.paciente.apellido || ''}</p>
                </div>
                <div>
                  <p className="text-sm">DNI</p>
                  <p className="font-bold">{turno.paciente.dni}</p>
                </div>
                <div>
                  <p className="text-sm">Celular</p>
                  <p className="font-bold">{turno.paciente.celular}</p>
                </div>
                <div>
                  <p className="text-sm">Email</p>
                  <p className="font-bold">{turno.paciente.email || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm">Cobertura Médica</p>
                  <p className="font-bold">{turno.paciente.cobertura || 'No especificada'}</p>
                  <span 
                    className="text-xs font-bold p-2 rounded-lg"
                    style={{ 
                      backgroundColor: turno.paciente.coberturaMedica?.color || '#CCCCCC',
                      color: isColorLight(turno.paciente.coberturaMedica?.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
                    }}
                  >
                    {turno.paciente.coberturaMedica.codigo ? turno.paciente.coberturaMedica.codigo.toUpperCase() : 'No asignado'}
                  </span>
                </div>
              </div>
            </div>            
            {/* Información del turno */}
            <div>
              <h3 className="text-lg font-bold mb-3">Información del Turno</h3>
              {/* Vista en modo lectura */}
              {!modoEdicion ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm dark:text-gray-400">Tipo de Turno</p>
                    <p className="font-bold dark:text-gray-200">{turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm dark:text-gray-400">Doctor</p>
                    <p className="font-bold dark:text-gray-200">{turno.doctor.emoji} {turno.doctor.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm">Consultorio</p>
                    <span 
                      className={`px-2 py-1 inline-flex text-sm font-bold rounded-lg`}
                        style={{ 
                        backgroundColor: turno.consultorio?.color || '#CCCCCC',
                        color: isColorLight(turno.consultorio?.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
                      }}
                    >
                      {turno.consultorio?.nombre || 'No especificado'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm">Duración</p>
                    <p className="font-bold">{formatoDuracion(turno.duracion)}</p>
                  </div>
                  <div>
                    <p className="text-sm">Fecha y Hora</p>
                    <p className="font-bold">{formatoFecha(turno.desde, true, false, false, true)}</p>
                  </div>
                  <div>
                    <p className="text-sm">Cobertura Médica</p>
                    <span 
                      className="text-xs font-bold p-2 rounded-lg"
                      style={{ 
                        backgroundColor: turno.coberturaMedica?.color || '#CCCCCC',
                        color: isColorLight(turno.coberturaMedica?.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
                      }}
                    >
                      {turno.coberturaMedica.codigo ? turno.coberturaMedica.codigo.toUpperCase() : 'No asignado'}
                    </span>
                  </div>
                  {turno.penal && (
                    <div>
                      <p className="text-sm">Penalidad</p>
                      <p className="font-bold text-red-600">
                        {turno.penal === 'asa' ? 'Ausencia sin aviso' : 
                         turno.penal === 'ccr' ? 'Cancelación dentro 48 Hs.' : 
                         turno.penal}
                      </p>
                    </div>
                  )}
                  {turno.observaciones && (
                    <div>
                      <p className="text-sm">Observaciones</p>
                      <p className="font-bold">{turno.observaciones}</p>
                    </div>
                  )}
                  {turno.fhCambioEstado && (
                    <div>
                      <p className="text-sm">Último cambio de estado</p>
                      <p className="font-bold">{formatoFecha(turno.fhCambioEstado, true, true)}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Vista en modo edición */
                <div className="space-y-3">
                  <div>                    
                    <label className="block text-sm font-bold mb-1">Tipo de Turno</label>
                    <p className="text-sm">
                      (No editable: {turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado'})
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Doctor</label>
                    <p className="text-sm">
                      (No editable: {turno.doctor.emoji} {turno.doctor.nombre})
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">Consultorio</label>
                    <span 
                      className="px-2 py-1 inline-flex text-sm font-bold rounded-lg"
                      style={{ 
                        backgroundColor: turno.consultorio?.color || '#CCCCCC',
                        color: isColorLight(turno.consultorio?.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
                      }}
                    >
                      {turno.consultorio?.nombre || 'No especificado'}
                    </span>
                  </div>                  <div>
                    <label className="block text-sm font-bold  mb-1">Duración (minutos)</label>
                    <input
                      type="number"
                      name="duracion"
                      value={datosEditados.duracion}
                      onChange={handleTurnoChange}
                      min="5"
                      step="5"
                      className="w-full border border-gray-300 dark:border-gray-600  rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold  mb-1">Fecha y Hora</label>
                    <input
                      type="datetime-local"
                      name="desde"
                      value={datosEditados.desde}
                      onChange={handleTurnoChange}
                      className="w-full border border-gray-300 dark:border-gray-600  rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                    />
                  </div>
                  <div>                    
                    <label className="block text-sm font-bold  mb-1">Cobertura Médica</label>
                    <select
                      name="coberturaMedicaId"
                      value={datosEditados.coberturaMedicaId}
                      onChange={handleTurnoChange}
                      className="w-full border border-gray-300  rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                    >
                      <option value="">Seleccionar cobertura</option>
                      {coberturas.map((cobertura) => (
                        <option key={cobertura.id} value={cobertura.id}>
                          {cobertura.nombre}
                        </option>
                      ))}
                    </select>
                  </div>                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Consultorio</label>
                    <p className="text-sm dark:text-gray-400">
                      (No editable: {typeof turno.consultorio === 'object' ? turno.consultorio.nombre || 'Consultorio' : turno.consultorio || 'No especificado'})
                    </p>                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                    <textarea
                      name="observaciones"
                      value={datosEditados.observaciones}
                      onChange={handleTurnoChange}
                      rows="3"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                    ></textarea>
                  </div>
              </div>
              )}
            </div>
          </div>
          {/* Información del usuario que creó y modificó el turno */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="space-y-3">
              <div className="flex justify-start items-center gap-4 ">
                <p className="text-sm">Creado:</p>
                <p className="font-bold">{formatoFecha(turno.createdAt, true, true, false, true, false, false) || 'No especificado'}</p>
                <p className="text-sm">Por:</p>
                <p className="font-bold">{turno.createdBy?.name || 'No especificado'}</p>
              </div>
              <div className="flex justify-start items-center gap-4 ">
                <p className="text-sm">Modificado:</p>
                <p className="font-bold">{formatoFecha(turno.updatedAt, true, true, false, true, false, false) || 'No especificado'}</p>
                <p className="text-sm">Por:</p>
                <p className="font-bold">{turno.updatedBy?.name || 'No especificado'}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Acciones */}
        <div className="p-6 border-t border-gray-200">
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-3">Acciones</h3>
          {loadingAction && <Loader titulo={'Regisrando Cambios ...'}/>}
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg border border-gray-200">
                <label>
                  Cambiar Estado:
                </label>
                <label htmlFor="estadoSelect" className="block text-sm font-bold mb-1">
                  Cambiar Estado:
                </label>
                <select
                  id="estadoSelect"
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-100"
                  disabled={loadingAction}
                  >
                  <option value="">Seleccionar estado</option>
                  {estados.map((estado) => (
                    <option 
                      key={estado.id} 
                      value={estado.id}
                      className={`text-lg font-bold ${obtenerColorEstado(estado.id)}`}
                    >
                        {estado.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCambiarEstado}
                disabled={loadingAction || !nuevoEstado || nuevoEstado === estado}
                className="mt-2 sm:mt-6 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {loadingAction ? "Actualizando..." : "Aplicar Cambio"}
              </button>
            </div>
          </div>            
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-4 p-3 rounded-lg border border-gray-200">
            <button
              onClick={handleEnviarRecordatorio}
              disabled={loadingAction || estado === 'cancelado'}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded disabled:bg-green-300 disabled:cursor-not-allowed flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              Enviar Recordatorio
            </button>
            
            <button
              onClick={handleLimpiarPenalidad}
              disabled={loadingAction}
              className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded disabled:bg-yellow-300 disabled:cursor-not-allowed flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Limpiar Penalidad
            </button>

            <button
              onClick={handleEliminarTurno}
              disabled={loadingAction}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded disabled:bg-red-300 disabled:cursor-not-allowed flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Eliminar Turno
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-4 p-3 rounded-lg border border-gray-200">
            <button
              onClick={toggleModoEdicion}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L14 3.172l2.828 2.828 1.414-1.414a2 2 0 000-2.828zM13.172 4l-9 9V15h2l9-9-2-2z" />
              </svg>
              {modoEdicion ? "Cancelar Edición" : "Editar Turno"}
            </button>
            {modoEdicion && (
              <button
                onClick={handleGuardarCambios}
                disabled={loadingAction}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded flex items-center disabled:bg-green-300 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {loadingAction ? "Guardando..." : "Guardar Cambios"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}