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

  await prisma.tipoTurnoDoctor.deleteMany({});
  await prisma.agendaDoctor.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.verificationToken.deleteMany({});

    // Crear usuario administrador
  const adminUser = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@ejemplo.com',
      // Se puede agregar una contraseña hasheada si estás usando credenciales
      password: hashSync('adminpassword', 10),
      emailVerified: new Date(),
    },
  });

  console.log(`Usuario administrador creado con ID: ${adminUser.id}`);

  // Crear usuario de prueba
  const testUser = await prisma.user.create({
    data: {
      name: 'Usuario de Prueba',
      email: 'usuario@ejemplo.com',
      // Se puede agregar una contraseña hasheada si estás usando credenciales
      password: hashSync('userpassword', 10),
      emailVerified: new Date(),
    },
  });

  console.log(`Usuario de prueba creado con ID: ${testUser.id}`);

  // Migrar configuración desde config.json
  const configFilePath = path.join(process.cwd(), '../', 'locales', 'config.json');
  const configData = await readJsonFile(configFilePath);
  
    
    // Migrar doctores
    if (configData.doctores && Array.isArray(configData.doctores)) {
      for (const doctor of configData.doctores) {
        const doctorCreado = await prisma.doctor.create({
          data: {
            nombre: doctor.nombre,
            emoji: doctor.emoji,
            feriados: doctor.feriados || []
          }
        });
      
        
        // Migrar tipos de turno del doctor
        if (doctor.tiposTurno && Array.isArray(doctor.tiposTurno)) {
          for (const tipoTurno of doctor.tiposTurno) {
            await prisma.tipoTurnoDoctor.create({
              data: {
                doctorId: doctorCreado.id,
                nombre: tipoTurno.nombre,
                duracion: tipoTurno.duracion,
                habilitado: tipoTurno.habilitado
              }
            });
          }
        }
      }
      console.log(`${configData.doctores.length} doctores migrados correctamente`);
    }
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });