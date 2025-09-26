export type Role = 'collaborator' | 'supervisor' | 'admin';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  profilePhotoUrl: string;
  profilePhotoDataUri?: string;
  team?: string[]; // IDs of users in their team, for supervisors
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
