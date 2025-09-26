import type { User, TimeLog, Announcement, Payslip, Signature } from '@/lib/types';
import { Announcements } from './announcements';
import { ClockWidget } from './collaborator/clock-widget';
import { TimeLogsTable } from './collaborator/time-logs-table';
import { MyPayslips } from './collaborator/my-payslips';
import { SignSheetWidget } from './collaborator/sign-sheet-widget';
import { MyScheduleWidget } from './collaborator/my-schedule-widget';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface CollaboratorDashboardProps {
  user: User;
  announcements: Announcement[];
  timeLogs: TimeLog[];
  payslips: Payslip[];
  signature: Signature | null;
}

export async function CollaboratorDashboard({ user, announcements, timeLogs, payslips, signature }: CollaboratorDashboardProps) {
  // This is a workaround for the server component environment where we can't easily read file to base64
  // In a real app, this might be stored in the database or a secure vault.
  const profileImage = PlaceHolderImages.find(p => p.imageUrl === user.profilePhotoUrl);
  if (profileImage) {
    const response = await fetch(profileImage.imageUrl);
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    user.profilePhotoDataUri = `data:${blob.type};base64,${buffer.toString('base64')}`;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <ClockWidget user={user} timeLogs={timeLogs} />
        <TimeLogsTable timeLogs={timeLogs} />
      </div>
      <div className="space-y-6">
        <MyScheduleWidget user={user} />
        <SignSheetWidget user={user} logs={timeLogs} initialSignature={signature} />
        <Announcements announcements={announcements} />
        <MyPayslips payslips={payslips} />
      </div>
    </div>
  );
}
