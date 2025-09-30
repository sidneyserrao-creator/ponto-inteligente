
'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
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
import { Users, PlusCircle, Edit, Trash2, Loader2, UserPlus, Search, Upload, Camera, VideoOff, ArrowLeft } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { ScrollArea } from '@/components/ui/scroll-area';

const initialState = {
  message: '',
  errors: {},
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? <Edit className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />)}
            {pending ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Colaborador')}
        </Button>
    );
}

function CollaboratorForm({ user, workPosts, onFinished }: { user?: User | null, workPosts: WorkPost[], onFinished: () => void }) {
    const { toast } = useToast();
    const isEditing = !!user;
    const [view, setView] = useState<'form' | 'camera'>('form');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [previewUrl, setPreviewUrl] = useState<string | null>(user?.profilePhotoUrl || null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    
    // Camera Logic
    const startCamera = async () => {
        if (streamRef.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setHasCameraPermission(true);
        } catch (error) {
            console.error("Error accessing camera:", error);
            setHasCameraPermission(false);
            toast({
                variant: "destructive",
                title: "Câmera não permitida",
                description: "Habilite o acesso à câmera nas configurações do navegador.",
            });
            setView('form');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            if(videoRef.current) videoRef.current.srcObject = null;
        }
    };
    
    useEffect(() => {
        if (view === 'camera') {
            startCamera();
        } else {
            stopCamera();
        }
    }, [view]);
    
    // Cleanup camera on component unmount
    useEffect(() => {
      return () => stopCamera();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
                setCapturedImage(null); // Clear captured image if file is selected
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl(user?.profilePhotoUrl || null);
        }
    };

    const handleCaptureImage = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUri = canvas.toDataURL('image/jpeg');
                setPreviewUrl(dataUri);
                setCapturedImage(dataUri);
                setView('form');
            }
        }
    };


    const handleSubmit = async (formData: FormData) => {
        if(capturedImage) {
            formData.append('capturedPhoto', capturedImage);
        }
        
        const result = await saveCollaborator(formData);
        if (result?.success) {
            toast({ title: 'Sucesso!', description: result.message });
            onFinished();
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: result.error ?? 'Ocorreu um erro.' });
        }
    };

    if (view === 'camera') {
      return (
         <div className="w-full">
            <DialogHeader className="mb-4 text-center">
                <DialogTitle>Atualizar Foto de Perfil</DialogTitle>
                <DialogDescription>Posicione o rosto do colaborador e capture a nova foto.</DialogDescription>
            </DialogHeader>
            <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-center">
                        <VideoOff className="h-10 w-10 text-destructive mb-2"/>
                        <p className="font-semibold">Câmera não disponível</p>
                        <p className="text-sm text-muted-foreground">Verifique as permissões do seu navegador.</p>
                    </div>
                )}
            </div>
            <div className="flex gap-4 mt-4">
              <Button variant="outline" onClick={() => setView('form')} className="flex-1">
                <ArrowLeft /> Voltar
              </Button>
              <Button onClick={handleCaptureImage} className="flex-1" disabled={hasCameraPermission !== true}>
                <Camera /> Capturar
              </Button>
            </div>
          </div>
      )
    }
    
    return (
        <form action={handleSubmit} className="space-y-4 pr-6">
            <input type="hidden" name="id" value={user?.id || ''} />
            <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={previewUrl || undefined} alt={user?.name} className="object-cover" />
                    <AvatarFallback className="text-3xl">{user?.name ? user.name.split(' ').map(n => n[0]).join('') : <UserPlus/>}</AvatarFallback>
                </Avatar>
                <input 
                    type="file" 
                    name="profilePhoto" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept="image/*" 
                />
                {isEditing ? (
                    <Button type="button" variant="outline" onClick={() => setView('camera')}>
                        <Camera className="mr-2 h-4 w-4" />
                        Tirar Nova Foto
                    </Button>
                ) : (
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Carregar Foto
                    </Button>
                )}
            </div>
            <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" defaultValue={user?.name} required />
            </div>
            <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={user?.email} required />
            </div>
            <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" type="password" placeholder={user ? 'Deixe em branco para não alterar' : ''} required={!user} />
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
                 <Select name="workPostId" defaultValue={user?.workPostId || 'none'}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione o posto" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {workPosts.map(post => (
                            <SelectItem key={post.id} value={post.id}>{post.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4 sticky bottom-0 bg-background pb-1">
                <DialogClose asChild><Button type="button" variant="outline" className="w-full sm:w-auto">Cancelar</Button></DialogClose>
                <SubmitButton isEditing={!!user} />
            </DialogFooter>
        </form>
    );
}

const getRoleName = (role: Role) => {
    switch (role) {
        case 'admin': return 'Administrador';
        case 'supervisor': return 'Supervisor';
        case 'collaborator': return 'Colaborador';
        default: return role;
    }
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
                                        <AvatarImage src={user.profilePhotoUrl} alt={user.name} className="object-cover" />
                                        <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{user.name}</span>
                                      <span className="text-muted-foreground text-sm md:hidden">{user.email}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                            <TableCell className="hidden lg:table-cell">{getRoleName(user.role)}</TableCell>
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

        <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
          setIsFormOpen(isOpen);
          if (!isOpen) {
            setEditingUser(null);
          }
        }}>
            <DialogContent className="max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{editingUser ? 'Editar Colaborador' : 'Adicionar Colaborador'}</DialogTitle>
                    <DialogDescription>
                        {editingUser ? 'Altere os dados do colaborador.' : 'Preencha os dados do novo colaborador.'}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow scroll-container">
                  <CollaboratorForm user={editingUser} workPosts={workPosts} onFinished={() => setIsFormOpen(false)} />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    </GlassCard>
  );
}
    

    
