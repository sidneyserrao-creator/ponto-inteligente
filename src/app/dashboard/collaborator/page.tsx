// 🔒 Função “Pontos Assinados” desativada temporariamente – será reativada em atualização futura.
'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { User, TimeLog, Payslip } from '@/lib/types'; // Removido 'Signature'
import ClockWidget from '../_components/collaborator/clock-widget';
import MyPayslips from '../_components/collaborator/my-payslips';
// Import de CollaboratorSignedTimeSheets foi removido.

export default function CollaboratorDashboardPage() {
  const [userData, setUserData] = useState<User | null>(null);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  // O estado 'signature' foi removido.
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUserData(userData);
            // Simulação de dados. A lógica de buscar a assinatura foi removida.
        }
      } catch (error) {
        console.error('Erro ao carregar dados do colaborador:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [auth]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-gray-300">
        <Loader2 className="h-6 w-6 animate-spin mb-2" />
        <p>Carregando painel do colaborador...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-6 text-center text-gray-400">
        Não foi possível carregar os dados do colaborador. Tente novamente.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      <div className="md:col-span-2">
        <ClockWidget user={userData} timeLogs={timeLogs} />
      </div>
      <div className="md:col-span-1">
        <MyPayslips user={userData} payslips={payslips} />
      </div>
    </div>
  );
}
