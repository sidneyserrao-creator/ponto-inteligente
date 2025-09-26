'use client';
import { useRef } from 'react';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { createWorkPost } from '@/lib/actions';
import type { WorkPost, User } from '@/lib/types';
import { Briefcase, PlusCircle, UserCircle } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Criando...' : <><PlusCircle className="mr-2 h-4 w-4" /> Criar Posto</>}
        </Button>
    );
}

interface WorkPostManagerProps {
  initialWorkPosts: WorkPost[];
  supervisors: User[];
  allUsers: User[];
}

export function WorkPostManager({ initialWorkPosts, supervisors, allUsers }: WorkPostManagerProps) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const handleCreate = async (formData: FormData) => {
    const result = await createWorkPost(formData);
    if (result?.error) {
        toast({ variant: 'destructive', title: 'Erro', description: result.error });
    } else {
        toast({ title: 'Sucesso', description: 'Posto de trabalho criado!' });
        formRef.current?.reset();
    }
  };

  const getSupervisorName = (supervisorId?: string) => {
    return allUsers.find(u => u.id === supervisorId)?.name || 'N/A';
  }

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Briefcase className="text-primary"/>
            Gerenciar Postos
        </CardTitle>
        <CardDescription>Crie e gerencie os postos de trabalho.</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleCreate} className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Posto</Label>
            <Input id="name" name="name" placeholder="Ex: Sede, Cliente A" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" name="address" placeholder="Rua, número, cidade..." required />
          </div>
           <div className="space-y-2">
            <Label htmlFor="supervisorId">Supervisor Responsável</Label>
            <Select name="supervisorId">
                <SelectTrigger>
                    <SelectValue placeholder="Selecione um supervisor" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {supervisors.map(supervisor => (
                        <SelectItem key={supervisor.id} value={supervisor.id}>{supervisor.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <SubmitButton />
        </form>
        
        <h3 className="text-sm font-medium mb-2">Postos Atuais</h3>
        <ScrollArea className="h-40">
            <div className="space-y-2 pr-4">
                {initialWorkPosts.map(post => (
                    <div key={post.id} className="p-3 bg-background/50 rounded-lg">
                        <p className="font-medium text-sm">{post.name}</p>
                        <p className="text-xs text-muted-foreground">{post.address}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <UserCircle className="h-4 w-4" />
                            <span>{getSupervisorName(post.supervisorId)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
      </CardContent>
    </GlassCard>
  );
}
