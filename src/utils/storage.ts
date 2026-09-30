import { User, TrainingSession, Question, ExamResult, ProctorLog } from '../types';
import { INITIAL_USERS, INITIAL_TRAININGS, INITIAL_QUESTIONS, INITIAL_EXAM_RESULTS, INITIAL_PROCTOR_LOGS } from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'hr_exam_users_v1',
  CURRENT_USER: 'hr_exam_current_user_v1',
  TRAININGS: 'hr_exam_trainings_v1',
  QUESTIONS: 'hr_exam_questions_v1',
  RESULTS: 'hr_exam_results_v1',
  PROCTOR_LOGS: 'hr_exam_proctor_logs_v1',
};

export const Storage = {
  getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  updateUserRole(email: string, role: 'admin' | 'karyawan'): void {
    const list = this.getUsers();
    const idx = list.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    if (idx >= 0) {
      list[idx].role = role;
      this.saveUsers(list);
    }
    const curr = this.getCurrentUser();
    if (curr && curr.email.toLowerCase() === email.toLowerCase()) {
      curr.role = role;
      this.setCurrentUser(curr);
    }
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  clearCurrentUser(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getTrainings(): TrainingSession[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRAININGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRAININGS, JSON.stringify(INITIAL_TRAININGS));
      return INITIAL_TRAININGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TRAININGS;
    }
  },

  saveTrainings(trainings: TrainingSession[]): void {
    localStorage.setItem(STORAGE_KEYS.TRAININGS, JSON.stringify(trainings));
  },

  updateTraining(updated: TrainingSession): void {
    const current = this.getTrainings();
    const index = current.findIndex(t => t.id === updated.id);
    if (index >= 0) {
      current[index] = updated;
    } else {
      current.push(updated);
    }
    this.saveTrainings(current);
  },

  deleteTraining(id: string): void {
    const current = this.getTrainings();
    this.saveTrainings(current.filter(t => t.id !== id));
    // Also clean up questions associated with this training
    const questions = this.getQuestions();
    this.saveQuestions(questions.filter(q => q.trainingId !== id));
    // Also clean up results and logs
    const results = this.getExamResults();
    this.saveExamResults(results.filter(r => r.trainingId !== id));
    const logs = this.getProctorLogs();
    this.saveProctorLogs(logs.filter(l => l.trainingId !== id));
  },

  getQuestions(trainingId?: string): Question[] {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    let list: Question[] = [];
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
      list = INITIAL_QUESTIONS;
    } else {
      try {
        list = JSON.parse(raw);
      } catch {
        list = INITIAL_QUESTIONS;
      }
    }
    if (trainingId) {
      return list.filter(q => q.trainingId === trainingId);
    }
    return list;
  },

  saveQuestions(questions: Question[]): void {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  },

  addQuestions(newQuestions: Question[]): void {
    const current = this.getQuestions();
    const newIds = new Set(newQuestions.map(q => q.id));
    const filtered = current.filter(q => !newIds.has(q.id));
    this.saveQuestions([...filtered, ...newQuestions]);
  },

  deleteQuestion(id: string): void {
    const current = this.getQuestions();
    this.saveQuestions(current.filter(q => q.id !== id));
  },

  getExamResults(trainingId?: string, userId?: string): ExamResult[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
    let list: ExamResult[] = [];
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(INITIAL_EXAM_RESULTS));
      list = INITIAL_EXAM_RESULTS;
    } else {
      try {
        list = JSON.parse(raw);
      } catch {
        list = INITIAL_EXAM_RESULTS;
      }
    }
    return list.filter(r => {
      if (trainingId && r.trainingId !== trainingId) return false;
      if (userId && r.userId !== userId) return false;
      return true;
    });
  },

  saveExamResults(results: ExamResult[]): void {
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
  },

  saveExamResult(result: ExamResult): void {
    const current = this.getExamResults();
    const existingIndex = current.findIndex(
      r => r.trainingId === result.trainingId && r.userId === result.userId && r.examType === result.examType
    );
    if (existingIndex >= 0) {
      current[existingIndex] = result;
    } else {
      current.push(result);
    }
    this.saveExamResults(current);
  },

  getProctorLogs(trainingId?: string, userId?: string): ProctorLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PROCTOR_LOGS);
    let list: ProctorLog[] = [];
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROCTOR_LOGS, JSON.stringify(INITIAL_PROCTOR_LOGS));
      list = INITIAL_PROCTOR_LOGS;
    } else {
      try {
        list = JSON.parse(raw);
      } catch {
        list = INITIAL_PROCTOR_LOGS;
      }
    }
    return list.filter(l => {
      if (trainingId && l.trainingId !== trainingId) return false;
      if (userId && l.userId !== userId) return false;
      return true;
    });
  },

  saveProctorLogs(logs: ProctorLog[]): void {
    localStorage.setItem(STORAGE_KEYS.PROCTOR_LOGS, JSON.stringify(logs));
  },

  addProctorLog(log: ProctorLog): void {
    const current = this.getProctorLogs();
    current.unshift(log);
    this.saveProctorLogs(current);
  },

  resetAll(): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.TRAININGS, JSON.stringify(INITIAL_TRAININGS));
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(INITIAL_QUESTIONS));
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(INITIAL_EXAM_RESULTS));
    localStorage.setItem(STORAGE_KEYS.PROCTOR_LOGS, JSON.stringify(INITIAL_PROCTOR_LOGS));
  },
};
