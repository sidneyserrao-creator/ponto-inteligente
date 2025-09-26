'use client';
import { useRef } from 'react';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { createAnnouncement, removeAnnouncement } from '@/lib/actions';
import type { Announcement } from '@/lib/types';
import { Megaphone, Trash2, PlusCircle } from 'lucide-react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Publicando...' : <><PlusCircle className="mr-2 h-4 w-4" /> Publicar Anúncio</>}
        </Button>
    );
}

export function AnnouncementManager({ initialAnnouncements }: { initialAnnouncements: Announcement[] }) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const handleCreate = async (formData: FormData) => {
    const result = await createAnnouncement(formData);
    if (result?.error) {
        toast({ variant: 'destructive', title: 'Erro', description: result.error });
    } else {
        toast({ title: 'Sucesso', description: 'Anúncio publicado!' });
        formRef.current?.reset();
    }
  };

  const handleDelete = async (id: string) => {
    await removeAnnouncement(id);
    toast({ title: 'Sucesso', description: 'Anúncio removido.' });
  };

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Megaphone className="text-primary"/>
            Gerenciar Anúncios
        </CardTitle>
        <CardDescription>Crie e remova anúncios para toda a empresa.</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleCreate} className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" placeholder="Título do anúncio" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea id="content" name="content" placeholder="Escreva o conteúdo do anúncio aqui." required />
          </div>
          <SubmitButton />
        </form>
        
        <h3 className="text-sm font-medium mb-2">Anúncios Atuais</h3>
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
