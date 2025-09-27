'use client';

import { createInitialAdminUser } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { redirect } from 'next/navigation';

export default function Home() {
  const [message, setMessage] = useState('');
  const [created, setCreated] = useState(false);

  const handleCreateAdmin = async () => {
    try {
      const result = await createInitialAdminUser();

      if (result.success) {
        setMessage(
          'Usuário administrador criado com sucesso! Você pode agora ir para a página de login.'
        );
        setCreated(true);
      } else {
        // Handle cases where user might already exist
        if (result.error?.includes('EMAIL_EXISTS') || result.error?.includes('already exists')) {
           setMessage('O usuário administrador já existe. Prossiga para o login.');
           setCreated(true);
        } else {
          console.error(result.error);
          setMessage(`Falha ao criar usuário: ${result.error}`);
        }
      }
    } catch (error: any) {
      console.error(error);
      setMessage(`Falha ao criar usuário: ${error.message}`);
    }
  };

  if (created) {
      setTimeout(() => redirect('/login'), 3000);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Configuração Inicial</h1>
        <p className="mb-6 text-muted-foreground">
          Clique no botão abaixo para criar o primeiro usuário administrador do sistema.
        </p>
        <Button onClick={handleCreateAdmin}>Criar Usuário Administrador</Button>
        {message && (
          <p className="mt-4 text-sm font-medium text-primary">{message}</p>
        )}
        <div className="mt-8 p-4 border rounded-lg bg-card text-left max-w-md">
            <h3 className="font-semibold">Credenciais do Admin:</h3>
            <p className="text-sm"><strong>Email:</strong> admin@bitsolucoes.com</p>
            <p className="text-sm"><strong>Senha:</strong> password123</p>
        </div>
      </div>
    </div>
  );
}
