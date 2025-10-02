'use client';

import type { User, TimeLog, Payslip, Signature, Announcement, Occurrence, WorkPost, WorkShift } from '@/lib/types';
import { AdminDashboard } from './admin-dashboard';
import { CollaboratorDashboard } from './collaborator-dashboard';
import { SupervisorDashboard } from './supervisor/supervisor-dashboard';
import { useEffect, useState } from 'react';

// Consolidate all possible props for any dashboard type
interface DashboardClientLoaderProps {
  user: User;
  // Collaborator specific
  timeLogs?: TimeLog[];
  payslips?: Payslip[];
  signature?: Signature | null;
  // Supervisor specific
  teamLogs?: (User & { timeLogs: TimeLog[] })[];
  supervisedPosts?: WorkPost[];
  teamMembers?: User[];
  // Admin specific
  allUsers?: User[];
  workPosts?: WorkPost[];
  workShifts?: WorkShift[];
  allTimeLogs?: TimeLog[];
  signatureStatus?: Record<string, Signature | null>;
  occurrences?: Occurrence[];
  // Common
  announcements?: Announcement[];

}

const DashboardClientLoader = (props: DashboardClientLoaderProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Render nothing on the server to avoid hydration mismatch
    return null;
  }
  
  const { user, ...rest } = props;

  if (!user || !user.role) {
    return <div>Carregando...</div>;
  }

  switch (user.role) {
    case 'admin':
      return (
        <AdminDashboard
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
        <CollaboratorDashboard
          user={user}
          announcements={props.announcements!}
          timeLogs={props.timeLogs!}
          payslips={props.payslips!}
          signature={props.signature || null} 
        />
      );
    default:
      return <div>Papel de usuário desconhecido.</div>;
  }
};

export default DashboardClientLoader;
