'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {

  useEffect(() => {
    redirect('/login');
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecionando...</h1>
        <p className="mb-6 text-muted-foreground">
          Redirecionando para a página de login.
        </p>
      </div>
    </div>
  );
}
