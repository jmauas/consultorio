import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Modelo de perfiles de usuario
 * @type {Array<{id: number, nombre: string, emoji: string}>}
 */
export const PERFILES_USUARIO = [
  { id: 1, nombre: 'Asistente', emoji: '👨‍⚕️' },
  { id: 50, nombre: 'Recepcionista', emoji: '👩‍💼' },
  { id: 100, nombre: 'Administrador', emoji: '👑' }
];

/**
 * Obtiene todos los perfiles de usuario disponibles
 * @returns {Array<{id: number, nombre: string, emoji: string}>} Lista de perfiles
 */
export function getPerfilesUsuario() {
  return PERFILES_USUARIO;
}

/**
 * Obtiene todos los usuarios
 * @returns {Promise<{ok: boolean, users?: Array, error?: string}>} Resultado de la operación
 */
export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        doctores: true
      },
      orderBy: {
        name: 'asc',
      },
    });

     // Filtrar la información sensible como tokens y contraseñas
    const filteredUsers = users.map(user => {
      const { password, token, ...userData } = user;
      return {
        ...userData,
        doctores: user.doctores // Aseguramos que la relación con doctores se mantenga
      };
    });
    
    return { ok: true, users: filteredUsers };
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Obtiene un usuario por su ID
 * @param {string} id ID del usuario
 * @returns {Promise<{ok: boolean, user?: Object, message?: string, error?: string}>} Resultado de la operación
 */
export async function getUserById(id) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        doctores: true
      }
    });
    
    if (!user) {
      return { ok: false, message: 'Usuario no encontrado' };
    }
      // Eliminar datos sensibles
    const { password, token, ...userData } = user;
    
    return { ok: true, user: {
      ...userData,
      doctores: user.doctores // Aseguramos que la relación con doctores se mantenga
    } };
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Crea un nuevo usuario
 * @param {Object} userData Datos del usuario
 * @returns {Promise<{ok: boolean, user?: Object, message?: string, error?: string}>} Resultado de la operación
 */
export async function createUser(userData) {
  try {
     // Verificar si el correo ya está en uso
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    
    if (existingUser) {
      return { ok: false, message: 'El correo electrónico ya está en uso' };
    }
    
    // Encriptar contraseña usando el mismo método que NextAuth
    let hashedPassword = null;
    if (userData.password) {
      hashedPassword = await bcrypt.hash(userData.password, 10);
    }
    
    // Guardar los doctoresIds antes de eliminarlos del objeto userData
    const doctoresIds = userData.doctoresIds && Array.isArray(userData.doctoresIds) 
      ? [...userData.doctoresIds] 
      : [];
    
    // Eliminar el campo doctoresIds para que no interfiera con la creación
    delete userData.doctoresIds;
    
    // Crear usuario (sin relaciones doctores primero)
    let user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        enabled: userData.enabled ?? true,
        token: userData.token,
        tokenExpires: userData.tokenExpires,
        image: userData.image,
        perfil: userData.perfil ?? 1,
      },
    });
    
    // Si hay doctores para conectar, actualiza el usuario con esas relaciones
    if (doctoresIds.length > 0) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          doctores: {
            connect: doctoresIds.map(doctorId => ({ id: doctorId }))
          }
        },
        include: {
          doctores: true
        }
      });
    } else {
      // Si no hay doctores, aún necesitamos cargar la relación vacía
      user = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          doctores: true
        }
      });
    }
    
    // Eliminar datos sensibles
    const { password, token, ...userDataWithoutSensitive } = user;
    
    return { 
      ok: true, 
      user: {
        ...userDataWithoutSensitive,
        doctores: user.doctores 
      } 
    };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Actualiza un usuario existente
 * @param {string} id ID del usuario
 * @param {Object} userData Datos del usuario
 * @returns {Promise<{ok: boolean, user?: Object, message?: string, error?: string}>} Resultado de la operación
 */
export async function updateUser(id, userData) {
  try {
    // Verificar si el usuario existe
    const userExists = await prisma.user.findUnique({
      where: { id },
      include: {
        doctores: true
      }
    });
    
    if (!userExists) {
      return { ok: false, message: 'Usuario no encontrado' };
    }
    
    // Verificar si está actualizando el correo a uno que ya existe
    if (userData.email && userData.email !== userExists.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      
      if (emailExists) {
        return { ok: false, message: 'El correo electrónico ya está en uso por otro usuario' };
      }
    }
    
     // Preparar datos para la actualización
    const updateData = { ...userData };
    
    // Guardar los doctoresIds antes de eliminarlos
    const doctoresIds = userData.doctoresIds !== undefined 
      ? (Array.isArray(userData.doctoresIds) ? [...userData.doctoresIds] : []) 
      : undefined;
    
    // Eliminar el campo doctoresIds para la actualización básica
    delete updateData.doctoresIds;
    
    // Encriptar contraseña si se proporciona una nueva
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }
    
    // Actualizar usuario con sus datos básicos
    let user = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    
    // Solo actualizar las relaciones de doctores si se proporcionaron
    if (doctoresIds !== undefined) {
      user = await prisma.user.update({
        where: { id },
        data: {
          doctores: {
            // Primero desconectar todos los doctores existentes
            set: [],
            // Luego conectar los nuevos
            connect: doctoresIds.map(doctorId => ({ id: doctorId }))
          }
        },
        include: {
          doctores: true
        }
      });
    } else {
      // Si no actualizamos doctores, aún necesitamos cargarlos
      user = await prisma.user.findUnique({
        where: { id },
        include: {
          doctores: true
        }
      });
    }
    
    // Eliminar datos sensibles
    const { password, token, ...userDataWithoutSensitive } = user;
     
    return { ok: true, user: {
      ...userDataWithoutSensitive,
      doctores: user.doctores // Aseguramos que la relación con doctores se mantenga
    } };
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    // Proporcionar más información sobre el error
    let errorMessage = error.message;
    if (error.code) {
      // Errores específicos de Prisma
      switch (error.code) {
        case 'P2002':
          errorMessage = `Valor duplicado para ${error.meta?.target?.join(', ')}`;
          break;
        case 'P2003':
          errorMessage = `Error de restricción de clave foránea en ${error.meta?.field_name}`;
          break;
        case 'P2025':
          errorMessage = 'Registro no encontrado';
          break;
        default:
          errorMessage = `${error.code}: ${error.message}`;
      }
    }
    return { 
      ok: false, 
      error: errorMessage,
      details: error
    };
  }
}

/**
 * Elimina un usuario
 * @param {string} id ID del usuario a eliminar
 * @returns {Promise<{ok: boolean, message?: string, error?: string}>} Resultado de la operación
 */
export async function deleteUser(id) {
  try {
    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { id },
    });
    
    if (!user) {
      return { ok: false, message: 'Usuario no encontrado' };
    }
    
    // Eliminar usuario
    await prisma.user.delete({
      where: { id },
    });
    
    return { ok: true, message: 'Usuario eliminado correctamente' };
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Busca usuarios por nombre o correo
 * @param {string} query Texto de búsqueda
 * @returns {Promise<{ok: boolean, users?: Array, error?: string}>} Resultado de la operación
 */
export async function searchUsers(query) {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        doctores: true
      },
      orderBy: {
        name: 'asc',
      },
    });
      // Filtrar la información sensible
    const filteredUsers = users.map(user => {
      const { password, token, ...userData } = user;
      return {
        ...userData,
        doctores: user.doctores // Aseguramos que la relación con doctores se mantenga
      };
    });
    
    return { ok: true, users: filteredUsers };
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Genera un token de recuperación de contraseña
 * @param {string} email Correo del usuario
 * @returns {Promise<{ok: boolean, message?: string, error?: string}>} Resultado de la operación
 */
export async function generatePasswordResetToken(email) {
  try {
    // Verificar si existe un usuario con ese correo
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return { ok: false, message: 'No existe un usuario con ese correo' };
    }
    
    // Importar la función generadora de tokens
    const { generarToken } = await import('@/lib/utils/tokenUtils');
    
    // Generar un token de 50 caracteres
    const token = generarToken(50);
    
    // Establecer fecha de expiración (15 minutos)
    const tokenExpires = new Date();
    tokenExpires.setMinutes(tokenExpires.getMinutes() + 15);
    
    // Actualizar usuario con el token generado
    await prisma.user.update({
      where: { email },
      data: {
        token,
        tokenExpires,
      },
    });
    
    return { 
      ok: true, 
      message: 'Token generado correctamente',
      email: user.email,
      token,
      expires: tokenExpires
    };
  } catch (error) {
    console.error('Error al generar token:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Valida un token de recuperación de contraseña
 * @param {string} email Correo del usuario
 * @param {string} token Token a validar
 * @returns {Promise<{ok: boolean, valid: boolean, message?: string, error?: string}>} Resultado de la operación
 */
export async function validatePasswordResetToken(email, token) {
  try {
    // Buscar usuario por correo
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return { ok: true, valid: false, message: 'Usuario no encontrado' };
    }
    
    // Verificar si el token existe y no ha expirado
    if (!user.token || !user.tokenExpires) {
      return { ok: true, valid: false, message: 'No hay un token válido para este usuario' };
    }
    
    // Verificar si el token coincide
    if (user.token !== token) {
      return { ok: true, valid: false, message: 'Token inválido' };
    }
    
    // Verificar si el token ha expirado
    const now = new Date();
    if (now > user.tokenExpires) {
      return { ok: true, valid: false, message: 'Token expirado' };
    }
    
    return { ok: true, valid: true, userId: user.id };
  } catch (error) {
    console.error('Error al validar token:', error);
    return { ok: false, valid: false, error: error.message };
  }
}

/**
 * Actualiza la contraseña de un usuario usando un token de recuperación
 * @param {string} email Correo del usuario
 * @param {string} token Token de recuperación
 * @param {string} newPassword Nueva contraseña
 * @returns {Promise<{ok: boolean, message?: string, error?: string}>} Resultado de la operación
 */
export async function resetPassword(email, token, newPassword) {
  try {
    // Primero validar el token
    const validation = await validatePasswordResetToken(email, token);
    
    if (!validation.ok || !validation.valid) {
      return { 
        ok: false, 
        message: validation.message || 'Token inválido o expirado' 
      };
    }
    
    // Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Actualizar la contraseña y limpiar el token
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        token: null,
        tokenExpires: null,
      },
    });
    
    return { ok: true, message: 'Contraseña actualizada correctamente' };
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    return { ok: false, error: error.message };
  }
}