"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Loader from '@/components/Loader';
import { formatoFecha } from '@/lib/utils/dateUtils';

export default function ConfirmarTurnoPage({ }) {
  const params = useParams();
  const router = useRouter();
  const token = params.token;  const [turno, setTurno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  
  // Verificar el token y confirmar automáticamente si es posible
  useEffect(() => {
    const verificarYConfirmar = async () => {
      try {
        setLoading(true);
        
        // Primero verificar el token
        const verifyResponse = await fetch(`/api/turnos/confirmar?token=${token}`);
        const verifyData = await verifyResponse.json();
        
        if (!verifyData.ok) {
          setError(verifyData.message || 'Token no válido');
          return;
        }
        
        console.log('Turno encontrado:', verifyData.turno);
        setTurno(verifyData.turno);
        
        // Si el turno ya está confirmado, mostrarlo así
        if (verifyData.yaConfirmado) {
          setConfirmed(true);
          return;
        }
        
        // Si el turno está sin confirmar, confirmarlo automáticamente
        if (verifyData.turno.estado === 'sin confirmar' || verifyData.turno.estado === 'pendiente' || !verifyData.turno.estado) {
          const confirmResponse = await fetch('/api/turnos/confirmar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });
          
          const confirmData = await confirmResponse.json();
          
          if (confirmData.ok) {
            setConfirmed(true);
            // Actualizar el turno con el nuevo estado
            setTurno(prev => ({ ...prev, estado: 'confirmado' }));
          } else {
            setError(confirmData.message || 'Error al confirmar el turno');
          }
        } else {
          // El turno tiene un estado que no permite confirmación
          setError(`No se puede confirmar este turno. Estado actual: ${verifyData.turno.estado}`);
        }
        
      } catch (err) {
        setError('Error al procesar la confirmación: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    verificarYConfirmar();
  }, [token]);  // Función para navegar a la página de disponibilidad de turnos
  const irADisponibilidad = () => {
    if (turno && turno.paciente && turno.paciente.id) {
      router.push(`/turnos/disponibilidad?pacienteId=${turno.paciente.id}`);
    }
  };
  

  // Si está cargando
  if (loading) {
    return (
      <Loader titulo={''}/>
    );
  }

  // Si hay un error
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-center text-red-600">Error</h1>
          <p className="text-center mb-6">{error}</p>
          <div className="text-center">
            <Link 
              href="/"
              className="px-4 py-2 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }
  // Si el turno está confirmado (ya sea porque estaba confirmado o se acaba de confirmar)
  if (confirmed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2 text-center">Turno Confirmado</h1>
          <p className="text-center text-gray-600 mb-6">
            Tu turno ha sido confirmado exitosamente.
          </p>
          
          {turno && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <p className="font-semibold text-green-800">Detalles del turno confirmado:</p>
              <p><span className="font-medium">Paciente:</span> {turno.paciente.nombre} {turno.paciente.apellido}</p>
              <p><span className="font-medium">Servicio:</span> {turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado'}</p>
              <p><span className="font-medium">Fecha:</span> {formatoFecha(turno.desde, true, true, false, true, false, false)}</p>
              <p><span className="font-medium">Profesional:</span> {turno.doctor.nombre}</p>
              <p><span className="font-medium">Consultorio:</span> {turno.consultorio.nombre}</p>
            </div>
          )}
          
          <div className="mt-6 text-center flex flex-col space-y-4">
            <button 
              onClick={irADisponibilidad}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 inline-flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Solicitar otro turno
            </button>
            
            <Link 
              href="/"
              className="px-4 py-2 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-[var(--color-primary-dark)] inline-flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Si llegamos aquí es porque no se pudo confirmar o hay algún problema
  // Esta situación no debería ocurrir normalmente ya que se maneja en el useEffect
  return null;
}
