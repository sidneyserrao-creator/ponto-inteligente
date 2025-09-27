'use client';
import { useState } from 'react';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { saveWorkPost, removeWorkPost } from '@/lib/actions';
import type { WorkPost, User } from '@/lib/types';
import { Briefcase, PlusCircle, UserCircle, Edit, Trash2, Globe, MapPin, CircleDot } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : <><PlusCircle className="mr-2 h-4 w-4" /> Criar Posto</>)}
        </Button>
    );
}

function WorkPostForm({ workPost, supervisors, onFinished }: { workPost?: WorkPost | null; supervisors: User[]; onFinished: () => void }) {
    const { toast } = useToast();
    const [radius, setRadius] = useState(workPost?.radius || 100);

    const handleSubmit = async (formData: FormData) => {
        const result = await saveWorkPost(formData);
        if (result?.success) {
            toast({ title: 'Sucesso!', description: result.message });
            onFinished();
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: result.error ?? 'Ocorreu um erro.' });
        }
    };

    return (
        <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="id" value={workPost?.id || ''} />
            <div className="space-y-2">
                <Label htmlFor="name">Nome do Posto</Label>
                <Input id="name" name="name" placeholder="Ex: Sede, Cliente A" required defaultValue={workPost?.name} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" name="address" placeholder="Rua, número, cidade..." required defaultValue={workPost?.address} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="supervisorId">Supervisor Responsável</Label>
                <Select name="supervisorId" defaultValue={workPost?.supervisorId || 'none'}>
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

            {/* Geolocation Fields */}
            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-5 w-5" />
                    <h4 className="font-semibold text-foreground">Geolocalização (Opcional)</h4>
                </div>
                <p className="text-xs text-muted-foreground">
                    Para validar a localização do colaborador, preencha a latitude, longitude e o raio permitido.
                    Você pode obter as coordenadas de um endereço usando o Google Maps.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input id="latitude" name="latitude" type="number" step="any" placeholder="-23.550520" defaultValue={workPost?.latitude} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input id="longitude" name="longitude" type="number" step="any" placeholder="-46.633308" defaultValue={workPost?.longitude} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="radius">Raio para Ponto (em metros)</Label>
                    <Input id="radius" name="radius" type="number" placeholder="100" defaultValue={workPost?.radius || 100} onChange={(e) => setRadius(Number(e.target.value))} />
                </div>
                
                 {/* Visual Placeholder for Map */}
                 <div className="relative h-40 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    <MapPin className="h-10 w-10 text-primary opacity-30"/>
                    <div 
                        className="absolute bg-primary/20 border-2 border-dashed border-primary rounded-full"
                        style={{ width: `${Math.min(radius, 400)/400 * 100}%`, height: `${Math.min(radius, 400)/400 * 100}%` }}
                    />
                    <div className="absolute h-2 w-2 bg-primary rounded-full" />
                    <p className="absolute bottom-2 text-xs text-muted-foreground">Visualização do raio (não é um mapa real)</p>
                </div>
            </div>

             <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <SubmitButton isEditing={!!workPost} />
            </DialogFooter>
        </form>
    );
}


interface WorkPostManagerProps {
  initialWorkPosts: WorkPost[];
  supervisors: User[];
  allUsers: User[];
}

export function WorkPostManager({ initialWorkPosts, supervisors, allUsers }: WorkPostManagerProps) {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<WorkPost | null>(null);

  const handleAdd = () => {
    setEditingPost(null);
    setIsFormOpen(true);
  };

  const handleEdit = (post: WorkPost) => {
    setEditingPost(post);
    setIsFormOpen(true);
  }

  const handleDelete = async (postId: string) => {
      if (confirm('Tem certeza que deseja remover este posto de trabalho?')) {
          const result = await removeWorkPost(postId);
          if (result.success) {
              toast({ title: 'Sucesso!', description: result.message });
          } else {
              toast({ variant: 'destructive', title: 'Erro', description: result.error});
          }
      }
  }

  const getSupervisorName = (supervisorId?: string) => {
    return allUsers.find(u => u.id === supervisorId)?.name || 'N/A';
  }

  return (
    <GlassCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
              <Briefcase className="text-primary"/>
              Gerenciar Postos
          </CardTitle>
          <Button onClick={handleAdd} size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Novo Posto</Button>
        </div>
        <CardDescription>Crie e gerencie os postos de trabalho e suas áreas de ponto.</CardDescription>
      </CardHeader>
      <CardContent>
        <h3 className="text-sm font-medium mb-2">Postos Atuais</h3>
        <ScrollArea className="h-60">
            <div className="space-y-2 pr-4">
                {initialWorkPosts.map(post => (
                    <div key={post.id} className="p-3 bg-background/50 rounded-lg flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{post.name}</p>
                          <p className="text-xs text-muted-foreground">{post.address}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <UserCircle className="h-4 w-4" />
                              <span>{getSupervisorName(post.supervisorId)}</span>
                          </div>
                           {post.radius && (
                                <div className="flex items-center gap-2 mt-1 text-xs text-blue-400">
                                    <CircleDot className="h-4 w-4" />
                                    <span>Raio de {post.radius}m</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center -mt-2 -mr-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
      </CardContent>

       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingPost ? 'Editar Posto de Trabalho' : 'Novo Posto de Trabalho'}</DialogTitle>
                    <DialogDescription>
                        {editingPost ? 'Altere os dados do posto de trabalho e sua área de ponto.' : 'Preencha os dados do novo posto de trabalho.'}
                    </DialogDescription>
                </DialogHeader>
                <WorkPostForm workPost={editingPost} supervisors={supervisors} onFinished={() => setIsFormOpen(false)} />
            </DialogContent>
        </Dialog>
    </GlassCard>
  );
}
