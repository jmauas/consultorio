"use server";
import { prisma } from '@/lib/prisma';

export const getTurnoById = async (id) => {
    try {
        const turno = await prisma.turno.findUnique({
        where: { id },
        include: {
            paciente: true,
            consultorio: true,
            doctor: true,
            coberturaMedica: true,
        },
        });
        return turno;
    } catch (error) {
        console.error('Error al obtener el turno:', error);
        return null;
    }
}