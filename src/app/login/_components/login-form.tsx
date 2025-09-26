'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { login } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogIn } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit" 
      className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity" 
      disabled={pending}
    >
      {pending ? 'Entrando...' : <> <LogIn className="mr-2 h-4 w-4" /> Entrar </>}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, { error: undefined });

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="seu.email@bitsolucoes.com"
          required
          defaultValue="ana.silva@bitsolucoes.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input 
          id="password" 
          name="password" 
          type="password" 
          required 
          defaultValue="password123"
        />
      </div>
      
      {state?.error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de Autenticação</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <SubmitButton />

      <p className="text-center text-xs text-muted-foreground pt-4">
        Use um dos emails: ana.silva@ (admin), bruno.costa@ (supervisor), ou carlos.santos@ (colaborador) com qualquer senha.
      </p>
    </form>
  );
}
