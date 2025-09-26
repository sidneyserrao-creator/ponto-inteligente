'use server';

import { createSession, deleteSession } from '@/lib/auth';
import { findUserByEmail, addTimeLog, addAnnouncement, deleteAnnouncement, addPayslip, updateTimeLog, findUserById, addUser, updateUser, deleteUser, addWorkPost, addWorkShift } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { validateTimeLogsWithFacialRecognition } from '@/ai/flows/validate-time-logs-with-facial-recognition';
import type { Role, TimeLogAction } from './types';

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


// Collaborator Actions
const collaboratorSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Nome é obrigatório.'),
    email: z.string().email('E-mail inválido.'),
    role: z.enum(['collaborator', 'supervisor', 'admin']),
    workPostId: z.string().optional(),
});

export async function saveCollaborator(formData: FormData) {
    const rawData: any = Object.fromEntries(formData.entries());
    // Ensure workPostId is passed correctly, even if it's an empty string
    if (rawData.workPostId === '') {
        delete rawData.workPostId;
    }
    
    const validatedFields = collaboratorSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: 'Dados inválidos.', fieldErrors: validatedFields.error.flatten().fieldErrors };
    }

    const { id, ...data } = validatedFields.data;

    try {
        if (id) {
            // Update
            updateUser(id, data);
        } else {
            // Create
            addUser(data);
        }
        revalidatePath('/dashboard');
        return { success: true, message: `Colaborador ${id ? 'atualizado' : 'criado'} com sucesso.` };
    } catch (error) {
        return { error: 'Ocorreu um erro ao salvar o colaborador.' };
    }
}

export async function removeCollaborator(userId: string) {
    try {
        deleteUser(userId);
        revalidatePath('/dashboard');
        return { success: true, message: 'Colaborador removido com sucesso.' };
    } catch (error) {
        return { error: 'Ocorreu um erro ao remover o colaborador.' };
    }
}

// WorkPost Actions
export async function createWorkPost(formData: FormData) {
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    if (!name || !address) return { error: 'Nome e endereço são obrigatórios.' };

    addWorkPost({ name, address });
    revalidatePath('/dashboard');
    return { success: true, message: 'Posto de trabalho criado com sucesso.' };
}

// WorkShift Actions
export async function createWorkShift(formData: FormData) {
    const name = formData.get('name') as string;
    const startTime = formData.get('startTime') as string;
    const endTime = formData.get('endTime') as string;
    const days = formData.getAll('days') as string[];

    if (!name || !startTime || !endTime || days.length === 0) return { error: 'Todos os campos são obrigatórios.' };

    addWorkShift({ name, startTime, endTime, days });
    revalidatePath('/dashboard');
    return { success: true };
}
