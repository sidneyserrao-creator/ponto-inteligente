
'use client';

import type { User, TimeLog, Signature } from '@/lib/types';

interface MonthlySignatureProps {
  user: User;
  logs?: TimeLog[];
  initialSignature?: Signature | null;
}

export function MonthlySignature({ user, logs, initialSignature }: MonthlySignatureProps) {
  // A lógica de assinatura e download de PDF será restaurada em uma futura atualização.
  // Por enquanto, exibimos um estado básico para confirmar que as props são recebidas.

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold text-lg">Folha de Ponto Mensal</h3>
      <p className="text-sm text-gray-600">Funcionário: {user.name}</p>
      <p className="text-sm text-gray-600">Registros de Ponto no Mês: {logs?.length || 0}</p>
      <div className="mt-4">
        {initialSignature ? (
          <p className="text-sm font-medium text-green-600">Folha de ponto assinada digitalmente.</p>
        ) : (
          <p className="text-sm font-medium text-yellow-600">Aguardando assinatura da folha de ponto.</p>
        )}
      </div>
    </div>
  );
}

export default MonthlySignature;
