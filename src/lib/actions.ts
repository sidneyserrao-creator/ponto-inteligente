'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import { sendNotification } from '@/lib/fcm';
import type { DailyBreakSchedule, Occurrence, Role, User, IndividualSchedule, TimeLog, TimeLogAction } from '@/lib/types';
import { createSession, deleteSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from 'next/navigation';
import { FieldValue } from 'firebase-admin/firestore';
import { addSignature, updateTimeLog as dbUpdateTimeLog, updateUserSchedule as dbUpdateUserSchedule, addOccurrence as dbAddOccurrence, addPayslip as dbAddPayslip, deleteAnnouncement as dbDeleteAnnouncement, addAnnouncement as dbAddAnnouncement, addWorkPost, updateWorkPost, deleteWorkPost, addWorkShift, updateWorkShift, removeWorkShift as dbRemoveWorkShift, updateUser, addUser } from './data';
import { renderToBuffer } from '@react-pdf/renderer';
import { TimeSheetDocument } from '@/app/dashboard/_components/pdf/time-sheet-document';
import { createElement } from 'react';

const SESSION_COOKIE_NAME = 'bit_seguranca_session';
const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 dias

// --- Auth Actions ---

export async function login(idToken: string) {
    'use server';
    if (!idToken) {
        return { error: 'ID Token do Firebase é necessário.', success: false };
    }
    try {
        const sessionCookie = await createSession(idToken);
        cookies().set(SESSION_COOKIE_NAME, sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: expiresIn / 1000
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

export async function recordTimeLog(
  userId: string, 
  action: TimeLogAction, 
  photoDataUrl: string, 
  location: { latitude: number; longitude: number } | null,
  timestampOverride?: string
) {
    'use server';
    if (!userId || !action || !photoDataUrl) {
        return { success: false, message: 'Dados incompletos para registrar o ponto.' };
    }

    try {
        const bucket = getStorage().bucket();
        const fileName = `time_logs/${userId}/${Date.now()}.jpg`;
        const imageBuffer = Buffer.from(photoDataUrl.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
        
        const file = bucket.file(fileName);
        await file.save(imageBuffer, { metadata: { contentType: 'image/jpeg' } });
        const photoUrl = file.publicUrl();

        const newLog: Omit<TimeLog, 'id'> = {
            userId,
            action,
            timestamp: timestampOverride || new Date().toISOString(),
            photoUrl,
            location,
        };

        const docRef = await db.collection('timeLogs').add(newLog);

        revalidatePath('/dashboard');
        return { success: true, message: 'Ponto registrado com sucesso!', logId: docRef.id };

    } catch (error) {
        console.error("Erro ao registrar ponto:", error);
        return { success: false, message: 'Ocorreu um erro no servidor.' };
    }
}


export async function editTimeLog(logId: string, newTimestamp: string) {
    'use server';
    try {
        await dbUpdateTimeLog(logId, newTimestamp);
        revalidatePath('/dashboard');
        return { success: true, message: 'Registro de ponto atualizado com sucesso!' };
    } catch (error) {
        console.error('Erro ao editar registro de ponto:', error);
        return { success: false, error: 'Falha ao atualizar o registro.' };
    }
}


// --- Occurrence Actions ---
export async function logOccurrence(previousState: any, formData: FormData) {
    'use server';
    const rawData = {
        userId: formData.get('userId') as string,
        date: formData.get('date') as string,
        type: formData.get('type') as Occurrence['type'],
        description: formData.get('description') as string,
    };

    if (!rawData.userId || !rawData.date || !rawData.type || !rawData.description) {
        return { success: false, error: 'Todos os campos são obrigatórios.' };
    }

    try {
        await dbAddOccurrence({ ...rawData, createdAt: new Date().toISOString() });
        revalidatePath('/dashboard');
        return { success: true, message: 'Ocorrência registrada com sucesso!' };
    } catch (error) {
        console.error('Erro ao registrar ocorrência:', error);
        return { success: false, error: 'Ocorreu um erro no servidor.' };
    }
}


// --- Announcement Actions ---

export async function createAnnouncement(formData: FormData) {
    'use server';
    const rawData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      target: formData.get('target') as 'all' | 'individual',
      userId: formData.get('userId') as string | undefined,
    };

  if (!rawData.title || !rawData.content) {
    return { error: 'Título e conteúdo são obrigatórios.' };
  }

  try {
    await dbAddAnnouncement({
        ...rawData,
        createdAt: new Date().toISOString(),
    });
    
    revalidatePath('/dashboard');

    if (rawData.target === 'individual' && rawData.userId) {
      const notification = {
        title: `Novo Comunicado: ${rawData.title}`,
        body: rawData.content.substring(0, 100),
      };
      await sendNotification(rawData.userId, notification);
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao criar anúncio:', error);
    return { error: 'Ocorreu um erro no servidor.' };
  }
}

export async function removeAnnouncement(id: string) {
    'use server';
  if (!id) {
    return { error: 'ID do anúncio é obrigatório.' };
  }
  try {
    await dbDeleteAnnouncement(id);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Erro ao remover anúncio:', error);
    return { error: 'Ocorreu um erro no servidor.' };
  }
}

// --- Break Time Actions ---

export async function saveBreakTime(formData: FormData) {
    'use server';
    const userId = formData.get('userId') as string;
    const breakStartTime = formData.get('breakStartTime') as string;
    const breakEndTime = formData.get('breakEndTime') as string;

    if (!userId || !breakStartTime || !breakEndTime) {
        return { success: false, error: 'Dados inválidos.' };
    }
    try {
        const schedule: DailyBreakSchedule = {
            id: `${userId}_${new Date().toISOString().slice(0, 10)}`,
            userId,
            date: new Date().toISOString().slice(0, 10),
            startTime: breakStartTime,
            endTime: breakEndTime,
            setBy: 'supervisor_id_placeholder', // You should get the current supervisor's ID here
            createdAt: new Date().toISOString(),
        };

        await db.collection('dailySchedules').doc(schedule.id).set(schedule);
        revalidatePath('/dashboard');

        await sendNotification(userId, {
            title: 'Horário de Intervalo Definido',
            body: `Seu intervalo hoje será das ${breakStartTime} às ${breakEndTime}.`,
        });

        return { success: true, message: 'Horário de intervalo definido com sucesso!' };
    } catch (error) {
        console.error('Erro ao definir o horário de intervalo:', error);
        return { error: 'Ocorreu um erro no servidor.' };
    }
}

// --- Payslip Actions ---

export async function uploadPayslip(formData: FormData) {
    'use server';
  const userId = formData.get('userId') as string;
  const file = formData.get('file') as File;

  if (!userId || !file) {
    return { success: false, error: 'Faltam informações.' };
  }
  try {
    const bucket = getStorage().bucket();
    const filePath = `payslips/${userId}/${new Date().getFullYear()}/${file.name}`;
    
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await bucket.file(filePath).save(fileBuffer, {
        metadata: { contentType: file.type }
    });

    await dbAddPayslip({
      userId,
      fileName: file.name,
      fileUrl: filePath, // Storing path instead of full URL for security
      uploadDate: new Date().toISOString(),
    });

    revalidatePath('/dashboard');
    return { success: true, message: 'Contracheque enviado com sucesso!' };

  } catch (error) {
    console.error('Erro no upload do contracheque:', error);
    return { success: false, error: 'Falha ao enviar o arquivo.' };
  }
}

// --- WorkPost Actions ---

export async function saveWorkPost(formData: FormData) {
    'use server';
    const id = formData.get('id') as string | null;

    const workPostData = {
        name: formData.get('name') as string,
        address: formData.get('address') as string,
        latitude: parseFloat(formData.get('latitude') as string),
        longitude: parseFloat(formData.get('longitude') as string),
        radius: parseInt(formData.get('radius') as string, 10),
        supervisorId: formData.get('supervisorId') as string,
    };
     if (!workPostData.name || !workPostData.address || isNaN(workPostData.latitude)) {
        return { success: false, error: 'Dados do posto de trabalho inválidos.' };
    }

    try {
        if (id) {
            await updateWorkPost(id, workPostData);
        } else {
            await addWorkPost(workPostData);
        }
        revalidatePath('/dashboard');
        return { success: true, message: `Posto de trabalho ${id ? 'atualizado' : 'criado'} com sucesso!` };
    } catch (error) {
        console.error('Erro ao salvar posto de trabalho:', error);
        return { success: false, error: 'Ocorreu um erro no servidor.' };
    }
}

export async function removeWorkPost(id: string) {
    'use server';
    try {
        await deleteWorkPost(id);
        revalidatePath('/dashboard');
        return { success: true, message: 'Posto de trabalho removido com sucesso!' };
    } catch (error) {
        console.error('Erro ao remover posto de trabalho:', error);
        return { success: false, error: 'Ocorreu um erro no servidor.' };
    }
}


// --- WorkShift Actions ---

export async function saveWorkShift(formData: FormData) {
    'use server';
    const id = formData.get('id') as string | null;
    
    const workShiftData = {
        name: formData.get('name') as string,
        startTime: formData.get('startTime') as string,
        endTime: formData.get('endTime') as string,
        days: formData.getAll('days') as string[],
    };

    if (!workShiftData.name || !workShiftData.startTime || !workShiftData.endTime || workShiftData.days.length === 0) {
        return { success: false, error: 'Todos os campos são obrigatórios.' };
    }

    try {
        if (id) {
            await updateWorkShift(id, workShiftData);
        } else {
            await addWorkShift(workShiftData);
        }
        revalidatePath('/dashboard');
        return { success: true, message: `Escala ${id ? 'atualizada' : 'criada'} com sucesso!` };
    } catch (error) {
        console.error('Erro ao salvar escala:', error);
        return { success: false, error: 'Ocorreu um erro no servidor.' };
    }
}

export async function removeWorkShift(id: string) {
    'use server';
    try {
        await dbRemoveWorkShift(id);
        revalidatePath('/dashboard');
        return { success: true, message: 'Escala de trabalho removida com sucesso!' };
    } catch (error) {
        console.error('Erro ao remover escala de trabalho:', error);
        return { success: false, error: 'Ocorreu um erro no servidor.' };
    }
}

// --- Collaborator (User) Actions ---
export async function saveCollaborator(formData: FormData) {
    'use server';
    const id = formData.get('id') as string | undefined;
    const capturedPhoto = formData.get('capturedPhoto') as string | null;
    const profilePhotoFile = formData.get('profilePhoto') as File | null;

    const userData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        role: formData.get('role') as Role,
        workPostId: formData.get('workPostId') as string,
    };
    
    if (userData.workPostId === 'none') {
        delete (userData as any).workPostId;
    }

    try {
        let photoUrl: string | undefined = undefined;

        if (capturedPhoto) {
             const bucket = getStorage().bucket();
            const fileName = `profile_photos/${id || Date.now()}.jpg`;
            const imageBuffer = Buffer.from(capturedPhoto.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
            const file = bucket.file(fileName);
            await file.save(imageBuffer, { metadata: { contentType: 'image/jpeg' } });
            photoUrl = file.publicUrl();
        } else if (profilePhotoFile && profilePhotoFile.size > 0) {
            const bucket = getStorage().bucket();
            const fileName = `profile_photos/${id || Date.now()}_${profilePhotoFile.name}`;
            const fileBuffer = Buffer.from(await profilePhotoFile.arrayBuffer());
            const file = bucket.file(fileName);
            await file.save(fileBuffer, { metadata: { contentType: profilePhotoFile.type } });
            photoUrl = file.publicUrl();
        }
        
        const dataToSave: any = { ...userData };
        if (photoUrl) {
            dataToSave.profilePhotoUrl = photoUrl;
        }
        
        if (id) {
            delete dataToSave.password; // Don't include password if not changing
             if (userData.password) {
                 await getAuth().updateUser(id, { password: userData.password });
             }
            await updateUser(id, dataToSave);
        } else {
            if (!userData.password) return { success: false, error: 'Senha é obrigatória para novos colaboradores.' };
            const newUser = await getAuth().createUser({
                email: userData.email,
                password: userData.password,
                displayName: userData.name,
                photoURL: photoUrl,
            });
            delete dataToSave.password;
            await db.collection('users').doc(newUser.uid).set(dataToSave);
        }
        
        revalidatePath('/dashboard');
        return { success: true, message: `Colaborador ${id ? 'atualizado' : 'criado'} com sucesso!` };
    } catch (error: any) {
        console.error('Erro ao salvar colaborador:', error);
        return { success: false, error: error.message || 'Ocorreu um erro no servidor.' };
    }
}

export async function removeCollaborator(userId: string) {
    'use server';
    try {
        await getAuth().deleteUser(userId);
        await db.collection('users').doc(userId).delete();
        revalidatePath('/dashboard');
        return { success: true, message: 'Colaborador removido com sucesso!' };
    } catch (error: any) {
        console.error('Erro ao remover colaborador:', error);
        return { success: false, error: error.message || 'Ocorreu um erro no servidor.' };
    }
}

// --- Signature Actions ---
export async function signTimeSheet(userId: string, monthYear: string) {
    'use server';
    try {
        const signature = await addSignature(userId, monthYear);
        revalidatePath('/dashboard');
        return { success: true, signature };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


// --- Individual Schedule Actions ---
export async function saveIndividualSchedule(formData: FormData) {
    'use server';
    const userId = formData.get('userId') as string;
    if (!userId) {
        return { success: false, error: "ID do usuário não encontrado." };
    }

    const schedule: IndividualSchedule = {};
    const dateKeys: string[] = [];

    // Agrupa chaves de data para evitar iterações redundantes
    for (const key of formData.keys()) {
        const datePart = key.split('-').slice(0, 3).join('-');
        if (!isNaN(new Date(datePart).getTime()) && !dateKeys.includes(datePart)) {
            dateKeys.push(datePart);
        }
    }
    
    // Processa cada dia
    for (const dateKey of dateKeys) {
        const start = formData.get(`${dateKey}-start`) as string | null;
        const end = formData.get(`${dateKey}-end`) as string | null;

        if (start && end) {
            schedule[dateKey] = { start, end };
        } else {
            // Se um dos campos estiver vazio, considera como folga para esse dia
            schedule[dateKey] = null;
        }
    }

    try {
        await dbUpdateUserSchedule(userId, schedule);
        revalidatePath('/dashboard');
        return { success: true, message: "Escala atualizada com sucesso!" };
    } catch (error) {
        console.error("Erro ao salvar escala individual:", error);
        return { success: false, error: "Falha ao salvar a escala no servidor." };
    }
}

    