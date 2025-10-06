'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Home, Megaphone, Users, FileText, Calendar, History, MapPin, Loader2 } from 'lucide-react';
import type { User, Announcement, WorkPost, WorkShift, TimeLog, Signature, Occurrence } from '@/lib/types';

// --- Carregamento dinâmico para TODOS os componentes da aba ---
const dynamicOpts = { ssr: false, loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> };

const TimeLogHistory = dynamic(() => import('./admin/time-log-history').then(mod => mod.TimeLogHistory), dynamicOpts);
const AnnouncementManager = dynamic(() => import('./admin/announcement-manager').then(mod => mod.AnnouncementManager), dynamicOpts);
const CollaboratorManager = dynamic(() => import('./admin/collaborator-manager').then(mod => mod.CollaboratorManager), dynamicOpts);
const DocumentManager = dynamic(() => import('./admin/document-manager').then(mod => mod.DocumentManager), dynamicOpts);
const WorkShiftManager = dynamic(() => import('./admin/work-shift-manager').then(mod => mod.WorkShiftManager), dynamicOpts);
const IndividualScheduleManager = dynamic(() => import('./admin/individual-schedule-manager').then(mod => mod.IndividualScheduleManager), dynamicOpts);
const OccurrenceManager = dynamic(() => import('./admin/occurrence-manager').then(mod => mod.OccurrenceManager), dynamicOpts);
const WorkPostManager = dynamic(() => import('./admin/work-post-manager').then(mod => mod.WorkPostManager), dynamicOpts);
// ---------------------------------------------------------

const tabs = {
  inicio: { label: 'Início', icon: Home, component: TimeLogHistory },
  comunicados: { label: 'Comunicados', icon: Megaphone, component: AnnouncementManager },
  colaboradores: { label: 'Colaboradores', icon: Users, component: CollaboratorManager },
  documentos: { label: 'Documentos', icon: FileText, component: DocumentManager },
  escalas: { label: 'Escalas de Turno', icon: Calendar, component: WorkShiftManager },
  escalas_individuais: { label: 'Escalas Individuais', icon: Calendar, component: IndividualScheduleManager },
  ocorrencias: { label: 'Ocorrências', icon: History, component: OccurrenceManager },
  postos: { label: 'Postos de Trabalho', icon: MapPin, component: WorkPostManager },
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
  const ActiveComponent = tabs[activeTab].component;

  const componentProps: any = {
      inicio: { allTimeLogs: props.allTimeLogs, allUsers: props.allUsers },
      comunicados: { initialAnnouncements: props.announcements, collaborators: props.allUsers },
      colaboradores: { collaborators: props.allUsers, workPosts: props.workPosts },
      documentos: { collaborators: props.allUsers },
      escalas: { initialWorkShifts: props.workShifts },
      escalas_individuais: { allUsers: props.allUsers, workPosts: props.workPosts },
      ocorrencias: { allUsers: props.allUsers, initialOccurrences: props.occurrences },
      postos: { initialWorkPosts: props.workPosts, allUsers: props.allUsers },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
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

      <main>
        <ActiveComponent {...componentProps[activeTab]} />
      </main>
    </div>
  );
}
