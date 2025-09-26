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
  const supervisors = allUsers.filter(u => u.role === 'supervisor');

  return (
    <Tabs defaultValue="overview" className="flex flex-col md:flex-row gap-6">
      <TabsList className="flex flex-row md:flex-col md:w-48 h-auto">
        <TabsTrigger value="overview" className="w-full justify-start">Visão Geral</TabsTrigger>
        <TabsTrigger value="collaborators" className="w-full justify-start">Colaboradores</TabsTrigger>
        <TabsTrigger value="settings" className="w-full justify-start">Gestão de Postos</TabsTrigger>
      </TabsList>
      <div className="flex-1">
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
              <WorkPostManager initialWorkPosts={workPosts} supervisors={supervisors} allUsers={allUsers} />
               <p className="text-center text-muted-foreground p-10">
                  Outras opções de gestão como Escalas e Eventos aparecerão aqui.
              </p>
           </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
