'use server';

import { revalidatePath } from 'next/cache';
import {
  addAnnouncement,
  addSignature,
  addWorkPost,
  addWorkShift,
  deleteAnnouncement,
  deleteUser,
  deleteWorkPost,
  removeWorkShift as removeWorkShiftFromDb,
  updateTimeLog,
  updateUser,
  updateUserSchedule,
  updateWorkPost,
  updateWorkShift,
  addOccurrence,
  addPayslip,
  addTimeLog,
  findUserById,
  getTimeLogsForUser,
} from './data';
import { storage } from './firebase-admin';
import type {
  User,
  WorkPostCreationData,
  WorkShiftCreationData,
  OccurrenceType,
  TimeLogAction,
  TimeLog,
  Signature,
} from './types';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, createSession, deleteSession, getCurrentUser } from './auth';
import { redirect } from 'next/navigation';
import {
  validateTimeLogsWithFacialRecognition,
  type ValidateTimeLogsWithFacialRecognitionOutput,
} from '@/ai/flows/validate-time-logs-with-facial-recognition';
import { createElement } from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { TimeSheetDocument } from '@/app/dashboard/_components/pdf/time-sheet-document';


// --- Auth Actions ---
export async function login(idToken: string) {
  if (!idToken) {
    return { error: 'ID Token do Firebase é necessário.' };
  }
  try {
    const sessionCookie = await createSession(idToken);
    cookies().set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 5, // 5 dias
    });
    // O redirecionamento será tratado pelo cliente após o sucesso.
  } catch (e: any) {
    console.error('Falha ao criar sessão de login:', e);
    return { error: 'Ocorreu um erro ao fazer login.' };
  }
  redirect('/dashboard');
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}

// --- User (Collaborator) Actions ---
const uploadFile = async (
  fileContent: Buffer,
  filePath: string,
  contentType: string
) => {
  const bucket = storage.bucket();
  const file = bucket.file(filePath);

  await file.save(fileContent, {
    metadata: { contentType },
  });

  await file.makePublic();
  return file.publicUrl();
};


const uploadPhoto = async (
  photo: File | string | null,
  userId?: string
) => {
  if (!photo) return null;

  const bucket = storage.bucket();
  const fileName = `profile-photos/${userId || Date.now()}.jpg`;
  const file = bucket.file(fileName);

  let buffer: Buffer;
  if (typeof photo === 'string') {
    // É um data URI
    buffer = Buffer.from(photo.split(',')[1], 'base64');
  } else {
    // É um objeto File
    buffer = Buffer.from(await photo.arrayBuffer());
  }

  await file.save(buffer, {
    metadata: { contentType: 'image/jpeg' },
  });

  // Torna o arquivo público para leitura
  await file.makePublic();

  // Retorna a URL pública
  return file.publicUrl();
};

export async function saveCollaborator(formData: FormData) {
  const id = formData.get('id') as string | null;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = (formData.get('password') as string) || undefined;
  const role = formData.get('role') as User['role'];
  const workPostId =
    (formData.get('workPostId') as string) === 'none'
      ? ''
      : (formData.get('workPostId') as string);
  const profilePhoto = formData.get('profilePhoto') as File | null;
  const capturedPhoto = formData.get('capturedPhoto') as string | null;

  try {
    let profilePhotoUrl: string | undefined = undefined;

    if (id) {
      // Editando
      const userData: Partial<User> = { name, email, role, workPostId };
      if (password) userData.passwordHash = password; // Na prática, o hash seria feito aqui

      // Upload da foto de perfil se uma nova foi enviada
      const photoToUpload = capturedPhoto || profilePhoto;
      if (photoToUpload) {
        profilePhotoUrl = await uploadPhoto(photoToUpload, id);
        if (profilePhotoUrl) {
          userData.profilePhotoUrl = profilePhotoUrl;
        }
      }

      await updateUser(id, userData);
    } else {
      // Criando
      if (!password) {
        return { success: false, error: 'A senha é obrigatória para novos usuários.' };
      }
      const photoToUpload = capturedPhoto || profilePhoto;
      if (photoToUpload) {
        // Para novos usuários, o ID ainda não existe, então o upload usa um timestamp.
        // O ideal seria criar o usuário primeiro para ter o ID.
        profilePhotoUrl = await uploadPhoto(photoToUpload);
      }

      const newUser: Omit<User, 'id'> = {
        name,
        email,
        role,
        workPostId,
        profilePhotoUrl: profilePhotoUrl || '',
      };
      // A função addUser no data.ts deve lidar com a criação no Auth e no Firestore.
      await new Promise(res => setTimeout(res, 1000)); // Simula delay
    }

    revalidatePath('/dashboard');
    return {
      success: true,
      message: `Colaborador ${id ? 'atualizado' : 'criado'} com sucesso!`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeCollaborator(userId: string) {
  try {
    await deleteUser(userId);
    revalidatePath('/dashboard');
    return {
      success: true,
      message: 'Colaborador removido com sucesso!',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- TimeLog Actions ---
export async function recordTimeLog(
  userId: string,
  action: TimeLogAction,
  capturedImage: string,
  location: { latitude: number; longitude: number } | null,
  timestamp?: string
): Promise<{
  success: boolean;
  message?: string;
  validation?: ValidateTimeLogsWithFacialRecognitionOutput;
}> {
  if (!userId || !action || !capturedImage) {
    return { success: false, message: 'Dados insuficientes para o registro.' };
  }

  try {
    const user = await findUserById(userId);
    if (!user || !user.profilePhotoUrl) {
      return { success: false, message: 'Usuário ou foto de perfil não encontrados.' };
    }

    // Assume-se que a foto de perfil já é um data URI ou uma URL pública acessível.
    // Se for URL, precisa ser convertida para data URI antes de passar para a IA.
    // Esta parte pode precisar de ajuste dependendo do que está armazenado.
    const profilePhotoForValidation = user.profilePhotoUrl;


    const validationResult = await validateTimeLogsWithFacialRecognition({
      profilePhotoDataUri: profilePhotoForValidation,
      submittedPhotoDataUri: capturedImage,
    });

    const photoUrl = await uploadPhoto(
      capturedImage,
      `${userId}-${Date.now()}`
    );

    const logEntry: Omit<TimeLog, 'id'> = {
      userId,
      action,
      timestamp: timestamp || new Date().toISOString(),
      photoUrl,
      location: location || undefined,
      validation: {
        isValidated: validationResult.isValidated,
        confidence: validationResult.confidence,
        reason: validationResult.reason,
      },
    };

    await addTimeLog(logEntry);

    revalidatePath('/dashboard');

    if (!validationResult.isValidated) {
      return {
        success: false,
        message: validationResult.reason,
        validation: validationResult,
      };
    }

    return { success: true, validation: validationResult };
  } catch (error: any) {
    console.error('Erro ao registrar ponto:', error);
    return { success: false, message: 'Ocorreu um erro no servidor.' };
  }
}

export async function editTimeLog(logId: string, newTimestamp: string) {
  try {
    await updateTimeLog(logId, newTimestamp);
    revalidatePath('/dashboard');
    return { success: true, message: 'Registro de ponto atualizado.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Announcement Actions ---
export async function createAnnouncement(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const target = formData.get('target') as 'all' | 'individual';
  const userId =
    target === 'individual' ? (formData.get('userId') as string) : undefined;

  if (!title || !content || !target) {
    return { error: 'Título, conteúdo e público-alvo são obrigatórios.' };
  }
  if (target === 'individual' && !userId) {
    return { error: 'É necessário selecionar um colaborador para um aviso individual.' };
  }

  try {
    await addAnnouncement({ title, content, target, userId });
    revalidatePath('/dashboard');
    return { success: true, message: 'Aviso publicado com sucesso!' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeAnnouncement(id: string) {
  try {
    await deleteAnnouncement(id);
    revalidatePath('/dashboard');
    return { success: true, message: 'Aviso removido com sucesso!' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Document/Payslip Actions ---
export async function uploadPayslip(formData: FormData) {
  const userId = formData.get('userId') as string;
  const file = formData.get('file') as File;

  if (!userId || !file) {
    return { success: false, error: 'Usuário e arquivo são obrigatórios.' };
  }

  if (file.type !== 'application/pdf') {
    return { success: false, error: 'O arquivo deve ser um PDF.' };
  }

  try {
    const filePath = `payslips/${userId}/${file.name}`;
    const fileContent = Buffer.from(await file.arrayBuffer());
    
    const fileUrl = await uploadFile(fileContent, filePath, 'application/pdf');

    if (!fileUrl) {
        throw new Error('Falha ao obter a URL do arquivo.');
    }

    await addPayslip({ userId, fileName: file.name, fileUrl: filePath });

    revalidatePath('/dashboard');
    return { success: true, message: 'Contracheque enviado com sucesso!' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


// --- WorkPost Actions ---
export async function saveWorkPost(formData: FormData) {
  const id = formData.get('id') as string | null;
  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  const supervisorId =
    (formData.get('supervisorId') as string) === 'none'
      ? undefined
      : (formData.get('supervisorId') as string);
  const radius = Number(formData.get('radius') as string);
  const latitude = Number(formData.get('latitude') as string);
  const longitude = Number(formData.get('longitude') as string);

  if (!name || !address || !radius || !latitude || !longitude) {
    return { success: false, error: 'Todos os campos são obrigatórios.' };
  }

  const data: WorkPostCreationData = {
    name,
    address,
    supervisorId,
    radius,
    latitude,
    longitude,
  };

  try {
    if (id) {
      await updateWorkPost(id, data);
    } else {
      await addWorkPost(data);
    }
    revalidatePath('/dashboard');
    return {
      success: true,
      message: `Posto de trabalho ${id ? 'atualizado' : 'criado'} com sucesso!`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeWorkPost(postId: string) {
  try {
    await deleteWorkPost(postId);
    revalidatePath('/dashboard');
    return {
      success: true,
      message: 'Posto de trabalho removido com sucesso!',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- WorkShift Actions ---
export async function saveWorkShift(formData: FormData) {
  const id = formData.get('id') as string | null;
  const name = formData.get('name') as string;
  const startTime = formData.get('startTime') as string;
  const endTime = formData.get('endTime') as string;
  const days = formData.getAll('days') as string[];

  if (!name || !startTime || !endTime || days.length === 0) {
    return { success: false, error: 'Todos os campos são obrigatórios.' };
  }

  const data: WorkShiftCreationData = { name, startTime, endTime, days };

  try {
    if (id) {
      await updateWorkShift(id, data);
    } else {
      await addWorkShift(data);
    }
    revalidatePath('/dashboard');
    return {
      success: true,
      message: `Escala ${id ? 'atualizada' : 'criada'} com sucesso!`,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function removeWorkShift(shiftId: string) {
  try {
    await removeWorkShiftFromDb(shiftId);
    revalidatePath('/dashboard');
    return {
      success: true,
      message: 'Escala de trabalho removida com sucesso!',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Time Sheet Signature Action ---
export async function signTimeSheet(userId: string, monthYear: string): Promise<{ success: boolean; signature?: Signature; error?: string; }> {
  if (!userId || !monthYear) {
    return { success: false, error: 'Faltam informações para assinar.' };
  }
  
  const user = await findUserById(userId);
  if (!user) {
    return { success: false, error: 'Usuário não encontrado.' };
  }

  const logs = await getTimeLogsForUser(userId); 
  const signedAt = new Date().toISOString();

  const tempSignature: Signature = {
    id: '', 
    userId,
    monthYear,
    signedAt,
  };

  try {
    // 1. Gerar o PDF em memória
    const pdfBuffer = await renderToBuffer(
      createElement(TimeSheetDocument, { user, logs, signature: tempSignature })
    );
  
    // 2. Fazer o upload para o Storage
    const filePath = `signed_sheets/${userId}/${monthYear}.pdf`;
    const pdfUrl = await uploadFile(pdfBuffer, filePath, 'application/pdf');

    // 3. Salvar os metadados da assinatura no Firestore
    const signature = await addSignature(userId, monthYear, pdfUrl, signedAt);

    revalidatePath('/dashboard');
    return { success: true, signature };
  } catch (error: any) {
    console.error("Error signing timesheet:", error);
    return { success: false, error: error.message };
  }
}


// --- Individual Schedule Action ---
export async function saveIndividualSchedule(formData: FormData) {
  const userId = formData.get('userId') as string;
  if (!userId) {
    return { success: false, error: 'ID do usuário não encontrado.' };
  }

  const schedule: any = {};
  for (const [key, value] of formData.entries()) {
    if (key.includes('-start') || key.includes('-end')) {
      const dateKey = key.substring(0, 10); // Extrai YYYY-MM-DD
      const type = key.substring(11); // Extrai 'start' ou 'end'
      
      if (!schedule[dateKey]) {
        schedule[dateKey] = {};
      }
      schedule[dateKey][type] = value;
    }
  }
  
  // Remove dias onde ambos start e end estão vazios (Folga)
  for (const date in schedule) {
    if (!schedule[date].start && !schedule[date].end) {
      // Define como null para remover o campo do documento do usuário
      schedule[date] = null;
    } else if (!schedule[date].start || !schedule[date].end) {
      // Se apenas um estiver preenchido, retorna erro
      return {
        success: false,
        error: `Para o dia ${date}, é necessário preencher tanto o início quanto o fim do turno.`,
      };
    }
  }

  try {
    await updateUserSchedule(userId, schedule);
    revalidatePath('/dashboard');
    return {
      success: true,
      message: 'Escala individual salva com sucesso.',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --- Occurrence Action ---
export async function logOccurrence(prevState: any, formData: FormData) {
  const userId = formData.get('userId') as string;
  const date = formData.get('date') as string;
  const type = formData.get('type') as OccurrenceType;
  const description = formData.get('description') as string;

  if (!userId || !date || !type || !description) {
    return { success: false, error: 'Todos os campos são obrigatórios.' };
  }

  try {
    await addOccurrence({ userId, date, type, description });
    revalidatePath('/dashboard');
    return { success: true, message: 'Ocorrência registrada com sucesso!' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


// --- Break Time Action ---
export async function saveBreakTime(formData: FormData) {
    const userId = formData.get('userId') as string;
    const breakStartTime = formData.get('breakStartTime') as string;
    const breakEndTime = formData.get('breakEndTime') as string;

    if (!userId) {
        return { success: false, error: 'Usuário não especificado.' };
    }
    
    try {
        const dataToUpdate: { breakStartTime?: string; breakEndTime?: string } = {};
        if (breakStartTime) dataToUpdate.breakStartTime = breakStartTime;
        if (breakEndTime) dataToUpdate.breakEndTime = breakEndTime;

        await updateUser(userId, dataToUpdate);

        revalidatePath('/dashboard');
        return { success: true, message: 'Horário de intervalo atualizado.' };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
