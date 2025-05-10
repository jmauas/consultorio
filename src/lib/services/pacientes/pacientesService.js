import { prisma } from '../../prisma';

/**
 * Busca un paciente por un filtro específico
 * @param {string} filter Campo por el que filtrar (dni, celular, nombre)
 * @param {string} dato Valor a buscar
 * @returns {Object} Objeto con información del paciente y sus turnos
 */
export const getPaciente = async (filter, dato) => {
  try {
    // Limpiar el dato para comparación
    dato = dato.replaceAll('.', '').replaceAll('-', '');
    dato = dato.toLowerCase();
    
    // Construir la consulta para buscar pacientes según el criterio
    let whereCondition = {};
    
    if (filter === 'nombre') {
      // Para búsqueda por nombre o apellido, usamos un OR y contains
      whereCondition = {
        OR: [
          { nombre: { contains: dato, mode: 'insensitive' } },
          { apellido: { contains: dato, mode: 'insensitive' } }
        ]
      };
    } else if (filter === 'celular') {
      // Para búsqueda por celular, usamos contains
      whereCondition[filter] = { contains: dato, mode: 'insensitive' };
    } else {
      // Para búsqueda por dni o celular, usamos equals
      whereCondition[filter] = dato;
    }

    // Buscar turnos en un rango de 90 días antes y después
    const fh1 = new Date();
    fh1.setDate(fh1.getDate() - 90);
    const fh2 = new Date();
    fh2.setDate(fh2.getDate() + 90);
    
    // Buscar pacientes en la base de datos con Prisma
    const pacientesDB = await prisma.paciente.findMany({
      where: whereCondition,
      include: {
        coberturaMedica: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        turnos: {
          where: {
            desde: { gte: fh1, lte: fh2 }
          },
          include: {
            doctor: true,
            consultorio: true,
            coberturaMedica: true,
          },
          orderBy: {
            desde: 'asc'
          }
        }
      },
    });

    
    // Si no se encontraron pacientes
    if (!pacientesDB || pacientesDB.length === 0) {
      return { ok: false, message: 'Paciente no encontrado' };

    } else {
      const pacientes = pacientesDB.map(p => ({
        ...p,
        asa: p.turnos.filter(t => t.penal === 'asa') > 0,
        ccr: p.turnos.filter(t => t.penal === 'ccr') > 0,
      }));
      return { ok: true, paciente: pacientes };
    };
  } catch (error) {
    console.error('Error al buscar paciente:', error);
    return { ok: false, message: error.message };
  }
};

/**
 * Guarda un paciente en la base de datos
 * @param {Object} paciente Datos del paciente a guardar
 * @param {string|null} userId ID del usuario que realiza la operación
 * @returns {boolean} Resultado de la operación
 */
export const savePaciente = async (paciente, userId = null) => {
  try {
    // Limpiar DNI si existe
    if (paciente.dni) {
      paciente.dni = paciente.dni.replaceAll('.', '').replaceAll('-', '').replaceAll(' ', '');
    }
    
    // Verificar si el paciente ya existe por DNI o celular
    const pacienteExistente = await prisma.paciente.findFirst({
      where: {
        OR: [
          { celular: paciente.celular },
          ...(paciente.dni ? [{ dni: paciente.dni }] : [])
        ]
      }
    });
    
    let resultado;

    const coberCod = await prisma.coberturaMedica.findFirst({
      where: {
        codigo: paciente.cobertura
      },
      select: {
        codigo: true
      }
    }) || pacienteExistente?.cobertura;
    
    // Si el paciente existe, actualizar sus datos
    if (pacienteExistente) {
      resultado = await prisma.paciente.update({
        where: { id: pacienteExistente.id },
        data: {
          nombre: paciente.nombre,
          apellido: paciente.apellido || '',
          dni: paciente.dni || pacienteExistente.dni,
          email: paciente.email || pacienteExistente.email,
          cobertura: coberCod,
          observaciones: paciente.observaciones || pacienteExistente.observaciones,
          updatedAt: new Date(),
          updatedById: userId // ID del usuario que actualiza
        }
      });
    } else {
      // Si el paciente no existe, crear uno nuevo
      resultado = await prisma.paciente.create({
        data: {
          nombre: paciente.nombre,
          apellido: paciente.apellido || '',
          dni: paciente.dni || null,
          celular: paciente.celular,
          email: paciente.email || null,
          cobertura: coberCod || null,
          observaciones: paciente.observaciones || null,
          updatedAt: new Date(),
          coberturaMedicaId: paciente.coberturaMedicaId || null,
          createdById: userId, // ID del usuario que crea
          updatedById: userId  // También establecemos el actualizador inicial
        }
      });
    }
    
    return resultado ? true : false;
    
  } catch (error) {
    console.error('Error al guardar paciente:', error);
    return false;
  }
};

/**
 * Busca pacientes según diferentes criterios (API)
 * @param {Object} params Parámetros de búsqueda (dni, celular, nombre, cobertura)
 * @returns {Object} Resultado de la búsqueda
 */
export const buscarPacientes = async (params) => {
  try {
    const { dni, celular, nombre, cobertura, sinTurnos } = params;
    const where = {};
    // Si tenemos filtro de cobertura, utilizamos una búsqueda más específica
    if (cobertura && cobertura !== 'todos') {
      // Construir condiciones de búsqueda
      const codigoCobertura = await prisma.coberturaMedica.findFirst({
        where: { id: cobertura },
        select: { codigo: true }
      });
       // Crear condiciones OR para cobertura
       const coberturaConditions = [
        { coberturaMedicaId: cobertura },
        { cobertura: { contains: codigoCobertura?.codigo || '', mode: 'insensitive' }}
      ];
      
      // Condición especial para Swiss Medical
      if (codigoCobertura?.codigo == 'sm') {
        coberturaConditions.push({ cobertura: { contains: 'swis', mode: 'insensitive' }});
      }
      
      where.OR = coberturaConditions;
    }  
    // Añadir otros filtros si existen
    if (dni) where.dni = { contains: dni, mode: 'insensitive' };
    if (celular) where.celular = { contains: celular, mode: 'insensitive' };
    // Condiciones para nombre o apellido
    if (nombre) {
      const nombreCondition = {
        OR: [
          { nombre: { contains: nombre, mode: 'insensitive' } },
          { apellido: { contains: nombre, mode: 'insensitive' }}
        ]
      };
      
      // Si ya tenemos condiciones de cobertura, debemos asegurarnos que ambos filtros se cumplan
      if (cobertura && cobertura !== 'todos') {
        // Convertimos la estructura a un AND de dos condiciones:
        // 1. La condición de cobertura (que ya es un OR de múltiples opciones)
        // 2. La condición de nombre (que es un OR entre nombre y apellido)
        where.AND = [
          { OR: where.OR }, // Las condiciones de cobertura existentes
          nombreCondition   // Las condiciones de nombre
        ];
        
        // Ya usamos las condiciones de cobertura en el AND, así que las eliminamos del nivel principal
        delete where.OR;
      } else {
        // Si no hay condición de cobertura, simplemente agregamos la condición de nombre
        where.OR = nombreCondition.OR;
      }
    }
    const include = {
      coberturaMedica: true
    }

    if (sinTurnos != 'true') {
      include.turnos = {
        where: {
          desde: { 
            gte: new Date(new Date().setDate(new Date().getDate() - 90)),
            lte: new Date(new Date().setDate(new Date().getDate() + 90))
          }
        },
        include: {
          doctor: true,
          consultorio: true,
          coberturaMedica: true,
        },
        orderBy: {
          desde: 'asc'
        }
      }
    }
    // Buscar pacientes con la cobertura específica
    const pacientes = await prisma.paciente.findMany({
      where: where,
      include: include,
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' }
      ]
    });
    
    if (!pacientes || pacientes.length === 0) {
      return { ok: false, message: 'No se encontraron pacientes con esos criterios' };
    }
      
    return { ok: true, pacientes: pacientes };
  } catch (error) {
    console.error('Error en búsqueda de pacientes:', error);
    return { ok: false, message: error.message };
  }
};

/**
 * Obtiene todos los pacientes de la base de datos
 * @returns {Array} Lista de pacientes
 */
export const obtenerTodosPacientes = async () => {
  try {
    const pacientes = await prisma.paciente.findMany({
      include: {
        coberturaMedica: true
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' }
      ]
    });
    
    return { ok: true, pacientes: pacientes };
  } catch (error) {
    console.error('Error al obtener todos los pacientes:', error);
    return { ok: false, message: error.message, pacientes: [] };
  }
};