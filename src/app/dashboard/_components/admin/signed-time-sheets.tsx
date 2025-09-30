
'use client';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { User, TimeLog, Signature } from '@/lib/types';
import { FileSignature, Download, Check, Hourglass, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import dynamic from 'next/dynamic';

const ClientPDF = dynamic(() => import('../pdf/client-pdf').then(mod => mod.ClientPDF), {
  ssr: false,
  loading: () => (
      <Button variant="outline" size="sm" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Carregando...
      </Button>
  ),
});


interface SignedTimeSheetsProps {
  collaborators: User[];
  signatureStatus: Record<string, Signature | null>;
  allTimeLogs: TimeLog[];
}

export function SignedTimeSheets({ collaborators, signatureStatus, allTimeLogs }: SignedTimeSheetsProps) {
  const currentMonth = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  const getCollaboratorLogs = (userId: string) => {
    const currentMonthYear = format(new Date(), 'yyyy-MM');
    return allTimeLogs.filter(log => log.userId === userId && log.timestamp.startsWith(currentMonthYear));
  };
  
  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="text-primary"/>
          Pontos Assinados
        </CardTitle>
        <CardDescription>
          Gerencie e baixe as folhas de ponto assinadas pelos colaboradores para o mês de <span className="font-semibold text-primary">{currentMonth}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[70vh] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card/80 backdrop-blur-sm">
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collaborators.map(user => {
                const signature = signatureStatus[user.id] || null;
                const isSigned = !!signature;
                const userLogs = getCollaboratorLogs(user.id);
                
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.profilePhotoUrl} alt={user.name} className="object-cover" />
                          <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isSigned ? (
                        <Badge className="bg-green-600 hover:bg-green-700">
                          <Check className="mr-1 h-3 w-3" /> Assinado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Hourglass className="mr-1 h-3 w-3" /> Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                       {isSigned && userLogs.length > 0 ? (
                          <ClientPDF user={user} logs={userLogs} signature={signature} />
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            <Download className="mr-2 h-4 w-4" />
                            Baixar PDF
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </GlassCard>
  );
}
