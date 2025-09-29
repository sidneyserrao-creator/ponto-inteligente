'use client';

import React from 'react';
import { useFormStatus } from 'react-dom';
import { login } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export function LoginForm() {
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [isPending, setIsPending] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

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
        
        // Pass only the token to the server action
        const result = await login(null, idToken);

        if (result?.error) {
            // This case handles server-side session errors
            setError(result.error);
        }
        // A successful login action will redirect, so no further client-side action is needed.

      } catch (error: any) {
          // This case handles client-side Firebase Auth errors (wrong password, user not found)
          if (error.code) {
            switch (error.code) {
              case 'auth/user-not-found':
              case 'auth/wrong-password':
              case 'auth/invalid-credential':
                setError('Credenciais inválidas.');
                break;
              default:
                setError('Ocorreu um erro de autenticação. Tente novamente.');
                break;
            }
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
        <div className="relative">
            <Input 
              id="password" 
              name="password" 
              type={showPassword ? 'text' : 'password'} 
              required 
              className="pr-10" // Add padding for the icon
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-400 hover:text-gray-200"
              aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
        </div>
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
        className="w-full bg-blue-900/40 text-sky-300 border border-sky-900 backdrop-blur-lg hover:bg-blue-900/60 hover:text-sky-200 transition-all" 
        disabled={isPending}
      >
        {isPending ? 'Entrando...' : <> <LogIn className="mr-2 h-4 w-4" /> Entrar </>}
    </Button>

    </form>
  );
}
