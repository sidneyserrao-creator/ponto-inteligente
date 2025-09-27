'use client';
import { useRef, useState } from 'react';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { createAnnouncement, removeAnnouncement } from '@/lib/actions';
import type { Announcement, User } from '@/lib/types';
import { Megaphone, Trash2, PlusCircle } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Publicando...' : <><PlusCircle className="mr-2 h-4 w-4" /> Publicar Aviso</>}
        </Button>
    );
}

interface AnnouncementManagerProps {
  initialAnnouncements: Announcement[];
  collaborators: User[];
}

export function AnnouncementManager({ initialAnnouncements, collaborators }: AnnouncementManagerProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [target, setTarget] = useState('all');

  const handleCreate = async (formData: FormData) => {
    const result = await createAnnouncement(formData);
    if (result?.error) {
        toast({ variant: 'destructive', title: 'Erro', description: result.error });
    } else {
        toast({ title: 'Sucesso', description: 'Aviso publicado!' });
        formRef.current?.reset();
        setTarget('all');
    }
  };

  const handleDelete = async (id: string) => {
    await removeAnnouncement(id);
    toast({ title: 'Sucesso', description: 'Aviso removido.' });
  };

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Megaphone className="text-primary"/>
            Criar Avisos
        </CardTitle>
        <CardDescription>Crie e remova avisos para toda a empresa ou um colaborador específico.</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleCreate} className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" placeholder="Título do aviso" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea id="content" name="content" placeholder="Escreva o conteúdo do aviso aqui." required />
          </div>
          
          <div className="space-y-2">
             <Label>Enviar para</Label>
              <RadioGroup name="target" defaultValue="all" onValueChange={setTarget} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="r1" />
                  <Label htmlFor="r1">Todos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="individual" id="r2" />
                  <Label htmlFor="r2">Individual</Label>
                </div>
              </RadioGroup>
          </div>

          {target === 'individual' && (
            <div className="space-y-2">
                <Label htmlFor="userId">Colaborador</Label>
                <Select name="userId">
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
          )}

          <SubmitButton />
        </form>
        
        <h3 className="text-sm font-medium mb-2">Avisos Atuais</h3>
        <ScrollArea className="h-40">
            <div className="space-y-2 pr-4">
                {initialAnnouncements.map(announcement => (
                    <div key={announcement.id} className="flex items-center justify-between p-2 bg-background/50 rounded-md">
                        <p className="font-medium text-sm truncate">{announcement.title}</p>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(announcement.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>
        </ScrollArea>
      </CardContent>
    </GlassCard>
  );
}
