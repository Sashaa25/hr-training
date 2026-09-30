import React, { useState, useEffect } from 'react';
import { User, TrainingSession, Question, ExamResult, ProctorLog, ExamType } from './types';
import { Storage } from './utils/storage';
import { api } from './utils/api';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/Auth/LoginView';
import { TrainingManager } from './components/Admin/TrainingManager';
import { ProctoringMonitor } from './components/Admin/ProctoringMonitor';
import { ExecutiveReportModal } from './components/Admin/ExecutiveReportModal';
import { KaryawanDashboard } from './components/Karyawan/KaryawanDashboard';
import { ExamRoom } from './components/Karyawan/ExamRoom';
import { ExamResultModal } from './components/Karyawan/ExamResultModal';
import { CertificateModal } from './components/Karyawan/CertificateModal';
import { VerificationLookupModal } from './components/VerificationLookupModal';
import { AdminManagementModal } from './components/Admin/AdminManagementModal';
import { User as UserIcon, AlertCircle } from 'lucide-react';

const OnboardingView: React.FC<{ currentUser: User; onComplete: (updatedUser: User) => void }> = ({ currentUser, onComplete }) => {
  const [name, setName] = useState(currentUser.name || '');
  const [nik, setNik] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Silakan masukkan nama lengkap Anda.');
      return;
    }
    if (!nik.trim()) {
      setError('Silakan masukkan NIK (Nomor Induk Karyawan) Anda.');
      return;
    }
    if (nik.trim().toUpperCase().startsWith('EMP-')) {
      setError('Silakan gunakan NIK karyawan resmi Anda, bukan NIK contoh sementara.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          name: name.trim(),
          nik: nik.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan profil.');
      }
      onComplete(data.user);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem saat memperbarui data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl p-8 shadow-2xl text-slate-900 border border-slate-100 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-2">
            <UserIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-950">Lengkapi Profil Karyawan</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Sebelum mengakses Dashboard Evaluasi Pelatihan, mohon lengkapi Nama Lengkap &amp; NIK karyawan resmi Anda.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Email (Google)</label>
            <input
              type="text"
              disabled
              value={currentUser.email}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 text-slate-400 font-mono text-xs rounded-lg cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Resmi</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: John Doe"
              className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Induk Karyawan (NIK)</label>
            <input
              type="text"
              required
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              placeholder="Masukkan NIK resmi Anda..."
              className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Menyimpan Profil...' : 'Simpan & Masuk Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};


export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trainings, setTrainings] = useState<TrainingSession[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [logs, setLogs] = useState<ProctorLog[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('trainings');
  const [viewMode, setViewMode] = useState<'admin' | 'peserta'>('admin');

  // Exam in-progress state
  const [activeExam, setActiveExam] = useState<{
    training: TrainingSession;
    examType: ExamType;
  } | null>(null);

  // Result modal state
  const [resultModalData, setResultModalData] = useState<{
    result: ExamResult;
    training: TrainingSession;
    pretestResult?: ExamResult;
  } | null>(null);

  // Direct certificate viewer modal state
  const [certificateModalData, setCertificateModalData] = useState<{
    training: TrainingSession;
    user: User;
    result: ExamResult;
  } | null>(null);

  // Executive report standalone modal state
  const [reportModalTraining, setReportModalTraining] = useState<TrainingSession | null>(null);

  // QR Code Certificate Verification Lookup Modal
  const [showLookupModal, setShowLookupModal] = useState(false);

  // Admin Management Modal (Master Developer & Admins)
  const [showAdminManagementModal, setShowAdminManagementModal] = useState(false);

  // Load initial data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    // 1. Initial quick load from local cache for instant UI
    const cachedUsers = Storage.getUsers();
    const cachedCurr = Storage.getCurrentUser();
    const cachedTrainings = Storage.getTrainings();
    const cachedQuestions = Storage.getQuestions();
    const cachedResults = Storage.getExamResults();
    const cachedLogs = Storage.getProctorLogs();

    setUsers(cachedUsers);
    setCurrentUser(cachedCurr);
    setTrainings(cachedTrainings);
    setQuestions(cachedQuestions);
    setResults(cachedResults);
    setLogs(cachedLogs);

    if (cachedCurr) {
      setActiveTab(cachedCurr.role === 'admin' ? 'trainings' : 'exams');
    }

    // 2. Fetch fresh live data from Cloud SQL via API
    try {
      const [dbUsers, dbTrainings, dbQuestions, dbResults, dbLogs] = await Promise.all([
        api.getUsers().catch(() => cachedUsers),
        api.getTrainings().catch(() => cachedTrainings),
        api.getQuestions().catch(() => cachedQuestions),
        api.getExamResults().catch(() => cachedResults),
        api.getProctorLogs().catch(() => cachedLogs),
      ]);

      if (dbUsers && dbUsers.length > 0) {
        setUsers(dbUsers);
        Storage.saveUsers(dbUsers);
      }
      if (dbTrainings && dbTrainings.length > 0) {
        setTrainings(dbTrainings);
        Storage.saveTrainings(dbTrainings);
      }
      if (dbQuestions && dbQuestions.length > 0) {
        setQuestions(dbQuestions);
        Storage.saveQuestions(dbQuestions);
      }
      if (dbResults) {
        setResults(dbResults);
        Storage.saveExamResults(dbResults);
      }
      if (dbLogs) {
        setLogs(dbLogs);
        Storage.saveProctorLogs(dbLogs);
      }

      // If user was logged in, ensure current user info matches DB
      if (cachedCurr && dbUsers && dbUsers.length > 0) {
        const freshUser = dbUsers.find(
          (u) => u.id === cachedCurr.id || u.email.toLowerCase() === cachedCurr.email.toLowerCase()
        );
        if (freshUser) {
          setCurrentUser(freshUser);
          Storage.setCurrentUser(freshUser);
        }
      }
    } catch (e) {
      console.warn('Live API sync fallback to local cache:', e);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    Storage.setCurrentUser(user);
    setViewMode(user.role === 'admin' ? 'admin' : 'peserta');
    setActiveTab(user.role === 'admin' ? 'trainings' : 'exams');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    Storage.clearCurrentUser();
    api.logout();
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    Storage.setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveTab('trainings');
    } else {
      setActiveTab('exams');
    }
  };

  const handleResetData = async () => {
    try {
      await api.resetDatabase();
    } catch (err) {
      console.error('Reset database failed, resetting local storage:', err);
    }
    Storage.resetAll();
    await loadAllData();
  };

  const handleUpdateTraining = async (updated: TrainingSession) => {
    // 1. Optimistic UI update
    setTrainings((prev) => {
      const idx = prev.findIndex((t) => t.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });
    Storage.updateTraining(updated);

    // 2. Persist to Cloud SQL
    try {
      await api.saveTraining(updated);
    } catch (err) {
      console.error('Failed to sync training to DB:', err);
    }
  };

  const handleDeleteTraining = async (id: string) => {
    // 1. Optimistic UI update
    setTrainings((prev) => prev.filter((t) => t.id !== id));
    setQuestions((prev) => prev.filter((q) => q.trainingId !== id));
    setResults((prev) => prev.filter((r) => r.trainingId !== id));
    setLogs((prev) => prev.filter((l) => l.trainingId !== id));
    Storage.deleteTraining(id);

    // 2. Persist deletion in Cloud SQL
    try {
      await api.deleteTraining(id);
    } catch (err) {
      console.error('Failed to delete training from DB:', err);
    }
  };

  const handleSaveQuestions = async (newQ: Question[]) => {
    // 1. Optimistic UI update
    const newIds = new Set(newQ.map((q) => q.id));
    setQuestions((prev) => [...prev.filter((q) => !newIds.has(q.id)), ...newQ]);
    Storage.addQuestions(newQ);

    // 2. Persist to Cloud SQL
    try {
      await api.saveQuestions(newQ);
    } catch (err) {
      console.error('Failed to sync questions to DB:', err);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    // 1. Optimistic UI update
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    Storage.deleteQuestion(id);

    // 2. Persist to Cloud SQL
    try {
      await api.deleteQuestion(id);
    } catch (err) {
      console.error('Failed to delete question from DB:', err);
    }
  };

  const handleRecordProctorLog = async (log: ProctorLog) => {
    setLogs((prev) => [log, ...prev]);
    Storage.addProctorLog(log);
    try {
      await api.saveProctorLog(log);
    } catch (err) {
      console.error('Failed to sync proctor log to DB:', err);
    }
  };

  const handleStartExam = (training: TrainingSession, examType: ExamType) => {
    setActiveExam({ training, examType });
  };

  const handleCompleteExam = async (result: ExamResult) => {
    // 1. Optimistic UI update
    setResults((prev) => {
      const idx = prev.findIndex(
        (r) => r.trainingId === result.trainingId && r.userId === result.userId && r.examType === result.examType
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = result;
        return copy;
      }
      return [...prev, result];
    });
    Storage.saveExamResult(result);

    // 2. Persist to Cloud SQL
    try {
      await api.saveExamResult(result);
    } catch (err) {
      console.error('Failed to sync exam result to DB:', err);
    }

    const tr = trainings.find((t) => t.id === result.trainingId);
    if (!tr) return;

    // Find pretest result if posttest completed
    let preResult: ExamResult | undefined = undefined;
    if (result.examType === 'posttest' && currentUser) {
      preResult = results.find(
        (r) => r.trainingId === result.trainingId && r.userId === currentUser.id && r.examType === 'pretest'
      );
    }

    setActiveExam(null);
    setResultModalData({
      result,
      training: tr,
      pretestResult: preResult,
    });
  };

  // If initializing with no cached data, show quick loader
  if (isInitializing && !currentUser && users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p>Menghubungkan ke Cloud SQL Database...</p>
        </div>
      </div>
    );
  }

  // If not logged in, render the Corporate Direct Email Login View!
  if (!currentUser) {
    return (
      <LoginView
        onLogin={handleLogin}
      />
    );
  }

  // Check if participant needs onboarding (needs real Name and custom official NIK)
  const needsOnboarding = currentUser && currentUser.role === 'karyawan' && 
    (!currentUser.name || !currentUser.nik || currentUser.nik.startsWith('EMP-') || currentUser.name.toLowerCase().includes('karyawan baru'));

  if (needsOnboarding) {
    return (
      <OnboardingView
        currentUser={currentUser}
        onComplete={(updatedUser) => {
          setCurrentUser(updatedUser);
          Storage.setCurrentUser(updatedUser);
          loadAllData();
        }}
      />
    );
  }

  // If in active exam mode, show dedicated distraction-free Exam Room
  if (activeExam) {
    return (
      <ExamRoom
        training={activeExam.training}
        examType={activeExam.examType}
        user={currentUser}
        questions={questions}
        onCompleteExam={handleCompleteExam}
        onCancelExam={() => setActiveExam(null)}
        onRecordProctorLog={handleRecordProctorLog}
      />
    );
  }

  const isAdmin = currentUser.role === 'admin' && viewMode === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenVerification={() => setShowLookupModal(true)}
        onOpenAdminManagement={() => setShowAdminManagementModal(true)}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode(prev => prev === 'admin' ? 'peserta' : 'admin')}
      />

      {/* Main Container Viewport */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-20 md:pb-8">
        {isAdmin ? (
          /* Admin (HR) Views */
          <div>
            {activeTab === 'trainings' && (
              <TrainingManager
                trainings={trainings}
                questions={questions}
                results={results}
                users={users}
                logs={logs}
                onUpdateTraining={handleUpdateTraining}
                onDeleteTraining={handleDeleteTraining}
                onSaveQuestions={handleSaveQuestions}
                onDeleteQuestion={handleDeleteQuestion}
                onSelectTab={setActiveTab}
                onOpenAdminManagement={() => setShowAdminManagementModal(true)}
              />
            )}

            {activeTab === 'proctoring' && (
              <ProctoringMonitor
                logs={logs}
                trainings={trainings}
                users={users}
              />
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
                  <h1 className="text-xl font-bold text-slate-900">Pusat Pelaporan Eksekutif HR</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Pilih program pelatihan di bawah ini untuk membuka laporan analitik dan ekspor dalam 3 format (Excel, Word, PDF).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trainings.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                    >
                      <div>
                        <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                          #{t.id}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-2">{t.title}</h3>
                        <p className="text-xs text-slate-500">{t.category} · {t.department}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-mono">
                          Passing Grade: &ge; {t.passingGrade}
                        </span>
                        <button
                          onClick={() => setReportModalTraining(t)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          Buka Laporan Eksekutif
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* User (Karyawan) Views */
          <div>
            <KaryawanDashboard
              currentUser={currentUser}
              trainings={trainings}
              questions={questions}
              results={results}
              onStartExam={handleStartExam}
              activeSubTab={activeTab === 'certificates' ? 'certificates' : 'exams'}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-400">
        <p>
          HR Training Evaluation System (Pretest & Posttest) · Terhubung ke Google Cloud SQL PostgreSQL (asia-southeast1)
        </p>
      </footer>

      {/* Exam Result Modal */}
      {resultModalData && (
        <ExamResultModal
          result={resultModalData.result}
          training={resultModalData.training}
          user={currentUser}
          pretestResult={resultModalData.pretestResult}
          onViewCertificate={() => {
            const tr = resultModalData.training;
            const res = resultModalData.result;
            setResultModalData(null);
            setCertificateModalData({
              training: tr,
              user: currentUser,
              result: res,
            });
          }}
          onClose={() => setResultModalData(null)}
        />
      )}

      {/* Direct Certificate Modal */}
      {certificateModalData && (
        <CertificateModal
          training={certificateModalData.training}
          user={certificateModalData.user}
          result={certificateModalData.result}
          onClose={() => setCertificateModalData(null)}
        />
      )}

      {/* Executive Report Standalone Modal */}
      {reportModalTraining && (
        <ExecutiveReportModal
          training={reportModalTraining}
          users={users}
          results={results}
          logs={logs}
          onClose={() => setReportModalTraining(null)}
        />
      )}

      {/* QR Certificate Verification Lookup Modal */}
      {showLookupModal && (
        <VerificationLookupModal
          trainings={trainings}
          results={results}
          users={users}
          onClose={() => setShowLookupModal(false)}
        />
      )}

      {/* Admin Management Modal (Master Developer & Admins) */}
      {showAdminManagementModal && (
        <AdminManagementModal
          currentUser={currentUser}
          onClose={() => setShowAdminManagementModal(false)}
          onAdminListChanged={loadAllData}
        />
      )}
    </div>
  );
}
