'use client';

import { useParams } from 'next/navigation';
import DetalleTurno from '@/components/DetalleTurno';

export default function DetalleTurnoPage() {
  const params = useParams();
  
  return <DetalleTurno turnoId={params.id} />;
}