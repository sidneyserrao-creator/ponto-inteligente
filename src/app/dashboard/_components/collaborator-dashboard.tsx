'use client';

import { getAnnouncements, getTimeLogsForUser, getPayslipsForUser, getSignatureForUser } from '@/lib/data';
import { format } from 'date-fns';
import CollaboratorDashboardClient from './collaborator-dashboard-client';
import type { User, DailyBreakSchedule, TimeLog, Signature, Payslip, Announcement } from '@/lib/types';
import { useEffect, useState } from 'react';

// Aceita a nova prop breakSchedule
export default function CollaboratorDashboard({ 
  user, 
  breakSchedule 
}: { 
  user: User; 
  breakSchedule: DailyBreakSchedule | null 
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [signature, setSignature] = useState<Signature | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const currentMonthYear = format(new Date(), 'yyyy-MM');
      const [
        announcementsData,
        timeLogsData,
        payslipsData,
        signatureData
      ] = await Promise.all([
        getAnnouncements(),
        getTimeLogsForUser(user.id),
        getPayslipsForUser(user.id),
        getSignatureForUser(user.id, currentMonthYear),
      ]);
      setAnnouncements(announcementsData);
      setTimeLogs(timeLogsData);
      setPayslips(payslipsData);
      setSignature(signatureData);
      setLoading(false);
    };

    fetchData();
  }, [user.id]);
  
  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <CollaboratorDashboardClient
      user={user}
      announcements={announcements}
      timeLogs={timeLogs}
      payslips={payslips}
      signature={signature}
      breakSchedule={breakSchedule}
    />
  );
}