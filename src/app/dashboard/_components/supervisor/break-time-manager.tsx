'use client';
import { useState, useMemo } from 'react';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { saveBreakTime } from '@/lib/actions';
import type { User, WorkPost } from '@/lib/types';
import { Coffee, Briefcase, Users, Save, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CollaboratorBreakFormProps {
    user: User;
}

function CollaboratorBreakForm({ user }: CollaboratorBreakFormProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);

        const formData = new FormData(event.currentTarget);
        formData.append('userId', user.id);
        const result = await saveBreakTime(formData);

        if (result.success) {
            toast({ title: 'Sucesso!', description: result.message });
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: result.error });
        }
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4 p-2 hover:bg-muted/50 rounded-md">
            <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profilePhotoUrl} />
                    <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{user.name}</span>
            </div>
            <div className="flex items-center gap-2">
                <Input type="time" name="breakStartTime" className="w-28 h-9" defaultValue={user.breakStartTime || ''} />
                <span className="text-muted-foreground">-</span>
                <Input type="time" name="breakEndTime" className="w-28 h-9" defaultValue={user.breakEndTime || ''} />
            </div>
            <Button type="submit" size="sm" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="hidden sm:inline ml-2">Salvar</span>
            </Button>
        </form>
    )
}

interface BreakTimeManagerProps {
  supervisedPosts: WorkPost[];
  teamMembers: User[];
}

export function BreakTimeManager({ supervisedPosts, teamMembers }: BreakTimeManagerProps) {
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  
  const collaboratorsInPost = useMemo(() => {
      if (!selectedPostId) return [];
      return teamMembers.filter(m => m.workPostId === selectedPostId);
  }, [teamMembers, selectedPostId]);


  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Coffee className="text-primary"/>
            Gerenciar Horário de Intervalo
        </CardTitle>
        <CardDescription>Defina o horário de intervalo padrão para os colaboradores dos postos que você supervisiona.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
         <div className="space-y-2">
          <Label htmlFor="workPost">Selecione um Posto de Trabalho</Label>
           <Select value={selectedPostId} onValueChange={setSelectedPostId}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Selecione um posto" />
            </SelectTrigger>
            <SelectContent>
              {supervisedPosts.map(post => (
                <SelectItem key={post.id} value={post.id}>{post.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
         </div>
        
        {selectedPostId && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4"/> Equipe do Posto</h3>
              <ScrollArea className="h-60 border rounded-lg p-2">
                  <div className="space-y-2">
                    {collaboratorsInPost.length > 0 ? (
                        collaboratorsInPost.map(user => (
                           <CollaboratorBreakForm key={user.id} user={user} />
                        ))
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">Nenhum colaborador neste posto.</p>
                    )}
                  </div>
              </ScrollArea>
            </div>
        )}

        {!selectedPostId && (
           <div className="text-center py-10 text-muted-foreground">
              <Briefcase className="mx-auto h-8 w-8 mb-2" />
              Selecione um posto para gerenciar os horários de intervalo da equipe.
          </div>
        )}
      </CardContent>
    </GlassCard>
  );
}
