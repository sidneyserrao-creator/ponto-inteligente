'use client';

import { useState, useTransition } from 'react';
import type { User, Announcement, WorkPost, TimeLog } from '@/lib/types';
import { saveBreakTime } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

function SetBreakTimeForm({ supervisorId, collaborator }: { supervisorId: string, collaborator: User }) {
  const [isPending, startTransition] = useTransition();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) {
      toast.error('Por favor, preencha o horário de início e fim.');
      return;
    }

    startTransition(async () => {
      // Aqui, a função chamada deveria ser a exportada de 'actions.ts',
      // mas como o formulário não passa os dados corretamente, vou criar um FormData.
      const formData = new FormData();
      formData.append('userId', collaborator.id);
      formData.append('breakStartTime', startTime);
      formData.append('breakEndTime', endTime);

      const result = await saveBreakTime(formData);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-4">
      <div className="flex items-center gap-2">
        <Input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full"
          disabled={isPending}
        />
        <span>às</span>
        <Input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-full"
          disabled={isPending}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Salvando...' : 'Definir Intervalo'}
      </Button>
    </form>
  );
}

export default function SupervisorDashboardClient({
  user,
  announcements,
  teamLogs,
  supervisedPosts,
  teamMembers,
}: {
  user: User;
  announcements: Announcement[];
  teamLogs: (User & { timeLogs: TimeLog[] })[];
  supervisedPosts: WorkPost[];
  teamMembers: User[];
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Painel do Supervisor</h2>
      <p className="mb-6">Bem-vindo, {user.name}!</p>

      <section>
        <h3 className="text-xl font-semibold mb-4">Membros da Equipe</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <CardTitle>{member.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{member.email}</p>
                <SetBreakTimeForm supervisorId={user.id} collaborator={member} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Placeholder para outras seções */}
    </div>
  );
}
