import { getAnnouncements, getUsers, getWorkPosts, getWorkShifts, getAllTimeLogs, getAllSignatures, getOccurrences } from '@/lib/data';
import { format } from 'date-fns';
import AdminDashboardClient from './admin-dashboard-client';
import type { User } from '@/lib/types';

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
