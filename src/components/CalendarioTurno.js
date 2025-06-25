"use client"

import React, { useState, useEffect } from 'react';
import { procesarAgendaConsultorios } from '@/lib/services/turnos/turnosServiceC.js';
import Loader from '@/components/Loader';
import Link from 'next/link';
import { isColorLight } from '@/lib/utils/variosUtils';
import { formatoFecha, formatoDuracion, sonMismaFecha } from '@/lib/utils/dateUtils';
import Modal from '@/components/Modal';
import DetalleTurno from './DetalleTurno';
import { toast } from 'react-hot-toast';
import ModalNuevoTurno from '@/components/ModalNuevoTurno';
import { agregarFeriados } from '@/lib/utils/variosUtils.js';
import { obtenerEstados } from '@/lib/utils/estadosUtils';

const estados = obtenerEstados();

const CalendarioTurno = ({fecha, turnos, loading, setLoading, configuracion, doctores, consultorios, setForzarMostrarGrilla, navegarDias, cambiarFecha}) => {    const [agendaConsul, setAgendaConsul] = useState([]);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
    const [modalTurnoNuevo, setModalTurnoNuevo] = useState(false);

    // Función para detectar si un turno es un evento
    const esEvento = (turno) => {
        return turno?.paciente?.dni === 'EVENTO' && 
               turno?.paciente?.nombre === 'EVENTO ESPECIAL' &&
               turno?.servicio === 'EVENTO';
    };// Debug: verificar datos de turnos al cargar
    useEffect(() => {
        // Verificar datos de turnos al cargar el componente
    }, [agendaConsul, fecha]);
  
    // Estado para el modal de nuevo turno
    const [modalNuevoTurnoAbierto, setModalNuevoTurnoAbierto] = useState(false);
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
    const [turnoParaNuevoTurno, setTurnoParaNuevoTurno] = useState(null);
      // Estado para manejar el popover de observaciones
    const [observacionesPopover, setObservacionesPopover] = useState({ 
        visible: false, 
        turnoId: null, 
        observaciones: '',
        x: 0, 
        y: 0 
    });

    // Abrir modal con detalle de turno
    const abrirDetalleTurno = (turno) => {
        setTurnoSeleccionado(turno);
        setModalAbierto(true);
    };

    // Cerrar modal
    const cerrarModal = () => {
        setModalAbierto(false);
        setTurnoSeleccionado(null);
    };

      // Manejar cambios exitosos en el turno desde el modal
    const handleTurnoActualizado = (tipo, datos) => {       
        setTimeout(() => {
            setModalAbierto(false);
            setTurnoSeleccionado(null);
        }, 1500);
    };
    
    
    // Abrir modal para nuevo turno
    const abrirModalNuevoTurno = (paciente) => {
        setPacienteSeleccionado(paciente);
        setModalNuevoTurnoAbierto(true);
    };    
    
    const abrirModalNuevoTurnoDispo = (turno) => {
      setTurnoParaNuevoTurno(turno);
      setModalTurnoNuevo(true);
    }        // Funciones para manejar el popover de observaciones
    const mostrarObservaciones = (turno, event) => {
        if (!turno || !turno.observaciones) {
            return;
        }
        
        event.preventDefault();
        event.stopPropagation();
        
        const rect = event.currentTarget.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;
        
        const newState = {
            visible: true,
            turnoId: turno.id,
            observaciones: turno.observaciones,
            x: rect.left + scrollX + (rect.width / 2),
            y: rect.top + scrollY - 10
        };
        
        setObservacionesPopover(newState);
    };      const ocultarObservaciones = (event) => {
        setObservacionesPopover({ 
            visible: false, 
            turnoId: null, 
            observaciones: '', 
            x: 0, 
            y: 0 
        });
    };

    // Función para enviar recordatorio por WhatsApp e EMail
    const enviarRecordatorio = async (id) => {
        try {
        const turno = turnos.find(turno => turno.id === id);
        
        if (!turno || !turno.paciente || !turno.paciente.celular) {
            toast.error('No se encontró información de contacto para este paciente');
            return;        }
    
        let celular = turno.paciente.celular;

        if (celular.length >= 8) {
          try {
            const response = await fetch('/api/mensajeria/whatsapp', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ turno, confirmacion: true }),
            });
            
            const result = await response.json();
            if (!result.ok) {
              console.error('Error al enviar WhatsApp:', result.error);
              toast.error('Error al enviar WhatsApp: ' + result.error);
              return;
            }
            toast.success('WhatsApp enviado correctamente');
          } catch (error) {
            console.error('Error al enviar WhatsApp:', error);
          }
        }
        
        try {
          const response = await fetch('/api/mensajeria/email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ turno, confirmacion: true }),
          });
          
          const result = await response.json();
          if (!result.ok) {
            console.error('Error al enviar email:', result.error);
            toast.error('Error al enviar email: ' + result.error);
            return;
          }
            toast.success('Email enviado correctamente');
        } catch (error) {
          console.error('Error al enviar email:', error);
        }
        
        toast.success('Iniciando envío de confirmación');
        } catch (error) {
        console.error('Error al enviar recordatorio:', error);
        toast.error('Error al enviar el recordatorio: ' + (error.message || 'Error desconocido'));
        }
    };

    // Agrega esta función dentro del componente CalendarioTurno
    const combinarFechaYHora = (fecha, horaString) => {
        const nuevaFecha = new Date(fecha);
        
        // Parsea la hora (asumiendo formato "HH:MM" o "H:MM")
        const [horas, minutos] = horaString.split(':').map(num => parseInt(num, 10));
        
        // Establece la hora y minutos en la fecha
        nuevaFecha.setHours(horas, minutos, 0, 0);
        
        return nuevaFecha;
    };

      // Obtener color y nombre del estado
    const obtenerColorEstado = (estado) => {
        const estadoEncontrado = estados.find(e => e.id === estado);
        return estadoEncontrado ? estadoEncontrado.color : 'bg-gray-100 border-gray-500 text-gray-700';
    };    const obtenerNombreEstado = (estado) => {
        const estadoEncontrado = estados.find(e => e.id === estado);
        return estadoEncontrado ? estadoEncontrado.nombre : estado;
    };    // Componente para el botón de observaciones
    const BotonObservaciones = ({ turno, className = "" }) => {
        if (!turno) {
            return null;
        }
        
        if (!turno.observaciones) {
            return null;
        }
        
        if (turno.observaciones.trim() === '') {
            return null;
        }

        const handleMouseEnter = (e) => {
            mostrarObservaciones(turno, e);
        };

        const handleMouseLeave = (e) => {
            // Solo ocultar si no estamos sobre el popover
            const popoverElement = document.querySelector('.observaciones-popover');
            if (!popoverElement || !popoverElement.contains(e.relatedTarget)) {
                ocultarObservaciones(e);
            }
        };

        const handleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (observacionesPopover.visible && observacionesPopover.turnoId === turno.id) {
                ocultarObservaciones(e);
            } else {
                mostrarObservaciones(turno, e);
            }
        };return (
            <button
                data-turno-id={turno.id}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                className={`boton-observaciones relative rounded-md bg-red-100 p-1 text-red-600 hover:bg-red-200 border border-red-600 animate-pulse ${className}`}
                title="Ver observaciones"
            >
                <i className="fa fa-exclamation-triangle text-red-600"></i>
            </button>
        );
    };
      useEffect(() => {        
        const fetchData = async () => {
            setLoading(true);
            try {
            // Procesar turnos recibidos
            
            const diaSemana = fecha.getDay();
            const feriados = agregarFeriados([], configuracion.feriados);
            const agendas = []
            let esFeriado = false;
            if (feriados && feriados.length > 0) {
                esFeriado = feriados.some(f => sonMismaFecha(f, fecha));
            } 
            consultorios.forEach(consultorio => {
                const agenda = {
                    consultorioId: consultorio.id,
                    diaSemana: diaSemana,
                    fecha: fecha,
                    doctores: [],
                    color: consultorio.color,
                    nombre: consultorio.nombre,
                }
                doctores.forEach(doctor => {
                    let atencionHoy = doctor.agenda.find(age => age.dia == diaSemana && age.consultorioId === consultorio.id && age.atencion === true);

                    let noLaborable = false;            
                    if (esFeriado) noLaborable = true;
                    const noLaborablesDoctor = agregarFeriados([], doctor.feriados);
                    if (noLaborablesDoctor && noLaborablesDoctor.length > 0) {
                        const esNoLaborable = noLaborablesDoctor.some(f => sonMismaFecha(f, fecha));
                        if (esNoLaborable) noLaborable = true;
                    }
                    if (!atencionHoy) {
                        const agendaFecha = doctor.agenda.find(age =>
                            age.consultorioId === consultorio.id &&
                            age.atencion === true &&
                            age.dia === 99 &&
                            sonMismaFecha(new Date(age.fecha), fecha)
                        );
                        if (agendaFecha) {
                            atencionHoy = agendaFecha;
                            noLaborable = false;
                        }
                    }
                    if (atencionHoy) {
                        agenda.doctores.push({
                            id: doctor.id,
                            nombre: doctor.nombre,
                            emoji: doctor.emoji,
                            color: doctor.color,
                            desde: atencionHoy.desde,
                            hasta: atencionHoy.hasta,
                            corteDesde: atencionHoy.corteDesde,
                            corteHasta: atencionHoy.corteHasta,
                            noLaborable: noLaborable,
                        });
                    } 
                });
                agendas.push(agenda);
            });

            const nueva = procesarAgendaConsultorios(agendas, turnos)
            setAgendaConsul(nueva);
            } catch (error) {
                console.error('Error al obtener datos:', error);
            }
            setLoading(false);
        };
        
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turnos, fecha, configuracion.feriados, consultorios, doctores]);

    // useEffect para cerrar el popover al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (observacionesPopover.visible) {
                const popoverElement = document.querySelector('.observaciones-popover');
                const buttonElement = document.querySelector(`button[data-turno-id="${observacionesPopover.turnoId}"]`);
                
                if (popoverElement && !popoverElement.contains(event.target) && 
                    buttonElement && !buttonElement.contains(event.target)) {
                    ocultarObservaciones(event);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };    }, [observacionesPopover.visible, observacionesPopover.turnoId]);
      // useEffect para monitorear cambios en el estado del popover
    useEffect(() => {
        // Estado popover cambió
    }, [observacionesPopover]);
    
    useEffect(() => {
        if (agendaConsul && agendaConsul.length === 0) {
            setForzarMostrarGrilla(true);
        } else {
            setForzarMostrarGrilla(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agendaConsul]);

    if (loading) {
        return <Loader />;
    }    return (
        <section className="relative">
            
            {/* Botones de navegación sticky */}
            {cambiarFecha && (
                <>                    
                    {/* Botón navegación izquierda (día anterior) */}
                    <button 
                        onClick={() => {
                            const nuevaFecha = new Date(fecha);
                            nuevaFecha.setDate(nuevaFecha.getDate() - 1);
                            cambiarFecha(nuevaFecha);
                        }}
                        className="fixed left-2 top-1/2 transform -translate-y-1/2 z-50 text-slate-600 md:text-white bg-transparent md:bg-slate-500 hover:bg-slate-500 hover:text-white active:bg-slate-600 min-h-42 md:min-h-32 px-3 py-6 rounded-r-lg border-2 border-slate-400 md:border-none shadow-lg transition-all duration-200 flex items-center justify-center group hover:px-4"
                        title="Día anterior"
                    >
                        <i className="fa-solid fa-chevron-left fa-lg group-hover:scale-110 transition-transform"></i>
                    </button>

                    {/* Botón navegación derecha (día siguiente) */}
                    <button 
                        onClick={() => {
                            const nuevaFecha = new Date(fecha);
                            nuevaFecha.setDate(nuevaFecha.getDate() + 1);
                            cambiarFecha(nuevaFecha);
                        }}
                        className="fixed right-2 top-1/2 transform -translate-y-1/2 z-50 text-slate-600 md:text-white bg-transparent md:bg-slate-500 hover:bg-slate-500 hover:text-white active:bg-slate-600 min-h-42 md:min-h-32 rounded-l-lg px-3 py-6 border-2 border-slate-400 md:border-none shadow-lg transition-all duration-200 flex items-center justify-center group hover:px-4"
                        title="Día siguiente"
                    >
                        <i className="fa-solid fa-chevron-right fa-lg group-hover:scale-110 transition-transform"></i>
                    </button>
                </>
            )}

            {!consultorios || consultorios.length === 0 || !agendaConsul || agendaConsul.length === 0 && (
                <div className="flex items-center justify-center flex-wrap gap-5 w-full h-full p-5 mt-5 font-bold bg-[var(--card-bg)] border border-amber-200 rounded-md">
                    <i className="fa-solid fa-calendar-xmark fa-2xl text-amber-500"></i>
                    <h2>No hay Calendario de Consultorio Disponible para la Fecha Seleccionada.</h2>
                    <i className="fa-solid fa-calendar-xmark fa-2xl text-amber-500"></i>
                </div>
            )}
            {consultorios && consultorios.length > 0 && agendaConsul && agendaConsul.length > 0 && (
                <div className="p-2 flex flex-col items-start justify-center rounded-xl">
                    <div className="flex items-center justify-between w-full">
                        <h1 className="m-5 font-bold text-3xl">Calendario de Turnos</h1>
                        <div className="inline-flex items-center justify-center">
                            <div className="calendar-icon border border-red-500 rounded-lg shadow-sm overflow-hidden w-14 h-14 flex flex-col">
                                <div className="bg-red-600 text-xs font-bold text-center py-1">
                                    {fecha.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase()}
                                </div>
                                <div className="flex-grow flex items-center justify-center">
                                    <span className="font-bold text-xl">
                                    {fecha.getDate()}
                                    </span>
                                </div>
                            </div>
                            <div className="ml-2 flex flex-col items-start">
                                <span className="text-lg font-bold ">
                                    {fecha.toLocaleDateString('es-AR', {
                                    weekday: 'long',
                                    })}
                                </span>
                                <span className="text-sm">
                                    {fecha.toLocaleDateString('es-AR', {
                                    month: 'long',
                                    year: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div 
                        className={`hidden md:grid items-center justify-start w-full bg-[var(--card-bg)] p-3 font-bold text-xl rounded-md sticky top-0 z-50`}
                        style={{ 
                            gridTemplateColumns: `repeat(${(consultorios.length*4)+1}, minmax(0, 1fr))`
                        }}
                    >
                        <div className="p-1 col-span-1 flex items-center justify-start gap-3">
                            <div className="calendar-icon border border-red-500 rounded-lg shadow-sm overflow-hidden w-14 h-14 flex flex-col">
                                <div className="bg-red-600 text-xs font-bold text-center py-1">
                                    {fecha.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase()}
                                </div>
                                <div className="flex-grow flex items-center justify-center">
                                    <span className="font-bold text-xl">
                                    {fecha.getDate()}
                                    </span>
                                </div>
                            </div>
                            <span className="text-lg font-bold ">
                               {fecha.toLocaleDateString('es-AR', {
                                    weekday: 'short',
                                }).charAt(0).toUpperCase() + fecha.toLocaleDateString('es-AR', {
                                    weekday: 'short',
                                }).slice(1)}
                            </span>
                        </div>
                        {consultorios.map((consultorio) => (
                            <div
                                key={`${consultorio.id}-encabezado`}  
                                className="m-1 p-2 col-span-4 rounded-lg"
                                style={{ 
                                    backgroundColor: consultorio.color,
                                    color: isColorLight(consultorio.color) ? '#000' : '#fff',
                                }}
                            >
                                {consultorio.nombre}
                            </div> 
                        ))}
                    </div>
                    {/* Vista de escritorio - se oculta en pantallas pequeñas */}
                    <div className="hidden md:block w-full">
                        {/* Pre-process the agenda to consolidate turnos from hidden slots */}
                        {(() => {
                            // Deep clone to avoid modifying the original data
                            const processedAgenda = JSON.parse(JSON.stringify(agendaConsul));
                            
                            // For each consultorio column, check for spanning cells
                            for (let consultorioIndex = 0; consultorioIndex < consultorios.length; consultorioIndex++) {
                                for (let horaIndex = 0; horaIndex < processedAgenda.length; horaIndex++) {
                                    const hora = processedAgenda[horaIndex];
                                    const consultorio = hora.consultorios[consultorioIndex];
                                    
                                    if (consultorio && consultorio.slotsOcupados > 1) {
                                        // This consultorio spans multiple slots
                                        for (let spanIndex = 1; spanIndex < consultorio.slotsOcupados; spanIndex++) {
                                            // Make sure we don't go out of bounds
                                            if (horaIndex + spanIndex < processedAgenda.length) {
                                                const spanHora = processedAgenda[horaIndex + spanIndex];
                                                const spanConsultorio = spanHora.consultorios[consultorioIndex];
                                                
                                                // Check if the span slot has turnos to consolidate
                                                if (spanConsultorio && spanConsultorio.turnos && spanConsultorio.turnos.length > 0) {
                                                    // Initialize turnos array if needed
                                                    if (!consultorio.turnos) consultorio.turnos = [];
                                                    
                                                    // Consolidate turnos from the span slot to the main slot
                                                    consultorio.turnos = [
                                                        ...consultorio.turnos,
                                                        ...spanConsultorio.turnos
                                                    ];
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            
                            return (
                                <div 
                                    className="grid w-full border border-slate-200 rounded-md"
                                    style={{ 
                                        gridTemplateColumns: `repeat(${(consultorios.length*4)+1}, minmax(0, 1fr))`,
                                        gridAutoRows: 'minmax(60px, auto)',
                                    }}
                                >
                                    {processedAgenda.flatMap((hora, index) => {
                                        // Calculate row start position 
                                        const rowPosition = index + 1;                            
                                        return [
                                            // Hour cell for this row
                                            <div 
                                                key={`${index}-fila-${hora.hora}`}
                                                className="m-1 font-bold text-xl col-span-1"
                                                style={{
                                                    gridRow: rowPosition, // Place in correct row
                                                    gridColumn: 1 // First column
                                                }}
                                            >                           
                                                <div className="px-2 py-2 border rounded-md text-center">
                                                    {hora.hora}
                                                </div>
                                            </div>,
                                            // ...existing code for rendering consultorio cells but using processedAgenda...
                                            ...hora.consultorios.map((consultorio, consultorioIndex) => {
                                                // Skip rendering if a previous cell is already spanning this position
                                                const hasAppointmentBlockingThisSlot = processedAgenda
                                                    .slice(0, index) // Look at previous rows
                                                    .some((prevHora, prevIndex) => {
                                                        const prevConsultorio = prevHora.consultorios[consultorioIndex];
                                                        return prevConsultorio?.slotsOcupados > (index - prevIndex);
                                                    });
                                                    
                                                if (hasAppointmentBlockingThisSlot) {
                                                    return null; // Don't render anything, a previous slot is spanning this area
                                                }                                
                                                return (
                                                    <div 
                                                        key={`${consultorio.consultorioId}-${hora.hora}`}
                                                        className={`m-1 p-2 col-span-4 rounded-lg flex flex-row items-start justify-start gap-2`}
                                                        style={{ 
                                                            backgroundColor: consultorio.doctores.filter(d => d.atencion).length > 0 ? consultorio.color : 'oklch(86.9% 0.022 252.894)',
                                                            color: consultorio.doctores.filter(d => d.atencion).length > 0 ? isColorLight(consultorio.color) ? '#000' : '#fff' : 'red',
                                                            gridRow: `${rowPosition} / span ${consultorio.slotsOcupados || 1}`, // Place in correct row with span
                                                            gridColumn: `${2 + consultorioIndex * 4} / span 4`, // Calculate column position
                                                            zIndex: consultorio.slotsOcupados > 1 ? 10 : 'auto'
                                                        }}
                                                    >
                                                        {consultorio.doctores.filter(d => d.atencion).length > 0
                                                            ? consultorio.doctores.filter(d => d.atencion).map(doctor => (
                                                                <React.Fragment key={`${doctor.id}-${hora.hora}-${consultorio.consultorioId}-fragment`}>
                                                                    <div
                                                                        key={`${doctor.id}-${hora.hora}-${consultorio.consultorioId}`}
                                                                        className="p-1 rounded-md"
                                                                        title={doctor.nombre}
                                                                        style={{
                                                                            backgroundColor: doctor.color,
                                                                            color: isColorLight(doctor.color) ? '#000' : '#fff',
                                                                        }}
                                                                        >
                                                                        {doctor.emoji}
                                                                    </div>
                                                                    {(!consultorio.turnos || consultorio.turnos.filter(t => t.estado !== 'cancelado').length === 0) && (
                                                                        <div 
                                                                            key={`${doctor.id}-${hora.hora}-${consultorio.consultorioId}-nuevo-turno`}
                                                                            className="text-lg flex items-center justify-center w-full"
                                                                        >
                                                                            <button 
                                                                                onClick={() => abrirModalNuevoTurnoDispo({
                                                                                    desde: combinarFechaYHora(fecha, hora.hora),
                                                                                    duracion: 15,
                                                                                    doctor,
                                                                                    tipoDeTurnoId: '',
                                                                                    consultorioId: consultorio.consultorioId
                                                                                })}
                                                                                title="Nuevo turno"
                                                                                className="text-[var(--color-primary)] hover:text-orange-900 dark:text-[var(--color-primary)] p-2 rounded-md bg-slate-200 flex items-center justify-center gap-2"
                                                                            >
                                                                                <span className="text-xs font-bold animate-bounce">
                                                                                   ‼️ Turno Disponible ‼️
                                                                                </span>
                                                                                <i className="fa fa-plus fa-lg"></i>
                                                                                <i className="fa fa-calendar fa-lg"></i>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </React.Fragment>
                                                            ))
                                                            : <div key={`${hora.hora}-${consultorio.consultorioId}`} className="p-1 rounded-md bg-slate-200 text-red-500">
                                                                ❌
                                                            </div>
                                                        }
                                                        <div className="flex flex-wrap items-start justify-start gap-2 w-full">                                                        {consultorio.turnos && consultorio.turnos.length > 0 && (                                                    
                                                            consultorio.turnos.map(turno => (
                                                                <div 
                                                                        key={turno.id} 
                                                                        className="text-xs p-2 rounded-md flex flex-col items-center justify-start gap-1 flex-wrap"
                                                                        style={{
                                                                            backgroundColor: turno.doctor.color,
                                                                            color: isColorLight(turno.doctor.color) ? '#000' : '#fff',
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-2 font-bold flex-wrap">
                                                                            {formatoFecha(turno.desde, true, false, false, false, true, false)}                                                                            {turno.estado !== 'cancelado' && turno.coberturaMedica && (  
                                                                                <div 
                                                                                    className="text-xs font-normal p-1 rounded-md"
                                                                                    style={{
                                                                                        backgroundColor: turno.coberturaMedica?.color || '#CCCCCC',
                                                                                        color: isColorLight(turno.coberturaMedica?.color || '#CCCCCC') ? '#000' : '#fff',
                                                                                    }}
                                                                                >
                                                                                    {turno.coberturaMedica?.codigo ? turno.coberturaMedica.codigo.toUpperCase() : 'No asignado'}
                                                                                </div>
                                                                            )}                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <button
                                                                                    onClick={() => abrirDetalleTurno(turno)}
                                                                                    className="rounded-md bg-blue-50 p-1 text-blue-600 hover:bg-blue-100 border border-blue-600"
                                                                                    title="Ver detalles"
                                                                                >
                                                                                    <i className="fa fa-eye text-blue-600 "></i>
                                                                                </button>
                                                                                {turno.estado !== 'cancelado' && !esEvento(turno) && (<>
                                                                                <Link 
                                                                                    href={`https://wa.me/${turno.paciente.celular}`} 
                                                                                    target="_blank"
                                                                                    title="Escribir por Whatsapp"
                                                                                    className="rounded-md bg-green-100 p-1 text-green-600 hover:bg-green-100 border border-green-600"
                                                                                >
                                                                                    <i className="fab fa-whatsapp text-green-600 "></i>
                                                                                </Link>
                                                                                <button
                                                                                    onClick={() => enviarRecordatorio(turno.id)}
                                                                                    className="rounded-md bg-green-50 p-1 text-green-700 hover:bg-green-100 border border-green-700"
                                                                                    title="Enviar Recordatorios"
                                                                                    >
                                                                                    <i className="fa fa-solid fa-bell text-green-600 "></i>
                                                                                </button>                                                                                    <button
                                                                                    onClick={() => abrirModalNuevoTurno(turno.paciente)}
                                                                                    className="rounded-md bg-orange-50 p-1 text-[var(--color-primary)] hover:bg-orange-100 border border-[var(--color-primary)]"
                                                                                    title="Nuevo turno"
                                                                                    >
                                                                                    <i className="fa-solid fa-plus"></i>
                                                                                </button>
                                                                                </>)}
                                                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${obtenerColorEstado(turno.estado || 'sin confirmar')}`}>
                                                                                    {obtenerNombreEstado(turno.estado) || 'sin confirmar'}
                                                                                </span>
                                                                            </div>
                                                                        </div>                                                                        {turno.estado !== 'cancelado' && (
                                                                            <div 
                                                                                key={`${turno.id}-paciente-${turno.paciente.id}`}
                                                                                className="flex items-center justify-start gap-4 w-full flex-wrap"
                                                                            >
                                                                                <div className="font-bold">
                                                                                    {esEvento(turno) 
                                                                                        ? (turno.observaciones || 'Evento') 
                                                                                        : `${turno.paciente.nombre} ${turno.paciente.apellido}`
                                                                                    }
                                                                                </div>
                                                                                <i className="fa-solid fa-calendar-check fa-lg"></i>
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="font-bold p-1 rounded-full bg-[var(--color-primary)] text-white">
                                                                                        {formatoDuracion(turno.duracion)}
                                                                                    </div>
                                                                                    <BotonObservaciones turno={turno} />
                                                                                </div>
                                                                                {/* {turno.tipoDeTurno.nombre.substring(0, 14).toUpperCase()} */}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))                                                    
                                                            )}  
                                                        </div>                                             
                                                    </div>
                                                );                                
                                            })
                                        ];
                                    })}
                                </div>
                            );
                        })()}
                    </div>                
                    {/* Vista móvil - se oculta en pantallas grandes */}
                    <div className="md:hidden w-full">
                        {(() => {
                            // Deep clone to avoid modifying the original data - same processing as desktop view
                            const processedAgenda = JSON.parse(JSON.stringify(agendaConsul));
                            
                            // For each consultorio column, check for spanning cells - same logic as desktop
                            for (let consultorioIndex = 0; consultorioIndex < consultorios.length; consultorioIndex++) {
                                for (let horaIndex = 0; horaIndex < processedAgenda.length; horaIndex++) {
                                    const hora = processedAgenda[horaIndex];
                                    const consultorio = hora.consultorios[consultorioIndex];
                                    
                                    if (consultorio && consultorio.slotsOcupados > 1) {
                                        // This consultorio spans multiple slots
                                        for (let spanIndex = 1; spanIndex < consultorio.slotsOcupados; spanIndex++) {
                                            // Make sure we don't go out of bounds
                                            if (horaIndex + spanIndex < processedAgenda.length) {
                                                const spanHora = processedAgenda[horaIndex + spanIndex];
                                                const spanConsultorio = spanHora.consultorios[consultorioIndex];
                                                
                                                // Check if the span slot has turnos to consolidate
                                                if (spanConsultorio && spanConsultorio.turnos && spanConsultorio.turnos.length > 0) {
                                                    // Initialize turnos array if needed
                                                    if (!consultorio.turnos) consultorio.turnos = [];
                                                    
                                                    // Consolidate turnos from the span slot to the main slot
                                                    consultorio.turnos = [
                                                        ...consultorio.turnos,
                                                        ...spanConsultorio.turnos
                                                    ];
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            
                            return (
                                <div className="flex flex-col space-y-6">
                                    {processedAgenda.map((hora, index) => {
                                        // Skip rendering empty slots (no consultorio has appointments)
                                        const hasAppointments = hora.consultorios.some(c => 
                                            c.turnos && c.turnos.length > 0 && 
                                            c.doctores && c.doctores.filter(d => d.atencion).length > 0
                                        );
                                        
                                        // Check if this slot is blocked by a previous spanning appointment
                                        const blockingConsultorios = [];
                                        for (let consultorioIndex = 0; consultorioIndex < hora.consultorios.length; consultorioIndex++) {
                                            const isBlocked = processedAgenda
                                                .slice(0, index)
                                                .some((prevHora, prevIndex) => {
                                                    const prevConsultorio = prevHora.consultorios[consultorioIndex];
                                                    return prevConsultorio?.slotsOcupados > (index - prevIndex);
                                                });
                                            
                                            if (isBlocked) blockingConsultorios.push(consultorioIndex);
                                        }
                                        
                                        // If all consultorios are blocked and there are no appointments, skip
                                        if (blockingConsultorios.length === hora.consultorios.length && !hasAppointments) {
                                            return null;
                                        }
                                        
                                        return (
                                            <div key={`mobile-slot-${hora.hora}`} className="bg-blue-50 rounded-lg grid grid-cols-5 gap-1">
                                                {/* Time slot header */}
                                                <div className="w-full col-span-1 flex flex-col items-center justify-start gap-4 my-2 mx-1 text-[var(--color-primary)] bg-[var(--card-bg)]">
                                                    <div className="text-xl font-bold border p-2 rounded-md shadow-xl">
                                                        {hora.hora}
                                                    </div>
                                                    <div className="calendar-icon border border-red-500 rounded-lg shadow-sm overflow-hidden flex flex-col">
                                                        <div className="bg-red-600 text-white text-xs font-bold text-center px-2 py-1 w-14">
                                                            {fecha.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase()}
                                                        </div>
                                                        <div className="flex-grow flex items-center justify-center px-2 py-1">
                                                            <span className="font-bold text-xl">{fecha.getDate()}</span>
                                                        </div>
                                                    </div>
                                                     <span className="text-lg font-bold ">
                                                        {fecha.toLocaleDateString('es-AR', {
                                                                weekday: 'short',
                                                            }).charAt(0).toUpperCase() + fecha.toLocaleDateString('es-AR', {
                                                                weekday: 'short',
                                                            }).slice(1)}
                                                    </span>
                                                </div>                                                
                                                {/* Consultorios for this time slot */}
                                                <div className="col-span-4 p-2 flex flex-col gap-4">
                                                    {hora.consultorios.map((consultorio, consultorioIndex) => {
                                                        // Skip rendering if this consultorio is blocked by a previous appointment
                                                        if (blockingConsultorios.includes(consultorioIndex)) {
                                                            return null;
                                                        }
                                                          // Skip if no doctor is attending or no appointments
                                                        const doctoresAtendiendo = consultorio.doctores.filter(d => d.atencion===true);
                                                        const hasTurnos = consultorio.turnos && consultorio.turnos.length > 0;
                                                        if (doctoresAtendiendo.length === 0 && !hasTurnos) {
                                                            return null;
                                                        }
                                                        
                                                        return (
                                                            <div 
                                                                key={`mobile-${hora.hora}-${consultorio.consultorioId}`}
                                                                className="p-1 flex flex-col gap-1 rounded-md"
                                                                style={{ 
                                                                    backgroundColor: consultorio.color,                                                   
                                                                    color: isColorLight(consultorio.color) ? '#000' : '#fff'
                                                                }}
                                                            >
                                                                
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <div className="font-bold p-2 shadow-lg border-md">{`${consultorio.nombre}`}</div>                                                                
                                                                    {doctoresAtendiendo.map(doctor => (
                                                                        <div
                                                                            key={`mobile-doctor-${doctor.id}-${hora.hora}`}
                                                                            className="p-2 rounded-md text-sm"
                                                                            title={doctor.nombre}
                                                                            style={{
                                                                                backgroundColor: doctor.color,
                                                                                color: isColorLight(doctor.color) ? '#000' : '#fff',
                                                                            }}
                                                                        >
                                                                            {doctor.emoji}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                    
                                                                    {doctoresAtendiendo.length > 0 && (!hasTurnos || consultorio.turnos.filter(t => t.estado !== 'cancelado').length === 0) 
                                                                    ? (
                                                                        <div className="p-1 flex items-center gap-2">
                                                                            <button 
                                                                                onClick={() => abrirModalNuevoTurnoDispo({
                                                                                    desde: combinarFechaYHora(fecha, hora.hora),
                                                                                    duracion: 15,
                                                                                    doctor: doctoresAtendiendo[0],
                                                                                    tipoDeTurnoId: '',
                                                                                    consultorioId: consultorio.consultorioId
                                                                                })}
                                                                                title="Nuevo turno"
                                                                                className="text-[var(--color-primary)] border border-[var(--color-primary)] hover:text-orange-900 bg-slate-200 p-2 text-xl rounded-md flex items-center gap-2"
                                                                            >
                                                                                <span className="text-xs font-bold animate-bounce">
                                                                                   ‼️ Turno Disponible ‼️
                                                                                </span>
                                                                                <i className="fa fa-plus"></i>
                                                                                <i className="fa fa-calendar"></i>
                                                                            </button>
                                                                        </div>
                                                                    )
                                                                    : (
                                                                        <div className="p-1 flex items-center">
                                                                            {doctoresAtendiendo.map(doctor => (
                                                                                <div
                                                                                    key={`mobile-doctor-${doctor.id}-${hora.hora}-nombre`}
                                                                                    className="p-1 rounded-md text-sm"
                                                                                    style={{
                                                                                        backgroundColor: doctor.color,
                                                                                        color: isColorLight(doctor.color) ? '#000' : '#fff',
                                                                                    }}
                                                                                >
                                                                                    {doctor.nombre}
                                                                                </div>
                                                                            ))}                      
                                                                        </div>
                                                                    )}
                                                               
                                                                {/* Turnos */}
                                                                {hasTurnos && (
                                                                    <div className="space-y-3">
                                                                        {consultorio.turnos.map(turno => (
                                                                            <div 
                                                                                key={`mobile-turno-${turno.id}`}
                                                                                className="p-3 rounded-md"
                                                                                style={{
                                                                                    backgroundColor: turno.doctor.color,
                                                                                    color: isColorLight(turno.doctor.color) ? '#000' : '#fff',
                                                                                }}
                                                                            >
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <div className="font-bold text-xs p-1 border rounded-md">
                                                                                        {formatoFecha(turno.desde, true, false, false, false, true, false)}
                                                                                    </div>
                                                                                      {turno.estado !== 'cancelado' && turno.coberturaMedica && (
                                                                                        <div 
                                                                                            className="text-xs font-normal p-1 rounded-md"
                                                                                            style={{
                                                                                                backgroundColor: turno.coberturaMedica?.color || '#CCCCCC',
                                                                                                color: isColorLight(turno.coberturaMedica?.color || '#CCCCCC') ? '#000' : '#fff',
                                                                                            }}
                                                                                        >
                                                                                            {turno.coberturaMedica?.codigo ? turno.coberturaMedica.codigo.toUpperCase() : 'No asignado'}
                                                                                        </div>
                                                                                    )}
                                                                                    
                                                                                    <span className={`inline-flex p-1 text-xs font-medium rounded-full ${obtenerColorEstado(turno.estado || 'sin confirmar')}`}>
                                                                                        {obtenerNombreEstado(turno.estado) || 'sin confirmar'}
                                                                                    </span>
                                                                                </div>
                                                                                  {turno.estado !== 'cancelado' && (
                                                                                    <>
                                                                                        <div className="font-bold text-sm mb-2">
                                                                                            {esEvento(turno) 
                                                                                                ? (turno.observaciones || 'Evento') 
                                                                                                : `${turno.paciente.nombre} ${turno.paciente.apellido}`
                                                                                            }
                                                                                        </div>
                                                                                          <div className="flex items-center justify-between">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <div className="bg-[var(--color-primary)] text-white rounded-full px-2 py-1 text-xs font-bold">
                                                                                                    {formatoDuracion(turno.duracion)}
                                                                                                </div>
                                                                                                <BotonObservaciones turno={turno} className="px-2" />
                                                                                            </div>
                                                                                              <div className="flex gap-2">
                                                                                                <button
                                                                                                    onClick={() => abrirDetalleTurno(turno)}
                                                                                                    className="rounded-md bg-blue-50 p-1 px-2 text-blue-600 hover:bg-blue-100 border border-blue-600"
                                                                                                    title="Ver detalles"
                                                                                                >
                                                                                                    <i className="fa fa-eye"></i>
                                                                                                </button>
                                                                                                
                                                                                                {!esEvento(turno) && (
                                                                                                    <>
                                                                                                        <Link 
                                                                                                            href={`https://wa.me/${turno.paciente.celular}`} 
                                                                                                            target="_blank"
                                                                                                            title="Escribir por Whatsapp"
                                                                                                            className="rounded-md bg-green-100 p-1 px-2 text-green-600 hover:bg-green-100 border border-green-600"
                                                                                                        >
                                                                                                            <i className="fab fa-whatsapp"></i>
                                                                                                        </Link>
                                                                                                        
                                                                                                        <button
                                                                                                            onClick={() => enviarRecordatorio(turno.id)}
                                                                                                            className="rounded-md bg-green-50 p-1 px-2 text-green-700 hover:bg-green-100 border border-green-700"
                                                                                                            title="Enviar Recordatorios"
                                                                                                        >
                                                                                                            <i className="fa fa-solid fa-bell"></i>
                                                                                                        </button>                                                                                                <button
                                                                                                            onClick={() => abrirModalNuevoTurno(turno.paciente)}
                                                                                                            className="rounded-md bg-orange-50 p-1 px-2 text-[var(--color-primary)] hover:bg-orange-100 border border-[var(--color-primary)]"
                                                                                                            title="Nuevo turno"
                                                                                                        >
                                                                                                            <i className="fa-solid fa-plus"></i>
                                                                                                        </button>
                                                                                                    </>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                </div>              
            )}                  
            {/* Popover para mostrar observaciones */}
        {observacionesPopover.visible && (
            <>
                {/* Popover principal amarillo - POSICIÓN SIMPLIFICADA */}
                <div 
                    className="observaciones-popover"
                    style={{
                        position: 'fixed',
                        zIndex: 999999,
                        left: '50%',
                        top: '50%',
                        transform: 'translateX(-50%)',
                        minWidth: '250px',
                        maxWidth: '350px',
                        backgroundColor: '#fefce8',
                        border: '3px solid #ef4444',
                        borderRadius: '12px',
                        padding: '16px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        display: 'block',
                        visibility: 'visible',
                        opacity: '1',
                        pointerEvents: 'auto'
                    }}                    onMouseEnter={() => {
                    // Mouse entró al popover
                    }}
                    onMouseLeave={(e) => {
                        // Mouse salió del popover
                        setTimeout(() => ocultarObservaciones(e), 100);
                    }}
                >
                    <div className="flex items-center gap-2 mb-2 text-red-700">
                        <i className="fa fa-exclamation-triangle fa-xl" ></i>
                        <span className="font-bold">
                            Observaciones:
                        </span>
                    </div>
                    <p className="font-bold text-lg ">
                        {observacionesPopover.observaciones}
                    </p>
                    {/* Flecha apuntando hacia abajo */}
                    <div 
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '0',
                            height: '0',
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderTop: '8px solid #ef4444'
                        }}
                    ></div>                
                </div>
            </>
        )}

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
                setModalTurnoNuevo={setModalTurnoNuevo}            />
        </section>
    ); 
}
export default CalendarioTurno;
