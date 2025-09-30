'use client';
import { useState, useRef } from 'react';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { uploadPayslip } from '@/lib/actions';
import type { User } from '@/lib/types';
import { FileText, UploadCloud, Loader2 } from 'lucide-react';

interface DocumentManagerProps {
  collaborators: User[];
}

export function DocumentManager({ collaborators }: DocumentManagerProps) {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
      } else {
        toast({ variant: 'destructive', title: 'Formato inválido', description: 'Por favor, selecione um arquivo PDF.' });
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedUser || !selectedFile) {
      toast({ variant: 'destructive', title: 'Faltam informações', description: 'Selecione um colaborador e um arquivo.' });
      return;
    }
    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('userId', selectedUser);
    formData.append('file', selectedFile);

    const result = await uploadPayslip(formData);
    
    if (result.success) {
      toast({ title: 'Sucesso!', description: result.message });
      setSelectedFile(null);
      setSelectedUser('');
      if(fileInputRef.current) fileInputRef.current.value = '';
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: result.error });
    }
    setIsLoading(false);
  };

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <FileText className="text-primary"/>
            Gerenciar Contracheques
        </CardTitle>
        <CardDescription>Envie contracheques em PDF para os colaboradores.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Colaborador</label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
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

        <div>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                <UploadCloud className="mr-2 h-4 w-4"/>
                {selectedFile ? `Arquivo: ${selectedFile.name}` : 'Escolher PDF'}
            </Button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
                accept="application/pdf"
            />
        </div>

        <Button onClick={handleUpload} disabled={isLoading || !selectedUser || !selectedFile} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            {isLoading ? 'Enviando...' : 'Enviar Contracheque'}
        </Button>
      </CardContent>
    </GlassCard>
  );
}
