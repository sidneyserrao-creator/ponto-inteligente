'use client';
import { useState } from 'react';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { saveWorkShift, removeWorkShift } from '@/lib/actions';
import type { WorkShift } from '@/lib/types';
import { CalendarClock, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useFormStatus } from 'react-dom';
import { Checkbox } from '@/components/ui/checkbox';

const daysOfWeek = [
    { id: 'Seg', label: 'Segunda' },
    { id: 'Ter', label: 'Terça' },
    { id: 'Qua', label: 'Quarta' },
    { id: 'Qui', label: 'Quinta' },
    { id: 'Sex', label: 'Sexta' },
    { id: 'Sab', label: 'Sábado' },
    { id: 'Dom', label: 'Domingo' },
];

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Escala')}
        </Button>
    );
}

function WorkShiftForm({ workShift, onFinished }: { workShift?: WorkShift | null; onFinished: () => void }) {
    const { toast } = useToast();

    const handleSubmit = async (formData: FormData) => {
        const result = await saveWorkShift(formData);
        if (result?.success) {
            toast({ title: 'Sucesso!', description: result.message });
            onFinished();
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: result.error ?? 'Ocorreu um erro.' });
        }
    };
    
    return (
        <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="id" value={workShift?.id || ''} />
            <div className="space-y-2">
                <Label htmlFor="name">Nome da Escala</Label>
                <Input id="name" name="name" placeholder="Ex: Turno Diurno 8h-17h" required defaultValue={workShift?.name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startTime">Horário de Início</Label>
                    <Input id="startTime" name="startTime" type="time" required defaultValue={workShift?.startTime} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="endTime">Horário de Fim</Label>
                    <Input id="endTime" name="endTime" type="time" required defaultValue={workShift?.endTime} />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Dias da Semana</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 rounded-lg border p-4">
                    {daysOfWeek.map(day => (
                        <div key={day.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`day-${day.id}`} 
                                name="days" 
                                value={day.id}
                                defaultChecked={workShift?.days.includes(day.id)}
                            />
                            <Label htmlFor={`day-${day.id}`} className="font-normal">{day.label}</Label>
                        </div>
                    ))}
                </div>
            </div>
             <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <SubmitButton isEditing={!!workShift} />
            </DialogFooter>
        </form>
    );
}

export function WorkShiftManager({ initialWorkShifts }: { initialWorkShifts: WorkShift[] }) {
    const { toast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<WorkShift | null>(null);

    const handleAdd = () => {
        setEditingShift(null);
        setIsFormOpen(true);
    };

    const handleEdit = (shift: WorkShift) => {
        setEditingShift(shift);
        setIsFormOpen(true);
    }

    const handleDelete = async (shiftId: string) => {
        if (confirm('Tem certeza que deseja remover esta escala de trabalho?')) {
            const result = await removeWorkShift(shiftId);
            if (result.success) {
                toast({ title: 'Sucesso!', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Erro', description: result.error });
            }
        }
    }

    return (
        <GlassCard>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <CalendarClock className="text-primary"/>
                        Gerenciar Escalas
                    </CardTitle>
                    <Button onClick={handleAdd} size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Nova Escala</Button>
                </div>
                <CardDescription>Crie e gerencie os turnos e escalas de trabalho da equipe.</CardDescription>
            </CardHeader>
            <CardContent>
                <h3 className="text-sm font-medium mb-2">Escalas Atuais</h3>
                <ScrollArea className="h-96">
                    <div className="space-y-3 pr-4">
                        {initialWorkShifts.map(shift => (
                            <div key={shift.id} className="p-4 bg-background/50 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{shift.name}</p>
                                        <p className="text-sm text-muted-foreground">{shift.startTime} - {shift.endTime}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(shift)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(shift.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {shift.days.map(day => (
                                        <div key={day} className="text-xs bg-primary/20 text-primary-foreground px-2 py-0.5 rounded-full">{day}</div>
                                    ))}
                                </div>
                            </div>
                        ))}
                         {initialWorkShifts.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                Nenhuma escala de trabalho criada ainda.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>

             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingShift ? 'Editar Escala' : 'Nova Escala de Trabalho'}</DialogTitle>
                        <DialogDescription>
                            {editingShift ? 'Altere os dados da escala.' : 'Preencha os dados da nova escala.'}
                        </DialogDescription>
                    </DialogHeader>
                    <WorkShiftForm workShift={editingShift} onFinished={() => setIsFormOpen(false)} />
                </DialogContent>
            </Dialog>
        </GlassCard>
    );
}
