'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Modal from '@/components/Modal';

export default function UsersAdmin() { 
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    enabled: true,
    perfil: 1,
    doctoresIds: []
  });

  // Comprobar autenticación
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    if (status === 'authenticated') {
      loadUsers();
      loadDoctores();
      loadPerfiles();
    }
  }, [status]);

  // Función para cargar la lista de usuarios
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const data = await response.json();

      if (data.ok) {
        const usersWithValidDoctores = data.users.map(user => ({
          ...user,
          doctores: user.doctores && Array.isArray(user.doctores) ? user.doctores : []
        }));
        setUsers(usersWithValidDoctores);
      } else {
        setError(data.message || 'Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error al cargar usuarios. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar doctores
  const loadDoctores = async () => {
    try {
      const response = await fetch('/api/configuracion/doctores');
      const data = await response.json();

      if (data.ok) {
        setDoctores(data.doctores || []);
      } else {
        console.error('Error al cargar doctores:', data.message);
      }
    } catch (error) {
      console.error('Error al cargar doctores:', error);
    }
  };

  // Función para cargar perfiles
  const loadPerfiles = async () => {
    try {
      const response = await fetch('/api/users/perfiles');
      const data = await response.json();

      if (data.ok) {
        setPerfiles(data.perfiles || []);
      } else {
        console.error('Error al cargar perfiles:', data.message);
      }
    } catch (error) {
      console.error('Error al cargar perfiles:', error);
    }
  };

  // Filtrar usuarios según término de búsqueda
  const filteredUsers = users.filter(user => {
    const searchText = searchTerm.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(searchText)) ||
      (user.email && user.email.toLowerCase().includes(searchText))
    );
  });

  // Manejar cambio de perfil y limpiar doctores si no es perfil 1
  const handlePerfilChange = (e) => {
    const perfilValue = parseInt(e.target.value, 10);
    setFormData((prev) => ({
      ...prev,
      perfil: perfilValue,
      doctoresIds: perfilValue === 1 ? prev.doctoresIds : []
    }));
  };

  // Manejar selección/deselección de doctor
  const handleDoctorToggle = (doctorId) => {
    doctorId = String(doctorId);
    setFormData((prev) => {
      if (prev.doctoresIds.includes(doctorId)) {
        return { ...prev, doctoresIds: prev.doctoresIds.filter(id => id !== doctorId) };
      } else {
        return { ...prev, doctoresIds: [...prev.doctoresIds, doctorId] };
      }
    });
  };

  // Función para manejar la creación de usuarios
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.ok) {
        loadUsers();
        setShowCreateModal(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          enabled: true,
          perfil: 1,
          doctoresIds: []
        });
      } else {
        setError(data.message || 'Error al crear usuario');
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
      setError('Error al crear usuario. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la actualización de usuarios
  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.ok) {
        loadUsers();
        setShowEditModal(false);
        toast.success('Usuario actualizado correctamente');
      } else {
        const errorMessage = data.message || data.error || 'Error al actualizar usuario';
        console.error('Error detallado:', data);
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      const errorMessage = error.message || 'Error al actualizar usuario. Por favor, intenta nuevamente.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la eliminación de usuarios
  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.ok) {
        loadUsers();
        setShowDeleteModal(false);
      } else {
        setError(data.message || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      setError('Error al eliminar usuario. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Preparar formulario para edición  
  const prepareEdit = (user) => {
    const doctoresIds = user.doctores && Array.isArray(user.doctores) 
        ? user.doctores.map(d => String(d.id))
        : [];

    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      enabled: user.enabled !== false,
      perfil: user.perfil || 1,
      doctoresIds: doctoresIds
    });
    setShowEditModal(true);
  };

  // Preparar confirmación de eliminación
  const prepareDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Función para renderizar tarjetas de doctores
  const renderDoctorCards = () => {
    return (
      <div className="flex flex-wrap gap-6 mt-2">
        {doctores.map(doctor => {
          const isSelected = formData.doctoresIds.includes(String(doctor.id));
          const cardBgColor = doctor.color ? `${doctor.color}40` : '#f3f4f6';
          
          return (
            <div
              key={doctor.id}
              onClick={() => handleDoctorToggle(doctor.id)}
              className={`
                cursor-pointer p-2 rounded-lg flex items-center border transition-all flex-row justify-between gap-4
                ${isSelected ? 'ring-2 ring-offset-2 ring-[var(--color-primary)] border-[var(--color-primary)]' : 'border-gray-200 hover:shadow'}
              `}
              style={{ backgroundColor: cardBgColor }}
            >
              <div className="flex-1 flex items-center flex-wrap">
                <span className="text-xl mr-2">{doctor.emoji}</span>
                <span className="text-sm font-medium">{doctor.nombre}</span>
              </div>
              <div className={`w-6 h-6 flex-shrink-0 rounded-full border ${isSelected ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'bg-white border-gray-300'} flex items-center justify-center`}>
                {isSelected && <i className="fa-solid fa-check text-white fa-lg"></i>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <i className="fa-solid fa-spinner fa-spin text-[var(--color-primary)] text-4xl"></i>
          <p className="mt-4 text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  const loadingContent = (
    <div className="flex justify-center items-center py-8">
      <i className="fa-solid fa-spinner fa-spin text-[var(--color-primary)]"></i>
      <span className="ml-2">Cargando usuarios...</span>
    </div>
  );

  const emptyContent = (
    <div className="text-center py-8 text-gray-500">
      {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda.' : 'No hay usuarios registrados.'}
    </div>
  );

  const cardsView = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {filteredUsers.map((user) => (
        <div key={user.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center mb-3">
            <div className="h-12 w-12 flex-shrink-0 mr-3">
              {user.image ? (
                <Image 
                  className="h-12 w-12 rounded-full" 
                  src={user.image} 
                  alt={user.name} 
                  width={48} 
                  height={48}
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <i className="fa-solid fa-user text-[var(--color-primary)]"></i>
                </div>
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900">{user.name || 'Usuario sin nombre'}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {user.enabled !== false ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                <i className="fa-solid fa-check-circle mr-1"></i>
                Activo
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                <i className="fa-solid fa-ban mr-1"></i>
                Inactivo
              </span>
            )}
            {user.emailVerified ? (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                <i className="fa-solid fa-check-circle mr-1"></i>
                Verificado
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                <i className="fa-solid fa-circle-question mr-1"></i>
                No verificado
              </span>
            )}
          </div>
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-500 mb-1">Perfil:</div>
            {perfiles.find(p => p.id === user.perfil) ? (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                {perfiles.find(p => p.id === user.perfil).emoji} {perfiles.find(p => p.id === user.perfil).nombre}
              </span>
            ) : (
              <span className="text-sm text-gray-500">No asignado</span>
            )}
          </div>
          <div className="mb-3">
            <div className="text-xs font-medium text-gray-500 mb-1">Doctores:</div>
            <div className="flex flex-wrap gap-1">
              {user.doctores && user.doctores.length > 0 ? (
                user.doctores.map(doctor => (
                  <span 
                    key={doctor.id} 
                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800" 
                    title={doctor.nombre}
                    style={doctor.color ? { backgroundColor: doctor.color + '40' } : {}}
                  >
                    {doctor.emoji} {doctor.nombre}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">Ninguno</span>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-2 pt-2 border-t border-t-gray-200">
            <button
              onClick={() => prepareEdit(user)}
              className="text-indigo-600 hover:text-indigo-900 mr-3 text-xs p-2 border border-indigo-600 rounded-md"
            >
              <i className="fa-solid fa-edit mr-1"></i>
              Editar
            </button>
            <button
              onClick={() => prepareDelete(user)}
              className="text-red-600 hover:text-red-900 text-xs p-2 border border-red-600 rounded-md"
            >
              <i className="fa-solid fa-trash-alt mr-1"></i>
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const tableView = (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="py-3 text-center text-xs font-medium uppercase tracking-wider">
              Usuario
            </th>
            <th scope="col" className="py-3 text-center text-xs font-medium uppercase tracking-wider">
              Correo Electrónico
            </th>
            <th scope="col" className="py-3 text-center text-xs font-medium uppercase tracking-wider">
              Perfil
            </th>
            <th scope="col" className="py-3 text-center text-xs font-medium uppercase tracking-wider">
              Doctores
            </th>
            <th scope="col" className="py-3 text-center text-xs font-medium uppercase tracking-wider">
              Estado
            </th>
            <th scope="col" className="py-3 text-center text-xs font-medium uppercase tracking-wider">
              Verificado
            </th>
            <th scope="col" className="py-3 text-center text-xs font-medium uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {loading ? (
            <tr>
              <td colSpan="7" className="px-6 py-4 text-center">
                <i className="fa-solid fa-spinner fa-spin text-[var(--color-primary)]"></i>
                <span className="ml-2">Cargando usuarios...</span>
              </td>
            </tr>
          ) : filteredUsers.length === 0 ? (
            <tr>
              <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                {searchTerm ? 'No se encontraron usuarios que coincidan con la búsqueda.' : 'No hay usuarios registrados.'}
              </td>
            </tr>
          ) : (
            filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {user.image ? (
                        <Image className="h-8 w-8 rounded-full" src={user.image} alt={user.name} width={24} height={24}/>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                          <i className="fa-solid fa-user text-[var(--color-primary)]"></i>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name || 'Usuario sin nombre'}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {perfiles.find(p => p.id === user.perfil) ? (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {perfiles.find(p => p.id === user.perfil).emoji} {perfiles.find(p => p.id === user.perfil).nombre}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">No asignado</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {user.doctores && user.doctores.length > 0 ? (
                      user.doctores.map(doctor => (
                        <span 
                          key={doctor.id} 
                          className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800" 
                          title={doctor.nombre}
                          style={doctor.color ? { backgroundColor: doctor.color + '40' } : {}}
                        >
                          {doctor.emoji} {doctor.nombre}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">Ninguno</span>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {user.enabled !== false ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      <i className="fa-solid fa-check-circle mr-1"></i>
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      <i className="fa-solid fa-ban mr-1"></i>
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {user.emailVerified ? (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      <i className="fa-solid fa-check-circle mr-1"></i>
                      Verificado
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      <i className="fa-solid fa-circle-question mr-1"></i>
                      No verificado
                    </span>
                  )}
                </td>
                <td className="wpx-6 py-4 text-right text-sm font-medium flex gap-2 flex-wrap">
                  <button
                    onClick={() => prepareEdit(user)}
                    className="text-indigo-600 hover:text-indigo-900 p-1 border border-indigo-600 rounded-md"
                  >
                    <i className="fa-solid fa-edit mr-1"></i>
                    Editar
                  </button>
                  <button
                    onClick={() => prepareDelete(user)}
                    className="text-red-600 hover:text-red-900 p-1 border border-red-600 rounded-md"
                  >
                    <i className="fa-solid fa-trash-alt mr-1"></i>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            <i className="fa-solid fa-users text-[var(--color-primary)] mr-2"></i>
            Administración de Usuarios
          </h1>
          <button
            onClick={() => {
              setFormData({
                name: '',
                email: '',
                password: '',
                enabled: true,
                perfil: 1,
                doctoresIds: []
              });
              setShowCreateModal(true);
            }}
            className="flex items-center rounded-md bg-[var(--color-primary)] px-4 py-2 text-white hover:bg-[var(--color-primary)]"
          >
            <i className="fa-solid fa-user-plus mr-2"></i>
            <span className="hidden sm:inline">Nuevo Usuario</span>
            <span className="inline sm:hidden">Nuevo</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <div className="flex">
              <i className="fa-solid fa-circle-exclamation text-red-400 mt-0.5 mr-3"></i>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <i className="fa-solid fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-0 py-2 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="block lg:hidden">
          {loading ? loadingContent : filteredUsers.length === 0 ? emptyContent : cardsView}
        </div>

        <div className="hidden lg:block">
          {tableView}
        </div>
      </div>

      <Modal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear nuevo usuario"
        size="medium"
      >
        <div className="p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
              <i className="fa-solid fa-user-plus text-[var(--color-primary)]"></i>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <div className="mt-2">
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nombre
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] p-2 border"
                      placeholder="Nombre del usuario"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] p-2 border"
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] p-2 border"
                      placeholder="Contraseña"
                    />
                    {!formData.password && (
                      <p className="mt-1 text-xs text-gray-500">
                        Si no se proporciona una contraseña, el usuario tendrá que usar el método de enlace por email para acceder.
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="perfil" className="block text-sm font-medium text-gray-700">
                      Perfil
                    </label>
                    <select
                      id="perfil"
                      name="perfil"
                      value={formData.perfil}
                      onChange={handlePerfilChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] p-2 border"
                    >
                      {perfiles.map(perfil => (
                        <option key={perfil.id} value={perfil.id}>
                          {perfil.emoji} {perfil.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.perfil === 1 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Doctores Asignados
                      </label>
                      {renderDoctorCards()}
                      <p className="mt-1 text-xs text-gray-500">
                        Hacé clic en las tarjetas para seleccionar o deseleccionar los doctores.
                      </p>
                    </div>
                  )}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="enabled"
                      id="enabled"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="h-4 w-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-gray-300 rounded"
                    />
                    <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                      Usuario habilitado
                    </label>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[var(--color-primary)] text-base font-medium text-white hover:bg-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] sm:ml-3 sm:w-auto sm:text-sm"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Procesando...
                </>
              ) : (
                'Crear Usuario'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showEditModal && selectedUser !== null}
        onClose={() => setShowEditModal(false)}
        title="Editar usuario"
        size="medium"
      >
        <div className="p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
              <i className="fa-solid fa-user-edit text-indigo-600"></i>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <div className="mt-2">
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                      Nombre
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                      placeholder="Nombre del usuario"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="edit-email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                      placeholder="correo@ejemplo.com"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700">
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="edit-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                      placeholder="Dejar en blanco para no cambiar"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Deja en blanco para mantener la contraseña actual.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="edit-perfil" className="block text-sm font-medium text-gray-700">
                      Perfil
                    </label>
                    <select
                      id="edit-perfil"
                      name="perfil"
                      value={formData.perfil}
                      onChange={handlePerfilChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                    >
                      {perfiles.map(perfil => (
                        <option key={perfil.id} value={perfil.id}>
                          {perfil.emoji} {perfil.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.perfil === 1 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Doctores Asignados
                      </label>
                      {renderDoctorCards()}
                      <p className="mt-1 text-xs text-gray-500">
                        Hacé clic en las tarjetas para seleccionar o deseleccionar los doctores.
                      </p>
                    </div>
                  )}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="edit-enabled"
                      id="edit-enabled"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit-enabled" className="ml-2 block text-sm text-gray-900">
                      Usuario habilitado
                    </label>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleUpdate}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[var(--color-primary)] text-base font-medium text-white hover:bg-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Procesando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal && selectedUser !== null}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar usuario"
        size="small"
      >
        <div className="p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <i className="fa-solid fa-exclamation-triangle text-red-600"></i>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que deseas eliminar al usuario <span className="font-semibold">{selectedUser?.name || selectedUser?.email}</span>?
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Procesando...
                </>
              ) : (
                'Eliminar Usuario'
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}