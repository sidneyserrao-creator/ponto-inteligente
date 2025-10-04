import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardLoader from './_components/dashboard-loader';

// Importa os dashboards dinamicamente para code-splitting
import AdminDashboard from './_components/admin-dashboard';
import SupervisorDashboard from './_components/supervisor-dashboard';
import CollaboratorDashboard from './_components/collaborator-dashboard';
import FCMInitializer from './_components/FCMInitializer'; // Importa o inicializador FCM
import { getCollaboratorBreakSchedule } from '@/lib/data'; // Importa a nova função
import type { User, DailyBreakSchedule } from '@/lib/types';

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

// Atualiza o RoleBasedDashboard para passar o breakSchedule apenas quando necessário
function RoleBasedDashboard({ user, breakSchedule }: { user: User; breakSchedule: DailyBreakSchedule | null }) {
  switch (user.role) {
    case 'admin':
      return <AdminDashboard user={user} />;
    case 'supervisor':
      return <SupervisorDashboard user={user} />;
    case 'collaborator':
      // Passa a prop apenas para o CollaboratorDashboard
      return <CollaboratorDashboard user={user} breakSchedule={breakSchedule} />;
    default:
      // Fallback para um estado de erro ou dashboard padrão
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
      <FCMInitializer user={user} />
      <DashboardHeader />
      <Suspense fallback={<DashboardLoader />}>
        <RoleBasedDashboard user={user} breakSchedule={breakSchedule} />
      </Suspense>
    </div>
  );
}
