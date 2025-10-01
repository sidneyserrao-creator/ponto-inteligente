
'use client';
import { useState, useMemo } from 'react';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { User, TimeLog } from '@/lib/types';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, CheckCircle, XCircle, AlertTriangle, Play, Coffee, LogOut, Clock, Search } from 'lucide-react';
import Image from 'next/image';

interface TimeLogHistoryProps {
  allUsers: User[];
  allTimeLogs: TimeLog[];
}

const actionDetails = {
  clock_in: { label: 'Entrada', icon: Play, color: 'text-green-400' },
  break_start: { label: 'Início Pausa', icon: Coffee, color: 'text-yellow-400' },
  break_end: { label: 'Fim Pausa', icon: Play, color: 'text-blue-400' },
  clock_out: { label: 'Saída', icon: LogOut, color: 'text-red-400' },
};

const ValidationStatus = ({ validation }: { validation?: TimeLog['validation'] }) => {
  if (!validation) return <Badge variant="secondary"><AlertTriangle className="mr-1 h-3 w-3"/>Pendente</Badge>;
  if (validation.isValidated) return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3"/>Validado</Badge>;
  return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3"/>Rejeitado</Badge>;
};

export function TimeLogHistory({ allUsers, allTimeLogs }: TimeLogHistoryProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const filteredLogs = useMemo(() => {
    if (!selectedUserId) return [];
    return allTimeLogs
      .filter(log => log.userId === selectedUserId && isSameDay(new Date(log.timestamp), selectedDate))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [allTimeLogs, selectedUserId, selectedDate]);

  const collaborators = allUsers.filter(u => u.role === 'collaborator' || u.role === 'supervisor');

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="text-primary"/>
          Histórico de Pontos
        </CardTitle>
        <CardDescription>Filtre e visualize os registros de ponto dos colaboradores.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-lg bg-background/30">
          <div className="flex-1 space-y-2">
             <label className="text-sm font-medium">Colaborador</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um colaborador" />
              </SelectTrigger>
              <SelectContent>
                {collaborators.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-2">
             <label className="text-sm font-medium">Data</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'PPP', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-auto">
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
              {selectedUserId ? (
                filteredLogs.length > 0 ? filteredLogs.map((log) => {
                  const details = actionDetails[log.action];
                  const Icon = details.icon;
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className={`flex items-center font-medium ${details.color}`}>
                          <Icon className="mr-2 h-4 w-4" />
                          {details.label}
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
                            className="rounded-full object-cover aspect-square"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Nenhum registro encontrado para esta data.
                    </TableCell>
                  </TableRow>
                )
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Selecione um colaborador e uma data para ver os registros.
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
