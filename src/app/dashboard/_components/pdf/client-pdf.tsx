'use client';

import { PDFDownloadLink, BlobProviderParams } from '@react-pdf/renderer';
import { Button, ButtonProps } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { TimeLog, User, Signature } from '@/lib/types';
import { TimeSheetDocument } from './time-sheet-document';
import { useState, useEffect } from 'react';

interface ClientPDFProps {
    user: User;
    logs: TimeLog[];
    signature: Signature | null;
}

export function ClientPDF({ user, logs, signature }: ClientPDFProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Readiness Check: Garante que todos os dados essenciais estão presentes.
  const isReadyForDownload = !!user && !!logs && !!signature;
  
  const currentMonthYear = format(new Date(), 'yyyy-MM');
  const fileName = user?.name ? 
    (user.role === 'collaborator' 
      ? `minha-folha-ponto-${currentMonthYear}.pdf`
      : `folha-ponto-${user.name.toLowerCase().replace(/ /g, '-')}-${currentMonthYear}.pdf`)
    : `comprovante-ponto.pdf`;

  const buttonVariant = "outline" as const;
  const buttonSize = "sm" as const;

  const buttonProps: ButtonProps = {
    variant: buttonVariant,
    size: buttonSize,
    className: user?.role === 'collaborator' ? "mt-4" : "",
  };

  // Enquanto não estiver no cliente ou os dados não estiverem prontos, mostra o estado de carregamento.
  if (!isClient || !isReadyForDownload) {
      return (
      <Button {...buttonProps} disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Gerando...
      </Button>
    );
  }

  // Renderização Condicional: Só renderiza o PDFDownloadLink quando tudo estiver pronto.
  return (
    <PDFDownloadLink
      document={<TimeSheetDocument user={user} logs={logs} signature={signature} />}
      fileName={fileName}
    >
      {/* 
        Isto é uma solução alternativa para uma incompatibilidade de tipo conhecida entre @react-pdf/renderer e React 18.
        O padrão de função como filha está correto, mas a inferência do TypeScript falha.
        A coerção da função inteira para 'any' ignora a verificação de tipo sem afetar o comportamento em tempo de execução.
      */}
      {(({ loading }: BlobProviderParams) => (
        <Button {...buttonProps} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Gerando...' : (user.role === 'collaborator' ? 'Baixar Comprovante' : 'Baixar PDF')}
        </Button>
      )) as any}
    </PDFDownloadLink>
  );
}
