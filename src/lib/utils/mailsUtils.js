/**
 * Valida si una dirección de correo electrónico tiene un formato válido
 * @param {string} email - La dirección de correo electrónico a validar
 * @returns {boolean} - true si el email es válido, false en caso contrario
 */
export function ValidarEmail(email) {
    // Expresión regular para validar emails
    // Valida formato general user@domain.extension
    // Permite caracteres alfanuméricos, puntos, guiones bajos, guiones y signos de más en la parte local
    // Requiere dominio con al menos un punto
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!email || typeof email !== 'string') {
      return '';
    }
    
    // Verificar longitud máxima (un email no debería superar los 254 caracteres según estándares)
    if (email.length > 254) {
      return '';
    }
    
    // Verificar el formato usando la expresión regular
    if (!emailRegex.test(email)) {
      return '';
    }
    
    // Verificar que la parte local no exceda 64 caracteres
    const localPart = email.split('@')[0];
    if (localPart.length > 64) {
      return '';
    }
    
    return normalizeEmail(email);
  }
  
  /**
   * Normaliza una dirección de correo electrónico (convierte a minúsculas)
   * @param {string} email - La dirección de correo electrónico a normalizar
   * @returns {string} - El email normalizado
   */
  export function normalizeEmail(email) {
    if (!email || typeof email !== 'string') {
      return '';
    }
    
    // Convertir a minúsculas
    return email.trim().toLowerCase();
  }