'use client';

import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { TimeLog } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Play, Coffee, LogOut, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Image from 'next/image';

interface TimeLogsTableProps {
  timeLogs: TimeLog[];
}

const actionDetails = {
  clock_in: { label: 'Entrada', icon: Play, color: 'text-green-400' },
  break_start: { label: 'Início da Pausa', icon: Coffee, color: 'text-yellow-400' },
  break_end: { label: 'Fim da Pausa', icon: Play, color: 'text-blue-400' },
  clock_out: { label: 'Saída', icon: LogOut, color: 'text-red-400' },
};

const ValidationStatus = ({ validation }: { validation: TimeLog['validation'] }) => {
  if (!validation) {
    return <Badge variant="secondary"><AlertTriangle className="mr-1 h-3 w-3"/>Pendente</Badge>;
  }
  if (validation.isValidated) {
    return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3"/>Validado</Badge>;
  }
  return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3"/>Rejeitado</Badge>;
};

export function TimeLogsTable({ timeLogs }: TimeLogsTableProps) {
  return (
    <GlassCard>
      <CardHeader>
        <CardTitle>Meus Registros de Hoje</CardTitle>
        <CardDescription>Seus registros de ponto para o dia atual.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card/80 backdrop-blur-sm">
              <TableRow>
                <TableHead>Ação</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Validação</TableHead>
                <TableHead>Foto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeLogs.length > 0 ? timeLogs.map((log) => {
                const details = actionDetails[log.action];
                const Icon = details.icon;
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className={`flex items-center ${details.color}`}>
                        <Icon className="mr-2 h-4 w-4" />
                        <span className="font-medium">{details.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(log.timestamp), 'HH:mm:ss', { locale: ptBR })}</TableCell>
                    <TableCell>
                      <ValidationStatus validation={log.validation} />
                    </TableCell>
                    <TableCell>
                      {log.photoUrl && (
                        <Image
                          src={log.photoUrl}
                          alt={`Foto de ${log.action}`}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Nenhum registro de ponto hoje.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </GlassCard>
  );
}
