'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TurnoNuevo from '@/components/TurnoNuevo';
import Loader from '@/components/Loader';

const  NuevoTurnoPage = () => {
  const searchParams = useSearchParams();
  // Creo los estados para cada uno de los parametros que voy a leer
  const [desde, setDesde] = useState(null);
  const [duracion, setDuracion] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [tipoTurnoId, setTipoTurnoId] = useState(null);
  const [dni, setDni] = useState(null);
  const [celular, setCelular] = useState(null);
  const [pacienteId, setPacienteId] = useState(null);   

  // Cargar datos iniciales
  useEffect(() => {   
      try {              
        // params para pasarle al componente
        const desdeParam = searchParams.get('desde');
        const duracionParam = searchParams.get('duracion');
        const doctorIdParam = searchParams.get('doctorId');
        const tipoTurnoIdParam = searchParams.get('tipoTurnoId');
        const dniParam = searchParams.get('dni');
        const celularParam = searchParams.get('celular');
        const pacienteIdParam = searchParams.get('pacienteId');;
        // Seteo los estados, si hay parametros
        desdeParam && setDesde(desdeParam);
        duracionParam && setDuracion(duracionParam);
        doctorIdParam && setDoctorId(doctorIdParam);
        tipoTurnoIdParam && setTipoTurnoId(tipoTurnoIdParam);
        dniParam && setDni(dniParam);
        celularParam && setCelular(celularParam);
        pacienteIdParam && setPacienteId(pacienteIdParam);
        
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar configuración');
        setLoading(false);
      }   
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (   
      <TurnoNuevo 
        desdeParam={desde}
        duracionParam={duracion}
        doctorIdParam={doctorId}
        tipoTurnoIdParam={tipoTurnoId}
        dniParam={dni}
        celularParam={celular}
        pacienteIdParam={pacienteId}
      />   
  )
}

 export default function Page() {
  return (
    <Suspense fallback={<Loader titulo={'Cargando Datos Turno'} />}>
      <NuevoTurnoPage />
    </Suspense>
  );
}

