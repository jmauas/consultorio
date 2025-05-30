'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { obtenerCoberturasDesdeDB } from '@/lib/utils/coberturasUtils';
import Loader from '@/components/Loader';
import { useTheme } from 'next-themes';
import { formatoFecha, zfill } from '@/lib/utils/dateUtils';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const TurnoNuevo = ({
    desdeParam,
    duracionParam,
    doctorIdParam,
    tipoTurnoIdParam,
    dniParam,
    celularParam,
    pacienteIdParam,
    consultorioIdParam,
    onClose
}) => {
   const { data: session } = useSession();
   const router = useRouter();
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);
   const [success, setSuccess] = useState(false);
   const [doctores, setDoctores] = useState([]);
   const [tiposTurnos, setTiposTurnos] = useState([]);
   const [consultorios, setConsultorios] = useState([]);
   const [tiposTurnosDisponibles, setTiposTurnosDisponibles] = useState([]);
   const [buscandoPaciente, setBuscandoPaciente] = useState(false);
   const [coberturas, setCoberturas] = useState([]);
   const [conflictoHorario, setConflictoHorario] = useState(null);
   const [turnosDisponibles, setTurnosDisponibles] = useState([]);
   const [turnosPaciente, setTurnosPaciente] = useState([]);
   const [turno, setTurno] = useState({
     nombre: '',
     apellido: '',
     dni: '',
     celular: '',
     email: '',
     cobertura: '', 
     coberturaMedicaId: '', 
     servicio: '',
     doctor: '',
     tipoDeTurnoId: '', 
     desde: new Date().toISOString().slice(0, 16), 
     duracion: 30,
     observaciones: '',
     consultorioId: '',
   });

  const { theme, setTheme } = useTheme();
 
   // Búsqueda de paciente por celular desde parámetros de URL
   const buscarPacientePorParam = async (param) => {    
     try {
       setBuscandoPaciente(true);          
       const response = await fetch(`/api/pacientes${param}`, {
         headers: {
           'x-api-source': 'whatsapp'
         }
       });      
       if (!response.ok) {
         throw new Error('Error al buscar paciente');
       }      
       const data = await response.json();      
       if (data.ok && data.pacientes && data.pacientes.length > 0) {
         setPacienteData(data.pacientes[0])
         if (data.pacientes[0].turnos && data.pacientes[0].turnos.length > 0) {
         const proximosTurnos = data.pacientes[0].turnos.filter(turno => {
           const fechaTurno = new Date(turno.desde);
           return fechaTurno > new Date() && turno.estado!== 'cancelado';
         });
         if (proximosTurnos.length > 0) {
          console.log('Proximos turnos', proximosTurnos);
           setTurnosPaciente(proximosTurnos);
         } else {
           setConflictoHorario(null);
         }
       }
      }
       setBuscandoPaciente(false);
     } catch (error) {
       console.error('Error al buscar paciente por celular:', error);
       setBuscandoPaciente(false);
     }
   };
 
   const setPacienteData = (paciente) => {
     setTurno(prev => ({
       ...prev,
       nombre: paciente.nombre || '',
       apellido: paciente.apellido || '',
       dni: paciente.dni || '',
       email: paciente.email || '',
       coberturaMedicaId: paciente.coberturaMedicaId || '', // Nueva relación
       celular: paciente.celular || '',
       observaciones: paciente.observaciones || ''
     }));
   }
 
   // Buscar paciente por DNI
   const buscarPacientePorDNI = async () => {
     if (!turno.dni) {
       setError('Ingrese un DNI para buscar');
       return;
     }
     await buscarPacientePorParam(`?dni=${turno.dni}`);	
   };
 
   // Buscar paciente por celular
   const buscarPacientePorCelular = async () => {
     if (!turno.celular) {
       setError('Ingrese un número de celular para buscar');
       return;
     }
     await buscarPacientePorParam(`?celular=${turno.celular}`);
   };
 
   // Manejar la tecla Enter en el campo DNI
   const handleDniKeyPress = (e) => {
     if (e.key === 'Enter') {
       e.preventDefault();
       buscarPacientePorParam(`?dni=${e.target.value}`);	
     }
   };
 
   // Manejar la tecla Enter en el campo celular
   const handleCelularKeyPress = (e) => {
     if (e.key === 'Enter') {
       e.preventDefault();
       buscarPacientePorParam(`?celular=${e.target.value}`);	
     }
   };
 
   // Verificar conflictos de horario
   const verificarConflictoHorario = async (fechaInicio, fechaFin, consultorioId, doctorId) => {
     try {
       const fechaInicioISO = new Date(fechaInicio).toISOString();
       const fechaFinISO = new Date(fechaFin).toISOString();
       
       const response = await fetch(`/api/turnos/verificar-disponibilidad?desde=${fechaInicioISO}&hasta=${fechaFinISO}&consultorioId=${consultorioId}&doctorId=${doctorId}`);
       
       if (!response.ok) {
         throw new Error('Error al verificar disponibilidad');
       }
       
        const data = await response.json();
        let disp = []
        if (!data.disponible && data.disponibles && data.disponibles.length > 0) {
          disp = data.disponibles[0].turnos
        }

        if (!data.disponible) {
         setConflictoHorario({
           mensaje: 'El horario seleccionado entra en conflicto con otro turno existente',
           detalle: data.turno ? `Turno de ${data.turno.paciente.nombre} ${data.turno.paciente.apellido} (${new Date(data.turno.desde).toLocaleTimeString()} - ${new Date(data.turno.hasta).toLocaleTimeString()})` : 'Hay un turno programado en ese horario'
         });
         setTurnosDisponibles(disp || []);
         return false;
       } else {
         setConflictoHorario(null);
         setTurnosDisponibles([]);
         return true;
       }
     } catch (error) {
       console.error('Error al verificar disponibilidad:', error);
       setError('Error al verificar disponibilidad');
       return false;
     }
   };
 
   // Manejar cambios en el formulario
   const handleChange = async (e) => {
     const { name, value } = e.target;
     
     if (name === 'doctor') {
       // Al cambiar el doctor, filtrar los tipos de turno disponibles
       const doctorSeleccionado = doctores.find(doc => doc.id=== value);
       console.log(value, doctores, 'Doctor seleccionado:', doctorSeleccionado);
       if (doctorSeleccionado && doctorSeleccionado.tiposTurno) {
          const tiposFiltrados = doctorSeleccionado.tiposTurno.filter(tipo => tipo.habilitado !== false);
          setTiposTurnosDisponibles(tiposFiltrados);
         
          // Si hay un solo tipo de turno disponible, seleccionarlo automáticamente
          if (tiposFiltrados.length === 1) {
            const unicoTipo = tiposFiltrados[0];
            setTurno(prev => ({
              ...prev,
              servicio: unicoTiponombre,
              servicioId: unicoTipo.id, 
              tipoDeTurnoId: unicoTipo.id, // Asignar el ID del tipo de turno
              duracion: parseInt(unicoTipo.duracion),
              doctorId: doctorSeleccionado.id, 
              doctor: doctorSeleccionado.nombre,
            }));
            return; // Salimos para evitar limpiar el servicio
          }
       } else {
         setTiposTurnosDisponibles([]);
       }
       
       // Limpiar el servicio seleccionado
       setTurno(prev => ({
         ...prev,
         [name]: value,
         servicio: '',
         tipoDeTurnoId: '', // Limpiar el ID del tipo de turno
         duracion: 30
       }));
     } else if (name === 'servicio') {
       // Actualizar duración según el tipo de turno seleccionado
       if (turno.doctor && tiposTurnosDisponibles.length > 0) {
        const tipoSeleccionado = tiposTurnosDisponibles.find(tipo => tipo.id === value);
         
        setTurno(prev => ({
          ...prev,
          servicio: tipoSeleccionado.nombre,
          servicioId: tipoSeleccionado.id, 
          tipoDeTurnoId: tipoSeleccionado.id, // Asignar el ID del tipo de turno
          duracion: parseInt(tipoSeleccionado.duracion),
        }));
        // Filtrar los consultorios disponibles para el tipo de turno seleccionado
        if (tipoSeleccionado.consultorios && tipoSeleccionado.consultorios.length > 0) {
          setConsultorios(tipoSeleccionado.consultorios);
          if (tipoSeleccionado.consultorios.length === 1) {
            setTurno(prev => ({
              ...prev,
              consultorioId: tipoSeleccionado.consultorios[0].id
            }));
          }
        }
       } else {
         setTurno(prev => ({
           ...prev,
           [name]: value
         }));
       }
     } else if (name === 'desde' || name === 'duracion') {
       // Al cambiar la fecha/hora o duración, verificar conflictos
       const updatedTurno = {
         ...turno,
         [name]: value
       };
       
       setTurno(updatedTurno);
       
       // Verificar conflicto solo si tenemos fecha y duración
       if (updatedTurno.desde) {
         const fechaInicio = new Date(updatedTurno.desde);
         const fechaFin = new Date(fechaInicio);
         fechaFin.setMinutes(fechaFin.getMinutes() + parseInt(updatedTurno.duracion));
         
         // Verificar conflicto de horario
         await verificarConflictoHorario(fechaInicio, fechaFin, turno.consultorioId, turno.doctor);
       }
     } else {
       setTurno(prev => ({
         ...prev,
         [name]: value
       }));
     }
   };
 
   // Enviar formulario
   const handleSubmit = async (e) => {
     e.preventDefault();
     
     // Validaciones básicas
     if (!turno.nombre || !turno.dni || !turno.celular || !turno.servicio || !turno.doctor || !turno.desde || !turno.coberturaMedicaId || !turno.consultorioId) { 
       setError('Completá todos los campos obligatorios');
       return;
     }
     
     try {
       setLoading(true);
       setError(null);
       
       // Calcular fecha de fin basada en la duración
       const fechaInicio = new Date(turno.desde);
       const fechaFin = new Date(fechaInicio);
       fechaFin.setMinutes(fechaFin.getMinutes() + parseInt(turno.duracion));
       
       // Verificar conflicto de horario
       const disponible = await verificarConflictoHorario(fechaInicio, fechaFin, turno.consultorioId, turno.doctor);
       if (!disponible) {
         setLoading(false);
         return;
       }
       
       // Preparar datos para la API
       const doctorSeleccionado = doctores.find(doc => doc.nombre === turno.doctor);
       
       const datosEnvio = {
         ...turno,
         desde: fechaInicio.toISOString(),
         hasta: fechaFin.toISOString(),
         emoji: doctorSeleccionado ? doctorSeleccionado.emoji : '🩺'
       };
       
       // Enviar datos
       const response = await fetch('/api/turnos', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify(datosEnvio),
       });
       
       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || 'Error al crear turno');
       }
       
       // Turno creado exitosamente
       setSuccess(true);
       setTimeout(() => {
          onClose();
       }, 1000); 

       
     } catch (error) {
       console.error('Error:', error);
       setError(error.message);
       setSuccess(false);
     } finally {
       setLoading(false);
     }
   };


  // Cargar datos iniciales
   useEffect(() => {
    const cargarDatos = async () => {
       try {
         setLoading(true);
         // Obtener configuración (doctores y tipos de turnos)
         const response = await fetch('/api/configuracion', {
           headers: {
             'x-api-source': 'whatsapp'
           },
           cache: 'no-store'
         });        
         if (!response.ok) {
           throw new Error(`Error: ${response.status}`);
         }        
        const config = await response.json();
        let doctoresDelUsuario = [];
        if (session?.user) {
            if (session.user.perfil?.id < 50 && session.user.doctores) {
              doctoresDelUsuario = session.user.doctores || [];
              if (doctoresDelUsuario.length === 1) {
               turno.doctor = doctoresDelUsuario[0].id;
              }
            }
          }
         if (Array.isArray(config.doctores) && config.doctores.length > 0) {
          if (doctoresDelUsuario.length > 0) {
            setDoctores(config.doctores.filter(doc => doctoresDelUsuario.some(docUsuario => doc.id === docUsuario.id)));
          } else {
            setDoctores(config.doctores);
          }
         } else {
           console.warn('No se encontraron doctores en la configuración');
           setDoctores([]);
         }

        if (Array.isArray(config.consultorios) && config.consultorios.length > 0) {
           setConsultorios(config.consultorios);
        } else {
           console.warn('No se encontraron Consultorios');
           setConsultorios([]);
        }
         
         setTiposTurnos(config.tiposTurnos || []);
         
         // Obtener coberturas médicas desde la base de datos
         const coberturasDB = await obtenerCoberturasDesdeDB();
         setCoberturas(coberturasDB);         
         // Objeto para acumular cambios al estado del turno
         let turnoUpdates = {};
     
         // Procesar fecha y hora (desde)
         if (desdeParam) {
           try {
             const fecha = new Date(desdeParam);
             if (!isNaN(fecha.getTime())) { // Verificar que es una fecha válida
               // Ajustar a zona horaria local
               const fechaLocal = new Date(fecha.getTime() - (fecha.getTimezoneOffset() * 60000));
               turnoUpdates.desde = fechaLocal.toISOString().slice(0, 16); // Formatear para datetime-local
             }
           } catch (error) {
             console.error("Error procesando fecha desde:", error);
           }
         }
         
         // Procesar duración
         if (duracionParam) {
           const duracion = parseInt(duracionParam, 10);
           if (!isNaN(duracion)) {
             turnoUpdates.duracion = duracion;
           }
         }
         
         // Procesar doctor
         if (doctorIdParam && config.doctores) {
           turnoUpdates.doctor = doctorIdParam;
           
           // Buscar y cargar los tipos de turno disponibles para este doctor
           const doctorSeleccionado = config.doctores.find(doc => doc.id === doctorIdParam);
           if (doctorSeleccionado && doctorSeleccionado.tiposTurno) {
             const tiposFiltrados = doctorSeleccionado.tiposTurno.filter(tipo => tipo.habilitado !== false);
             setTiposTurnosDisponibles(tiposFiltrados);
             
             // Si también tenemos el tipo de turno en los parámetros, completar ese campo
             if (tipoTurnoIdParam) {
               const tipoTurno = tiposFiltrados.find(tipo => tipo.id === tipoTurnoIdParam);
               if (tipoTurno) {
                 turnoUpdates.tipoDeTurnoId = tipoTurnoIdParam;
                 turnoUpdates.servicio = tipoTurnoIdParam;
                 
                 // Si no se especificó duración en la URL, usar la del tipo de turno
                 if (!duracionParam) {
                   turnoUpdates.duracion = parseInt(tipoTurno.duracion, 10);
                 }
               }
             }
           }
         }

         // Procesar consultorio
          if (consultorioIdParam) {
            const consultorioSeleccionado = config.consultorios.find(consultorio => consultorio.id === consultorioIdParam);
            if (consultorioSeleccionado) {
              turnoUpdates.consultorioId = consultorioIdParam;
            }
          }
         
         // Aplicar todas las actualizaciones al estado del turno
         if (Object.keys(turnoUpdates).length > 0) {
           setTurno(prev => ({
             ...prev,
             ...turnoUpdates
           }));
         }
         if (dniParam) {
           // Actualizar estado y buscar paciente por DNI
           setTurno(prev => ({
             ...prev,
             dni: dniParam
           }));
           await buscarPacientePorParam(`?dni=${dniParam}`);
         } else if (celularParam) {
           // Actualizar estado y buscar paciente por celular
           setTurno(prev => ({
             ...prev,
             celular: celularParam
           }));
           await buscarPacientePorParam(`?celular=${celularParam}`);	
         } else if (pacienteIdParam) {
           await buscarPacientePorParam(`/${pacienteIdParam}`);	
         }
         
         setLoading(false);
       } catch (error) {
         console.error('Error al cargar datos:', error);
         setError('Error al cargar configuración');
         setLoading(false);
       }
     };
 
     cargarDatos();
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [desdeParam,
    duracionParam,
    doctorIdParam,
    tipoTurnoIdParam,
    dniParam,
    celularParam,
    pacienteIdParam,
    session,
  ]);

  return (
   <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Nuevo Turno</h1>

        {/* Mensaje de éxito */}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
            <p><i className="fas fa-check-circle mr-2"></i> Turno Creado Exitosamente</p>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p><i className="fas fa-exclamation-circle mr-2"></i> {error}</p>
          </div>
        )}

        {/* Alerta de conflicto de horario */}
        {conflictoHorario && (
          <div className="bg-red-200 border-l-4 border-red-500 text-red-800 p-4 mb-6 font-bold rounded-lg">
            <p className="font-medium"><i className="fas fa-calendar-times mr-2"></i> {conflictoHorario.mensaje}</p>
            {conflictoHorario.detalle && <p className="text-sm mt-1">{conflictoHorario.detalle}</p>}
          </div>
        )}
       
        <form onSubmit={handleSubmit} className="shadow-md rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <h2 className="text-lg font-medium md:col-span-2">Datos del Paciente</h2>
            
            {/* DNI con búsqueda */}
            <div className="md:col-span-2 flex items-end space-x-2">
              <div className="flex-grow">
                <label className="block text-sm font-medium mb-1">DNI *</label>
                <input
                  type="number"
                  inputMode="tel"
                  autoComplete="off"
                  name="dni"
                  value={turno.dni}
                  onChange={handleChange}
                  onKeyPress={handleDniKeyPress}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Ingrese DNI"
                />
              </div>
              <button
                type="button"
                onClick={buscarPacientePorDNI}
                disabled={buscandoPaciente || !turno.dni}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:bg-gray-300"
              >
                {buscandoPaciente ? <><i className="fas fa-spinner fa-spin mr-2"></i>Buscando...</> : <><i className="fas fa-search mr-2"></i>Buscar por DNI</>}
              </button>
            </div>
            
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium  mb-1">Nombre *</label>
              <input
                type="text"
                name="nombre"
                autoComplete="off"
                value={turno.nombre}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Nombre"
              />
            </div>
            
            {/* Apellido */}
            <div>
              <label className="block text-sm font-medium  mb-1">Apellido</label>
              <input
                type="text"
                name="apellido"
                autoComplete="off"
                value={turno.apellido}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Apellido"
              />
            </div>
            
            {/* Celular con búsqueda */}
            <div className="md:col-span-2 flex items-end space-x-2">
              <div className="flex-grow">
                <label className="block text-sm font-medium  mb-1">Celular *</label>
                <input
                  type="number"
                  inputMode="tel"
                  autoComplete="off"
                  name="celular"
                  value={turno.celular}
                  onChange={handleChange}
                  onKeyPress={handleCelularKeyPress}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Ej: 549123456789"
                />
              </div>
              <button
                type="button"
                onClick={buscarPacientePorCelular}
                disabled={buscandoPaciente || !turno.celular}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded disabled:bg-gray-300"
              >
                {buscandoPaciente ? <><i className="fas fa-spinner fa-spin mr-2"></i>Buscando...</> : <><i className="fas fa-mobile-alt mr-2"></i>Buscar por Celular</>}
              </button>
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium  mb-1">Email</label>
              <input
                type="text"
                inputMode="email"
                autoComplete="off"
                name="email"
                value={turno.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Email"
              />
            </div>
            
            {/* Cobertura Médica (Select) utilizando la nueva tabla */}
            <div>
              <label className="block text-sm font-medium  dark:text-gray-300 mb-1">Cobertura Médica *</label>
              <select
                name="coberturaMedicaId"
                value={turno.coberturaMedicaId}
                onChange={handleChange}
                className={`px-3 py-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme==='light' ? 'bg-slate-200 text-slate-900' : 'bg-slate-900 text-slate-200'}`}
              >
                <option value="">Seleccione cobertura</option>
                {coberturas.map((cob) => (
                  <option key={cob.id} value={cob.id}>
                    {cob.nombre}
                    {cob.codigo ? ` (${cob.codigo})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {
            turnosPaciente.length > 0 && (
              <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
                <p className="font-medium"><i className="fas fa-calendar-check mr-2"></i> Turnos Próximos del Paciente:</p>
                <div className="p-2 m-4 flex flex-wrap gap-3">
                  {turnosPaciente.map((t, i) => (
                    <div className="grid grid-cols-12 border rounded-md p-4 items-center" key={i}>
                      <i className="fas fa-calendar-check text-blue-500 fa-2xl col-span-2"></i>
                      <div className="font-bold p-2 col-span-10 flex flex-col" key={i}>                      
                        <span>{t.consultorio.nombre}</span>
                        <span>{formatoFecha(t.desde, true, false, false, true, false, false)}</span>
                        <span>{t.servicio}</span>
                        <span>{t.duracion} min</span>
                        <span>{t.doctor.nombre} {t.doctor.apellido}</span>
                        <Link 
                          href={`/turnos/${t.id}`} 
                          target='_blank'
                          className="text-blue-500 text-sm p-3 rounded-md flex items-center bg-blue-200 border border-blue-500 hover:bg-blue-500 hover:text-white">
                            <i className="fas fa-eye mr-2"></i> 
                            Ver Detalle
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) 
          }
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <h2 className="text-lg font-medium md:col-span-2 dark:text-gray-200">Datos del Turno</h2>
            
            {/* Doctor - Primero */}
            <div>
              <label className="block text-sm font-medium  dark:text-gray-300 mb-1">Doctor *</label>
              <select
                name="doctor"
                value={turno.doctor}
                onChange={handleChange}
                className={`px-3 py-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme==='light' ? 'bg-slate-200 text-slate-900' : 'bg-slate-900 text-slate-200'}`}
              >
                {doctores.length > 1 && (<option value="">Seleccione doctor</option>)}
                {doctores.map((doctor) => (
                  <option key={doctor.nombre} value={doctor.id}>
                    {doctor.emoji} {doctor.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Consultorios */}
            <div>
              <label className="block text-sm font-medium  mb-1">Consultorio *</label>
              <select
                name="consultorioId"
                value={turno.consultorioId}
                onChange={handleChange}
                className={`px-3 py-2 w-full border font-bold rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme==='light' ? 'bg-slate-200 text-slate-900' : 'bg-slate-900 text-slate-200'}`}
                disabled={!turno.doctor}
              >
                <option value="">Seleccioná Consultorio</option>
                {consultorios.map((tipo) => (
                  <option key={tipo.nombre} value={tipo.id}>
                    {tipo.nombre} 
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de turno - Segundo */}
            <div>
              <label className="block text-sm font-medium  dark:text-gray-300 mb-1">Tipo de turno *</label>
              <select
                name="servicio"
                value={turno.tipoDeTurnoId}
                onChange={handleChange}
                className={`px-3 py-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme==='light' ? 'bg-slate-200 text-slate-900' : 'bg-slate-900 text-slate-200'}`}
                disabled={!turno.doctor}
              >
                <option value="">Seleccione tipo de turno</option>
                {tiposTurnosDisponibles.map((tipo) => (
                  <option key={tipo.nombre} value={tipo.id}>
                    {tipo.nombre} ({tipo.duracion} min)
                  </option>
                ))}
              </select>
            </div>
            
            
            {/* Duración */}
            <div>
              <label className="block text-sm font-medium  mb-1">Duración (minutos)</label>
              <input
                type="number"
                name="duracion"
                value={turno.duracion}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-lg"
              />
            </div>
            
            {/* Fecha y hora */}
            <div>
              <label className="block text-sm font-medium  mb-1">Fecha y hora *</label>
              <input
                type="datetime-local"
                name="desde"
                value={turno.desde}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-lg font-bold"
              />
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium  mb-1">Observaciones</label>
              <textarea
                name="observaciones"
                value={turno.observaciones}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows="3"
                placeholder="Observaciones adicionales"
              ></textarea>
            </div>
          </div>

           {/* Mensaje de éxito */}
          {success && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
              <p><i className="fas fa-check-circle mr-2"></i> Turno Creado Exitosamente</p>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              <p><i className="fas fa-exclamation-circle mr-2"></i> {error}</p>
            </div>
          )}
          
          {/* Alerta de conflicto de horario */}
          {conflictoHorario && (
            <div className="bg-red-200 border-l-4 border-red-500 text-red-800 p-4 mb-6 font-bold rounded-lg">
              <p className="font-medium">{conflictoHorario.mensaje}</p>
              {conflictoHorario.detalle && <p className="text-sm mt-1">{conflictoHorario.detalle}</p>}
            </div>
          )}

           {/* Detalle de Turnos Alternativos Disponibles */}
          {turnosDisponibles && turnosDisponibles.length > 0 && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
              <p className="font-medium"><i className="fas fa-calendar-check mr-2"></i> Turnos Alternativos del Día Disponibles:</p>
              <div className="p-2 m-4 flex flex-wrap gap-3">
                {turnosDisponibles.map((t, i) => (
                  <div
                    key={`${t.consultorioId}-${i}`} 
                    className="text-lg font-bold p-2 border rounded-md w-26 text-center cursor-pointer hover:bg-yellow-200"
                    onClick={() => {
                      const slotDateTime = new Date(turno.desde);
                      // Extract hour and minute from the clicked slot
                      const slotHour = parseInt(t.hora);
                      const slotMinute = parseInt(t.min);
                      
                      // Set the current date but with the new hour and minute
                      slotDateTime.setHours(slotHour, slotMinute, 0, 0);
                      slotDateTime.setHours(slotDateTime.getHours() - 3);
                      
                      setTurno(prev => ({
                        ...prev,
                        desde: slotDateTime.toISOString().slice(0, 16),
                      }));

                      const fechaInicio = new Date(slotDateTime);
                      const fechaFin = new Date(fechaInicio);
                      fechaFin.setMinutes(fechaFin.getMinutes() + parseInt(turno.duracion));                      
                      verificarConflictoHorario(fechaInicio, fechaFin, turno.consultorioId, turno.doctor);                      
                    }}
                  >
                    {zfill(t.hora, 2)}:{zfill(t.min, 2)} <i className="fas fa-clock ml-2"></i>
                  </div>
                ))}
              </div>
            </div>        
          )}
          
          {error && (
          <div className="bg-red-200 border-l-4 border-red-500 text-red-800 p-4 mb-6 font-bold rounded-lg">
            <p className="font-medium">{error}</p>
            <p className="text-sm mt-1"></p>
          </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => onClose()}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
            >
              <i className="fas fa-times mr-2"></i>Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:bg-blue-300"
            >
              {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i>Guardando...</> : <><i className="fas fa-save mr-2"></i>Guardar Turno</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Page({ 
    desdeParam,
    duracionParam,
    doctorIdParam,
    tipoTurnoIdParam,
    dniParam,
    celularParam,
    pacienteIdParam,
    consultorioIdParam,
    onClose
  }) {
  return (
    <Suspense fallback={<Loader titulo={'Cargando nuevo turno'}/>}>
      <TurnoNuevo 
        desdeParam={desdeParam}
        duracionParam={duracionParam}
        doctorIdParam={doctorIdParam}
        tipoTurnoIdParam={tipoTurnoIdParam}
        dniParam={dniParam}
        celularParam={celularParam}
        pacienteIdParam={pacienteIdParam}
        consultorioIdParam={consultorioIdParam}
        onClose={onClose}
      />
    </Suspense>
  );
}
