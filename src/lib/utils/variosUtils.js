

// Función para determinar si un color es claro u oscuro para el texto
export const isColorLight = (color) => {
  // Si no hay color, asumimos que es claro
  if (!color) return true;

  // Convertir el color hex a RGB
  let r, g, b;
  if (color.startsWith('#')) {
    const hex = color.substring(1);
    r = parseInt(hex.substr(0, 2), 16);
    g = parseInt(hex.substr(2, 2), 16);
    b = parseInt(hex.substr(4, 2), 16);
  } else {
    // Si no es hex, asumimos que es claro
    return true;
  }
  // Calcular la luminosidad (percepción humana del brillo)
  // Fórmula: https://www.w3.org/TR/WCAG20-TECHS/G17.html
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Si la luminosidad es mayor que 0.5, el color es claro
  return luminance > 0.5;
}

export const agregarFeriados = (actual, agregar) => {
  if (!actual) actual = [];
  if (!agregar || agregar.lenght === 0) return actual;
  agregar.forEach(f => {
      if (f.indexOf('|') >= 0) {
          let fecha1 = new Date(f.split('|')[0] + 'T00:00:00.000Z');
          let fecha2 = new Date(f.split('|')[1] + 'T00:00:00.000Z');
          while (fecha1 <= fecha2) {
              actual.push(new Date(fecha1));
              fecha1.setDate(fecha1.getDate() + 1);
          }
      } else {
        let fecha1 = new Date(f + 'T00:00:00.000Z');
        actual.push(fecha1);
      }
  });
  return actual;
}
