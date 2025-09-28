import { Logo } from '@/components/icons';
import { LoginForm } from './_components/login-form';
import { GlassCard, CardHeader, CardContent } from '@/components/glass-card';

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
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: -1,
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0) 70%)',
    filter: 'blur(30px)',
  },
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
          <GlassCard className="w-full max-w-sm sm:max-w-md shadow-2xl shadow-blue-500/20" style={{border: '1px solid rgba(255, 255, 255, 0.1)'}}>
            <CardHeader>
              <div style={pageStyles.logoSun}>
                <div style={pageStyles.logoSunBefore} />
                <Logo className="h-12 w-auto mx-auto relative z-10" />
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
            </CardContent>
          </GlassCard>
        </div>
      </main>
    </>
  );
}
