
import { db as clientDb, storage as clientStorage, auth as clientAuth } from './firebase';
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
    setDoc
} from 'firebase/firestore';
import { 
    ref as storageRef, 
    uploadString, 
    getDownloadURL,
    uploadBytes,
} from 'firebase/storage';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type { User, TimeLog, Announcement, Payslip, WorkPost, WorkShift, Signature, WorkPostCreationData, WorkPostUpdateData, WorkShiftCreationData, WorkShiftUpdateData, IndividualSchedule, Occurrence } from '@/lib/types';
import { auth as adminAuth, db as adminDb, storage as adminStorage } from './firebase-admin';
import admin from 'firebase-admin';

// Helper to convert Firestore Timestamps from Admin SDK
const fromAdminFirestore = <T extends { id: string }>(snapshot: admin.firestore.DocumentSnapshot): T => {
    const data = snapshot.data()!;
    
    // Convert all Timestamp objects to ISO strings
    for (const key in data) {
        if (data[key] instanceof admin.firestore.Timestamp) {
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
    if (!adminDb) return null;
    const q = adminDb.collection('users').where('email', '==', email);
    const querySnapshot = await q.get();
    if (querySnapshot.empty) {
        return null;
    }
    return fromAdminFirestore<User>(querySnapshot.docs[0]);
};

export const findUserById = async (id: string): Promise<User | null> => {
    if (!adminDb) return null;
    const docRef = adminDb.collection('users').doc(id);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
        return fromAdminFirestore<User>(docSnap);
    }
    return null;
};

export const getUsers = async (): Promise<User[]> => {
    if (!adminDb) return [];
    const q = adminDb.collection('users').orderBy('name');
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => fromAdminFirestore<User>(doc));
};

type UserCreationData = Omit<User, 'id' | 'passwordHash'> & {
    password?: string;
}

export const addUser = async (data: UserCreationData) => {
    if (!adminAuth || !adminDb) throw new Error('Firebase Admin SDK not initialized');
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
    await adminDb.collection('users').doc(userRecord.uid).set(userData);
};

type UserUpdateData = Partial<Omit<User, 'id'>> & { password?: string; }
export const updateUser = async (userId: string, data: UserUpdateData) => {
    if (!adminAuth || !adminDb) throw new Error('Firebase SDKs not initialized');
    
    const { password, ...userData } = data;
    
    // Update Firestore
    const userDocRef = adminDb.collection('users').doc(userId);
    await userDocRef.update(userData);
    
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
    if (!adminAuth || !adminDb) throw new Error('Firebase SDKs not initialized');
    // Delete from Auth
    await adminAuth.deleteUser(userId);
    // Delete from Firestore
    await adminDb.collection('users').doc(userId).delete();
};


// --- TimeLog Functions ---

export const getTimeLogsForUser = async (userId: string): Promise<TimeLog[]> => {
    if (!adminDb) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const q = adminDb.collection('timeLogs')
        .where('userId', '==', userId)
        .where('timestamp', '>=', today.toISOString())
        .where('timestamp', '<', tomorrow.toISOString())
        .orderBy('timestamp', 'desc');
        
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => fromAdminFirestore<TimeLog>(doc));
};

export const getAllTimeLogs = async (): Promise<TimeLog[]> => {
    if (!adminDb) return [];
    const q = adminDb.collection('timeLogs').orderBy('timestamp', 'desc');
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => fromAdminFirestore<TimeLog>(doc));
};

export const addTimeLog = async (log: Omit<TimeLog, 'id'>) => {
    if (!adminDb) throw new Error('Firestore not initialized');
    await adminDb.collection('timeLogs').add(log);
};

export const updateTimeLog = async (logId: string, newTimestamp: string) => {
    if (!adminDb) throw new Error('Firestore not initialized');
    const logDocRef = adminDb.collection('timeLogs').doc(logId);
    await logDocRef.update({
        timestamp: newTimestamp,
        'validation.reason': 'Registro ajustado manualmente pelo supervisor.',
        'validation.confidence': 1.0,
        'validation.isValidated': true,
    });
    return true;
};

// --- Announcement Functions ---

export const getAnnouncements = async (): Promise<Announcement[]> => {
    if (!adminDb) return [];
    const q = adminDb.collection('announcements').orderBy('createdAt', 'desc');
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => fromAdminFirestore<Announcement>(doc));
};

export const addAnnouncement = async (announcement: Omit<Announcement, 'id' | 'createdAt'>) => {
    if (!adminDb) throw new Error('Firestore not initialized');
    await adminDb.collection('announcements').add({
        ...announcement,
        createdAt: new Date().toISOString()
    });
};

export const deleteAnnouncement = async (id: string) => {
    if (!adminDb) throw new Error('Firestore not initialized');
    await adminDb.collection('announcements').doc(id).delete();
};


// --- Payslip Functions ---

export const getPayslipsForUser = async (userId: string): Promise<Payslip[]> => {
    if (!adminDb) return [];
    const q = adminDb.collection('payslips').where('userId', '==', userId).orderBy('uploadDate', 'desc');
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => fromAdminFirestore<Payslip>(doc));
};

export const addPayslip = async (payslip: Omit<Payslip, 'id' | 'uploadDate'>) => {
    if (!adminDb) throw new Error('Firestore not initialized');
    await adminDb.collection('payslips').add({
        ...payslip,
        uploadDate: new Date().toISOString()
    });
};


// --- WorkPost Functions ---
export const getWorkPosts = async (): Promise<WorkPost[]> => {
    if (!adminDb) return [];
    const q = adminDb.collection('workPosts').orderBy('name');
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => fromAdminFirestore<WorkPost>(doc));
};

export const addWorkPost = async (post: WorkPostCreationData) => {
    if (!adminDb) throw new Error('Firestore not initialized');
    await adminDb.collection('workPosts').add(post);
};

export const updateWorkPost = async (id: string, data: WorkPostUpdateData) => {
    if (!adminDb) throw new Error('Firestore not initialized');
    const postDocRef = adminDb.collection('workPosts').doc(id);
    await postDocRef.update(data);
};

export const deleteWorkPost = async (id: string) => {
    if (!adminDb) throw new Error('Firestore not initialized');
    await adminDb.collection('workPosts').doc(id).delete();
};

// --- WorkShift Functions ---
export const getWorkShifts = async (): Promise<WorkShift[]> => {
    if (!adminDb) return [];
    const q = adminDb.collection('workShifts').orderBy('name');
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => fromAdminFirestore<WorkShift>(doc));
};

export const addWorkShift = async (shift: WorkShiftCreationData) => {
    if (!adminDb) throw new Error('Firestore not initialized');
    await adminDb.collection('workShifts').add(shift);
};

export const updateWorkShift = async (id: string, data: WorkShiftUpdateData) => {
    if (!adminDb) throw new Error('Firestore not initialized');
    const shiftDocRef = adminDb.collection('workShifts').doc(id);
    await shiftDocRef.update(data);
};

export const removeWorkShift = async (id: string) => {
    if (!adminDb) throw new Error('Firestore not initialized');
    await adminDb.collection('workShifts').doc(id).delete();
};

// --- File Storage ---
export async function saveFile(fileOrDataUri: File | string, customPath?: string): Promise<string> {
    if (!adminStorage) throw new Error('Firebase Admin Storage not initialized');

    const bucket = adminStorage.bucket();
    let fileBuffer: Buffer;
    let fileType: string;
    let fileName: string;

    if (typeof fileOrDataUri === 'string') {
        if (customPath) {
            fileName = customPath;
        } else {
            fileName = `uploads/${Date.now()}_captured.jpg`;
        }
        const parts = fileOrDataUri.match(/^data:(.+);base64,(.+)$/);
        if (!parts) throw new Error("Invalid Data URI");
        fileType = parts[1];
        fileBuffer = Buffer.from(parts[2], 'base64');
    } else {
        if (customPath) {
            fileName = customPath;
        } else {
            fileName = `uploads/${Date.now()}_${fileOrDataUri.name}`;
        }
        const arrayBuffer = await fileOrDataUri.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
        fileType = fileOrDataUri.type;
    }

    const file = bucket.file(fileName);

    await file.save(fileBuffer, {
        metadata: {
            contentType: fileType,
        },
    });
    
    // Return the public URL
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491', // Far future expiration date
    });
    return url;
}

// --- Signature Functions ---
export const getSignatureForUser = async (userId: string, monthYear: string): Promise<Signature | null> => {
    if (!adminDb) return null;
    const q = adminDb.collection('signatures').where('userId', '==', userId).where('monthYear', '==', monthYear);
    const querySnapshot = await q.get();
    if (querySnapshot.empty) {
        return null;
    }
    return fromAdminFirestore<Signature>(querySnapshot.docs[0]);
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
    if (!adminDb) throw new Error('Firestore not initialized');
    const existing = await getSignatureForUser(userId, monthYear);
    if (existing) {
        throw new Error('Ponto já assinado para este mês.');
    }
    
    const newSignature = {
        userId,
        monthYear,
        signedAt: new Date().toISOString(),
    };
    
    const docRef = await adminDb.collection('signatures').add(newSignature);
    return { id: docRef.id, ...newSignature };
};

// --- Individual Schedule Functions ---
export const updateUserSchedule = async (userId: string, schedule: IndividualSchedule) => {
    if (!adminDb) throw new Error('Firestore not initialized');
    const userDocRef = adminDb.collection('users').doc(userId);
    await userDocRef.update({ schedule });
};

// --- Occurrence Functions ---
export const getOccurrences = async (): Promise<Occurrence[]> => {
    if (!adminDb) return [];
    const q = adminDb.collection('occurrences').orderBy('createdAt', 'desc');
    const querySnapshot = await q.get();
    return querySnapshot.docs.map(doc => fromAdminFirestore<Occurrence>(doc));
};

export const addOccurrence = async (occurrence: Omit<Occurrence, 'id' | 'createdAt'>): Promise<Occurrence> => {
    if (!adminDb) throw new Error('Firestore not initialized');
    const newOccurrence = {
        ...occurrence,
        createdAt: new Date().toISOString(),
    };
    const docRef = await adminDb.collection('occurrences').add(newOccurrence);
    return { id: docRef.id, ...newOccurrence };
};



    