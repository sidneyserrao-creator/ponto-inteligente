'use server';

import { createSession, deleteSession, getCurrentUser } from '@/lib/auth';
import { findUserByEmail, addTimeLog, addAnnouncement, deleteAnnouncement, addPayslip, updateTimeLog, findUserById, addUser, updateUser, deleteUser, addWorkPost, addWorkShift, saveFile, addSignature, updateWorkPost, deleteWorkPost, updateWorkShift, removeWorkShift, updateUserSchedule, addOccurrence } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { validateTimeLogsWithFacialRecognition } from '@/ai/flows/validate-time-logs-with-facial-recognition';
import type { Role, TimeLogAction, IndividualSchedule } from './types';
import { getDaysInMonth, startOfMonth, format, addDays } from 'date-fns';

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
      error: validatedFields.error.flatten().fieldErrors.email?.[0] || validatedFields.error.flatten().fieldErrors.password?.[0] || 'Entrada inválida',
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
  submittedPhotoDataUri: string,
  location: { latitude: number; longitude: number } | null,
  timestamp?: string // Optional: for offline sync
) {
  try {
    const user = findUserById(userId);
    if (!user) throw new Error('Usuário não encontrado.');

    // Use profilePhotoDataUri if it's already on the user object, otherwise fetch it.
    const profilePhotoDataUri = user.profilePhotoDataUri || await toDataURI(user.profilePhotoUrl);

    if (!profilePhotoDataUri) {
      throw new Error('Não foi possível carregar a foto de perfil.');
    }
    
    const validationResult = await validateTimeLogsWithFacialRecognition({
      profilePhotoDataUri,
      submittedPhotoDataUri,
    });

    // If validation fails, don't save the log, just return the reason.
    if (!validationResult.isValidated) {
        return { success: false, message: `Validação falhou: ${validationResult.reason}` };
    }

    addTimeLog({
      userId,
      action,
      timestamp: timestamp || new Date().toISOString(),
      validation: validationResult,
      photoUrl: submittedPhotoDataUri, // For display purposes
      location: location || undefined,
    });

    revalidatePath('/dashboard');
    return { success: true, message: `Ação '${action}' registrada com sucesso.` };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
    return { success: false, message: `Falha ao registrar ponto: ${errorMessage}` };
  }
}


const announcementSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório.'),
    content: z.string().min(1, 'Conteúdo é obrigatório.'),
    target: z.enum(['all', 'individual']),
    userId: z.string().optional(),
});

export async function createAnnouncement(formData: FormData) {
    const rawData: any = Object.fromEntries(formData.entries());

    if (rawData.target === 'all') {
        delete rawData.userId;
    }
    
    const validatedFields = announcementSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: 'Dados inválidos.' };
    }
    
    if (validatedFields.data.target === 'individual' && !validatedFields.data.userId) {
        return { error: 'Selecione um colaborador para um aviso individual.' };
    }

    addAnnouncement(validatedFields.data);
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
    return { success: true, message: `Contracheque ${fileName} enviado com sucesso.` };
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
    password: z.string().optional(),
    role: z.enum(['collaborator', 'supervisor', 'admin']),
    workPostId: z.string().optional(),
    profilePhoto: z.instanceof(File).optional(),
    capturedPhoto: z.string().optional(), // Base64 string for captured photo
});

export async function saveCollaborator(formData: FormData) {
    const rawData: any = Object.fromEntries(formData.entries());
    
    if (rawData.workPostId === 'none' || rawData.workPostId === '') {
        delete rawData.workPostId;
    }
     if (rawData.password === '') {
        delete rawData.password;
    }
    if (rawData.profilePhoto?.size === 0) {
        delete rawData.profilePhoto;
    }
    
    const validatedFields = collaboratorSchema.safeParse(rawData);

    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten().fieldErrors);
        return { error: 'Dados inválidos.', fieldErrors: validatedFields.error.flatten().fieldErrors };
    }

    const { id, profilePhoto, capturedPhoto, ...data } = validatedFields.data;

    if (!id && !data.password) {
        return { error: 'Senha é obrigatória para novos colaboradores.' };
    }
    if (!id && !profilePhoto) {
        return { error: 'Foto de perfil é obrigatória para novos colaboradores.' };
    }

    try {
        let profilePhotoUrl = undefined;
        if (id && capturedPhoto) {
            // If editing and a new photo was captured, save it.
            profilePhotoUrl = await saveFile(capturedPhoto);
        } else if (!id && profilePhoto) {
            // If creating and a photo was uploaded, save it.
            profilePhotoUrl = await saveFile(profilePhoto);
        }

        const userData = { ...data, profilePhotoUrl };

        if (id) {
            updateUser(id, userData);
        } else {
            addUser(userData as any);
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
const workPostSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Nome é obrigatório.'),
    address: z.string().min(1, 'Endereço é obrigatório.'),
    supervisorId: z.string().optional(),
});


export async function saveWorkPost(formData: FormData) {
    const rawData: any = Object.fromEntries(formData.entries());
    if (rawData.supervisorId === 'none') {
        rawData.supervisorId = undefined;
    }
    
    const validatedFields = workPostSchema.safeParse(rawData);
    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten().fieldErrors);
        return { error: 'Dados inválidos.' };
    }

    const { id, ...data } = validatedFields.data;

    try {
        if (id) {
            updateWorkPost(id, data);
        } else {
            addWorkPost(data);
        }
        revalidatePath('/dashboard');
        return { success: true, message: `Posto de trabalho ${id ? 'atualizado' : 'criado'} com sucesso.` };
    } catch (error) {
        return { error: 'Falha ao salvar o posto de trabalho.' };
    }
}

export async function removeWorkPost(workPostId: string) {
    try {
        deleteWorkPost(workPostId);
        revalidatePath('/dashboard');
        return { success: true, message: 'Posto de trabalho removido com sucesso.' };
    } catch (error) {
        return { error: 'Ocorreu um erro ao remover o posto de trabalho.' };
    }
}

// WorkShift Actions
const workShiftSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Nome é obrigatório.'),
    startTime: z.string().min(1, 'Horário de início é obrigatório.'),
    endTime: z.string().min(1, 'Horário de fim é obrigatório.'),
    days: z.array(z.string()).min(1, 'Selecione ao menos um dia.'),
});

export async function saveWorkShift(formData: FormData) {
    const rawData = {
        id: formData.get('id') || undefined,
        name: formData.get('name'),
        startTime: formData.get('startTime'),
        endTime: formData.get('endTime'),
        days: formData.getAll('days'),
    };

    const validatedFields = workShiftSchema.safeParse(rawData);

    if (!validatedFields.success) {
        console.error(validatedFields.error.flatten().fieldErrors);
        return { error: 'Dados inválidos. Verifique os campos e tente novamente.' };
    }

    const { id, ...data } = validatedFields.data;
    
    try {
        if (id) {
            updateWorkShift(id, data);
        } else {
            addWorkShift(data);
        }
        revalidatePath('/dashboard');
        return { success: true, message: `Escala ${id ? 'atualizada' : 'criada'} com sucesso.` };
    } catch (error) {
        return { error: 'Falha ao salvar a escala de trabalho.' };
    }
}

export async function removeWorkShift(shiftId: string) {
    try {
        removeWorkShift(shiftId);
        revalidatePath('/dashboard');
        return { success: true, message: 'Escala removida com sucesso.' };
    } catch (error) {
        return { error: 'Ocorreu um erro ao remover a escala.' };
    }
}
    
export async function signMyTimeSheet(monthYear: string) {
    const user = await getCurrentUser();
    if (!user) {
        return { error: 'Usuário não autenticado.' };
    }

    try {
        const signature = addSignature(user.id, monthYear);
        revalidatePath('/dashboard');
        return { success: true, signature, message: 'Ponto assinado com sucesso.' };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
        return { error: errorMessage };
    }
}

export async function saveIndividualSchedule(formData: FormData) {
    const userId = formData.get('userId') as string;

    if (!userId) {
        return { error: 'ID do usuário não fornecido.' };
    }

    const schedule: IndividualSchedule = {};
    const today = new Date();
    const start = startOfMonth(today);
    const daysInMonth = getDaysInMonth(today);

    for (let i = 0; i < daysInMonth; i++) {
        const day = addDays(start, i);
        const dateKey = format(day, 'yyyy-MM-dd');

        const startTime = formData.get(`${dateKey}-start`) as string;
        const endTime = formData.get(`${dateKey}-end`) as string;

        if (startTime && endTime) {
            schedule[dateKey] = { start: startTime, end: endTime };
        } else {
            schedule[dateKey] = undefined;
        }
    }

    try {
        updateUserSchedule(userId, schedule);
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
         const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
        return { error: `Falha ao salvar a escala: ${errorMessage}` };
    }
}

const breakTimeSchema = z.object({
    userId: z.string().min(1, 'É necessário selecionar um colaborador.'),
    breakStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido.').or(z.literal('')),
    breakEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido.').or(z.literal('')),
});

export async function saveBreakTime(formData: FormData) {
    const validatedFields = breakTimeSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { error: 'Dados inválidos. Verifique os horários e tente novamente.' };
    }

    const { userId, ...breakTimes } = validatedFields.data;

    try {
        updateUser(userId, breakTimes);
        revalidatePath('/dashboard');
        return { success: true, message: 'Horário de intervalo atualizado com sucesso!' };
    } catch (error) {
        return { error: 'Ocorreu um erro ao salvar o horário de intervalo.' };
    }
}

const occurrenceSchema = z.object({
    userId: z.string().min(1, 'Colaborador é obrigatório.'),
    date: z.string().min(1, 'Data é obrigatória.'),
    type: z.enum(['justified_absence', 'medical_leave', 'vacation', 'unjustified_absence']),
    description: z.string().min(1, 'Descrição é obrigatória.'),
});

export async function logOccurrence(prevState: any, formData: FormData) {
    const rawData = {
        userId: formData.get('userId'),
        date: formData.get('date'),
        type: formData.get('type'),
        description: formData.get('description'),
    };
    
    const validatedFields = occurrenceSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return { error: 'Dados inválidos. Preencha todos os campos.' };
    }
    
    try {
        addOccurrence(validatedFields.data);
        revalidatePath('/dashboard');
        return { success: true, message: 'Ocorrência registrada com sucesso.' };
    } catch (error) {
        return { error: 'Ocorreu um erro ao registrar a ocorrência.' };
    }
}
