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
  const [state, formAction] = useActionState(login, { error: undefined });
  const [clientError, setClientError] = React.useState<string | undefined>(undefined);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setClientError(undefined);
      
      const formData = new FormData(event.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        
        // Append idToken to a new FormData and submit the server action
        const serverFormData = new FormData(formRef.current!);
        serverFormData.append('idToken', idToken);

        const submitter = document.createElement('button');
        submitter.type = 'submit';
        submitter.style.display = 'none';
        formRef.current?.appendChild(submitter);
        submitter.click();
        formRef.current?.removeChild(submitter);


      } catch (error: any) {
          if (error.code) {
            switch (error.code) {
              case 'auth/user-not-found':
              case 'auth/wrong-password':
              case 'auth/invalid-credential':
                setClientError('Credenciais inválidas.');
                break;
              default:
                setClientError('Ocorreu um erro. Tente novamente.');
                break;
            }
          } else {
             setClientError('Ocorreu um erro desconhecido.');
          }
      }
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={handleFormSubmit} className="space-y-4">
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
      
      {clientError && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de Autenticação</AlertTitle>
          <AlertDescription>{clientError}</AlertDescription>
        </Alert>
      )}

      {state?.error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de Sessão</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <SubmitButton />

    </form>
  );
}
