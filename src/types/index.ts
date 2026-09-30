export type UserRole = 'admin' | 'karyawan';

export interface User {
  id: string;
  nik: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  avatarUrl?: string;
}

export type ExamType = 'pretest' | 'posttest';

export type MediaType = 'none' | 'image' | 'video' | 'audio';

export interface Question {
  id: string;
  trainingId: string;
  examType: ExamType;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  mediaType?: MediaType;
  mediaUrl?: string;
  mediaCaption?: string;
}

export interface CertificateSettings {
  companyName: string;
  companyLogoUrl: string;
  locationCreated: string;
  trainerName: string;
  trainerTitle: string;
  signer1Name: string;
  signer1Title: string;
  signer2Name: string;
  signer2Title: string;
  assignedEmails?: string[];
}

export interface TrainingSession {
  id: string;
  title: string;
  category: string;
  description: string;
  department: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  passingGrade: number; // default 70
  isPosttestUnlocked: boolean;
  status: 'active' | 'completed';
  trainerName: string;
  trainerTitle: string;
  certificateSettings?: CertificateSettings;
  totalPretestQuestions?: number;
  totalPosttestQuestions?: number;
}

export interface ExamResult {
  id: string;
  trainingId: string;
  userId: string;
  userName: string;
  userNik: string;
  department: string;
  examType: ExamType;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  passed: boolean;
  certificateId?: string;
  violationsCount: number;
  disqualified: boolean;
  userAnswers?: Record<string, string>; // questionId -> chosenOption
  clientIp?: string;
  issueLocation?: string;
  trainerName?: string;
  issuedAtExact?: string;
  certificateSettingsSnapshot?: CertificateSettings;
}

export interface ProctorLog {
  id: string;
  examResultId?: string;
  trainingId: string;
  trainingTitle: string;
  userId: string;
  userName: string;
  userNik: string;
  examType: ExamType;
  timestamp: string;
  violationType: 'tab_switch' | 'fullscreen_exit' | 'webcam_blocked' | 'periodic_snapshot';
  snapshotUrl?: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ShuffledQuestion {
  originalId: string;
  questionText: string;
  mediaType?: MediaType;
  mediaUrl?: string;
  mediaCaption?: string;
  shuffledOptions: {
    key: 'A' | 'B' | 'C' | 'D' | 'E'; // display key
    originalKey: 'A' | 'B' | 'C' | 'D' | 'E';
    text: string;
  }[];
}
