'use client';
import { useState, useEffect, Suspense } from 'react';
import TurnoDisponibilidad from '@/components/TurnoDisponibilidad';
import { useSearchParams } from 'next/navigation';
import Loader from '@/components/Loader';

const NuevoTurnoPage = () => {
    const searchParams = useSearchParams();
    const [dni, setDni] = useState(null);
    const [celular, setCelular] = useState(null);
    const [pacienteId, setPacienteId] = useState(null);  
  
    // Cargar datos iniciales
    useEffect(() => {
        // Verificar si hay parámetros de búsqueda en la URL
        const dniParam = searchParams.get('dni');
        const celularParam = searchParams.get('celular');
        const pacienteParam = searchParams.get('pacienteId');
        // Si hay parámetros, actualiza los estados
        dniParam && setDni(dniParam);
        celularParam && setCelular(celularParam);
        pacienteParam && setPacienteId(pacienteParam);
        
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

  return (
      <TurnoDisponibilidad 
        dniParam={dni}
        celularParam={celular}
        pacienteIdParam={pacienteId}  
      />
  );
}

export default function Page() {
  return (
  <Suspense fallback={<Loader titulo={'Cargando Datos Turno'} />}>
    <NuevoTurnoPage />
  </Suspense>
  )
};