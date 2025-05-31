'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { formatoFecha, calcularProximosDias } from '@/lib/utils/dateUtils';
import { obtenerEstados } from '@/lib/utils/estadosUtils';
import { obtenerCoberturasDesdeDB } from '@/lib/utils/coberturasUtils';
import { calcularTurnosDisponiblesPorRango } from '@/lib/services/turnos/turnosServiceC';
import GrillaTurnos from '@/components/GrillaTurnos';
import { handleExcelTurnos } from '@/lib/services/excel';
import Loader from '@/components/Loader';
import TurnoNuevo from '@/components/TurnoNuevo';
import TurnoDisponibilidad from '@/components/TurnoDisponibilidadDirecta';
import EventoNuevo from '@/components/EventoNuevo';
import Modal from '@/components/Modal';
import CalendarioTurnos from '@/components/CalendarioTurno';
import CalendarioMensual from '@/components/CalendarioMensual';
import { config } from 'dotenv';

// Memoizar los estados para evitar recálculos en cada renderizado
const estados = obtenerEstados();

export default function TurnosPage() {
  // Ref para rastrear si es la primera renderización
  const isFirstRender = useRef(true);
  const filterTimeoutRef = useRef(null);

  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [diasCalendario, setDiasCalendario] = useState([]);
  const [filtroDoctor, setFiltroDoctor] = useState('todos');
  const [tituloModal, setTituloModal] = useState('');  const [modalTurnoNuevo, setModalTurnoNuevo] = useState(false);
  const [modalTurnoDisponibilidad, setModalTurnoDisponibilidad] = useState(false);
  const [modalEventoNuevo, setModalEventoNuevo] = useState(false);
  const [doctores, setDoctores] = useState([]);
  const [consultorios, setConsultorios] = useState([]);
  const [tiposTurno, setTiposTurno] = useState([]);  const [coberturas, setCoberturas] = useState([]);
  const [configuracion, setConfiguracion] = useState(null);
  const [forzarMostarGrilla, setForzarMostrarGrilla] = useState(false);

  // Estados para filtros de fecha avanzados
  const fechaHoy = new Date();
  const hoy = fechaHoy.getFullYear() + '-' + 
              String(fechaHoy.getMonth() + 1).padStart(2, '0') + '-' + 
              String(fechaHoy.getDate()).padStart(2, '0');
  fechaHoy.setDate(fechaHoy.getDate() + 3);
  const man = fechaHoy.getFullYear() + '-' + 
  String(fechaHoy.getMonth() + 1).padStart(2, '0') + '-' + 
  String(fechaHoy.getDate()).padStart(2, '0');
  
  const [fechaDesde, setFechaDesde] = useState(hoy);
  const [fechaHasta, setFechaHasta] = useState(man);

  // Estado para contadores de turnos por día
  const [turnosPorDia, setTurnosPorDia] = useState({});
  
  // Estado para turnos disponibles por día (burbujas verdes)
  const [turnosDisponiblesPorDia, setTurnosDisponiblesPorDia] = useState({});
  
  // Nuevos estados para filtros adicionales

  const [filtroConsultorio, setFiltroConsultorio] = useState('todos');
  const [filtroTipoTurno, setFiltroTipoTurno] = useState('todos');
  const [filtroPacienteNombre, setFiltroPacienteNombre] = useState('');
  const [filtroPacienteCelular, setFiltroPacienteCelular] = useState('');
  const [filtroPacienteDni, setFiltroPacienteDni] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroCobertura, setFiltroCobertura] = useState('todos');

  const handleModalTurnoNuevo = () => {
    setTituloModal('Nuevo Turno');
    setModalTurnoNuevo(true);
  };
  const handleModalTurnoDisponibilidad = () => {
    setTituloModal('Turno Disponibilidad');
    setModalTurnoDisponibilidad(true);
  };

  const handleModalEventoNuevo = () => {
    setTituloModal('Registrar Nuevo Evento');
    setModalEventoNuevo(true);
  };    // Cerrar modal
  const cerrarModal = () => {
    setModalTurnoNuevo(false);
    setModalTurnoDisponibilidad(false);
    setModalEventoNuevo(false);
  };
  
  // Objeto de filtros memoizado para evitar recálculos innecesarios
  const filtrosActuales = useMemo(() => ({
    doctor: filtroDoctor,
    consultorio: filtroConsultorio,
    tipoTurno: filtroTipoTurno,
    estado: filtroEstado,
    fechaDesde,
    fechaHasta,
    pacienteNombre: filtroPacienteNombre,
    pacienteCelular: filtroPacienteCelular,
    pacienteDni: filtroPacienteDni,
    cobertura: filtroCobertura,
    mostrarFiltrosAvanzados: mostrarFiltros
  }), [filtroDoctor, filtroConsultorio, filtroTipoTurno, filtroEstado, fechaDesde, fechaHasta, filtroPacienteNombre, filtroPacienteCelular, filtroPacienteDni, filtroCobertura, mostrarFiltros]);
  
  // Cargar los contadores de turnos para los días mostrados (memoizado)
  const cargarContadoresTurnos = useCallback(async (dias) => {
    try {
      // Crear fechas para consulta (formato YYYY-MM-DD)
      const fechasParaConsulta = dias.map(dia => 
        dia.fecha.toISOString().split('T')[0]
      );
      
      // Crear un string de fechas separadas por comas
      const fechasString = fechasParaConsulta.join(',');
      
      // Realizar una consulta a la API para obtener contadores de turnos existentes
      const response = await fetch(`/api/turnos/contadores?fechas=${fechasString}&estado=activo`);
      
      if (!response.ok) {
        throw new Error('Error al cargar contadores de turnos');
      }
      
      const data = await response.json();
      
      // Actualizar el estado con los contadores de turnos existentes
      setTurnosPorDia(data.contadores || {});

      // Calcular turnos disponibles usando la nueva función
      if (configuracion && doctores && consultorios && dias.length > 0) {
        try {
          // Obtener turnos existentes para el rango de días
          const fechaDesde = dias[0].fecha;
          const fechaHasta = dias[dias.length - 1].fecha;
          
          // Consultar turnos existentes
          const turnosResponse = await fetch(`/api/turnos?fechaDesde=${fechaDesde.toISOString().split('T')[0]}&fechaHasta=${fechaHasta.toISOString().split('T')[0]}`);
          const turnosData = turnosResponse.ok ? await turnosResponse.json() : { turnos: [] };
          
          // Calcular disponibilidad
          const disponibilidad = calcularTurnosDisponiblesPorRango(
            fechaDesde,
            fechaHasta,
            configuracion,
            doctores,
            consultorios,
            turnosData.turnos || []
          );

         
          // Convertir resultado a formato compatible con el estado
          const disponibilidadPorDia = {};
          disponibilidad.forEach(dia => {
            const fechaFormateada = dia.fecha.toISOString().split('T')[0];
            disponibilidadPorDia[fechaFormateada] = dia.turnosDisponibles;
          });
          
          setTurnosDisponiblesPorDia(disponibilidadPorDia);
        } catch (dispError) {
          console.error('Error al calcular turnos disponibles:', dispError);
          // En caso de error, limpiar los datos disponibles
          setTurnosDisponiblesPorDia({});
        }
      }
    } catch (err) {
      console.error('Error al cargar contadores de turnos:', err);
      // En caso de error, no actualizamos los contadores
    }
  }, [configuracion, doctores, consultorios]);


  // Cargar turnos para una fecha específica y aplicar filtros (memoizado)
  const cargarTurnos = useCallback(async (fecha, usarFiltroAvanzado = false) => {
    try {
      setLoading(true);
      // URL base para la consulta
      let url = '/api/turnos';
      
      // Si estamos usando filtros avanzados, filtrar por rango de fechas
      if (usarFiltroAvanzado || filtrosActuales.mostrarFiltrosAvanzados) {
        url += `?desde=${filtrosActuales.fechaDesde}&hasta=${filtrosActuales.fechaHasta}`;
      } else {
        // Filtro por fecha única
        const fechaStr = formatoFecha(fecha, false, false, true, false);
        url += `?fecha=${fechaStr}`;
      }
      
      // Añadir filtros adicionales
      if (filtrosActuales.doctor !== 'todos') {
        url += `&doctorId=${filtrosActuales.doctor}`;
      }
      
      if (filtrosActuales.consultorio !== 'todos') {
        url += `&consultorioId=${filtrosActuales.consultorio}`;
      }
      
      if (filtrosActuales.tipoTurno !== 'todos') {
        url += `&tipoTurno=${filtrosActuales.tipoTurno}`;
      }
      
      if (filtrosActuales.pacienteNombre.trim()) {
        url += `&nombrePaciente=${encodeURIComponent(filtrosActuales.pacienteNombre.trim())}`;
      }
      
      if (filtrosActuales.pacienteCelular.trim()) {
        url += `&celularPaciente=${encodeURIComponent(filtrosActuales.pacienteCelular.trim())}`;
      }
      
      if (filtrosActuales.pacienteDni.trim()) {
        url += `&dniPaciente=${encodeURIComponent(filtrosActuales.pacienteDni.trim())}`;
      }

      if (filtrosActuales.estado !== 'todos') {
        url += `&estado=${filtrosActuales.estado}`;
      }

      if (filtrosActuales.cobertura !== 'todos') {
        url += `&coberturaId=${filtrosActuales.cobertura}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Error al cargar los turnos');
      }
      
      const data = await response.json();
      setTurnos(data.turnos || []);
    } catch (err) {
      console.error('Error al cargar turnos:', err);
      setError('Error al cargar los turnos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [filtrosActuales]);

  // Cancelar turno
  const cancelarTurno = useCallback(async (turnoId) => {
    if (!confirm('¿Está seguro de cancelar este turno?')) return;
    
    try {
      const response = await fetch(`/api/turnos/${turnoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cancelar turno');
      }
      
      // Actualizar lista de turnos
      await cargarTurnos(fechaSeleccionada, mostrarFiltros);
      // Actualizar contadores para reflejar la cancelación
      cargarContadoresTurnos(diasCalendario);
      toast.success('Turno cancelado correctamente');
      
    } catch (err) {
      console.error('Error al cancelar turno:', err);
      toast.error(`Error: ${err.message}`);
    }
  }, [cargarTurnos, fechaSeleccionada, mostrarFiltros, cargarContadoresTurnos, diasCalendario]);

  // Manejar actualizaciones de turnos desde la grilla
  const handleTurnoActualizado = useCallback((tipo, datos) => {
    if (tipo === 'delete' || tipo === 'update') {
      // Recargar turnos y contadores
      cargarTurnos(fechaSeleccionada, mostrarFiltros);
      cargarContadoresTurnos(diasCalendario);
    }
  }, [cargarTurnos, fechaSeleccionada, mostrarFiltros, cargarContadoresTurnos, diasCalendario]);

   // Cambiar la fecha seleccionada
  const cambiarFecha = useCallback((fecha) => {
    setFechaSeleccionada(fecha);
    cargarTurnos(fecha, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Navegar a días anteriores/siguientes
  const navegarDias = useCallback((direccion) => {
    const nuevaFechaBase = new Date(diasCalendario[0].fecha);
    nuevaFechaBase.setDate(nuevaFechaBase.getDate() + (direccion * 7));
    const nuevosDias = calcularProximosDias(nuevaFechaBase, 7);
    setDiasCalendario(nuevosDias);
    
    // Cargar contadores para los nuevos días
    cargarContadoresTurnos(nuevosDias);
  }, [diasCalendario, cargarContadoresTurnos]);
  
  // Aplicar todos los filtros
  const aplicarFiltros = useCallback(() => {
    // Si estamos mostrando filtros avanzados, usamos el rango de fechas
    cargarTurnos(fechaSeleccionada, mostrarFiltros);
  }, [cargarTurnos, fechaSeleccionada, mostrarFiltros]);
  
  // Limpiar todos los filtros
  const limpiarFiltros = useCallback(() => {
    setFiltroDoctor('todos');
    setFiltroConsultorio('todos');
    setFiltroTipoTurno('todos');
    setFiltroPacienteNombre('');
    setFiltroPacienteCelular('');
    setFiltroPacienteDni('');
    setFiltroEstado('todos');
    setFiltroCobertura('todos');
    
    if (mostrarFiltros) {
      const fechaHoy = new Date();
      const hoy = fechaHoy.getFullYear() + '-' + 
                  String(fechaHoy.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(fechaHoy.getDate()).padStart(2, '0');
      setFechaDesde(hoy);
      setFechaHasta(hoy);
    }
    
    // Limpiar el timeout anterior si existe
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    // Recargar turnos sin filtros después de un breve retraso
    filterTimeoutRef.current = setTimeout(() => {
      cargarTurnos(fechaSeleccionada, mostrarFiltros);
    }, 100);
  }, [cargarTurnos, fechaSeleccionada, mostrarFiltros]);

  // Alternar la visualización de filtros avanzados
  const toggleFiltrosAvanzados = useCallback(() => {
    const nuevoEstado = !mostrarFiltros;
    setMostrarFiltros(nuevoEstado);
    
    // Limpiar el timeout anterior si existe
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    // Al cambiar entre modos de filtro, volvemos a cargar los turnos con el modo apropiado
    filterTimeoutRef.current = setTimeout(() => {
      cargarTurnos(fechaSeleccionada, nuevoEstado);
    }, 300); // Esperar a que termine la animación
  }, [mostrarFiltros, cargarTurnos, fechaSeleccionada]);
 

 // Manejadores de filtros optimizados
  const handleFiltroDoctor = useCallback((value) => {
    setFiltroDoctor(value);
  }, []);
  
  const handleFiltroConsultorio = useCallback((value) => {
    setFiltroConsultorio(value);
  }, []);
  
  const handleFiltroTipoTurno = useCallback((value) => {
    setFiltroTipoTurno(value);
  }, []);
  
  const handleFiltroEstado = useCallback((value) => {
    setFiltroEstado(value);
  }, []);

  const handleFiltroCobertura = useCallback((value) => {
    setFiltroCobertura(value);
  }, []);    
  
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener configuración (doctores, consultorios, tipos de turno)
        const configResponse = await fetch('/api/configuracion');
        if (!configResponse.ok) {
          throw new Error('Error al cargar la configuración');
        }
        const configData = await configResponse.json();
        
        // Asegurarse de que los datos estén disponibles antes de configurar los estados
        if (configData) {
          setDoctores(configData.doctores || []);
          setConsultorios(configData.consultorios || []);
          setConfiguracion(configData);
          
          // Obtener los tipos de turno disponibles (unificados de todos los doctores)
          const tiposUnificados = [];
          if (configData.doctores && Array.isArray(configData.doctores)) {
            configData.doctores.forEach(doctor => {
              if (doctor.tiposTurno && Array.isArray(doctor.tiposTurno)) {
                doctor.tiposTurno.forEach(tipo => {
                  // Evitar duplicados
                  if (!tiposUnificados.find(t => t.nombre === tipo.nombre)) {
                    tiposUnificados.push({
                      id: tipo.id,
                      nombre: tipo.nombre,
                      duracion: tipo.duracion
                    });
                  }
                });
              }
            });
          }
          setTiposTurno(tiposUnificados);
        }

        // Obtener coberturas médicas
        const coberturasData = await obtenerCoberturasDesdeDB();
        setCoberturas(coberturasData || []);
        
        // Calcular los próximos días para el selector de fechas
        const proximos7Dias = calcularProximosDias(new Date(), 7);
        setDiasCalendario(proximos7Dias);

        // Cargar turnos sólo después de tener toda la configuración
        await cargarTurnos(new Date(), false);
        
        // Cargar contadores para los días iniciales
        await cargarContadoresTurnos(proximos7Dias);
        
      } catch (err) {
        console.error('Error al cargar datos iniciales:', err);
        setError('Error al cargar los datos iniciales. Por favor, recargue la página.');
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  
   useEffect(() => {
    // Ignorar el primer renderizado
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Limpiar el timeout anterior si existe
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    // Configurar un nuevo timeout
    filterTimeoutRef.current = setTimeout(() => {
      aplicarFiltros();
    }, 300);
    
    // Cleanup function para limpiar el timeout si el componente se desmonta
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [filtroDoctor, filtroConsultorio, filtroTipoTurno, filtroEstado, filtroCobertura, aplicarFiltros]);
  
  useEffect(() => {
    if (loading || !configuracion || !doctores || !consultorios) return;
    cargarContadoresTurnos(diasCalendario);

  }, [configuracion, doctores, consultorios, loading]);

  // Renderizado condicional para estado de carga
  if (loading && turnos.length === 0) {
    return (
      <Loader titulo={'Cargando Turnos ...'}/>
    );
  }

  return (
    <div className="container mx-auto px-4 mt-4">
      <div 
        className={`col-span-3 mb-2 transition-all duration-300 ${
          mostrarFiltros 
            ? 'h-0 opacity-0 overflow-hidden' 
            : 'h-auto opacity-100'
        }`}
      >
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-6">
          {/* Contenedor flex para mostrar ambas vistas */}
            <div className="flex flex-col lg:flex-row gap-10 items-start justify-center">
              {/* Vista mensual */}
              <div className="w-full lg:w-auto lg:flex-shrink-0">
                  <div className="w-full max-w-md">
                    <CalendarioMensual
                      fechaInicial={fechaSeleccionada}
                      onFechaClick={cambiarFecha}
                    />
                  </div>
              </div>
              <div className="flex flex-col gap-10 w-full lg:w-auto lg:flex-1">
                
                <h1 className="text-2xl font-bold ">Gestión de Turnos</h1>                
                <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                  <button 
                    onClick={handleModalTurnoNuevo} 
                    className="bg-blue-500 hover:bg-blue-600 text-white text-center py-2 px-2 rounded-md transition duration-200 flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-calendar-plus"></i>
                    <i className="fa-solid fa-plus"></i>
                    Turno
                  </button>
                  <button
                    onClick={handleModalTurnoDisponibilidad}
                    className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-center py-2 px-2 rounded-md transition duration-200 flex items-center justify-center gap-2 "
                  >
                    <i className="fa-solid fa-clock"></i>
                    <i className="fa-solid fa-plus"></i>
                    Turno Disponibilidad
                  </button>
                  <button
                    onClick={handleModalEventoNuevo}
                    className="bg-purple-500 hover:bg-purple-600 text-white text-center py-2 px-2 rounded-md transition duration-200 flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-star"></i>
                    <i className="fa-solid fa-plus"></i>
                    Evento
                  </button>
                </div>

                {/* Vista semanal (selector de días existente) */}
                <div className="w-full lg:w-auto lg:flex-1 flex justify-center">
                  <div className="w-full max-w-4xl">
                    <h3 className="text-center text-sm font-medium text-[var(--text-color)] mb-3">
                      <i className="fa-solid fa-calendar-week mr-2"></i>
                      Navegación Semanal
                    </h3>
                    <div className="flex items-center justify-center">
                      <button 
                        onClick={() => navegarDias(-1)}
                        className="text-white bg-slate-500 px-1 min-h-42 md:min-h-20 rounded-l-md"
                      >
                        <i className="fa-solid fa-chevron-left fa-xl"></i>
                      </button>
                      
                      <div className="flex overflow-visible flex-wrap gap-2">                        
                        {diasCalendario.map((dia, index) => {
                          // Obtener fecha formateada para buscar en el objeto de contadores (YYYY-MM-DD)
                          const fechaFormateada = dia.fecha.toISOString().split('T')[0];
                          // Obtener contador para esta fecha (si existe)
                          const contador = turnosPorDia[fechaFormateada] || 0;
                          // Obtener contador de turnos disponibles
                          const contadorDisponibles = turnosDisponiblesPorDia[fechaFormateada] || 0;
                          
                          return (
                            <button
                              key={dia.fecha.toISOString()}
                              onClick={() => cambiarFecha(dia.fecha)}
                              className={`flex-shrink-0 px-4 py-2 pb-0 border relative min-h-20 ${
                                dia.fecha.toDateString() === fechaSeleccionada.toDateString()
                                  ? 'bg-slate-500 text-white border-slate-500 border-x-white'
                                  : 'border-gray-700 hover:bg-gray-50'}
                                
                              `}
                            >
                              <div className="text-xs font-medium">{dia.diaSemanaCorto}</div>
                              <div className="font-bold text-xl">{dia.fecha.getDate()}</div>
                              <div className="font-semibold text-xs p-1">{dia.fecha.toLocaleDateString('es-AR', { month: 'short' }).charAt(0).toUpperCase() + dia.fecha.toLocaleDateString('es-AR', { month: 'short' }).slice(1)}</div>
                                {/* Indicador de turnos agendados (burbuja roja) */}
                              {contador > 0 && (
                                <span 
                                  key={`ocupado-${fechaFormateada}-${contador}`}
                                  className="absolute -top-3 -right-2 bg-red-500 text-white text-sm font-bold rounded-full 
                                    min-w-[24px] h-[24px] flex items-center justify-center p-1 animate-fadeIn"
                                >
                                  {contador}
                                </span>
                              )}
                              
                              {/* Indicador de turnos disponibles (burbuja verde) */}
                              {contadorDisponibles > 0 && (
                                <span 
                                  key={`disponible-${fechaFormateada}-${contadorDisponibles}`}
                                  className="absolute top-4 -right-2 bg-green-500 text-white text-sm font-bold rounded-full 
                                    min-w-[24px] h-[24px] flex items-center justify-center p-1 animate-fadeIn"
                                  title={`${contadorDisponibles} turnos disponibles`}
                                >
                                  {contadorDisponibles}
                                </span>
                              )}
                            </button>                    
                          );
                        })}
                      </div>              
                      <button 
                        onClick={() => navegarDias(1)}
                        className="text-white bg-slate-500 px-1 min-h-42 md:min-h-20 rounded-r-md"
                      >
                        <i className="fa-solid fa-chevron-right fa-xl"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <button
                    onClick={toggleFiltrosAvanzados}
                    className="text-blue-600 hover:text-blue-800 flex items-center focus:outline-none transition-colors border border-blue-500 rounded-md px-4 py-2"
                  >
                    <i className={`fas fa-${mostrarFiltros ? 'minus' : 'plus'} mr-2`}></i>
                    {mostrarFiltros ? 'Ocultar filtros' : 'Mostrar Filtros Avanzados'}
                  </button>
                  
                  <button
                      onClick={() => {
                        cargarTurnos(fechaSeleccionada, mostrarFiltros);
                        cargarContadoresTurnos(diasCalendario);
                      }}
                      className="ml-2 px-3 py-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary-dark)] flex items-center gap-2"
                      title="Actualizar datos de turnos"
                    >
                      <i className="fas fa-sync-alt"></i>
                      <span className="hidden sm:inline">Actualizar</span>
                  </button>
                </div>
              </div>
            </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <div className="shadow rounded-lg px-4">        
        <div
          className={`${
            mostrarFiltros 
              ? 'flex flex-col' 
              : 'hidden'
          }`}
        >
          {/* Botón para mostrar/ocultar filtros avanzados */}
          <div className="flex justify-between items-center gap-4 border-b pb-2 ">
            <button
              onClick={toggleFiltrosAvanzados}
              className="text-blue-600 hover:text-blue-800 flex items-center focus:outline-none transition-colors border border-blue-500 rounded-md px-4 py-2"
            >
              <i className={`fas fa-${mostrarFiltros ? 'minus' : 'plus'} mr-2`}></i>
              {mostrarFiltros ? 'Ocultar filtros' : 'Mostrar Filtros Avanzados'}
            </button>
            
            <button
                onClick={() => {
                  cargarTurnos(fechaSeleccionada, mostrarFiltros);
                  cargarContadoresTurnos(diasCalendario);
                }}
                className="ml-2 px-3 py-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary-dark)] flex items-center gap-2"
                title="Actualizar datos de turnos"
              >
                <i className="fas fa-sync-alt"></i>
                <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
          <div className="flex flex-row items-centerflex-wrap gap-4 p-4">

            {/* Filtros simples  (Doctor y Consultorio) */}
            <div className="">
              <label className="block text-sm font-medium mb-1">Doctor</label>
              <select
                value={filtroDoctor}
                onChange={(e) => handleFiltroDoctor(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los Doctores</option>
                {doctores.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.emoji} {doctor.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="">
              <label className="block text-sm font-medium mb-1">Consultorio</label>
              <select
                value={filtroConsultorio}
                onChange={(e) => handleFiltroConsultorio(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los consultorios</option>
                {consultorios.map((consultorio) => (
                  <option key={consultorio.id} value={consultorio.id}>
                    {consultorio.nombre}
                  </option>
                ))}
              </select>
            </div>            
            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  cargarTurnos(fechaSeleccionada, mostrarFiltros);
                  cargarContadoresTurnos(diasCalendario);
                }}
                className="px-3 py-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary-dark)] flex items-center gap-2"
                title="Actualizar datos de turnos"
              >
                <i className="fas fa-sync-alt"></i>
                <span className="hidden sm:inline">Actualizar</span>
              </button>
              <button
                onClick={() => {
                  handleExcelTurnos(turnos);
                  toast.success('Exportando a Excel...');
                }}
                className="ml-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
                title="Exportar A Excel"
              >
                <i className="fa-solid fa-file-excel"></i>
                <span className="hidden sm:inline">Excel</span>
              </button>
            </div>
          </div>
          
          {/* Filtros avanzados (ocultos por defecto) */}
          <div 
            className={`col-span-3 flex flex-wrap gap-4 overflow-hidden transition-all duration-300 ${
              mostrarFiltros 
                ? 'max-h-[1000px] opacity-100 p-4' 
                : 'max-h-0 opacity-0'
            }`}
          >
            {/* Selectors de fecha desde/hasta */}
            <div>
              <label className="block text-sm font-medium mb-1">Fecha Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Fecha Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Turno</label>
              <select
                value={filtroTipoTurno}
                onChange={(e) => handleFiltroTipoTurno(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los tipos</option>
                {tiposTurno.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre} ({tipo.duracion} min)
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Nombre o Apellido del Paciente</label>
              <input
                type="text"
                value={filtroPacienteNombre}
                onChange={(e) => setFiltroPacienteNombre(e.target.value)}
                placeholder="Escriba para buscar..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">DNI del Paciente</label>
              <input
                type="text"
                value={filtroPacienteDni}
                onChange={(e) => setFiltroPacienteDni(e.target.value)}
                placeholder="DNI sin puntos"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Celular del Paciente</label>
              <input
                type="text"
                value={filtroPacienteCelular}
                onChange={(e) => setFiltroPacienteCelular(e.target.value)}
                placeholder="Celular sin guiones"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Estado del Turno</label>
              <select
                value={filtroEstado}
                onChange={(e) => handleFiltroEstado(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los estados</option>
                {estados.map((estado) => (
                  <option key={estado.id} value={estado.id}>
                    {estado.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cobertura Médica</label>
              <select
                value={filtroCobertura}
                onChange={(e) => handleFiltroCobertura(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todas las coberturas</option>
                {coberturas.map((cobertura) => (
                  <option key={cobertura.id} value={cobertura.id}>
                    {cobertura.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-span-3 flex justify-end space-x-2 mt-4">
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
              >
                <i className="fa-solid fa-eraser"></i> Limpiar Filtros
              </button>
              <button
                onClick={aplicarFiltros}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
              >
                <i className="fa-solid fa-filter"></i> Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>
           
      {/* Listado de turnos */}
      {(mostrarFiltros || forzarMostarGrilla) &&
      <div className="shadow rounded-lg overflow-hidden">
        <GrillaTurnos
          turnos={turnos}
          loading={loading}
          onCancelarTurno={cancelarTurno}
          onTurnoActualizado={handleTurnoActualizado}
        />
      </div>
      }      {!mostrarFiltros && configuracion && doctores && consultorios &&        
      <CalendarioTurnos 
          fecha={fechaSeleccionada}
          turnos={turnos}
          loading={loading}
          setLoading={setLoading}
          configuracion={configuracion}
          doctores={doctores}
          consultorios={consultorios}
          setForzarMostrarGrilla={setForzarMostrarGrilla}
          navegarDias={navegarDias}
          cambiarFecha={cambiarFecha}
        />}       
        {/* Modal para nuevo Turno */}
        <Modal
          isOpen={modalTurnoNuevo || modalTurnoDisponibilidad || modalEventoNuevo}
          onClose={cerrarModal}
          size="large"
          title={tituloModal}
        >
          {modalTurnoNuevo 
          ? <TurnoNuevo onClose={cerrarModal}/>
          : modalTurnoDisponibilidad 
          ? <TurnoDisponibilidad onClose={cerrarModal}/>
          : modalEventoNuevo 
          ? <EventoNuevo 
              doctores={doctores} 
              consultorios={consultorios} 
              onEventoCreado={() => {
                // Recargar turnos después de crear un evento
                cargarTurnos(fechaSeleccionada, mostrarFiltros);
                cargarContadoresTurnos(diasCalendario);
                cerrarModal();
              }}
              onCancelar={cerrarModal}
            />
          : null
          }
        </Modal>       
    </div>    
  );
  
}