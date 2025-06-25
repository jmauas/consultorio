import { obtenerConfig } from '@/lib/services/configService.js';
import cron from 'node-cron';
const { prisma } = require('@/lib/prisma');
import { enviarRecordatorioTurno } from '@/lib/services/sender/whatsappService';
import { enviarMailConfTurno } from "@/lib/services/sender/resendService";

const config = await obtenerConfig();

let tareas = [];
let initialized = false; // Variable para controlar que solo se inicialice una vez

export const agendarEnvios = async () => {
    // Si ya fue inicializado, no ejecutar nuevamente
    if (initialized) {
        console.log(new Date().toLocaleString()+'  -  '+'Servicio ya inicializado anteriormente. No se volverá a iniciar.');
        return;
    }

    console.log(new Date().toLocaleString()+'  -  '+'Agendando Envios');
    try {
        if (tareas.length > 0) {
            console.log(new Date().toLocaleString()+'  -  '+'Tarea Ya Agendadas. Se aborta la creación de nueva tarea');
            console.log(new Date().toLocaleString()+'  -  '+tareas[0].options.name)
            return;
        }

        const { envio, horaEnvio, diasEnvio } = config;
        const { envioMail, horaEnvioMail, diasEnvioMail } = config;

        const sc = {
            scheduled: true,
            timezone: 'America/Argentina/Buenos_Aires',
            name: 'Envio Recordatorios'
        }
        // SEG MIN HORAS DIA_MES MES DIA_SEMANA
        // * TODOS LOS VALORES
        // ? CUALQUIER VALOR
        // , VALORES DE UNA LISTA
        // - RANGO DE VALORES
        // / INCREMENTOS DE UN INTERVALO
        //

        if (envio && envio == true) {
            const hr = horaEnvio.split(':')[0];
            const min = horaEnvio.split(':')[1];
            let tarea = cron.schedule(`0 ${min} ${hr} * * *`, () => {
                tareaEnvioWA(diasEnvio);                
            }, sc);
            tareas.push(tarea);
            console.log(new Date().toLocaleString()+'  -  '+'Tarea Agendada Envio Whatsapp');
        }

        if (envioMail && envioMail == true) {
            const hr = horaEnvioMail.split(':')[0];
            const min = horaEnvioMail.split(':')[1];
            let tarea = cron.schedule(`0 ${min} ${hr} * * *`, () => {
                tareaEnvioMail(diasEnvioMail);                
            }, sc);
            tareas.push(tarea);
            console.log(new Date().toLocaleString()+'  -  '+'Tarea Agendada Envio Mail');
        }

        initialized = true; // Marcar como inicializado después de completar
    } catch (error) {
        console.log(new Date().toLocaleString()+'  -  '+error)
    }
}

export const tareaEnvioWA = async (diasEnvio) => {
    console.log(new Date().toLocaleString()+'  -  '+'Ejecutando Tarea Envio Whatsapp', diasEnvio);
    try {
        const hoy = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
        hoy.setDate(hoy.getDate() + 1);
        const desde = new Date(hoy);
        desde.setHours(0, 0, 0, 0);
        hoy.setDate(hoy.getDate() + (Number(diasEnvio) -1));
        const hasta = new Date(hoy);
        hasta.setHours(23, 59, 59, 999);
        
        const turnos = await getTurnos(desde, hasta);
        
        console.log(new Date().toLocaleString()+'  -  '+'Turnos a notificar:', turnos.length);
        
        if (turnos.length === 0) {
            return;
        }
        
        // Procesar cada turno y enviar recordatorio
        for await (const turno of turnos) {
            try {
                const res = await enviarRecordatorioTurno(turno, false, true);
                // Esperar un breve tiempo entre envíos para evitar bloqueos de la API
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(new Date().toLocaleString()+'  -  '+`Error al procesar turno ${turno.id}: ${error}`);
            }
        }
        console.log(new Date().toLocaleString()+'  -  '+'Fin Ejecución Tarea Envio Whatsapp');
        
    } catch (error) {
        console.log(new Date().toLocaleString()+'  -  '+error)
    }
}

export const tareaEnvioMail = async (diasEnvio) => {
    console.log(new Date().toLocaleString()+'  -  '+'Ejecutando Tarea Envio Mails', diasEnvio);
    try {
        const hoy = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
        hoy.setDate(hoy.getDate() + 1);
        const desde = new Date(hoy);
        desde.setHours(0, 0, 0, 0);
        hoy.setDate(hoy.getDate() + (Number(diasEnvio) -1));
        const hasta = new Date(hoy);
        hasta.setHours(23, 59, 59, 999);
        
        const turnos = await getTurnos(desde, hasta);
        
        console.log(new Date().toLocaleString()+'  -  '+'Turnos a notificar:', turnos.length);
        
        if (turnos.length === 0) {
            return;
        }
        
        // Procesar cada turno y enviar recordatorio
        for await (const turno of turnos) {
            try {

                const res = await enviarMailConfTurno(turno);
                console.log(new Date().toLocaleString(), '  -  ', res);
                // Esperar un breve tiempo entre envíos para evitar bloqueos de la API
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(new Date().toLocaleString()+'  -  '+`Error al procesar turno ${turno.id}: ${error}`);
            }
        }
        console.log(new Date().toLocaleString()+'  -  '+'Fin Ejecución Tarea Envio Mail');
    } catch (error) {
        console.log(new Date().toLocaleString()+'  -  '+error)
    }
}


const getTurnos = async (desde, hasta) => { 
    // Buscar los turnos no cancelados para la fecha indicada
    const turnos = await prisma.turno.findMany({
        where: {
            desde: {
                gte: desde,
                lte: hasta
            },
            estado: {
                not: 'cancelado'
            }
        },
        include: {
            paciente: true,
            doctor: true,
            coberturaMedica: true,
            consultorio: true,
        }
    });
    return turnos;
}


