"use client"

import React, { useState, useEffect } from 'react';
import { procesarAgendaConsultorios } from '@/lib/services/turnos/turnosServiceC.js';
import Loader from '@/components/Loader';
import Link from 'next/link';
import { isColorLight } from '@/lib/utils/variosUtils';
import { formatoFecha, formatoDuracion } from '@/lib/utils/dateUtils';
import Modal from '@/components/Modal';
import DetalleTurno from './DetalleTurno';
import { toast } from 'react-hot-toast';
import { enviarMailConfTurno } from "@/lib/services/sender/resendService";
import { textoMensajeConfTurno } from '@/lib/services/sender/whatsappService';
import { enviarRecordatorioTurno } from '@/lib/services/sender/whatsappService';
import ModalNuevoTurno from '@/components/ModalNuevoTurno';
import { agregarFeriados } from '@/lib/utils/variosUtils.js';
import { obtenerEstados } from '@/lib/utils/estadosUtils';

const estados = obtenerEstados();

const CalendarioTurno = ({fecha, turnos, loading, setLoading, configuracion, doctores, consultorios}) => {
    const [agendaConsul, setAgendaConsul] = useState([]);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
    const [modalTurnoNuevo, setModalTurnoNuevo] = useState(false);
  
    // Estado para el modal de nuevo turno
    const [modalNuevoTurnoAbierto, setModalNuevoTurnoAbierto] = useState(false);
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
    const [turnoParaNuevoTurno, setTurnoParaNuevoTurno] = useState(null); 

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
        console.log(turno);
      setTurnoParaNuevoTurno(turno);
      setModalTurnoNuevo(true);
    }

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
        await enviarMailConfTurno(turno);
        
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
    };

    const obtenerNombreEstado = (estado) => {
        const estadoEncontrado = estados.find(e => e.id === estado);
        return estadoEncontrado ? estadoEncontrado.nombre : estado;
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
            const diaSemana = fecha.getDay();
            const feriados = agregarFeriados([], configuracion.feriados);
            const agendas = []
            let esFeriado = false;
            if (feriados && feriados.length > 0) {
                esFeriado = feriados.some(f =>
                    f.getDate() === fecha.getDate() &&
                    f.getMonth() === fecha.getMonth() &&
                    f.getFullYear() === fecha.getFullYear()
                );
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
                        const esNoLaborable = noLaborablesDoctor.some(f =>
                            f.getDate() === fecha.getDate() &&
                            f.getMonth() === fecha.getMonth() &&
                            f.getFullYear() === fecha.getFullYear()
                        );
                        if (esNoLaborable) noLaborable = true;
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

    if (loading) {
        return <Loader />;
    }

    return (
        <section>
            {!consultorios || consultorios.length === 0 || !agendaConsul || agendaConsul.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <h2>No hay turnos disponibles para la fecha seleccionada.</h2>
                </div>
            )}
            {consultorios && consultorios.length > 0 && agendaConsul && agendaConsul.length > 0 && (
                <div className="m-5 p-4 flex flex-col items-start justify-center rounded-xl">
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
                        className={`hidden md:grid items-center justify-start w-full bg-[var(--card-bg)] p-3 font-bold text-xl rounded-md sticky top-18 z-50`}
                        style={{ 
                            gridTemplateColumns: `repeat(${(consultorios.length*4)+2}, minmax(0, 1fr))`
                        }}
                    >
                        <div
                            className="m-1 p-2 text-xl font-bold col-span-1"
                        >
                            Hora
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
                    {
                        agendaConsul.map((hora, index) => (
                            <React.Fragment key={`hora-fragment-${index}-${hora.hora}`}>
                                <div 
                                    key={`${index}-encabezado-fila-${hora.hora}`}                           
                                    className={`grid items-center justify-start w-full border border-slate-200 rounded-md`}
                                    style={{ 
                                        gridTemplateColumns: `repeat(${(consultorios.length*4)+2}, minmax(0, 1fr))`
                                    }}
                                >
                                    <div 
                                        key={`${index}-fila-${hora.hora}`}
                                        className="m-1 font-bold text-xl col-span-1"    
                                        >                           
                                        <div className="px-2 py-2 border rounded-md text-center">
                                            {hora.hora}
                                        </div>
                                    </div>                         
                                    {hora.consultorios.map((consultorio) => {
                                        return (
                                            <div 
                                                key={`${consultorio.consultorioId}-${hora.hora}`}
                                                className="m-1 p-2 col-span-4 rounded-lg flex flex-row items-center justify-start gap-2"
                                                style={{ 
                                                    backgroundColor: consultorio.doctores.filter(d => d.atencion).length > 0 ? consultorio.color : 'oklch(86.9% 0.022 252.894)',
                                                    color: consultorio.doctores.filter(d => d.atencion).length > 0 ? isColorLight(consultorio.color) ? '#000' : '#fff' : 'red',
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
                                                                    className="text-[var(--color-primary)] hover:text-orange-900 dark:text-[var(--color-primary)] p-4 rounded-md bg-slate-200 flex items-center justify-center gap-2"
                                                                >
                                                                    <i className="fa fa-plus fa-lg"></i>
                                                                    <i className="fa fa-calendar fa-lg"></i>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </React.Fragment>
                                                    ))
                                                : <div
                                                        key={`${hora.hora}-${consultorio.consultorioId}`}
                                                        className="p-1 rounded-md bg-slate-200 text-red-500"
                                                    >
                                                        ❌
                                                    </div>}
                                                {consultorio.turnos && consultorio.turnos.length > 0 && (                                                    
                                                    consultorio.turnos.map(turno => (
                                                        <div 
                                                            key={turno.id} 
                                                            className="text-xs p-1 rounded-md flex flex-col items-center justify-start gap-1"
                                                            style={{
                                                                backgroundColor: turno.doctor.color,
                                                                color: isColorLight(turno.doctor.color) ? '#000' : '#fff',
                                                            }}>
                                                            <div className="flex items-center gap-2 font-bold">
                                                                {formatoFecha(turno.desde, true, false, false, false, true, false)}
                                                                {turno.estado !== 'cancelado' && (  
                                                                    <div 
                                                                        className="text-xs font-normal p-1 rounded-md"
                                                                        style={{
                                                                            backgroundColor: turno.coberturaMedica.color,
                                                                            color: isColorLight(turno.coberturaMedica.color) ? '#000' : '#fff',
                                                                        }}
                                                                    >
                                                                        {turno.coberturaMedica.codigo.toUpperCase()}
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-2">
                                                                    <button
                                                                        onClick={() => abrirDetalleTurno(turno)}
                                                                        className="rounded-md bg-blue-50 p-1 text-blue-600 hover:bg-blue-100 border border-blue-600"
                                                                        title="Ver detalles"
                                                                    >
                                                                       <i className="fa fa-eye text-blue-600 "></i>
                                                                    </button>
                                                                     {turno.estado !== 'cancelado' && (<>
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
                                                                        </button>
                                                                        <button
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
                                                            </div>
                                                            {turno.estado !== 'cancelado' && (
                                                               <div 
                                                                    key={`${turno.id}-paciente-${turno.paciente.id}`}
                                                                    className="flex items-center justify-start gap-4 w-full"
                                                                >
                                                                    <div className="font-bold">{turno.paciente.nombre} {turno.paciente.apellido}</div>
                                                                    <i className="fa-solid fa-calendar-check fa-lg"></i>
                                                                    <div className="font-bold p-1 rounded-full bg-[var(--color-primary)] text-white">
                                                                        {formatoDuracion(turno.duracion)}
                                                                    </div>
                                                                    {/* {turno.tipoDeTurno.nombre.substring(0, 14).toUpperCase()} */}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))                                                    
                                                )}                                               
                                            </div>
                                        );
                                    })}
                                </div>
                            </React.Fragment>
                        ))
                    }
                    </div>
                </div>
                )}
                    {/* Vista móvil - solo aparece en pantallas pequeñas */}
                <div className="relative md:hidden w-full">
                    {agendaConsul.map((hora, index) => (
                        <div 
                            key={`mobile-hora-${index}-${hora.hora}`} 
                            className="my-4 pb-2 bg-[var(--card-bg)]"
                        >
                            <div className="sticky top-20 z-10 p-2 flex items-center justify-between">
                                <div className="w-38 rounded-md border border-[var(--color-primary)] bg-[var(--card-bg)] font-bold text-2xl text-center">
                                    {hora.hora}
                                </div>
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
                            </div>
                            
                            {hora.consultorios.map((consultorio) => (
                                <div 
                                    key={`mobile-${consultorio.consultorioId}-${hora.hora}`}
                                    className="m-2 p-2 rounded-lg border border-slate-200"
                                    style={{ 
                                        backgroundColor: consultorio.doctores.filter(d => d.atencion).length > 0 ? consultorio.color : 'oklch(86.9% 0.022 252.894)',
                                        color: consultorio.doctores.filter(d => d.atencion).length > 0 ? isColorLight(consultorio.color) ? '#000' : '#fff' : 'black',
                                    }}
                                >
                                    <div className="font-bold text-lg mb-2">
                                        {consultorio.nombre}
                                    </div>
                                    
                                    <div className="flex flex-wrap items-center gap-2">
                                        {consultorio.doctores.filter(d => d.atencion).length > 0
                                            ? consultorio.doctores.filter(d => d.atencion).map(doctor => (
                                                <React.Fragment key={`mobile-${doctor.id}-${hora.hora}-${consultorio.consultorioId}-fragment`}>
                                                    <div
                                                        key={`mobile-${doctor.id}-${hora.hora}-${consultorio.consultorioId}`}
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
                                                        <div className="text-lg flex items-center justify-center">
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
                                                                <i className="fa fa-plus"></i>
                                                                <i className="fa fa-calendar"></i>
                                                            </button>
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            ))
                                            : <div
                                                className="p-1 rounded-md bg-slate-200 text-red-500"
                                            >
                                                ❌
                                            </div>}
                                    </div>
                                    
                                    {consultorio.turnos && consultorio.turnos.length > 0 && (
                                        <div className="mt-2 space-y-2">
                                            {consultorio.turnos.map(turno => (
                                                <div 
                                                    key={`mobile-turno-${turno.id}`} 
                                                    className="p-2 rounded-md"
                                                    style={{
                                                        backgroundColor: turno.doctor.color,
                                                        color: isColorLight(turno.doctor.color) ? '#000' : '#fff',
                                                    }}>
                                                    <div className="flex flex-wrap items-center gap-2 font-bold mb-1">
                                                        {formatoFecha(turno.desde, true, false, false, false, true, false)}
                                                        {turno.estado !== 'cancelado' && (  
                                                            <div 
                                                                className="text-xs font-normal p-1 rounded-md"
                                                                style={{
                                                                    backgroundColor: turno.coberturaMedica.color,
                                                                    color: isColorLight(turno.coberturaMedica.color) ? '#000' : '#fff',
                                                                }}
                                                            >
                                                                {turno.coberturaMedica.codigo.toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <button
                                                            onClick={() => abrirDetalleTurno(turno)}
                                                            className="rounded-md bg-blue-50 p-1 text-blue-600 hover:bg-blue-100 border border-blue-600"
                                                            title="Ver detalles"
                                                        >
                                                            <i className="fa fa-eye text-blue-600 "></i>
                                                        </button>
                                                        
                                                        {turno.estado !== 'cancelado' && (<>
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
                                                            </button>
                                                            <button
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
                                                    
                                                    {turno.estado !== 'cancelado' && (
                                                        <div className="flex flex-wrap items-center gap-2 w-full">
                                                            <div className="font-bold">
                                                                {turno.paciente.nombre} {turno.paciente.apellido}
                                                            </div>
                                                            <div className="font-bold p-1 rounded-full bg-[var(--color-primary)] text-white">
                                                                {formatoDuracion(turno.duracion)}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}                                                    
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
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
    </section>
    ) 
}
export default CalendarioTurno;
