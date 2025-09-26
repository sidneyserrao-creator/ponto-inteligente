import type { User, Announcement, WorkPost } from '@/lib/types';
import { Announcements } from './announcements';
import { AnnouncementManager } from './admin/announcement-manager';
import { DocumentManager } from './admin/document-manager';
import { CollaboratorManager } from './admin/collaborator-manager';
import { WorkPostManager } from './admin/work-post-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdminDashboardProps {
  user: User;
  announcements: Announcement[];
  allUsers: User[];
  workPosts: WorkPost[];
}

export function AdminDashboard({ user, announcements, allUsers, workPosts }: AdminDashboardProps) {
  const collaborators = allUsers.filter(u => u.role !== 'admin');
  return (
    <Tabs defaultValue="overview">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="collaborators">Colaboradores</TabsTrigger>
        <TabsTrigger value="settings">Gestão</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <AnnouncementManager initialAnnouncements={announcements} />
            <Announcements announcements={announcements} />
          </div>
          <div>
            <DocumentManager collaborators={collaborators} />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="collaborators">
        <CollaboratorManager collaborators={allUsers} workPosts={workPosts} />
      </TabsContent>
      <TabsContent value="settings">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WorkPostManager initialWorkPosts={workPosts} />
             <p className="text-center text-muted-foreground p-10">
                Outras opções de gestão como Escalas e Eventos aparecerão aqui.
            </p>
         </div>
      </TabsContent>
    </Tabs>
  );
}
