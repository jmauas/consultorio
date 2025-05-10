/**
 * Coberturas médicas disponibles en el sistema
 * Esta función centraliza las coberturas médicas para poder reutilizarlas en diferentes partes de la aplicación
 * @returns {Array} Array de objetos con las coberturas médicas disponibles
 */
/**
 * Obtiene las coberturas médicas desde la base de datos
 * @returns {Promise<Array>} Promise que resuelve a un array de coberturas médicas
 */
export async function obtenerCoberturasDesdeDB() {
  try {
    const response = await fetch('/api/configuracion/coberturas-medicas');
    const data = await response.json();
    
    if (data.ok && data.coberturas) {
      // Añadir estilos a las coberturas basados en su nombre
      return data.coberturas
    } else {
      console.error('Error al obtener coberturas médicas:', data.error);
      return obtenerCoberturasDesdeDB();
    }
  } catch (error) {
    console.error('Error al obtener coberturas médicas:', error);
    return [];
  }
}

