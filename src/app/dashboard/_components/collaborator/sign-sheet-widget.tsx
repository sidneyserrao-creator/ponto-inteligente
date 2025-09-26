'use client';
import { GlassCard, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileSignature, CheckCircle, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SignSheetWidgetProps {
  isSigned: boolean;
}

export function SignSheetWidget({ isSigned }: SignSheetWidgetProps) {
  const { toast } = useToast();
  const currentMonth = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  const handleSign = () => {
    toast({
      title: 'Ponto Assinado!',
      description: `Sua folha de ponto de ${currentMonth} foi assinada com sucesso.`,
    });
    // Here you would typically call a server action to record the signature.
  };

  const handleDownload = () => {
    alert('A funcionalidade de download do PDF será implementada em breve.');
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
        {isSigned ? (
          <div className="flex flex-col items-center justify-center text-center p-4 bg-green-900/30 rounded-lg">
            <CheckCircle className="h-10 w-10 text-green-400 mb-2" />
            <p className="font-semibold text-foreground">Ponto Assinado!</p>
            <p className="text-sm text-muted-foreground">Sua folha de ponto para {currentMonth} já foi assinada.</p>
             <Button variant="outline" size="sm" className="mt-4" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Baixar Comprovante
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Ao assinar, você confirma que todos os registros de entrada, saída e pausas para o mês de {currentMonth} estão corretos.
            </p>
            <Button onClick={handleSign} className="w-full">
              <FileSignature className="mr-2 h-4 w-4" />
              Assinar Ponto de {currentMonth}
            </Button>
          </>
        )}
      </CardContent>
    </GlassCard>
  );
}
