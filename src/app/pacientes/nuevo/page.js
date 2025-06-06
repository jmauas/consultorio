'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { obtenerCoberturasDesdeDB } from '@/lib/utils/coberturasUtils';
import Loader from '@/components/Loader';
import { useTheme } from 'next-themes';

export default function NuevoPacientePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [pacienteExistente, setPacienteExistente] = useState(null);
  const [coberturas, setCoberturas] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    celular: '',
    email: '',
    cobertura: '',
    observaciones: ''
  });

  const { theme, setTheme } = useTheme();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Si cambia el DNI, limpiar el paciente existente
    if (name === 'dni') {
      setPacienteExistente(null);
    }
  };

  const validarFormulario = () => {
    // Validar campos obligatorios
    if (!formData.nombre.trim()) return 'El nombre es obligatorio';
    if (!formData.dni.trim()) return 'El DNI es obligatorio';
    if (!formData.celular.trim()) return 'El número de celular es obligatorio';
    if (!formData.coberturaMedicaId.trim() || formData.coberturaMedicaId.trim().length == 0) return 'El número de celular es obligatorio';
    
    // Validar formato de celular (solo números)
    if (!/^\d+$/.test(formData.celular.trim())) {
      return 'El número de celular debe contener solo dígitos';
    }
    
    // Validar formato de email si está presente
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'El formato del email no es válido';
    }
    
    return null;
  };
  
  const verificarDniExistente = async (dni) => {
    try {
      const response = await fetch(`/api/pacientes?dni=${dni}`);
      const data = await response.json();
      
      if (data.pacientes && data.pacientes.length > 0) {
        // Si se encontró un paciente con ese DNI
        setPacienteExistente(data.pacientes[0]);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error al verificar DNI existente:", error);
      return false;
    }
  };
  
  const handleActualizarPacienteExistente = async () => {
    try {
      setSubmitting(true);
      
      const response = await fetch(`/api/pacientes/${pacienteExistente.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el paciente');
      }
      
      // Redirigir a la página de detalle del paciente actualizado
      router.push(`/pacientes/${pacienteExistente.id}`);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar los datos del formulario
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Verificar si ya existe un paciente con el mismo DNI
      const dniExiste = await verificarDniExistente(formData.dni);
      if (dniExiste) {
        // Si existe un paciente con ese DNI, no continuar con el registro
        setSubmitting(false);
        return;
      }
      
      const response = await fetch('/api/pacientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al crear el paciente');
      }
      
      // Redirigir a la página de detalle del paciente o a la lista de pacientes
      if (data.id) {
        router.push(`/pacientes/${data.id}`);
      } else {
        router.push('/pacientes');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchCoberturas = async () => {
      try {
        const coberturasData = await obtenerCoberturasDesdeDB();
        setCoberturas(coberturasData);
      } catch (error) {
        console.error('Error al obtener coberturas:', error);
      }
    };
    
    fetchCoberturas();
  }
  , []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Nuevo Paciente</h1>
          <Link
            href="/pacientes"
            className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
          >
             <i className="fas fa-arrow-left mr-2"></i>
            Volver a Pacientes
          </Link>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Mensaje de paciente existente */}
        {pacienteExistente && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg mb-1">¡Atención! Ya existe un paciente con el mismo DNI</p>
                <p className="mb-4">
                  Se ha encontrado un paciente con el DNI {formData.dni}. ¿Desea actualizar sus datos con la información que acaba de ingresar?
                </p>
              </div>
              <button
                onClick={() => setPacienteExistente(null)}
                className="text-red-500 hover:text-red-700"
                title="Cerrar"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-3 rounded-lg shadow-sm mb-4">
              <h3 className="font-bold mb-2 text-red-800">Datos del paciente existente:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-semibold">Nombre:</span> {pacienteExistente.nombre || '-'}
                </div>
                <div>
                  <span className="font-semibold">Apellido:</span> {pacienteExistente.apellido || '-'}
                </div>
                <div>
                  <span className="font-semibold">DNI:</span> {pacienteExistente.dni || '-'}
                </div>
                <div>
                  <span className="font-semibold">Celular:</span> {pacienteExistente.celular || '-'}
                </div>
                <div>
                  <span className="font-semibold">Email:</span> {pacienteExistente.email || '-'}
                </div>
                <div>
                  <span className="font-semibold">Cobertura:</span> {pacienteExistente.cobertura || '-'}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => setPacienteExistente(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded flex items-center"
              >
                <i className="fas fa-user-plus mr-2"></i>
                Crear como nuevo paciente
              </button>
              
              <button
                onClick={handleActualizarPacienteExistente}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded flex items-center"
              >
                <i className="fas fa-user-edit mr-2"></i>
                Actualizar datos del paciente existente
              </button>
            </div>
          </div>
        )}

        <div className="shadow rounded-lg overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Nombre del paciente"
                    required
                  />
                </div>

                {/* Apellido */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Apellido del paciente"
                  />
                </div>

                {/* DNI */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    DNI <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="DNI del paciente"
                    required
                  />
                </div>

                {/* Celular */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Celular <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="celular"
                    value={formData.celular}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Número de celular sin 0 ni 15"
                    required
                  />
                  <p className="mt-1 text-xs">
                    Formato: código de área + número, sin 0 ni 15. Ej: 1123456789
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Correo electrónico"
                  />
                </div>

                {/* Cobertura Médica */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Cobertura Médica
                  </label>
                  <select
                    name="coberturaMedicaId"
                    value={formData.coberturaMedicaId}
                    onChange={handleChange}
                    className={`px-3 py-2 w-full border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme==='dark' ? 'bg-slate-900 text-slate-200' : 'bg-slate-200 text-slate-900'}`}
                  >
                    <option value="">Seleccione una cobertura</option>
                    {coberturas.map((cobertura) => (
                      <option key={cobertura.id} value={cobertura.id}>
                        {cobertura.nombre} ({cobertura.codigo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Observaciones */}
              <div className="mt-6">
                <label className="block text-sm font-medium mb-1">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="Observaciones adicionales sobre el paciente"
                ></textarea>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <div className="flex space-x-2">
                <Link
                  href="/pacientes"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded flex items-center"
                >
                  <i className="fas fa-times mr-2"></i>
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:bg-blue-300 flex items-center"
                >
                  {submitting ? (
                    <Loader titulo={'Guardando ...'}/>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Guardar Paciente
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}