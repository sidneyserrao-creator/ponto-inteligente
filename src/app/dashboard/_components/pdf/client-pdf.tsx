'use client';

import { BlobProvider } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { TimeLog, User, Signature } from '@/lib/types';
import { TimeSheetDocument } from './time-sheet-document';

interface ClientPDFProps {
  user: User | null;
  logs: TimeLog[] | null;
  signature: Signature | null;
}

export function ClientPDF({ user, logs, signature }: ClientPDFProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Garante que tudo esteja carregado antes de criar o PDF
  const isReady =
    isClient &&
    user !== null &&
    typeof user === 'object' &&
    Array.isArray(logs) &&
    logs.length >= 0;

  const pdfDoc = useMemo(() => {
    if (!isReady || !user) return null;
    return <TimeSheetDocument user={user} logs={logs || []} signature={signature} />;
  }, [isReady, user, logs, signature]);

  if (!isClient) {
    return (
      <Button disabled className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando cliente...
      </Button>
    );
  }

  if (!isReady || !pdfDoc) {
    return (
      <Button disabled className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Preparando PDF...
      </Button>
    );
  }

  return (
    <BlobProvider document={pdfDoc}>
      {({ url, loading, error }) => {
        if (loading)
          return (
            <Button disabled className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando PDF...
            </Button>
          );

        if (error) {
          console.error('Erro ao gerar PDF:', error);
          return (
            <Button disabled variant="destructive">
              Erro ao gerar PDF
            </Button>
          );
        }

        if (!url) {
          return (
            <Button disabled variant="secondary">
              PDF não disponível
            </Button>
          );
        }

        return (
          <a href={url} download={`pontos-assinados-${user?.name || 'colaborador'}.pdf`}>
            <Button className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
          </a>
        );
      }}
    </BlobProvider>
  );
}
