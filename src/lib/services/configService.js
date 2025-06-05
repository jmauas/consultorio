// Use server-only APIs
'use server';

import { prisma } from '@/lib/prisma.js';

/**
 * Obtiene la configuración global del sistema desde la base de datos
 * @returns {Object} Configuración del sistema
 */
export const obtenerConfig = async () => {
  try {
    const config = await prisma.configuracionConsultorio.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    return config || {};
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return {};
  }
};

export const obtenerUrlApp = async () => {
  try {
    const config = await obtenerConfig();

    // Si estamos en modo desarrollo y hay una URL de desarrollo configurada, la usamos
    if (process.env.DEV === 'true' && config?.urlAppDev) {
      return config.urlAppDev;
    } else {
      // En producción, usamos la URL de la app normal
      return config.urlApp || '';
    }
  } catch (error) {
    console.error('Error al obtener URL de la app:', error);
    return '';
  }
}

/**
 * Función optimizada para procesar doctores con operaciones en lote
 */
const procesarDoctoresOptimizado = async (tx, doctores) => {
  try {
    // Obtener doctores existentes y sus relaciones en una sola consulta
    const doctoresExistentes = await tx.doctor.findMany({
      include: {
        AgendaDoctor: true,
        TipoTurnoDoctor: true
      }
    });
    
    const doctoresExistentesMap = new Map(doctoresExistentes.map(d => [d.id, d]));
    
    // Identificar IDs de doctores enviados para determinar cuáles deben eliminarse
    const idsDoctoresEnviados = new Set(doctores.filter(d => d.id).map(d => d.id));
    const idsDoctoresAEliminar = doctoresExistentes
      .filter(d => !idsDoctoresEnviados.has(d.id))
      .map(d => d.id);
    
    // Eliminar doctores que ya no están en la lista (en lote)
    if (idsDoctoresAEliminar.length > 0) {
      await tx.tipoTurnoDoctor.deleteMany({
        where: { doctorId: { in: idsDoctoresAEliminar } }
      });
      await tx.agendaDoctor.deleteMany({
        where: { doctorId: { in: idsDoctoresAEliminar } }
      });
      await tx.doctor.deleteMany({
        where: { id: { in: idsDoctoresAEliminar } }
      });
    }
    
    // Preparar arrays para operaciones en lote
    const doctoresAActualizar = [];
    const doctoresACrear = [];
    const agendasACrear = [];
    const tiposTurnoACrear = [];
    const tiposTurnoAActualizar = [];
    const doctoresConAgendas = [];
    const doctoresConTipos = [];
    
    // Clasificar doctores
    doctores.forEach(doctor => {
      if (doctor.id && doctoresExistentesMap.has(doctor.id)) {
        doctoresAActualizar.push(doctor);
        if (doctor.agenda?.length > 0) {
          doctoresConAgendas.push(doctor);
        }
        if (doctor.tiposTurno?.length > 0) {
          doctoresConTipos.push(doctor);
        }
      } else {
        doctoresACrear.push(doctor);
      }
    });
    
    // Actualizar doctores existentes en lote donde sea posible
    for (const doctor of doctoresAActualizar) {
      await tx.doctor.update({
        where: { id: doctor.id },
        data: {
          nombre: doctor.nombre,
          emoji: doctor.emoji || '👨‍⚕️',
          feriados: doctor.feriados || [],
          color: doctor.color || '#000000',
        }
      });
    }
    
    // Crear doctores nuevos
    const doctoresCreados = [];
    for (const doctor of doctoresACrear) {
      const doctorCreado = await tx.doctor.create({
        data: {
          nombre: doctor.nombre,
          emoji: doctor.emoji || '👨‍⚕️',
          feriados: doctor.feriados || [],
          color: doctor.color || '#000000',
        }
      });
      doctoresCreados.push({ original: doctor, creado: doctorCreado });
    }
    
    // Procesar agendas optimizado
    await procesarAgendasOptimizado(tx, doctoresConAgendas, doctoresCreados);
    
    // Procesar tipos de turno optimizado
    await procesarTiposTurnoOptimizado(tx, doctoresConTipos, doctoresCreados);
    
  } catch (error) {
    console.error('Error en procesarDoctoresOptimizado:', error);
    throw error;
  }
};

/**
 * Función optimizada para procesar agendas
 */
const procesarAgendasOptimizado = async (tx, doctoresConAgendas, doctoresCreados) => {
  // Eliminar todas las agendas de doctores existentes en lote
  const doctorIds = doctoresConAgendas.map(d => d.id);
  if (doctorIds.length > 0) {
    await tx.agendaDoctor.deleteMany({
      where: { doctorId: { in: doctorIds } }
    });
  }
  
  // Preparar datos de agenda para inserción en lote
  const agendasACrear = [];
  
  // Procesar agendas de doctores existentes
  doctoresConAgendas.forEach(doctor => {
    if (doctor.agenda && Array.isArray(doctor.agenda)) {
      doctor.agenda.forEach(agendaItem => {
        const agendaData = {
          doctorId: doctor.id,
          consultorioId: agendaItem.consultorioId || null,
          dia: agendaItem.dia,
          nombre: agendaItem.nombre,
          atencion: agendaItem.atencion,
          desde: agendaItem.desde,
          hasta: agendaItem.hasta,
          corteDesde: agendaItem.corteDesde,
          corteHasta: agendaItem.corteHasta,
          fecha: agendaItem.dia === 99 && agendaItem.fecha ? new Date(agendaItem.fecha) : null
        };
        agendasACrear.push(agendaData);
      });
    }
  });
  
  // Procesar agendas de doctores nuevos
  doctoresCreados.forEach(({ original, creado }) => {
    if (original.agenda && Array.isArray(original.agenda)) {
      original.agenda.forEach(agendaItem => {
        const agendaData = {
          doctorId: creado.id,
          consultorioId: agendaItem.consultorioId || null,
          dia: agendaItem.dia,
          nombre: agendaItem.nombre,
          atencion: agendaItem.atencion,
          desde: agendaItem.desde,
          hasta: agendaItem.hasta,
          corteDesde: agendaItem.corteDesde,
          corteHasta: agendaItem.corteHasta,
          fecha: agendaItem.dia === 99 && agendaItem.fecha ? new Date(agendaItem.fecha) : null
        };
        agendasACrear.push(agendaData);
      });
    }
  });
  
  // Crear todas las agendas en lotes para evitar problemas de memoria
  const batchSize = 50;
  for (let i = 0; i < agendasACrear.length; i += batchSize) {
    const batch = agendasACrear.slice(i, i + batchSize);
    await tx.agendaDoctor.createMany({
      data: batch
    });
  }
};

/**
 * Función optimizada para procesar tipos de turno
 */
const procesarTiposTurnoOptimizado = async (tx, doctoresConTipos, doctoresCreados) => {
  // Procesar tipos de turno para doctores existentes
  for (const doctor of doctoresConTipos) {
    if (doctor.tiposTurno && Array.isArray(doctor.tiposTurno)) {
      // Obtener tipos existentes
      const tiposTurnoExistentes = await tx.tipoTurnoDoctor.findMany({
        where: { doctorId: doctor.id }
      });
      
      const tiposTurnoExistentesMap = new Map(tiposTurnoExistentes.map(t => [t.nombre, t]));
      const nombresTiposNuevos = new Set(doctor.tiposTurno.map(t => t.nombre));
      
      // Desactivar tipos que ya no están
      const tiposParaDesactivar = tiposTurnoExistentes.filter(t => !nombresTiposNuevos.has(t.nombre));
      if (tiposParaDesactivar.length > 0) {
        await tx.tipoTurnoDoctor.updateMany({
          where: { id: { in: tiposParaDesactivar.map(t => t.id) } },
          data: { habilitado: false }
        });
      }
      
      // Procesar tipos de turno
      const tiposACrear = [];
      const tiposAActualizar = [];
      
      doctor.tiposTurno.forEach(tipoTurno => {
        const tipoExistente = tiposTurnoExistentesMap.get(tipoTurno.nombre);
        if (tipoExistente) {
          tiposAActualizar.push({
            id: tipoExistente.id,
            data: {
              duracion: tipoTurno.duracion,
              habilitado: tipoTurno.habilitado,
              publico: tipoTurno.publico || true,
            }
          });
        } else {
          tiposACrear.push({
            doctorId: doctor.id,
            nombre: tipoTurno.nombre,
            duracion: tipoTurno.duracion,
            habilitado: tipoTurno.habilitado,
            publico: tipoTurno.publico || true,
          });
        }
      });
      
      // Ejecutar actualizaciones y creaciones
      for (const tipo of tiposAActualizar) {
        await tx.tipoTurnoDoctor.update({
          where: { id: tipo.id },
          data: tipo.data
        });
      }
      
      if (tiposACrear.length > 0) {
        await tx.tipoTurnoDoctor.createMany({
          data: tiposACrear
        });
      }
    }
  }
  
  // Procesar tipos de turno para doctores nuevos
  const tiposNuevosACrear = [];
  doctoresCreados.forEach(({ original, creado }) => {
    if (original.tiposTurno && Array.isArray(original.tiposTurno)) {
      original.tiposTurno.forEach(tipoTurno => {
        tiposNuevosACrear.push({
          doctorId: creado.id,
          nombre: tipoTurno.nombre,
          duracion: tipoTurno.duracion,
          habilitado: tipoTurno.habilitado,
          publico: tipoTurno.publico || true,
        });
      });
    }
  });
  
  if (tiposNuevosACrear.length > 0) {
    await tx.tipoTurnoDoctor.createMany({
      data: tiposNuevosACrear
    });
  }
};

/**
 * Guarda la configuración global del sistema en la base de datos (VERSIÓN OPTIMIZADA)
 * @param {Object} datos Configuración a guardar
 * @param {string} seccion Sección que se está actualizando (empresa, tecnica, consultorio, etc.)
 * @returns {boolean} Resultado de la operación
 */
export const registrarConfig = async (datos, seccion = 'completo') => {
  try {
    return await prisma.$transaction(async (tx) => {
      console.log('Iniciando transacción de configuración...');
      
      // Primero buscamos si existe una configuración previa
      const configExistente = await tx.configuracionConsultorio.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      
      // Validar la fecha limite antes de usarla
      let fechaLimite;
      try {
        fechaLimite = datos.limite ? new Date(datos.limite) : new Date();
        if (isNaN(fechaLimite.getTime())) {
          console.warn('Fecha límite inválida, usando fecha actual');
          fechaLimite = new Date();
        }
      } catch (error) {
        console.error('Error al procesar la fecha límite:', error);
        fechaLimite = new Date();
      }
      
      // Preparamos los datos a guardar según la sección
      let dataToSave = {};
      
      if (seccion === 'empresa' || seccion === 'completo') {
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
        dataToSave = {
          ...dataToSave,
          ...(datos.urlApp !== undefined && { urlApp: datos.urlApp || '' }),
          ...(datos.urlAppDev !== undefined && { urlAppDev: datos.urlAppDev || '' })
        };
      }
      
      if (seccion === 'consultorio' || seccion === 'completo') {
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
      
      // Actualizar o crear configuración
      if (configExistente && Object.keys(dataToSave).length > 0) {
        console.log('Actualizando configuración existente...');
        await tx.configuracionConsultorio.update({
          where: { id: configExistente.id },
          data: dataToSave
        });
      } else if (!configExistente) {
        console.log('Creando nueva configuración...');
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
        await tx.configuracionConsultorio.create({
          data: {
            ...defaultData,
            ...dataToSave
          }
        });
      }
      
      // Procesar doctores si es necesario
      if ((seccion === 'consultorio' || seccion === 'completo') && datos.doctores && Array.isArray(datos.doctores)) {
        console.log(`Procesando ${datos.doctores.length} doctores...`);
        await procesarDoctoresOptimizado(tx, datos.doctores);
      }
      
      console.log('Transacción completada exitosamente');
      return true;
    }, {
      timeout: 50000 // 50 segundos de timeout para la transacción
    });
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
        TipoTurnoDoctor: {
          where: {
            habilitado: true
          },
          select: {
            id: true,
            nombre: true,
            duracion: true,
            habilitado: true,
            consultorios: true,
            publico: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });
    
    return doctores.map(doctor => ({
      ...doctor,
      agenda: doctor.AgendaDoctor || [],
      tiposTurno: doctor.TipoTurnoDoctor || [],
      AgendaDoctor: undefined,
      TipoTurnoDoctor: undefined
    })) || [];
  } catch (error) {
    console.error('Error al obtener doctores:', error);
    return [];
  }
};

/**
 * Obtiene la configuración específica para Consultorios
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
    const fs = await import('fs');
    // Verificar si el directorio existe
    if (!fs.existsSync(directorio)) {
      // Crear el directorio si no existe
      await fs.promises.mkdir(directorio, { recursive: true });
    }
  } catch (error) {
    console.error('Error al verificar o crear el directorio:', error);
  }
}
