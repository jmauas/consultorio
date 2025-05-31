'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { formatoFecha } from '@/lib/utils/dateUtils';
import { obtenerEstados } from '@/lib/utils/estadosUtils';
import DetalleTurno from '@/components/DetalleTurno';
import Modal from '@/components/Modal';
import { textoMensajeConfTurno } from '@/lib/services/sender/whatsappService';
import { enviarRecordatorioTurno } from '@/lib/services/sender/whatsappService';
import Loader from '@/components/Loader';
import { isColorLight } from '@/lib/utils/variosUtils';
import { useTheme } from 'next-themes';
import ModalNuevoTurno from '@/components/ModalNuevoTurno';

const estados = obtenerEstados();

export default function GrillaTurnos({ 
  turnos = [], 
  loading = false, 
  onCancelarTurno,
  onTurnoActualizado
}) {

  // Estado para el modal de detalle de turno
  const [modalAbierto, setModalAbierto] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);

  const { theme, setTheme } = useTheme();

  // Función para detectar si un turno es un evento
  const esEvento = (turno) => {
    return turno?.paciente?.dni === 'EVENTO' && 
           turno?.paciente?.nombre === 'EVENTO ESPECIAL' &&
           turno?.servicio === 'EVENTO';
  };
  
  // Estado para el modal de nuevo turno
  const [modalNuevoTurnoAbierto, setModalNuevoTurnoAbierto] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [turnoParaNuevoTurno, setTurnoParaNuevoTurno] = useState(null);
  const [modalTurnoNuevo, setModalTurnoNuevo] = useState(false);

  // Obtener color y nombre del estado
  const obtenerColorEstado = (estado) => {
    const estadoEncontrado = estados.find(e => e.id === estado);
    return estadoEncontrado ? estadoEncontrado.color : 'bg-gray-100 border-gray-500 text-gray-700';
  };

  const obtenerNombreEstado = (estado) => {
    const estadoEncontrado = estados.find(e => e.id === estado);
    return estadoEncontrado ? estadoEncontrado.nombre : estado;
  };
  
  // Función para enviar recordatorio por WhatsApp e EMail
  const enviarRecordatorio = async (id) => {
    try {
      const turno = turnos.find(turno => turno.id === id);
      
      if (!turno || !turno.paciente || !turno.paciente.celular) {
        toast.error('No se encontró información de contacto para este paciente');
        return;
      }
      
      const msg = await textoMensajeConfTurno(turno);
      
      let celular = turno.paciente.celular;

      if (celular.length >= 8) {
          const res = await enviarRecordatorioTurno(turno);
      }
      
      toast.success('Iniciando envío de confirmación');
    } catch (error) {
      console.error('Error al enviar recordatorio:', error);
      toast.error('Error al enviar el recordatorio: ' + (error.message || 'Error desconocido'));
    }
  };

  // Función para cancelar un turno (utiliza la callback recibida por props)
  const cancelarTurno = (turnoId) => {
    if (onCancelarTurno) {
      onCancelarTurno(turnoId);
    }
  };

  // Abrir modal con detalle de turno
  const abrirDetalleTurno = (turno) => {
    setTurnoSeleccionado(turno);
    setModalAbierto(true);
  };
  
  // Abrir modal para nuevo turno
  const abrirModalNuevoTurno = (paciente) => {
    setPacienteSeleccionado(paciente);
    setModalNuevoTurnoAbierto(true);
  };  
  
  // Cerrar modal
  const cerrarModal = () => {
    setModalAbierto(false);
    setTurnoSeleccionado(null);
  };  

  // Manejar cambios exitosos en el turno desde el modal
  const handleTurnoActualizado = (tipo, datos) => {
    if (tipo === 'delete') {
      // Si se eliminó un turno, notificar al componente padre
      if (onTurnoActualizado) {
        onTurnoActualizado(tipo, datos);
      }
      
      // Cerrar el modal después de una pequeña pausa
      setTimeout(() => {
        setModalAbierto(false);
        setTurnoSeleccionado(null);
      }, 1500);
    } else if (tipo === 'update') {
      // Si se actualizó un turno, notificar al componente padre
      if (onTurnoActualizado) {
        onTurnoActualizado(tipo, datos);
      }
    }
  };
  
  const abrirModalNuevoTurnoDispo = (turno) => {
      setTurnoParaNuevoTurno(turno);
      setModalTurnoNuevo(true);
  }

  
const filaLibre = (turno, anterior, color, index) => {  
  return (
    <tr
      key={`${turno.id}-${anterior}-${index}`} 
      className={`font-bold`}>
      <td colSpan="7" className="px-6 py-1 text-center">
        <div className={`text-${color}-500 dark:text-${color}-400 text-center text-sm flex items-center justify-between gap-4`}>
          <div className={`border-t-3 border-${color}-500 dark:border-${color}-400 my-1 w-full`}></div>
          <span className="whitespace-nowrap">
            {anterior 
              ? <><span className="text-slate-700 dark:text-slate-300 font-normal">Disponibilidad Antes de Este Turno</span><i className="fa-solid fa-arrow-down ml-2 fa-lg"></i></>
              : <><span className="text-slate-700 dark:text-slate-300 font-normal">Disponibilidad Despues de Este Turno</span><i className="fa-solid fa-arrow-up ml-2 fa-lg"></i></>
            }
          </span>  
          <span className="px-1 py-2 border dark:border-gray-600 rounded-lg dark:text-gray-200">{formatoFecha(turno.desde, true, false, false, false, true)}</span>
          <i className="fa-solid fa-arrow-right fa-2xl"></i>
        </div>
      </td>
      <td className="px-6 py-1 text-center">
        <button 
          onClick={() => abrirModalNuevoTurnoDispo(turno)}
          className="text-[var(--color-primary)] hover:text-orange-900 dark:text-[var(--color-primary)] dark:hover:text-orange-300 p-1"
        >
          <i className="fas fa-plus fa-lg"></i>
        </button>
      </td>
    </tr>
  )
}

const cardLibre = (turno, anterior, color, index) => {  
  return (<>   
        <button 
          onClick={() => abrirModalNuevoTurnoDispo(turno)}
          key={`${turno.id}-${anterior}-${index}`} 
          className={`p-1 text-sm bg-${color}-100 dark:bg-${color}-900 dark:bg-opacity-30 rounded-lg flex items-center justify-evenly gap-3 text-gray-800 dark:text-gray-200`}
        >           
          {anterior 
            ? <><span>Disponibilidad Antes de Este Turno</span><i className="fa-solid fa-arrow-down ml-2 fa-lg text-[var(--color-primary)] dark:text-[var(--color-primary)]"></i></>
            : <><span>Disponibilidad Despues de Este Turno</span><i className="fa-solid fa-arrow-up ml-2 fa-lg text-[var(--color-primary)] dark:text-[var(--color-primary)]"></i></>
          }
          <span className="px-1 py-2 font-bold border dark:border-gray-600 rounded-lg text-[var(--color-primary)] dark:text-[var(--color-primary)]">{formatoFecha(turno.desde, true, false, false, false, true)}</span>
          <i className="fas fa-plus fa-2xl text-[var(--color-primary)] dark:text-[var(--color-primary)]"></i>
        </button>      
    </>    
  )
}
  
  if (loading) {
    return (
     <Loader titulo={''}/>
    );
  }
  if (!loading && turnos.length === 0) {
    return (
      <div className="p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg">No hay turnos para las fechas seleccionadas</p>
        <p className="mt-1">Seleccione otra fecha o agregue un nuevo turno</p>
      </div>
    );
  }
  return (
    <>      {/* Vista de tabla para pantallas medianas y grandes */}
      <div className="hidden md:block overflow-x-auto">
        <table className={`min-w-full divide-y ${theme==='light' ? 'bg-slate-100 divide-gray-200' : 'bg-slate-800 divide-gray-700'}`}>
          <thead className="">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Paciente</th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">OS</th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Consultorio</th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium  uppercase tracking-wider">Acciones</th>
            </tr>          
          </thead>
          <tbody 
            className={`min-w-full divide-y ${theme==='light' ? 'bg-slate-50 divide-gray-200' : 'bg-slate-800 divide-gray-700'}`}
          >
            {turnos.map((turno, index) => (
              <React.Fragment key={turno.id || `turno-${index}`}>
                {turno.disponibilidadAnterior && (
                  filaLibre(turno.disponibilidadAnterior, true, 'blue', index)
                )}
                <tr key={turno.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="calendar-icon border border-red-500 dark:border-red-400 rounded-lg shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-red-600 dark:bg-red-500 text-xs font-bold text-center px-2 py-0">
                          {new Date(turno.desde).toLocaleDateString('es-AR', { month: 'short' }).toUpperCase()}
                        </div>
                        <div className="flex-grow flex items-center justify-center">
                          <span className="font-bold text-lg">
                            {new Date(turno.desde).getDate()}
                          </span>
                        </div>
                      </div>
                      <span className={`px-1 py-2 whitespace-nowrap text-lg font-bold 
                        border-1 rounded-lg`}>
                        {formatoFecha(turno.desde, true, false, false, false, true)}
                      </span>
                    </div>
                  </td>                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm ">
                    <div className="font-medium">
                      {esEvento(turno) 
                        ? (turno.observaciones || 'Evento') 
                        : `${turno.paciente.nombre} ${turno.paciente.apellido}`
                      }
                    </div>
                    {!esEvento(turno) && (
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="text-xs">{turno.paciente.celular || 'Sin contacto'}</div>
                        <Link href={`https://wa.me/${turno.paciente.celular}`} target="_blank">
                          <i className="fab fa-whatsapp text-green-600 fa-xl"></i>
                        </Link>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm ">
                    <span 
                      className="text-xs font-bold p-2 rounded-lg"
                      style={{ 
                        backgroundColor: turno.coberturaMedica?.color || '#CCCCCC',
                        color: isColorLight(turno.coberturaMedica?.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
                      }}
                    >
                      {turno.coberturaMedica?.codigo ? turno.coberturaMedica.codigo.toUpperCase() : 'No asignado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap ">
                    <span 
                      className="text-xs font-bold p-2 rounded-lg"
                      style={{ 
                        backgroundColor: turno.doctor?.color || '#CCCCCC',
                        color: isColorLight(turno.doctor?.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
                      }}
                    >                      
                      {turno.doctor.emoji} {turno.doctor.nombre}
                    </span>
                  </td>                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span 
                      className="px-2 py-1 inline-flex text-sm font-medium rounded-lg"
                      style={{ 
                        backgroundColor: turno.consultorio?.color || '#CCCCCC',
                        color: isColorLight(turno.consultorio?.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
                      }}
                    >
                      {turno.consultorio?.nombre || (typeof turno.consultorio === 'string' ? turno.consultorio : 'No especificado')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${obtenerColorEstado(turno.estado || 'sin confirmar')}`}>
                      {obtenerNombreEstado(turno.estado) || 'sin confirmar'}
                    </span>
                  </td>                    
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => abrirDetalleTurno(turno)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 bg-blue-50 dark:bg-blue-900 border border-blue-600 rounded-md p-2"
                        title="Ver detalles"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      {!esEvento(turno) && (
                        <>
                          <button
                            onClick={() => enviarRecordatorio(turno.id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-500 dark:hover:text-green-400 bg-green-50 dark:bg-green-900 border border-green-600 rounded-md p-2"
                            title="Enviar recordatorio"
                          >
                            <i className="fa fa-solid fa-bell text-green-600 "></i>
                          </button>
                          <button
                            onClick={() => abrirModalNuevoTurno(turno.paciente)}
                            className="text-[var(--color-primary)] hover:text-[var(--color-primary)] dark:text-[var(--color-primary)] dark:hover:text-orange-300 bg-orange-50 dark:bg-irange-900 border border-[var(--color-primary)]or-primary)] rounded-md p-2"
                            title="Nuevo turno"
                          >
                            <i className="fas fa-plus fa-lg"></i>
                          </button>
                        </>
                      )}
                      {onCancelarTurno && (
                      <button
                        onClick={() => cancelarTurno(turno.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400bg-red-50 dark:bg-red-900 border border-red-600 rounded-md p-2"
                        title="Cancelar turno"
                      >
                        <i className="fas fa-trash"></i>
                      </button>)}
                    </div>
                  </td>
                </tr>    
                  {turno.disponibilidadPosterior && (
                    filaLibre(turno.disponibilidadPosterior, false, 'green', index)
                  )}
              </React.Fragment>              
                ))}      
          </tbody>
        </table>
      </div>

      {/* Vista de cards para pantallas pequeñas */}
      <div className="md:hidden space-y-4 p-4">
        {turnos.map((turno, index) => (
        <React.Fragment key={turno.id || `turno-${index}`}>
          {turno.disponibilidadAnterior && (
            cardLibre(turno.disponibilidadAnterior, true, 'blue', index)
          )}
          <div 
            key={turno.id || index} 
            className="border rounded-lg shadow-sm overflow-hidden"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center space-x-2">
                <div className="calendar-icon border border-red-500 rounded-lg shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-red-600 text-xs font-bold text-center px-2 py-0">
                    {new Date(turno.desde).toLocaleDateString('es-AR', { month: 'short' }).toUpperCase()}
                  </div>
                  <div className="flex-grow flex items-center justify-center">
                    <span className="font-bold text-lg">
                      {new Date(turno.desde).getDate()}
                    </span>
                  </div>
                </div>
                <span className={`px-1 py-2 whitespace-nowrap text-lg font-bold 
                  border-1 rounded-lg`}>
                  {formatoFecha(turno.desde, true, false, false, false, true)}
                </span>
                <div className="bg-blue-100 rounded-full p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${obtenerColorEstado(turno.estado || 'sin confirmar')}`}>
                    {obtenerNombreEstado(turno.estado) || 'sin confirmar'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">                
                <div>
                  <p className="text-sm font-medium ">Paciente</p>
                  <p className="mt-1 text-sm font-bold">
                    {esEvento(turno) 
                      ? (turno.observaciones || 'Evento') 
                      : `${turno.paciente.nombre} ${turno.paciente.apellido}`
                    }
                  </p>
                  {!esEvento(turno) && (
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs">{turno.paciente.celular || 'Sin contacto'}</p>
                      <Link href={`https://wa.me/${turno.paciente.celular}`} target="_blank">
                        <i className="fab fa-whatsapp text-green-600 fa-xl"></i>
                      </Link>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Doctor</p>
                    <span 
                      className="text-xs font-bold p-2 rounded-lg"
                      style={{ 
                        backgroundColor: turno.doctor?.color || '#CCCCCC',
                        color: isColorLight(turno.doctor?.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
                      }}
                    >                      
                      {turno.doctor.emoji} {turno.doctor.nombre}
                    </span>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Consultorio</p>
                  <span 
                      className="px-2 py-1 inline-flex text-sm font-medium rounded-lg"
                      style={{ 
                        backgroundColor: turno.consultorio?.color || '#CCCCCC',
                        color: isColorLight(turno.consultorio?.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
                      }}
                    >
                      {turno.consultorio?.nombre || (typeof turno.consultorio === 'string' ? turno.consultorio : 'No especificado')}
                    </span>
                </div>                
                <div>
                  <p className="text-sm font-medium mb-2">Cobertura</p>
                  <span 
                    className="text-xs font-bold p-2 rounded-lg"
                    style={{ 
                      backgroundColor: turno.coberturaMedica?.color || '#CCCCCC',
                      color: isColorLight(turno.coberturaMedica?.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
                    }}
                  >
                    {turno.coberturaMedica?.codigo ? turno.coberturaMedica.codigo.toUpperCase() : 'No asignado'}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium ">Tipo</p>
                  <p className="mt-1 text-sm font-bold">{turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado'}</p>
                </div>
              </div>
            </div>
              <div className={`flex justify-between px-4 py-3 ${theme==='light' ? 'bg-slate-200' : 'bg-slate-800'}`}>
              <button
                onClick={() => abrirDetalleTurno(turno)}
                className="inline-flex rounded-md bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 border border-blue-600"
                title="Ver detalles"
                >
                 <div><i className="fa fa-eye text-blue-600 "></i></div>
              </button>
              {!esEvento(turno) && (
                <>
                  <button
                    onClick={() => enviarRecordatorio(turno.id)}
                    className="inline-flex rounded-md bg-green-50 p-2 text-green-700 hover:bg-green-100 border border-green-700"
                    title="Recordar"
                  >
                    <div><i className="fa fa-solid fa-bell text-green-600 "></i></div>
                  </button>
                  <button
                    onClick={() => abrirModalNuevoTurno(turno.paciente)}
                    className="inline-flex rounded-md bg-orange-50 p-2 text-[var(--color-primary)] hover:bg-orange-100 border border-[var(--color-primary)]"
                    title="Nuevo turno"
                  >
                    <div><i className="fas fa-plus fa-lg"></i></div>
                  </button>
                </>
              )}
              <button
                onClick={() => cancelarTurno(turno.id)}
                className="inline-flex rounded-md bg-red-50 p-2 text-red-700 hover:bg-red-100 border border-red-700"
                title="Cancelar"
                >
                <div><i className="fas fa-trash"></i></div>
              </button>
            </div>
          </div>
          {turno.disponibilidadPosterior && (
            cardLibre(turno.disponibilidadPosterior, false, 'green', index)
          )}
        </React.Fragment>
        ))}
      </div>
      
      {/* Modal para detalle de turno */}
      <Modal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        size="large"
        title="Detalle de Turno"
      >
        {turnoSeleccionado && (
          <DetalleTurno 
            turno={turnoSeleccionado}
            onClose={cerrarModal}
            onSuccess={handleTurnoActualizado}
            isModal={true}
          />
        )}
      </Modal>
      {/* Modal para nuevo turno */}
      <ModalNuevoTurno
        modalNuevoTurnoAbierto={modalNuevoTurnoAbierto} 
        setModalNuevoTurnoAbierto={setModalNuevoTurnoAbierto}
        pacienteSeleccionado={pacienteSeleccionado}
        setPacienteSeleccionado={setPacienteSeleccionado}
        turnoParaNuevoTurno={turnoParaNuevoTurno}
        modalTurnoNuevo={modalTurnoNuevo}
        setModalTurnoNuevo={setModalTurnoNuevo}
      />
  </>)
}

