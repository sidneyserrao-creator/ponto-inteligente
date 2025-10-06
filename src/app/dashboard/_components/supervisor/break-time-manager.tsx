'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Bell } from 'lucide-react';
import type { User } from '@/lib/types';

export function BreakTimeManager() {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const [colaboradores, setColaboradores] = useState<User[]>([]);
  const [intervalos, setIntervalos] = useState<Record<string, { inicio: string; fim: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchColaboradores = async () => {
      if (!currentUser?.uid) return;

      try {
        // 🔹 Buscar o posto do supervisor logado
        const postosSnap = await getDocs(
          query(collection(db, 'postos'), where('supervisorUid', '==', currentUser.uid))
        );

        if (postosSnap.empty) {
          setLoading(false);
          return;
        }

        const postoId = postosSnap.docs[0].id;

        // 🔹 Buscar colaboradores desse posto
        const usersSnap = await getDocs(
          query(collection(db, 'usuarios'), where('postoId', '==', postoId))
        );

        const lista = usersSnap.docs.map((d) => {
          const data = d.data() as User;
          return { ...data, id: d.id };
        });
        

        setColaboradores(lista);
      } catch (err) {
        console.error('Erro ao buscar colaboradores do posto:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchColaboradores();
  }, [currentUser]);

  const handleChange = (id: string, field: 'inicio' | 'fim', value: string) => {
    setIntervalos((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const salvarIntervalo = async (colabId: string) => {
    if (!intervalos[colabId]) return;

    try {
      setSaving(true);
      const { inicio, fim } = intervalos[colabId];

      // 1️⃣ Atualiza intervalo no perfil do colaborador
      await updateDoc(doc(db, 'usuarios', colabId), {
        intervalo: { inicio, fim },
        atualizadoEm: new Date().toISOString(),
      });

      // 2️⃣ Cria um aviso para o colaborador
      await addDoc(collection(db, 'avisos'), {
        userId: colabId,
        tipo: 'intervalo',
        titulo: 'Horário de intervalo atualizado',
        mensagem: `Seu horário de intervalo foi definido para ${inicio} até ${fim}.`,
        lido: false,
        criadoEm: serverTimestamp(),
      });

      alert('Horário atualizado e notificação enviada ao colaborador!');
    } catch (err) {
      console.error('Erro ao salvar horário:', err);
      alert('Erro ao salvar o horário. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-gray-300">
        <Loader2 className="h-6 w-6 animate-spin mb-2" />
        <p>Carregando colaboradores...</p>
      </div>
    );
  }

  if (colaboradores.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400">
        Nenhum colaborador encontrado neste posto.
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {colaboradores.map((colab) => (
        <Card
          key={colab.id}
          className="bg-white/5 backdrop-blur-md border border-white/10 shadow-md"
        >
          <CardHeader>
            <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-400" />
              {colab.name}
            </h3>
            <p className="text-sm text-gray-400">{colab.email}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-300">Início do intervalo:</label>
              <input
                type="time"
                className="bg-black/30 text-white rounded-md px-3 py-2"
                value={intervalos[colab.id]?.inicio || ''}
                onChange={(e) => handleChange(colab.id, 'inicio', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-300">Fim do intervalo:</label>
              <input
                type="time"
                className="bg-black/30 text-white rounded-md px-3 py-2"
                value={intervalos[colab.id]?.fim || ''}
                onChange={(e) => handleChange(colab.id, 'fim', e.target.value)}
              />
            </div>

            <Button
              onClick={() => salvarIntervalo(colab.id)}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 mt-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar intervalo e notificar'
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
