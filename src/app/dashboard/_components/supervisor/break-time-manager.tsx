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

interface BreakTimeManagerProps {
  supervisedPosts: WorkPost[];
  teamMembers: User[];
}

export function BreakTimeManager({ supervisedPosts, teamMembers }: BreakTimeManagerProps) {
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const selectedPost = useMemo(() => {
    return supervisedPosts.find(p => p.id === selectedPostId);
  }, [supervisedPosts, selectedPostId]);
  
  const collaboratorsInPost = useMemo(() => {
      if (!selectedPostId) return [];
      return teamMembers.filter(m => m.workPostId === selectedPostId);
  }, [teamMembers, selectedPostId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(event.currentTarget);
    const result = await saveBreakTime(formData);

    if (result.success) {
      toast({ title: 'Sucesso!', description: result.message });
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    
    setIsLoading(false);
  };

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Coffee className="text-primary"/>
            Gerenciar Horário de Intervalo
        </CardTitle>
        <CardDescription>Defina o horário de intervalo padrão para os postos que você supervisiona.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="space-y-2">
            <Label htmlFor="workPost">Posto de Trabalho</Label>
             <Select name="workPostId" value={selectedPostId} onValueChange={setSelectedPostId}>
              <SelectTrigger>
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="breakStartTime">Início do Intervalo</Label>
                  <Input id="breakStartTime" name="breakStartTime" type="time" defaultValue={selectedPost?.breakStartTime || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breakEndTime">Fim do Intervalo</Label>
                  <Input id="breakEndTime" name="breakEndTime" type="time" defaultValue={selectedPost?.breakEndTime || ''} />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isLoading ? 'Salvando...' : 'Salvar Horários'}
              </Button>

              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2 text-muted-foreground"><Users className="h-4 w-4"/> Equipe do Posto</h3>
                <ScrollArea className="h-40 border rounded-lg p-2">
                    {collaboratorsInPost.length > 0 ? (
                        collaboratorsInPost.map(user => (
                            <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.profilePhotoUrl} />
                                    <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{user.name}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-sm text-muted-foreground py-4">Nenhum colaborador neste posto.</p>
                    )}
                </ScrollArea>
              </div>
            </>
          )}

          {!selectedPostId && (
             <div className="text-center py-10 text-muted-foreground">
                <Briefcase className="mx-auto h-8 w-8 mb-2" />
                Selecione um posto para gerenciar o horário de intervalo.
            </div>
          )}
        </form>
      </CardContent>
    </GlassCard>
  );
}
