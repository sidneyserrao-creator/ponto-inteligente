'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { login } from '@/lib/actions';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth as clientAuth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // 1. Sign in on the client
      const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // 2. Pass the token to the server action to create the session cookie
      const result = await login(idToken);

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      } else {
        // Redirect is handled by the server action
      }
    } catch (authError: any) {
       let errorMessage = 'Ocorreu um erro de autenticação. Verifique suas credenciais.';
       if (authError.code) {
           switch (authError.code) {
               case 'auth/user-not-found':
               case 'auth/wrong-password':
               case 'auth/invalid-credential':
                   errorMessage = 'E-mail ou senha inválidos.';
                   break;
           }
       }
       console.error('Client-side login error:', authError);
       setError(errorMessage);
       setIsLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="admin@bit.com"
          required
          defaultValue="admin@bit.com"
          disabled={isLoading}
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
              className="pr-10" 
              defaultValue="adminbit123"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-400 hover:text-gray-200"
              aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
              disabled={isLoading}
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
            disabled={isLoading}
        >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LogIn className="mr-2 h-4 w-4" />}
            {isLoading ? 'Entrando...' : 'Entrar'}
      </Button>

    </form>
  );
}