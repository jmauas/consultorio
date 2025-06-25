"use client"

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useTheme } from 'next-themes';
import { toast } from 'react-hot-toast';
import { formatoFecha } from '@/lib/utils/dateUtils';
import { obtenerCoberturasDesdeDB } from '@/lib/utils/coberturasUtils';
import Loader from '@/components/Loader';
import { 
  FaUserMd, 
  FaStethoscope, 
  FaCalendarAlt, 
  FaClock, 
  FaUser, 
  FaPhone, 
  FaEnvelope, 
  FaIdCard, 
  FaShieldAlt, 
  FaStickyNote, 
  FaSearch,
  FaArrowLeft,
  FaCheck,
  FaCalendarPlus,
  FaCalendarDay,
  FaChevronUp,
  FaChevronDown,
  FaExclamationCircle,
  FaSpinner
} from 'react-icons/fa';

const TurnoDisponibilidadDirecta = ({ dniParam, celularParam, pacienteIdParam, onClose }) => {
  const { data: session } = useSession();
  
  // State variables
  const [configuracion, setConfiguracion] = useState({});
  const [doctores, setDoctores] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [duracion, setDuracion] = useState(0);
  const [agenda, setAgenda] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  
  // Form states
  const [showParte1, setShowParte1] = useState(true); // Doctor y tipo
  const [showParte2, setShowParte2] = useState(false); // Disponibilidad
  const [showParte3, setShowParte3] = useState(false); // Datos paciente
  const [showTipoTurno, setShowTipoTurno] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showLoadingPaciente, setShowLoadingPaciente] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);  const [errorMessage, setErrorMessage] = useState('');
  const [expandedDateRows, setExpandedDateRows] = useState({});
  const [coberturas, setCoberturas] = useState([]);
  const [turnosPaciente, setTurnosPaciente] = useState([]);

  const { theme } = useTheme();

  // Form data
  const [formData, setFormData] = useState({
    doctor: '',
    doctorId: '',
    servicio: '',
    servicioId: '',
    tipoDeTurnoId: '',
    dni: '',
    nombre: '',
    apellido: '',
    celular: '',
    email: '',
    coberturaMedicaId: '',
    observaciones: '',
  });
  
  // Field validation states
  const [fieldErrors, setFieldErrors] = useState({
    nombre: false,
    apellido: false,
    dni: false,
    celular: false,
    cobertura: false,
  });

  // Cargar las coberturas médicas disponibles
  const cargarCoberturasDisponibles = async () => {
    try {
      const coberturasDesdeDB = await obtenerCoberturasDesdeDB();
      setCoberturas(coberturasDesdeDB);
    } catch (error) {
      console.error('Error al cargar coberturas:', error);
    }
  };

  // Change doctor handler
  const handleDoctorChange = (e) => {
    const id = e.target.value;
    if (id === 'Indistinto') {
      validarDoctor({ id: 'Indistinto', nombre: 'Indistinto' });  
    } else {
      const selectedDoctor = doctores.find(dr => dr.id === id);
      validarDoctor(selectedDoctor);
    }
  };

  const validarDoctor = (doctor) => { 
    setFormData(prev => ({ 
      ...prev,
      doctorId: doctor.id, 
      doctor: doctor.nombre,
    }));
    
    if (doctor.id === '') return;
    
    setShowTipoTurno(true);
    
    let newTipos = [];
    if (doctor.id === 'Indistinto') {
      newTipos = unificarTipos(doctores);
    } else {
      if (doctor && doctor.tiposTurno) {
        // filtro los tipos que están habilitados y que, o son públicos, o no lo son pero hay usuario logueado
        newTipos = doctor.tiposTurno.filter(tipo =>
          tipo.habilitado && (tipo.publico === true || (session && session.user))
        );
      }
    }
    
    setTipos(newTipos);
    
    // Auto-select the appointment type if there's only one option
    const enabledTypes = newTipos.filter(tipo => tipo.habilitado);
    if (enabledTypes.length === 1) {
      const singleType = enabledTypes[0];
      setFormData(prev => ({ 
        ...prev, 
        servicio: singleType.nombre,
        servicioId: singleType.id,
        tipoDeTurnoId: singleType.id
      }));
      const typeDuration = Number(singleType.duracion) > 0 ? Number(singleType.duracion) : 30;
      setDuracion(typeDuration);
      // Buscar turnos automáticamente
      setTimeout(() => buscarTurnosDisponibles(doctor.id, singleType.id, typeDuration), 100);
    }
  };

  // Combine appointment types from all doctors
  const unificarTipos = (doctores) => {
    let unifiedTypes = [];
    if (!doctores || !Array.isArray(doctores)) return unifiedTypes;
    
    doctores.forEach(doctor => {
      if (!doctor.tiposTurno || !Array.isArray(doctor.tiposTurno)) return;
      
      doctor.tiposTurno.forEach(tipo1 => {
        if (tipo1.habilitado && (tipo1.publico === true || (session?.user))) {
          const exists = unifiedTypes.find(tipo2 => tipo2.nombre === tipo1.nombre);
          if (!exists) {
            unifiedTypes.push(tipo1);
          }
        }
      });
    });
    
    return unifiedTypes;
  };

  // Change service type handler
  const handleServiceChange = (e) => {
    const serv = e.target.value;
    const nombre = e.target.options[e.target.selectedIndex].text;
    setFormData(prev => ({ 
      ...prev, 
      servicio: nombre,
      servicioId: serv,
      tipoDeTurnoId: serv
    }));
    
    const selectedType = tipos.find(tipo => tipo.id === serv);
    if (selectedType) {
      const typeDuration = Number(selectedType.duracion) > 0 ? Number(selectedType.duracion) : 30;
      setDuracion(typeDuration);
      // Buscar turnos automáticamente cuando se selecciona el tipo
      buscarTurnosDisponibles(formData.doctorId, serv, typeDuration);
    }
  };

  // Buscar turnos disponibles
  const buscarTurnosDisponibles = async (doctorId, servicioId, duracionTurno) => {
    if (!doctorId || !servicioId || !duracionTurno) return;
    
    setShowLoading(true);
    setShowParte2(true);
    setShowParte1(false);
    
    try {
      const res = await fetch(`/api/turnos/disponibles?doctor=${doctorId}&duracion=${duracionTurno}&tipo=${servicioId}&asa=no&ccr=no`, {
        headers: {
          'x-api-source': 'whatsapp'
        }
      });
      const data = await res.json();
      console.log("Turnos disponibles:", data);      
      setAgenda(data.turnos || []);
      setShowLoading(false);
    } catch (error) {
      console.error('Error al buscar turnos disponibles:', error);
      setAgenda([]);
      setShowLoading(false);
    }
  };

  // Toggle expanded state for appointment time slots
  const toggleHorasVisibility = (fecha) => {
    setExpandedDateRows(prev => ({
      ...prev,
      [fecha]: !prev[fecha]
    }));
  };

  const ocultarTodosLosDias = () => {
    const allDates = Object.keys(expandedDateRows);
    const newExpandedState = allDates.reduce((acc, fecha) => {
      acc[fecha] = false;
      return acc;
    }, {});
    setExpandedDateRows(newExpandedState);   
  };

  // Select an appointment
  const handleSelectTurno = (fecha, turno) => {
    // Create appointment date objects
    let ano, mes, dia, desde, hasta;
    if (fecha.includes('-')) {
      ano = fecha.split('-')[0];
      mes = fecha.split('-')[1] - 1; // Month is 0-indexed
      dia = fecha.split('-')[2];
    } else {
      ano = new Date(fecha).getFullYear();
      mes = new Date(fecha).getMonth();
      dia = new Date(fecha).getDate();
    }
    desde = new Date(ano, mes, dia, turno.hora, turno.min);
    hasta = new Date(ano, mes, dia, turno.hora, turno.min);
    hasta.setMinutes(hasta.getMinutes() + duracion);
    
    // Determine doctor (use selected doctor if "Indistinto" was chosen)
    const selectedDoctor = turno.doctor;
        
    // Create turno object
    const turnoData = {
      desde: desde.toISOString(),
      hasta: hasta.toISOString(),
      doctorId: selectedDoctor.id,
      doctor: selectedDoctor.nombre,
      servicio: formData.servicio,
      servicioId: formData.servicioId,
      tipoDeTurnoId: formData.servicioId,
      duracion: turno.duracion,
      consultorioId: turno.consultorioId,
    };
    
    setTurnoSeleccionado(turnoData);
    setShowParte2(false);
    setShowParte3(true);
  };

  // Buscar paciente por DNI
  const buscarPacientePorDni = async () => {
    const dni = formData.dni;
    
    if (dni && dni.length >= 7) {
      try {
        setShowLoadingPaciente(true);
        
        const res = await fetch(`/api/pacientes?dni=${dni}`, {
          headers: {
            'x-api-source': 'whatsapp'
          }
        });
        const data = await res.json();
        
        setShowLoadingPaciente(false);
        
        if (data.ok && data.pacientes && data.pacientes.length > 0) {
          setPacienteData(data.pacientes[0]);
          toast.success('Paciente encontrado');
        } else {
          toast.info('Paciente no encontrado, complete los datos manualmente');
        }
      } catch (error) {
        console.error('Error al buscar paciente por DNI:', error);
        setShowLoadingPaciente(false);
        toast.error('Error al buscar el paciente');
      }
    }
  };

  // Buscar paciente por celular
  const buscarPacientePorCelular = async () => {
    const celular = formData.celular;
    if (celular && celular.length >= 4) {
      try {
        setShowLoadingPaciente(true);
        
        const res = await fetch(`/api/pacientes?celular=${celular}`, {
          headers: {
            'x-api-source': 'whatsapp'
          }
        });
        const data = await res.json();
        
        setShowLoadingPaciente(false);
        
        if (data.ok && data.pacientes && data.pacientes.length > 0) {
          setPacienteData(data.pacientes[0]);
          toast.success('Paciente encontrado');
        } else {
          toast.info('Paciente no encontrado, complete los datos manualmente');
        }
      } catch (error) {
        console.error('Error al buscar paciente por celular:', error);
        setShowLoadingPaciente(false);
        toast.error('Error al buscar el paciente');
      }
    }
  };
  // Set patient data in form
  const setPacienteData = (paciente) => {
    setFormData(prev => ({
      ...prev,
      nombre: paciente.nombre || '',
      apellido: paciente.apellido || '',
      dni: paciente.dni || '',
      celular: paciente.celular || '',
      email: paciente.email || '',
      coberturaMedicaId: paciente.coberturaMedicaId || '',
      pacienteId: paciente.id || '',
      observaciones: paciente.observaciones || ''
    }));

    // Process patient's future appointments if any
    if (paciente.turnos && paciente.turnos.length > 0) {
      const proximosTurnos = paciente.turnos.filter(turno => {
        const fechaTurno = new Date(turno.desde);
        return fechaTurno > new Date() && turno.estado !== 'cancelado';
      });
      setTurnosPaciente(proximosTurnos);
    } else {
      setTurnosPaciente([]);
    }
  };
  // Generic form field change handler
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // Clear error state if field has a value
    if (value.trim() !== '') {
      setFieldErrors(prev => ({ ...prev, [id]: false }));
    }
  };

  // Handle Enter key press for DNI and cellphone fields
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const fieldType = e.target.id; // 'dni' or 'celular'
      if (fieldType === 'dni') {
        buscarPacientePorDni();
      } else if (fieldType === 'celular') {
        buscarPacientePorCelular();
      }
    }
  };

  // Validar formulario de paciente
  const validarFormularioPaciente = () => {
    let hasError = false;
    const newFieldErrors = { ...fieldErrors };
    
    if (formData.nombre.length < 3) {
      newFieldErrors.nombre = true;
      hasError = true;
    }
    
    if (formData.apellido.length < 3) {
      newFieldErrors.apellido = true;
      hasError = true;
    }
    
    if (formData.dni.length < 7) {
      newFieldErrors.dni = true;
      hasError = true;
    }
    
    if (formData.celular.length < 8) {
      newFieldErrors.celular = true;
      hasError = true;
    }
    
    if (formData.coberturaMedicaId === '') {
      newFieldErrors.cobertura = true;
      hasError = true;
    }
    
    setFieldErrors(newFieldErrors);
    
    if (hasError) {
      setShowErrorMessage(true);
      setErrorMessage('Por favor complete todos los campos obligatorios correctamente.');
      return false;
    }
    
    return true;
  };

  // Register appointment
  const handleRegistrarTurno = async () => {
    if (!validarFormularioPaciente()) return;
    
    setShowLoading(true);
    setShowErrorMessage(false);
    
    // Crear objeto turno completo
    const turnoCompleto = {
      ...turnoSeleccionado,
      nombre: formData.nombre,
      apellido: formData.apellido,
      dni: formData.dni,
      celular: formData.celular,
      email: formData.email,
      coberturaMedicaId: formData.coberturaMedicaId,
      observaciones: formData.observaciones,
    };
    
    try {
      const res = await fetch('/api/turnos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-source': 'whatsapp'
        },
        body: JSON.stringify(turnoCompleto)
      });
      
      const data = await res.json();
      
      if (data.ok) {
        toast.success('Turno registrado con éxito!');
        setShowSuccessMessage(true);
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      } else {
        setShowErrorMessage(true);
        setErrorMessage(`Error al registrar el turno. ${data.message}`);
      }
      setShowLoading(false);
    } catch (error) {
      console.error('Error al registrar turno:', error);
      setShowErrorMessage(true);
      setErrorMessage('Error de conexión al intentar registrar el turno');
      setShowLoading(false);
    }
  };

  // Volver a la selección de turnos
  const volverASeleccionTurnos = () => {
    setShowParte3(false);
    setShowParte2(true);
    setTurnoSeleccionado(null);
  };

  // Volver al inicio
  const volverAlInicio = () => {
    setShowParte2(false);
    setShowParte3(false);
    setShowParte1(true);
    setAgenda([]);
    setTurnoSeleccionado(null);
  };
  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        // Obtener configuración
        const res = await fetch('/api/configuracion', {
          headers: {
            'x-api-source': 'whatsapp'
          }
        });
        
        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }
        
        const data = await res.json();
        
        // Aplicar filtrado de doctores basado en la sesión del usuario
        let doctoresDelUsuario = [];
        if (session?.user) {
          if (session.user.perfil?.id < 50 && session.user.doctores) {
            doctoresDelUsuario = session.user.doctores || [];
          }
        }
        
        // Guardar doctores si existen
        if (data.doctores && Array.isArray(data.doctores) && data.doctores.length > 0) {
          if (doctoresDelUsuario.length > 0) {
            const filtrados = data.doctores.filter(doc => doctoresDelUsuario.some(docUsuario => doc.id === docUsuario.id));
            setDoctores(filtrados);
            if (filtrados.length === 1) {
              validarDoctor(filtrados[0]);
            }
          } else {
            setDoctores(data.doctores);
          }
        } else {
          console.warn('No se encontraron doctores en la configuración');
          setDoctores([]);
        }
        
        // Guardar la configuración del consultorio
        if (data.config) {
          setConfiguracion(data.config);
        } else {
          setConfiguracion(data);
        }
        
        // Cargar coberturas
        await cargarCoberturasDisponibles();
        
        // Si hay parámetros, buscar paciente
        if (dniParam) {
          setFormData(prev => ({ ...prev, dni: dniParam }));
        }
        if (celularParam) {
          setFormData(prev => ({ ...prev, celular: celularParam }));
        }
        if (pacienteIdParam) {
          // Buscar paciente por ID si es necesario
        }
        
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
      }
    };

    cargarDatosIniciales();
  }, [dniParam, celularParam, pacienteIdParam, session]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className= "rounded-lg shadow-lg p-6">
          {/* Parte 1: Selección de Doctor y Tipo de Turno */}
        {showParte1 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <FaCalendarPlus className="text-blue-600 text-3xl" />
                <h2 className="text-2xl font-bold">
                  Nuevo Turno - Selección Rápida
                </h2>
              </div>
              <p className="">
                Selecciona el doctor y tipo de turno para ver disponibilidad inmediata
              </p>
            </div>

            {/* Selección de Doctor */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <FaUserMd className="text-blue-600" />
                Doctor <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.doctorId}
                onChange={handleDoctorChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}
              >
                <option value="">Seleccionar Doctor</option>
                {doctores.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.emoji} {doctor.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Selección de Tipo de Turno */}
            {showTipoTurno && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium ">
                  <FaStethoscope className="text-blue-600" />
                  Tipo de Turno <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.servicioId}
                  onChange={handleServiceChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}
                >
                  <option value="">Seleccionar Tipo de Turno</option>
                  {tipos.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre} ({tipo.duracion} min)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}       
         {/* Parte 2: Disponibilidad de Turnos */}
        {showParte2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaCalendarAlt className="text-blue-600 text-2xl" />
                <h2 className="text-2xl font-bold">
                  Turnos Disponibles
                </h2>
              </div>
              <button
                onClick={volverAlInicio}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                <FaArrowLeft />
                Cambiar Selección
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
              <div className="flex items-center gap-4 text-blue-800 dark:text-blue-200">
                <div className="flex items-center gap-2">
                  <FaUserMd />
                  <strong>Doctor:</strong> {formData.doctor}
                </div>
                <div className="flex items-center gap-2">
                  <FaStethoscope />
                  <strong>Tipo:</strong> {formData.servicio}
                </div>
                <div className="flex items-center gap-2">
                  <FaClock />
                  <strong>Duración:</strong> {duracion} min
                </div>
              </div>
            </div>

            {showLoading && <Loader />}

            {!showLoading && agenda.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500 dark:text-gray-400 text-lg">
                  No hay turnos disponibles para la selección actual
                </div>
              </div>
            )}

            {!showLoading && agenda.length > 0 && (
              <div id="agenda" className="space-y-4">
                {agenda.map((dia) => (
                  <div key={dia.fecha} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div 
                      className="flex items-center justify-between bg-blue-600 dark:bg-blue-700 px-4 py-3 cursor-pointer"
                      onClick={() => toggleHorasVisibility(dia.fecha)}
                    >                      <div className="flex items-center gap-2 text-white">
                        <FaCalendarDay /> 
                        <span className="font-medium">{dia.diaSemana}</span>
                        <span className="font-bold">{formatoFecha(dia.fecha, false, false, false, false)}</span>
                        <span className="text-blue-200">({dia.turnos.length} turnos)</span>
                      </div>
                      <button className="text-white hover:text-blue-200 focus:outline-none transition-colors">
                        {expandedDateRows[dia.fecha] ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    </div>
                    
                    {expandedDateRows[dia.fecha] && (
                      <div className="p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {dia.turnos.map((turno, index) => (
                            <button
                              key={`${dia.fecha}-${turno.hora}-${turno.min}-${index}`}
                              onClick={() => handleSelectTurno(dia.fecha, turno)}
                              className="p-3 border border-green-300 bg-green-50 hover:bg-green-100 dark:bg-green-900 dark:border-green-700 dark:hover:bg-green-800 rounded-lg transition-colors flex flex-col items-center gap-1"
                            >
                              <div className="font-bold text-green-800 dark:text-green-200">
                                {String(turno.hora).padStart(2, '0')}:{String(turno.min).padStart(2, '0')}
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-300">
                                {turno.doctor.emoji} {turno.doctor.nombre}
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
        )}        {/* Parte 3: Datos del Paciente */}
        {showParte3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaUser className="text-blue-600 text-2xl" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Datos del Paciente
                </h2>
              </div>
              <button
                onClick={volverASeleccionTurnos}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                <FaArrowLeft />
                Cambiar Turno
              </button>
            </div>

            {/* Resumen del turno seleccionado */}
            {turnoSeleccionado && (
              <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FaCheck className="text-green-600" />
                  <h3 className="font-bold text-green-800 dark:text-green-200">Turno Seleccionado:</h3>
                </div>
                <div className="flex flex-wrap gap-4 text-green-700 dark:text-green-300">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt />
                    <strong>Fecha:</strong> {formatoFecha(turnoSeleccionado.desde, false, false, false, true)}
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock />
                    <strong>Hora:</strong> {formatoFecha(turnoSeleccionado.desde, true, false, false, false).split(' ')[1]}
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUserMd />
                    <strong>Doctor:</strong> {turnoSeleccionado.doctor}
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock />
                    <strong>Duración:</strong> {duracion} min
                  </div>
                </div>
              </div>
            )}

            {/* Búsqueda de paciente */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <FaSearch className="text-blue-600" />
                <h3 className="font-bold text-gray-800 dark:text-gray-200">Buscar Paciente Existente</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FaIdCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      id="dni"
                      name="dni"
                      placeholder="DNI del paciente"
                      autoComplete="off"
                      value={formData.dni}
                      onChange={handleInputChange}
                      onKeyDown={(e) => handleKeyPress(e)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white ${
                        fieldErrors.dni ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                  <button
                    onClick={buscarPacientePorDni}
                    disabled={showLoadingPaciente}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                  >
                    <FaSearch />
                    Buscar
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      id="celular"
                      name="celular"
                      autoComplete="off"
                      placeholder="Celular del paciente"
                      value={formData.celular}
                      onChange={handleInputChange}
                      onKeyDown={(e) => handleKeyPress(e)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white ${
                        fieldErrors.celular ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                  <button
                    onClick={buscarPacientePorCelular}
                    disabled={showLoadingPaciente}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                  >
                    <FaSearch />
                    Buscar
                  </button>
                </div>
              </div>
            </div>            {/* Formulario de paciente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium  mb-1">
                  <FaUser className="text-blue-600" />
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  autoComplete='off'
                  placeholder="Nombre del paciente"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    fieldErrors.nombre ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium  mb-1">
                  <FaUser className="text-blue-600" />
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="apellido"
                  autoComplete='off'
                  placeholder="Apellido del paciente"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    fieldErrors.apellido ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium  mb-1">
                  <FaEnvelope className="text-blue-600" />
                  Email
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    autoComplete="off"
                    placeholder="Email del paciente"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium  mb-1">
                  <FaShieldAlt className="text-blue-600" />
                  Cobertura Médica <span className="text-red-500">*</span>
                </label>
                <select
                  id="coberturaMedicaId"
                  value={formData.coberturaMedicaId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${
                    fieldErrors.cobertura ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Seleccionar Cobertura</option>
                  {coberturas.map(cobertura => (
                    <option key={cobertura.id} value={cobertura.id}>
                      {cobertura.nombre}
                    </option>
                  ))}
                </select>
              </div>            
                <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium  mb-1">
                  <FaStickyNote className="text-blue-600" />
                  Observaciones
                </label>
                <div className="relative">
                  <FaStickyNote className="absolute left-3 top-3 text-gray-400" />
                  <textarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>             
              </div>
            </div>

            {/* Alerta de turnos futuros del paciente */}
            {turnosPaciente && turnosPaciente.length > 0 && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
                <p className="font-medium"><i className="fas fa-calendar-check mr-2"></i> Turnos Futuros del Paciente:</p>
                <div className="mt-2 space-y-2">
                  {turnosPaciente.map((t, i) => (
                    <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-center justify-between">
                      <div className="flex items-center">
                        <i className="fas fa-calendar-check text-yellow-600 mr-3"></i>
                        <div>
                          <span className="font-bold text-yellow-800">{t.consultorio.nombre}</span>
                          <span className="mx-2">•</span>
                          <span className="text-yellow-700">{formatoFecha(t.desde, true, false, false, true, false, false)}</span>
                          <span className="mx-2">•</span>
                          <span className="text-yellow-700">{t.servicio}</span>
                          <span className="mx-2">•</span>
                          <span className="text-yellow-600 text-sm">({t.tipoDeTurno?.duracion || 30} min)</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensajes de error */}
            {showErrorMessage && (
              <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaExclamationCircle className="text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}            
            {/* Botones de acción */}
            <div className="flex justify-end gap-4">
              <button
                onClick={volverASeleccionTurnos}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                <FaArrowLeft />
                Cancelar
              </button>
              <button
                onClick={handleRegistrarTurno}
                disabled={showLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 transition-colors flex items-center gap-2"
              >                {showLoading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaCheck />
                )}
                Confirmar Turno
              </button>
            </div>
          </div>
        )}        
        {/* Mensaje de éxito */}
        {showSuccessMessage && (
          <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                  <FaCheck className="text-green-600 dark:text-green-400 text-xl" />
                </div>
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    ¡Turno Registrado!
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      El turno se ha registrado correctamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {showLoading && (
          <div className="absolute inset-0 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center">
            <Loader />
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnoDisponibilidadDirecta;
