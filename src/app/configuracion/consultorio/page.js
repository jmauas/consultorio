'use client';

import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import toast from 'react-hot-toast';
import { obtenerCoberturasDesdeDB } from '@/lib/utils/coberturasUtils';
import Loader from '@/components/Loader';
import { useTheme } from 'next-themes';

// Importar los componentes de pestañas
import CoberturasTab from '@/components/consultorioTabs/CoberturasTab';
import ConsultoriosTab from '@/components/consultorioTabs/ConsultoriosTab';
import DoctoresTab from '@/components/consultorioTabs/DoctoresTab';
import HorariosTab from '@/components/consultorioTabs/HorariosTab';
import FeriadosTab from '@/components/consultorioTabs/FeriadosTab';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ConsultorioPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    doctores: [],
    feriados: [],
    duracionTurno: 30,
    horariosAtencion: {
      lunes: { activo: true, inicio: '09:00', fin: '18:00' },
      martes: { activo: true, inicio: '09:00', fin: '18:00' },
      miercoles: { activo: true, inicio: '09:00', fin: '18:00' },
      jueves: { activo: true, inicio: '09:00', fin: '18:00' },
      viernes: { activo: true, inicio: '09:00', fin: '18:00' },
      sabado: { activo: false, inicio: '09:00', fin: '13:00' },
      domingo: { activo: false, inicio: '00:00', fin: '00:00' }
    }
  });

  const [nuevoDoctor, setNuevoDoctor] = useState({
    nombre: '',
    emoji: '👨‍⚕️',
    feriados: [],
    color: '#000000',
  });
  
  const [nuevoFeriadoDoctor, setNuevoFeriadoDoctor] = useState({
    fechaDesde: '',
    fechaHasta: ''
  });

  const [nuevoFeriado, setNuevoFeriado] = useState({
    fechaDesde: '',
    fechaHasta: ''
  });

  const [guardando, setGuardando] = useState(false);

  const [consultorios, setConsultorios] = useState([]);
  const [nuevoConsultorio, setNuevoConsultorio] = useState({ nombre: '' });

  const [selectedDoctorForAgenda, setSelectedDoctorForAgenda] = useState(null);
  const [selectedConsultorioForAgenda, setSelectedConsultorioForAgenda] = useState(null);
  const [horarioConflictos, setHorarioConflictos] = useState([]);

  const [coberturas, setCoberturas] = useState([]);
  const [nuevaCobertura, setNuevaCobertura] = useState({ nombre: '', habilitado: true });

  const detectarConflictosHorarios = (doctorId, consultorioId) => {
    // Si no hay doctor o consultorio seleccionados, no hay conflictos que detectar
    if (!doctorId || !consultorioId) return [];
    
    const conflictos = [];
    const doctorSeleccionado = config.doctores.find(d => d.id === doctorId);
    
    if (!doctorSeleccionado || !doctorSeleccionado.agenda) return [];
    
    // Obtener los horarios del doctor para el consultorio seleccionado
    const horariosConsultorioSeleccionado = doctorSeleccionado.agenda.filter(
      a => a.consultorioId === consultorioId && a.atencion
    );
    
    // 1. Verificar conflictos del mismo doctor con otros consultorios
    doctorSeleccionado.agenda
      .filter(a => a.consultorioId !== consultorioId && a.atencion) // Otros consultorios donde atiende
      .forEach(otroHorario => {
        // Para cada día de la semana que este doctor atiende en el consultorio seleccionado
        horariosConsultorioSeleccionado.forEach(horarioActual => {
          // Solo comparar si es el mismo día de la semana
          if (horarioActual.dia === otroHorario.dia) {
            const consultorioConflicto = consultorios.find(c => c.id === otroHorario.consultorioId);
            const nombreConsultorioConflicto = consultorioConflicto?.nombre || 'Otro consultorio';
            const nombreDia = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'feriado'][horarioActual.dia === 9 ? 7 : horarioActual.dia] || '';
            
            // Verificar si hay solapamiento de horarios
            const horaInicioActual = parseFloat(horarioActual.desde.replace(':', '.'));
            const horaFinActual = parseFloat(horarioActual.hasta.replace(':', '.'));
            const horaInicioOtro = parseFloat(otroHorario.desde.replace(':', '.'));
            const horaFinOtro = parseFloat(otroHorario.hasta.replace(':', '.'));
            
            // Si hay solapamiento
            if ((horaInicioActual < horaFinOtro && horaFinActual > horaInicioOtro)) {
              conflictos.push({
                tipo: 'doctor-otro-consultorio',
                dia: nombreDia,
                consultorio: nombreConsultorioConflicto,
                mensaje: `El día ${nombreDia}, el doctor atiende en ${nombreConsultorioConflicto} de ${otroHorario.desde} a ${otroHorario.hasta}, lo que se solapa con el horario en este consultorio.`
              });
            }
          }
        });
      });
    
    // 2. Verificar conflictos de otros doctores en el mismo consultorio
    config.doctores
      .filter(d => d.id !== doctorId) // Otros doctores
      .forEach(otroDoctor => {
        const horariosOtroDoctor = otroDoctor.agenda?.filter(
          a => a.consultorioId === consultorioId && a.atencion
        ) || [];
        
        // Para cada día que el doctor seleccionado atiende en el consultorio seleccionado
        horariosConsultorioSeleccionado.forEach(horarioActual => {
          // Buscar horarios de otros doctores para el mismo día
          horariosOtroDoctor.forEach(horarioOtroDoctor => {
            if (horarioActual.dia === horarioOtroDoctor.dia) {
              const nombreDia = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'feriado'][horarioActual.dia === 9 ? 7 : horarioActual.dia] || '';
              
              // Verificar si hay solapamiento de horarios
              const horaInicioActual = parseFloat(horarioActual.desde.replace(':', '.'));
              const horaFinActual = parseFloat(horarioActual.hasta.replace(':', '.'));
              const horaInicioOtro = parseFloat(horarioOtroDoctor.desde.replace(':', '.'));
              const horaFinOtro = parseFloat(horarioOtroDoctor.hasta.replace(':', '.'));
              
              // Si hay solapamiento
              if ((horaInicioActual < horaFinOtro && horaFinActual > horaInicioOtro)) {
                conflictos.push({
                  tipo: 'otro-doctor-mismo-consultorio',
                  dia: nombreDia,
                  doctor: otroDoctor.nombre,
                  mensaje: `El día ${nombreDia}, el doctor ${otroDoctor.nombre} también atiende en este consultorio de ${horarioOtroDoctor.desde} a ${horarioOtroDoctor.hasta}, lo que se solapa con el horario configurado.`
                });
              }
            }
          });
        });
      });
    
    return conflictos;
  };

  const handleGuardarConfiguracion = async () => {
    try {
      setGuardando(true);
      
      const rspa = await fetch('/api/configuracion/empresa')
      const data = await rspa.json();
      const configActual = data.config;
      console.log(config.doctores)
      const doctoresParaGuardar = config.doctores.map(doctor => {
        // Ensure each doctor has agenda items for all days in each consultorio
        const agendaCompleta = [];
        
        if (doctor.agenda && Array.isArray(doctor.agenda)) {
          // Get all unique consultorio IDs
          const consultorioIds = [...new Set(doctor.agenda.map(a => a.consultorioId))];
          
          // For each consultorio, ensure all days are registered
          consultorioIds.forEach(consultorioId => {
            // Day codes: 0-6 for days of week, 9 for feriado
            const dayCodes = [1, 2, 3, 4, 5, 6, 0, 9];
            const dayNames = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo', 'feriado'];
            
            dayCodes.forEach((dayCode, index) => {
              // Check if this day+consultorio combination already exists
              const existingDay = doctor.agenda.find(a => 
                a.dia === dayCode && 
                a.consultorioId === consultorioId
              );
              
              if (existingDay) {
                // If exists, use it
                agendaCompleta.push(existingDay);
              } else {
                // If doesn't exist, create it with default values
                agendaCompleta.push({
                  dia: dayCode,
                  nombre: dayNames[index],
                  atencion: false,
                  desde: "09:00",
                  hasta: "18:00",
                  corteDesde: "",
                  corteHasta: "",
                  consultorioId: consultorioId,
                  fecha: null,
                });
              }
            });
          });
          // AGREGO AGENDA POR FECHAS
          doctor.agenda.forEach(a => { 
            if (a.dia === 99) {
              agendaCompleta.push(a);
            }
          });
        }
        
        const tiposTurnoFinal = doctor.tiposTurno && Array.isArray(doctor.tiposTurno)
          ? doctor.tiposTurno.map(tt => ({...tt}))
          : [];
            
        return {
          id: doctor.id,
          nombre: doctor.nombre,
          emoji: doctor.emoji || '👨‍⚕️',
          color: doctor.color || '#000000',
          feriados: doctor.feriados || [],
          especialidad: doctor.especialidad,
          email: doctor.email,
          telefono: doctor.telefono,
          agenda: agendaCompleta.length > 0 ? agendaCompleta : doctor.agenda,
          tiposTurno: tiposTurnoFinal
        };
      });
      
      const feriadosParaGuardar = config.feriados.map(feriado => feriado.fecha);
      
        const configActualizada = {
        ...configActual,
        doctores: doctoresParaGuardar,
        feriados: feriadosParaGuardar,
        duracionTurno: config.duracionTurno,
      };
      
      // Enviar datos al endpoint /api/configuracion
      const response = await fetch('/api/configuracion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configActualizada)
      });

      const result = await response.json();
      
      if (result.ok) {
        toast.success('Configuración guardada correctamente');
      } else {
        throw new Error(result.message || 'Error al guardar la configuración');
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      toast.error('Error al guardar la configuración: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  useEffect(() => {
    async function cargarConfiguracion() {
      try {
        setLoading(true);
        const rspa = await fetch('/api/configuracion/empresa')
        const data = await rspa.json();
        const configData = data.config;
        
        let doctoresData = { doctores: [] };
        try {
          const doctoresResponse = await fetch('/api/configuracion/doctores');
          if (!doctoresResponse.ok) {
            throw new Error(`Error en doctores: ${doctoresResponse.status} ${doctoresResponse.statusText}`);
          }
          const contentType = doctoresResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('La respuesta de doctores no es JSON válido');
          }
          doctoresData = await doctoresResponse.json();
        } catch (error) {
          console.error('Error al cargar doctores:', error);
          toast.error(`Error al cargar doctores: ${error.message}`);
        }
        
        let consultoriosData = { consultorios: [] };
        try {
          const consultoriosResponse = await fetch('/api/configuracion/consultorios');
          if (!consultoriosResponse.ok) {
            throw new Error(`Error en consultorios: ${consultoriosResponse.status} ${consultoriosResponse.statusText}`);
          }
          const contentType = consultoriosResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('La respuesta de consultorios no es JSON válido');
          }
          consultoriosData = await consultoriosResponse.json();
          setConsultorios(consultoriosData.consultorios || []);
        } catch (error) {
          console.error('Error al cargar consultorios:', error);
          toast.error(`Error al cargar consultorios: ${error.message}`);
        }

        // Cargar coberturas médicas
        try {
          const coberturasData = await obtenerCoberturasDesdeDB();
          setCoberturas(coberturasData);
        } catch (error) {
          console.error('Error al cargar coberturas médicas:', error);
          toast.error(`Error al cargar coberturas: ${error.message}`);
        }
        
        if (configData) {
          const feriadosProcesados = Array.isArray(configData.feriados) 
            ? configData.feriados.map(feriado => ({
                id: `feriado-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                fecha: feriado
              }))
            : [];

          const doctoresProcesados = Array.isArray(doctoresData.doctores) 
            ? doctoresData.doctores.map(doctor => {
                const diasAtencion = {
                  lunes: false, martes: false, miercoles: false, 
                  jueves: false, viernes: false, sabado: false, domingo: false
                };
                
                if (Array.isArray(doctor.agenda)) {
                  doctor.agenda.forEach(ag => {
                    const nombreDia = [
                      'domingo', 'lunes', 'martes', 'miercoles', 
                      'jueves', 'viernes', 'sabado'
                    ][ag.dia] || '';
                    
                    if (nombreDia && ag.atencion) {
                      diasAtencion[nombreDia] = true;
                    }
                  });
                }
                
                // Procesar los tipos de turno para incluir los IDs de consultorios
                const tiposTurnoProcesados = Array.isArray(doctor.tiposTurno)
                  ? doctor.tiposTurno.map(tipo => {
                      // Asegurarse que cada tipo tenga el array de IDs de consultorios
                      return {
                        ...tipo,
                      };
                    })
                  : [];

                return {
                  id: doctor.id,
                  nombre: doctor.nombre,
                  emoji: doctor.emoji,
                  color: doctor.color || '#000000',
                  especialidad: doctor.especialidad || '',
                  email: doctor.email || '',
                  telefono: doctor.telefono || '',
                  diasAtencion: diasAtencion,
                  agenda: doctor.agenda || [],
                  tiposTurno: tiposTurnoProcesados,
                  feriados: doctor.feriados || [],
                };
              })
            : [];

          setConfig({           
            doctores: doctoresProcesados,
            feriados: feriadosProcesados,
            duracionTurno: configData.duracionTurno || 30,
          });
        }
      } catch (error) {
        console.error('Error al cargar configuración del consultorio:', error);
        toast.error('Error al cargar la configuración');
      } finally {
        setLoading(false);
      }
    }

    cargarConfiguracion();
  }, []);
 
  useEffect(() => {
    const revisarConflictos = async () => {
      const conflic = []
      if (!config.doctores || !consultorios) return;
      if (consultorios.length === 0) return;
      if (config.doctores.length === 0) return;
      for await (let d of config.doctores) {
        for await (let c of consultorios) {
          const conflictos = detectarConflictosHorarios(d.id, c.id);
          if (conflictos.length > 0) {
            conflic.push(...conflictos);
          }        
        };
      };
      setHorarioConflictos(conflic);
    }    
    revisarConflictos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.doctores, selectedDoctorForAgenda, consultorios]);

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Configuración del Consultorio</h2>

      {loading && (
       <Loader titulo={''}/>
      )}

      {!loading && (
        <>
          <Tab.Group>
            <Tab.List className="flex rounded-xl p-1 mb-6">
              <Tab
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-offset-2 ring-offset-[var(--color-primary)] focus:outline-none focus:ring-2',
                    selected
                      ? 'shadow text-[var(--color-primary)]'
                      : 'hover:text-[var(--color-primary)]or-primary)]'
                  )
                }
              >
                Coberturas Médicas
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-offset-2 ring-offset-[var(--color-primary)] focus:outline-none focus:ring-2',
                    selected
                      ? 'shadow text-[var(--color-primary)]'
                      : 'hover:text-[var(--color-primary)]'
                  )
                }
              >
                Consultorios
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-offset-2 ring-offset-[var(--color-primary)] focus:outline-none focus:ring-2',
                    selected
                      ? 'shadow text-[var(--color-primary)]'
                      : 'hover:text-[var(--color-primary)]'
                  )
                }
              >
                Doctores
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-offset-2 ring-offset-[var(--color-primary)] focus:outline-none focus:ring-2',
                    selected
                      ? 'shadow text-[var(--color-primary)]'
                      : 'hover:text-[var(--color-primary)]'
                  )
                }
              >
                Horarios
              </Tab>
              <Tab
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-offset-2 ring-offset-[var(--color-primary)] focus:outline-none focus:ring-2',
                    selected
                      ? 'shadow text-[var(--color-primary)]'
                      : 'hover:text-[var(--color-primary)]'
                  )
                }
              >
                Feriados
              </Tab>
            </Tab.List>

            <Tab.Panels>
              {/* Panel de Coberturas Médicas */}
              <Tab.Panel>
                <CoberturasTab 
                  coberturas={coberturas} 
                  setCoberturas={setCoberturas} 
                  nuevaCobertura={nuevaCobertura} 
                  setNuevaCobertura={setNuevaCobertura} 
                />
              </Tab.Panel>

              {/* Panel de Consultorios */}
              <Tab.Panel>
                <ConsultoriosTab 
                  consultorios={consultorios}
                  setConsultorios={setConsultorios}
                  nuevoConsultorio={nuevoConsultorio}
                  setNuevoConsultorio={setNuevoConsultorio}
                />
              </Tab.Panel>

              {/* Panel de Doctores */}
              <Tab.Panel>
                <DoctoresTab 
                  config={config}
                  setConfig={setConfig}
                  nuevoDoctor={nuevoDoctor}
                  setNuevoDoctor={setNuevoDoctor}
                  consultorios={consultorios}
                  nuevoFeriadoDoctor={nuevoFeriadoDoctor}
                  setNuevoFeriadoDoctor={setNuevoFeriadoDoctor}
                />
              </Tab.Panel>

              {/* Panel de Horarios */}
              <Tab.Panel>
                <HorariosTab 
                  config={config}
                  setConfig={setConfig}
                  consultorios={consultorios}
                  selectedDoctorForAgenda={selectedDoctorForAgenda}
                  setSelectedDoctorForAgenda={setSelectedDoctorForAgenda}
                  selectedConsultorioForAgenda={selectedConsultorioForAgenda}
                  setSelectedConsultorioForAgenda={setSelectedConsultorioForAgenda}
                  horarioConflictos={horarioConflictos}
                  setHorarioConflictos={setHorarioConflictos}
                  detectarConflictosHorarios={detectarConflictosHorarios}
                />
              </Tab.Panel>

              {/* Panel de Feriados */}
              <Tab.Panel>
                <FeriadosTab 
                  config={config} 
                  setConfig={setConfig} 
                  nuevoFeriado={nuevoFeriado} 
                  setNuevoFeriado={setNuevoFeriado} 
                />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleGuardarConfiguracion}
              disabled={guardando}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>
                  Guardar Configuración
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}