import { GlassCard, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/glass-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Announcement as AnnouncementType, User } from '@/lib/types';
import { Megaphone, User as UserIcon } from 'lucide-react';

interface AnnouncementsProps {
  announcements: AnnouncementType[];
  user: User;
}

export function Announcements({ announcements, user }: AnnouncementsProps) {
  const isNew = (date: string) => (new Date().getTime() - new Date(date).getTime()) < 3 * 24 * 60 * 60 * 1000;

  // Filter announcements for the current user
  const relevantAnnouncements = announcements.filter(a => a.target === 'all' || a.userId === user.id);

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="text-primary"/>
          Mural de Avisos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          <div className="space-y-4 pr-4">
            {relevantAnnouncements.map((announcement) => (
              <div key={announcement.id} className="p-4 bg-background/50 rounded-lg">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{announcement.title}</h3>
                  <div className="text-xs text-muted-foreground text-right whitespace-nowrap">
                    {isNew(announcement.createdAt) && <Badge variant="destructive" className="mr-2 animate-pulse">NOVO</Badge>}
                    <time title={format(new Date(announcement.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}>
                      {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true, locale: ptBR })}
                    </time>
                  </div>
                </div>
                <p className="text-muted-foreground mt-1">{announcement.content}</p>
                {announcement.target === 'individual' && (
                    <div className="flex items-center gap-1 text-xs text-primary mt-2">
                        <UserIcon className="h-3 w-3"/>
                        <span>Aviso individual</span>
                    </div>
                )}
              </div>
            ))}
             {relevantAnnouncements.length === 0 && (
              <p className="text-center text-muted-foreground py-10">
                Nenhum aviso no momento.
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </GlassCard>
  );
}
