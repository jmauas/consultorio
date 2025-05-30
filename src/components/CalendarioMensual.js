"use client"

import React, { useState, useEffect } from 'react';
import { formatoFecha } from '@/lib/utils/dateUtils';

const CalendarioMensual = ({ fechaInicial, onFechaClick }) => {
    const [fechaActual, setFechaActual] = useState(fechaInicial || new Date());
    
    // Nombres de los meses
    const nombresMeses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    // Nombres de los días de la semana
    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    // Función para obtener los días del mes actual
    const obtenerDiasDelMes = () => {
        const año = fechaActual.getFullYear();
        const mes = fechaActual.getMonth();
        
        // Primer día del mes
        const primerDia = new Date(año, mes, 1);
        // Último día del mes
        const ultimoDia = new Date(año, mes + 1, 0);
        
        // Día de la semana del primer día (0 = domingo)
        const primerDiaSemana = primerDia.getDay();
        
        // Array para almacenar todos los días a mostrar
        const dias = [];
        
        // Agregar días del mes anterior para completar la primera semana
        for (let i = primerDiaSemana - 1; i >= 0; i--) {
            const fechaAnterior = new Date(año, mes, -i);
            dias.push({
                fecha: fechaAnterior,
                esDelMesActual: false,
                numero: fechaAnterior.getDate()
            });
        }
        
        // Agregar todos los días del mes actual
        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            const fecha = new Date(año, mes, dia);
            dias.push({
                fecha: fecha,
                esDelMesActual: true,
                numero: dia
            });
        }
        
        // Agregar días del mes siguiente para completar la última semana
        const diasRestantes = 42 - dias.length; // 6 semanas × 7 días = 42
        for (let dia = 1; dia <= diasRestantes; dia++) {
            const fechaSiguiente = new Date(año, mes + 1, dia);
            dias.push({
                fecha: fechaSiguiente,
                esDelMesActual: false,
                numero: dia
            });
        }
        
        return dias;
    };
    
    // Navegar al mes anterior
    const mesAnterior = () => {
        setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
    };
    
    // Navegar al mes siguiente
    const mesSiguiente = () => {
        setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));
    };
    
    // Manejar click en una fecha
    const manejarClickFecha = (diaObj) => {
        if (onFechaClick) {
            onFechaClick(diaObj.fecha);
        }
    };
    
    // Verificar si una fecha es hoy
    const esHoy = (fecha) => {
        const hoy = new Date();
        return fecha.getDate() === hoy.getDate() &&
               fecha.getMonth() === hoy.getMonth() &&
               fecha.getFullYear() === hoy.getFullYear();
    };
    
    // Verificar si una fecha es fin de semana
    const esFinDeSemana = (fecha) => {
        const dia = fecha.getDay();
        return dia === 0 || dia === 6; // Domingo o Sábado
    };
    
    const dias = obtenerDiasDelMes();
      return (
        <div className="bg-white dark:bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-lg p-2 sm:p-4">
            {/* Header del calendario */}
            <div className="flex items-center justify-between mb-2 sm:mb-4">
                <button
                    onClick={mesAnterior}
                    className="p-1 sm:p-2 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-secondary)] dark:hover:bg-gray-700 transition-colors text-sm"
                    title="Mes anterior"
                >
                    <i className="fa-solid fa-chevron-left"></i>
                </button>
                
                <h2 className="text-lg sm:text-xl font-bold text-[var(--text-color)] text-center flex-1 px-2">
                    {nombresMeses[fechaActual.getMonth()]} {fechaActual.getFullYear()}
                </h2>
                
                <button
                    onClick={mesSiguiente}
                    className="p-1 sm:p-2 rounded-lg border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-secondary)] dark:hover:bg-gray-700 transition-colors text-sm"
                    title="Mes siguiente"
                >
                    <i className="fa-solid fa-chevron-right"></i>
                </button>
            </div>
            
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 ">
                {nombresDias.map((dia) => (
                    <div
                        key={dia}
                        className="p-1 sm:p-2 text-center font-semibold text-[var(--color-primary)] text-xs sm:text-sm"
                    >
                        {dia}
                    </div>
                ))}
            </div>
            
            {/* Grid de días */}
            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {dias.map((diaObj, index) => {
                    const esHoyDia = esHoy(diaObj.fecha);
                    const esFinSemana = esFinDeSemana(diaObj.fecha);
                    
                    return (
                        <button
                            key={index}
                            onClick={() => manejarClickFecha(diaObj)}
                            className={`
                                p-1 sm:p-2 h-6 sm:h-8 text-center text-xs sm:text-sm rounded-lg transition-all duration-200
                                hover:scale-105 hover:shadow-md
                                ${diaObj.esDelMesActual 
                                    ? 'text-[var(--text-color)] hover:bg-[var(--color-primary)] hover:text-white' 
                                    : 'text-gray-400 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }
                                ${esHoyDia 
                                    ? 'bg-[var(--color-primary)] text-white font-bold ring-2 ring-[var(--color-primary)] ring-opacity-50' 
                                    : ''
                                }
                                ${esFinSemana && diaObj.esDelMesActual 
                                    ? 'bg-red-50 dark:bg-red-900 dark:bg-opacity-20' 
                                    : ''
                                }
                                ${!diaObj.esDelMesActual 
                                    ? 'opacity-50' 
                                    : ''
                                }
                            `}
                            title={`${formatoFecha(diaObj.fecha)} ${esFinSemana ? '(Fin de semana)' : ''}`}
                        >
                            {diaObj.numero}
                        </button>
                    );
                })}
            </div>
            
            {/* Leyenda */}
            <div className="mt-2 sm:mt-4 text-xs text-gray-600 dark:text-gray-400 flex flex-wrap gap-2 sm:gap-4 justify-center">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-[var(--color-primary)] rounded"></div>
                    <span>Hoy</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-200 dark:bg-red-900 rounded"></div>
                    <span>Fin de semana</span>
                </div>
            </div>
        </div>
    );
};

export default CalendarioMensual;
