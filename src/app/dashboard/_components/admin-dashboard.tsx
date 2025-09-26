import type { User, Announcement } from '@/lib/types';
import { Announcements } from './announcements';
import { AnnouncementManager } from './admin/announcement-manager';
import { DocumentManager } from './admin/document-manager';

interface AdminDashboardProps {
  user: User;
  announcements: Announcement[];
  allUsers: User[];
}

export function AdminDashboard({ user, announcements, allUsers }: AdminDashboardProps) {
  const collaborators = allUsers.filter(u => u.role !== 'admin');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <AnnouncementManager initialAnnouncements={announcements} />
        <Announcements announcements={announcements} />
      </div>
      <div>
        <DocumentManager collaborators={collaborators} />
      </div>
    </div>
  );
}
