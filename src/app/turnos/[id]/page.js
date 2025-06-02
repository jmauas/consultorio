'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import DetalleTurno from '@/components/DetalleTurno';
import Loader from '@/components/Loader';

export default function DetalleTurnoPage() {
  const params = useParams();
  const { id } = params;
    const [turno, setTurno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const fetchTurno = async () => {
      try {
        const response = await fetch(`/api/turnos/obtener/${id}`);
        const result = await response.json();
        
        if (result.ok) {
          setTurno(result.data);
        } else {
          setError(result.error || 'Error al obtener el turno');
        }
      } catch (error) {
        setError(error.message || 'Error al obtener el turno');
      } finally {
        setLoading(false);
      }
    };

    fetchTurno();
  }, [id]);  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      {loading && <Loader />}
      {error && (
        <div className="text-red-500 p-4">
          Error: {error}
        </div>
      )}
      {!loading && !error && turno && (
        <DetalleTurno turno={turno} />
      )}
    </div>
  )
}