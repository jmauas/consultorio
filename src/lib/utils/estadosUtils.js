/**
 * @returns {Array} Array de objetos con los estados de los turnos disponibles
 */
export function obtenerEstados() {
    return [
        { id: 'sin confirmar', nombre: 'Sin Confirmar', color: 'bg-yellow-100 border-yellow-500 text-yellow-700'},
        { id: 'confirmado', nombre: 'Confirmado', color: 'bg-blue-100 border-blue-500 text-blue-700'},
        { id: 'cancelado', nombre: 'Cancelado', color: 'bg-red-100 border-red-500 text-red-700'},
        { id: 'completo', nombre: 'Completo', color: 'bg-green-100 border-green-500 text-green-700'},
    ];
  }
