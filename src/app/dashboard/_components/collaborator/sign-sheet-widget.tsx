'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { GlassCard, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signTimeSheet } from '@/lib/actions'; 
import { FileSignature, CheckCircle, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TimeLog, User, Signature } from '@/lib/types';
import { ClientPDF } from '../pdf/client-pdf';

interface MonthlySignatureProps {
  user: User;
  logs: TimeLog[];
  initialSignature: Signature | null;
}

export default function MonthlySignature({ user, logs, initialSignature }: MonthlySignatureProps) {
  const [signature, setSignature] = useState(initialSignature);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const currentDate = new Date();
  const currentMonth = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
  const currentMonthYear = format(currentDate, 'yyyy-MM');

  const handleSign = async () => {
    setIsLoading(true);
    const result = await signTimeSheet(user.id, currentMonthYear);

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
        description: result.error || 'Ocorreu um erro desconhecido.',
      });
    }
    setIsLoading(false);
  };

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="text-primary" />
          Assinatura do Ponto
        </CardTitle>
        <CardDescription>
          Revise e assine sua folha de ponto de <span className="font-semibold text-primary">{currentMonth}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {signature ? (
          <div className="flex flex-col items-center justify-center text-center p-4 bg-green-900/30 rounded-lg">
            <CheckCircle className="h-10 w-10 text-green-400 mb-2" />
            <p className="font-semibold text-foreground">Ponto Assinado!</p>
            <p className="text-sm text-muted-foreground">Assinado em {format(new Date(signature.signedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
            <ClientPDF user={user} logs={logs} signature={signature}/>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Ao assinar, você confirma que todos os registros para {currentMonth} estão corretos.
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
