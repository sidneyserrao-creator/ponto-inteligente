'use client';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/lib/types';
import { FileSignature, Download, Check, Hourglass } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SignedTimeSheetsProps {
  collaborators: User[];
  signatureStatus: Record<string, boolean>;
}

export function SignedTimeSheets({ collaborators, signatureStatus }: SignedTimeSheetsProps) {
  const currentMonth = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

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
                const isSigned = signatureStatus[user.id] || false;
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
                      <Button variant="outline" size="sm" disabled={!isSigned} onClick={() => alert('Funcionalidade de download será implementada.')}>
                        <Download className="mr-2 h-4 w-4" />
                        Baixar PDF
                      </Button>
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
