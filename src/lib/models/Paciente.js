import { prisma } from '@/lib/prisma.js';

/**
 * Modelo para representar un paciente en el sistema
 * Adaptado para usar Prisma DB en lugar de archivos JSON
 */
export class Paciente {
  constructor({
    id,
    nombre,
    apellido = '',
    dni,
    celular,
    email = '',
    cobertura = '',
    observaciones = '',
    turnos = []
  }) {
    this.id = id || null;
    this.nombre = nombre || '';
    this.apellido = apellido || '';
    this.dni = this.formatDNI(dni);
    this.celular = this.formatCelular(celular);
    this.email = email || '';
    this.cobertura = cobertura || '';
    this.observaciones = observaciones || '';
    this.turnos = turnos || [];
  }

  /**
   * Formatea un número de celular para asegurar que tenga el prefijo correcto
   * @param {string} celular - Número de celular
   * @returns {string} - Número de celular formateado
   */
  formatCelular(celular) {
    if (!celular) return '';
    
    // Eliminar caracteres no numéricos
    const numeros = celular.replace(/\D/g, '');
    
    // Asegurarse que tenga el formato 549XXXXXXXXXX
    if (numeros.length > 3) {
      if (numeros.substring(0, 3) !== '549') {
        return '549' + numeros;
      }
    }
    return numeros;
  }

  /**
   * Formatea un DNI para eliminar caracteres no numéricos
   * @param {string} dni - Número de DNI
   * @returns {string} - DNI formateado
   */
  formatDNI(dni) {
    if (!dni) return '';
    return dni.toString().replace(/\D/g, '');
  }

  /**
   * Retorna el nombre completo del paciente
   * @returns {string} - Nombre completo
   */
  nombreCompleto() {
    return `${this.nombre} ${this.apellido}`.trim();
  }

  /**
   * Guarda el paciente en la base de datos
   * @param {string|null} userId - ID del usuario que realiza la operación
   * @returns {Promise<Object>} - Paciente guardado
   */
  async guardar(userId = null) {
    try {
      // Si tiene ID, actualizamos el paciente existente
      if (this.id) {
        return await prisma.paciente.update({
          where: { id: this.id },
          data: {
            nombre: this.nombre,
            apellido: this.apellido,
            dni: this.dni,
            celular: this.celular,
            email: this.email,
            cobertura: this.cobertura,
            observaciones: this.observaciones,
            updatedById: userId // Registramos el usuario que actualiza
          },
          include: {
            turnos: true
          }
        });
      } 
      // Si no tiene ID, creamos un nuevo paciente
      else {
        return await prisma.paciente.create({
          data: {
            nombre: this.nombre,
            apellido: this.apellido,
            dni: this.dni,
            celular: this.celular,
            email: this.email,
            cobertura: this.cobertura,
            observaciones: this.observaciones,
            createdById: userId, // Registramos el usuario que crea
            updatedById: userId  // También establecemos el actualizador inicial
          }
        });
      }
    } catch (error) {
      console.error('Error al guardar paciente:', error);
      throw new Error('No se pudo guardar el paciente');
    }
  }

  /**
   * Busca un paciente por ID
   * @param {string} id - ID del paciente
   * @returns {Promise<Paciente|null>} - Paciente encontrado o null
   */
  static async buscarPorId(id) {
    try {
      const paciente = await prisma.paciente.findUnique({
        where: { id },
        include: {
          turnos: true,
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
          }
        }
      });
      
      if (!paciente) return null;
      
      return new Paciente({
        id: paciente.id,
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        dni: paciente.dni,
        celular: paciente.celular,
        email: paciente.email,
        cobertura: paciente.cobertura,
        observaciones: paciente.observaciones,
        turnos: paciente.turnos
      });
    } catch (error) {
      console.error('Error al buscar paciente por ID:', error);
      return null;
    }
  }

  /**
   * Busca un paciente por DNI
   * @param {string} dni - DNI del paciente
   * @returns {Promise<Paciente|null>} - Paciente encontrado o null
   */
  static async buscarPorDNI(dni) {
    try {
      const dniFormateado = dni.toString().replace(/\D/g, '');
      
      const paciente = await prisma.paciente.findFirst({
        where: { dni: dniFormateado },
        include: {
          turnos: true
        }
      });
      
      if (!paciente) return null;
      
      return new Paciente({
        id: paciente.id,
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        dni: paciente.dni,
        celular: paciente.celular,
        email: paciente.email,
        cobertura: paciente.cobertura,
        observaciones: paciente.observaciones,
        turnos: paciente.turnos
      });
    } catch (error) {
      console.error('Error al buscar paciente por DNI:', error);
      return null;
    }
  }

  /**
   * Busca un paciente por número de celular
   * @param {string} celular - Número de celular del paciente
   * @returns {Promise<Paciente|null>} - Paciente encontrado o null
   */
  static async buscarPorCelular(celular) {
    try {
      // Formatea el celular para la búsqueda
      const formatearCelular = (cel) => {
        if (!cel) return '';
        const numeros = cel.replace(/\D/g, '');
        if (numeros.length > 3) {
          if (numeros.substring(0, 3) !== '549') {
            return '549' + numeros;
          }
        }
        return numeros;
      };
      
      const celularFormateado = formatearCelular(celular);
      
      const paciente = await prisma.paciente.findFirst({
        where: { celular: celularFormateado },
        include: {
          turnos: true
        }
      });
      
      if (!paciente) return null;
      
      return new Paciente({
        id: paciente.id,
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        dni: paciente.dni,
        celular: paciente.celular,
        email: paciente.email,
        cobertura: paciente.cobertura,
        observaciones: paciente.observaciones,
        turnos: paciente.turnos
      });
    } catch (error) {
      console.error('Error al buscar paciente por celular:', error);
      return null;
    }
  }

  /**
   * Lista todos los pacientes
   * @param {number} limite - Límite de resultados
   * @param {number} pagina - Página de resultados
   * @returns {Promise<Array<Paciente>>} - Lista de pacientes
   */
  static async listarTodos(limite = 100, pagina = 1) {
    try {
      const skip = (pagina - 1) * limite;
      
      const pacientes = await prisma.paciente.findMany({
        take: limite,
        skip: skip,
        orderBy: { nombre: 'asc' },
        include: {
          turnos: {
            orderBy: { desde: 'desc' },
            take: 5
          }
        }
      });
      
      return pacientes.map(p => new Paciente({
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        dni: p.dni,
        celular: p.celular,
        email: p.email,
        cobertura: p.cobertura,
        observaciones: p.observaciones,
        turnos: p.turnos
      }));
    } catch (error) {
      console.error('Error al listar pacientes:', error);
      return [];
    }
  }

  /**
   * Elimina un paciente por ID
   * @param {string} id - ID del paciente
   * @returns {Promise<boolean>} - true si se eliminó correctamente
   */
  static async eliminar(id) {
    try {
      await prisma.paciente.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error al eliminar paciente:', error);
      return false;
    }
  }

  /**
   * Busca pacientes por nombre, apellido o DNI
   * @param {string} texto - Texto a buscar
   * @returns {Promise<Array<Paciente>>} - Lista de pacientes
   */
  static async buscar(texto) {
    try {
      const pacientes = await prisma.paciente.findMany({
        where: {
          OR: [
            { nombre: { contains: texto, mode: 'insensitive' } },
            { apellido: { contains: texto, mode: 'insensitive' } },
            { dni: { contains: texto } },
            { celular: { contains: texto } }
          ]
        },
        include: {
          turnos: {
            orderBy: { desde: 'desc' },
            take: 5
          }
        },
        orderBy: { nombre: 'asc' }
      });
      
      return pacientes.map(p => new Paciente({
        id: p.id,
        nombre: p.nombre,
        apellido: p.apellido,
        dni: p.dni,
        celular: p.celular,
        email: p.email,
        cobertura: p.cobertura,
        observaciones: p.observaciones,
        turnos: p.turnos
      }));
    } catch (error) {
      console.error('Error al buscar pacientes:', error);
      return [];
    }
  }
}