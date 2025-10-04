'use client';

import { Loader2 } from 'lucide-react';

export default function DashboardLoader() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center h-96 animate-pulse">
      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      <p className="mt-4 text-lg font-medium text-muted-foreground">
        Carregando seu dashboard...
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Estamos preparando os dados mais recentes para você.
      </p>
    </div>
  );
}
