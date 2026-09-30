import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Tabel Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name').notNull(),
  nik: text('nik').notNull(),
  role: text('role').notNull().default('karyawan'), // 'admin' | 'karyawan'
  department: text('department').notNull().default('General'),
  position: text('position').notNull().default('Staff'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabel Training_Sessions
export const trainingSessions = pgTable('training_sessions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  department: text('department').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(15),
  passingGrade: integer('passing_grade').notNull().default(70),
  isPosttestUnlocked: boolean('is_posttest_unlocked').notNull().default(false),
  status: text('status').notNull().default('active'), // 'active' | 'completed'
  trainerName: text('trainer_name').notNull().default('Dr. Rian Hidayat, M.M., CPC'),
  trainerTitle: text('trainer_title').notNull().default('Lead Executive Leadership Coach'),
  certificateSettings: jsonb('certificate_settings'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabel Questions
export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  trainingId: text('training_id')
    .references(() => trainingSessions.id, { onDelete: 'cascade' })
    .notNull(),
  examType: text('exam_type').notNull(), // 'pretest' | 'posttest'
  questionText: text('question_text').notNull(),
  optionA: text('option_a').notNull(),
  optionB: text('option_b').notNull(),
  optionC: text('option_c').notNull(),
  optionD: text('option_d').notNull(),
  optionE: text('option_e').notNull(),
  correctAnswer: text('correct_answer').notNull(), // 'A' | 'B' | 'C' | 'D' | 'E'
  mediaType: text('media_type').default('none'), // 'none' | 'image' | 'video' | 'audio'
  mediaUrl: text('media_url'),
  mediaCaption: text('media_caption'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabel Exam_Results
export const examResults = pgTable('exam_results', {
  id: text('id').primaryKey(),
  trainingId: text('training_id')
    .references(() => trainingSessions.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  userNik: text('user_nik').notNull(),
  department: text('department').notNull(),
  examType: text('exam_type').notNull(), // 'pretest' | 'posttest'
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  correctAnswers: integer('correct_answers').notNull(),
  startedAt: text('started_at').notNull(),
  finishedAt: text('finished_at').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  passed: boolean('passed').notNull(),
  certificateId: text('certificate_id'),
  violationsCount: integer('violations_count').notNull().default(0),
  disqualified: boolean('disqualified').notNull().default(false),
  userAnswers: jsonb('user_answers'),
  clientIp: text('client_ip'),
  issueLocation: text('issue_location'),
  trainerName: text('trainer_name'),
  issuedAtExact: text('issued_at_exact'),
  certificateSettingsSnapshot: jsonb('certificate_settings_snapshot'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabel Proctor_Logs
export const proctorLogs = pgTable('proctor_logs', {
  id: text('id').primaryKey(),
  examResultId: text('exam_result_id'),
  trainingId: text('training_id')
    .references(() => trainingSessions.id, { onDelete: 'cascade' })
    .notNull(),
  trainingTitle: text('training_title').notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  userNik: text('user_nik').notNull(),
  examType: text('exam_type').notNull(),
  timestamp: text('timestamp').notNull(),
  violationType: text('violation_type').notNull(), // 'tab_switch' | 'fullscreen_exit' | 'webcam_blocked' | 'periodic_snapshot'
  snapshotUrl: text('snapshot_url'),
  details: text('details').notNull(),
  severity: text('severity').notNull().default('low'), // 'low' | 'medium' | 'high'
  createdAt: timestamp('created_at').defaultNow(),
});

// Drizzle Relations
export const trainingSessionsRelations = relations(trainingSessions, ({ many }) => ({
  questions: many(questions),
  examResults: many(examResults),
  proctorLogs: many(proctorLogs),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  training: one(trainingSessions, {
    fields: [questions.trainingId],
    references: [trainingSessions.id],
  }),
}));

export const examResultsRelations = relations(examResults, ({ one }) => ({
  training: one(trainingSessions, {
    fields: [examResults.trainingId],
    references: [trainingSessions.id],
  }),
}));

export const proctorLogsRelations = relations(proctorLogs, ({ one }) => ({
  training: one(trainingSessions, {
    fields: [proctorLogs.trainingId],
    references: [trainingSessions.id],
  }),
}));
