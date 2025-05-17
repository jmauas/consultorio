'use client';
import React, { useEffect, useState } from 'react';
import { getTurnoById } from '@/lib/services/turnos/turnosService.js';
import { useParams } from 'next/navigation';
import DetalleTurno from '@/components/DetalleTurno';
import Loader from '@/components/Loader';

export default function DetalleTurnoPage() {
  const params = useParams();
  const { id } = params;
  
  const [turno, setTurno] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    setLoading(true);
    const fetchTurno = async () => {
      try {
        const data = await getTurnoById(id);
        setTurno(data);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTurno();
  }, [id]);

  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      {loading && <Loader />}
      {!loading && turno && (
        <DetalleTurno turno={turno} />
      )}
    </div>
  )
}