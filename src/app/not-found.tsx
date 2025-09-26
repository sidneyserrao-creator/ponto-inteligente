import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <Logo className="h-12 w-auto" />
      <div className="mt-10 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-primary" />
        <h1 className="mt-4 text-5xl font-bold tracking-tight">404</h1>
        <p className="mt-2 text-2xl font-medium text-muted-foreground">Página não encontrada</p>
        <p className="mt-4 max-w-md text-muted-foreground">
          A página que você está tentando acessar não existe ou foi movida.
        </p>
        <Button asChild className="mt-8">
          <Link href="/dashboard">Voltar para o Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
