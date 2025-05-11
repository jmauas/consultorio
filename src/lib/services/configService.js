// Use server-only APIs
'use server';

import { prisma } from '../prisma';

/**
 * Obtiene la configuración global del sistema desde la base de datos
 * @returns {Object} Configuración del sistema
 */
export const obtenerConfig = async () => {
  try {
    const config = await prisma.configuracionConsultorio.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    // Si estamos en modo desarrollo y hay una URL de desarrollo configurada, la usamos
    if (process.env.DEV === 'true' && config?.urlAppDev) {
      return { ...config, urlApp: config.urlAppDev };
    }
    
    return config || {};
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return {};
  }
};

/**
 * Guarda la configuración global del sistema en la base de datos
 * @param {Object} datos Configuración a guardar
 * @param {string} seccion Sección que se está actualizando (empresa, tecnica, consultorio, etc.)
 * @returns {boolean} Resultado de la operación
 */
export const registrarConfig = async (datos, seccion = 'completo') => {
  try {
    // Primero buscamos si existe una configuración previa
    const configExistente = await prisma.configuracionConsultorio.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    // Validar la fecha limite antes de usarla
    let fechaLimite;
    try {
      fechaLimite = datos.limite ? new Date(datos.limite) : new Date();
      // Verificar si la fecha es válida
      if (isNaN(fechaLimite.getTime())) {
        fechaLimite = new Date(); // Si es inválida, usar la fecha actual
      }
    } catch (error) {
      console.error('Error al procesar la fecha límite:', error);
      fechaLimite = new Date(); // En caso de error, usar la fecha actual
    }
    
    // Preparamos los datos a guardar según la sección
    let dataToSave = {};
    
    if (seccion === 'empresa' || seccion === 'completo') {
      // Datos específicos de la sección empresa
      dataToSave = {
        ...dataToSave,
        ...(datos.nombreConsultorio !== undefined && { nombreConsultorio: datos.nombreConsultorio || '' }),
        ...(datos.domicilio !== undefined && { domicilio: datos.domicilio || '' }),
        ...(datos.ciudad !== undefined && { ciudad: datos.ciudad || '' }),
        ...(datos.codigoPostal !== undefined && { codigoPostal: datos.codigoPostal || '' }),
        ...(datos.telefono !== undefined && { telefono: datos.telefono || '' }),
        ...(datos.telefonoAlternativo !== undefined && { telefonoAlternativo: datos.telefonoAlternativo || '' }),
        ...(datos.email !== undefined && { mail: datos.email || '' }),
        ...(datos.horarioAtencion !== undefined && { horarioAtencion: datos.horarioAtencion || '' }),
        ...(datos.web !== undefined && { web: datos.web || '' }),
        ...(datos.descripcion !== undefined && { descripcion: datos.descripcion || '' }),
        ...(datos.logoUrl !== undefined && { logoUrl: datos.logoUrl || '' }),
        ...(datos.limite !== undefined && { limite: fechaLimite }),
        ...(datos.envio !== undefined && { envio: datos.envio || false }),
        ...(datos.horaEnvio !== undefined && { horaEnvio: datos.horaEnvio || '0' }),
        ...(datos.diasEnvio !== undefined && { diasEnvio: datos.diasEnvio || '0' }),
        ...(datos.envioMail !== undefined && { envioMail: datos.envioMail || false }),
        ...(datos.horaEnvioMail !== undefined && { horaEnvioMail: datos.horaEnvioMail || '0' }),
        ...(datos.diasEnvioMail !== undefined && { diasEnvioMail: datos.diasEnvioMail || '0' }),
      };
    }
    
    if (seccion === 'tecnica' || seccion === 'completo') {
      // Datos específicos de la sección técnica
      dataToSave = {
        ...dataToSave,
        ...(datos.urlApp !== undefined && { urlApp: datos.urlApp || '' }),
        ...(datos.urlAppDev !== undefined && { urlAppDev: datos.urlAppDev || '' })
      };
    }
    
    if (seccion === 'consultorio' || seccion === 'completo') {
      // Datos específicos de la sección consultorio
      dataToSave = {
        ...dataToSave,
        ...(datos.limite !== undefined && { limite: fechaLimite }),
        ...(datos.feriados !== undefined && { feriados: datos.feriados || [] }),
        ...(datos.envio !== undefined && { envio: datos.envio || false }),
        ...(datos.horaEnvio !== undefined && { horaEnvio: datos.horaEnvio || '' }),
        ...(datos.diasEnvio !== undefined && { diasEnvio: datos.diasEnvio || '' }),
        ...(datos.resto !== undefined && { resto: datos.resto || '' })
      };
    }
    
    // Ya no estamos usando el campo cuentas en la configuración del consultorio
    // porque ahora tenemos una tabla específica para CuentaWhatsapp
    
    if (configExistente) {
      // Solo actualizar si hay datos para guardar
      if (Object.keys(dataToSave).length > 0) {
        // Actualizar la configuración existente
        await prisma.configuracionConsultorio.update({
          where: { id: configExistente.id },
          data: dataToSave
        });
      }
    } else {
      // Crear una nueva configuración con datos mínimos requeridos
      const defaultData = {
        nombreConsultorio: '',
        domicilio: '',
        telefono: '',
        mail: '',
        horarioAtencion: '',
        coberturas: '',
        limite: new Date(),
        feriados: [],
        urlApp: '',
      };
      await prisma.configuracionConsultorio.create({
        data: {
          ...defaultData,
          ...dataToSave
        }
      });
    }  
    
    
    // Si la config también incluye doctores y es la sección de consultorio
    if ((seccion === 'consultorio' || seccion === 'completo') && datos.doctores && Array.isArray(datos.doctores)) {
      // Obtener doctores existentes y sus relaciones
      const doctoresExistentes = await prisma.doctor.findMany({
        include: {
          AgendaDoctor: true,
          TipoTurnoDoctor: true
        }
      });
      const doctoresExistentesMap = new Map(doctoresExistentes.map(d => [d.id, d]));
      
      // Identificar IDs de doctores enviados para determinar cuáles deben eliminarse
      const idsDoctoresEnviados = new Set(datos.doctores.filter(d => d.id).map(d => d.id));
      const idsDoctoresAEliminar = doctoresExistentes
        .filter(d => !idsDoctoresEnviados.has(d.id))
        .map(d => d.id);
      
      // Eliminar doctores que ya no están en la lista y sus relaciones
      if (idsDoctoresAEliminar.length > 0) {
        // Eliminar relaciones
        await prisma.tipoTurnoDoctor.deleteMany({
          where: {
            doctorId: { in: idsDoctoresAEliminar }
          }
        });
        await prisma.agendaDoctor.deleteMany({
          where: {
            doctorId: { in: idsDoctoresAEliminar }
          }
        });
        // Eliminar doctores
        await prisma.doctor.deleteMany({
          where: {
            id: { in: idsDoctoresAEliminar }
          }
        });
      }
      
      // Actualizar o crear doctores
      for (const doctor of datos.doctores) {
        if (doctor.id && doctoresExistentesMap.has(doctor.id)) {
          
          // Actualizar doctor existente
          await prisma.doctor.update({
            where: { id: doctor.id },
            data: {
              nombre: doctor.nombre,
              emoji: doctor.emoji || '👨‍⚕️',
              feriados: doctor.feriados || []
            }
          });
          
          // Procesar agenda
          if (doctor.agenda && Array.isArray(doctor.agenda)) {
            // Eliminar items de agenda anteriores
            await prisma.agendaDoctor.deleteMany({
              where: { doctorId: doctor.id }
            });
            
            // Crear nuevos items de agenda
            for (const agendaItem of doctor.agenda) {
              await prisma.agendaDoctor.create({
                data: {
                  doctorId: doctor.id,
                  consultorioId: agendaItem.consultorioId || null, // Add consultorioId field
                  dia: agendaItem.dia,
                  nombre: agendaItem.nombre,
                  atencion: agendaItem.atencion,
                  desde: agendaItem.desde,
                  hasta: agendaItem.hasta,
                  corteDesde: agendaItem.corteDesde,
                  corteHasta: agendaItem.corteHasta
                }
              });
            }
          }
          
          // Procesar tipos de turno
          if (doctor.tiposTurno && Array.isArray(doctor.tiposTurno)) {
            // Eliminar tipos de turno anteriores
            await prisma.tipoTurnoDoctor.deleteMany({
              where: { doctorId: doctor.id }
            });
            
            // Crear nuevos tipos de turno
            for (const tipoTurno of doctor.tiposTurno) {
              await prisma.tipoTurnoDoctor.create({
                data: {
                  doctorId: doctor.id,
                  nombre: tipoTurno.nombre,
                  duracion: tipoTurno.duracion,
                  habilitado: tipoTurno.habilitado
                }
              });
            }
          }
        } else {
          // Crear nuevo doctor
          const doctorCreado = await prisma.doctor.create({
            data: {
              nombre: doctor.nombre,
              emoji: doctor.emoji || '👨‍⚕️',
              feriados: doctor.feriados || []
            }
          });
          
          // Crear agenda del doctor
          if (doctor.agenda && Array.isArray(doctor.agenda)) {
            for (const agendaItem of doctor.agenda) {
              await prisma.agendaDoctor.create({
                data: {
                  doctorId: doctorCreado.id,
                  consultorioId: agendaItem.consultorioId || null, // Add consultorioId field
                  dia: agendaItem.dia,
                  nombre: agendaItem.nombre,
                  atencion: agendaItem.atencion,
                  desde: agendaItem.desde,
                  hasta: agendaItem.hasta,
                  corteDesde: agendaItem.corteDesde,
                  corteHasta: agendaItem.corteHasta
                }
              });
            }
          }
          
          // Crear tipos de turno del doctor
          if (doctor.tiposTurno && Array.isArray(doctor.tiposTurno)) {
            for (const tipoTurno of doctor.tiposTurno) {
              await prisma.tipoTurnoDoctor.create({
                data: {
                  doctorId: doctorCreado.id,
                  nombre: tipoTurno.nombre,
                  duracion: tipoTurno.duracion,
                  habilitado: tipoTurno.habilitado
                }
              });
            }
          }
        }
      }
    }    
    
    return true;
  } catch (error) {
    console.error('Error al registrar configuración:', error);
    return false;
  }
};

/**
 * Obtiene la configuración específica para doctores
 * @returns {Array} Lista de doctores configurados
 */
export const obtenerDoctores = async () => {
  try {
    const doctores = await prisma.doctor.findMany({
      include: {
        AgendaDoctor: true,
        TipoTurnoDoctor: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    
    // Transform the data to match the expected structure in the frontend
    return doctores.map(doctor => ({
      ...doctor,
      agenda: doctor.AgendaDoctor || [],
      tiposTurno: doctor.TipoTurnoDoctor || [],
      // Remove the capitalized fields to avoid duplication
      AgendaDoctor: undefined,
      TipoTurnoDoctor: undefined
    })) || [];
  } catch (error) {
    console.error('Error al obtener doctores:', error);
    return [];
  }
};

/**
 * Obtiene la configuración específica para Consultrios
 * @returns {Array} Lista de consultorios configurados
 */
export const obtenerConsultorios = async () => {
  try {
    const consultorios = await prisma.consultorio.findMany();
    return consultorios || [];
  } catch (error) {
    console.error('Error al obtener consultorios:', error);
    return [];
  }
};

/**
 * Obtiene la configuración del sistema
 */
export async function getConfig() {
  // Implementación actual o futura
}

/**
 * Obtiene todas las cuentas de WhatsApp
 * @returns {Array} Lista de cuentas de WhatsApp
 */
export const obtenerCuentasWhatsapp = async () => {
  try {
    const cuentas = await prisma.cuentasWhatsapp.findMany({
      orderBy: {
        nombre: 'asc'
      }
    });
    return cuentas || [];
  } catch (error) {
    console.error('Error al obtener cuentas de WhatsApp:', error);
    return [];
  }
};

/**
 * Obtiene una cuenta de WhatsApp por su ID
 * @param {string} id ID de la cuenta de WhatsApp
 * @returns {Object|null} Datos de la cuenta de WhatsApp
 */
export const obtenerCuentaWhatsapp = async (id) => {
  try {
    const cuenta = await prisma.cuentasWhatsapp.findUnique({
      where: { id }
    });
    return cuenta;
  } catch (error) {
    console.error(`Error al obtener cuenta de WhatsApp con ID ${id}:`, error);
    return null;
  }
};

/**
 * Crea una nueva cuenta de WhatsApp
 * @param {Object} datos Datos de la cuenta de WhatsApp
 * @returns {Object|null} Cuenta de WhatsApp creada
 */
export const crearCuentaWhatsapp = async (datos) => {
  try {
    const cuenta = await prisma.cuentasWhatsapp.create({
      data: {
        nombre: datos.nombre,
        url: datos.url,
        token: datos.token
      }
    });
    return cuenta;
  } catch (error) {
    console.error('Error al crear cuenta de WhatsApp:', error);
    return null;
  }
};

/**
 * Actualiza una cuenta de WhatsApp existente
 * @param {string} id ID de la cuenta de WhatsApp
 * @param {Object} datos Datos actualizados de la cuenta de WhatsApp
 * @returns {Object|null} Cuenta de WhatsApp actualizada
 */
export const actualizarCuentaWhatsapp = async (id, datos) => {
  try {
    const cuenta = await prisma.cuentasWhatsapp.update({
      where: { id },
      data: {
        nombre: datos.nombre,
        url: datos.url,
        token: datos.token
      }
    });
    return cuenta;
  } catch (error) {
    console.error(`Error al actualizar cuenta de WhatsApp con ID ${id}:`, error);
    return null;
  }
};

/**
 * Elimina una cuenta de WhatsApp
 * @param {string} id ID de la cuenta de WhatsApp
 * @returns {boolean} Resultado de la operación
 */
export const eliminarCuentaWhatsapp = async (id) => {
  try {
    await prisma.cuentasWhatsapp.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error(`Error al eliminar cuenta de WhatsApp con ID ${id}:`, error);
    return false;
  }
};

export const verificarDirectorio = async (directorio) => {
  try {
    // Verificar si el directorio existe
    if (!fs.existsSync(directorio)) {
      // Crear el directorio si no existe
      await fs.promises.mkdir(directorio, { recursive: true });
    }
  } catch (error) {
    console.error('Error al verificar o crear el directorio:', error);
  }
}