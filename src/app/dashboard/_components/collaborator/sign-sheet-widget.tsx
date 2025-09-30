'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { GlassCard, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signMyTimeSheet } from '@/lib/actions';
import { FileSignature, CheckCircle, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TimeLog, User, Signature } from '@/lib/types';
import { PDFDownloadLink } from '@react-pdf/renderer';

const TimeSheetDocument = dynamic(() => import('../pdf/time-sheet-document').then(mod => mod.TimeSheetDocument), {
  ssr: false,
  loading: () => <p>Carregando documento...</p>,
});

interface SignSheetWidgetProps {
  user: User;
  logs: TimeLog[];
  initialSignature: Signature | null;
}

export function SignSheetWidget({ user, logs, initialSignature }: SignSheetWidgetProps) {
  const [signature, setSignature] = useState(initialSignature);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const currentDate = new Date();
  const currentMonth = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
  const currentMonthYear = format(currentDate, 'yyyy-MM');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSign = async () => {
    setIsLoading(true);
    const result = await signMyTimeSheet(currentMonthYear);
    if (result.success && result.signature) {
        toast({
            title: 'Ponto Assinado!',
            description: `Sua folha de ponto de ${currentMonth} foi assinada com sucesso.`,
        });
        setSignature(result.signature);
    } else {
        toast({
            variant: 'destructive',
            title: 'Erro ao assinar',
            description: result.error,
        });
    }
    setIsLoading(false);
  };
  
  const DownloadButton = () => {
    if (!isClient) {
      return (
        <Button variant="outline" size="sm" className="mt-4" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Carregando...
        </Button>
      );
    }

    return (
      <PDFDownloadLink
        document={<TimeSheetDocument user={user} logs={logs} signature={signature} />}
        fileName={`minha-folha-ponto-${currentMonthYear}.pdf`}
      >
        {({ loading }) => (
          <Button variant="outline" size="sm" className="mt-4" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Gerando...' : 'Baixar Comprovante'}
          </Button>
        )}
      </PDFDownloadLink>
    );
  };


  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="text-primary"/>
          Assinatura do Ponto
        </CardTitle>
        <CardDescription>
          Revise e assine sua folha de ponto do mês de <span className="font-semibold text-primary">{currentMonth}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {signature ? (
          <div className="flex flex-col items-center justify-center text-center p-4 bg-green-900/30 rounded-lg">
            <CheckCircle className="h-10 w-10 text-green-400 mb-2" />
            <p className="font-semibold text-foreground">Ponto Assinado!</p>
            <p className="text-sm text-muted-foreground">Sua folha de ponto para {currentMonth} já foi assinada.</p>
             {isClient && <DownloadButton />}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Ao assinar, você confirma que todos os registros de entrada, saída e pausas para o mês de {currentMonth} estão corretos.
            </p>
            <Button onClick={handleSign} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />}
              {isLoading ? 'Assinando...' : `Assinar Ponto de ${currentMonth}`}
            </Button>
          </>
        )}
      </CardContent>
    </GlassCard>
  );
}
