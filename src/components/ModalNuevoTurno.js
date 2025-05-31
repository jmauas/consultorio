import React, { useState } from 'react';
import Modal from '@/components/Modal';
import TurnoNuevo from '@/components/TurnoNuevo';
import TurnoDisponibilidad from '@/components/TurnoDisponibilidadDirecta';

export default function ModalNuevoTurno({ 
    modalNuevoTurnoAbierto, 
    setModalNuevoTurnoAbierto, 
    pacienteSeleccionado,
    setPacienteSeleccionado,
    turnoParaNuevoTurno,
    modalTurnoNuevo,
    setModalTurnoNuevo,
    }) {
    
    const [tituloModal, setTituloModal] = useState('');
    const [modalTurnoDisponibilidad, setModalTurnoDisponibilidad] = useState(false);

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

    const cerrarModalNuevoTurno = () => {
        setModalNuevoTurnoAbierto(false);
        setPacienteSeleccionado(null);
    };

    const cerrarModalTurnoNuevo = () => {
        setModalTurnoNuevo(false);
        setModalTurnoDisponibilidad(false);        
    };

  

    return (
        <>
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
                className="flex items-center justify-center gap-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary)] text-white py-4 px-6 rounded-md shadow transition duration-200"
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
                consultorioIdParam={turnoParaNuevoTurno?.consultorioId}
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
        </>
    );
}