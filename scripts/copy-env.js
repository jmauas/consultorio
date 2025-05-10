const fs = require('fs');
const path = require('path');

// Ruta al archivo .env en la carpeta padre
const parentEnvPath = path.resolve(__dirname, '../../.env');
// Ruta al archivo .env en la carpeta del proyecto
const projectEnvPath = path.resolve(__dirname, '../.env');

try {
  // Leer el archivo .env padre
  if (!fs.existsSync(parentEnvPath)) {
    console.error('El archivo .env en la carpeta padre no existe');
    process.exit(1);
  }

  const envContent = fs.readFileSync(parentEnvPath, 'utf8');
  
  // Crear o sobrescribir el archivo .env en el proyecto
  fs.writeFileSync(projectEnvPath, envContent);
  
  console.log('Variables de entorno copiadas correctamente');
} catch (error) {
  console.error('Error al copiar variables de entorno:', error);
  process.exit(1);
}