export type Role = 'collaborator' | 'supervisor' | 'admin';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  profilePhotoUrl: string;
  profilePhotoDataUri?: string;
  passwordHash: string;
  team?: string[]; // IDs of users in their team, for supervisors
  workPostId?: string;
};

export type TimeLogAction = 'clock_in' | 'break_start' | 'break_end' | 'clock_out';

export type TimeLog = {
  id: string;
  userId: string;
  action: TimeLogAction;
  timestamp: string;
  photoUrl?: string;
  validation?: {
    isValidated: boolean;
    confidence: number;
    reason: string;
  };
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export type Payslip = {
  id: string;
  userId: string;
  fileName: string;
  uploadDate: string;
};

// Add a generic type for a WorkPost
export type WorkPost = {
  id: string;
  name: string;
  address: string;
  supervisorId?: string;
};

// Add a generic type for a WorkShift
export type WorkShift = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
};

export type Signature = {
    id: string;
    userId: string;
    monthYear: string; // e.g., "2024-07"
    signedAt: string;
}
    