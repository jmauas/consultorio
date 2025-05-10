import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * Obtiene todos los usuarios
 * @returns {Promise<{ok: boolean, users?: Array, error?: string}>} Resultado de la operación
 */
export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        enabled: true,
        tokenExpires: true,
        // No incluimos el token ni password por seguridad
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    return { ok: true, users };
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
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        enabled: true,
        tokenExpires: true,
        // No incluimos el token ni password por seguridad
      }
    });
    
    if (!user) {
      return { ok: false, message: 'Usuario no encontrado' };
    }
    
    return { ok: true, user };
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
    
    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        enabled: userData.enabled ?? true,
        token: userData.token,
        tokenExpires: userData.tokenExpires,
        image: userData.image,
      },
      select: {
        id: true,
        name: true,
        email: true,
        enabled: true,
        tokenExpires: true,
        image: true,
      }
    });
    
    return { ok: true, user };
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
    
    // Encriptar contraseña si se proporciona una nueva
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      // Si no se proporciona una nueva contraseña, eliminamos el campo para no actualizarlo
      delete updateData.password;
    }
    
    // Actualizar usuario
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        enabled: true,
        tokenExpires: true,
        image: true,
      }
    });
    
    return { ok: true, user };
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return { ok: false, error: error.message };
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
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        enabled: true,
        tokenExpires: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    return { ok: true, users };
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