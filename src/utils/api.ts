import { User, TrainingSession, Question, ExamResult, ProctorLog } from '../types';

export const api = {
  async getUsers(): Promise<User[]> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async login(identifier: string, password?: string): Promise<{ user: User; success: boolean }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login gagal');
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
  },

  // Admin Management Endpoints (Master Developer restricted)
  async getAdmins(): Promise<User[]> {
    const res = await fetch('/api/admins');
    if (!res.ok) throw new Error('Gagal memuat daftar admin');
    return res.json();
  },

  async addAdmin(payload: { email: string; name?: string; position?: string; department?: string }): Promise<User> {
    const res = await fetch('/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal menambahkan admin');
    return data.user;
  },

  async removeAdmin(email: string): Promise<boolean> {
    const res = await fetch(`/api/admins/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal mencabut hak admin');
    return true;
  },

  async getTrainings(): Promise<TrainingSession[]> {
    const res = await fetch('/api/trainings');
    if (!res.ok) throw new Error('Failed to fetch trainings');
    return res.json();
  },

  async saveTraining(training: TrainingSession): Promise<TrainingSession> {
    const res = await fetch('/api/trainings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(training),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save training');
    return data.training || training;
  },

  async deleteTraining(id: string): Promise<boolean> {
    const res = await fetch(`/api/trainings/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete training');
    return true;
  },

  async getQuestions(): Promise<Question[]> {
    const res = await fetch('/api/questions');
    if (!res.ok) throw new Error('Failed to fetch questions');
    return res.json();
  },

  async saveQuestions(questions: Question[]): Promise<boolean> {
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questions),
    });
    if (!res.ok) throw new Error('Failed to save questions');
    return true;
  },

  async deleteQuestion(id: string): Promise<boolean> {
    const res = await fetch(`/api/questions/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete question');
    return true;
  },

  async getExamResults(): Promise<ExamResult[]> {
    const res = await fetch('/api/results');
    if (!res.ok) throw new Error('Failed to fetch results');
    return res.json();
  },

  async saveExamResult(result: ExamResult): Promise<ExamResult> {
    const res = await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save exam result');
    return data.result || result;
  },

  async getProctorLogs(): Promise<ProctorLog[]> {
    const res = await fetch('/api/logs');
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  },

  async saveProctorLog(log: ProctorLog): Promise<ProctorLog> {
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save log');
    return data.log || log;
  },

  async resetDatabase(): Promise<boolean> {
    const res = await fetch('/api/reset', {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset database');
    return true;
  },
};
