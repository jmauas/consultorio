import { prisma } from '../prisma';

/**
 * Modelo para representar un turno médico
 * Adaptado para usar Prisma DB en lugar de archivos JSON
 */
export class Turno {
  constructor({
    id,
    desde,
    hasta,
    doctor,
    emoji,
    servicio,
    duracion = 30,
    pacienteId,
    paciente,
    confirmado = false,
    estado = 'sin confirmar',
    fhCambioEstado = null,
    hsAviso = null,
    penal = null,
    tipoDeTurnoId = null, // Nuevo campo tipoDeTurnoId
    tipoDeTurno = null    // Objeto relacionado
  }) {
    this.id = id || null;
    this.desde = desde ? new Date(desde) : null;
    this.hasta = hasta ? new Date(hasta) : null;
    this.doctor = doctor || '';
    this.emoji = emoji || '🦷';
    this.servicio = servicio || '';
    this.duracion = duracion || 30;
    this.pacienteId = pacienteId || null;
    this.paciente = paciente || null;
    this.confirmado = confirmado || false;
    this.estado = estado || 'sin confirmar';
    this.fhCambioEstado = fhCambioEstado ? new Date(fhCambioEstado) : null;
    this.hsAviso = hsAviso || null;
    this.penal = penal || null;
    this.tipoDeTurnoId = tipoDeTurnoId || null; // Nuevo campo tipoDeTurnoId
    this.tipoDeTurno = tipoDeTurno || null; // Objeto relacionado
  }

  /**
   * Actualiza el estado del turno
   * @param {string} nuevoEstado - Nuevo estado del turno
   * @param {string|null} userId - ID del usuario que realiza la operación
   */
  async actualizarEstado(nuevoEstado, userId = null) {
    this.estado = nuevoEstado;
    this.fhCambioEstado = new Date();
    
    // Si se cancela, calcular el tiempo de aviso
    if (nuevoEstado === 'cancelado') {
      const ahora = new Date();
      const diffInMs = this.desde - ahora;
      const diffInHours = diffInMs / 1000 / 60 / 60;
      
      this.hsAviso = diffInHours.toString();
      
      if (diffInHours <= 0) {
        this.penal = 'asa'; // Aviso Sin Antelación
      } else if (diffInHours < 48) {
        this.penal = 'ccr'; // Cancelación Con Recargo
      }
    }
    
    // Guardar en la base de datos
    if (this.id) {
      await prisma.turno.update({
        where: { id: this.id },
        data: {
          estado: this.estado,
          fhCambioEstado: this.fhCambioEstado,
          hsAviso: this.hsAviso,
          penal: this.penal,
          updatedById: userId // Registramos el usuario que actualiza
        }
      });
    }
  }

  /**
   * Guarda el turno en la base de datos
   * @param {string|null} userId - ID del usuario que realiza la operación
   * @returns {Promise<Object>} - Turno guardado
   */
  async guardar(userId = null) {
    try {
      // Si tiene ID, actualizamos el turno existente
      if (this.id) {
        return await prisma.turno.update({
          where: { id: this.id },
          data: {
            desde: this.desde,
            hasta: this.hasta,
            doctor: this.doctor,
            emoji: this.emoji,
            servicio: this.servicio,
            duracion: typeof this.duracion === 'string' ? parseInt(this.duracion) : this.duracion,
            pacienteId: this.pacienteId,
            confirmado: this.confirmado,
            estado: this.estado,
            fhCambioEstado: this.fhCambioEstado,
            hsAviso: this.hsAviso,
            penal: this.penal,
            tipoDeTurnoId: this.tipoDeTurnoId, // Nuevo campo tipoDeTurnoId
            updatedById: userId // Registramos el usuario que actualiza
          },
          include: {
            paciente: true,
            tipoDeTurno: true // Incluir tipo de turno en la respuesta
          }
        });
      } 
      // Si no tiene ID, creamos un nuevo turno
      else {
        return await prisma.turno.create({
          data: {
            desde: this.desde,
            hasta: this.hasta,
            doctor: this.doctor,
            emoji: this.emoji,
            servicio: this.servicio,
            duracion: typeof this.duracion === 'string' ? parseInt(this.duracion) : this.duracion,
            pacienteId: this.pacienteId,
            confirmado: this.confirmado,
            estado: this.estado,
            fhCambioEstado: this.fhCambioEstado,
            hsAviso: this.hsAviso,
            penal: this.penal,
            tipoDeTurnoId: this.tipoDeTurnoId, // Nuevo campo tipoDeTurnoId
            createdById: userId, // Registramos el usuario que crea
            updatedById: userId  // También establecemos el actualizador inicial
          },
          include: {
            paciente: true,
            tipoDeTurno: true // Incluir tipo de turno en la respuesta
          }
        });
      }
    } catch (error) {
      console.error('Error al guardar turno:', error);
      throw new Error('No se pudo guardar el turno');
    }
  }

  /**
   * Busca un turno por ID
   * @param {string} id - ID del turno
   * @returns {Promise<Turno|null>} - Turno encontrado o null
   */
  static async buscarPorId(id) {
    try {
      const turno = await prisma.turno.findUnique({
        where: { id },
        include: {
          paciente: true,
          tipoDeTurno: true, // Incluir el tipo de turno
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
      
      if (!turno) return null;
      
      return new Turno({
        id: turno.id,
        desde: turno.desde,
        hasta: turno.hasta,
        doctor: turno.doctor,
        emoji: turno.emoji,
        servicio: turno.servicio,
        duracion: turno.duracion,
        pacienteId: turno.pacienteId,
        paciente: turno.paciente,
        confirmado: turno.confirmado,
        estado: turno.estado,
        fhCambioEstado: turno.fhCambioEstado,
        hsAviso: turno.hsAviso,
        penal: turno.penal,
        tipoDeTurnoId: turno.tipoDeTurnoId, // Nuevo campo tipoDeTurnoId
        tipoDeTurno: turno.tipoDeTurno // Objeto relacionado
      });
    } catch (error) {
      console.error('Error al buscar turno por ID:', error);
      return null;
    }
  }

  /**
   * Lista todos los turnos
   * @param {Object} filtros - Filtros para la consulta
   * @returns {Promise<Array<Turno>>} - Lista de turnos
   */
  static async listarTodos(filtros = {}) {
    try {
      const { desde, hasta, doctor, pacienteId, estado, tipoDeTurnoId, pagina = 1, limite = 100 } = filtros;
      
      const where = {};
      
      if (desde) {
        where.desde = { gte: new Date(desde) };
      }
      
      if (hasta) {
        where.hasta = { lte: new Date(hasta) };
      }
      
      if (doctor) {
        where.doctor = doctor;
      }
      
      if (pacienteId) {
        where.pacienteId = pacienteId;
      }
      
      if (estado) {
        where.estado = estado;
      }
      
      if (tipoDeTurnoId) {
        where.tipoDeTurnoId = tipoDeTurnoId; // Filtrar por tipo de turno si se especifica
      }
      
      const skip = (pagina - 1) * limite;
      
      const turnos = await prisma.turno.findMany({
        where,
        include: {
          paciente: true,
          tipoDeTurno: true // Incluir el tipo de turno
        },
        orderBy: { desde: 'asc' },
        skip,
        take: limite
      });
      
      return turnos.map(t => new Turno({
        id: t.id,
        desde: t.desde,
        hasta: t.hasta,
        doctor: t.doctor,
        emoji: t.emoji,
        servicio: t.servicio,
        duracion: t.duracion,
        pacienteId: t.pacienteId,
        paciente: t.paciente,
        confirmado: t.confirmado,
        estado: t.estado,
        fhCambioEstado: t.fhCambioEstado,
        hsAviso: t.hsAviso,
        penal: t.penal,
        tipoDeTurnoId: t.tipoDeTurnoId, // Nuevo campo tipoDeTurnoId
        tipoDeTurno: t.tipoDeTurno // Objeto relacionado
      }));
    } catch (error) {
      console.error('Error al listar turnos:', error);
      return [];
    }
  }

  /**
   * Obtiene los turnos de un período específico
   * @param {Date} desde - Fecha de inicio
   * @param {Date} hasta - Fecha de fin
   * @param {string} doctor - Nombre del doctor (opcional)
   * @returns {Promise<Array<Turno>>} - Lista de turnos
   */
  static async obtenerTurnosPeriodo(desde, hasta, doctor = null) {
    try {
      const where = {
        desde: { gte: new Date(desde) },
        hasta: { lte: new Date(hasta) }
      };
      
      if (doctor) {
        where.doctor = doctor;
      }
      
      const turnos = await prisma.turno.findMany({
        where,
        include: {
          paciente: true,
          tipoDeTurno: true // Incluir el tipo de turno
        },
        orderBy: { desde: 'asc' }
      });
      
      return turnos.map(t => new Turno({
        id: t.id,
        desde: t.desde,
        hasta: t.hasta,
        doctor: t.doctor,
        emoji: t.emoji,
        servicio: t.servicio,
        duracion: t.duracion,
        pacienteId: t.pacienteId,
        paciente: t.paciente,
        confirmado: t.confirmado,
        estado: t.estado,
        fhCambioEstado: t.fhCambioEstado,
        hsAviso: t.hsAviso,
        penal: t.penal,
        tipoDeTurnoId: t.tipoDeTurnoId, // Nuevo campo tipoDeTurnoId
        tipoDeTurno: t.tipoDeTurno // Objeto relacionado
      }));
    } catch (error) {
      console.error('Error al obtener turnos del período:', error);
      return [];
    }
  }

  /**
   * Elimina un turno por ID
   * @param {string} id - ID del turno
   * @returns {Promise<boolean>} - true si se eliminó correctamente
   */
  static async eliminar(id) {
    try {
      await prisma.turno.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error al eliminar turno:', error);
      return false;
    }
  }
}