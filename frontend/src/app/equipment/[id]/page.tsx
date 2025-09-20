'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PumpRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const pumpId = params.id as string;

  useEffect(() => {
    // Redirect to the detailed view
    router.replace(`/equipment/${pumpId}/details`);
  }, [pumpId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}