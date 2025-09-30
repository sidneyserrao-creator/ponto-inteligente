'use client';

import dynamic from 'next/dynamic';
import { AdminDashboard } from './admin-dashboard';
import { SupervisorDashboard } from './supervisor/supervisor-dashboard';
import type { User, Announcement, WorkPost, WorkShift, TimeLog, Payslip, Signature, Occurrence } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the CollaboratorDashboard with SSR turned off
const CollaboratorDashboard = dynamic(
  () => import('./collaborator-dashboard').then(mod => mod.CollaboratorDashboard),
  { 
    ssr: false,
    loading: () => <DashboardSkeleton />
  }
);

const DashboardSkeleton = () => (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

interface DashboardClientLoaderProps {
  user: User;
  announcements: Announcement[];
  allUsers?: User[];
  workPosts?: WorkPost[];
  workShifts?: WorkShift[];
  allTimeLogs?: TimeLog[];
  signatureStatus?: Record<string, Signature | null>;
  occurrences?: Occurrence[];
  teamLogs?: (User & { timeLogs: TimeLog[] })[];
  supervisedPosts?: WorkPost[];
  teamMembers?: User[];
  timeLogs?: TimeLog[];
  payslips?: Payslip[];
  signature?: Signature | null;
}

export function DashboardClientLoader(props: DashboardClientLoaderProps) {
  const { user } = props;

  switch (user.role) {
    case 'admin':
      return <AdminDashboard 
                user={user} 
                announcements={props.announcements!}
                allUsers={props.allUsers!}
                workPosts={props.workPosts!}
                workShifts={props.workShifts!}
                allTimeLogs={props.allTimeLogs!}
                signatureStatus={props.signatureStatus!}
                occurrences={props.occurrences!}
              />;
    case 'supervisor':
      return <SupervisorDashboard 
                user={user} 
                announcements={props.announcements!}
                teamLogs={props.teamLogs!}
                supervisedPosts={props.supervisedPosts!}
                teamMembers={props.teamMembers!}
              />;
    case 'collaborator':
      return <CollaboratorDashboard 
                user={user} 
                announcements={props.announcements!}
                timeLogs={props.timeLogs!}
                payslips={props.payslips!}
                signature={props.signature}
              />;
    default:
      return <div>Papel de usuário desconhecido.</div>;
  }
}
