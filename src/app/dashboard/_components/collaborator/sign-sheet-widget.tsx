
'use client';

import type { User, TimeLog, Signature } from '@/lib/types';
import { GlassCard, CardContent } from '@/components/glass-card';

interface MonthlySignatureProps {
  user: User;
  logs?: TimeLog[];
  initialSignature?: Signature | null;
}

export function MonthlySignature({ user, logs, initialSignature }: MonthlySignatureProps) {
  // A funcionalidade de assinatura de folha de ponto foi desativada temporariamente.
  // O código original está comentado abaixo para referência futura.

  return (
    <GlassCard>
      <CardContent className="pt-6">
        <p className="text-center text-sm text-muted-foreground italic">
          A função de assinatura de ponto estará disponível numa atualização futura.
        </p>
      </CardContent>
    </GlassCard>
  );

  /*
  // CÓDIGO ORIGINAL DESATIVADO:
  const [isClient, setIsClient] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signature, setSignature] = useState(initialSignature);
  const { toast } = useToast();
  const currentMonthYear = format(new Date(), 'yyyy-MM');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSign = async () => {
    if (!user) return;
    setIsSigning(true);
    try {
      const result = await signTimeSheet(user.id, currentMonthYear);
      if (result.success && result.signature) {
        setSignature(result.signature);
        toast({ title: 'Sucesso!', description: 'Folha de ponto assinada digitalmente.' });
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error || 'Não foi possível assinar a folha de ponto.' });
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro inesperado', description: error.message });
    } finally {
      setIsSigning(false);
    }
  };

  if (!isClient) {
    return (
       <GlassCard>
        <CardContent className="flex items-center justify-center h-24 pt-6">
           <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FileSignature className="text-primary"/>
                Folha de Ponto Mensal
            </CardTitle>
            <CardDescription>
                Revise e assine sua folha de ponto do mês de {format(new Date(), 'MMMM', { locale: ptBR })}.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {signature ? (
                 <div className="space-y-4 text-center">
                    <div className="flex justify-center items-center flex-col gap-2">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                        <p className="font-semibold">Ponto assinado em {format(new Date(signature.signedAt), 'dd/MM/yyyy')}</p>
                    </div>
                    <ClientPDF user={user} logs={logs || []} signature={signature} />
                 </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Sua folha de ponto para o mês atual está pronta para ser assinada. Ao assinar, você confirma que todos os registros estão corretos.
                    </p>
                    <Button onClick={handleSign} disabled={isSigning} className="w-full">
                        {isSigning ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PenSquare className="mr-2 h-4 w-4" />}
                        {isSigning ? 'Assinando...' : 'Assinar Folha de Ponto'}
                    </Button>
                </div>
            )}
        </CardContent>
    </GlassCard>
  );
  */
}

export default MonthlySignature;
