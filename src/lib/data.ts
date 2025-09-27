import { db, storage, auth as clientAuth } from './firebase';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    Timestamp,
    DocumentData,
    QueryDocumentSnapshot,
} from 'firebase/firestore';
import { 
    ref as storageRef, 
    uploadString, 
    getDownloadURL,
    uploadBytes,
} from 'firebase/storage';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type { User, TimeLog, Announcement, Payslip, WorkPost, WorkShift, Signature, WorkPostCreationData, WorkPostUpdateData, WorkShiftCreationData, WorkShiftUpdateData, IndividualSchedule, Occurrence } from '@/lib/types';
import { auth as adminAuth } from './firebase-admin';

// Helper to convert Firestore Timestamps
const fromFirestore = <T>(snapshot: QueryDocumentSnapshot): T => {
    const data = snapshot.data({ serverTimestamps: 'estimate' }) as DocumentData;
    
    // Convert all Timestamp objects to ISO strings
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            data[key] = data[key].toDate().toISOString();
        }
    }
    
    return {
        id: snapshot.id,
        ...data
    } as T;
};


// --- User Functions ---

export const findUserByEmail = async (email: string): Promise<User | null> => {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    return fromFirestore<User>(querySnapshot.docs[0]);
};

export const findUserById = async (id: string): Promise<User | null> => {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return fromFirestore<User>(docSnap as QueryDocumentSnapshot);
    }
    return null;
};

export const getUsers = async (): Promise<User[]> => {
    const q = query(collection(db, 'users'), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => fromFirestore<User>(doc));
};

type UserCreationData = Omit<User, 'id' | 'passwordHash'> & {
    password?: string;
}

export const addUser = async (data: UserCreationData) => {
    if (!data.password || !data.email) {
        throw new Error("Email e senha são obrigatórios para criar um novo usuário.");
    }

    // Use Admin SDK to create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.name,
        photoURL: data.profilePhotoUrl,
    });

    // Remove password from data before saving to Firestore
    const { password, ...userData } = data;
    
    // Save user data to Firestore with the same UID
    await addDoc(collection(db, 'users'), {
        ...userData,
        id: userRecord.uid
    });
};

type UserUpdateData = Partial<Omit<User, 'id'>> & { password?: string; }
export const updateUser = async (userId: string, data: UserUpdateData) => {
    const { password, ...userData } = data;
    
    // Update Firestore
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, userData);
    
    // Update Firebase Auth if needed
    const authUpdatePayload: any = {};
    if (userData.email) authUpdatePayload.email = userData.email;
    if (userData.name) authUpdatePayload.displayName = userData.name;
    if (userData.profilePhotoUrl) authUpdatePayload.photoURL = userData.profilePhotoUrl;
    if (password) authUpdatePayload.password = password;
    
    if (Object.keys(authUpdatePayload).length > 0) {
        await adminAuth.updateUser(userId, authUpdatePayload);
    }
};

export const deleteUser = async (userId: string) => {
    // Delete from Auth
    await adminAuth.deleteUser(userId);
    // Delete from Firestore
    await deleteDoc(doc(db, 'users', userId));
};


// --- TimeLog Functions ---

export const getTimeLogsForUser = async (userId: string): Promise<TimeLog[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const q = query(
        collection(db, 'timeLogs'), 
        where('userId', '==', userId),
        where('timestamp', '>=', today.toISOString()),
        where('timestamp', '<', tomorrow.toISOString()),
        orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => fromFirestore<TimeLog>(doc));
};

export const getAllTimeLogs = async (): Promise<TimeLog[]> => {
    const q = query(collection(db, 'timeLogs'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => fromFirestore<TimeLog>(doc));
};

export const addTimeLog = async (log: Omit<TimeLog, 'id'>) => {
    await addDoc(collection(db, 'timeLogs'), log);
};

export const updateTimeLog = async (logId: string, newTimestamp: string) => {
    const logDocRef = doc(db, 'timeLogs', logId);
    await updateDoc(logDocRef, {
        timestamp: newTimestamp,
        'validation.reason': 'Registro ajustado manualmente pelo supervisor.',
        'validation.confidence': 1.0,
        'validation.isValidated': true,
    });
    return true;
};

// --- Announcement Functions ---

export const getAnnouncements = async (): Promise<Announcement[]> => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => fromFirestore<Announcement>(doc));
};

export const addAnnouncement = async (announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'announcements'), {
        ...announcement,
        createdAt: new Date().toISOString()
    });
};

export const deleteAnnouncement = async (id: string) => {
    await deleteDoc(doc(db, 'announcements', id));
};


// --- Payslip Functions ---

export const getPayslipsForUser = async (userId: string): Promise<Payslip[]> => {
    const q = query(collection(db, 'payslips'), where('userId', '==', userId), orderBy('uploadDate', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => fromFirestore<Payslip>(doc));
};

export const addPayslip = async (payslip: Omit<Payslip, 'id' | 'uploadDate'>) => {
    await addDoc(collection(db, 'payslips'), {
        ...payslip,
        uploadDate: new Date().toISOString()
    });
};


// --- WorkPost Functions ---
export const getWorkPosts = async (): Promise<WorkPost[]> => {
    const q = query(collection(db, 'workPosts'), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => fromFirestore<WorkPost>(doc));
};

export const addWorkPost = async (post: WorkPostCreationData) => {
    await addDoc(collection(db, 'workPosts'), post);
};

export const updateWorkPost = async (id: string, data: WorkPostUpdateData) => {
    const postDocRef = doc(db, 'workPosts', id);
    await updateDoc(postDocRef, data);
};

export const deleteWorkPost = async (id: string) => {
    await deleteDoc(doc(db, 'workPosts', id));
};

// --- WorkShift Functions ---
export const getWorkShifts = async (): Promise<WorkShift[]> => {
    const q = query(collection(db, 'workShifts'), orderBy('name'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => fromFirestore<WorkShift>(doc));
};

export const addWorkShift = async (shift: WorkShiftCreationData) => {
    await addDoc(collection(db, 'workShifts'), shift);
};

export const updateWorkShift = async (id: string, data: WorkShiftUpdateData) => {
    const shiftDocRef = doc(db, 'workShifts', id);
    await updateDoc(shiftDocRef, data);
};

export const removeWorkShift = async (id: string) => {
    await deleteDoc(doc(db, 'workShifts', id));
};

// --- File Storage ---
export async function saveFile(fileOrDataUri: File | string): Promise<string> {
    let fileBuffer: Buffer;
    let fileType: string;
    let fileName: string;

    if (typeof fileOrDataUri === 'string') {
        const parts = fileOrDataUri.match(/^data:(.+);base64,(.+)$/);
        if (!parts) throw new Error("Invalid Data URI");
        fileType = parts[1];
        fileBuffer = Buffer.from(parts[2], 'base64');
        fileName = `uploads/${Date.now()}_captured.jpg`;
    } else {
        const arrayBuffer = await fileOrDataUri.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
        fileType = fileOrDataUri.type;
        fileName = `uploads/${Date.now()}_${fileOrDataUri.name}`;
    }

    const fileStorageRef = storageRef(storage, fileName);
    
    await uploadBytes(fileStorageRef, fileBuffer, { contentType: fileType });
    const downloadUrl = await getDownloadURL(fileStorageRef);
    
    return downloadUrl;
}

// --- Signature Functions ---
export const getSignatureForUser = async (userId: string, monthYear: string): Promise<Signature | null> => {
    const q = query(collection(db, 'signatures'), where('userId', '==', userId), where('monthYear', '==', monthYear));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    return fromFirestore<Signature>(querySnapshot.docs[0]);
};

export const getAllSignatures = async (monthYear: string): Promise<Record<string, Signature | null>> => {
    const allUsers = await getUsers();
    const status: Record<string, Signature | null> = {};
    const collaborators = allUsers.filter(u => u.role === 'collaborator' || u.role === 'supervisor');
    
    for(const user of collaborators) {
        status[user.id] = await getSignatureForUser(user.id, monthYear);
    }
    return status;
};

export const addSignature = async (userId: string, monthYear: string): Promise<Signature> => {
    const existing = await getSignatureForUser(userId, monthYear);
    if (existing) {
        throw new Error('Ponto já assinado para este mês.');
    }
    
    const newSignature = {
        userId,
        monthYear,
        signedAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(db, 'signatures'), newSignature);
    return { id: docRef.id, ...newSignature };
};

// --- Individual Schedule Functions ---
export const updateUserSchedule = async (userId: string, schedule: IndividualSchedule) => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, { schedule });
};

// --- Occurrence Functions ---
export const getOccurrences = async (): Promise<Occurrence[]> => {
    const q = query(collection(db, 'occurrences'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => fromFirestore<Occurrence>(doc));
};

export const addOccurrence = async (occurrence: Omit<Occurrence, 'id' | 'createdAt'>): Promise<Occurrence> => {
    const newOccurrence = {
        ...occurrence,
        createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, 'occurrences'), newOccurrence);
    return { id: docRef.id, ...newOccurrence };
};
