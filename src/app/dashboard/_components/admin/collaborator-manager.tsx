'use client';
import { useState, useMemo, useActionState } from 'react';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { saveCollaborator, removeCollaborator } from '@/lib/actions';
import type { User, Role, WorkPost } from '@/lib/types';
import { Users, PlusCircle, Edit, Trash2, Loader2, UserPlus, Search } from 'lucide-react';
import { useFormStatus } from 'react-dom';

const initialState = {
  message: '',
  errors: {},
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? <Edit className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />)}
            {pending ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Colaborador')}
        </Button>
    );
}

function CollaboratorForm({ user, workPosts, onFinished }: { user?: User | null, workPosts: WorkPost[], onFinished: () => void }) {
    const [state, formAction] = useActionState(saveCollaborator, initialState);
    const { toast } = useToast();

    const handleSubmit = async (formData: FormData) => {
        const result = await saveCollaborator(formData);
        if (result?.success) {
            toast({ title: 'Sucesso!', description: result.message });
            onFinished();
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: result.error });
        }
    };
    
    return (
        <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="id" value={user?.id} />
            <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" defaultValue={user?.name} required />
            </div>
            <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={user?.email} required />
            </div>
            <div>
                <Label htmlFor="role">Função</Label>
                 <Select name="role" defaultValue={user?.role || 'collaborator'}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="collaborator">Colaborador</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div>
                <Label htmlFor="workPostId">Posto de Trabalho</Label>
                 <Select name="workPostId" defaultValue={user?.workPostId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione o posto" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {workPosts.map(post => (
                            <SelectItem key={post.id} value={post.id}>{post.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                <DialogClose asChild><Button variant="outline" className="w-full sm:w-auto">Cancelar</Button></DialogClose>
                <SubmitButton isEditing={!!user} />
            </DialogFooter>
        </form>
    );
}

export function CollaboratorManager({ collaborators, workPosts }: { collaborators: User[], workPosts: WorkPost[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredCollaborators = useMemo(() => {
    if (!searchTerm) return collaborators;
    return collaborators.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [collaborators, searchTerm]);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if(confirm('Tem certeza que deseja remover este colaborador?')) {
        const result = await removeCollaborator(userId);
        if (result.success) {
            toast({ title: 'Sucesso', description: result.message });
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: result.error });
        }
    }
  }
  
  const getWorkPostName = (workPostId?: string) => {
    return workPosts.find(p => p.id === workPostId)?.name || 'N/A';
  }


  return (
    <GlassCard>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Users className="text-primary"/>
                    Gerenciar Colaboradores
                </CardTitle>
                <CardDescription>Adicione, edite ou remova colaboradores do sistema.</CardDescription>
            </div>
            <Button onClick={handleAdd} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Adicionar</Button>
        </div>
        <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Buscar por nome ou email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="hidden lg:table-cell">Função</TableHead>
                        <TableHead className="hidden lg:table-cell">Posto</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredCollaborators.map(user => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.profilePhotoUrl} alt={user.name} />
                                        <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{user.name}</span>
                                      <span className="text-muted-foreground text-sm md:hidden">{user.email}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                            <TableCell className="hidden lg:table-cell">{user.role}</TableCell>
                            <TableCell className="hidden lg:table-cell">{getWorkPostName(user.workPostId)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </CardContent>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingUser ? 'Editar Colaborador' : 'Adicionar Colaborador'}</DialogTitle>
                    <DialogDescription>
                        {editingUser ? 'Altere os dados do colaborador.' : 'Preencha os dados do novo colaborador.'}
                    </DialogDescription>
                </DialogHeader>
                <CollaboratorForm user={editingUser} workPosts={workPosts} onFinished={() => setIsFormOpen(false)} />
            </DialogContent>
        </Dialog>
    </GlassCard>
  );
}
