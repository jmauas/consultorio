import { prisma } from '@/lib/prisma.js';
import { hashSync } from 'bcryptjs';
import fs from 'node:fs/promises';
import path from 'node:path';


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
  await prisma.turno.deleteMany({});
  await prisma.paciente.deleteMany({});
  await prisma.tipoTurnoDoctor.deleteMany({});
  await prisma.agendaDoctor.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.configuracionConsultorio.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.verificationToken.deleteMany({});

  console.log('Datos previos eliminados.');

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
  
  if (configData) {
    const configuracion = await prisma.configuracionConsultorio.create({
      data: {
        nombreConsultorio: configData.nombreConsultorio,
        domicilio: configData.domicilio,
        telefono: configData.telefono,
        mail: configData.mail,
        horarioAtencion: configData.horarioAtencion,
        web: configData.web || '',
        limite: new Date(configData.limite),
        feriados: configData.feriados || [],
        envio: configData.envio || false,
        horaEnvio: configData.horaEnvio,
        diasEnvio: configData.diasEnvio,
        urlApp: configData.urlApp,
        coberturas: configData.coberturas || '',
      }
    });
    
    console.log(`Configuración de consultorio creada con ID: ${configuracion.id}`);
    
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
  
  // Migrar pacientes y turnos
  const pacientesFilePath = path.join(process.cwd(), '../', 'locales', 'pacientes.json');
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
            observaciones: turnoData.observaciones || ''
          }
        });
        
        pacienteId = paciente.id;
        pacientesMap.set(pacienteKey, pacienteId);
      }
    }
    
    console.log(`${pacientesMap.size} pacientes migrados correctamente`);
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