
'use client';

import type { User, TimeLog, Payslip, Signature, Announcement, Occurrence, WorkPost, WorkShift, DailyBreakSchedule } from '@/lib/types';
import AdminDashboardClient from './admin-dashboard-client';
import CollaboratorDashboardClient from './collaborator-dashboard-client';
import { SupervisorDashboard } from './supervisor/supervisor-dashboard';
import { useEffect, useState } from 'react';
import DashboardLoader from './dashboard-loader';

interface DashboardClientLoaderProps {
  user: User;
  announcements?: Announcement[];
  timeLogs?: TimeLog[];
  payslips?: Payslip[];
  signature?: Signature | null;
  teamLogs?: (User & { timeLogs: TimeLog[] })[];
  supervisedPosts?: WorkPost[];
  teamMembers?: User[];
  allUsers?: User[];
  workPosts?: WorkPost[];
  workShifts?: WorkShift[];
  allTimeLogs?: TimeLog[];
  signatureStatus?: Record<string, Signature | null>;
  occurrences?: Occurrence[];
  breakSchedule?: DailyBreakSchedule | null; 
}

const DashboardClientLoader = (props: DashboardClientLoaderProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <DashboardLoader />;
  }
  
  const { user } = props;

  if (!user || !user.role) {
    return <DashboardLoader />;
  }

  switch (user.role) {
    case 'admin':
      return (
        <AdminDashboardClient
          user={user}
          announcements={props.announcements!}
          allUsers={props.allUsers!}
          workPosts={props.workPosts!}
          workShifts={props.workShifts!}
          allTimeLogs={props.allTimeLogs!}
          signatureStatus={props.signatureStatus!}
          occurrences={props.occurrences!}
        />
      );
    case 'supervisor':
        return (
            <SupervisorDashboard
              user={user}
              announcements={props.announcements!}
              teamLogs={props.teamLogs!}
              supervisedPosts={props.supervisedPosts!}
              teamMembers={props.teamMembers!}
            />
        );
    case 'collaborator':
      return (
        <CollaboratorDashboardClient
          user={user}
          announcements={props.announcements!}
          timeLogs={props.timeLogs!}
          payslips={props.payslips!}
          signature={props.signature || null}
          breakSchedule={props.breakSchedule || null}
        />
      );
    default:
      return <div>Papel de usuário desconhecido.</div>;
  }
};

export default DashboardClientLoader;
