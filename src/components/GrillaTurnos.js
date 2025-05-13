'use client';

import React, { useState, useeffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { formatoFecha } from '@/lib/utils/dateUtils';
import { obtenerEstados } from '@/lib/utils/estadosUtils';
import { textoMensajeConfTurno } from '@/lib/services/sender/whatsappService';
import DetalleTurno from '@/components/DetalleTurno';
import Modal from '@/components/Modal';
import { enviarMailConfTurno } from "@/lib/services/sender/resendService";
import { enviarRecordatorioTurno } from '@/lib/services/sender/whatsappService';
import Loader from '@/components/Loader';
import { isColorLight } from '@/lib/utils/variosUtils';
import TurnoNuevo from '@/components/TurnoNuevo';
import TurnoDisponibilidad from '@/components/TurnoDisponibilidad';

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
  const [tituloModal, setTituloModal] = useState('');
  const [modalTurnoNuevo, setModalTurnoNuevo] = useState(false);
  const [modalTurnoDisponibilidad, setModalTurnoDisponibilidad] = useState(false);
  
  // Estado para el modal de nuevo turno
  const [modalNuevoTurnoAbierto, setModalNuevoTurnoAbierto] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [turnoParaNuevoTurno, setTurnoParaNuevoTurno] = useState(null); 

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
      
      // if (celular.length >= 10) {
      //   // URL para web y dispositivos móviles
      //   const url = `https://api.whatsapp.com/send?phone=${celular}&text=${encodeURIComponent(msg)}`;
        
      //   // Intentar abrir en una nueva pestaña/ventana
      //   const opened = window.open(url, '_blank');
        
      //   // Si no se pudo abrir en nueva pestaña (común en móviles)
      //   if (!opened || opened.closed || typeof opened.closed === 'undefined') {
      //     // Intentar abrir en la misma ventana
      //     window.location.href = url;
      //   }
      // }

      //await enviarMailConfTurno(turno);
      
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
  const abrirDetalleTurno = (turnoId) => {
    setTurnoSeleccionado(turnoId);
    setModalAbierto(true);
  };
  
  // Abrir modal para nuevo turno
  const abrirModalNuevoTurno = (paciente) => {
    setPacienteSeleccionado(paciente);
    setModalNuevoTurnoAbierto(true);
  };
  
  // Funciones de navegación para nuevo turno
  const irANuevoTurno = () => {
    if (pacienteSeleccionado && pacienteSeleccionado.id) {
      setModalTurnoNuevo(true);
      setTituloModal('Nuevo Turno');
    }
    setModalNuevoTurnoAbierto(false);
  };
  
  const irADisponibilidad = () => {
    if (pacienteSeleccionado && pacienteSeleccionado.id) {
      setModalTurnoDisponibilidad(true);
      setTituloModal('Turno Por Disponibilidad');
    }
    setModalNuevoTurnoAbierto(false);
  };
  
  // Cerrar modal
  const cerrarModal = () => {
    setModalAbierto(false);
    setTurnoSeleccionado(null);
  };
  
  const cerrarModalNuevoTurno = () => {
    setModalNuevoTurnoAbierto(false);
    setPacienteSeleccionado(null);
  };

  const cerrarModalTurnoNuevo = () => {
    setModalTurnoNuevo(false);
    setModalTurnoDisponibilidad(false);
    
  };

  const abrirModalNuevoTurnoDispo = (turno) => {
    setTurnoParaNuevoTurno(turno);
    setModalTurnoNuevo(true);
  }
  
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

  
const filaLibre = (turno, anterior, color, index) => {  
  return (
    <tr
      key={`${turno.id}-${anterior}-${index}`} 
      className={`bg-white text-slate-600 font-bold`}>
      <td colSpan="7" className="px-6 py-1 text-center">
        <div className={`text-${color}-500 text-center text-sm flex items-center justify-between gap-4`}>
          <div className={`border-t-3 border-${color}-500 my-1 w-full`}></div>
          <span className="whitespace-nowrap">
            {anterior 
              ? <><span className="text-slate-700 font-normal">Disponibilidad Antes de Este Turno</span><i className="fa-solid fa-arrow-down ml-2 fa-lg"></i></>
              : <><span className="text-slate-700 font-normal">Disponibilidad Despues de Este Turno</span><i className="fa-solid fa-arrow-up ml-2 fa-lg"></i></>
            }
          </span>  
          <span className="px-1 py-2 border rounded-lg">{formatoFecha(turno.desde, true, false, false, false, true)}</span>
          <i className="fa-solid fa-arrow-right fa-2xl"></i>
        </div>
      </td>
      <td className="px-6 py-1 text-center">
        <button 
          onClick={() => abrirModalNuevoTurnoDispo(turno)}
          className="text-orange-600 hover:text-orange-900 p-1"
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
          className={`p-1 text-sm bg-${color}-100 rounded-lg flex items-center justify-evenly gap-3`}
        >           
          {anterior 
            ? <><span>Disponibilidad Antes de Este Turno</span><i className="fa-solid fa-arrow-down ml-2 fa-lg text-orange-500"></i></>
            : <><span>Disponibilidad Despues de Este Turno</span><i className="fa-solid fa-arrow-up ml-2 fa-lg text-orange-500"></i></>
          }
          <span className="px-1 py-2 font-bold border rounded-lg text-orange-500">{formatoFecha(turno.desde, true, false, false, false, true)}</span>
          <i className="fas fa-plus fa-2xl text-orange-500"></i>
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
      <div className="p-6 text-center text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-lg">No hay turnos para las fechas seleccionadas</p>
        <p className="mt-1">Seleccione otra fecha o agregue un nuevo turno</p>
      </div>
    );
  }

  return (
    <>
      {/* Vista de tabla para pantallas medianas y grandes */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paciente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consultorio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {turnos.map((turno, index) => (
              <React.Fragment key={turno.id || `turno-${index}`}>
                {turno.disponibilidadAnterior && (
                  filaLibre(turno.disponibilidadAnterior, true, 'blue', index)
                )}
                <tr key={turno.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="calendar-icon bg-white border border-red-500 rounded-lg shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-red-600 text-white text-xs font-bold text-center px-2 py-0">
                          {new Date(turno.desde).toLocaleDateString('es-AR', { month: 'short' }).toUpperCase()}
                        </div>
                        <div className="flex-grow flex items-center justify-center">
                          <span className="text-gray-900 font-bold text-lg">
                            {new Date(turno.desde).getDate()}
                          </span>
                        </div>
                      </div>
                      <span className={`px-1 py-2 whitespace-nowrap text-lg font-bold 
                        text-gray-900 border-1 rounded-lg`}>
                        {formatoFecha(turno.desde, true, false, false, false, true)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">{turno.paciente.nombre} {turno.paciente.apellido}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="text-gray-500 text-xs">{turno.paciente.celular || 'Sin contacto'}</div>
                      <Link href={`https://wa.me/${turno.paciente.celular}`} target="_blank">
                        <i className="fab fa-whatsapp text-green-600 fa-xl"></i>
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm ">
                    <span 
                      className="text-xs font-bold p-2 rounded-lg"
                      style={{ 
                        backgroundColor: turno.coberturaMedica?.color || '#CCCCCC',
                        color: isColorLight(turno.coberturaMedica?.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
                      }}
                    >
                      {turno.coberturaMedica.codigo ? turno.coberturaMedica.codigo.toUpperCase() : 'No asignado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {turno.doctor.emoji} {turno.doctor.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${obtenerColorEstado(turno.estado || 'sin confirmar')}`}>
                      {obtenerNombreEstado(turno.estado) || 'sin confirmar'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => abrirDetalleTurno(turno.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalles"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button
                        onClick={() => enviarRecordatorio(turno.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Enviar recordatorio"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => abrirModalNuevoTurno(turno.paciente)}
                        className="text-orange-500 hover:text-orange-700"
                        title="Nuevo turno"
                      >
                        <i className="fas fa-plus fa-lg"></i>
                      </button>
                      {onCancelarTurno && (
                      <button
                        onClick={() => cancelarTurno(turno.id)}
                        className="text-red-600 hover:text-red-900"
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
            className="bg-white border rounded-lg shadow-sm overflow-hidden"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center space-x-2">
                <div className="calendar-icon bg-white border border-red-500 rounded-lg shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-red-600 text-white text-xs font-bold text-center px-2 py-0">
                    {new Date(turno.desde).toLocaleDateString('es-AR', { month: 'short' }).toUpperCase()}
                  </div>
                  <div className="flex-grow flex items-center justify-center">
                    <span className="text-gray-900 font-bold text-lg">
                      {new Date(turno.desde).getDate()}
                    </span>
                  </div>
                </div>
                <span className={`px-1 py-2 whitespace-nowrap text-lg font-bold 
                  text-gray-900 border-1 rounded-lg`}>
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
                  <p className="text-sm font-medium text-gray-500">Paciente</p>
                  <p className="mt-1 text-sm font-bold">{turno.paciente.nombre} {turno.paciente.apellido}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-xs text-gray-500">{turno.paciente.celular || 'Sin contacto'}</p>
                    <Link href={`https://wa.me/${turno.paciente.celular}`} target="_blank">
                      <i className="fab fa-whatsapp text-green-600 fa-xl"></i>
                    </Link>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Doctor</p>
                  <p className="mt-1 text-sm font-bold">{turno.doctor.emoji} {turno.doctor.nombre}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Consultorio</p>
                  <p className="mt-1 text-sm font-bold">
                    {turno.consultorio?.nombre || (typeof turno.consultorio === 'string' ? turno.consultorio : 'No especificado')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Cobertura</p>
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
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Tipo</p>
                  <p className="mt-1 text-sm font-bold">{turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 flex justify-between">
              <button
                onClick={() => abrirDetalleTurno(turno.id)}
                className="inline-flex rounded-md bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 border border-blue-600"
                title="Ver detalles"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                onClick={() => enviarRecordatorio(turno.id)}
                className="inline-flex rounded-md bg-green-50 p-2 text-green-700 hover:bg-green-100 border border-green-700"
                title="Recordar"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
              <button
                onClick={() => abrirModalNuevoTurno(turno.paciente)}
                className="inline-flex rounded-md bg-orange-50 p-2 text-orange-600 hover:bg-orange-100 border border-orange-600"
                title="Nuevo turno"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={() => cancelarTurno(turno.id)}
                className="inline-flex rounded-md bg-red-50 p-2 text-red-700 hover:bg-red-100 border border-red-700"
                title="Cancelar"
                >
                <i className="fas fa-trash"></i>
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
            turnoId={turnoSeleccionado}
            onClose={cerrarModal}
            onSuccess={handleTurnoActualizado}
            isModal={true}
          />
        )}
      </Modal>
      
      {/* Modal para nuevo turno */}
      <Modal
        isOpen={modalNuevoTurnoAbierto}
        onClose={cerrarModalNuevoTurno}
        size="small"
        title="Crear Nuevo Turno"
      >
        <div className="p-8 space-y-8">
          <div className="text-center mb-2">
            <p className="text-gray-600">
              Seleccione el tipo de turno que desea crear para 
              <span className="font-bold"> {pacienteSeleccionado?.nombre} {pacienteSeleccionado?.apellido}</span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
            <button 
              onClick={irANuevoTurno}
              className="flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 text-white py-4 px-6 rounded-md shadow transition duration-200"
            >
              <i className="fa-solid fa-calendar-plus text-2xl"></i>
              <span className="text-lg font-medium">Nuevo Turno</span>
            </button>
            
            <button 
              onClick={irADisponibilidad}
              className="flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-md shadow transition duration-200"
            >
              <i className="fa-solid fa-clock text-2xl"></i>
              <span className="text-lg font-medium">Por Disponibilidad</span>
            </button>
          </div>
        </div>
      </Modal>
       {/* Modal para nuevo Turno */}
        <Modal
          isOpen={modalTurnoNuevo || modalTurnoDisponibilidad}
          onClose={cerrarModalTurnoNuevo}
          size="large"
          title={tituloModal}
        >
          {modalTurnoNuevo 
          ? <TurnoNuevo 
              pacienteIdParam={pacienteSeleccionado?.id}
              desdeParam={turnoParaNuevoTurno?.desde}
              duracionParam={turnoParaNuevoTurno?.duracion}
              doctorIdParam={turnoParaNuevoTurno?.doctor.id}
              tipoTurnoIdParam={turnoParaNuevoTurno?.tipoDeTurnoId}
            />
          : modalTurnoDisponibilidad 
            ? <TurnoDisponibilidad 
                pacienteIdParam={pacienteSeleccionado?.id}
                desdeParam={turnoParaNuevoTurno?.desde}
                duracionParam={turnoParaNuevoTurno?.duracion}
                doctorIdParam={turnoParaNuevoTurno?.doctor.id}
                tipoTurnoIdParam={turnoParaNuevoTurno?.tipoDeTurnoId}
              />
            : null  
          }
        </Modal>   
  </>)
}

