

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
  let timeOffset = 0;
  const isClient = typeof window !== 'undefined';
  if (isClient) {
    timeOffset = new Date().getTimezoneOffset() / 60;
  } else {
    timeOffset = 0; // En el servidor, asumimos UTC
  }
  console.log(timeOffset, 'timeOffset', isClient);
  agregar.forEach(f => {
      if (f.indexOf('|') >= 0) {
          let fecha1 = new Date(f.split('|')[0] + 'T00:00:00.000Z');
          let fecha2 = new Date(f.split('|')[1] + 'T00:00:00.000Z');
          while (fecha1 <= fecha2) {
              let f = new Date(fecha1);
              if (isClient) {
                  f.setHours(f.getHours() + timeOffset);
              }
              actual.push(f);
              fecha1.setDate(fecha1.getDate() + 1);
          }
      } else {
        let fecha1 = new Date(f + 'T00:00:00.000Z');
        if (isClient) {
          fecha1.setHours(fecha1.getHours() + timeOffset);
        }
        actual.push(fecha1);
      }
  });
  return actual;
}
