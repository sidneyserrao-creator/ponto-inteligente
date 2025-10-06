// 🔒 Função “Pontos Assinados” desativada temporariamente – será reativada em atualização futura.
'use client';

// Imports originais comentados para desativação temporária:
// import { useEffect, useState } from 'react';
// import { collection, getDocs, query, where } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import { Card, CardHeader, CardContent } from '@/components/ui/card';
// import { Loader2 } from 'lucide-react';
// import { ClientPDF } from '../pdf/client-pdf';
// import type { User, TimeLog, Signature } from '@/lib/types';

export function SignedTimeSheets() {
  // O conteúdo original foi comentado para desativar a funcionalidade.
  // A lógica de fetch e renderização será restaurada em uma futura atualização.
  
  return (
    <div className="p-6 text-gray-400 italic">
      Função de pontos assinados estará disponível em uma atualização futura.
    </div>
  );

  /*
  // CÓDIGO ORIGINAL DESATIVADO:
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<Record<string, TimeLog[]>>({});
  const [signatures, setSignatures] = useState<Record<string, Signature | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'usuarios'));
        const userList: User[] = usersSnap.docs.map((doc) => {
          const data = doc.data() as User;
          return { ...data, id: doc.id };
        });

        const allLogs: Record<string, TimeLog[]> = {};
        const allSignatures: Record<string, Signature | null> = {};

        for (const user of userList) {
          const logsQuery = query(
            collection(db, 'pontos'),
            where('userId', '==', user.id)
          );
          const logsSnap = await getDocs(logsQuery);
          allLogs[user.id] = logsSnap.docs.map((d) => d.data() as TimeLog);

          const sigQuery = query(
            collection(db, 'assinaturas'),
            where('userId', '==', user.id)
          );
          const sigSnap = await getDocs(sigQuery);
          allSignatures[user.id] = sigSnap.empty
            ? null
            : (sigSnap.docs[0].data() as Signature);
        }

        setUsers(userList);
        setLogs(allLogs);
        setSignatures(allSignatures);
      } catch (err) {
        console.error('Erro ao carregar pontos assinados:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-gray-300">
        <Loader2 className="h-6 w-6 animate-spin mb-2" />
        <p>Carregando registros e PDFs...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400">
        Nenhum colaborador encontrado.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-4">
      {users.map((user) => {
        const userLogs = logs[user.id] || [];
        const userSignature = signatures[user.id] || null;

        return (
          <Card
            key={user.id}
            className="bg-white/5 backdrop-blur-md border border-white/10 shadow-md"
          >
            <CardHeader>
              <h3 className="text-base font-semibold text-gray-100">
                {user.name || 'Sem nome'}
              </h3>
              <p className="text-sm text-gray-400">{user.email}</p>
            </CardHeader>
            <CardContent className="flex justify-center mt-4">
              <ClientPDF user={user} logs={userLogs} signature={userSignature} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
  */
}
