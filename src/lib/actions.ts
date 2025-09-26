'use server';

import { createSession, deleteSession } from '@/lib/auth';
import { findUserByEmail, addTimeLog, addAnnouncement, deleteAnnouncement, addPayslip, updateTimeLog, findUserById } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { validateTimeLogsWithFacialRecognition } from '@/ai/flows/validate-time-logs-with-facial-recognition';
import type { TimeLogAction } from './types';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
});

type LoginState = {
  error?: string;
  success?: boolean;
};

export async function login(prevState: LoginState, formData: FormData): Promise<LoginState> {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.email?.[0] || validatedFields.error.flatten().fieldErrors.password?.[0],
    };
  }

  const { email } = validatedFields.data;
  const user = findUserByEmail(email);

  if (!user) {
    return { error: 'Credenciais inválidas.' };
  }

  // In a real app, you would also check the password.
  // We'll skip that for this mock implementation.

  await createSession(user.id);
  
  redirect('/dashboard');
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}

async function toDataURI(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  const buffer = Buffer.from(await blob.arrayBuffer());
  const base64 = buffer.toString('base64');
  return `data:${blob.type};base64,${base64}`;
}

export async function recordTimeLog(
  userId: string,
  action: TimeLogAction,
  submittedPhotoDataUri: string
) {
  try {
    const user = findUserById(userId);
    if (!user) throw new Error('User not found');

    const profilePhotoDataUri = await toDataURI(user.profilePhotoUrl);

    if (!profilePhotoDataUri) {
      throw new Error('Could not load profile photo.');
    }
    
    const validationResult = await validateTimeLogsWithFacialRecognition({
      profilePhotoDataUri,
      submittedPhotoDataUri,
    });

    addTimeLog({
      userId,
      action,
      timestamp: new Date().toISOString(),
      validation: validationResult,
      photoUrl: submittedPhotoDataUri, // For display purposes
    });

    revalidatePath('/dashboard');
    return { success: true, message: `Ação '${action}' registrada com sucesso.` };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return { success: false, message: `Falha ao registrar ponto: ${errorMessage}` };
  }
}

export async function createAnnouncement(formData: FormData) {
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;

    if (!title || !content) {
        return { error: 'Título e conteúdo são obrigatórios.' };
    }

    addAnnouncement({ title, content });
    revalidatePath('/dashboard');
    return { success: true };
}

export async function removeAnnouncement(id: string) {
    deleteAnnouncement(id);
    revalidatePath('/dashboard');
}

export async function uploadPayslip(userId: string, fileName: string) {
    addPayslip({ userId, fileName });
    revalidatePath('/dashboard');
    return { success: true, message: `Holerite ${fileName} enviado com sucesso.` };
}

export async function editTimeLog(logId: string, newTimestamp: string) {
    if(!logId || !newTimestamp) return { error: 'Dados inválidos.' };

    const updated = updateTimeLog(logId, newTimestamp);
    if (updated) {
        revalidatePath('/dashboard');
        return { success: true, message: 'Registro de ponto atualizado.' };
    }
    return { error: 'Falha ao atualizar o registro.' };
}
