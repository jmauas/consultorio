import { randomBytes } from 'crypto';

/**
 * Genera un token aleatorio seguro
 * @param {number} length Longitud del token (por defecto 32)
 * @returns {string} Token generado
 */
export function generarToken(length = 32) {
  // Usar randomBytes para generar bytes aleatorios seguros
  const buffer = randomBytes(Math.ceil(length / 2));
  // Convertir a formato hexadecimal y limitar a la longitud deseada
  return buffer.toString('hex').slice(0, length);
}

/**
 * Genera una fecha de expiración para un token
 * @param {number} minutes Minutos para la expiración (por defecto 15)
 * @returns {Date} Fecha de expiración
 */
export function generarFechaExpiracion(minutes = 15) {
  const fecha = new Date();
  fecha.setMinutes(fecha.getMinutes() + minutes);
  return fecha;
}

/**
 * Verifica si una fecha de expiración es válida (no ha expirado)
 * @param {Date} fechaExpiracion Fecha de expiración a verificar
 * @returns {boolean} true si la fecha es válida (no ha expirado)
 */
export function verificarExpiracion(fechaExpiracion) {
  if (!fechaExpiracion) return false;
  
  const ahora = new Date();
  return ahora < fechaExpiracion;
}

/**
 * Compara dos tokens de forma segura (evita timing attacks)
 * @param {string} tokenA Primer token
 * @param {string} tokenB Segundo token
 * @returns {boolean} true si los tokens son iguales
 */
export function compararTokens(tokenA, tokenB) {
  if (!tokenA || !tokenB || tokenA.length !== tokenB.length) {
    return false;
  }
  
  // Comparación de tiempo constante para evitar timing attacks
  let diferencias = 0;
  for (let i = 0; i < tokenA.length; i++) {
    diferencias |= tokenA.charCodeAt(i) ^ tokenB.charCodeAt(i);
  }
  
  return diferencias === 0;
}