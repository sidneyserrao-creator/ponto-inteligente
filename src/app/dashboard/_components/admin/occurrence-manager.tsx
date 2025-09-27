'use client';
import { useRef, useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { logOccurrence } from '@/lib/actions';
import type { User, Occurrence, OccurrenceType } from '@/lib/types';
import { CalendarIcon, ClipboardList, PlusCircle, Loader2, AlertCircle, User as UserIcon, BookUser, FileWarning, ParkingCircleOff, FerrisWheel } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const occurrenceTypes: { value: OccurrenceType; label: string; icon: React.ElementType }[] = [
    { value: 'justified_absence', label: 'Falta Justificada', icon: BookUser },
    { value: 'medical_leave', label: 'Atestado Médico', icon: FileWarning },
    { value: 'unjustified_absence', label: 'Falta Injustificada', icon: ParkingCircleOff },
    { value: 'vacation', label: 'Férias', icon: FerrisWheel },
];

const occurrenceTypeDetails = occurrenceTypes.reduce((acc, current) => {
    acc[current.value] = { label: current.label, icon: current.icon };
    return acc;
}, {} as Record<OccurrenceType, { label: string; icon: React.ElementType }>);

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? <Loader2 className="animate-spin" /> : <PlusCircle />}
            {pending ? 'Registrando...' : 'Registrar Ocorrência'}
        </Button>
    );
}

interface OccurrenceManagerProps {
  allUsers: User[];
  initialOccurrences: Occurrence[];
}

export function OccurrenceManager({ allUsers, initialOccurrences }: OccurrenceManagerProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(logOccurrence, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const getUserName = (userId: string) => allUsers.find(u => u.id === userId)?.name || 'Desconhecido';

  useEffect(() => {
    if (state?.success) {
      toast({ title: 'Sucesso!', description: state.message });
      formRef.current?.reset();
      setDate(new Date());
    }
  }, [state, toast]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Registro */}
        <GlassCard>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PlusCircle className="text-primary" />
                    Registrar Ocorrência
                </CardTitle>
                <CardDescription>Adicione uma nova ocorrência para um colaborador.</CardDescription>
            </CardHeader>
            <CardContent>
                <form ref={formRef} action={formAction} className="space-y-4">
                    {state?.error && (
                         <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Erro</AlertTitle>
                            <AlertDescription>{state.error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Colaborador</label>
                        <Select name="userId" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um colaborador" />
                            </SelectTrigger>
                            <SelectContent>
                                {allUsers.map(user => (
                                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Data</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2" />
                                    {date ? format(date, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus locale={ptBR} />
                            </PopoverContent>
                        </Popover>
                        <input type="hidden" name="date" value={date ? format(date, 'yyyy-MM-dd') : ''} />
                    </div>

                     <div className="space-y-1">
                        <label className="text-sm font-medium">Tipo de Ocorrência</label>
                        <Select name="type" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {occurrenceTypes.map(({ value, label, icon: Icon }) => (
                                    <SelectItem key={value} value={value}>
                                        <div className="flex items-center gap-2"><Icon />{label}</div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium">Descrição</label>
                        <Textarea name="description" placeholder="Ex: Atestado médico de 1 dia." required />
                    </div>

                    <SubmitButton />
                </form>
            </CardContent>
        </GlassCard>

        {/* Lista de Ocorrências */}
        <GlassCard>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="text-primary" />
                    Ocorrências Recentes
                </CardTitle>
                <CardDescription>Lista das últimas ocorrências registradas no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-3 pr-4">
                        {initialOccurrences.length > 0 ? initialOccurrences.map(occ => {
                             const details = occurrenceTypeDetails[occ.type];
                             const Icon = details.icon;
                             const user = allUsers.find(u => u.id === occ.userId);
                            return (
                                <div key={occ.id} className="p-3 bg-background/50 rounded-lg">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {user && (
                                                <Avatar>
                                                    <AvatarImage src={user.profilePhotoUrl} alt={user.name}/>
                                                    <AvatarFallback>{user.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div>
                                                <p className="font-semibold text-sm">{getUserName(occ.userId)}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(occ.date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="flex items-center gap-1.5 whitespace-nowrap">
                                            <Icon className="h-3 w-3"/>
                                            {details.label}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2 pl-11">{occ.description}</p>
                                </div>
                            )
                        }) : (
                            <div className="text-center py-10 text-muted-foreground">
                                <UserIcon className="mx-auto h-8 w-8 mb-2" />
                                Nenhuma ocorrência registrada ainda.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </GlassCard>
    </div>
  );
}
