// 🔒 Função “Pontos Assinados” desativada temporariamente – será reativada em atualização futura.
import { getAnnouncements, getUsers, getWorkPosts, getWorkShifts, getAllTimeLogs, getOccurrences } from '@/lib/data'; // getAllSignatures removido
import { format } from 'date-fns';
import AdminDashboardClient from './admin-dashboard-client';
import type { User } from '@/lib/types';
import { SupervisorDashboard } from './supervisor/supervisor-dashboard'; // Corrigido o caminho para o dashboard do supervisor

export default async function AdminDashboard({ user }: { user: User }) {
  const allAnnouncements = await getAnnouncements();
  const currentMonthYear = format(new Date(), 'yyyy-MM');

  const allUsers = await getUsers();

  const [workPosts, workShifts, allTimeLogs, occurrences] = await Promise.all([
    getWorkPosts(),
    getWorkShifts(),
    getAllTimeLogs(),
    getOccurrences(),
  ]);

  if(user.role === 'supervisor'){
    const supervisedPosts = workPosts.filter(p => p.supervisorId === user.id);
    const teamMembers = allUsers.filter(u => supervisedPosts.some(p => p.id === u.workPostId));
    
    const teamLogs = teamMembers.map(member => ({
        ...member,
        timeLogs: allTimeLogs
          .filter(log => log.userId === member.id)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      }));

    return (
        <SupervisorDashboard
            user={user}
            announcements={allAnnouncements}
            teamLogs={teamLogs}
            supervisedPosts={supervisedPosts}
            teamMembers={teamMembers} // Corrigido: passando a lista de membros da equipe em vez de todos os usuários
        />
    )
  }

  return (
    <AdminDashboardClient
      user={user}
      announcements={allAnnouncements}
      allUsers={allUsers}
      workPosts={workPosts}
      workShifts={workShifts}
      allTimeLogs={allTimeLogs}
      signatureStatus={{}} // Passando um objeto vazio para manter a prop, mas sem dados
      occurrences={occurrences}
    />
  );
}
