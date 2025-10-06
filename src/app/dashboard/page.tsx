import { Suspense } from 'react';
import dynamic from 'next/dynamic'; // Importa o 'dynamic'
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardLoader from './_components/dashboard-loader';
import FCMInitializer from './_components/FCMInitializer';
import { getCollaboratorBreakSchedule } from '@/lib/data';
import type { User, DailyBreakSchedule } from '@/lib/types';
import { Loader2 } from 'lucide-react';

// --- Carregamento Dinâmico dos Dashboards ---
const AdminDashboard = dynamic(() => import('./_components/admin-dashboard'), {
  ssr: false,
  loading: () => <DashboardLoader />,
});

const SupervisorDashboard = dynamic(() => import('./_components/supervisor-dashboard'), {
  ssr: false,
  loading: () => <DashboardLoader />,
});

const CollaboratorDashboard = dynamic(() => import('./_components/collaborator-dashboard'), {
    ssr: false, // O colaborador também pode ter componentes client-side
    loading: () => <DashboardLoader />,
});
// ------------------------------------------

function DashboardHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}

function RoleBasedDashboard({ user, breakSchedule }: { user: User; breakSchedule: DailyBreakSchedule | null }) {
  switch (user.role) {
    case 'admin':
      return <AdminDashboard user={user} />;
    case 'supervisor':
      return <SupervisorDashboard user={user} />;
    case 'collaborator':
      return <CollaboratorDashboard user={user} breakSchedule={breakSchedule} />;
    default:
      return <div>Função de usuário desconhecida.</div>;
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  let breakSchedule: DailyBreakSchedule | null = null;
  if (user.role === 'collaborator') {
    breakSchedule = await getCollaboratorBreakSchedule(user.id);
  }

  return (
    <div className="space-y-6">
      {/* O FCMInitializer já é client-side, então está ok */}
      <FCMInitializer user={user} /> 
      <DashboardHeader />
      <Suspense fallback={<DashboardLoader />}>
        <RoleBasedDashboard user={user} breakSchedule={breakSchedule} />
      </Suspense>
    </div>
  );
}
