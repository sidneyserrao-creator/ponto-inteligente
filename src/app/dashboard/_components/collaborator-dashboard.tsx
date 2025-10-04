import { getAnnouncements, getTimeLogsForUser, getPayslipsForUser, getSignatureForUser } from '@/lib/data';
import { format } from 'date-fns';
import CollaboratorDashboardClient from './collaborator-dashboard-client';
import type { User, DailyBreakSchedule } from '@/lib/types';

// Aceita a nova prop breakSchedule
export default async function CollaboratorDashboard({ user, breakSchedule }: { user: User; breakSchedule: DailyBreakSchedule | null }) {
  const allAnnouncements = await getAnnouncements();
  const currentMonthYear = format(new Date(), 'yyyy-MM');

  const [timeLogs, payslips, signature] = await Promise.all([
    getTimeLogsForUser(user.id),
    getPayslipsForUser(user.id),
    getSignatureForUser(user.id, currentMonthYear),
  ]);

  return (
    <CollaboratorDashboardClient
      user={user}
      announcements={allAnnouncements}
      timeLogs={timeLogs}
      payslips={payslips}
      signature={signature}
      breakSchedule={breakSchedule} // Repassa a prop para o componente cliente
    />
  );
}
