export type Role = 'collaborator' | 'supervisor' | 'admin';

export type DaySchedule = {
  start?: string;
  end?: string;
}

// Changed from weekday keys to date keys (YYYY-MM-DD) for monthly schedule
export type IndividualSchedule = {
  [date: string]: DaySchedule | undefined;
}

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
  schedule?: IndividualSchedule;
  breakStartTime?: string;
  breakEndTime?: string;
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
    
export type DailyTimeLog = {
    date: string;
    logs: {
        clock_in?: string;
        break_start?: string;
        break_end?: string;
        clock_out?: string;
    },
    totalHours: string;
}

export type OccurrenceType = 'justified_absence' | 'medical_leave' | 'vacation' | 'unjustified_absence';

export type Occurrence = {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  type: OccurrenceType;
  description: string;
  createdAt: string;
};


export type WorkPostCreationData = Omit<WorkPost, 'id'>;
export type WorkPostUpdateData = Partial<WorkPostCreationData>;

export type WorkShiftCreationData = Omit<WorkShift, 'id'>;
export type WorkShiftUpdateData = Partial<WorkShiftCreationData>;
