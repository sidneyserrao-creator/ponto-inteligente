// 🔒 Função “Pontos Assinados” desativada temporariamente – será reativada em atualização futura.
'use client';

import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useEffect, useState, Suspense } from 'react'; // Importa Suspense
import dynamic from 'next/dynamic'; // Importa dynamic
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { User, TimeLog, Payslip } from '@/lib/types';
import MyPayslips from '../_components/collaborator/my-payslips';

// --- Carregamento Dinâmico do ClockWidget ---
const ClockWidget = dynamic(() => import('../_components/collaborator/clock-widget'), {
  ssr: false, // Essencial para componentes que usam APIs de navegador
  loading: () => (
    <Card>
      <CardHeader>Registro de Ponto</CardHeader>
      <CardContent className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </CardContent>
    </Card>
  ),
});
// ----------------------------------------

export default function CollaboratorDashboardPage() {
  const [userData, setUserData] = useState<User | null>(null);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
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
        <Suspense fallback={
          <Card>
            <CardHeader>Registro de Ponto</CardHeader>
            <CardContent className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        }>
            <ClockWidget user={userData} timeLogs={timeLogs} />
        </Suspense>
      </div>
      <div className="md:col-span-1">
        <MyPayslips user={userData} payslips={payslips} />
      </div>
    </div>
  );
}
