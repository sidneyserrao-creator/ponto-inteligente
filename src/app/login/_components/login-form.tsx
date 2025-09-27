'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { login } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogIn } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { redirect } from 'next/navigation';
import React from 'react';

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
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [isPending, setIsPending] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsPending(true);
      setError(undefined);
      
      const formData = new FormData(event.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        
        // Call the server action directly with the token
        const result = await login(null, idToken);

        if (result?.error) {
            setError(result.error);
        }
        // If successful, the server action will handle the redirect.

      } catch (error: any) {
          if (error.code) {
            switch (error.code) {
              case 'auth/user-not-found':
              case 'auth/wrong-password':
              case 'auth/invalid-credential':
                setError('Credenciais inválidas.');
                break;
              default:
                setError('Ocorreu um erro. Tente novamente.');
                break;
agencies/        }
          } else {
             setError('Ocorreu um erro desconhecido.');
          }
      } finally {
        setIsPending(false);
      }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="seu.email@bitsolucoes.com"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input 
          id="password" 
          name="password" 
          type="password" 
          required 
        />
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de Autenticação</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity" 
        disabled={isPending}
      >
        {isPending ? 'Entrando...' : <> <LogIn className="mr-2 h-4 w-4" /> Entrar </>}
    </Button>

    </form>
  );
}
