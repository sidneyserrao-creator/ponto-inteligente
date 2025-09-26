'use client';
import { useRef } from 'react';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { createWorkPost } from '@/lib/actions';
import type { WorkPost } from '@/lib/types';
import { Briefcase, PlusCircle } from 'lucide-react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Criando...' : <><PlusCircle className="mr-2 h-4 w-4" /> Criar Posto</>}
        </Button>
    );
}

export function WorkPostManager({ initialWorkPosts }: { initialWorkPosts: WorkPost[] }) {
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
          <SubmitButton />
        </form>
        
        <h3 className="text-sm font-medium mb-2">Postos Atuais</h3>
        <ScrollArea className="h-40">
            <div className="space-y-2 pr-4">
                {initialWorkPosts.map(post => (
                    <div key={post.id} className="p-2 bg-background/50 rounded-md">
                        <p className="font-medium text-sm">{post.name}</p>
                        <p className="text-xs text-muted-foreground">{post.address}</p>
                    </div>
                ))}
            </div>
        </ScrollArea>
      </CardContent>
    </GlassCard>
  );
}
