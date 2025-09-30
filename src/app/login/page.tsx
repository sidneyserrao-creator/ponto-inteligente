import { Logo } from '@/components/icons';
import { LoginForm } from './_components/login-form';
import { GlassCard, CardHeader, CardContent } from '@/components/glass-card';
import Image from 'next/image';

// Custom styles that use CSS variables for animation, which are hard to replicate with Tailwind alone.
const pageStyles = {
  main: {
    background: 'linear-gradient(to bottom, #041b46, #0a2a73)',
  },
  neonBorder: {
    position: 'relative' as const,
    padding: '2px',
    borderRadius: '1.5rem',
    overflow: 'visible' as const,
  },
  neonBorderBefore: {
    '--a': '0deg',
    content: '""',
    position: 'absolute' as const,
    inset: 0,
    borderRadius: 'inherit',
    padding: '2px',
    background:
      'conic-gradient(from var(--a), transparent 0turn 0.12turn, rgba(59,130,246,0.95) 0.16turn 0.20turn, transparent 0.24turn 1turn)',
    WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
    WebkitMaskComposite: 'xor' as const,
    maskComposite: 'exclude',
    filter: 'blur(1px)',
    animation: 'neon-sweep 4s linear infinite reverse',
  },
  logoSun: {
    position: 'relative' as const,
  },
  logoSunBefore: {
    content: '""',
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: '220px',
    height: '220px',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: -1,
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0) 70%)',
    filter: 'blur(30px)',
  },
  newCard: {
    borderRadius: '30px',
    background: 'hsl(var(--card) / 0.6)',
    boxShadow: 'rgba(50, 50, 93, 0.25) 0px 30px 50px -12px inset, rgba(0, 0, 0, 0.3) 0px 18px 26px -18px inset',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  }
};

export default function LoginPage() {
  return (
    <>
      <style>
        {`
          @property --a {
            syntax: "<angle>";
            initial-value: 0deg;
            inherits: false;
          }
          @keyframes neon-sweep {
            to { --a: 360deg; }
          }
        `}
      </style>
      <main className="flex min-h-screen items-center justify-center p-4 text-white" style={pageStyles.main}>
        <div style={pageStyles.neonBorder}>
           <div style={pageStyles.neonBorderBefore} />
          <GlassCard className="w-full max-w-lg backdrop-blur-md shadow-lg shadow-black/30" style={pageStyles.newCard}>
            <CardHeader>
              <div style={pageStyles.logoSun}>
                <div style={pageStyles.logoSunBefore} />
                <img
                  src="/logo.png"
                  alt="Logo Bit Segurança"
                  className="mx-auto w-24 h-24 bg-transparent"
                />
              </div>
               <h1 className="pt-4 text-center text-2xl font-semibold">
                Bem-vindo de Volta
              </h1>
              <p className="pb-2 text-center text-sm text-gray-300">
                Faça login para acessar seu painel.
              </p>
            </CardHeader>
            <CardContent>
              <LoginForm />
               <div className="mt-6 text-center">
                <Image
                  src="/lecode-logo.png"
                  alt="Lecode Soluções Logo"
                  width={150}
                  height={50}
                  className="mx-auto"
                />
              </div>
            </CardContent>
          </GlassCard>
        </div>
      </main>
    </>
  );
}
