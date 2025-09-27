import type { User, TimeLog, Announcement, Payslip, WorkPost, WorkShift, Signature, WorkPostCreationData, WorkPostUpdateData, WorkShiftCreationData, WorkShiftUpdateData, IndividualSchedule, Occurrence } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';
import { format, startOfWeek, addDays } from 'date-fns';


const anaSilvaProfile = PlaceHolderImages.find(img => img.id === 'user-ana-silva-profile');
const brunoCostaProfile = PlaceHolderImages.find(img => img.id === 'user-bruno-costa-profile');
const carlosSantosProfile = PlaceHolderImages.find(img => img.id === 'user-carlos-santos-profile');
const danielaPereiraProfile = PlaceHolderImages.find(img => img.id === 'user-daniela-pereira-profile');

const getMockSchedule = () => {
    const schedule: IndividualSchedule = {};
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday

    for(let i=0; i<5; i++) { // Monday to Friday
        const day = addDays(start, i);
        const dateKey = format(day, 'yyyy-MM-dd');
        schedule[dateKey] = { start: '08:00', end: '17:00'};
    }
    return schedule;
}


let users: User[] = [
  {
    id: 'user_ana',
    name: 'Ana Silva',
    email: 'ana.silva@bitsolucoes.com',
    role: 'admin',
    profilePhotoUrl: anaSilvaProfile?.imageUrl ?? '',
    passwordHash: 'hashed_password',
  },
  {
    id: 'user_bruno',
    name: 'Bruno Costa',
    email: 'bruno.costa@bitsolucoes.com',
    role: 'supervisor',
    profilePhotoUrl: brunoCostaProfile?.imageUrl ?? '',
    team: ['user_carlos', 'user_daniela'],
    passwordHash: 'hashed_password',
  },
  {
    id: 'user_carlos',
    name: 'Carlos Santos',
    email: 'carlos.santos@bitsolucoes.com',
    role: 'collaborator',
    profilePhotoUrl: carlosSantosProfile?.imageUrl ?? '',
    workPostId: 'post1',
    passwordHash: 'hashed_password',
    schedule: getMockSchedule(),
    breakStartTime: '12:00',
    breakEndTime: '13:00',
  },
  {
    id: 'user_daniela',
    name: 'Daniela Pereira',
    email: 'daniela.pereira@bitsolucoes.com',
    role: 'collaborator',
    profilePhotoUrl: danielaPereiraProfile?.imageUrl ?? '',
    workPostId: 'post2',
    passwordHash: 'hashed_password',
  },
];

let timeLogs: TimeLog[] = [
    {
        id: 'log1',
        userId: 'user_carlos',
        action: 'clock_in',
        timestamp: new Date(new Date().setHours(9, 1, 12)).toISOString(),
        photoUrl: 'https://picsum.photos/seed/c1/200/200',
        validation: { isValidated: true, confidence: 0.98, reason: 'High similarity score.' },
    },
    {
        id: 'log2',
        userId: 'user_carlos',
        action: 'break_start',
        timestamp: new Date(new Date().setHours(12, 30, 5)).toISOString(),
        photoUrl: 'https://picsum.photos/seed/c2/200/200',
        validation: { isValidated: true, confidence: 0.97, reason: 'High similarity score.' },
    }
];

let announcements: Announcement[] = [
  {
    id: 'anno1',
    title: 'Feriado de Corpus Christi',
    content: 'Informamos que na próxima quinta-feira, não haverá expediente devido ao feriado nacional de Corpus Christi. As atividades retornam normalmente na sexta-feira.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    target: 'all',
  },
  {
    id: 'anno2',
    title: 'Atualização do Sistema de Ponto',
    content: 'O sistema de ponto eletrônico foi atualizado com novas funcionalidades. Explore o novo dashboard e reporte qualquer problema ao seu supervisor.',
    createdAt: new Date().toISOString(),
    target: 'all',
  },
];

let payslips: Payslip[] = [
    {
        id: 'payslip1',
        userId: 'user_carlos',
        fileName: 'contracheque_carlos_santos_maio_2024.pdf',
        uploadDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
    }
];

let workPosts: WorkPost[] = [
    { id: 'post1', name: 'Sede Administrativa', address: 'Rua das Flores, 123', supervisorId: 'user_bruno' },
    { id: 'post2', name: 'Cliente A - Filial Centro', address: 'Av. Principal, 456', supervisorId: 'user_bruno' },
];

let workShifts: WorkShift[] = [
    { id: 'shift1', name: 'Turno Diurno', startTime: '08:00', endTime: '17:00', days: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']},
    { id: 'shift2', name: 'Turno Noturno', startTime: '22:00', endTime: '06:00', days: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']},
];

let signatures: Signature[] = [];

let occurrences: Occurrence[] = [
    {
        id: `occ_${Date.now()}`,
        userId: 'user_daniela',
        date: format(addDays(new Date(), -1), 'yyyy-MM-dd'),
        type: 'medical_leave',
        description: 'Consulta médica de rotina.',
        createdAt: new Date().toISOString(),
    }
];


// Data access functions
export const findUserByEmail = (email: string) => users.find(u => u.email === email);
export const findUserById = (id: string) => users.find(u => u.id === id);
export const getUsers = () => users;
export const getAnnouncements = () => announcements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
export const getTimeLogsForUser = (userId: string) => timeLogs.filter(t => t.userId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
export const getAllTimeLogs = () => timeLogs;

export const addTimeLog = (log: Omit<TimeLog, 'id'>) => {
    const newLog = { ...log, id: `log_${Date.now()}`};
    timeLogs.push(newLog);
    return newLog;
}

export const addAnnouncement = (announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
    const newAnnouncement: Announcement = {
        ...announcement,
        id: `anno_${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    announcements.push(newAnnouncement);
    return newAnnouncement;
};

export const deleteAnnouncement = (id: string) => {
    announcements = announcements.filter(a => a.id !== id);
};

export const addPayslip = (payslip: Omit<Payslip, 'id' | 'uploadDate'>) => {
    const newPayslip: Payslip = {
        ...payslip,
        id: `payslip_${Date.now()}`,
        uploadDate: new Date().toISOString(),
    };
    payslips.push(newPayslip);
    return newPayslip;
}
export const getPayslipsForUser = (userId: string) => payslips.filter(p => p.userId === userId);

export const updateTimeLog = (logId: string, newTimestamp: string) => {
    const logIndex = timeLogs.findIndex(l => l.id === logId);
    if (logIndex > -1) {
        timeLogs[logIndex].timestamp = newTimestamp;
        timeLogs[logIndex].validation = {
            isValidated: true,
            confidence: 1.0,
            reason: 'Registro ajustado manualmente pelo supervisor.'
        };
        return timeLogs[logIndex];
    }
    return null;
};

// WorkPost data functions
export const getWorkPosts = () => workPosts.sort((a, b) => a.name.localeCompare(b.name));

export const addWorkPost = (post: WorkPostCreationData) => {
    const newPost: WorkPost = { ...post, id: `post_${Date.now()}`};
    workPosts.push(newPost);
    return newPost;
}

export const updateWorkPost = (id: string, data: WorkPostUpdateData) => {
    const postIndex = workPosts.findIndex(p => p.id === id);
    if (postIndex > -1) {
        workPosts[postIndex] = { ...workPosts[postIndex], ...data };
        return workPosts[postIndex];
    }
    return null;
}

export const deleteWorkPost = (id: string) => {
    workPosts = workPosts.filter(p => p.id !== id);
}


export const getWorkShifts = () => workShifts.sort((a, b) => a.name.localeCompare(b.name));

export const addWorkShift = (shift: WorkShiftCreationData) => {
    const newShift: WorkShift = { ...shift, id: `shift_${Date.now()}`};
    workShifts.push(newShift);
    return newShift;
}

export const updateWorkShift = (id: string, data: WorkShiftUpdateData) => {
    const shiftIndex = workShifts.findIndex(s => s.id === id);
    if (shiftIndex > -1) {
        workShifts[shiftIndex] = { ...workShifts[shiftIndex], ...data };
        return workShifts[shiftIndex];
    }
    return null;
}

export const removeWorkShift = (id: string) => {
    workShifts = workShifts.filter(s => s.id !== id);
}

// This is a mock file storage. In a real app, use a cloud storage service.
const fileStorage = new Map<string, ArrayBuffer>();

export async function saveFile(fileOrDataUri: File | string): Promise<string> {
    let buffer: Buffer;
    let fileType: string;
    let fileName: string;

    if (typeof fileOrDataUri === 'string') {
        // Handle Data URI
        const parts = fileOrDataUri.match(/^data:(.+);base64,(.+)$/);
        if (!parts) throw new Error("Invalid Data URI");
        fileType = parts[1];
        buffer = Buffer.from(parts[2], 'base64');
        fileName = `/uploads/${Date.now()}_captured.jpg`;
    } else {
        // Handle File object
        const file = fileOrDataUri;
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        fileType = file.type;
        fileName = `/uploads/${Date.now()}_${file.name}`;
    }

    fileStorage.set(fileName, buffer);
    
    // In this mock, we'll return a data URI for client-side display.
    // In a real app, you would return the public URL from your storage provider.
    return `data:${fileType};base64,${buffer.toString('base64')}`;
}


// Collaborator management functions
type UserCreationData = Omit<User, 'id' | 'profilePhotoUrl' | 'passwordHash'> & {
    password?: string;
    profilePhotoUrl?: string;
}

export const addUser = (data: UserCreationData) => {
    // In a real app, you would hash the password here.
    const passwordHash = data.password ? `hashed_${data.password}`: 'hashed_password';

    const newUser: User = {
        ...data,
        id: `user_${Date.now()}`,
        profilePhotoUrl: data.profilePhotoUrl || 'https://picsum.photos/seed/newuser/200/200',
        passwordHash: passwordHash,
    };
    users.push(newUser);
    return newUser;
}

type UserUpdateData = Partial<Omit<User, 'id'>> & { profilePhotoUrl?: string; password?: string; }
export const updateUser = (userId: string, data: UserUpdateData) => {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        const existingUser = users[userIndex];
        let passwordHash = existingUser.passwordHash;
        if (data.password) {
            // In a real app, you would hash the new password.
            passwordHash = `hashed_${data.password}`;
        }

        const { password, ...restOfData } = data;

        users[userIndex] = { 
            ...existingUser, 
            ...restOfData,
            passwordHash,
            // Only update photo if a new one is provided
            profilePhotoUrl: data.profilePhotoUrl || existingUser.profilePhotoUrl,
        };

        return users[userIndex];
    }
    return null;
}

export const deleteUser = (userId: string) => {
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);
    // Also remove user from any supervisor's team
    users.forEach(u => {
        if (u.role === 'supervisor' && u.team) {
            u.team = u.team.filter(id => id !== userId);
        }
    });
    return users.length < initialLength;
}

// Signature functions
export const getSignatureForUser = (userId: string, monthYear: string): Signature | null => {
    return signatures.find(s => s.userId === userId && s.monthYear === monthYear) || null;
}

export const getAllSignatures = (monthYear: string): Record<string, Signature | null> => {
    const status: Record<string, Signature | null> = {};
    users.filter(u => u.role === 'collaborator' || u.role === 'supervisor').forEach(user => {
        status[user.id] = getSignatureForUser(user.id, monthYear);
    });
    return status;
}

export const addSignature = (userId: string, monthYear: string): Signature => {
    if (getSignatureForUser(userId, monthYear)) {
        throw new Error('Ponto já assinado para este mês.');
    }
    const newSignature: Signature = {
        id: `sig_${Date.now()}`,
        userId,
        monthYear,
        signedAt: new Date().toISOString(),
    };
    signatures.push(newSignature);
    return newSignature;
}

// Individual Schedule functions
export const updateUserSchedule = (userId: string, schedule: IndividualSchedule) => {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error('Usuário não encontrado.');
    }
    // Merges the new schedule with the existing one
    users[userIndex].schedule = { ...users[userIndex].schedule, ...schedule };
    return users[userIndex];
};

// Occurrence functions
export const getOccurrences = () => occurrences.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const addOccurrence = (occurrence: Omit<Occurrence, 'id' | 'createdAt'>): Occurrence => {
    const newOccurrence: Occurrence = {
        ...occurrence,
        id: `occ_${Date.now()}`,
        createdAt: new Date().toISOString(),
    };
    occurrences.push(newOccurrence);
    return newOccurrence;
};
