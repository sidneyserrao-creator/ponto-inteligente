'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { login } from '@/lib/actions';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth as clientAuth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      // 1. Sign in on the client
      const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // 2. Pass the token to the server action to create the session cookie
      const result = await login(idToken);
      
      // 3. Check for server-side errors returned from the action
      if (result?.error) {
          toast({
              variant: 'destructive',
              title: 'Erro no Servidor',
              description: result.error,
          });
          setIsLoading(false);
          return;
      }

      // If login is successful, the server action will redirect.
      // We don't need to do anything else here.

    } catch (error: any) {
        // Handle the specific NEXT_REDIRECT error from server actions
        if (error.digest?.includes('NEXT_REDIRECT')) {
            // This is not a real error, but how Next.js handles redirects in Server Actions.
            // We can safely ignore it.
            return;
        }

       let errorMessage = 'Ocorreu um erro de autenticação. Verifique suas credenciais.';
       // Check for Firebase client-side auth errors
       const firebaseErrorCode = error.code || error.error?.code;
       if (firebaseErrorCode) {
           switch (firebaseErrorCode) {
               case 'auth/user-not-found':
               case 'auth/wrong-password':
               case 'auth/invalid-credential':
                   errorMessage = 'E-mail ou senha inválidos.';
                   break;
           }
       }
       console.error('Client-side login error:', error);
        toast({
            variant: 'destructive',
            title: 'Erro de Autenticação',
            description: errorMessage,
        });
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
          placeholder="Seu e-mail aqui"
          required
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
              placeholder="Sua senha"
              className="pr-10" 
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
