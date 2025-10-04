import { getAnnouncements, getUsers, getWorkPosts, getWorkShifts, getAllTimeLogs, getAllSignatures, getOccurrences } from '@/lib/data';
import { format } from 'date-fns';
import AdminDashboardClient from './admin-dashboard-client';
import type { User } from '@/lib/types';
import { SupervisorDashboard } from './supervisor/supervisor-dashboard';

export default async function AdminDashboard({ user }: { user: User }) {
  const allAnnouncements = await getAnnouncements();
  const currentMonthYear = format(new Date(), 'yyyy-MM');

  // Busca usuários primeiro, pois a função de assinaturas pode precisar deles.
  const allUsers = await getUsers();

  const [workPosts, workShifts, allTimeLogs, signatureStatus, occurrences] = await Promise.all([
    getWorkPosts(),
    getWorkShifts(),
    getAllTimeLogs(),
    // Passa a lista de usuários para evitar uma busca duplicada dentro da função.
    getAllSignatures(currentMonthYear, allUsers),
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
            allUsers={allUsers}
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
      signatureStatus={signatureStatus}
      occurrences={occurrences}
    />
  );
}