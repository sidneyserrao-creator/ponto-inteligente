import { Logo } from '@/components/icons';
import { LoginForm } from './_components/login-form';
import { GlassCard, CardHeader, CardContent } from '@/components/glass-card';
import Image from 'next/image';
import styles from './login.module.css';

export default function LoginPage() {
  return (
    <>
      <main
        className={`${styles.main} flex min-h-screen items-center justify-center px-4 text-white`}
      >
        <div className={`${styles.neonBorder} w-full max-w-sm sm:max-w-md lg:max-w-lg`}>
          <GlassCard
            className={`${styles.newCard} w-full backdrop-blur-md shadow-lg shadow-black/30`}
          >
            <CardHeader>
              <div className={styles.logoSun}>
                <img
                  src="/logo.png"
                  alt="Logo Bit Segurança"
                  className="mx-auto w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-transparent"
                />
              </div>
              <h1 className="pt-4 text-center text-xl sm:text-2xl font-semibold">
                Bem-vindo de Volta
              </h1>
              <p className="pb-2 text-center text-xs sm:text-sm text-gray-300">
                Faça login para acessar seu painel.
              </p>
            </CardHeader>
            <CardContent>
              <LoginForm />
              <div className="mt-6 text-center">
                <Image
                  src="/lecode-logo.png"
                  alt="Lecode Soluções Logo"
                  width={140}
                  height={45}
                  className="mx-auto"
                  style={{ height: 'auto' }}
                />
              </div>
            </CardContent>
          </GlassCard>
        </div>
      </main>
    </>
  );
}
