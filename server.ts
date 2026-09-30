import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';
import { db } from './src/db/index.ts';
import { trainingSessions, questions, examResults, proctorLogs, users } from './src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import {
  INITIAL_USERS,
  INITIAL_TRAININGS,
  INITIAL_QUESTIONS,
  INITIAL_EXAM_RESULTS,
  INITIAL_PROCTOR_LOGS,
} from './src/data/initialData.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// In-memory fallback cache
let memoryUsers = [...INITIAL_USERS];
let memoryTrainings = [...INITIAL_TRAININGS];
let memoryQuestions = [...INITIAL_QUESTIONS];
let memoryResults = [...INITIAL_EXAM_RESULTS];
let memoryLogs = [...INITIAL_PROCTOR_LOGS];

// Format user helper
const formatUser = (u: any) => ({
  id: u.uid || String(u.id),
  uid: u.uid || String(u.id),
  nik: u.nik,
  name: u.name,
  email: u.email,
  role: (u.role || 'karyawan') as 'admin' | 'karyawan',
  department: u.department || 'General Operations',
  position: u.position || 'Staff',
  avatarUrl: u.avatarUrl || u.avatar_url || undefined,
});

// Database seeder on boot to ensure Cloud SQL is populated
async function seedDatabaseIfEmpty() {
  try {
    // 1. Seed Users if empty
    const currentUsers = await db.select().from(users);
    if (currentUsers.length === 0) {
      console.log('Seeding initial users into Cloud SQL...');
      for (const u of INITIAL_USERS) {
        await db
          .insert(users)
          .values({
            uid: u.id,
            email: u.email,
            name: u.name,
            nik: u.nik,
            role: u.role,
            department: u.department,
            position: u.position,
            avatarUrl: u.avatarUrl,
          })
          .onConflictDoNothing();
      }
    }

    // 2. Seed Trainings if empty
    const currentTrainings = await db.select().from(trainingSessions);
    if (currentTrainings.length === 0) {
      console.log('Seeding initial trainings into Cloud SQL...');
      for (const t of INITIAL_TRAININGS) {
        await db
          .insert(trainingSessions)
          .values({
            id: t.id,
            title: t.title,
            category: t.category,
            description: t.description,
            department: t.department,
            startDate: t.startDate,
            endDate: t.endDate,
            durationMinutes: t.durationMinutes,
            passingGrade: t.passingGrade,
            isPosttestUnlocked: t.isPosttestUnlocked,
            status: t.status,
            trainerName: t.trainerName,
            trainerTitle: t.trainerTitle,
            certificateSettings: t.certificateSettings as any,
          })
          .onConflictDoNothing();
      }
    }

    // 3. Seed Questions if empty
    const currentQuestions = await db.select().from(questions);
    if (currentQuestions.length < INITIAL_QUESTIONS.length) {
      console.log('Seeding questions into Cloud SQL...');
      for (const q of INITIAL_QUESTIONS) {
        await db
          .insert(questions)
          .values({
            id: q.id,
            trainingId: q.trainingId,
            examType: q.examType,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            optionE: q.optionE,
            correctAnswer: q.correctAnswer,
            mediaType: q.mediaType || 'none',
            mediaUrl: q.mediaUrl || null,
            mediaCaption: q.mediaCaption || null,
          })
          .onConflictDoNothing();
      }
    }

    // 4. Seed Results if empty
    const currentResults = await db.select().from(examResults);
    if (currentResults.length === 0) {
      console.log('Seeding initial results into Cloud SQL...');
      for (const r of INITIAL_EXAM_RESULTS) {
        await db
          .insert(examResults)
          .values({
            id: r.id,
            trainingId: r.trainingId,
            userId: r.userId,
            userName: r.userName,
            userNik: r.userNik,
            department: r.department,
            examType: r.examType,
            score: r.score,
            totalQuestions: r.totalQuestions,
            correctAnswers: r.correctAnswers,
            startedAt: r.startedAt,
            finishedAt: r.finishedAt,
            durationSeconds: r.durationSeconds,
            passed: r.passed,
            certificateId: r.certificateId,
            violationsCount: r.violationsCount,
            disqualified: r.disqualified,
            clientIp: r.clientIp,
            issueLocation: r.issueLocation,
            trainerName: r.trainerName,
            issuedAtExact: r.issuedAtExact,
            certificateSettingsSnapshot: r.certificateSettingsSnapshot as any,
          })
          .onConflictDoNothing();
      }
    }

    // 5. Seed Logs if empty
    const currentLogs = await db.select().from(proctorLogs);
    if (currentLogs.length === 0) {
      console.log('Seeding initial proctor logs into Cloud SQL...');
      for (const l of INITIAL_PROCTOR_LOGS) {
        await db
          .insert(proctorLogs)
          .values({
            id: l.id,
            examResultId: l.examResultId || null,
            trainingId: l.trainingId,
            trainingTitle: l.trainingTitle,
            userId: l.userId,
            userName: l.userName,
            userNik: l.userNik,
            examType: l.examType,
            timestamp: l.timestamp,
            violationType: l.violationType,
            snapshotUrl: l.snapshotUrl || null,
            details: l.details,
            severity: l.severity || 'low',
          })
          .onConflictDoNothing();
      }
    }
    console.log('Database verification and seed check completed.');
  } catch (err: any) {
    console.log('Database seed check fallback.');
  }
}

// 1. Health Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const MASTER_DEVELOPER_EMAIL = 'dysaraswati24@gmail.com';

// 2. Users List API
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const dbUsers = await db.select().from(users);
    if (dbUsers && dbUsers.length > 0) {
      return res.json(dbUsers.map(formatUser));
    }
    return res.json(memoryUsers);
  } catch (err: any) {
    console.log('Fetching users fallback to memory.');
    return res.json(memoryUsers);
  }
});

// 3. Auth: Email & Password Direct Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { identifier, password, name, avatarUrl } = req.body;
    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({ error: 'Alamat email atau NIK wajib diisi.' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const isMasterDeveloper = cleanId === MASTER_DEVELOPER_EMAIL;

    // Check DB first if available
    let matchedUser: any = null;
    try {
      const dbUsers = await db.select().from(users);
      matchedUser = dbUsers.find(
        (u) => u.email.toLowerCase() === cleanId || u.nik.toLowerCase() === cleanId
      );
    } catch {
      matchedUser = memoryUsers.find(
        (u) => u.email.toLowerCase() === cleanId || u.nik.toLowerCase() === cleanId
      );
    }

    // 1. If Master Developer, always guarantee Admin role
    if (isMasterDeveloper) {
      if (matchedUser) {
        if (matchedUser.role !== 'admin') {
          matchedUser.role = 'admin';
          try {
            await db.update(users).set({ role: 'admin' }).where(eq(users.email, MASTER_DEVELOPER_EMAIL));
          } catch {}
        }
        return res.json({ user: formatUser(matchedUser), success: true });
      } else {
        const devUser = {
          uid: 'user-dev-saraswati',
          email: MASTER_DEVELOPER_EMAIL,
          name: 'DY Saraswati',
          nik: 'DEV-001',
          role: 'admin',
          department: 'System & HR Administration',
          position: 'Lead Developer & Super Admin HR',
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        };
        try {
          await db.insert(users).values(devUser).onConflictDoNothing();
        } catch {}
        memoryUsers.push(devUser as any);
        return res.json({ user: formatUser(devUser), success: true });
      }
    }

    // 2. If new email that is not in DB, dynamically register as 'karyawan' (strict security)
    if (!matchedUser) {
      if (cleanId.includes('@')) {
        const cleanNamePart = cleanId.split('@')[0].replace(/[._-]/g, ' ');
        const formattedName = cleanNamePart
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

        const newId = `usr-${Date.now()}`;
        const newNik = `EMP-${Math.floor(100 + Math.random() * 900)}`;

        const newUserPayload = {
          uid: newId,
          email: cleanId,
          name: name || formattedName || 'Karyawan Baru',
          nik: newNik,
          role: 'karyawan', // Strictly karyawan for all new self-registered users
          department: 'Operasional & Bisnis',
          position: 'Staff Associate',
          avatarUrl: avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
        };

        try {
          await db.insert(users).values(newUserPayload).onConflictDoNothing();
        } catch (e) {
          console.error('Failed to insert new user to DB:', e);
        }

        const formatted = formatUser(newUserPayload);
        memoryUsers.push(formatted as any);
        return res.json({ user: formatted, success: true });
      }

      return res.status(401).json({
        error: 'Akun dengan email atau NIK tersebut tidak ditemukan. Silakan masukkan alamat email yang valid.',
      });
    }

    // 3. Existing user in DB: role is authoritative from DB (only admin if granted by developer)
    return res.json({ user: formatUser(matchedUser), success: true });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan sistem saat proses login.' });
  }
});

// Update Profile Endpoint
app.post('/api/users/profile', async (req: Request, res: Response) => {
  try {
    const { email, name, nik } = req.body;
    if (!email || !name || !nik) {
      return res.status(400).json({ error: 'Nama dan NIK wajib diisi.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanNik = nik.trim();

    // 1. Update in DB if available
    try {
      await db.update(users).set({
        name: cleanName,
        nik: cleanNik,
      }).where(eq(users.email, cleanEmail));
    } catch (e: any) {
      console.log('Profile DB update fallback to memory:', e.message);
    }

    // 2. Update in memory fallback
    const idx = memoryUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (idx >= 0) {
      memoryUsers[idx].name = cleanName;
      memoryUsers[idx].nik = cleanNik;
      return res.json({ success: true, user: formatUser(memoryUsers[idx]) });
    }

    const newUser = {
      id: `usr-${Date.now()}`,
      uid: `usr-${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      nik: cleanNik,
      role: 'karyawan',
      department: 'Operasional & Bisnis',
      position: 'Staff Associate',
    };
    memoryUsers.push(newUser as any);
    return res.json({ success: true, user: formatUser(newUser) });
  } catch (err: any) {
    console.log('Update profile error:', err.message);
    res.status(500).json({ error: 'Gagal memperbarui profil karyawan.' });
  }
});

// Admin Management Endpoints
app.get('/api/admins', async (req: Request, res: Response) => {
  try {
    const dbUsers = await db.select().from(users);
    const admins = dbUsers.filter((u) => u.role === 'admin' || u.email.toLowerCase() === MASTER_DEVELOPER_EMAIL);
    return res.json(admins.map(formatUser));
  } catch (err: any) {
    console.log('Admins fetched fallback to memory.');
    const admins = memoryUsers.filter((u) => u.role === 'admin' || u.email.toLowerCase() === MASTER_DEVELOPER_EMAIL);
    return res.json(admins.map(formatUser));
  }
});

app.post('/api/admins', async (req: Request, res: Response) => {
  try {
    const { email, name, position, department } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Alamat email admin tidak valid.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Update in memory first
    const idx = memoryUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    let targetUser: any = null;

    if (idx >= 0) {
      memoryUsers[idx].role = 'admin';
      if (name) memoryUsers[idx].name = name.trim();
      if (position) memoryUsers[idx].position = position.trim();
      if (department) memoryUsers[idx].department = department.trim();
      targetUser = memoryUsers[idx];
    } else {
      const cleanNamePart = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = cleanNamePart
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const newAdmin = {
        id: `usr-admin-${Date.now()}`,
        uid: `usr-admin-${Date.now()}`,
        email: cleanEmail,
        name: name ? name.trim() : (formattedName || 'HR Admin'),
        nik: `HR-${Math.floor(100 + Math.random() * 900)}`,
        role: 'admin',
        department: department ? department.trim() : 'Human Resources & People',
        position: position ? position.trim() : 'HR Specialist / Administrator',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      };
      memoryUsers.push(newAdmin as any);
      targetUser = newAdmin;
    }

    // 2. Persist to DB if available
    try {
      const allUsers = await db.select().from(users);
      const existing = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

      if (existing) {
        await db.update(users).set({
          role: 'admin',
          name: name ? name.trim() : existing.name,
          position: position ? position.trim() : existing.position,
          department: department ? department.trim() : existing.department,
        }).where(eq(users.id, existing.id));
      } else {
        await db.insert(users).values({
          uid: targetUser.uid || `usr-admin-${Date.now()}`,
          email: cleanEmail,
          name: targetUser.name,
          nik: targetUser.nik,
          role: 'admin',
          department: targetUser.department,
          position: targetUser.position,
          avatarUrl: targetUser.avatarUrl,
        }).onConflictDoNothing();
      }
    } catch (e: any) {
      console.log('DB add admin fallback to memory.');
    }

    return res.json({ success: true, user: formatUser(targetUser) });
  } catch (err: any) {
    console.error('Add admin error:', err);
    res.status(500).json({ error: 'Gagal menambahkan admin baru.' });
  }
});

app.delete('/api/admins/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const cleanEmail = decodeURIComponent(email).trim().toLowerCase();

    if (cleanEmail === MASTER_DEVELOPER_EMAIL) {
      return res.status(403).json({ error: 'Akun Master Developer tidak dapat dihapus atau dicabut hak adminnya.' });
    }

    // 1. Update in memory fallback immediately
    const idx = memoryUsers.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (idx >= 0) {
      memoryUsers[idx].role = 'karyawan';
    } else {
      const cleanNamePart = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = cleanNamePart
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      memoryUsers.push({
        id: `usr-${Date.now()}`,
        uid: `usr-${Date.now()}`,
        email: cleanEmail,
        name: formattedName,
        nik: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        role: 'karyawan',
        department: 'Operasional & Bisnis',
        position: 'Staff Associate',
      } as any);
    }

    // 2. Persist to DB if available
    try {
      await db.update(users).set({ role: 'karyawan' }).where(eq(users.email, cleanEmail));
    } catch (e: any) {
      console.log('DB revoke admin fallback to memory.');
    }

    return res.json({ success: true, message: `Hak akses admin untuk ${cleanEmail} telah dicabut.` });
  } catch (err: any) {
    console.error('Revoke admin error:', err);
    res.status(500).json({ error: 'Gagal mencabut hak akses admin.' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Berhasil keluar.' });
});

// 4. Training Sessions API
app.get('/api/trainings', async (req: Request, res: Response) => {
  try {
    const list = await db.select().from(trainingSessions).orderBy(desc(trainingSessions.createdAt));
    if (list && list.length > 0) {
      return res.json(list);
    }
    return res.json(memoryTrainings);
  } catch (err: any) {
    console.log('Trainings fetched fallback to memory.');
    return res.json(memoryTrainings);
  }
});

app.post('/api/trainings', async (req: Request, res: Response) => {
  try {
    const trainingData = req.body;
    if (!trainingData.id || !trainingData.title) {
      return res.status(400).json({ error: 'Data sesi tidak lengkap.' });
    }

    try {
      await db
        .insert(trainingSessions)
        .values({
          id: trainingData.id,
          title: trainingData.title,
          category: trainingData.category || 'General',
          description: trainingData.description || '',
          department: trainingData.department || 'All',
          startDate: trainingData.startDate,
          endDate: trainingData.endDate,
          durationMinutes: trainingData.durationMinutes || 15,
          passingGrade: trainingData.passingGrade || 70,
          isPosttestUnlocked: !!trainingData.isPosttestUnlocked,
          status: trainingData.status || 'active',
          trainerName: trainingData.trainerName || 'Dr. Rian Hidayat, M.M., CPC',
          trainerTitle: trainingData.trainerTitle || 'Lead Executive Leadership Coach',
          certificateSettings: trainingData.certificateSettings || null,
        })
        .onConflictDoUpdate({
          target: trainingSessions.id,
          set: {
            title: trainingData.title,
            category: trainingData.category,
            description: trainingData.description,
            department: trainingData.department,
            startDate: trainingData.startDate,
            endDate: trainingData.endDate,
            durationMinutes: trainingData.durationMinutes,
            passingGrade: trainingData.passingGrade,
            isPosttestUnlocked: trainingData.isPosttestUnlocked,
            status: trainingData.status,
            trainerName: trainingData.trainerName,
            trainerTitle: trainingData.trainerTitle,
            certificateSettings: trainingData.certificateSettings,
          },
        });
    } catch (e: any) {
      console.log('DB insert training fallback to memory:', e.message);
    }

    const idx = memoryTrainings.findIndex((t) => t.id === trainingData.id);
    if (idx >= 0) {
      memoryTrainings[idx] = trainingData;
    } else {
      memoryTrainings.unshift(trainingData);
    }

    res.json({ success: true, training: trainingData });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menyimpan sesi pelatihan.' });
  }
});

// Robust Delete Training Session with full cascade
app.delete('/api/trainings/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    try {
      // Delete child records first to strictly obey foreign keys
      await db.delete(proctorLogs).where(eq(proctorLogs.trainingId, id));
      await db.delete(examResults).where(eq(examResults.trainingId, id));
      await db.delete(questions).where(eq(questions.trainingId, id));
      await db.delete(trainingSessions).where(eq(trainingSessions.id, id));
      console.log(`Deleted training session ${id} and all related records from Cloud SQL.`);
    } catch (e: any) {
      console.log('DB delete fallback to memory:', e.message);
    }

    memoryTrainings = memoryTrainings.filter((t) => t.id !== id);
    memoryQuestions = memoryQuestions.filter((q) => q.trainingId !== id);
    memoryResults = memoryResults.filter((r) => r.trainingId !== id);
    memoryLogs = memoryLogs.filter((l) => l.trainingId !== id);

    res.json({ success: true, message: `Sesi pelatihan ${id} berhasil dihapus.` });
  } catch (err: any) {
    console.log('Delete error.');
    res.status(500).json({ error: 'Gagal menghapus sesi pelatihan.' });
  }
});

// 5. Questions API
app.get('/api/questions', async (req: Request, res: Response) => {
  try {
    const list = await db.select().from(questions);
    if (list && list.length > 0) {
      return res.json(list);
    }
    return res.json(memoryQuestions);
  } catch (err: any) {
    console.log('Questions fetched fallback to memory.');
    return res.json(memoryQuestions);
  }
});

app.post('/api/questions', async (req: Request, res: Response) => {
  try {
    const newQuestions = req.body;
    if (Array.isArray(newQuestions)) {
      for (const q of newQuestions) {
        try {
          await db
            .insert(questions)
            .values({
              id: q.id,
              trainingId: q.trainingId,
              examType: q.examType,
              questionText: q.questionText,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              optionE: q.optionE,
              correctAnswer: q.correctAnswer,
              mediaType: q.mediaType || 'none',
              mediaUrl: q.mediaUrl || null,
              mediaCaption: q.mediaCaption || null,
            })
            .onConflictDoUpdate({
              target: questions.id,
              set: {
                questionText: q.questionText,
                optionA: q.optionA,
                optionB: q.optionB,
                optionC: q.optionC,
                optionD: q.optionD,
                optionE: q.optionE,
                correctAnswer: q.correctAnswer,
                mediaType: q.mediaType || 'none',
                mediaUrl: q.mediaUrl || null,
                mediaCaption: q.mediaCaption || null,
              },
            });
        } catch (e: any) {
          console.log('Error inserting question fallback to memory:', q.id, e.message);
        }
      }

      // Memory sync
      const newIds = new Set(newQuestions.map((q) => q.id));
      memoryQuestions = [...memoryQuestions.filter((q) => !newIds.has(q.id)), ...newQuestions];
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menyimpan butir soal.' });
  }
});

app.delete('/api/questions/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    try {
      await db.delete(questions).where(eq(questions.id, id));
    } catch (e: any) {
      console.log('Error deleting question from DB fallback:', e.message);
    }
    memoryQuestions = memoryQuestions.filter((q) => q.id !== id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menghapus butir soal.' });
  }
});

// 6. Exam Results API
app.get('/api/results', async (req: Request, res: Response) => {
  try {
    const list = await db.select().from(examResults);
    if (list && list.length > 0) {
      return res.json(list);
    }
    return res.json(memoryResults);
  } catch (err: any) {
    console.log('Results fetched fallback to memory.');
    return res.json(memoryResults);
  }
});

app.post('/api/results', async (req: Request, res: Response) => {
  try {
    const result = req.body;
    try {
      await db
        .insert(examResults)
        .values({
          id: result.id,
          trainingId: result.trainingId,
          userId: result.userId,
          userName: result.userName,
          userNik: result.userNik,
          department: result.department,
          examType: result.examType,
          score: result.score,
          totalQuestions: result.totalQuestions,
          correctAnswers: result.correctAnswers,
          startedAt: result.startedAt,
          finishedAt: result.finishedAt,
          durationSeconds: result.durationSeconds,
          passed: result.passed,
          certificateId: result.certificateId || null,
          violationsCount: result.violationsCount || 0,
          disqualified: result.disqualified || false,
          userAnswers: result.userAnswers || null,
          clientIp: result.clientIp || null,
          issueLocation: result.issueLocation || null,
          trainerName: result.trainerName || null,
          issuedAtExact: result.issuedAtExact || null,
          certificateSettingsSnapshot: result.certificateSettingsSnapshot || null,
        })
        .onConflictDoUpdate({
          target: examResults.id,
          set: {
            score: result.score,
            finishedAt: result.finishedAt,
            passed: result.passed,
            certificateId: result.certificateId || null,
            violationsCount: result.violationsCount || 0,
            disqualified: result.disqualified || false,
            userAnswers: result.userAnswers || null,
            clientIp: result.clientIp || null,
            issueLocation: result.issueLocation || null,
            trainerName: result.trainerName || null,
            issuedAtExact: result.issuedAtExact || null,
            certificateSettingsSnapshot: result.certificateSettingsSnapshot || null,
          },
        });
    } catch (e: any) {
      console.log('Error inserting exam result fallback to memory:', e.message);
    }

    const idx = memoryResults.findIndex((r) => r.id === result.id);
    if (idx >= 0) {
      memoryResults[idx] = result;
    } else {
      memoryResults.push(result);
    }

    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal menyimpan hasil ujian.' });
  }
});

// 7. Proctor Logs API
app.get('/api/logs', async (req: Request, res: Response) => {
  try {
    const list = await db.select().from(proctorLogs).orderBy(desc(proctorLogs.timestamp));
    if (list && list.length > 0) {
      return res.json(list);
    }
    return res.json(memoryLogs);
  } catch (err: any) {
    console.log('Logs fetched fallback to memory.');
    return res.json(memoryLogs);
  }
});

app.post('/api/logs', async (req: Request, res: Response) => {
  try {
    const log = req.body;
    try {
      await db.insert(proctorLogs).values({
        id: log.id,
        examResultId: log.examResultId || null,
        trainingId: log.trainingId,
        trainingTitle: log.trainingTitle,
        userId: log.userId,
        userName: log.userName,
        userNik: log.userNik,
        examType: log.examType,
        timestamp: log.timestamp,
        violationType: log.violationType,
        snapshotUrl: log.snapshotUrl || null,
        details: log.details,
        severity: log.severity || 'low',
      });
    } catch (e) {
      console.error('Error inserting log:', e);
    }

    memoryLogs.unshift(log);
    res.json({ success: true, log });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mencatat log proctoring.' });
  }
});

// 8. Reset Database API
app.post('/api/reset', async (req: Request, res: Response) => {
  try {
    try {
      await db.delete(proctorLogs);
      await db.delete(examResults);
      await db.delete(questions);
      await db.delete(trainingSessions);
      await db.delete(users);
      console.log('Database cleared for reset.');
    } catch (e) {
      console.error('Reset clearing error:', e);
    }

    // Re-seed memory
    memoryUsers = [...INITIAL_USERS];
    memoryTrainings = [...INITIAL_TRAININGS];
    memoryQuestions = [...INITIAL_QUESTIONS];
    memoryResults = [...INITIAL_EXAM_RESULTS];
    memoryLogs = [...INITIAL_PROCTOR_LOGS];

    // Re-seed DB
    await seedDatabaseIfEmpty();

    res.json({ success: true, message: 'Database telah direset ke data default.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal mereset database.' });
  }
});

// 9. Mount Vite in development mode or serve static files
async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasDist) {
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Seed DB asynchronously in the background so it never blocks the startup health probe
  seedDatabaseIfEmpty().catch(() => {
    // Gracefully handle any initial seeding issues
  });
}

startServer();
