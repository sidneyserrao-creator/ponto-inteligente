import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminDashboard } from './_components/admin-dashboard';
import { SupervisorDashboard } from './_components/supervisor/supervisor-dashboard';
import { CollaboratorDashboard } from './_components/collaborator-dashboard';
import type { User, WorkPost, WorkShift } from '@/lib/types';
import { getAnnouncements, getTimeLogsForUser, getUsers, getPayslipsForUser, getAllTimeLogs, getWorkPosts, getSignatureForUser, getAllSignatures, getWorkShifts, getOccurrences } from '@/lib/data';
import { format } from 'date-fns';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const renderDashboard = async (user: User) => {
    const allAnnouncements = await getAnnouncements();
    const currentMonthYear = format(new Date(), 'yyyy-MM');
    
    switch (user.role) {
      case 'admin':
        const allUsers = await getUsers();
        const workPosts = await getWorkPosts();
        const workShifts = await getWorkShifts();
        const allTimeLogs = await getAllTimeLogs();
        const signatureStatus = await getAllSignatures(currentMonthYear);
        const occurrences = await getOccurrences();
        return <AdminDashboard 
                  user={user} 
                  announcements={allAnnouncements} 
                  allUsers={allUsers} 
                  workPosts={workPosts}
                  workShifts={workShifts}
                  allTimeLogs={allTimeLogs}
                  signatureStatus={signatureStatus}
                  occurrences={occurrences}
                />;
      case 'supervisor':
        const allUsersForSupervisor = await getUsers();
        const allLogs = await getAllTimeLogs();
        const allWorkposts = await getWorkPosts();
        
        // Correctly find supervised posts
        const supervisedPosts = allWorkposts.filter(p => p.supervisorId === user.id);
        const supervisedPostIds = supervisedPosts.map(p => p.id);

        // Correctly find team members based on supervised posts
        const teamMembers = allUsersForSupervisor.filter(u => u.workPostId && supervisedPostIds.includes(u.workPostId));

        const teamLogs = teamMembers.map(member => ({
            ...member,
            timeLogs: allLogs.filter(log => log.userId === member.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        }));

        return <SupervisorDashboard 
                  user={user} 
                  announcements={allAnnouncements} 
                  teamLogs={teamLogs} 
                  supervisedPosts={supervisedPosts}
                  teamMembers={teamMembers}
                />;
      case 'collaborator':
        const timeLogs = await getTimeLogsForUser(user.id);
        const payslips = await getPayslipsForUser(user.id);
        const signature = await getSignatureForUser(user.id, currentMonthYear);
        return <CollaboratorDashboard 
                  user={user} 
                  announcements={allAnnouncements} 
                  timeLogs={timeLogs} 
                  payslips={payslips}
                  signature={signature}
                />;
      default:
        return <div>Papel de usuário desconhecido.</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
           <p className="text-muted-foreground">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
      {await renderDashboard(user)}
    </div>
  );
}
