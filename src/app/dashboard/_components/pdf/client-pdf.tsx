'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
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
  
  const currentMonthYear = format(new Date(), 'yyyy-MM');
  const fileName = user.role === 'collaborator' 
    ? `minha-folha-ponto-${currentMonthYear}.pdf`
    : `folha-ponto-${user.name.toLowerCase().replace(/ /g, '-')}-${currentMonthYear}.pdf`;

  const buttonProps = user.role === 'collaborator' 
    ? { variant: "outline" as const, size: "sm" as const, className: "mt-4" }
    : { variant: "outline" as const, size: "sm" as const };

  if (!isClient) {
     return (
      <Button {...buttonProps} disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Carregando...
      </Button>
    );
  }

  return (
    <PDFDownloadLink
      document={<TimeSheetDocument user={user} logs={logs} signature={signature} />}
      fileName={fileName}
    >
      {({ loading }) => (
        <Button {...buttonProps} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {loading ? 'Gerando...' : (user.role === 'collaborator' ? 'Baixar Comprovante' : 'Baixar PDF')}
        </Button>
      )}
    </PDFDownloadLink>
  );
}