'use client';
import { useState, useRef, useEffect } from 'react';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { recordTimeLog } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { User, TimeLog, TimeLogAction } from '@/lib/types';
import { Clock, Coffee, Play, LogOut, Loader2, Camera } from 'lucide-react';

interface ClockWidgetProps {
  user: User;
  timeLogs: TimeLog[];
}

export function ClockWidget({ user, timeLogs }: ClockWidgetProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAction = (action: TimeLogAction) => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-action', action);
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const action = event.target.getAttribute('data-action') as TimeLogAction | null;

    if (file && action) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const submittedPhotoDataUri = reader.result as string;
        const result = await recordTimeLog(user.id, action, submittedPhotoDataUri);
        if (result.success) {
          toast({
            title: 'Sucesso!',
            description: result.message,
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro!',
            description: result.message,
          });
        }
        setIsProcessing(false);
      };
      reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao ler a imagem.' });
        setIsProcessing(false);
      };
    }
    // Reset file input value to allow re-capturing the same image if needed
    event.target.value = '';
  };
  
  const lastAction = timeLogs[0]?.action;
  
  const getNextActions = (): {action: TimeLogAction, label: string, icon: React.ElementType}[] => {
    if (!lastAction) return [{ action: 'clock_in', label: 'Entrada', icon: Play }];
    switch (lastAction) {
      case 'clock_in':
        return [{ action: 'break_start', label: 'Pausa', icon: Coffee }, { action: 'clock_out', label: 'Saída', icon: LogOut }];
      case 'break_start':
        return [{ action: 'break_end', label: 'Fim da Pausa', icon: Play }];
      case 'break_end':
        return [{ action: 'break_start', label: 'Pausa', icon: Coffee }, { action: 'clock_out', label: 'Saída', icon: LogOut }];
      case 'clock_out':
        return [];
      default:
        return [{ action: 'clock_in', label: 'Entrada', icon: Play }];
    }
  };
  
  const nextActions = getNextActions();

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle>Registro de Ponto</CardTitle>
        <CardDescription>Bem-vindo(a), {user.name.split(' ')[0]}. Selecione uma ação para registrar seu ponto.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-6xl font-bold tracking-tighter text-primary">
            {currentTime.toLocaleTimeString('pt-BR')}
          </p>
          <p className="text-muted-foreground">
            {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex gap-4">
          {isProcessing ? (
            <Button disabled className="w-40">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </Button>
          ) : (
            nextActions.map(({action, label, icon: Icon}) => (
                <Button key={action} onClick={() => handleAction(action)} className="w-40">
                    <Icon className="mr-2 h-4 w-4" />
                    {label}
                </Button>
            ))
          )}
          {nextActions.length === 0 && !isProcessing && (
            <p className="text-muted-foreground p-2">Jornada finalizada por hoje.</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center">
            <Camera className="inline-block h-3 w-3 mr-1" />
            Uma foto será tirada para validação do registro.
        </p>
        <input
          type="file"
          accept="image/*"
          capture="user"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </CardContent>
    </GlassCard>
  );
}
