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
import { format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const dayIds = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} size="sm" className="mt-2">
            {pending ? 'Salvando...' : <><Save className="mr-2 h-4 w-4" /> Salvar Escala</>}
        </Button>
    );
}

function CollaboratorScheduleForm({ user, onSave }: { user: User, onSave: () => void}) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [daysOfWeek, setDaysOfWeek] = useState<{ id: string; label: string; }[]>([]);

    useEffect(() => {
        const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Week starts on Monday
        const week = Array.from({ length: 7 }).map((_, i) => {
            const day = addDays(start, i);
            return {
                id: dayIds[i],
                label: format(day, 'dd EEE', { locale: ptBR }),
            };
        });
        setDaysOfWeek(week);
    }, []);

    const handleSetFolga = (dayId: string) => {
        if (formRef.current) {
            const startInput = formRef.current.elements.namedItem(`${dayId}-start`) as HTMLInputElement;
            const endInput = formRef.current.elements.namedItem(`${dayId}-end`) as HTMLInputElement;
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
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-x-4 gap-y-2">
                {daysOfWeek.map(day => (
                    <div key={day.id}>
                        <p className="text-xs font-medium text-center mb-1 capitalize">{day.label}</p>
                        <div className="space-y-1">
                             <Input 
                                type="time" 
                                name={`${day.id}-start`} 
                                className="h-8" 
                                defaultValue={user.schedule?.[day.id as keyof IndividualSchedule]?.start}
                             />
                             <Input 
                                type="time" 
                                name={`${day.id}-end`} 
                                className="h-8" 
                                defaultValue={user.schedule?.[day.id as keyof IndividualSchedule]?.end}
                            />
                             <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs w-full" onClick={() => handleSetFolga(day.id)}>
                                Folga
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            <SubmitButton />
        </form>
    )
}

export function IndividualScheduleManager({ allUsers, workPosts }: { allUsers: User[], workPosts: WorkPost[] }) {
  const [selectedPostId, setSelectedPostId] = useState<string>('');

  const collaboratorsInPost = useMemo(() => {
    if (!selectedPostId) return [];
    return allUsers.filter(user => user.workPostId === selectedPostId && user.role === 'collaborator');
  }, [allUsers, selectedPostId]);

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <CalendarDays className="text-primary"/>
            Escalas Individuais
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
