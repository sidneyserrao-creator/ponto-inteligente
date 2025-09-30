import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import type { User, Announcement, WorkPost, WorkShift, TimeLog, Payslip, Signature, Occurrence } from '@/lib/types';
import { getAnnouncements, getTimeLogsForUser, getUsers, getPayslipsForUser, getAllTimeLogs, getWorkPosts, getSignatureForUser, getAllSignatures, getWorkShifts, getOccurrences } from '@/lib/data';
import { format } from 'date-fns';
import { DashboardClientLoader } from './_components/dashboard-client-loader';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch all data required for any dashboard type at the server level.
  // This keeps data fetching secure and efficient on the server.
  const allAnnouncements = await getAnnouncements();
  const currentMonthYear = format(new Date(), 'yyyy-MM');

  let pageProps: any = {
    user,
    announcements: allAnnouncements,
  };

  // Fetch data based on user role
  if (user.role === 'admin') {
    pageProps.allUsers = await getUsers();
    pageProps.workPosts = await getWorkPosts();
    pageProps.workShifts = await getWorkShifts();
    pageProps.allTimeLogs = await getAllTimeLogs();
    pageProps.signatureStatus = await getAllSignatures(currentMonthYear);
    pageProps.occurrences = await getOccurrences();
  } else if (user.role === 'supervisor') {
    const allUsersForSupervisor = await getUsers();
    const allLogs = await getAllTimeLogs();
    const allWorkposts = await getWorkPosts();
    
    const supervisedPosts = allWorkposts.filter(p => p.supervisorId === user.id);
    const supervisedPostIds = supervisedPosts.map(p => p.id);

    const teamMembers = allUsersForSupervisor.filter(u => u.workPostId && supervisedPostIds.includes(u.workPostId));

    pageProps.teamLogs = teamMembers.map(member => ({
        ...member,
        timeLogs: allLogs.filter(log => log.userId === member.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    }));
    pageProps.supervisedPosts = supervisedPosts;
    pageProps.teamMembers = teamMembers;

  } else if (user.role === 'collaborator') {
    pageProps.timeLogs = await getTimeLogsForUser(user.id);
    pageProps.payslips = await getPayslipsForUser(user.id);
    pageProps.signature = await getSignatureForUser(user.id, currentMonthYear);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
           <p className="text-muted-foreground">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>
      {/* Render the client component and pass all fetched data as props */}
      <DashboardClientLoader {...pageProps} />
    </div>
  );
}
