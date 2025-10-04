'use client';

import type { User, Announcement, TimeLog, Payslip, Signature, DailyBreakSchedule } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

// --- CORREÇÃO FINAL E DEFINITIVA DE TODAS AS IMPORTAÇÕES ---
import { Announcements } from './announcements'; 
import { ClockWidget } from './collaborator/clock-widget';
import { MyPayslips } from './collaborator/my-payslips';
import MonthlySignature from './collaborator/sign-sheet-widget'; // Este é o único com exportação default
import { TimeLogsTable } from './collaborator/time-logs-table';

// --- Componente do Card de Intervalo (sem alterações) ---
function BreakScheduleCard({ schedule }: { schedule: DailyBreakSchedule }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!schedule) return;
    const checkVisibility = () => {
      const now = new Date();
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
      const endDate = new Date();
      endDate.setHours(endHour, endMinute, 0, 0);
      if (now > endDate) {
        setIsVisible(false);
      }
    };
    checkVisibility();
    const interval = setInterval(checkVisibility, 60000);
    return () => clearInterval(interval);
  }, [schedule]);

  if (!schedule || !isVisible) {
    return null;
  }

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-blue-800">Seu Intervalo de Hoje</CardTitle>
        <Clock className="h-4 w-4 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-blue-900">
          {schedule.startTime} - {schedule.endTime}
        </div>
        <p className="text-xs text-blue-700">Definido pelo seu supervisor.</p>
      </CardContent>
    </Card>
  );
}

// --- Componente Principal do Dashboard do Colaborador (FINALMENTE CORRETO) ---
export default function CollaboratorDashboardClient({
  user,
  announcements,
  timeLogs,
  payslips,
  signature,
  breakSchedule,
}: {
  user: User;
  announcements: Announcement[];
  timeLogs: TimeLog[];
  payslips: Payslip[];
  signature: Signature | null;
  breakSchedule: DailyBreakSchedule | null;
}) {
  const [currentLogs, setCurrentLogs] = useState(timeLogs);

  const handleTimeLogUpdate = (newLog: TimeLog) => {
    setCurrentLogs(prevLogs => {
        const existingLogIndex = prevLogs.findIndex(log => log.id === newLog.id);
        if (existingLogIndex > -1) {
            const updatedLogs = [...prevLogs];
            updatedLogs[existingLogIndex] = newLog;
            return updatedLogs;
        } else {
            return [...prevLogs, newLog];
        }
    });
  };

  return (
    <div className="space-y-6">
      {breakSchedule && <BreakScheduleCard schedule={breakSchedule} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <ClockWidget user={user} onTimeLogUpdate={handleTimeLogUpdate} />
          <MonthlySignature userId={user.id} initialSignature={signature} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <TimeLogsTable initialTimeLogs={currentLogs} />
          <Announcements announcements={announcements} user={user} />
        </div>
      </div>

      <div className="grid gap-6">
        <MyPayslips payslips={payslips} />
      </div>
    </div>
  );
}
