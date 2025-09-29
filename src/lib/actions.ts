'use server';

import { deleteSession, getCurrentUser } from '@/lib/auth';
import { findUserByEmail, addTimeLog, addAnnouncement, deleteAnnouncement, addPayslip, updateTimeLog, findUserById, addUser, updateUser, deleteUser, addWorkPost, addWorkShift, saveFile, addSignature, updateWorkPost, deleteWorkPost, updateWorkShift, removeWorkShift as removeDataWorkShift, updateUserSchedule, addOccurrence, getWorkPosts } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { validateTimeLogsWithFacialRecognition } from '@/ai/flows/validate-time-logs-with-facial-recognition';
import type { Role, TimeLogAction, IndividualSchedule } from './types';
import { getDaysInMonth, startOfMonth, format, addDays } from 'date-fns';

// Note: The login server action has been removed and is now handled by an API route (/api/auth/session)

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

// Haversine formula to calculate distance between two lat/lng points
function getDistance(
  location1: { latitude: number; longitude: number },
  location2: { latitude: number; longitude: number }
): number {
  const R = 6371e3; // metres
  const φ1 = (location1.latitude * Math.PI) / 180;
  const φ2 = (location2.latitude * Math.PI) / 180;
  const Δφ = ((location2.latitude - location1.latitude) * Math.PI) / 180;
  const Δλ = ((location2.longitude - location1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

export async function recordTimeLog(
  userId: string,
  action: TimeLogAction,
  submittedPhotoDataUri: string,
  location: { latitude: number; longitude: number } | null,
  timestamp?: string // Optional: for offline sync
) {
  try {
    const user = await findUserById(userId);
    if (!user) throw new Error('Usuário não encontrado.');
    if (!user.workPostId) throw new Error('Colaborador não está associado a um posto de trabalho.');

    // Step 1: Geolocation validation
    const allWorkPosts = await getWorkPosts();
    const workPost = allWorkPosts.find(p => p.id === user.workPostId);
    if (!workPost || !workPost.latitude || !workPost.longitude || !workPost.radius) {
        throw new Error('Configuração de geolocalização do posto de trabalho está incompleta.');
    }
    if (!location) {
        throw new Error('Não foi possível obter sua localização atual.');
    }

    const distance = getDistance(location, { latitude: workPost.latitude, longitude: workPost.longitude });
    if (distance > workPost.radius) {
        return { success: false, message: `Você está a ${Math.round(distance)} metros do posto. Aproxime-se para registrar o ponto (limite: ${workPost.radius}m).`};
    }

    // Step 2: Facial Recognition
    const profilePhotoDataUri = user.profilePhotoDataUri || await toDataURI(user.profilePhotoUrl);
    if (!profilePhotoDataUri) {
      throw new Error('Não foi possível carregar a foto de perfil.');
    }
    
    const validationResult = await validateTimeLogsWithFacialRecognition({
      profilePhotoDataUri,
      submittedPhotoDataUri,
    });

    if (!validationResult.isValidated) {
        return { success: false, message: `Validação falhou: ${validationResult.reason}` };
    }

    // Step 3: Save the photo and log
    const photoUrl = await saveFile(submittedPhotoDataUri);
    
    await addTimeLog({
      userId,
      action,
      timestamp: timestamp || new Date().toISOString(),
      validation: validationResult,
      photoUrl: photoUrl,
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

    await addAnnouncement(validatedFields.data);
    revalidatePath('/dashboard');
    return { success: true };
}

export async function removeAnnouncement(id: string) {
    await deleteAnnouncement(id);
    revalidatePath('/dashboard');
}

export async function uploadPayslip(userId: string, fileName: string) {
    // In a real app, the file would be uploaded here, and we'd get a URL.
    // For now, we just record the metadata.
    const mockFileUrl = `/payslips/${userId}/${fileName}`;
    await addPayslip({ userId, fileName: fileName, fileUrl: mockFileUrl });
    revalidatePath('/dashboard');
    return { success: true, message: `Contracheque ${fileName} enviado com sucesso.` };
}

export async function editTimeLog(logId: string, newTimestamp: string) {
    if(!logId || !newTimestamp) return { error: 'Dados inválidos.' };

    const updated = await updateTimeLog(logId, newTimestamp);
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
    if (!id && !profilePhoto && !capturedPhoto) {
        return { error: 'Foto de perfil é obrigatória para novos colaboradores.' };
    }

    try {
        let profilePhotoUrl: string | undefined = undefined;

        if (capturedPhoto) {
            profilePhotoUrl = await saveFile(capturedPhoto);
        } else if (profilePhoto) {
            profilePhotoUrl = await saveFile(profilePhoto);
        }

        const userData: Partial<User> = { ...data };
        if(profilePhotoUrl) {
          userData.profilePhotoUrl = profilePhotoUrl
        }
        
        if (id) {
            await updateUser(id, userData);
        } else {
            // addUser will create the user in Firebase Auth and Firestore
            await addUser(userData as any);
        }
        revalidatePath('/dashboard');
        return { success: true, message: `Colaborador ${id ? 'atualizado' : 'criado'} com sucesso.` };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao salvar o colaborador.';
        return { error: errorMessage };
    }
}

export async function removeCollaborator(userId: string) {
    try {
        await deleteUser(userId);
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
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
    radius: z.coerce.number().min(1, 'Raio deve ser maior que zero.'),
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
            await updateWorkPost(id, data);
        } else {
            await addWorkPost(data);
        }
        revalidatePath('/dashboard');
        return { success: true, message: `Posto de trabalho ${id ? 'atualizado' : 'criado'} com sucesso.` };
    } catch (error) {
        return { error: 'Falha ao salvar o posto de trabalho.' };
    }
}

export async function removeWorkPost(workPostId: string) {
    try {
        await deleteWorkPost(workPostId);
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
            await updateWorkShift(id, data);
        } else {
            await addWorkShift(data);
        }
        revalidatePath('/dashboard');
        return { success: true, message: `Escala ${id ? 'atualizada' : 'criada'} com sucesso.` };
    } catch (error) {
        return { error: 'Falha ao salvar a escala de trabalho.' };
    }
}

export async function removeWorkShift(shiftId: string) {
    try {
        await removeDataWorkShift(shiftId);
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
        const signature = await addSignature(user.id, monthYear);
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
        await updateUserSchedule(userId, schedule);
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
        await updateUser(userId, breakTimes);
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
        await addOccurrence(validatedFields.data);
        revalidatePath('/dashboard');
        return { success: true, message: 'Ocorrência registrada com sucesso.' };
    } catch (error) {
        return { error: 'Ocorreu um erro ao registrar a ocorrência.' };
    }
}

export async function createInitialAdminUser() {
    try {
      const adminUser = {
        name: 'Administrador',
        email: 'admin@bit.com',
        password: 'adminbit123',
        role: 'admin' as const,
        profilePhotoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxtYW4lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NTg4MzA1NjF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      };
      await addUser(adminUser);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
}

    
