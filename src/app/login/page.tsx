import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/icons';
import { GlassCard, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/glass-card';
import { LoginForm } from './_components/login-form';

export default function LoginPage() {
  const bgImage = PlaceHolderImages.find(img => img.id === 'login-bg');

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          data-ai-hint={bgImage.imageHint}
          fill
          className="object-cover"
          priority
        />
      )}
      <div className="absolute inset-0 bg-background/80" />
      <div className="relative z-10 flex flex-col items-center">
        <Logo className="h-10 w-auto text-foreground" />
        <GlassCard className="mt-8 w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Acesse sua conta</CardTitle>
            <CardDescription>Bem-vindo ao sistema de ponto eletrônico.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
