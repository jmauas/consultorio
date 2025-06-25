'use client';

import { useState, useEffect, Suspense } from 'react';
import { formatoFecha } from '@/lib/utils/dateUtils';
import { zfill } from '@/lib/utils/dateUtils.js';
import { obtenerCoberturasDesdeDB } from '@/lib/utils/coberturasUtils';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Loader from '@/components/Loader';
import { 
  FaCalendarPlus, 
  FaUserMd, 
  FaStethoscope, 
  FaSearch, 
  FaCheck, 
  FaUser, 
  FaIdCard, 
  FaMobileAlt, 
  FaEnvelope, 
  FaShieldAlt, 
  FaCalendarAlt, 
  FaCalendarDay, 
  FaChevronDown, 
  FaClock, 
  FaArrowLeft, 
  FaTimes, 
  FaExclamationTriangle, 
  FaBell, 
  FaExclamationCircle, 
  FaSadTear, 
  FaListAlt, 
} from 'react-icons/fa';


const DisponibilidadPage = ({dniParam, celularParam, pacienteIdParam}) => {
  const { data: session } = useSession();
  // State variables
  const [configuracion, setConfiguracion] = useState({});
  const [doctores, setDoctores] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [duracion, setDuracion] = useState(0);
  const [asa, setAsa] = useState([]);
  const [ccr, setCcr] = useState([]);
  const [turno, setTurno] = useState({});
  const [agenda, setAgenda] = useState([]);
  const [showPacienteForm, setShowPacienteForm] = useState(false);
  const [showParte1, setShowParte1] = useState(true);
  const [showParte2, setShowParte2] = useState(false);
  const [showTipoTurno, setShowTipoTurno] = useState(false);
  const [showDNI, setShowDNI] = useState(false);
  const [dniValidado, setDniValidado] = useState(false);
  const [showRegistrarTurno, setShowRegistrarTurno] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showLoadingPaciente, setShowLoadingPaciente] = useState(false);
  const [showErrorTurno, setShowErrorTurno] = useState(false);
  const [errorTurnoMessage, setErrorTurnoMessage] = useState('');
  const [existingTurno, setExistingTurno] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedDateRows, setExpandedDateRows] = useState({});
  const [allFieldsComplete, setAllFieldsComplete] = useState(false);
  const [coberturas, setCoberturas] = useState([]);

  const { theme, setTheme } = useTheme();

  // Form data
  const [formData, setFormData] = useState({
    doctor: '',
    doctorId: '',
    servicio: '',
    dni: '',
    nombre: '',
    apellido: '',
    celular: '',
    email: '',
    coberturaMedicaId: '',
    observaciones: '',
    tipoDeTurnoId: '',
  });
  
  // Field validation states
  const [fieldErrors, setFieldErrors] = useState({
    nombre: false,
    apellido: false,
    dni: false,
    celular: false,
    cobertura: false,
    servicio: false
  });

  const limpiarTurno = () => {
    setFormData(prev => ({
      ...prev,
      dni: '',
      nombre: '',
      apellido: '',
      celular: '',
      email: '',
      coberturaMedicaId: '',
      observaciones: '',
    }));
  };

  // Búsqueda de paciente por DNI desde parámetros de URL
  const buscarPacientePorParam = async (param) => {
   
    try {
      setShowLoadingPaciente(true);
      const response = await fetch(`/api/pacientes${param}`, {
        headers: {
          'x-api-source': 'whatsapp'
        }
      });      
      const data = await response.json();
      
      if (data.ok && data.pacientes && data.pacientes.length > 0) {
        setShowPacienteForm(true);
        setDniValidado(true);
        setShowDNI(true);
        setPacienteData(data.pacientes[0]);
      }
      
      setShowLoadingPaciente(false);
    } catch (error) {
      console.error('Error al buscar paciente:', error);
      setShowLoadingPaciente(false);
    }
  };

  // Cargar las coberturas médicas disponibles
  const cargarCoberturasDisponibles = async () => {
    try {
      // Obtener coberturas de la base de datos en lugar de la lista estática
      const coberturasDesdeDB = await obtenerCoberturasDesdeDB();
      
      setCoberturas(coberturasDesdeDB);
    } catch (error) {
      console.error('Error al cargar coberturas:', error);
      // Si hay un error, usar las coberturas estáticas como fallback
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
    //setShowPacienteForm(false);
    
    let newTipos = [];
    if (doctor.id === 'Indistinto') {
      newTipos = unificarTipos(doctores);
    } else {
      console.log("Doctor seleccionado:", doctor);
      if (doctor && doctor.tiposTurno) {
        // filtro los tipos que estan habnilitados y que, o son publicos, o no lo son pero hay usuario logurado
        newTipos = doctor.tiposTurno.filter(tipo =>
          tipo.habilitado && (tipo.publico===true || (session && session.user))
        );
      }
    }
    
    setTipos(newTipos);
    
    // Auto-select the appointment type if there's only one option
    const enabledTypes = newTipos.filter(tipo => tipo.habilitado);
    if (enabledTypes.length === 1) {
      const singleType = enabledTypes[0];
      // Update form data with the only available service
      setFormData(prev => ({ 
        ...prev, 
        servicio: singleType.nombre,
        servicioId: singleType.id,
        tipoDeTurnoId: singleType.id
      }));
      // Also update the duration and show the DNI field
      const typeDuration = Number(singleType.duracion) > 0 ? Number(singleType.duracion) : 30;
      setDuracion(typeDuration);
      setShowDNI(true);
      // Automatically show patient form
      setShowPacienteForm(true);
      // Clear any previous service error
      setFieldErrors(prev => ({ ...prev, servicio: false }));
      checkAllFieldsComplete();
    }
  };

  // Combine appointment types from all doctors
  const unificarTipos = (doctores) => {
    let unifiedTypes = [];
    if (!doctores || !Array.isArray(doctores)) return unifiedTypes;
    
    doctores.forEach(doctor => {
      if (!doctor.tiposTurno || !Array.isArray(doctor.tiposTurno)) return;
      
      doctor.tiposTurno.forEach(tipo1 => {
        if (tipo1.habilitado && (tipo1.publico===true || (session?.user))) {
          const control = unifiedTypes.filter(tipo2 => tipo2.nombre === tipo1.nombre);
          if (control.length === 0) {
            unifiedTypes.push(tipo1);
          } else {
            if (Number(control[0].dias) < Number(tipo1.dias)) {
              unifiedTypes[unifiedTypes.indexOf(control[0])].dias = tipo1.dias;
            }
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
    setFieldErrors(prev => ({ ...prev, servicio: false }));
    
    // Si el servicio ahora es válido y había un error por servicio, ocultar mensaje
    if (serv && serv !== '' && showErrorTurno && errorTurnoMessage.includes('campos')) {
      setShowErrorTurno(false);
    }
    
    const selectedType = tipos.find(tipo => tipo.id === serv);
    if (selectedType) {
      const typeDuration = Number(selectedType.duracion) > 0 ? Number(selectedType.duracion) : 30;
      setDuracion(typeDuration);
      setShowDNI(true);
      // // Reset DNI validation state when service is changed
      // setDniValidado(false);
      // setShowPacienteForm(false);
      checkAllFieldsComplete();
    }
  };

  // Validate DNI and fetch patient data
  const validateDni = async () => {
    const dni = formData.dni;
    
    if (dni && dni.length >= 7) {
      try {
        // Mostrar loader mientras se buscan los datos
        setShowLoadingPaciente(true);
        
        // Ocultar mensaje de error si estaba visible
        setShowErrorTurno(false);
        setShowPacienteForm(true);
        setDniValidado(true);
        
        const res = await fetch(`/api/pacientes?dni=${dni}`, {
          headers: {
            'x-api-source': 'whatsapp'
          }
        });
        const data = await res.json();
        
        // Ocultar loader
        setShowLoadingPaciente(false);
        
        if (data.ok && data.pacientes && data.pacientes.length > 0) {
          setPacienteData(data.pacientes[0]);
        }
      } catch (error) {
        console.error('Error al buscar paciente por DNI:', error);
        setShowLoadingPaciente(false);
      }
    } else {
      // Show error message for invalid DNI
      setShowErrorTurno(true);
      setErrorTurnoMessage('El DNI debe tener al menos 7 dígitos');
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
    
    // Reset existing turno data
    setExistingTurno(null);
    setAsa([]);
    setCcr([]);
    
    // Process patient's existing appointments if any
    if (paciente.turnos) {
      if (paciente.turnos.filter(t => t.penal==='asa').length > 0) {
        setAsa(paciente.turnos.filter(t => t.penal==='asa'));
      }
      
      if (paciente.turnos.filter(t => t.penal==='ccr').length > 0) {
        setCcr(paciente.turnos.filter(t => t.penal==='asa').length > 0);
      }
      
      const proximosTurnos = paciente.turnos.filter(t => 
        t.estado !== 'cancelado' && 
        new Date(t.desde) > new Date() // Convertir la string ISO a objeto Date para comparación
      ); 
      if (proximosTurnos.length > 0) {
        let turnoData = proximosTurnos[0];        
        // Clean up description for display
        if (turnoData.description) {
          let index = turnoData.description.lastIndexOf('✏️');
          if (index > 0) {
            turnoData.description = turnoData.description.substring(0, index - 1);
            turnoData.description = turnoData.description.replaceAll('\n', '<br />');
          }
        }        
        setExistingTurno({
          ...turnoData,
          paciente: paciente
        });
      }
    }
  };

  // Generic form field change handler
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // Clear error state if field has a value
    if (value.trim() !== '') {
      setFieldErrors(prev => ({ ...prev, [id]: false }));
      
      // Si el campo es DNI y ahora es válido, ocultar mensaje de error
      if (id === 'dni' && value.length >= 7 && showErrorTurno) {
        setShowErrorTurno(false);
      }
    }
  };

  // Manejar la tecla Enter en el campo DNI
  const handleDniKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateDni();
    }
  };

  // Check if all required fields are complete
  const  checkAllFieldsComplete = () => {
    const { nombre, apellido, dni, celular, coberturaMedicaId, servicio, doctor } = formData;
    
    const isComplete = 
      nombre && nombre.length >= 3 && 
      apellido && apellido.length >= 3 && 
      dni && dni.length >= 7 && 
      celular && celular.length >= 8 && 
      coberturaMedicaId && coberturaMedicaId !== '' &&
      servicio && servicio !== '' &&
      doctor && doctor !== '';
   
    setAllFieldsComplete(isComplete);
    return isComplete;
  };

  // Validate form and fetch available appointments
  const handleVerTurnos = async () => {
    // Reset error message
    setShowErrorTurno(false);
    
    // Validate required fields
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
    
    if (formData.coberturaMedicaId == '') {
      newFieldErrors.coberturaMedicaId = true;
      hasError = true;
    }
    
    if (duracion === 0 || !formData.servicio || formData.servicio === '') {
      newFieldErrors.servicio = true;
      hasError = true;
    }
    
    setFieldErrors(newFieldErrors);
    
    if (hasError) {
      setShowErrorTurno(true);
      setErrorTurnoMessage('Error al buscar los turnos. Debes completar los campos en rojo correctamente.');
      return;
    }
    
    // Show loading and part 2
    setShowLoading(true);
    setShowParte2(true);
    setShowParte1(false);
    
    try {
      // Fetch available appointments
      const hasAsa = asa.length > 0 ? 'si' : 'no';
      const hasCcr = ccr.length > 0 ? 'si' : 'no';
      const res = await fetch(`/api/turnos/disponibles?doctor=${formData.doctorId}&duracion=${duracion}&tipo=${formData.servicioId}&asa=${hasAsa}&ccr=${hasCcr}`, {
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
    // Hide agenda and show appointment confirmation
    document.getElementById('agenda').style.display = 'none';
    setShowRegistrarTurno(true);
    
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
      fecha = new Date(fecha)
    }
    desde = new Date(ano, mes, dia, turno.hora, turno.min);
    hasta = new Date(ano, mes, dia, turno.hora, turno.min);
    hasta.setMinutes(hasta.getMinutes() + duracion);
    
    // Validate required fields
    if (!formData.nombre || !formData.apellido || !formData.dni) {
      setShowErrorMessage(true);
      setErrorMessage('Error al registrar el turno. Debes completar Nombre, Apellido y DNI');
      return;
    }
    
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
      nombre: formData.nombre,
      apellido: formData.apellido,
      dni: formData.dni,
      celular: formData.celular,
      email: formData.email,
      coberturaMedicaId: formData.coberturaMedicaId,
      observaciones: formData.observaciones,
    };
    setTurno(turnoData);
  };

  // Register appointment
  const handleRegistrarTurno = async () => {
    // Hide buttons
    setShowLoading(true);
    document.getElementById('btnRegistrar').style.display = 'none';
    document.getElementById('btnVolver').style.display = 'none';
    ocultarTodosLosDias();
    // Add observations to turno object
    const updatedTurno = {
      ...turno,
      observaciones: formData.observaciones
    };
    
    try {
      // Reset messages
      setShowSuccessMessage(false);
      setShowErrorMessage(false);
      
      // Register appointment
      const res = await fetch('/api/turnos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-source': 'whatsapp'
        },
        body: JSON.stringify(updatedTurno)
      });
      
      const data = await res.json();
      
      if (data.ok) {
        toast.success('Turno registrado con éxito!');
        setShowSuccessMessage(true);
        limpiarTurno();
        handleVolver(); 
      } else {
        // Show error
        setShowErrorMessage(true);
        setErrorMessage(`Error al registrar el turno. ${data.message}`);
        document.getElementById('btnRegistrar').style.display = 'flex';
        document.getElementById('btnVolver').style.display = 'flex';
      }
      setShowLoading(false);
    } catch (error) {
      console.error('Error al registrar turno:', error);
      setShowErrorMessage(true);
      setErrorMessage('Error de conexión al intentar registrar el turno');
      document.getElementById('btnRegistrar').style.display = 'flex';
      document.getElementById('btnVolver').style.display = 'flex';
    }
  };

  // Cancel existing appointment
  const handleCancelarTurno = async (id) => {
    setShowLoading(true);
    try {
      const res = await fetch(`/api/turnos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 'cancelado' })
      });
      
      const data = await res.json();
      
      if (data.ok) {
        setExistingTurno(null);
      }
    } catch (error) {
      console.error('Error al cancelar turno:', error);
    }
    setShowLoading(false);
  };

  // Función para enviar recordatorio por WhatsApp e EMail
    const enviarRecordatorio = async (turno) => {
        try {        
          console.log('Enviando recordatorio para el turno:', turno);
          let celular = turno.paciente.celular;

          if (celular.length >= 8) {
            try {
              const response = await fetch('/api/mensajeria/whatsapp', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ turno }),
              });
              
              const result = await response.json();
              if (!result.ok) {
                console.error('Error al enviar WhatsApp:', result.error);
              }
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
            }
          } catch (error) {
            console.error('Error al enviar email:', error);
          }
        
          toast.success('Iniciando envío de confirmación');
        } catch (error) {
          console.error('Error al enviar recordatorio:', error);
          toast.error('Error al enviar el recordatorio: ' + (error.message || 'Error desconocido'));
        }
    };

  // Return to part 1
  const handleVolver = () => {
    setShowParte2(false);
    setShowParte1(true);
    setAgenda([]);
    setShowRegistrarTurno(false);
    setShowErrorMessage(false);
    setShowSuccessMessage(false);
  };

    // Cargar datos iniciales
    useEffect(() => {
      const cargarDatosIniciales = async () => {
        try {
          setShowLoading(true);
          const response = await fetch('/api/configuracion', {
            headers: {
              'x-api-source': 'whatsapp'
            },
            cache: 'no-store'
          });
          
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }
          
          const data = await response.json();
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
                validarDoctor(filtrados[0])
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
          }          
          setShowLoading(false);
          if (dniParam) {
            // Actualizar estado y buscar paciente por DNI
            setFormData(prev => ({
              ...prev,
              dni: dniParam
            }));
            buscarPacientePorParam(`?dni=${dniParam}`);
          } else if (celularParam) {
            // Actualizar estado y buscar paciente por celular
            setFormData(prev => ({
              ...prev,
              celular: celularParam
            }));
            buscarPacientePorParam(`?celular=${celularParam}`);
          } else if (pacienteIdParam) {
            buscarPacientePorParam(`/${pacienteIdParam}`);;
          }
        } catch (error) {
          console.error('Error al cargar datos:', error);
          setShowLoading(false);
        }
      };
      
      // Cargar coberturas y datos iniciales
      const inicializarDatos = async () => {
        await cargarCoberturasDisponibles();
        await cargarDatosIniciales();
      };
      
      inicializarDatos();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dniParam, celularParam, pacienteIdParam]);

    useEffect(() => {
      checkAllFieldsComplete();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData]);

    useEffect(() => {

    }, [theme])


  return (
    <div className="min-h-screen ">      <div className="flex justify-evenly items-center p-5 md:p-8  shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <h1 className="text-3xl font-bold">Nuevo Turno</h1>
          <FaCalendarPlus className="text-4xl text-[var(--color-primary)]" />
        </div>
        {configuracion.logoUrl ? (         
          <Image
            src={`${configuracion.logoUrl}`}
            alt={configuracion.nombreConsultorio || "logo del consultorio"}
            width={150}
            height={150}
            className="rounded-lg"
          />

        ) : (
          <Image 
            src="/logo.png" 
            alt="logo por defecto" 
            width={150} 
            height={150} 
            className="rounded-lg"
          />
        )}
      </div>
      {showLoading && (
        <Loader titulo={'Buscando Información ...'}/>
      )}
      <div className="container mx-auto rounded-xl p-5 m-5  shadow-lg md:max-w-3xl">
        {/* Part 1: Doctor and patient selection */}
        {showParte1 && (
          <div className="space-y-6">            <div className="flex flex-wrap items-center gap-4">
              <label htmlFor="doctor" className="font-medium flex items-center gap-2">
                <FaUserMd className="text-[var(--color-primary)]" />
                Doctor:
              </label>
              <select
                id="doctor"
                className={`flex-1 p-2 border border-gray-300 rounded-lg ${theme==='dark' ? 'bg-black text-slate-200' : 'bg-slate-200 text-slate-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                value={formData.doctorId}
                onChange={handleDoctorChange}
              >
                {doctores.length > 1 ? (
                  <>
                    <option value="" disabled>
                      Seleccioná un Doctor
                    </option>
                    {doctores.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.emoji} {doctor.nombre}
                      </option>
                    ))}
                    <option value="Indistinto">✅ Indistinto</option>
                  </>
                ) : (
                  doctores.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.emoji} {doctor.nombre}
                    </option>
                  ))
                )}
              </select>
            </div>

            {showTipoTurno && (              
              <div className="flex flex-wrap items-center gap-4">                
                <label htmlFor="servicio" className="font-medium dark:text-gray-300 flex items-center gap-2">
                  <FaStethoscope className="text-[var(--color-primary)]" />
                  Tipo de Turno:
                </label>
                <select
                  id="servicio"
                  className={`flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme==='dark' ? 'bg-slate-900 text-slate-200' : 'bg-slate-200 text-slate-900'}
                    ${fieldErrors.servicio ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                  value={formData.servicioId}
                  onChange={handleServiceChange}
                >
                  {tipos.filter(tipo => tipo.habilitado).length > 1 ? (
                    <>
                      <option value="">
                        Seleccioná un Tipo de Turno.
                      </option>
                      {tipos.filter(tipo => tipo.habilitado).map((tipo) => (
                        <option key={tipo.nombre} value={tipo.id}>
                          ✅ {tipo.nombre}
                        </option>
                      ))}
                    </>
                  ) : (
                    tipos
                      .filter(tipo => tipo.habilitado)
                      .map((tipo) => (
                        <option key={tipo.nombre} value={tipo.id}>
                          ✅ {tipo.nombre}
                        </option>
                      ))
                  )}
                </select>
              </div>
            )}

            {showDNI && (              <div className="flex flex-wrap items-center gap-4">                
                <label htmlFor="dni" className="font-medium flex items-center gap-2">
                  <FaIdCard className="text-[var(--color-primary)]" />
                  DNI:
                </label>
                <div className="flex-1 flex items-center relative">
                  <input
                    type="number"
                    inputMode="tel"
                    autoComplete='dni'
                    id="dni"
                    className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 min-w-24
                      ${fieldErrors.dni ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                    value={formData.dni}
                    onChange={handleInputChange}
                    onKeyPress={handleDniKeyPress}
                  />
                  <FaSearch className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                </div>
                <button 
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition duration-300" 
                  onClick={validateDni}
                >
                  <FaCheck className="text-lg" />
                  Validar DNI
                </button>
              </div>
            )}
            
            {showLoadingPaciente && (
             <Loader titulo={'Buscando Datos del Paciente ...'}/>
            )}

            {showPacienteForm && dniValidado && !showLoadingPaciente && (              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <label htmlFor="nombre" className="font-medium w-24 flex items-center gap-2">
                    <FaUser className="text-[var(--color-primary)] text-sm" />
                    Nombre:
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    autoComplete='given-name'
                    className={`flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                      ${fieldErrors.nombre ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.nombre}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor="apellido" className="font-medium w-24 flex items-center gap-2">
                    <FaUser className="text-[var(--color-primary)] text-sm" />
                    Apellido:
                  </label>
                  <input
                    type="text"
                    id="apellido"
                    autoComplete='family-name'
                    className={`flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                      ${fieldErrors.apellido ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.apellido}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor="celular" className="font-medium w-24 flex items-center gap-2">
                    <FaMobileAlt className="text-[var(--color-primary)] text-sm" />
                    Celular:
                  </label>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      inputMode="tel"
                      autoComplete='tel'
                      id="celular"
                      className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 
                        ${fieldErrors.celular ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.celular}
                      onChange={handleInputChange}
                    />
                    <FaSearch className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label htmlFor="email" className="font-medium w-24 flex items-center gap-2">
                    <FaEnvelope className="text-[var(--color-primary)] text-sm" />
                    Mail:
                  </label>
                  <input
                    type="text"
                    inputMode="email"
                    autoComplete='email'
                    id="email"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>                <div className="flex items-center gap-3 md:col-span-2">
                  <label htmlFor="coberturaMedicaId" className="font-medium w-32 flex items-center gap-2">
                    <FaShieldAlt className="text-[var(--color-primary)] text-sm" />
                    Cobertura Médica:
                  </label>
                  <select
                    id="coberturaMedicaId"
                    className={`flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme==='dark' ? 'bg-slate-900 text-slate-200' : 'bg-slate-200 text-slate-900'}
                      ${fieldErrors.coberturaMedicaId ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.coberturaMedicaId}
                    onChange={handleInputChange}
                  >
                    <option value="" disabled>Seleccioná una Cobertura</option>
                    {coberturas.map((opcion) => (
                      <option key={opcion.id} value={opcion.id}>
                        {opcion.nombre} ({opcion.codigo})
                      </option>
                    ))}
                  </select>
                </div>
                {!existingTurno && allFieldsComplete && (
                  <div className="md:col-span-2 flex justify-center mt-4">                    <button 
                      className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium py-3 px-6 rounded-lg flex items-center gap-2 transition duration-300" 
                      onClick={handleVerTurnos}
                    >
                      <FaCalendarAlt className="text-xl" />
                      Ver Turnos Disponibles
                    </button>
                  </div>
                )}
                
                {existingTurno && formData && (
                  <div className="md:col-span-2 bg-red-100 border border-red-400 rounded-lg p-4 my-4 shadow-md">                       
                  <div className="flex gap-2 items-center justify-center mb-4 font-bold text-red-800">
                      <FaExclamationTriangle className="text-red-600 text-2xl" />
                      Ya tenés un turno agendado
                      <FaExclamationTriangle className="text-red-600 text-2xl" />
                    </div>
                    
                    <div className="space-y-2 text-center">
                      <p>Para el <span className="font-bold">{formatoFecha(new Date(existingTurno.desde), true, true, false, true)}</span></p>
                      <p>✔️ Paciente: {existingTurno.paciente.nombre || ''} {existingTurno.paciente.apellido || ''}</p>
                      <p>✔️ Tipo: {existingTurno.servicio || ''}</p>
                      <p>✔️ Dr.: {existingTurno.doctor.nombre || ''}
                      </p>
                      
                      <p className="mt-4">¿Querés Cancelarlo para Pedir Uno nuevo ❓</p>
                        <button 
                        onClick={() => handleCancelarTurno(existingTurno.id)} 
                        className="bg-slate-400 hover:bg-slate-500 text-black font-bold py-3 px-6 rounded-lg mt-4 flex items-center gap-2 mx-auto transition duration-300"
                      >
                        <FaTimes className="text-red-500 text-xl" />
                        Cancelar Turno
                        <FaTimes className="text-red-500 text-xl" />
                      </button>
                       <button
                          onClick={() => enviarRecordatorio(existingTurno)}
                          className="bg-slate-400 hover:bg-slate-500 text-black font-bold py-3 px-6 rounded-lg mt-4 flex items-center gap-2 mx-auto transition duration-300"
                          title="Enviar Recordatorios"
                          >
                          <FaBell className="text-green-600" />
                          Re Enviar Recordatorio
                          <FaBell className="text-green-600" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
              {showErrorTurno && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 mt-4">
                <FaExclamationCircle className="text-xl" />
                <span>{errorTurnoMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* Part 2: Available appointments */}
        {showParte2 && (
          <div>            
            <div id="agenda" 
                className={showLoading ? 'hidden' : 'block'}
            >
              {agenda.length === 0 ? (                
                <div className="rounded-lg p-6 text-center">
                  <div className="text-xl font-medium  mb-4">No hay turnos Disponibles en este Momento.</div>
                  <FaSadTear className="text-5xl text-red-300 mx-auto" />
                </div>
              ) : (
                <div className="space-y-4">
                  {agenda.map((dia) => (                    
                    <div key={dia.fecha} className={`border border-[var(--color-primary)] rounded-lg overflow-hidden`}>
                      <div 
                        className={`flex items-center justify-between ${theme==='dark' ? 'bg-[var(--color-primary-dark)]' : 'bg-[var(--color-secondary)]'} px-4 py-3 border-b border-[var(--color-primary)] cursor-pointer`}
                        onClick={() => toggleHorasVisibility(dia.fecha)}
                      >                        <div className="flex items-center gap-2">
                          <FaCalendarDay className="text-[var(--color-primary)]" /> 
                          <span className="font-medium">{dia.diaSemana}</span>
                          <span className="font-bold">{formatoFecha(dia.fecha, false, false, false, false)}</span>
                        </div>
                        <button 
                          className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] focus:outline-none transition-colors"
                        >
                          <FaChevronDown />
                        </button>
                      </div>
                      
                      <div 
                        className={`px-4 py-2  transition-all duration-300 ${expandedDateRows[dia.fecha] ? ' overflow-y-auto' : 'max-h-0 overflow-hidden'}`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
                          {dia.turnos.map((turno, idx) => (
                            <button 
                              key={idx} 
                              className={`flex items-center justify-between gap-3 p-3 ${theme==='dark' ? 'border border-white' : 'bg-orange-100'} hover:bg-orange-200 rounded-lg shadow-lg transition-colors cursor-pointer`}
                              onClick={() => handleSelectTurno(dia.fecha, turno)}
                            >                              <FaClock className="text-[var(--color-primary)] text-lg" />
                              <span className="text-xl font-bold">{zfill(turno.hora, 2)}:{zfill(turno.min, 2)} Hs.</span>
                              <span className="text-sm">{turno.doctor.nombre}</span>
                              <FaCheck className="text-[var(--color-primary)] text-2xl" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-center mt-6">              
              <button 
                onClick={handleVolver} 
                className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaArrowLeft />
                Volver
              </button>
            </div>
            
            {/* Appointment confirmation */}
            {showRegistrarTurno && (
              <div className="mt-6 space-y-4">
                  {turno.desde && (<>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">                      
                      <div className="border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2 ">
                          <FaCalendarDay className="text-[var(--color-primary)]" /> Fecha:
                        </div>
                        <div className=" px-3 py-2 rounded border border-gray-300 font-bold">
                          {formatoFecha(turno.desde, false, false, false, true)}
                        </div>
                      </div>
                      
                      <div className="border border-slate-200  rounded-lg p-3 flex justify-between items-center">                        
                        <div className="flex items-center gap-2 ">
                          <FaClock className="text-[var(--color-primary)]" /> Hora:
                        </div>
                        <div className=" px-3 py-2 rounded border border-gray-300 font-bold text-xl">
                          {formatoFecha(turno.desde, true, false, false, false).substring(formatoFecha(turno.desde, true, true, false, false).indexOf(' ') + 1)}
                        </div>
                      </div>
                      
                      <div className="border border-slate-200  rounded-lg p-3 flex justify-between items-center">                        
                        <div className="flex items-center gap-2 ">
                          <FaUserMd className="text-[var(--color-primary)]" /> Doctor:
                        </div>
                        <div className=" px-3 py-2 rounded border border-gray-300 font-medium">
                          {turno.doctor}
                        </div>
                      </div>
                      
                      <div className="border border-slate-200  rounded-lg p-3 flex justify-between items-center">                        
                        <div className="flex items-center gap-2 ">
                          <FaListAlt className="text-[var(--color-primary)]" /> Tipo Turno:
                        </div>
                        <div className=" px-3 py-2 rounded border border-gray-300 font-medium">
                          {turno.servicio || 'No especificado'}
                        </div>
                      </div>
                      
                      <div className="border border-slate-200  rounded-lg p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2 ">
                          <i className="fa-solid fa-user text-[var(--color-primary)]"></i> Nombre:
                        </div>
                        <div className=" px-3 py-2 rounded border border-gray-300 font-medium">
                          {turno.nombre}
                        </div>
                      </div>
                      
                      <div className="border border-slate-200  rounded-lg p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2 ">
                          <i className="fa-solid fa-user text-[var(--color-primary)]"></i> Apellido:
                        </div>
                        <div className=" px-3 py-2 rounded border border-gray-300 font-medium">
                          {turno.apellido}
                        </div>
                      </div>
                      
                      <div className="border border-slate-200  rounded-lg p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2 ">
                          <i className="fa-solid fa-id-card text-[var(--color-primary)]"></i> DNI:
                        </div>
                        <div className=" px-3 py-2 rounded border border-gray-300 font-medium">
                          {turno.dni}
                        </div>
                      </div>
                      
                      <div className="border border-slate-200  rounded-lg p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2 ">
                          <i className="fa-solid fa-mobile-screen text-[var(--color-primary)]"></i> Celular:
                        </div>
                        <div className=" px-3 py-2 rounded border border-gray-300 font-medium">
                          {turno.celular}
                        </div>
                      </div>
                      
                      <div className="border border-slate-200  rounded-lg p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2 ">
                          <i className="fa-solid fa-envelope text-[var(--color-primary)]"></i> E-Mail:
                        </div>
                        <div className=" px-3 py-2 rounded border border-gray-300 font-medium">
                          {turno.email || 'No especificado'}
                        </div>
                      </div>
                      
                      <div className="border border-slate-200  rounded-lg p-3 flex justify-between items-center">
                        <div className="flex items-center gap-2 ">
                          <i className="fa-solid fa-shield-heart text-[var(--color-primary)]"></i> Cobertura:
                        </div>
                        <div className=" px-3 py-2 rounded border border-gray-300 font-medium">
                          {coberturas.find(c => c.id == turno.coberturaMedicaId)?.nombre || 'No especificada'}
                        </div>
                      </div>
                    </div>
                  </>)}
                
                <div className="mt-4">
                  <label htmlFor="observaciones" className="font-medium  mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-comments text-[var(--color-primary)]"></i>
                    Observaciones:
                  </label>
                  <textarea
                    id="observaciones"
                    className="w-full  rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    value={formData.observaciones}
                    onChange={handleInputChange}
                  />
                </div>
                
                {showSuccessMessage && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3 mt-4">
                    <i className="fa-solid fa-circle-check text-xl"></i>
                    <span>Turno Registrado Con Éxito</span>
                  </div>
                )}
                
                {showErrorMessage && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 mt-4">
                    <i className="fa-solid fa-circle-exclamation text-xl"></i>
                    <span>{errorMessage}</span>
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row justify-center gap-4 mt-6">
                  <button 
                    onClick={handleVolver} 
                    id="btnVolver"
                    className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <i className="fa-solid fa-delete-left"></i>
                    <span>Modificar Turno</span>
                  </button>
                  
                  <button 
                    onClick={handleRegistrarTurno} 
                    id="btnRegistrar" 
                    className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <i className="fa-solid fa-calendar-check"></i>
                    Confirmar Turno
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page({dniParam, celularParam, pacienteIdParam}) {
  return (
      <Suspense fallback={<Loader titulo={'Cargando nuevo turno'}/>}>
        <DisponibilidadPage 
          dniParam={dniParam}
          celularParam={celularParam}
          pacienteIdParam={pacienteIdParam}
        />
      </Suspense>
  );
}
