import type { User, TimeLog, Announcement } from '@/lib/types';
import { Announcements } from '../announcements';
import { TeamTimeLogs } from './team-time-logs';

type TeamMemberWithLogs = User & { timeLogs: TimeLog[] };
interface SupervisorDashboardProps {
  user: User;
  announcements: Announcement[];
  teamLogs: TeamMemberWithLogs[];
}

export function SupervisorDashboard({ user, announcements, teamLogs }: SupervisorDashboardProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <TeamTimeLogs teamLogs={teamLogs} />
      </div>
      <div>
        <Announcements announcements={announcements} />
      </div>
    </div>
  );
}
