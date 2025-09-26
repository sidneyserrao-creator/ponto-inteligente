'use client';
import { useState, useMemo } from 'react';
import { GlassCard, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/glass-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/lib/types';
import { Calendar, Clock, Bed } from 'lucide-react';
import { format, startOfMonth, getDaysInMonth, addDays, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MyScheduleWidgetProps {
  user: User;
}

export function MyScheduleWidget({ user }: MyScheduleWidgetProps) {
  const [currentMonth] = useState(new Date());

  const monthlySchedule = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const daysInMonth = getDaysInMonth(currentMonth);
    const schedule = user.schedule || {};

    return Array.from({ length: daysInMonth }).map((_, i) => {
      const day = addDays(start, i);
      const dateKey = format(day, 'yyyy-MM-dd');
      const daySchedule = schedule[dateKey];
      const isWeekend = [0, 6].includes(getDay(day)); // Sunday, Saturday

      return {
        date: format(day, 'dd'),
        dayOfWeek: format(day, 'EEE', { locale: ptBR }),
        schedule: daySchedule,
        isWeekend,
      };
    });
  }, [currentMonth, user.schedule]);

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="text-primary" />
          Minha Escala
        </CardTitle>
        <CardDescription>
          Sua escala de trabalho para {format(currentMonth, 'MMMM', { locale: ptBR })}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-52">
          <div className="space-y-3 pr-4">
            {monthlySchedule.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center w-10">
                     <span className={cn(
                        "text-lg font-bold",
                        day.isWeekend && !day.schedule && "text-muted-foreground"
                     )}>{day.date}</span>
                    <span className={cn(
                        "text-xs capitalize",
                         day.isWeekend && !day.schedule && "text-muted-foreground"
                    )}>{day.dayOfWeek}</span>
                  </div>
                  <div className="border-l pl-3">
                    {day.schedule ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-green-400" />
                        <span className="font-semibold">{day.schedule.start} - {day.schedule.end}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Bed className="h-4 w-4" />
                        <span>Folga</span>
                      </div>
                    )}
                  </div>
                </div>
                 {day.schedule && <Badge variant="secondary">Trabalho</Badge>}
                 {!day.schedule && <Badge variant="outline">Folga</Badge>}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </GlassCard>
  );
}
