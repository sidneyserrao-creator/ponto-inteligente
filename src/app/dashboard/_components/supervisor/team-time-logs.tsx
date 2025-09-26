'use client';
import { useState } from 'react';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { editTimeLog } from '@/lib/actions';
import type { User, TimeLog } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, CheckCircle, XCircle, AlertTriangle, Edit, Play, Coffee, LogOut, Loader2 } from 'lucide-react';

type TeamMemberWithLogs = User & { timeLogs: TimeLog[] };

interface TeamTimeLogsProps {
  teamLogs: TeamMemberWithLogs[];
}

const actionDetails = {
  clock_in: { label: 'Entrada', icon: Play, color: 'text-green-400' },
  break_start: { label: 'Início Pausa', icon: Coffee, color: 'text-yellow-400' },
  break_end: { label: 'Fim Pausa', icon: Play, color: 'text-blue-400' },
  clock_out: { label: 'Saída', icon: LogOut, color: 'text-red-400' },
};

const ValidationStatus = ({ validation }: { validation: TimeLog['validation'] }) => {
  if (!validation) return <Badge variant="secondary"><AlertTriangle className="mr-1 h-3 w-3"/>Pendente</Badge>;
  if (validation.isValidated) return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3"/>Validado</Badge>;
  return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3"/>Rejeitado</Badge>;
};

function EditLogDialog({ log, open, onOpenChange }: { log: TimeLog, open: boolean, onOpenChange: (open: boolean) => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const [newTime, setNewTime] = useState(format(new Date(log.timestamp), 'HH:mm:ss'));

    const handleSubmit = async () => {
        setIsLoading(true);
        const [hours, minutes, seconds] = newTime.split(':').map(Number);
        const newDate = new Date(log.timestamp);
        newDate.setHours(hours, minutes, seconds);

        const result = await editTimeLog(log.id, newDate.toISOString());

        if (result.success) {
            toast({ title: 'Sucesso', description: result.message });
            onOpenChange(false);
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: result.error });
        }
        setIsLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Registro de Ponto</DialogTitle>
                    <DialogDescription>Ajuste o horário do registro. Esta ação será registrada.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Input 
                        type="time" 
                        step="1"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export function TeamTimeLogs({ teamLogs }: TeamTimeLogsProps) {
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null);

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Users className="text-primary"/>
            Registros da Equipe
        </CardTitle>
        <CardDescription>Visualize e gerencie os registros de ponto da sua equipe.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {teamLogs.map(member => (
            <AccordionItem value={member.id} key={member.id}>
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.profilePhotoUrl} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{member.name}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ação</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Validação</TableHead>
                      <TableHead className="text-right">Ajuste</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {member.timeLogs.map(log => {
                      const details = actionDetails[log.action];
                      const Icon = details.icon;
                      return (
                        <TableRow key={log.id}>
                          <TableCell><div className={`flex items-center ${details.color}`}><Icon className="mr-2 h-4 w-4" />{details.label}</div></TableCell>
                          <TableCell>{format(new Date(log.timestamp), 'HH:mm:ss', { locale: ptBR })}</TableCell>
                          <TableCell><ValidationStatus validation={log.validation} /></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => setEditingLog(log)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {member.timeLogs.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center h-24">Nenhum registro hoje.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
      {editingLog && <EditLogDialog log={editingLog} open={!!editingLog} onOpenChange={() => setEditingLog(null)} />}
    </GlassCard>
  );
}
