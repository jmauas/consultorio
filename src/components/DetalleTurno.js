'use client';

import { useState, useEffect } from 'react';
import { formatoFecha, formatoDuracion } from '@/lib/utils/dateUtils';
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
  const turnoId = turno?.id || null;
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);  const [nuevoEstado, setNuevoEstado] = useState('');

  // Estado para controlar la reprogramación
  const [mostrarReprogramacion, setMostrarReprogramacion] = useState(false);
  const [turnosDisponibles, setTurnosDisponibles] = useState([]);
  const [loadingTurnos, setLoadingTurnos] = useState(false);
  const [turnoSeleccionadoReprogramacion, setTurnoSeleccionadoReprogramacion] = useState(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [expandedDateRows, setExpandedDateRows] = useState({});

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
      
      const data = await response.json();      if (data.ok) {
        setSuccess('Turno actualizado correctamente');
        
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
      
      const data = await response.json();      if (data.ok) {
        setSuccess(`Estado cambiado a ${nuevoEstado} correctamente`);
        
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
    }  };

  // Función para obtener turnos disponibles para reprogramación
  const obtenerTurnosDisponibles = async () => {
    try {
      setLoadingTurnos(true);
      setError(null);
      
      const params = new URLSearchParams({
        doctor: turno.doctorId,
        tipo: turno.tipoDeTurnoId,
        duracion: turno.duracion.toString(),
        asa: 'no',
        ccr: 'no',
      });
      
      const response = await fetch(`/api/turnos/disponibles?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener turnos disponibles');
      }
      
      const data = await response.json();
      setTurnosDisponibles(data.turnos || []);
      setMostrarReprogramacion(true);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoadingTurnos(false);
    }
  };

  // Función para seleccionar un turno para reprogramación
  const seleccionarTurnoReprogramacion = (fecha, turno) => {
    let ano, mes, dia, desde, hasta;
    if (fecha.includes('-')) {
      ano = fecha.split('-')[0];
      mes = fecha.split('-')[1] - 1;
      dia = fecha.split('-')[2];
    } else {
      ano = new Date(fecha).getFullYear();
      mes = new Date(fecha).getMonth();
      dia = new Date(fecha).getDate();
    }
    
    desde = new Date(ano, mes, dia, turno.hora, turno.min);
    hasta = new Date(ano, mes, dia, turno.hora, turno.min);
    hasta.setMinutes(hasta.getMinutes() + turno.duracion);
    
    setTurnoSeleccionadoReprogramacion({
      desde: desde.toISOString(),
      hasta: hasta.toISOString(),
      fecha: fecha,
      hora: `${String(turno.hora).padStart(2, '0')}:${String(turno.min).padStart(2, '0')}`
    });
    setMostrarConfirmacion(true);
  };

  // Función para confirmar la reprogramación
  const confirmarReprogramacion = async () => {
    try {
      setLoadingAction(true);
      setError(null);
      setSuccess(null);
      
      const datosActualizados = {
        desde: turnoSeleccionadoReprogramacion.desde,
        hasta: turnoSeleccionadoReprogramacion.hasta
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
        throw new Error(errorData.message || 'Error al reprogramar turno');
      }
      
      const data = await response.json();      if (data.ok) {
        setSuccess('Turno reprogramado correctamente');
        
        // Cerrar modales
        cerrarModalesReprogramacion();

        // Enviar recordatorio automáticamente tras reprogramación exitosa
        handleEnviarRecordatorio();
        
        // Notificar al componente padre del cambio exitoso con los nuevos datos
        if (onSuccess) {
          onSuccess('update', {
            ...data.turno,
            desde: turnoSeleccionadoReprogramacion.desde,
            hasta: turnoSeleccionadoReprogramacion.hasta
          });
        }
      } else {
        throw new Error(data.message || 'Error al reprogramar turno');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoadingAction(false);
    }
  };

  // Función para cerrar modales de reprogramación
  const cerrarModalesReprogramacion = () => {
    setMostrarReprogramacion(false);
    setMostrarConfirmacion(false);
    setTurnoSeleccionadoReprogramacion(null);
    setTurnosDisponibles([]);
    setExpandedDateRows({});
  };

  // Función para alternar visibilidad de horas
  const toggleHorasVisibility = (fecha) => {
    setExpandedDateRows(prev => ({
      ...prev,
      [fecha]: !prev[fecha]
    }));
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
           
      setLoadingAction(true);
      setError(null);      
      setSuccess(null);     
      
      const response = await fetch('/api/mensajeria/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ turno, confirmacion: true }),
      });
      
      const result = await response.json();
      
      if (result.ok) {
        setSuccess('Recordatorio enviado con éxito');
      } else {
        setError(result.error || 'Error al enviar recordatorio');
      }
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
      
      const data = await response.json();      if (data.ok) {
        setSuccess('Penalidad eliminada correctamente');
        
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
                  <p className="font-bold">{turno.paciente.cobertura || 'No especificada'}</p>                  <span 
                    className="text-xs font-bold p-2 rounded-lg"
                    style={{ 
                      backgroundColor: turno.paciente.coberturaMedica?.color || '#CCCCCC',
                      color: isColorLight(turno.paciente.coberturaMedica?.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
                    }}
                  >
                    {turno.paciente.coberturaMedica?.codigo ? turno.paciente.coberturaMedica.codigo.toUpperCase() : 'No asignado'}
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
                    <p className="text-sm">Cobertura Médica</p>                    <span 
                      className="text-xs font-bold p-2 rounded-lg"
                      style={{ 
                        backgroundColor: turno.coberturaMedica?.color || '#CCCCCC',
                        color: isColorLight(turno.coberturaMedica?.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
                      }}
                    >
                      {turno.coberturaMedica?.codigo ? turno.coberturaMedica.codigo.toUpperCase() : 'No asignado'}
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
          <div className="flex flex-wrap gap-2 items-center">
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
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center disabled:bg-blue-300 disabled:cursor-not-allowed"
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
              onClick={obtenerTurnosDisponibles}
              disabled={loadingAction || loadingTurnos || estado === 'cancelado'}
              className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded disabled:bg-purple-300 disabled:cursor-not-allowed flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              {loadingTurnos ? "Buscando..." : "Reprogramar Turno"}
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
      {/* Modal para mostrar turnos disponibles */}
      {mostrarReprogramacion && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Reprogramar Turno - Seleccione nueva fecha y hora
                </h2>
                <button
                  onClick={cerrarModalesReprogramacion}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-6">
                <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">Turno actual:</h3>
                <div className="flex flex-wrap gap-4 text-blue-700 dark:text-blue-300">
                  <div><strong>Fecha:</strong> {formatoFecha(turno.desde, false, false, false, true)}</div>
                  <div><strong>Hora:</strong> {formatoFecha(turno.desde, true, false, false, false).split(' ')[1]}</div>
                  <div><strong>Doctor:</strong> {turno.doctor.nombre}</div>
                  <div><strong>Duración:</strong> {turno.duracion} min</div>
                </div>
              </div>

              {loadingTurnos && <Loader />}

              {!loadingTurnos && turnosDisponibles.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400 text-lg">
                    No hay turnos disponibles para reprogramar
                  </div>
                </div>
              )}

              {!loadingTurnos && turnosDisponibles.length > 0 && (
                <div className="space-y-4">
                  {turnosDisponibles.map((dia) => (
                    <div key={dia.fecha} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div 
                        className="flex items-center justify-between bg-purple-600 dark:bg-purple-700 px-4 py-3 cursor-pointer"
                        onClick={() => toggleHorasVisibility(dia.fecha)}
                      >
                        <div className="flex items-center gap-2 text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">{dia.diaSemana}</span>
                          <span className="font-bold">{formatoFecha(dia.fecha, false, false, false, false)}</span>
                          <span className="text-purple-200">({dia.turnos.length} turnos)</span>
                        </div>
                        <button className="text-white hover:text-purple-200 focus:outline-none transition-colors">
                          {expandedDateRows[dia.fecha] ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </button>
                      </div>
                      
                      {expandedDateRows[dia.fecha] && (
                        <div className="p-4 bg-white dark:bg-gray-800">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {dia.turnos.map((turnoDisponible, index) => (
                              <button
                                key={`${dia.fecha}-${turnoDisponible.hora}-${turnoDisponible.min}-${index}`}
                                onClick={() => seleccionarTurnoReprogramacion(dia.fecha, turnoDisponible)}
                                className="p-3 border border-green-300 bg-green-50 hover:bg-green-100 dark:bg-green-900 dark:border-green-700 dark:hover:bg-green-800 rounded-lg transition-colors flex flex-col items-center gap-1"
                              >
                                <div className="font-bold text-green-800 dark:text-green-200">
                                  {String(turnoDisponible.hora).padStart(2, '0')}:{String(turnoDisponible.min).padStart(2, '0')}
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-300">
                                  {turnoDisponible.doctor.emoji} {turnoDisponible.doctor.nombre}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}      {/* Modal de confirmación */}
      {mostrarConfirmacion && turnoSeleccionadoReprogramacion && (
        <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Confirmar Reprogramación
                </h2>
                <button
                  onClick={() => setMostrarConfirmacion(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
                  <h3 className="font-bold text-red-800 dark:text-red-200 mb-2">Fecha y hora actual:</h3>
                  <div className="text-red-700 dark:text-red-300">
                    <div>Fecha:<strong> {formatoFecha(turno.desde, false, false, false, true)}</strong></div>
                    <div>Hora:<strong> {formatoFecha(turno.desde, true, false, false, false).split(' ')[1]}</strong></div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                  <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">Nueva fecha y hora:</h3>
                  <div className="text-green-700 dark:text-green-300 text-lg">
                    <div>Fecha: <strong>{formatoFecha(turnoSeleccionadoReprogramacion.fecha, false, false, false, true)}</strong></div>
                    <div>Hora: <strong>{turnoSeleccionadoReprogramacion.hora}</strong></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setMostrarConfirmacion(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarReprogramacion}
                  disabled={loadingAction}
                  className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                >
                  {loadingAction && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {loadingAction ? 'Reprogramando...' : 'Confirmar Reprogramación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}