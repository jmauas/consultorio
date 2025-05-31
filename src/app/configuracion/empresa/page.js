'use client';

import { useState, useEffect, useRef } from 'react';
import { registrarConfig } from '@/lib/services/configService.js';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import Loader from '@/components/Loader';
import { useTheme } from 'next-themes';

export default function EmpresaPage() {
  const [datos, setDatos] = useState({
    nombreConsultorio: '',
    domicilio: '',
    telefono: '',
    email: '',
    web: '',
    horarioAtencion: '',
    logo: null,
    logoUrl: '',
    coberturas: '',
    limite: '',
    envio: false,
    horaEnvio: '',
    diasEnvio: '',
    envioMail: false,
    horaEnvioMail: '',
    diasEnvioMail: ''
  });

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const fileInputRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);
        const rspa = await fetch('/api/configuracion/empresa')
        const data = await rspa.json();
        const config = data.config;
        setDatos({
          nombreConsultorio: config.nombreConsultorio || '',
          domicilio: config.domicilio || '',
          telefono: config.telefono || '',
          email: config.mail || '',
          web: config.web || '',
          horarioAtencion: config.horarioAtencion || '',
          logo: null,
          logoUrl: config.logoUrl || '',
          coberturas: config.coberturas || '',
          limite: config.limite ? new Date(config.limite).toISOString().split('T')[0] : '',
          envio: config.envio || false,
          horaEnvio: config.horaEnvio || '',
          diasEnvio: config.diasEnvio || '',
          envioMail: config.envioMail || false,
          horaEnvioMail: config.horaEnvioMail || '',
          diasEnvioMail: config.diasEnvioMail || ''
        });
      } catch (error) {
        console.error('Error al cargar datos de empresa:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDatos({ 
      ...datos, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDatos({ ...datos, logo: file });
      
      // Preview de la imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        setDatos(prev => ({ ...prev, logoUrl: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      
      // Si hay un logo nuevo, subir primero
      let logoUrl = datos.logoUrl;
      if (datos.logo) {
        const formData = new FormData();
        formData.append('logo', datos.logo);
        
        const uploadResponse = await fetch('/api/config/upload-logo', {
          method: 'POST',
          body: formData
        });
        
        const uploadResult = await uploadResponse.json();
        if (uploadResult.success) {
          logoUrl = uploadResult.logoUrl;
        } else {
          throw new Error(uploadResult.error || 'Error al subir el logo');
        }
      }
      
      // Preparar los datos de empresa para actualizar solo los campos de esta sección
      // Solo incluir campos que existen en el modelo ConfiguracionConsultorio
      const datosEmpresa = {
        nombreConsultorio: datos.nombreConsultorio,
        domicilio: datos.domicilio,
        telefono: datos.telefono,
        mail: datos.email, // Nota: en el modelo es 'mail', no 'email'
        horarioAtencion: datos.horarioAtencion,
        web: datos.web || '',
        coberturas: datos.coberturas,
        logoUrl: logoUrl, // Añadimos la URL del logo a los datos a guardar
        limite: datos.limite ? new Date(datos.limite) : null,
        envio: datos.envio,
        horaEnvio: datos.horaEnvio,
        diasEnvio: datos.diasEnvio,
        envioMail: datos.envioMail,
        horaEnvioMail: datos.horaEnvioMail,
        diasEnvioMail: datos.diasEnvioMail
      };
      
      // Usar el parámetro 'empresa' para indicar que solo se actualicen los campos de esta sección
      await registrarConfig(datosEmpresa, 'empresa');
      toast.success('Datos de la empresa guardados correctamente');
    } catch (error) {
      console.error('Error al guardar datos de empresa:', error);
      toast.error('Error al guardar los datos: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Datos de la Empresa</h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold mb-4">Información Básica</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="nombreConsultorio" className="block font-medium mb-2">
                  Nombre del Consultorio/Empresa
                </label>
                <input
                  type="text"
                  id="nombreConsultorio"
                  name="nombreConsultorio"
                  value={datos.nombreConsultorio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="domicilio" className="block font-medium mb-2">
                  Domicilio
                </label>
                <input
                  type="text"
                  id="domicilio"
                  name="domicilio"
                  value={datos.domicilio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">
                  Logo
                </label>
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden"
                    onClick={triggerFileInput}
                  >
                    {datos.logoUrl ? (
                      <Image
                        src={datos.logoUrl} 
                        alt="Logo preview"
                        width={96}
                        height={96}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <i className="fas fa-image text-2xl"></i>
                        <p className="text-xs mt-1">Subir logo</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="px-3 py-1 rounded hover:bg-gray-300 text-sm"
                    >
                      Seleccionar archivo
                    </button>
                    <p className="text-xs mt-1">
                      Formatos: JPG, PNG, SVG
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div>
              <label htmlFor="horarioAtencion" className="block font-medium mb-2">
                Horario de Atención
              </label>
              <input
                type="text"
                id="horarioAtencion"
                name="horarioAtencion"
                value={datos.horarioAtencion}
                onChange={handleChange}
                placeholder="Ej: Lunes a Viernes de 9 a 18hs"
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              />
            </div>
          </div>
        </div>
        
        <div className="p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold mb-4">Contacto</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="telefono" className="block font-medium mb-2">
                Teléfono Principal
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={datos.telefono}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={datos.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              />
            </div>
            
            <div>
              <label htmlFor="web" className="block font-medium mb-2">
                Sitio Web
              </label>
              <input
                type="url"
                id="web"
                name="web"
                value={datos.web}
                onChange={handleChange}
                placeholder="https://"
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              />
            </div>
          </div>
        </div>
        
        <div className="p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold mb-4">Información Adicional</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="coberturas" className="block font-medium mb-2">
                Obras Sociales y Coberturas
              </label>
              <textarea
                id="coberturas"
                name="coberturas"
                value={datos.coberturas}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                placeholder="Lista las obras sociales y coberturas aceptadas..."
              ></textarea>
              <p className="text-sm mt-1">
                Separe cada cobertura con una coma o en líneas separadas
              </p>
            </div>

            <div>
              <label htmlFor="limite" className="block font-medium mb-2">
                Fecha Límite Para Turnos
              </label>
              <input
                type="date"
                id="limite"
                name="limite"
                value={datos.limite}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
              />
              <p className="text-sm mt-1">
                Fecha límite para turnos del consultorio
              </p>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mt-6">
              <div className="flex items-center mb-4 gap-4">
                <i className="fa-brands fa-whatsapp fa-2xl text-green-600"></i>
                <h4 className="font-semibold text-lg">Recordatorios de Turno por WhatsApp</h4>
              </div>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="envio"
                  name="envio"
                  checked={datos.envio}
                  onChange={handleChange}
                  className="h-4 w-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-gray-300 rounded"
                />
                <label htmlFor="envio" className="ml-2 block">
                  Enviar recordatorios por WhatsApp
                </label>
              </div>
              
              {datos.envio && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 mb-4">
                  <div>
                    <label htmlFor="horaEnvio" className="block font-medium mb-1">
                      Hora de envío
                    </label>
                    <input
                      type="time"
                      id="horaEnvio"
                      name="horaEnvio"
                      value={datos.horaEnvio}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                      required={datos.envio}
                    />
                    <p className="text-xs mt-1">
                      Hora Díaria de Envío
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="diasEnvio" className="block font-medium mb-1">
                      Días a enviar
                    </label>
                    <input
                      type="text"
                      id="diasEnvio"
                      name="diasEnvio"
                      value={datos.diasEnvio}
                      onChange={handleChange}
                      placeholder="ej: 1,2,3,4,5 (días de la semana: lunes a viernes)"
                      className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                      required={datos.envio}
                    />
                    <p className="text-xs mt-1">
                      1 para turnos del día siguiente, 2 para los 2 días siguientes, etc.
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-4 mt-2">
              <div className="flex items-center mb-4 gap-4">
                <i className="fa-solid fa-envelope fa-2xl text-blue-400"></i>
                <h4 className="font-semibold text-lg">Recordatorios de Turno por EMail</h4>
              </div>
              
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="envioMail"
                  name="envioMail"
                  checked={datos.envioMail}
                  onChange={handleChange}
                  className="h-4 w-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-gray-300 rounded"
                />
                <label htmlFor="envioMail" className="ml-2 block">
                  Enviar recordatorios por Email
                </label>
              </div>
              
              {datos.envioMail && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                  <div>
                    <label htmlFor="horaEnvioMail" className="block font-medium mb-1">
                      Hora de envío
                    </label>
                    <input
                      type="time"
                      id="horaEnvioMail"
                      name="horaEnvioMail"
                      value={datos.horaEnvioMail}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                      required={datos.envioMail}
                    />
                    <p className="text-xs mt-1">
                      Hora Díaria de Envío
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="diasEnvioMail" className="block font-medium mb-1">
                      Días para enviar
                    </label>
                    <input
                      type="text"
                      id="diasEnvioMail"
                      name="diasEnvioMail"
                      value={datos.diasEnvioMail}
                      onChange={handleChange}
                      placeholder="ej: 1,2,3,4,5 (días de la semana: lunes a viernes)"
                      className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                      required={datos.envioMail}
                    />
                    <p className="text-xs mt-1">
                      1 para turnos del día siguiente, 2 para los 2 días siguientes, etc.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            type="submit"
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
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}