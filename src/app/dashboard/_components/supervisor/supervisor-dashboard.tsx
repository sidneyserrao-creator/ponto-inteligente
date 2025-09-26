import type { User, TimeLog, Announcement, WorkPost } from '@/lib/types';
import { Announcements } from '../announcements';
import { TeamTimeLogs } from './team-time-logs';
import { BreakTimeManager } from './break-time-manager';

type TeamMemberWithLogs = User & { timeLogs: TimeLog[] };

interface SupervisorDashboardProps {
  user: User;
  announcements: Announcement[];
  teamLogs: TeamMemberWithLogs[];
  supervisedPosts: WorkPost[];
  teamMembers: User[];
}

export function SupervisorDashboard({ user, announcements, teamLogs, supervisedPosts, teamMembers }: SupervisorDashboardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <TeamTimeLogs teamLogs={teamLogs} />
        <BreakTimeManager supervisedPosts={supervisedPosts} teamMembers={teamMembers} />
      </div>
      <div className="space-y-6">
        <Announcements announcements={announcements} />
      </div>
    </div>
  );
}
