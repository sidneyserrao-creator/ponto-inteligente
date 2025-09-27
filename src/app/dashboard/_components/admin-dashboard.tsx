import type { User, Announcement, WorkPost, TimeLog, Signature, WorkShift, Occurrence } from '@/lib/types';
import { Announcements } from './announcements';
import { AnnouncementManager } from './admin/announcement-manager';
import { DocumentManager } from './admin/document-manager';
import { CollaboratorManager } from './admin/collaborator-manager';
import { WorkPostManager } from './admin/work-post-manager';
import { TimeLogHistory } from './admin/time-log-history';
import { SignedTimeSheets } from './admin/signed-time-sheets';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { WorkShiftManager } from './admin/work-shift-manager';
import { IndividualScheduleManager } from './admin/individual-schedule-manager';
import { OccurrenceManager } from './admin/occurrence-manager';

interface AdminDashboardProps {
  user: User;
  announcements: Announcement[];
  allUsers: User[];
  workPosts: WorkPost[];
  workShifts: WorkShift[];
  allTimeLogs: TimeLog[];
  signatureStatus: Record<string, Signature | null>;
  occurrences: Occurrence[];
}

export function AdminDashboard({ user, announcements, allUsers, workPosts, workShifts, allTimeLogs, signatureStatus, occurrences }: AdminDashboardProps) {
  const collaborators = allUsers.filter(u => u.role !== 'admin');
  const supervisors = allUsers.filter(u => u.role === 'supervisor');

  return (
    <Tabs defaultValue="overview" className="flex flex-col md:flex-row gap-6">
      <div className="md:w-48">
        <ScrollArea className="w-full md:w-48">
          <TabsList className="flex flex-row md:flex-col h-auto w-max md:w-full">
            <TabsTrigger value="overview" className="w-full justify-start">Visão Geral</TabsTrigger>
            <TabsTrigger value="collaborators" className="w-full justify-start">Colaboradores</TabsTrigger>
            <TabsTrigger value="work-posts" className="w-full justify-start">Gestão de Postos</TabsTrigger>
            <TabsTrigger value="shifts" className="w-full justify-start">Escalas</TabsTrigger>
            <TabsTrigger value="occurrences" className="w-full justify-start">Ocorrências</TabsTrigger>
            <TabsTrigger value="history" className="w-full justify-start">Histórico de Pontos</TabsTrigger>
            <TabsTrigger value="signed" className="w-full justify-start">Pontos Assinados</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" className="md:hidden" />
        </ScrollArea>
      </div>
      <div className="flex-1">
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <AnnouncementManager initialAnnouncements={announcements} collaborators={collaborators} />
              <Announcements announcements={announcements} user={user} />
            </div>
            <div>
              <DocumentManager collaborators={collaborators} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="collaborators">
          <CollaboratorManager collaborators={allUsers} workPosts={workPosts} />
        </TabsContent>
        <TabsContent value="work-posts">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WorkPostManager initialWorkPosts={workPosts} supervisors={supervisors} allUsers={allUsers} />
               <p className="text-center text-muted-foreground p-10">
                  Outras opções de gestão como Eventos aparecerão aqui.
              </p>
           </div>
        </TabsContent>
        <TabsContent value="shifts">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <IndividualScheduleManager allUsers={allUsers} workPosts={workPosts} />
              <WorkShiftManager initialWorkShifts={workShifts} />
            </div>
        </TabsContent>
        <TabsContent value="occurrences">
          <OccurrenceManager allUsers={collaborators} initialOccurrences={occurrences} />
        </TabsContent>
        <TabsContent value="history">
            <TimeLogHistory allUsers={allUsers} allTimeLogs={allTimeLogs} />
        </TabsContent>
        <TabsContent value="signed">
           <SignedTimeSheets collaborators={collaborators} signatureStatus={signatureStatus} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
