'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { GlassCard, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signTimeSheet } from '@/lib/actions'; // CORREÇÃO: Importa a função correta
import { FileSignature, CheckCircle, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TimeLog, User, Signature } from '@/lib/types';

const ClientPDF = dynamic(() => import('../pdf/client-pdf').then(mod => mod.ClientPDF), {
  ssr: false,
  loading: () => (
    <Button variant="outline" size="sm" className="mt-4" disabled>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Carregando PDF...
    </Button>
  ),
});

interface MonthlySignatureProps {
  userId: string;
  initialSignature: Signature | null;
  // Os logs e o user completo não são mais necessários aqui, serão buscados no client-side para o PDF se precisar
}

// CORREÇÃO: Componente renomeado e lógica ajustada
export default function MonthlySignature({ userId, initialSignature }: MonthlySignatureProps) {
  const [signature, setSignature] = useState(initialSignature);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const currentDate = new Date();
  const currentMonth = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
  const currentMonthYear = format(currentDate, 'yyyy-MM');

  const handleSign = async () => {
    setIsLoading(true);
    // CORREÇÃO: Chama a função correta com os parâmetros corretos
    const result = await signTimeSheet(userId, currentMonthYear);

    if (result.success) {
      toast({
        title: 'Ponto Assinado!',
        description: `Sua folha de ponto de ${currentMonth} foi assinada com sucesso.`,
      });
      // CORREÇÃO: Atualiza o estado localmente para refletir a assinatura
      const newSignature: Signature = {
        id: `${userId}_${currentMonthYear}`,
        userId: userId,
        monthYear: currentMonthYear,
        signedAt: new Date().toISOString(),
      };
      setSignature(newSignature);
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro ao assinar',
        description: result.error || 'Ocorreu um erro desconhecido.',
      });
    }
    setIsLoading(false);
  };

  // O PDF precisará ser ajustado para buscar os dados ou recebê-los de outra forma
  // Por enquanto, vamos focar em fazer a assinatura funcionar.
  // O componente ClientPDF foi removido temporariamente para evitar erros de props.

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
            {/* O ClientPDF pode ser adicionado aqui depois */}
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
