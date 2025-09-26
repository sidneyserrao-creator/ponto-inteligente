import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminDashboard } from './_components/admin-dashboard';
import { SupervisorDashboard } from './_components/supervisor/supervisor-dashboard';
import { CollaboratorDashboard } from './_components/collaborator-dashboard';
import type { User, WorkPost } from '@/lib/types';
import { getAnnouncements, getTimeLogsForUser, getUsers, getPayslipsForUser, getAllTimeLogs, getWorkPosts, getSignatureForUser, getAllSignatures } from '@/lib/data';
import { format } from 'date-fns';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const announcements = getAnnouncements();
  const currentMonthYear = format(new Date(), 'yyyy-MM');

  const renderDashboard = (user: User) => {
    switch (user.role) {
      case 'admin':
        const allUsers = getUsers();
        const workPosts = getWorkPosts();
        const allTimeLogs = getAllTimeLogs();
        const signatureStatus = getAllSignatures(currentMonthYear);
        return <AdminDashboard 
                  user={user} 
                  announcements={announcements} 
                  allUsers={allUsers} 
                  workPosts={workPosts} 
                  allTimeLogs={allTimeLogs}
                  signatureStatus={signatureStatus} 
                />;
      case 'supervisor':
        const teamMemberIds = user.team || [];
        const teamMembers = getUsers().filter(u => teamMemberIds.includes(u.id));
        const allLogs = getAllTimeLogs();
        const teamLogs = teamMembers.map(member => ({
            ...member,
            timeLogs: allLogs.filter(log => log.userId === member.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        }));
        return <SupervisorDashboard user={user} announcements={announcements} teamLogs={teamLogs} />;
      case 'collaborator':
        const timeLogs = getTimeLogsForUser(user.id);
        const payslips = getPayslipsForUser(user.id);
        const signature = getSignatureForUser(user.id, currentMonthYear);
        return <CollaboratorDashboard 
                  user={user} 
                  announcements={announcements} 
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
      {renderDashboard(user)}
    </div>
  );
}
