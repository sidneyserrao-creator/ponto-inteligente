'use client';
import { useState, useRef, useEffect } from 'react';
import { GlassCard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/glass-card';
import { Button } from '@/components/ui/button';
import { recordTimeLog } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { User, TimeLog, TimeLogAction, WorkPost } from '@/lib/types';
import { Clock, Coffee, Play, LogOut, Loader2, Camera, ArrowLeft, Video, VideoOff, WifiOff, MapPin, ShieldAlert } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { addToSyncQueue, startSyncProcess } from '@/lib/sync';
import { format } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type ViewState = 'idle' | 'camera' | 'options';

interface ClockWidgetProps {
  user: User;
  timeLogs?: TimeLog[];
}

// Função para calcular a distância entre duas coordenadas em metros (Fórmula de Haversine)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distância em metros
};


export function ClockWidget({ user, timeLogs }: ClockWidgetProps) {
  const [view, setView] = useState<ViewState>('idle');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [workPost, setWorkPost] = useState<WorkPost | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Busca os dados do posto de trabalho do colaborador
    const fetchWorkPost = async () => {
      if (!user.workPostId) {
        setIsLoadingPost(false);
        return;
      }
      try {
        const postDoc = await getDoc(doc(db, 'workPosts', user.workPostId));
        if (postDoc.exists()) {
          setWorkPost({ id: postDoc.id, ...postDoc.data() } as WorkPost);
        }
      } catch (error) {
        console.error("Erro ao buscar posto de trabalho:", error);
      } finally {
        setIsLoadingPost(false);
      }
    };

    fetchWorkPost();
  }, [user.workPostId]);


  useEffect(() => {
    setCurrentTime(new Date());
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
    if (!workPost || !workPost.latitude || !workPost.longitude || !workPost.radius) {
        toast({
          variant: 'destructive',
          title: 'Posto de Trabalho Não Definido',
          description: 'Você não está associado a um posto de trabalho com localização definida. Contate o administrador.',
        });
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        const distance = calculateDistance(userLat, userLng, workPost.latitude!, workPost.longitude!);
        
        if(distance > workPost.radius!) {
            setLocationError(`Você está a ${distance.toFixed(0)} metros de distância do seu posto de trabalho. Aproxime-se para registrar o ponto.`);
            toast({
                variant: 'destructive',
                title: 'Fora do Perímetro',
                description: 'Você precisa estar no seu posto de trabalho para registrar o ponto.',
            });
            return;
        }

        setCurrentLocation({ latitude: userLat, longitude: userLng });
        setView('camera');
      },
      (error) => {
        let message = 'Não foi possível obter sua localização. Ative o GPS e permita o acesso.';
        if (error.code === error.PERMISSION_DENIED) {
            message = 'Acesso à localização negado. Habilite a permissão nas configurações do navegador para registrar o ponto.'
        }
        setLocationError(message);
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
    if (view === 'camera') startCamera();
    else stopCamera();
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
    const locationToSend = currentLocation || null;

    if (!isOnline) {
        try {
            await addToSyncQueue(user.id, action, capturedImage, locationToSend);
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

    const result = await recordTimeLog(user.id, action, capturedImage, locationToSend);
    if (result.success) toast({ title: 'Sucesso!', description: 'Ponto registrado.' });
    else toast({ variant: 'destructive', title: 'Falha na verificação', description: result.message || 'Tente novamente.' });
    
    reset();
  };
  
  const reset = () => {
      setCapturedImage(null);
      setIsProcessing(false);
      setView('idle');
      setCurrentLocation(null);
      setLocationError(null);
  }

  const lastAction = timeLogs?.[0]?.action;

  const getNextActions = (): { action: TimeLogAction; label: string; icon: React.ElementType }[] => {
    if (isProcessing) return [];
    if (!lastAction || lastAction === 'clock_out') return [{ action: 'clock_in', label: 'Entrada', icon: Play }];
    switch (lastAction) {
      case 'clock_in': case 'break_end':
        return [{ action: 'break_start', label: 'Início do Intervalo', icon: Coffee }, { action: 'clock_out', label: 'Fim do Expediente', icon: LogOut }];
      case 'break_start':
        return [{ action: 'break_end', label: 'Fim do Intervalo', icon: Play }];
      default: return [];
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
              <p className="text-6xl font-bold tracking-tighter text-primary">{format(currentTime, 'HH:mm:ss')}</p>
              <p className="text-muted-foreground">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </>
          ) : (
             <div className="h-full flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
          )}
        </div>

        {view === 'idle' && (
          <div className="w-full max-w-sm text-center space-y-4">
            <Button onClick={requestLocationAndCamera} className="w-full" disabled={isLoadingPost}>
              {isLoadingPost ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Camera className="mr-2 h-4 w-4" />}
              {isLoadingPost ? 'Verificando posto...' : 'Bater Ponto'}
            </Button>
            {!isLoadingPost && !user.workPostId && (
                <Alert variant="default">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Sem Posto de Trabalho</AlertTitle>
                    <AlertDescription>Você não está alocado a um posto. Contate o administrador.</AlertDescription>
                </Alert>
            )}
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
                        <VideoOff className="h-10 w-10 text-destructive mb-2"/><p className="font-semibold">Câmera não disponível</p><p className="text-sm text-muted-foreground">Verifique as permissões no seu navegador.</p>
                    </div>
                )}
            </div>
            <div className="flex gap-4 mt-4">
              <Button variant="outline" onClick={reset} className="flex-1"><ArrowLeft className="mr-2 h-4 w-4" /> Cancelar</Button>
              <Button onClick={handleCapture} className="flex-1" disabled={hasCameraPermission !== true}><Camera className="mr-2 h-4 w-4" /> Registrar</Button>
            </div>
          </div>
        )}

        {view === 'options' && (
            <div className="w-full max-w-md space-y-4">
                <div className="flex justify-center">{capturedImage && (<Image src={capturedImage} alt="Foto capturada" width={160} height={120} className="rounded-lg shadow-lg" />)}</div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isProcessing ? (<Button disabled className="w-full sm:col-span-2"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</Button>) : (nextActions.map(({ action, label, icon: Icon }) => (<Button key={action} onClick={() => handleAction(action)} className="w-full"><Icon className="mr-2 h-4 w-4" /> {label}</Button>)))}
                </div>
                {!isProcessing && nextActions.length === 0 && (<p className="text-muted-foreground text-center p-2">Jornada finalizada por hoje.</p>)}
                 <Button variant="link" onClick={reset} disabled={isProcessing}>Voltar e tirar outra foto</Button>
            </div>
        )}
      </CardContent>
    </GlassCard>
  );
}

export default ClockWidget;
