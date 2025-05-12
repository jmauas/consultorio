'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { handleExcel } from '@/lib/services/excel';
import { toast } from 'react-hot-toast';
import Modal from '@/components/Modal';
import { obtenerCoberturasDesdeDB } from '@/lib/utils/coberturasUtils';
import Loader from '@/components/Loader';
import TurnoNuevo from '@/components/TurnoNuevo';
import TurnoDisponibilidad from '@/components/TurnoDisponibilidad';

export default function PacientesPage() {
  const router = useRouter();
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    nombre: '',
    dni: '',
    celular: '',
    cobertura: 'todos'
  });
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    total: 0,
    porPagina: 20
  });
  const [tituloModal, setTituloModal] = useState('');
  const [modalTurnoNuevo, setModalTurnoNuevo] = useState(false);
  const [modalTurnoDisponibilidad, setModalTurnoDisponibilidad] = useState(false);
  
  // Estado para coberturas médicas
  const [coberturas, setCoberturas] = useState([]);
  
  // Estado para el modal de nuevo turno
  const [modalNuevoTurnoAbierto, setModalNuevoTurnoAbierto] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);

  const cargarPacientes = async (usarFiltros = false) => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/api/pacientes?todos=true&sinTurnos=true';
      
      // Si se están aplicando filtros, usar los criterios de búsqueda
      if (usarFiltros && (filtros.nombre || filtros.dni || filtros.celular || filtros.cobertura)) {
        url = '/api/pacientes?sinTurnos=true&';
        if (filtros.nombre) url += `nombre=${encodeURIComponent(filtros.nombre)}&`;
        if (filtros.dni) url += `dni=${encodeURIComponent(filtros.dni)}&`;
        if (filtros.celular) url += `celular=${encodeURIComponent(filtros.celular)}&`;
        if (filtros.cobertura && filtros.cobertura !== 'todos') url += `cobertura=${encodeURIComponent(filtros.cobertura)}&`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al cargar pacientes');
      }
      
      const data = await response.json();
      
      // Si la respuesta contiene pacientes en un array
      if (data.pacientes || data.paciente) {
        const listaPacientes = data.pacientes || data.paciente;
        setPacientes(listaPacientes);
        
        // Actualizar paginación
        setPaginacion(prev => ({
          ...prev,
          total: listaPacientes.length
        }));
      } else {
        setPacientes([]);
        setPaginacion(prev => ({
          ...prev,
          total: 0
        }));
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  };

  const PacientesExcel = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = '/api/pacientes?todos=true';
      
      // Si se están aplicando filtros, usar los criterios de búsqueda
      if (filtros.nombre) url += `nombre=${encodeURIComponent(filtros.nombre)}&`;
      if (filtros.dni) url += `dni=${encodeURIComponent(filtros.dni)}&`;
      if (filtros.celular) url += `celular=${encodeURIComponent(filtros.celular)}&`;
      if (filtros.cobertura && filtros.cobertura !== 'todos') url += `cobertura=${encodeURIComponent(filtros.cobertura)}&`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al cargar pacientes');
      }
      
      const data = await response.json();
      
      // Si la respuesta contiene pacientes en un array
      if (data.pacientes || data.paciente) {
        const listaPacientes = data.pacientes || data.paciente;
        handleExcel(listaPacientes, 'Pacientes');
      } 
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);      
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPaginacion(prev => ({
      ...prev,
      pagina: 1 // Volver a la primera página al filtrar
    }));
    cargarPacientes(true);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      nombre: '',
      dni: '',
      celular: '',
      cobertura: 'todos'
    });
    setPaginacion(prev => ({
      ...prev,
      pagina: 1
    }));
    cargarPacientes();
  };

  const handleVerDetalle = (id) => {
    router.push(`/pacientes/${id}`);
  };

  const handleCambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= Math.ceil(paginacion.total / paginacion.porPagina)) {
      setPaginacion(prev => ({
        ...prev,
        pagina: nuevaPagina
      }));
    }
  };

  const abrirModalNuevoTurno = (paciente) => {
    setPacienteSeleccionado(paciente);
    setModalNuevoTurnoAbierto(true);
  };
  
  const cerrarModalNuevoTurno = () => {
    setModalNuevoTurnoAbierto(false);
    setPacienteSeleccionado(null);
  };
    // Cerrar modal
  const cerrarModal = () => {
    setModalTurnoNuevo(false);
    setModalTurnoDisponibilidad(false);
  };
  
  // Funciones de navegación para nuevo turno
  const irANuevoTurno = () => {
    setModalTurnoNuevo(true);
    setModalNuevoTurnoAbierto(false);
    setTituloModal('Nuevo Turno');
  };
  
  const irADisponibilidad = () => {
    setModalNuevoTurnoAbierto(false);
    setTituloModal('Turno Disponibilidad');
    setModalTurnoDisponibilidad(true);
  };

  // Calcular índices para paginación
  const indiceInicial = (paginacion.pagina - 1) * paginacion.porPagina;
  const indiceFinal = Math.min(indiceInicial + paginacion.porPagina, paginacion.total);
  const pacientesPaginados = pacientes.slice(indiceInicial, indiceFinal);
  const totalPaginas = Math.ceil(paginacion.total / paginacion.porPagina);

   useEffect(() => {
    cargarPacientes();
    // Cargar las coberturas médicas al inicializar
    const cargarCoberturas = async () => {
      try {
        const coberturasData = await obtenerCoberturasDesdeDB();
        setCoberturas(coberturasData || []);
      } catch (error) {
        console.error('Error al cargar coberturas médicas:', error);
      }
    };
    cargarCoberturas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginacion.pagina]);


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pacientes</h1>
        <Link 
          href="/pacientes/nuevo" 
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center gap-2"
        >
          <i className="fa-solid fa-user-plus"></i> Nuevo Paciente
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium mb-4">Buscar Pacientes</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={filtros.nombre}
              onChange={handleFiltroChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Nombre o apellido"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
            <input
              type="text"
              name="dni"
              value={filtros.dni}
              onChange={handleFiltroChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="DNI"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
            <input
              type="text"
              name="celular"
              value={filtros.celular}
              onChange={handleFiltroChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Número de celular"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cobertura</label>
            <select
              name="cobertura"
              value={filtros.cobertura}
              onChange={handleFiltroChange}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="todos">Todas las coberturas</option>
              {coberturas.map((cobertura) => (
                <option key={cobertura.id} value={cobertura.id}>
                  {cobertura.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end space-x-2">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center gap-2"
            >
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
            <button
              type="button"
              onClick={handleLimpiarFiltros}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded flex items-center gap-2"
            >
              <i className="fa-solid fa-eraser"></i>
            </button>
            <button
              onClick={() => {
                PacientesExcel();
                toast.success('Exportando a Excel...');
              }}
              className="bg-green-500 text-white rounded-md hover:bg-green-600 py-2 px-4 flex items-center gap-2"
              title="Exportar A Excel"
            >
              <i className="fa-solid fa-file-excel"></i>

            </button>
          </div>
        </form>
      </div>

      {/* Lista de pacientes */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <Loader titulo={'Cargando Pacientes...'}/>
        ) : error ? (
          <div className="p-6 text-center text-red-500">
            <p>{error}</p>
            <button
              onClick={() => cargarPacientes()}
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm flex items-center gap-2 mx-auto"
            >
              <i className="fa-solid fa-rotate"></i> Reintentar
            </button>
          </div>
        ) : pacientesPaginados.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No se encontraron pacientes.</p>
            {!filtros.nombre && !filtros.dni && !filtros.celular && !filtros.cobertura ? (
              <Link 
                href="/pacientes/nuevo" 
                className="mt-2 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
              >
                <i className="fa-solid fa-user-plus"></i> Registrar nuevo paciente
              </Link>
            ) : (
              <button
                onClick={handleLimpiarFiltros}
                className="mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded text-sm flex items-center gap-2 mx-auto"
              >
                <i className="fa-solid fa-eraser"></i> Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Vista de tabla para pantallas medianas y grandes */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DNI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cobertura
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pacientesPaginados.map((paciente, i) => (
                    <tr key={`${paciente.id}-${i}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {paciente.nombre} {paciente.apellido || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{paciente.dni}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          <div>{paciente.celular}</div>
                          {paciente.email && <div className="text-xs">{paciente.email}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {paciente.coberturaMedica ? (
                            <span className={`px-2 py-1 rounded ${paciente.coberturaMedica.fondo} ${paciente.coberturaMedica.color}`}>
                              {paciente.coberturaMedica.nombre}
                            </span>
                          ) : paciente.cobertura || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleVerDetalle(paciente.id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center justify-items-center p-2 w-8 h-8 border rounded-full"
                            title="Ver Detalle"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <button
                            onClick={() => abrirModalNuevoTurno(paciente)}
                            className="text-green-600 hover:text-green-900 flex items-center justify-items-center p-2 w-8 h-8 border rounded-full"
                            title="Nuevo Turno"
                          >
                            <i className="fa-solid fa-calendar-plus"></i>
                          </button>
                          {/* Botón para enviar email */}
                          {paciente.email && (
                            <a
                              href={`mailto:${paciente.email}`}
                              className="text-blue-600 hover:text-blue-900 flex items-center justify-items-center p-2 w-8 h-8 border rounded-full"
                              title="Enviar Email"
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <i className="fa-solid fa-envelope"></i>
                            </a>
                          )}
                          {/* Botón para enviar WhatsApp */}
                          {paciente.celular && (
                            <a 
                              href={`https://wa.me/${paciente.celular}`}
                              target="_blank"
                              rel="noopener noreferrer" 
                              className="text-green-600 hover:text-green-700 flex items-center justify-items-center p-2 w-8 h-8 border rounded-full"
                              title="Enviar WhatsApp"
                            >
                              <i className="fab fa-whatsapp text-green-600 fa-lg"></i>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Vista de cards para pantallas pequeñas */}
            <div className="md:hidden space-y-4 p-4">
              {pacientesPaginados.map((paciente, i) => (
                <div 
                  key={`card-${paciente.id}-${i}`} 
                  className="bg-white border rounded-lg shadow-sm overflow-hidden"
                >
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-gray-900">
                        {paciente.nombre} {paciente.apellido || ''}
                      </h3>
                      <div className="bg-blue-100 rounded-full p-2">
                        <i className="fa-solid fa-user text-blue-600"></i>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">DNI</p>
                        <p className="mt-1 text-sm font-bold">{paciente.dni || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Contacto</p>
                        <p className="mt-1 text-sm font-bold">{paciente.celular || '-'}</p>
                        {paciente.email && (
                          <p className="text-xs text-gray-500">{paciente.email}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Cobertura Médica</p>
                        <p className="mt-1 text-sm font-bold">{paciente.cobertura || '-'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-4 py-3 flex justify-between">
                    <div className="space-x-2">
                      <button
                        onClick={() => handleVerDetalle(paciente.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                        title="Ver Detalle"
                      >
                        <i className="fa-solid fa-eye mr-1"></i> Detalles
                      </button>
                      <button
                        onClick={() => abrirModalNuevoTurno(paciente)}
                        className="inline-flex items-center px-3 py-1.5 border border-green-600 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
                        title="Nuevo Turno"
                      >
                        <i className="fa-solid fa-calendar-plus mr-1"></i> Nuevo turno
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      {paciente.email && (
                        <a
                          href={`mailto:${paciente.email}`}
                          className="inline-flex items-center justify-center w-8 h-8 border border-blue-600 rounded-full text-blue-700 bg-blue-50 hover:bg-blue-100"
                          title="Enviar Email"
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <i className="fa-solid fa-envelope"></i>
                        </a>
                      )}
                      {paciente.celular && (
                        <a 
                          href={`https://wa.me/${paciente.celular}`}
                          target="_blank"
                          rel="noopener noreferrer" 
                          className="inline-flex items-center justify-center w-8 h-8 border border-green-600 rounded-full text-green-700 bg-green-50 hover:bg-green-100"
                          title="Enviar WhatsApp"
                        >
                          <i className="fab fa-whatsapp"></i>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center">
                <div className="text-sm text-gray-700 mb-2 sm:mb-0">
                  Mostrando <span className="font-medium">{indiceInicial + 1}</span> a <span className="font-medium">{indiceFinal}</span> de <span className="font-medium">{paginacion.total}</span> pacientes
                </div>
                <div className="flex flex-wrap justify-center space-x-1">
                  <button
                    onClick={() => handleCambiarPagina(paginacion.pagina - 1)}
                    disabled={paginacion.pagina === 1}
                    className="px-3 py-1 rounded border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <i className="fa-solid fa-chevron-left"></i> Anterior
                  </button>
                  
                  {/* Mostrar páginas */}
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    // Si hay más de 5 páginas, mostrar contexto alrededor de la página actual
                    let pageNum;
                    if (totalPaginas <= 5) {
                      pageNum = i + 1;
                    } else if (paginacion.pagina <= 3) {
                      pageNum = i + 1;
                    } else if (paginacion.pagina >= totalPaginas - 2) {
                      pageNum = totalPaginas - 4 + i;
                    } else {
                      pageNum = paginacion.pagina - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handleCambiarPagina(pageNum)}
                        className={`px-3 py-1 rounded border text-sm font-medium ${
                          pageNum === paginacion.pagina 
                            ? 'bg-blue-500 text-white border-blue-500' 
                            : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handleCambiarPagina(paginacion.pagina + 1)}
                    disabled={paginacion.pagina === totalPaginas}
                    className="px-3 py-1 rounded border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Siguiente <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal para nuevo turno */}
      <Modal
        isOpen={modalNuevoTurnoAbierto}
        onClose={cerrarModalNuevoTurno}
        size="small"
        title="Crear Nuevo Turno"
      >
        <div className="p-4">
          <p className="text-gray-600 mb-4">
            Seleccione el tipo de turno que desea crear para 
            <span className="font-bold"> {pacienteSeleccionado?.nombre} {pacienteSeleccionado?.apellido}</span>
          </p>
          <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
            <button 
              onClick={irANuevoTurno}
              className="flex items-center justify-center gap-3 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-md shadow transition duration-200"
            >
              <i className="fa-solid fa-calendar-plus text-xl"></i>
              <span className="text-lg font-medium">Nuevo Turno</span>
            </button>
            
            <button 
              onClick={irADisponibilidad}
              className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-md shadow transition duration-200"
            >
              <i className="fa-solid fa-clock text-xl"></i>
              <span className="text-lg font-medium">Por Disponibilidad</span>
            </button>
          </div>
        </div>
      </Modal>
      {/* Modal para nuevo Turno */}
      <Modal
        isOpen={modalTurnoNuevo || modalTurnoDisponibilidad}
        onClose={cerrarModal}
        size="large"
        title={tituloModal}
      >
        {modalTurnoNuevo 
        ? <TurnoNuevo 
            pacienteIdParam={pacienteSeleccionado?.id}
          />
        : modalTurnoDisponibilidad 
          ? <TurnoDisponibilidad 
              pacienteIdParam={pacienteSeleccionado?.id}
            />
          : null  
        }
      </Modal>   
    </div>
  );
}