import { getAnnouncements, getTimeLogsForUsers, getUsersByWorkPostIds, getWorkPostsBySupervisor } from '@/lib/data';
import SupervisorDashboardClient from './supervisor-dashboard-client';
import type { User } from '@/lib/types';

export default async function SupervisorDashboard({ user }: { user: User }) {
  // Busca os posts de trabalho diretamente supervisionados pelo usuário atual.
  const supervisedPosts = await getWorkPostsBySupervisor(user.id);
  const supervisedPostIds = supervisedPosts.map(p => p.id);

  // Se não houver posts supervisionados, não há necessidade de buscar mais nada.
  if (supervisedPostIds.length === 0) {
    return (
      <SupervisorDashboardClient
        user={user}
        announcements={[]}
        teamLogs={[]}
        supervisedPosts={[]}
        teamMembers={[]}
      />
    );
  }

  // Busca os membros da equipe que pertencem aos posts supervisionados.
  const teamMembers = await getUsersByWorkPostIds(supervisedPostIds);
  const teamMemberIds = teamMembers.map(m => m.id);

  // Busca os comunicados e os registros de ponto da equipe em paralelo.
  const [announcements, timeLogs] = await Promise.all([
    getAnnouncements(),
    getTimeLogsForUsers(teamMemberIds),
  ]);

  // Mapeia os registros de ponto para cada membro da equipe.
  const teamLogs = teamMembers.map(member => ({
    ...member,
    timeLogs: timeLogs
      .filter(log => log.userId === member.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  }));

  return (
    <SupervisorDashboardClient
      user={user}
      announcements={announcements}
      teamLogs={teamLogs}
      supervisedPosts={supervisedPosts}
      teamMembers={teamMembers}
    />
  );
}
