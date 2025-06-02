import * as XLSX from 'xlsx';
import { formatoFecha } from '@/lib/utils/dateUtils';

export const handleExcelTurnos = async (data) => {
    const datos = data.map((item) => {
        const consul = desestructurarObjeto('consultorio', item.consultorio);
        const doc = desestructurarObjeto('doctor', item.doctor);
        const paciente = desestructurarObjeto('paciente', item.paciente);
        return {
            ...item,
            desde: item.desde ? formatoFecha(item.desde, false, false, false, false) : null,
            horaDesde: item.desde ? formatoFecha(item.desde, false, false, false, false, true) : null,
            hasta: item.hasta ? formatoFecha(item.hasta, false, false, false, false) : null,
            horaHasta: item.hasta ? formatoFecha(item.hasta, false, false, false, false, true) : null,
            ...consul,
            ...doc,
            ...paciente,
        }
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datos);
    XLSX.utils.book_append_sheet(wb, ws);
    XLSX.writeFile(wb, `turnos_${formatoFecha(new Date(), true, true, true, false).replaceAll(' ', '_')}.xlsx`)
}

export const handleExcel = async (data, nombre) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws);
    XLSX.writeFile(wb, `${nombre}.xlsx`)
}

const desestructurarObjeto = (nombre, objeto) => {
    const nuevoObjeto = {};
    for (const clave in objeto) {
        if (objeto.hasOwnProperty(clave)) {
            const valor = objeto[clave];
            if (typeof valor === 'object' && valor !== null) {
                nuevoObjeto[`${nombre} ${clave}`] = desestructurarObjeto(clave, valor);
            } else {
                nuevoObjeto[`${nombre} ${clave}`] = valor;
            }
        }
    }
    return nuevoObjeto;
}

