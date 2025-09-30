'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { TimeLog, User, Signature } from '@/lib/types';

// Dynamically import the document component itself to avoid server-side rendering issues
const TimeSheetDocument = dynamic(() => import('./time-sheet-document').then(mod => mod.TimeSheetDocument), {
  ssr: false,
});

interface ClientPDFProps {
    user: User;
    logs: TimeLog[];
    signature: Signature | null;
}

export function ClientPDF({ user, logs, signature }: ClientPDFProps) {
  const currentMonthYear = format(new Date(), 'yyyy-MM');
  const fileName = user.role === 'collaborator' 
    ? `minha-folha-ponto-${currentMonthYear}.pdf`
    : `folha-ponto-${user.name.toLowerCase().replace(/ /g, '-')}-${currentMonthYear}.pdf`;

  const buttonProps = user.role === 'collaborator' 
    ? { variant: "outline" as const, size: "sm" as const, className: "mt-4" }
    : { variant: "outline" as const, size: "sm" as const };

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
