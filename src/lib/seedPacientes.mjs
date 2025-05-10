import { PrismaClient } from '../generated/prisma/index.js';
import { hashSync } from 'bcryptjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const prisma = new PrismaClient();

async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error leyendo el archivo ${filePath}:`, error);
    return null;
  }
}

async function main() {
  console.log('Iniciando seed de la base de datos...');

  // Eliminar datos existentes (opcional)

  await prisma.paciente.deleteMany({});
  await prisma.turno.deleteMany({});

  console.log('Datos previos eliminados.');

  
  // Migrar pacientes y turnos
  const pacientesFilePath = path.join(process.cwd(), 'locales', 'pacientes.json');
  const pacientesData = await readJsonFile(pacientesFilePath);
  
  if (pacientesData && Array.isArray(pacientesData)) {
    const pacientesMap = new Map(); // Para almacenar la relación DNI+Celular -> ID
    
    for (const turnoData of pacientesData) {
      if (!turnoData.nombre || !turnoData.celular) continue;
      
      // Clave única para identificar pacientes (dni+celular)
      const pacienteKey = `${turnoData.dni || ''}-${turnoData.celular}`;
      
      let pacienteId;
      
      // Verificar si el paciente ya existe
      if (pacientesMap.has(pacienteKey)) {
        pacienteId = pacientesMap.get(pacienteKey);
      } else {
        // Crear nuevo paciente
        const paciente = await prisma.paciente.create({
          data: {
            nombre: turnoData.nombre,
            apellido: turnoData.apellido || '',
            dni: turnoData.dni || '',
            celular: turnoData.celular,
            email: turnoData.email || '',
            cobertura: turnoData.cobertura || '',
            observaciones: turnoData.observaciones || '',
            updatedAt: new Date(),
          }
        });
        
        pacienteId = paciente.id;
        pacientesMap.set(pacienteKey, pacienteId);
      }
    }
    
    console.log(`${pacientesMap.size} pacientes migrados correctamente`);
    console.log(`Turnos migrados correctamente`);
  }
  
  console.log('Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });