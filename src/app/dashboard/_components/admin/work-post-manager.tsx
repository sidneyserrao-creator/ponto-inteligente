'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Autocomplete, Circle, MarkerF } from '@react-google-maps/api';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { saveWorkPost, removeWorkPost } from '@/lib/actions';
import type { WorkPost, User } from '@/lib/types';
import { Briefcase, PlusCircle, UserCircle, Edit, Trash2, MapPin } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

const mapContainerStyle = {
    height: '250px',
    width: '100%',
    borderRadius: '0.5rem',
};

const defaultCenter = { lat: -23.5505, lng: -46.6333 }; // Default to São Paulo

const libraries: "places"[] = ["places"];

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
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries,
    });
    
    const [name, setName] = useState(workPost?.name || '');
    const [address, setAddress] = useState(workPost?.address || '');
    const [supervisorId, setSupervisorId] = useState(workPost?.supervisorId || 'none');
    const [radius, setRadius] = useState(workPost?.radius || 100);
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
        workPost?.latitude && workPost.longitude ? { lat: workPost.latitude, lng: workPost.longitude } : null
    );

    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const handlePlaceSelect = useCallback(() => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setCoordinates({ lat, lng });
                setAddress(place.formatted_address || '');
            } else {
                 toast({ variant: 'destructive', title: 'Endereço inválido', description: 'Por favor, selecione um endereço válido da lista.' });
            }
        }
    }, [toast]);
    
    const onLoad = useCallback((autocomplete: google.maps.places.Autocomplete) => {
        autocompleteRef.current = autocomplete;
    }, []);

    const onUnmount = useCallback(() => {
        autocompleteRef.current = null;
    }, []);


    const handleSubmit = async (formData: FormData) => {
        if (!coordinates) {
            toast({ variant: 'destructive', title: 'Localização necessária', description: 'Selecione um endereço válido para definir a localização do posto.' });
            return;
        }
        
        formData.set('name', name);
        formData.set('address', address);
        formData.set('supervisorId', supervisorId);
        formData.set('radius', String(radius));
        formData.set('latitude', String(coordinates.lat));
        formData.set('longitude', String(coordinates.lng));
        if(workPost?.id) formData.set('id', workPost.id);


        const result = await saveWorkPost(formData);
        if (result?.success) {
            toast({ title: 'Sucesso!', description: result.message });
            onFinished();
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: result.error ?? 'Ocorreu um erro.' });
        }
    };

    if (loadError) return <div>Erro ao carregar o mapa. Verifique a chave de API.</div>;
    
    return (
        <form action={handleSubmit} className="space-y-4 pr-2">
            <div className="space-y-2">
                <Label htmlFor="name">Nome do Posto</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Sede, Cliente A" required />
            </div>
            
            {!isLoaded ? <Skeleton className="h-10 w-full" /> : (
                 <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Autocomplete onLoad={onLoad} onUnmount={onUnmount} onPlaceChanged={handlePlaceSelect}>
                         <Input id="address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Digite e selecione o endereço..." required className="w-full" />
                    </Autocomplete>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="radius">Raio do Ponto (metros)</Label>
                <Input id="radius" type="number" value={radius} onChange={e => setRadius(Number(e.target.value))} required />
            </div>

            <div style={mapContainerStyle} className="bg-muted flex items-center justify-center text-muted-foreground">
                {!isLoaded ? <Skeleton className="h-full w-full" /> : 
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={coordinates || defaultCenter}
                        zoom={coordinates ? 17 : 10}
                    >
                        {coordinates && (
                            <>
                                <MarkerF position={coordinates} />
                                <Circle
                                    center={coordinates}
                                    radius={radius}
                                    options={{
                                        strokeColor: '#55ACEE',
                                        strokeOpacity: 0.8,
                                        strokeWeight: 2,
                                        fillColor: '#55ACEE',
                                        fillOpacity: 0.35,
                                    }}
                                />
                            </>
                        )}
                    </GoogleMap>
                }
            </div>
            
             <div className="space-y-2">
                <Label htmlFor="supervisorId">Supervisor Responsável</Label>
                <Select value={supervisorId} onValueChange={setSupervisorId}>
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

             <DialogFooter className="sticky bottom-0 bg-background py-4 pr-4">
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
                           <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{post.address}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <UserCircle className="h-4 w-4" />
                              <span>{getSupervisorName(post.supervisorId)}</span>
                          </div>
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

       <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
          if(!isOpen) setEditingPost(null);
          setIsFormOpen(isOpen);
       }}>
            <DialogContent className="max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>{editingPost ? 'Editar Posto de Trabalho' : 'Novo Posto de Trabalho'}</DialogTitle>
                    <DialogDescription>
                        {editingPost ? 'Altere os dados do posto de trabalho.' : 'Preencha os dados do novo posto de trabalho.'}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-grow px-6">
                    <WorkPostForm workPost={editingPost} supervisors={supervisors} onFinished={() => setIsFormOpen(false)} />
                </ScrollArea>
            </DialogContent>
        </Dialog>
    </GlassCard>
  );
}
