import type { User, TimeLog, Announcement, Payslip, WorkPost, WorkShift } from '@/lib/types';
import { PlaceHolderImages } from './placeholder-images';

const anaSilvaProfile = PlaceHolderImages.find(img => img.id === 'user-ana-silva-profile');
const brunoCostaProfile = PlaceHolderImages.find(img => img.id === 'user-bruno-costa-profile');
const carlosSantosProfile = PlaceHolderImages.find(img => img.id === 'user-carlos-santos-profile');
const danielaPereiraProfile = PlaceHolderImages.find(img => img.id === 'user-daniela-pereira-profile');

let users: User[] = [
  {
    id: 'user_ana',
    name: 'Ana Silva',
    email: 'ana.silva@bitsolucoes.com',
    role: 'admin',
    profilePhotoUrl: anaSilvaProfile?.imageUrl ?? '',
  },
  {
    id: 'user_bruno',
    name: 'Bruno Costa',
    email: 'bruno.costa@bitsolucoes.com',
    role: 'supervisor',
    profilePhotoUrl: brunoCostaProfile?.imageUrl ?? '',
    team: ['user_carlos', 'user_daniela'],
  },
  {
    id: 'user_carlos',
    name: 'Carlos Santos',
    email: 'carlos.santos@bitsolucoes.com',
    role: 'collaborator',
    profilePhotoUrl: carlosSantosProfile?.imageUrl ?? '',
  },
  {
    id: 'user_daniela',
    name: 'Daniela Pereira',
    email: 'daniela.pereira@bitsolucoes.com',
    role: 'collaborator',
    profilePhotoUrl: danielaPereiraProfile?.imageUrl ?? '',
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
  },
  {
    id: 'anno2',
    title: 'Atualização do Sistema de Ponto',
    content: 'O sistema de ponto eletrônico foi atualizado com novas funcionalidades. Explore o novo dashboard e reporte qualquer problema ao seu supervisor.',
    createdAt: new Date().toISOString(),
  },
];

let payslips: Payslip[] = [
    {
        id: 'payslip1',
        userId: 'user_carlos',
        fileName: 'holerite_carlos_santos_maio_2024.pdf',
        uploadDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
    }
];

let workPosts: WorkPost[] = [
    { id: 'post1', name: 'Sede Administrativa', address: 'Rua das Flores, 123' },
    { id: 'post2', name: 'Cliente A - Filial Centro', address: 'Av. Principal, 456' },
];

let workShifts: WorkShift[] = [
    { id: 'shift1', name: 'Turno Diurno', startTime: '08:00', endTime: '17:00', days: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']},
    { id: 'shift2', name: 'Turno Noturno', startTime: '22:00', endTime: '06:00', days: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']},
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

// WorkPost and WorkShift data functions
export const getWorkPosts = () => workPosts;
export const addWorkPost = (post: Omit<WorkPost, 'id'>) => {
    const newPost = { ...post, id: `post_${Date.now()}`};
    workPosts.push(newPost);
    return newPost;
}

export const getWorkShifts = () => workShifts;
export const addWorkShift = (shift: Omit<WorkShift, 'id'>) => {
    const newShift = { ...shift, id: `shift_${Date.now()}`};
    workShifts.push(newShift);
    return newShift;
}

// Collaborator management functions
export const addUser = (user: Omit<User, 'id' | 'profilePhotoUrl'>) => {
    const newUser: User = {
        ...user,
        id: `user_${Date.now()}`,
        // For new users, we can assign a default placeholder image
        profilePhotoUrl: 'https://picsum.photos/seed/newuser/200/200',
    };
    users.push(newUser);
    return newUser;
}

export const updateUser = (userId: string, data: Partial<Omit<User, 'id'>>) => {
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        users[userIndex] = { ...users[userIndex], ...data };
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