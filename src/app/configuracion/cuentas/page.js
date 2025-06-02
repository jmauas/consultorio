'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Modal from '@/components/Modal'; 
import Loader from '@/components/Loader';

export default function CuentasPage() {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoCuenta, setEditandoCuenta] = useState(null);
  const [nuevaCuenta, setNuevaCuenta] = useState({
    nombre: '',
    url: '',
    token: ''
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEliminacion, setModalEliminacion] = useState({ abierto: false, id: null });

  useEffect(() => {
    cargarCuentas();
  }, []);

  const cargarCuentas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configuracion/whatsapp');
      
      if (!response.ok) {
        throw new Error('Error al cargar las cuentas de WhatsApp');
      }
      
      const data = await response.json();
      setCuentas(data);
    } catch (error) {
      console.error('Error al cargar cuentas de WhatsApp:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNuevaCuenta = () => {
    setNuevaCuenta({ nombre: '', url: '', token: '' });
    setEditandoCuenta(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (cuenta) => {
    setNuevaCuenta({
      nombre: cuenta.nombre,
      url: cuenta.url,
      token: cuenta.token
    });
    setEditandoCuenta(cuenta.id);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setNuevaCuenta({ nombre: '', url: '', token: '' });
    setEditandoCuenta(null);
  };

  const manejarCambioCampo = (e) => {
    setNuevaCuenta({
      ...nuevaCuenta,
      [e.target.name]: e.target.value
    });
  };

  const confirmarEliminacion = (id) => {
    setModalEliminacion({ abierto: true, id });
  };

  const cancelarEliminacion = () => {
    setModalEliminacion({ abierto: false, id: null });
  };

  const guardarCuenta = async (e) => {
    e.preventDefault();
    
    if (!nuevaCuenta.nombre || !nuevaCuenta.url || !nuevaCuenta.token) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
    
    setGuardando(true);
    
    try {
      let response;
      
      if (editandoCuenta) {
        // Actualizar cuenta existente
        response = await fetch('/api/configuracion/whatsapp', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: editandoCuenta,
            ...nuevaCuenta
          })
        });
        
        if (response.ok) {
          toast.success('Cuenta actualizada correctamente');
        }
      } else {
        // Crear nueva cuenta
        response = await fetch('/api/configuracion/whatsapp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(nuevaCuenta)
        });
        
        if (response.ok) {
          toast.success('Cuenta creada correctamente');
        }
      }
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar la cuenta de WhatsApp');
      }
      
      // Recargar cuentas y cerrar modal
      await cargarCuentas();
      cerrarModal();
    } catch (error) {
      console.error('Error al guardar cuenta de WhatsApp:', error);
      toast.error(error.message || 'Error al guardar la cuenta');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarCuenta = async () => {
    if (!modalEliminacion.id) return;
    
    try {
      const response = await fetch(`/api/configuracion/whatsapp?id=${modalEliminacion.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar la cuenta de WhatsApp');
      }
      
      toast.success('Cuenta eliminada correctamente');
      await cargarCuentas();
      cancelarEliminacion();
    } catch (error) {
      console.error('Error al eliminar cuenta de WhatsApp:', error);
      toast.error(error.message || 'Error al eliminar la cuenta');
    }
  };

  // Renderizar cuentas en formato de cards para móviles
  const cardsView = (
    <div className="grid grid-cols-1 gap-4 mt-4">
      {cuentas.map((cuenta) => (
        <div key={cuenta.id} className="rounded-lg shadow p-4 border border-gray-200">
          <div className="flex justify-between items-start mb-3">
            <div className="font-medium text-lg text-gray-900">{cuenta.nombre}</div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => abrirModalEditar(cuenta)}
                className="text-blue-500 hover:text-blue-700 transition-colors"
                aria-label="Editar"
              >
                <i className="fas fa-edit"></i>
              </button>
              <button
                type="button"
                onClick={() => confirmarEliminacion(cuenta.id)}
                className="text-red-500 hover:text-red-700 transition-colors"
                aria-label="Eliminar"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium">URL:</span>
              <div className="truncate text-gray-800" title={cuenta.url}>
                {cuenta.url}
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium">Token:</span>
              <div className="truncate text-gray-800" title={cuenta.token}>
                {cuenta.token.substring(0, 15)}...
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Renderizar tabla para pantallas grandes
  const tableView = (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-12 gap-4 font-medium p-2 border-b">
        <div className="col-span-3">Nombre</div>
        <div className="col-span-4">URL</div>
        <div className="col-span-4">Token</div>
        <div className="col-span-1">Acciones</div>
      </div>
      
      {cuentas.map((cuenta) => (
        <div key={cuenta.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-200">
          <div className="col-span-3">
            {cuenta.nombre}
          </div>
          <div className="col-span-4">
            <div className="truncate" title={cuenta.url}>
              {cuenta.url}
            </div>
          </div>
          <div className="col-span-4">
            <div className="truncate" title={cuenta.token}>
              {cuenta.token.substring(0, 15)}...
            </div>
          </div>
          <div className="col-span-1 flex justify-center space-x-3">
            <button
              type="button"
              onClick={() => abrirModalEditar(cuenta)}
              className="text-blue-500 hover:text-blue-700 transition-colors"
              aria-label="Editar"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              type="button"
              onClick={() => confirmarEliminacion(cuenta.id)}
              className="text-red-500 hover:text-red-700 transition-colors"
              aria-label="Eliminar"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // Contenido para mostrar cuando no hay cuentas
  const emptyContent = (
    <p className="text-gray-500 italic text-center py-4">No hay cuentas configuradas</p>
  );

  if (loading) {
    return (
      <Loader titulo={''}/>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Cuentas de WhatsApp</h2>      
      <div className="bg-blue-50 p-4 rounded-md mb-6">
        <h3 className="font-semibold text-blue-700 mb-2">
          <i className="fab fa-whatsapp mr-2"></i>
          Información sobre las Cuentas
        </h3>
        <p className="text-blue-800 mb-2">
          Configure las cuentas de WhatsApp que utilizará el sistema para comunicarse con los pacientes.
          Cada cuenta debe tener un nombre, URL de conexión y token de autenticación.
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Listado de Cuentas</h3>
          <button
            type="button"
            onClick={abrirModalNuevaCuenta}
            className="px-3 py-1 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary)] transition-colors flex items-center gap-1"
          >
            <i className="fas fa-plus"></i> Agregar Cuenta
          </button>
        </div>
        
        <div className="p-4 rounded-lg shadow-lg border border-gray-200">
          {cuentas.length === 0 ? (
            emptyContent
          ) : (
            <>
              {/* Vista condicional según el tamaño de pantalla */}
              <div className="block lg:hidden">
                {cardsView}
              </div>

              <div className="hidden lg:block">
                {tableView}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Modal para agregar/editar cuenta usando el componente Modal */}
      <Modal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        title={editandoCuenta ? 'Editar Cuenta WhatsApp' : 'Nueva Cuenta WhatsApp'}
      >
        <form onSubmit={guardarCuenta}>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="nombre" className="block text-gray-700 font-medium">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={nuevaCuenta.nombre}
                onChange={manejarCambioCampo}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="Nombre de la cuenta"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="url" className="block text-gray-700 font-medium">
                URL <span className="text-red-500">*</span>
              </label>
              <input
                id="url"
                name="url"
                type="text"
                value={nuevaCuenta.url}
                onChange={manejarCambioCampo}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="URL de conexión"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="token" className="block font-medium">
                Token <span className="text-red-500">*</span>
              </label>
              <input
                id="token"
                name="token"
                type="text"
                value={nuevaCuenta.token}
                onChange={manejarCambioCampo}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                placeholder="Token de autenticación"
                required
              />
            </div>
          </div>
          
          <div className="border-t p-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={cerrarModal}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary)] transition-colors disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Modal para confirmar eliminación usando el componente Modal */}
      <Modal
        isOpen={modalEliminacion.abierto}
        onClose={cancelarEliminacion}
        title="Confirmar eliminación"
      >
        <div className="p-4">
          <p className="">
            ¿Estás seguro de que deseas eliminar esta cuenta de WhatsApp? Esta acción no se puede deshacer.
          </p>
        </div>
        
        <div className="border-t p-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={cancelarEliminacion}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={eliminarCuenta}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}