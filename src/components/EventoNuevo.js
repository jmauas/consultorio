"use client"

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { formatoFecha } from '@/lib/utils/dateUtils';
import { 
    FaUserMd, 
    FaHospital, 
    FaCalendarAlt, 
    FaClock, 
    FaClipboardList, 
    FaSave, 
    FaTimes, 
    FaExclamationTriangle,
    FaSpinner,
    FaStar
} from 'react-icons/fa';

const EventoNuevo = ({ doctores = [], consultorios = [], onEventoCreado, onCancelar }) => {    const [formData, setFormData] = useState({
        doctorId: '',
        consultorioId: '',
        fecha: '',
        horaDesde: '',
        horaHasta: '',
        observaciones: ''
    });
    
    const [conflictos, setConflictos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [verificandoConflictos, setVerificandoConflictos] = useState(false);    // Función para verificar conflictos de horarios
    const verificarConflictos = async () => {
        const { doctorId, consultorioId, fecha, horaDesde, horaHasta } = formData;
        
        // Solo verificar si todos los campos están completos
        if (!doctorId || !consultorioId || !fecha || !horaDesde || !horaHasta) {
            setConflictos([]);
            return;
        }

        // Crear fechas completas para el mismo día
        const desde = new Date(`${fecha}T${horaDesde}`);
        const hasta = new Date(`${fecha}T${horaHasta}`);

        // Validar que la hora desde sea anterior a la hora hasta
        if (desde >= hasta) {
            setConflictos([{ 
                tipo: 'validacion', 
                mensaje: 'La hora de inicio debe ser anterior a la hora de fin' 
            }]);
            return;
        }

        setVerificandoConflictos(true);
        
        try {
            // Construir parámetros para verificar conflictos
            const params = new URLSearchParams({
                doctorId: doctorId,
                desde: desde.toISOString(),
                hasta: hasta.toISOString()
            });

            const response = await fetch(`/api/turnos?${params}`);
            const data = await response.json();

            if (data.ok && data.turnos) {
                // Filtrar turnos que entren en conflicto
                const turnosConConflicto = data.turnos.filter(turno => {
                    const turnoDesde = new Date(turno.desde);
                    const turnoHasta = new Date(turno.hasta);
                    
                    // Verificar solapamiento
                    return (
                        (desde < turnoHasta && hasta > turnoDesde) ||
                        (turnoDesde < hasta && turnoHasta > desde)
                    );
                });

                if (turnosConConflicto.length > 0) {
                    setConflictos(turnosConConflicto.map(turno => ({
                        tipo: 'conflicto',
                        turno: turno,
                        mensaje: `Conflicto con ${turno.paciente ? 
                            `turno de ${turno.paciente.nombre} ${turno.paciente.apellido}` : 
                            'evento'} el ${formatoFecha(turno.desde, true, true, true, true, true, false)}`
                    })));
                } else {
                    setConflictos([]);
                }
            }
        } catch (error) {
            console.error('Error al verificar conflictos:', error);
            toast.error('Error al verificar conflictos de horarios');
        } finally {
            setVerificandoConflictos(false);
        }
    };    // Verificar conflictos cuando cambien los campos relevantes
    useEffect(() => {
        const timer = setTimeout(() => {
            verificarConflictos();
        }, 500); // Debounce de 500ms

        return () => clearTimeout(timer);
    }, [formData.doctorId, formData.consultorioId, formData.fecha, formData.horaDesde, formData.horaHasta]);    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Si se cambia la hora desde, automáticamente establecer hora hasta a 1 hora posterior
        if (name === 'horaDesde' && value) {
            const [hours, minutes] = value.split(':');
            const horaDesde = new Date();
            horaDesde.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            const horaHasta = new Date(horaDesde.getTime() + 60 * 60 * 1000); // +1 hora
            const horaHastaString = horaHasta.toTimeString().slice(0, 5);
            
            setFormData(prev => ({
                ...prev,
                [name]: value,
                horaHasta: horaHastaString
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };    const validarFormulario = () => {
        const campos = ['doctorId', 'consultorioId', 'fecha', 'horaDesde', 'horaHasta', 'observaciones'];
        
        for (const campo of campos) {
            if (!formData[campo] || formData[campo].trim() === '') {
                toast.error(`El campo ${campo === 'doctorId' ? 'Doctor' : 
                    campo === 'consultorioId' ? 'Consultorio' :
                    campo === 'fecha' ? 'Fecha' :
                    campo === 'horaDesde' ? 'Hora desde' :
                    campo === 'horaHasta' ? 'Hora hasta' :
                    'Observaciones'} es obligatorio`);
                return false;
            }
        }

        // Verificar que no haya conflictos
        if (conflictos.length > 0) {
            toast.error('Hay conflictos de horarios que deben resolverse antes de continuar');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validarFormulario()) {
            return;
        }

        setLoading(true);        try {
            const desde = new Date(`${formData.fecha}T${formData.horaDesde}`);
            const hasta = new Date(`${formData.fecha}T${formData.horaHasta}`);
            
            const duracionMs = hasta.getTime() - desde.getTime();
            const duracionMinutos = Math.round(duracionMs / (1000 * 60));

            const eventoData = {
                doctorId: formData.doctorId,
                consultorioId: formData.consultorioId,
                desde: desde.toISOString(),
                hasta: hasta.toISOString(),
                observaciones: formData.observaciones,
                duracion: duracionMinutos,
                // Campos específicos para eventos
                esEvento: true
            };

            const response = await fetch('/api/eventos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventoData)
            });

            const data = await response.json();

            if (data.ok) {
                toast.success('Evento registrado exitosamente');
                
                // Limpiar formulario
                setFormData({
                    doctorId: '',
                    consultorioId: '',
                    fecha: '',
                    horaDesde: '',
                    horaHasta: '',
                    observaciones: ''
                });
                
                // Notificar al componente padre
                if (onEventoCreado) {
                    onEventoCreado(data.evento);
                }
            } else {
                toast.error(data.message || 'Error al registrar el evento');
            }
        } catch (error) {
            console.error('Error al registrar evento:', error);
            toast.error('Error al procesar la solicitud');
        } finally {
            setLoading(false);
        }
    };

    return (        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto my-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <FaStar className="mr-3 text-purple-600" />
                    Registrar Nuevo Evento
                </h2>
                {onCancelar && (
                    <button
                        onClick={onCancelar}
                        className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        type="button"
                    >
                        <FaTimes className="text-xl" />
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">                {/* Doctor */}
                <div>                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FaUserMd className="mr-2 text-blue-600" />
                        Doctor <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                            name="doctorId"
                            value={formData.doctorId}
                            onChange={handleInputChange}
                            className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Seleccionar doctor...</option>
                            {doctores.map(doctor => (
                                <option key={doctor.id} value={doctor.id}>
                                    {doctor.emoji} {doctor.nombre}
                                </option>
                            ))}
                        </select>
                        <FaUserMd className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                {/* Consultorio */}
                <div>                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FaHospital className="mr-2 text-green-600" />
                        Consultorio <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                            name="consultorioId"
                            value={formData.consultorioId}
                            onChange={handleInputChange}
                            className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="">Seleccionar consultorio...</option>
                            {consultorios.map(consultorio => (
                                <option key={consultorio.id} value={consultorio.id}>
                                    {consultorio.nombre}
                                </option>
                            ))}
                        </select>
                        <FaHospital className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </div>                {/* Fecha */}
                <div>                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FaCalendarAlt className="mr-2 text-indigo-600" />
                        Fecha del Evento <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="date"
                            name="fecha"
                            value={formData.fecha}
                            onChange={handleInputChange}
                            className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                        <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </div>                {/* Hora Desde y Hora Hasta */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <FaClock className="mr-2 text-orange-600" />
                            Hora Desde <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="time"
                                name="horaDesde"
                                value={formData.horaDesde}
                                onChange={handleInputChange}
                                className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <FaClock className="mr-2 text-orange-600" />
                            Hora Hasta <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="time"
                                name="horaHasta"
                                value={formData.horaHasta}
                                onChange={handleInputChange}
                                className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                            <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                </div>                {/* Observaciones */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FaClipboardList className="mr-2 text-teal-600" />
                        Observaciones <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <textarea
                            name="observaciones"
                            value={formData.observaciones}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Descripción del evento..."
                            required
                        />
                        <FaClipboardList className="absolute left-3 top-3 text-gray-400" />
                    </div>
                </div>                {/* Indicador de verificación de conflictos */}
                {verificandoConflictos && (
                    <div className="flex items-center text-blue-600">
                        <FaSpinner className="animate-spin mr-2" />
                        Verificando conflictos de horarios...
                    </div>
                )}

                {/* Alertas de conflictos */}
                {conflictos.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <FaExclamationTriangle className="text-red-500 mr-2 mt-1" />
                            <div>
                                <h4 className="text-red-800 font-medium mb-2">
                                    {conflictos[0].tipo === 'validacion' ? 'Error de Validación' : 'Conflictos de Horarios Detectados'}
                                </h4>
                                <ul className="text-red-700 text-sm space-y-1">
                                    {conflictos.map((conflicto, index) => (
                                        <li key={index}>• {conflicto.mensaje}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-4">
                    {onCancelar && (
                        <button
                            type="button"
                            onClick={onCancelar}
                            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center"
                        >
                            <FaTimes className="mr-2" />
                            Cancelar
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading || conflictos.length > 0 || verificandoConflictos}
                        className={`px-6 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center ${
                            loading || conflictos.length > 0 || verificandoConflictos
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {loading ? (
                            <>
                                <FaSpinner className="animate-spin mr-2" />
                                Registrando...
                            </>
                        ) : (
                            <>
                                <FaSave className="mr-2" />
                                Registrar Evento
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EventoNuevo;
