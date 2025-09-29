'use client';

import React from 'react';
import { useFormStatus, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react';
import { login } from '@/lib/actions';

const initialState = {
  error: undefined,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button 
            type="submit" 
            className="w-full bg-blue-900/40 text-sky-300 border border-sky-900 backdrop-blur-lg hover:bg-blue-900/60 hover:text-sky-200 transition-all" 
            disabled={pending}
        >
            {pending ? 'Entrando...' : <> <LogIn className="mr-2 h-4 w-4" /> Entrar </>}
        </Button>
    )
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="admin@bit.com"
          required
          defaultValue="admin@bit.com"
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
              defaultValue="adminbit123"
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
      
      {state?.error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de Autenticação</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      
      <SubmitButton />

    </form>
  );
}
