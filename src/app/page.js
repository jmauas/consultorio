'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { formatoFecha } from '@/lib/utils/dateUtils';
import GrillaTurnos from '@/components/GrillaTurnos';
import Loader from '@/components/Loader';
import Modal from '@/components/Modal';
import TurnoNuevo from '@/components/TurnoNuevo';
import TurnoDisponibilidad from '@/components/TurnoDisponibilidad';

export default function Home() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [loadingTurnos, setLoadingTurnos] = useState(true);
  const [tituloModal, setTituloModal] = useState('');
  const [modalTurnoNuevo, setModalTurnoNuevo] = useState(false);
  const [modalTurnoDisponibilidad, setModalTurnoDisponibilidad] = useState(false);
  const [stats, setStats] = useState({
    turnosHoy: 0,
    turnosProximos: 0,
    pacientes: 0
  });
  const [ultimosTurnos, setUltimosTurnos] = useState([]);
  const [allTurnos, setAllTurnos] = useState([]);

  // Cerrar modal
  const cerrarModal = () => {
    setModalTurnoNuevo(false);
    setModalTurnoDisponibilidad(false);
  };

  // Función para actualizar la lista de turnos después de una acción
  const handleTurnoActualizado = (action, turno) => {
    if (action === 'update') {
      // Actualizar el turno en la lista
      setUltimosTurnos(turnos => 
        turnos.map(t => t.id === turno.id ? turno : t)
      );
      setAllTurnos(turnos => 
        turnos.map(t => t.id === turno.id ? turno : t)
      );
    } else if (action === 'delete') {
      // Eliminar el turno de la lista
      setUltimosTurnos(turnos => 
        turnos.filter(t => t.id !== turno)
      );
      setAllTurnos(turnos => 
        turnos.filter(t => t.id !== turno)
      );
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      if (status === 'loading') return;
      
      if (status === 'authenticated') {
        try {
          await Promise.all([
            cargarTodosLosDatos(),
            cargarPacientes()
          ]);
        } catch (error) {
          console.error('Error al cargar datos:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const cargarTodosLosDatos = async () => {
    try {
      setLoadingTurnos(true);
      // Calcular fecha límite (7 días desde hoy)
      const limite = new Date();
      limite.setDate(limite.getDate() + 7);
      
      // Realizar una sola consulta para obtener todos los turnos
      console.log(formatoFecha(new Date(), false, false, true, false));
      const respTurnos = await fetch(
        `/api/turnos?desde=${formatoFecha(new Date(), false, false, true, false)}&hasta=${limite.toISOString()}`
      );
      
      if (!respTurnos.ok) {
        throw new Error('Error al cargar turnos');
      }
      
      const dataTurnos = await respTurnos.json();
      
      if (dataTurnos.ok && dataTurnos.turnos) {
        const turnos = dataTurnos.turnos;
        setAllTurnos(turnos);
        
        // Procesar datos para estadísticas y últimos turnos
        procesarDatos(turnos);
      }
    } catch (error) {
      console.error('Error al cargar turnos:', error);
    }
    finally {
      setLoadingTurnos(false);
    }
  };

  const procesarDatos = (turnos) => {
    // Fecha de hoy a las 0:00
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Fecha de hoy a las 23:59
    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);
    
    // Fecha límite para próximos 3 días (para mostrar en la tabla)
    const limiteTresDias = new Date();
    limiteTresDias.setDate(limiteTresDias.getDate() + 3);
    
    // Filtrar turnos de hoy
    const turnosHoy = turnos.filter(turno => {
      const fechaTurno = new Date(turno.desde);
      return fechaTurno >= hoy && fechaTurno <= finHoy;
    });
    
    // Actualizar estadísticas
    setStats(prev => ({
      ...prev,
      turnosHoy: turnosHoy.length,
      turnosProximos: turnos.length
    }));
    
    // Últimos turnos (próximos 3 días, ordenados por fecha)
    const proximos = turnos
      .filter(turno => {
        const fechaTurno = new Date(turno.desde);
        return fechaTurno <= limiteTresDias;
      })
      .sort((a, b) => new Date(a.desde) - new Date(b.desde))
      .slice(0, 5);
    
    setUltimosTurnos(proximos);
  };

  const cargarPacientes = async () => {
    try {
      // Obtener cantidad de pacientes
      const respPacientes = await fetch('/api/pacientes?todos=true');
      const dataPacientes = await respPacientes.json();
      
      setStats(prev => ({
        ...prev,
        pacientes: dataPacientes.ok ? dataPacientes.pacientes.length : 0
      }));
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
    }
  };

  const handleModalTurnoNuevo = () => {
    setTituloModal('Nuevo Turno');
    setModalTurnoNuevo(true);

  };

  const handleModalTurnoDisponibilidad = () => {
    setTituloModal('Turno Disponibilidad');
    setModalTurnoDisponibilidad(true);
  };

  if (loading) {
    return (
      <Loader />
    );
  }

  if (!session) {
    return (
      <div className="mt-24 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-center mb-8">Sistema de Gestión de Turnos</h1>
        
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold">Bienvenido</h2>
              <p className="text-gray-600 mt-2">
                Inicie sesión para acceder al sistema de gestión de turnos
              </p>
            </div>
            
            <Link 
              href="/auth/signin" 
              className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center py-3 px-4 rounded-md transition duration-200"
            >
              <i className="fa-solid fa-right-to-bracket mr-2"></i>
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-lg md:text-3xl font-bold text-gray-800 mb-2 md:mb-8">
        <i className="fa-solid fa-user-circle mr-2"></i>
        Bienvenido, {session.user?.name || 'Usuario'}
      </h1>
      
      {/* Tarjetas de estadísticas */}
      {/* Pantallas Grandes */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            <i className="fa-solid fa-calendar-day mr-2"></i>
            Turnos de Hoy
          </h2>
          <p className="text-3xl font-bold text-blue-600">{stats.turnosHoy}</p>
          <Link 
            href={`/turnos?desde=${new Date().toISOString().split('T')[0]}&hasta=${new Date().toISOString().split('T')[0]}`} 
            className="text-sm text-blue-500 hover:underline mt-2 inline-block"
          >
            Ver todos <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            <i className="fa-solid fa-calendar-week mr-2"></i>
            Próximos Turnos
          </h2>
          <p className="text-3xl font-bold text-green-600">{stats.turnosProximos}</p>
          <Link 
            href="/turnos" 
            className="text-sm text-blue-500 hover:underline mt-2 inline-block"
          >
            Ver todos <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            <i className="fa-solid fa-users mr-2"></i>
            Pacientes Registrados
          </h2>
          <p className="text-3xl font-bold text-purple-600">{stats.pacientes}</p>
          <Link 
            href="/pacientes" 
            className="text-sm text-blue-500 hover:underline mt-2 inline-block"
          >
            Ver todos <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </div>
      {/* Pantallas Pequeñas */}
      <div className="flex flex-col md:hidden gap-2 mb-4">
        <div className="bg-white rounded-lg shadow-md p-4 flex gap-4 items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">
            <i className="fa-solid fa-calendar-day mr-2"></i>
            Turnos de Hoy
          </h2>
          <span className="text-3xl font-bold text-blue-600">{stats.turnosHoy}</span>
          <Link 
            href={`/turnos?desde=${new Date().toISOString().split('T')[0]}&hasta=${new Date().toISOString().split('T')[0]}`} 
            className="text-sm text-blue-500 hover:underline inline-block"
          >
            Ver todos <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 flex gap-4 items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            <i className="fa-solid fa-calendar-week mr-2"></i>
            Próximos Turnos
          </h2>
          <span className="text-3xl font-bold text-green-600">{stats.turnosProximos}</span>
          <Link 
            href="/turnos" 
            className="text-sm text-blue-500 hover:underline inline-block"
          >
            Ver todos <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 flex gap-4 items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-700">
            <i className="fa-solid fa-users mr-2"></i>
            Pacientes
          </h2>
          <span className="text-3xl font-bold text-purple-600">{stats.pacientes}</span>
          <Link 
            href="/pacientes" 
            className="text-sm text-blue-500 hover:underline inline-block"
          >
            Ver todos <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </div>
      
      {/* Acciones rápidas */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          <i className="fa-solid fa-bolt mr-2"></i>
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
            className="bg-orange-500 hover:bg-orange-600 text-white text-center py-2 px-2 rounded-md transition duration-200 flex items-center justify-center gap-2 "
          >
            <i className="fa-solid fa-clock"></i>
            <i className="fa-solid fa-plus"></i>
            Turno Disponibilidad
          </button>
          <Link 
            href="/turnos" 
            className="bg-green-500 hover:bg-green-600 text-white text-center py-3 px-4 rounded-md transition duration-200 flex items-center justify-center "
          >
            <i className="fa-solid fa-calendar-days mr-2"></i>
            Ver Turnos
          </Link>
          <Link 
            href="/pacientes" 
            className="bg-purple-500 hover:bg-purple-600 text-white text-center py-3 px-4 rounded-md transition duration-200 flex items-center justify-center "

          >
            <i className="fa-solid fa-user-group mr-2"></i>
            Pacientes
          </Link>
          {/* <Link 
            href="/configuracion" 
            className="bg-gray-500 hover:bg-gray-600 text-white text-center py-3 px-4 rounded-md transition duration-200 flex items-center justify-center font-bold"          >
            <i className="fa-solid fa-gear mr-2"></i>
            Configuración
          </Link> */}
        </div>
      </div>
      
      {/* Próximos turnos */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-start items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold text-gray-800">
            <i className="fa-solid fa-calendar-check mr-2"></i>
            Próximos Turnos
          </h2>
          <button 
            onClick={cargarTodosLosDatos} 
            className="bg-orange-400 hover:bg-orange-600 text-white rounded-lg transition duration-200 w-8 h-8"
            title="Actualizar turnos"
          >
            <div>
              <i className="fa-solid fa-sync"></i>
            </div>
          </button>
        </div>
        
        {ultimosTurnos.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            <i className="fa-solid fa-calendar-xmark mr-2"></i>
            No hay turnos programados próximamente
          </p>
        ) : (
          <>
             {/* Listado de turnos */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <GrillaTurnos
                  turnos={ultimosTurnos}
                  loading={loadingTurnos}
                  onCancelarTurno={null}
                  onTurnoActualizado={handleTurnoActualizado}
                />
              </div>
            
            <div className="mt-4 text-center">
              <Link 
                href="/turnos" 
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todos los turnos <i className="fa-solid fa-arrow-right"></i>
              </Link>
            </div>
          </>
        )}
      </div>
       {/* Modal para nuevo Turno */}
        <Modal
          isOpen={modalTurnoNuevo || modalTurnoDisponibilidad}
          onClose={cerrarModal}
          size="large"
          title={tituloModal}
        >
          {modalTurnoNuevo 
          ? <TurnoNuevo />
          : modalTurnoDisponibilidad && <TurnoDisponibilidad />  
          }
        </Modal>   
    </div>
  );
}
