'use client';

import { useState } from 'react';
import { AnnouncementManager } from './admin/announcement-manager';
import { CollaboratorManager } from './admin/collaborator-manager';
import { DocumentManager } from './admin/document-manager';
import { IndividualScheduleManager } from './admin/individual-schedule-manager';
import { OccurrenceManager } from './admin/occurrence-manager';
import { TimeLogHistory } from './admin/time-log-history';
import { WorkPostManager } from './admin/work-post-manager';
import { Home, Megaphone, Users, FileText, Calendar, History, MapPin } from 'lucide-react';
import type { User, Announcement, WorkPost, WorkShift, TimeLog, Signature, Occurrence } from '@/lib/types';

// Metadados para as abas
const tabs = {
  inicio: { label: 'Início', icon: Home },
  comunicados: { label: 'Comunicados', icon: Megaphone },
  colaboradores: { label: 'Colaboradores', icon: Users },
  documentos: { label: 'Documentos', icon: FileText },
  escalas: { label: 'Escalas', icon: Calendar },
  ocorrencias: { label: 'Ocorrências', icon: History },
  postos: { label: 'Postos de Trabalho', icon: MapPin },
};

type TabKey = keyof typeof tabs;

export default function AdminDashboardClient(props: {
  user: User;
  announcements: Announcement[];
  allUsers: User[];
  workPosts: WorkPost[];
  workShifts: WorkShift[];
  allTimeLogs: TimeLog[];
  signatureStatus: Record<string, Signature | null>;
  occurrences: Occurrence[];
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
      {/* Navegação Lateral */}
      <nav className="flex flex-col gap-2">
        {(Object.keys(tabs) as TabKey[]).map(key => {
          const { label, icon: Icon } = tabs[key];
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground ${
                activeTab === key ? 'bg-primary text-primary-foreground' : 'bg-transparent'
              }`}>
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Conteúdo Principal Corrigido */}
      <main>
        {activeTab === 'inicio' && <TimeLogHistory allTimeLogs={props.allTimeLogs} allUsers={props.allUsers} />}
        {activeTab === 'comunicados' && <AnnouncementManager initialAnnouncements={props.announcements} collaborators={props.allUsers} />}
        {activeTab === 'colaboradores' && <CollaboratorManager collaborators={props.allUsers} workPosts={props.workPosts} />}
        {activeTab === 'documentos' && <DocumentManager collaborators={props.allUsers} />}
        {activeTab === 'escalas' && <IndividualScheduleManager allUsers={props.allUsers} workShifts={props.workShifts} workPosts={props.workPosts} />}
        {activeTab === 'ocorrencias' && <OccurrenceManager allUsers={props.allUsers} initialOccurrences={props.occurrences} />}
        {activeTab === 'postos' && <WorkPostManager initialWorkPosts={props.workPosts} supervisors={props.allUsers.filter(u => u.role === 'supervisor')} allUsers={props.allUsers} />}
      </main>
    </div>
  );
}
