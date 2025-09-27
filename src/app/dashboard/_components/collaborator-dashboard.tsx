import type { User, TimeLog, Announcement, Payslip, Signature } from '@/lib/types';
import { Announcements } from './announcements';
import { ClockWidget } from './collaborator/clock-widget';
import { TimeLogsTable } from './collaborator/time-logs-table';
import { MyPayslips } from './collaborator/my-payslips';
import { SignSheetWidget } from './collaborator/sign-sheet-widget';
import { MyScheduleWidget } from './collaborator/my-schedule-widget';

interface CollaboratorDashboardProps {
  user: User;
  announcements: Announcement[];
  timeLogs: TimeLog[];
  payslips: Payslip[];
  signature: Signature | null;
}

export async function CollaboratorDashboard({ user, announcements, timeLogs, payslips, signature }: CollaboratorDashboardProps) {
  // We no longer need to fetch the image and convert to data URI here
  // because the facial recognition flow will do it.
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <ClockWidget user={user} timeLogs={timeLogs} />
        <TimeLogsTable timeLogs={timeLogs} />
      </div>
      <div className="space-y-6">
        <MyScheduleWidget user={user} />
        <SignSheetWidget user={user} logs={timeLogs} initialSignature={signature} />
        <Announcements announcements={announcements} user={user} />
        <MyPayslips payslips={payslips} />
      </div>
    </div>
  );
}
