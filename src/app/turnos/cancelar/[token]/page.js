"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Loader from '@/components/Loader';

export default function CancelarTurnoPage({ }) {
  const params = useParams();
  const router = useRouter();
  const token = params.token;
  const [turno, setTurno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canceled, setCanceled] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState(false);
  
  // Verificar el token y obtener información del turno al cargar la página
  useEffect(() => {
    const verificarToken = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/turnos/cancelar?token=${token}`);
        const data = await response.json();
        
        if (data.ok) {
          setTurno(data.turno);
          
          // Si el turno ya está cancelado, mostrarlo así
          if (data.yaCancelado) {
            setCanceled(true);
          }
        } else {
          setError(data.message || 'Token no válido');
        }
      } catch (err) {
        setError('Error al verificar el token: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    verificarToken();
  }, [token]);
  
  // Función para manejar la cancelación del turno
  const handleCancelarTurno = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/turnos/cancelar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setCanceled(true);
      } else {
        setError(data.message || 'Error al cancelar el turno');
      }
    } catch (err) {
      setError('Error al procesar la cancelación: ' + err.message);
    } finally {
      setLoading(false);
      setConfirmationStep(false);
    }
  };

  // Función para navegar a la página de disponibilidad de turnos
  const irADisponibilidad = () => {
    if (turno && turno.paciente && turno.paciente.id) {
      router.push(`/turnos/disponibilidad?pacienteId=${turno.paciente.id}`);
    }
  };
  
  // Función para mostrar la fecha en formato legible
  const formatoFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    const opciones = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return fecha.toLocaleDateString('es-AR', opciones);
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

  // Si el turno ya está cancelado
  if (canceled) {
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
          <h1 className="text-2xl font-bold mb-2 text-center">Turno Cancelado</h1>
          <p className="text-center text-gray-600 mb-6">
            Tu turno ha sido cancelado exitosamente.
          </p>
          
          {turno && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold">Detalles del turno cancelado:</p>
              <p>Servicio: {turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado'}</p>
              <p>Fecha: {formatoFecha(turno.desde)}</p>
              <p>Profesional: {turno.doctor.nombre}</p>
            </div>
          )}
          
          <div className="mt-6 text-center flex flex-col space-y-4">
            <button 
              onClick={irADisponibilidad}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 inline-flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Solicitar nuevo turno
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

  // Pantalla de confirmación
  if (confirmationStep) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-center">Confirmar Cancelación</h1>
          <p className="text-center mb-6">¿Estás seguro de que deseas cancelar este turno?</p>
          
          {turno && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold">Detalles del turno:</p>
              <p>Servicio: {turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado'}</p>
              <p>Fecha: {formatoFecha(turno.desde)}</p>
              <p>Profesional: {turno.doctor.nombre}</p>
            </div>
          )}
          
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setConfirmationStep(false)}
              className="px-4 py-2 bg-gray-300 text-gray-800 font-medium rounded-lg hover:bg-gray-400 inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              Volver
            </button>
            <button
              onClick={handleCancelarTurno}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Confirmar Cancelación
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista principal cuando se carga el turno correctamente
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Cancelar Turno</h1>
        
        {turno && (
          <div className="mb-6">
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h2 className="text-lg font-semibold mb-2">Detalles del Turno</h2>
              <p><span className="font-medium">Paciente:</span> {turno.paciente.nombre} {turno.paciente.apellido}</p>
              <p><span className="font-medium">Servicio:</span> {turno.tipoDeTurno && turno.tipoDeTurno.nombre || 'No especificado'}</p>
              <p><span className="font-medium">Fecha:</span> {formatoFecha(turno.desde)}</p>
              <p><span className="font-medium">Profesional:</span> {turno.doctor.nombre}</p>
              <p><span className="font-medium">Consultorio:</span> {turno.consultorio.nombre}</p>
            </div>
            
            <p className="text-center mb-6">
              Si necesitas cancelar este turno, por favor haz clic en el botón a continuación.
            </p>
            
            <div className="flex justify-center">
              <button 
                onClick={() => setConfirmationStep(true)} 
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 inline-flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar Turno
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Link 
            href="/"
            className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}