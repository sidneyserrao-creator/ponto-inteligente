'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { saveIndividualSchedule } from '@/lib/actions';
import type { User, WorkPost, IndividualSchedule } from '@/lib/types';
import { CalendarDays, Save, User as UserIcon } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format, startOfMonth, getDaysInMonth, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} size="sm" className="mt-4">
            {pending ? 'Salvando...' : <><Save className="mr-2 h-4 w-4" /> Salvar Escala</>}
        </Button>
    );
}

function CollaboratorScheduleForm({ user, onSave, currentMonth }: { user: User, onSave: () => void, currentMonth: Date }) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [daysOfMonth, setDaysOfMonth] = useState<{ date: Date; dateKey: string; label: string; }[]>([]);

    useEffect(() => {
        const start = startOfMonth(currentMonth);
        const daysInMonth = getDaysInMonth(currentMonth);
        const month = Array.from({ length: daysInMonth }).map((_, i) => {
            const day = addDays(start, i);
            return {
                date: day,
                dateKey: format(day, 'yyyy-MM-dd'),
                label: format(day, 'dd EEE', { locale: ptBR }),
            };
        });
        setDaysOfMonth(month);
    }, [currentMonth]);

    const handleSetFolga = (dateKey: string) => {
        if (formRef.current) {
            const startInput = formRef.current.elements.namedItem(`${dateKey}-start`) as HTMLInputElement;
            const endInput = formRef.current.elements.namedItem(`${dateKey}-end`) as HTMLInputElement;
            if (startInput) startInput.value = '';
            if (endInput) endInput.value = '';
        }
    };
    
    const handleSubmit = async (formData: FormData) => {
        formData.append('userId', user.id);
        const result = await saveIndividualSchedule(formData);

        if (result.success) {
            toast({ title: 'Sucesso!', description: 'Escala do colaborador atualizada.' });
            onSave();
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: result.error });
        }
    };

    return (
        <form ref={formRef} action={handleSubmit} className="p-4 bg-background/30 border rounded-lg space-y-4">
            <div className="flex items-center gap-3">
                 <Avatar>
                    <AvatarImage src={user.profilePhotoUrl} alt={user.name} />
                    <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <p className="font-semibold">{user.name}</p>
            </div>
            
            <ScrollArea className="w-full">
                <div className="flex space-x-4 pb-4">
                    {daysOfMonth.map(day => (
                        <div key={day.dateKey} className="w-28 flex-shrink-0">
                            <p className="text-xs font-medium text-center mb-1 capitalize">{day.label}</p>
                            <div className="space-y-1">
                                <Input 
                                    type="time" 
                                    name={`${day.dateKey}-start`} 
                                    className="h-8" 
                                    defaultValue={user.schedule?.[day.dateKey]?.start}
                                />
                                <Input 
                                    type="time" 
                                    name={`${day.dateKey}-end`} 
                                    className="h-8" 
                                    defaultValue={user.schedule?.[day.dateKey]?.end}
                                />
                                <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs w-full" onClick={() => handleSetFolga(day.dateKey)}>
                                    Folga
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <SubmitButton />
        </form>
    )
}

export function IndividualScheduleManager({ allUsers, workPosts }: { allUsers: User[], workPosts: WorkPost[] }) {
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [currentMonth] = useState(new Date());

  const collaboratorsInPost = useMemo(() => {
    if (!selectedPostId) return [];
    return allUsers.filter(user => user.workPostId === selectedPostId && user.role === 'collaborator');
  }, [allUsers, selectedPostId]);

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <CalendarDays className="text-primary"/>
            Escalas Individuais - {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </CardTitle>
        <CardDescription>Defina escalas de trabalho personalizadas para cada colaborador por posto de trabalho.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-2 max-w-sm">
           <label className="text-sm font-medium">Posto de Trabalho</label>
           <Select value={selectedPostId} onValueChange={setSelectedPostId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um posto de trabalho" />
              </SelectTrigger>
              <SelectContent>
                {workPosts.map(post => (
                  <SelectItem key={post.id} value={post.id}>{post.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>

        <div className="space-y-4">
             {selectedPostId ? (
                collaboratorsInPost.length > 0 ? (
                    collaboratorsInPost.map(user => (
                        <CollaboratorScheduleForm 
                            key={user.id} 
                            user={user}
                            currentMonth={currentMonth}
                            onSave={() => { /* Could trigger revalidation if needed */ }}
                        />
                    ))
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <UserIcon className="mx-auto h-8 w-8 mb-2" />
                        Nenhum colaborador encontrado neste posto.
                    </div>
                )
             ) : (
                <div className="text-center py-10 text-muted-foreground">
                    Selecione um posto de trabalho para ver os colaboradores e gerenciar suas escalas.
                </div>
             )}
        </div>

      </CardContent>
    </GlassCard>
  );
}
