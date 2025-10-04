'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { sendNotification } from '@/lib/fcm';
import type { DailyBreakSchedule, Occurrence, Role, User, IndividualSchedule, TimeLog, TimeLogAction } from '@/lib/types';
import { deleteSession, createSession } from "@/lib/auth"; // SESSION_COOKIE_NAME removido para evitar duplicidade
import { cookies } from "next/headers";
import { redirect } from 'next/navigation';
import { FieldValue } from 'firebase-admin/firestore';

// --- Auth Actions (CORRIGIDO) ---

export async function login(idToken: string) {
    'use server';
    if (!idToken) {
        return { error: 'ID Token do Firebase é necessário.', success: false };
    }
    try {
        const sessionCookie = await createSession(idToken);
        // O `createSession` já lida com o cookie, mas se precisarmos setar manualmente:
        (await
        // O `createSession` já lida com o cookie, mas se precisarmos setar manualmente:
        cookies()).set('session', sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 5 // 5 dias
        });
        redirect('/dashboard');
    } catch (e: any) {
        if (e.digest?.includes('NEXT_REDIRECT')) {
            throw e;
        }
        console.error("Falha ao criar sessão de login:", e);
        return { error: 'Ocorreu um erro ao fazer login.', success: false };
    }
}

export async function logout() {
    'use server';
    await deleteSession();
    redirect("/login");
}

// --- Time Log Actions ---

// Esta função já existia, mas o erro do compilador indicava que não. Isso pode ser um problema de cache.
export async function recordTimeLog(
  userId: string, 
  action: TimeLogAction, 
  photoDataUrl: string, 
  location: { latitude: number; longitude: number } | null
) {
    'use server';
    if (!userId || !action || !photoDataUrl) {
        return { success: false, message: 'Dados incompletos para registrar o ponto.' };
    }

    try {
        // Upload da foto para o Storage
        const bucket = getStorage().bucket();
        const fileName = `time_logs/${userId}/${Date.now()}.jpg`;
        const imageBuffer = Buffer.from(photoDataUrl.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
        
        const file = bucket.file(fileName);
        await file.save(imageBuffer, { metadata: { contentType: 'image/jpeg' } });
        await file.makePublic();
        const photoUrl = file.publicUrl();

        // Criação do registro no Firestore
        const newLog: Omit<TimeLog, 'id'> = {
            userId,
            action,
            timestamp: new Date().toISOString(),
            photoUrl,
            location,
            validated: false, // Ponto inicia como não validado
        };

        const docRef = await db.collection('timeLogs').add(newLog);

        revalidatePath('/dashboard');
        return { success: true, message: 'Ponto registrado com sucesso!', logId: docRef.id };

    } catch (error) {
        console.error("Erro ao registrar ponto:", error);
        return { success: false, message: 'Ocorreu um erro no servidor.' };
    }
}

// --- Occurrence Actions (CORRIGIDO) ---
export async function saveOccurrence(formData: FormData) {
    const id = formData.get('id') as string | null;
    
    // CORREÇÃO: A propriedade se chama 'description', e não 'reason'
    const description = formData.get('description') as string;

    if (!description) {
        return { success: false, error: 'A descrição da ocorrência é obrigatória.' };
    }

    const occurrenceData: Partial<Occurrence> = {
        userId: formData.get('userId') as string,
        date: formData.get('date') as string,
        description: description,
        status: 'pending',
    };

    try {
        if (id) {
            await db.collection('occurrences').doc(id).update(occurrenceData);
        } else {
            occurrenceData.createdAt = new Date().toISOString();
            await db.collection('occurrences').add(occurrenceData);
        }
        revalidatePath('/dashboard');
        return { success: true, message: `Ocorrência ${id ? 'atualizada' : 'criada'} com sucesso!` };
    } catch (error) {
        console.error('Erro ao salvar ocorrência:', error);
        return { success: false, error: 'Ocorreu um erro no servidor.' };
    }
}

// --- Outras funções permanecem inalteradas, mas listadas para completude ---

export async function createAnnouncement(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const recipientIds = formData.getAll('recipientIds') as string[];

  if (!title || !content) {
    return { success: false, message: 'Título e conteúdo são obrigatórios.' };
  }

  try {
    const docRef = await db.collection('announcements').add({
      title,
      content,
      recipientIds,
      createdAt: new Date().toISOString(),
    });
    revalidatePath('/dashboard');

    if (recipientIds && recipientIds.length > 0) {
      const notification = {
        title: `Novo Comunicado: ${title}`,
        body: content.substring(0, 100),
      };
      await Promise.all(recipientIds.map(userId => sendNotification(userId, notification)));
    }

    return { success: true, message: 'Anúncio criado com sucesso!', id: docRef.id };
  } catch (error) {
    console.error('Erro ao criar anúncio:', error);
    return { success: false, message: 'Ocorreu um erro no servidor.' };
  }
}

export async function removeAnnouncement(id: string) {
  if (!id) {
    return { success: false, message: 'ID do anúncio é obrigatório.' };
  }
  try {
    await db.collection('announcements').doc(id).delete();
    revalidatePath('/dashboard');
    return { success: true, message: 'Anúncio removido com sucesso!' };
  } catch (error) {
    console.error('Erro ao remover anúncio:', error);
    return { success: false, message: 'Ocorreu um erro no servidor.' };
  }
}

export async function setBreakTime(supervisorId: string, collaboratorId: string, startTime: string, endTime: string) {
  if (!supervisorId || !collaboratorId || !startTime || !endTime) {
    return { success: false, message: 'Dados inválidos.' };
  }
  try {
    const today = new Date().toISOString().slice(0, 10);
    const scheduleId = `${collaboratorId}_${today}`;

    const newSchedule: Omit<DailyBreakSchedule, 'id'> = {
      userId: collaboratorId,
      date: today,
      startTime,
      endTime,
      setBy: supervisorId,
      createdAt: new Date().toISOString(),
    };

    await db.collection('dailySchedules').doc(scheduleId).set(newSchedule);
    revalidatePath('/dashboard');

    await sendNotification(collaboratorId, {
      title: 'Horário de Intervalo Definido',
      body: `Seu intervalo hoje será das ${startTime} às ${endTime}.`,
    });

    return { success: true, message: 'Horário de intervalo definido com sucesso!' };
  } catch (error) {
    console.error('Erro ao definir o horário de intervalo:', error);
    return { success: false, message: 'Ocorreu um erro no servidor.' };
  }
}

export async function uploadPayslip(formData: FormData) {
  const userId = formData.get('userId') as string;
  const file = formData.get('file') as File;

  if (!userId || !file) {
    return { success: false, error: 'Faltam informações.' };
  }
  try {
    const bucket = getStorage().bucket();
    const filePath = `payslips/${userId}/${new Date().getFullYear()}/${file.name}`;
    const blob = bucket.file(filePath);
    const blobStream = blob.createWriteStream({ metadata: { contentType: file.type } });

    const streamFinished = new Promise((resolve, reject) => {
      blobStream.on('finish', resolve);
      blobStream.on('error', reject);
    });

    const fileBuffer = await file.arrayBuffer();
    blobStream.end(Buffer.from(fileBuffer));

    await streamFinished;

    await db.collection('payslipUploads').add({
      userId,
      fileName: file.name,
      filePath: filePath,
      uploadedAt: new Date().toISOString(),
    });

    revalidatePath('/dashboard');
    return { success: true, message: 'Contracheque enviado com sucesso!' };

  } catch (error) {
    console.error('Erro no upload do contracheque:', error);
    return { success: false, error: 'Falha ao enviar o arquivo.' };
  }
}

export async function removeOccurrence(id: string) {
    try {
        await db.collection('occurrences').doc(id).delete();
        revalidatePath('/dashboard');
        return { success: true, message: 'Ocorrência removida com sucesso!' };
    } catch (error) {
        console.error('Erro ao remover ocorrência:', error);
        return { success: false, error: 'Ocorreu um erro no servidor.' };
    }
}

export async function saveWorkPost(formData: FormData) {
    const id = formData.get('id') as string | null;

    const workPostData = {
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        latitude: parseFloat(formData.get('latitude') as string),
        longitude: parseFloat(formData.get('longitude') as string),
        radius: parseInt(formData.get('radius') as string, 10),
        supervisorId: formData.get('supervisorId') as string,
    };

    try {
        if (id) {
            await db.collection('workposts').doc(id).update(workPostData);
        } else {
            await db.collection('workposts').add(workPostData);
        }
        revalidatePath('/dashboard');
        return { success: true, message: `Posto de trabalho ${id ? 'atualizado' : 'criado'} com sucesso!` };
    } catch (error) {
        console.error('Erro ao salvar posto de trabalho:', error);
        return { success: false, error: 'Ocorreu um erro no servidor.' };
    }
}

export async function removeWorkPost(id: string) {
    try {
        await db.collection('workposts').doc(id).delete();
        revalidatePath('/dashboard');
        return { success: true, message: 'Posto de trabalho removido com sucesso!' };
    } catch (error) {
        console.error('Erro ao remover posto de trabalho:', error);
        return { success: false, error: 'Ocorreu um erro no servidor.' };
    }
}
