'use client';
import { useState, useRef, useEffect } from 'react';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { recordTimeLog } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { User, TimeLog, TimeLogAction } from '@/lib/types';
import { Clock, Coffee, Play, LogOut, Loader2, Camera, ArrowLeft, Video, VideoOff, WifiOff, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { addToSyncQueue, startSyncProcess } from '@/lib/sync';

type ViewState = 'idle' | 'camera' | 'options';

interface ClockWidgetProps {
  user: User;
  timeLogs: TimeLog[];
}

export function ClockWidget({ user, timeLogs }: ClockWidgetProps) {
  const [view, setView] = useState<ViewState>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set initial time on client mount
    setCurrentTime(new Date());

    // Start the sync process when the component mounts
    startSyncProcess();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    if(typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
    
    return () => {
      clearInterval(timer);
      if(typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const requestLocationAndCamera = () => {
    setLocationError(null);
    // Request location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        // If location is successful, open camera
        setView('camera');
      },
      (error) => {
        let message = 'Não foi possível obter sua localização. Ative o GPS e permita o acesso.';
        if (error.code === error.PERMISSION_DENIED) {
            message = 'Acesso à localização negado. Habilite a permissão nas configurações do navegador para registrar o ponto.'
        }
        setLocationError(message);
        toast({
          variant: 'destructive',
          title: 'Erro de Localização',
          description: message,
        });
      },
      { enableHighAccuracy: true }
    );
  }

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
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Câmera não permitida',
        description: 'Por favor, habilite o acesso à câmera nas configurações do seu navegador.',
      });
      setView('idle');
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
    // Cleanup camera on component unmount
    return () => stopCamera();
  }, [view]);

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUri);
        setView('options');
      }
    }
  };

  const handleAction = async (action: TimeLogAction) => {
    if (!capturedImage) return;

    setIsProcessing(true);

    if (!isOnline) {
        try {
            await addToSyncQueue(user.id, action, capturedImage, currentLocation);
            toast({ 
                title: 'Ponto registrado offline',
                description: 'Seus dados serão enviados assim que a conexão for restabelecida.'
            });
            reset();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao salvar localmente',
                description: 'Não foi possível salvar o registro de ponto offline.',
            });
            setIsProcessing(false);
        }
        return;
    }

    const result = await recordTimeLog(user.id, action, capturedImage, currentLocation);

    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Ponto registrado.' });
    } else {
      toast({
        variant: 'destructive',
        title: 'Falha na verificação',
        description: result.message || 'Tente novamente.',
      });
    }
    
    reset();
  };
  
  const reset = () => {
      setCapturedImage(null);
      setIsProcessing(false);
      setView('idle');
      setCurrentLocation(null);
      setLocationError(null);
  }

  const lastAction = timeLogs[0]?.action;

  const getNextActions = (): { action: TimeLogAction; label: string; icon: React.ElementType }[] => {
    if (isProcessing) return [];
    if (!lastAction || lastAction === 'clock_out') return [{ action: 'clock_in', label: 'Entrada', icon: Play }];
    switch (lastAction) {
      case 'clock_in':
      case 'break_end':
        return [{ action: 'break_start', label: 'Início do Intervalo', icon: Coffee }, { action: 'clock_out', label: 'Fim do Expediente', icon: LogOut }];
      case 'break_start':
        return [{ action: 'break_end', label: 'Fim do Intervalo', icon: Play }];
      default:
        return [];
    }
  };

  const nextActions = getNextActions();

  return (
    <GlassCard>
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle>Registro de Ponto</CardTitle>
            {!isOnline && (
                <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
                    <WifiOff className="h-5 w-5" />
                    <span>Modo Offline</span>
                </div>
            )}
        </div>
        <CardDescription>
            {view === 'idle' && `Bem-vindo(a), ${user.name.split(' ')[0]}. Clique abaixo para iniciar.`}
            {view === 'camera' && 'Posicione seu rosto na câmera e clique em Registrar.'}
            {view === 'options' && 'Foto capturada! Agora selecione a ação desejada.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="text-center h-28">
          {currentTime ? (
            <>
              <p className="text-6xl font-bold tracking-tighter text-primary">
                {currentTime.toLocaleTimeString('pt-BR')}
              </p>
              <p className="text-muted-foreground">
                {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </>
          ) : (
             <div className="h-full flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
             </div>
          )}
        </div>

        {view === 'idle' && (
          <div className="w-full max-w-sm text-center space-y-4">
            <Button onClick={requestLocationAndCamera} className="w-full">
              <Camera className="mr-2 h-4 w-4" /> Bater Ponto
            </Button>
             {locationError && (
                <Alert variant="destructive">
                    <MapPin className="h-4 w-4" />
                    <AlertTitle>Erro de Localização</AlertTitle>
                    <AlertDescription>{locationError}</AlertDescription>
                </Alert>
            )}
          </div>
        )}

        {view === 'camera' && (
          <div className="w-full max-w-md">
            <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 text-center">
                        <VideoOff className="h-10 w-10 text-destructive mb-2"/>
                        <p className="font-semibold">Câmera não disponível</p>
                        <p className="text-sm text-muted-foreground">Verifique as permissões no seu navegador.</p>
                    </div>
                )}
            </div>
            <div className="flex gap-4 mt-4">
              <Button variant="outline" onClick={reset} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button onClick={handleCapture} className="flex-1" disabled={hasCameraPermission !== true}>
                <Camera className="mr-2 h-4 w-4" /> Registrar
              </Button>
            </div>
          </div>
        )}

        {view === 'options' && (
            <div className="w-full max-w-md space-y-4">
                <div className="flex justify-center">
                    {capturedImage && (
                        <Image src={capturedImage} alt="Foto capturada" width={160} height={120} className="rounded-lg shadow-lg" />
                    )}
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isProcessing ? (
                        <Button disabled className="w-full sm:col-span-2">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
                        </Button>
                    ) : (
                        nextActions.map(({ action, label, icon: Icon }) => (
                            <Button key={action} onClick={() => handleAction(action)} className="w-full">
                                <Icon className="mr-2 h-4 w-4" /> {label}
                            </Button>
                        ))
                    )}
                </div>
                {!isProcessing && nextActions.length === 0 && (
                    <p className="text-muted-foreground text-center p-2">Jornada finalizada por hoje.</p>
                )}
                 <Button variant="link" onClick={reset} disabled={isProcessing}>Voltar e tirar outra foto</Button>
            </div>
        )}
      </CardContent>
    </GlassCard>
  );
}

    