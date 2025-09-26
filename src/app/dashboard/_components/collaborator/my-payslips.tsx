import { GlassCard, CardHeader, CardTitle, CardContent } from '@/components/glass-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { Payslip } from '@/lib/types';
import { FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MyPayslipsProps {
    payslips: Payslip[];
}

export function MyPayslips({ payslips }: MyPayslipsProps) {
  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <FileText className="text-primary"/>
            Meus Contracheques
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-40">
          <div className="space-y-3 pr-4">
            {payslips.map(payslip => (
              <div key={payslip.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold text-sm">{payslip.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payslip.uploadDate), "MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => alert('Download iniciado!')}>
                  <Download className="h-5 w-5" />
                </Button>
              </div>
            ))}
            {payslips.length === 0 && (
                <p className="text-center text-muted-foreground py-10">
                    Nenhum contracheque disponível.
                </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </GlassCard>
  );
}
