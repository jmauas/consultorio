

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
