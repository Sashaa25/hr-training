import React, { useState } from 'react';
import { TrainingSession, Question, ExamResult, User, ProctorLog, CertificateSettings } from '../../types';
import { DEFAULT_CERT_SETTINGS } from '../../data/initialData';
import {
  BookOpen,
  Lock,
  Unlock,
  FileSpreadsheet,
  Award,
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  Settings,
  HelpCircle,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  Trash2,
  Archive,
  PlayCircle,
  CheckSquare,
  UserCheck,
  KeyRound,
} from 'lucide-react';
import { QuestionBankModal } from './QuestionBankModal';
import { ExecutiveReportModal } from './ExecutiveReportModal';
import { CertificateSettingsModal } from './CertificateSettingsModal';

interface TrainingManagerProps {
  trainings: TrainingSession[];
  questions: Question[];
  results: ExamResult[];
  users: User[];
  logs: ProctorLog[];
  onUpdateTraining: (training: TrainingSession) => void;
  onDeleteTraining: (id: string) => void;
  onSaveQuestions: (questions: Question[]) => void;
  onDeleteQuestion: (id: string) => void;
  onSelectTab: (tab: string) => void;
  onOpenAdminManagement?: () => void;
}

export const TrainingManager: React.FC<TrainingManagerProps> = ({
  trainings,
  questions,
  results,
  users,
  logs,
  onUpdateTraining,
  onDeleteTraining,
  onSaveQuestions,
  onDeleteQuestion,
  onSelectTab,
  onOpenAdminManagement,
}) => {
  const [selectedTrainingForBank, setSelectedTrainingForBank] = useState<TrainingSession | null>(null);
  const [selectedTrainingForReport, setSelectedTrainingForReport] = useState<TrainingSession | null>(null);
  const [selectedTrainingForCertSettings, setSelectedTrainingForCertSettings] = useState<TrainingSession | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // States for Assignment Modal
  const [selectedTrainingForAssign, setSelectedTrainingForAssign] = useState<TrainingSession | null>(null);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');
  const [assignedEmailsLocal, setAssignedEmailsLocal] = useState<string[]>([]);

  const openAssignModal = (t: TrainingSession) => {
    setSelectedTrainingForAssign(t);
    setAssignedEmailsLocal(t.certificateSettings?.assignedEmails || []);
    setAssignSearchQuery('');
  };

  // Tab: 'active' | 'history'
  const [sessionFilterTab, setSessionFilterTab] = useState<'active' | 'history'>('active');
  const [sessionToDelete, setSessionToDelete] = useState<TrainingSession | null>(null);

  // New Training Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Manajerial & Kepemimpinan');
  const [newDept, setNewDept] = useState('Lintas Divisi (All Departments)');
  const [newDescription, setNewDescription] = useState('');
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [newEndDate, setNewEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [newDuration, setNewDuration] = useState(15);
  const [newPassingGrade, setNewPassingGrade] = useState(70);
  const [newTrainerName, setNewTrainerName] = useState('Dr. Rian Hidayat, M.M., CPC');
  const [newTrainerTitle, setNewTrainerTitle] = useState('Lead Executive Leadership Coach');

  const todayStr = new Date().toISOString().slice(0, 10);

  // Helper to determine if training is completed (either manually status === 'completed' or endDate < today)
  const isTrainingCompleted = (t: TrainingSession) => {
    if (t.status === 'completed') return true;
    if (t.endDate && t.endDate < todayStr) return true;
    return false;
  };

  const activeTrainings = trainings.filter((t) => !isTrainingCompleted(t));
  const historyTrainings = trainings.filter((t) => isTrainingCompleted(t));

  const displayedTrainings = sessionFilterTab === 'active' ? activeTrainings : historyTrainings;

  const handleCreateTraining = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTraining: TrainingSession = {
      id: `tr-${Date.now().toString().slice(-4)}`,
      title: newTitle.trim(),
      category: newCategory,
      department: newDept,
      description: newDescription.trim() || 'Modul evaluasi pelatihan terpadu HR.',
      startDate: newStartDate,
      endDate: newEndDate,
      durationMinutes: Number(newDuration) || 15,
      passingGrade: Number(newPassingGrade) || 70,
      isPosttestUnlocked: false,
      status: 'active',
      trainerName: newTrainerName.trim() || 'Fasilitator HR Internal',
      trainerTitle: newTrainerTitle.trim() || 'HR Master Facilitator',
      certificateSettings: {
        ...DEFAULT_CERT_SETTINGS,
        trainerName: newTrainerName.trim() || DEFAULT_CERT_SETTINGS.trainerName,
        trainerTitle: newTrainerTitle.trim() || DEFAULT_CERT_SETTINGS.trainerTitle,
      },
    };

    onUpdateTraining(newTraining);
    setShowNewModal(false);
    setNewTitle('');
    setNewDescription('');
  };

  const togglePosttestLock = (training: TrainingSession) => {
    const updated = {
      ...training,
      isPosttestUnlocked: !training.isPosttestUnlocked,
    };
    onUpdateTraining(updated);
  };

  const toggleTrainingStatus = (training: TrainingSession) => {
    const isComp = isTrainingCompleted(training);
    const updated: TrainingSession = {
      ...training,
      status: isComp ? 'active' : 'completed',
      // If reopening an expired date, extend endDate by 14 days
      endDate: isComp && training.endDate < todayStr
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        : training.endDate,
    };
    onUpdateTraining(updated);
  };

  const handleDelete = (training: TrainingSession) => {
    setSessionToDelete(training);
  };

  const employees = users.filter((u) => u.role === 'karyawan');

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview Metrics */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                <BookOpen className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900">Manajemen Modul Pelatihan HR</h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Kelola sesi pelatihan aktif & histori selesai, hapus sesi, atur trainer & sertifikat, serta impor bank soal multimedia.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenAdminManagement && (
              <button
                onClick={onOpenAdminManagement}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kelola Hak Akses Admin</span>
              </button>
            )}
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Sesi Pelatihan Baru</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <p className="text-slate-400">Sesi Sedang Berjalan</p>
            <p className="text-xl font-bold font-mono text-indigo-700 mt-0.5">{activeTrainings.length}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <p className="text-slate-400">Histori Sesi Selesai</p>
            <p className="text-xl font-bold font-mono text-slate-700 mt-0.5">{historyTrainings.length}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <p className="text-slate-400">Total Peserta Karyawan</p>
            <p className="text-xl font-bold font-mono text-slate-900 mt-0.5">{employees.length}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <p className="text-slate-400">Insiden Proctoring</p>
            <p className="text-xl font-bold font-mono text-rose-600 mt-0.5">{logs.length}</p>
          </div>
        </div>
      </div>

      {/* Sesi Berjalan vs Histori Selesai Segmented Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setSessionFilterTab('active')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              sessionFilterTab === 'active'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            <span>Sesi Sedang Berjalan ({activeTrainings.length})</span>
          </button>

          <button
            onClick={() => setSessionFilterTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              sessionFilterTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Histori Sesi Selesai ({historyTrainings.length})</span>
          </button>
        </div>

        <span className="text-xs text-slate-500">
          {sessionFilterTab === 'active'
            ? 'Menampilkan pelatihan yang aktif dan belum melewati batas waktu'
            : 'Menampilkan arsip sesi pelatihan yang telah rampung'}
        </span>
      </div>

      {/* Training Sessions List */}
      <div className="space-y-4">
        {displayedTrainings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto stroke-1 mb-2 opacity-50" />
            <p className="text-sm font-medium text-slate-700">
              {sessionFilterTab === 'active'
                ? 'Tidak ada sesi pelatihan yang sedang berjalan saat ini.'
                : 'Belum ada sesi pelatihan yang masuk ke histori.'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {sessionFilterTab === 'active'
                ? 'Klik tombol "Buat Sesi Pelatihan Baru" untuk memulai agenda pelatihan baru.'
                : 'Sesi akan otomatis masuk ke sini jika tanggal akhir telah lewat atau ditandai selesai.'}
            </p>
          </div>
        ) : (
          displayedTrainings.map((t) => {
            const trainingQuestions = questions.filter((q) => q.trainingId === t.id);
            const preCount = trainingQuestions.filter((q) => q.examType === 'pretest').length;
            const postCount = trainingQuestions.filter((q) => q.examType === 'posttest').length;
            const mediaCount = trainingQuestions.filter((q) => q.mediaType && q.mediaType !== 'none').length;

            const tResults = results.filter((r) => r.trainingId === t.id);
            const completedPost = tResults.filter((r) => r.examType === 'posttest').length;
            const passedCount = tResults.filter((r) => r.examType === 'posttest' && r.score >= t.passingGrade).length;

            const completed = isTrainingCompleted(t);

            return (
              <div
                key={t.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                        #{t.id}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{t.title}</h3>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500 font-medium">{t.category}</span>
                      {completed && (
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded uppercase">
                          Selesai / Diarsipkan
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">{t.description}</p>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>
                        Trainer / Fasilitator: <strong className="text-slate-800">{t.trainerName || 'Dr. Rian Hidayat, M.M.'}</strong>
                        {t.trainerTitle && <span className="text-slate-400"> ({t.trainerTitle})</span>}
                      </span>
                    </div>
                  </div>

                  {/* Top Right Action Buttons: Lock/Unlock & Status Toggle */}
                  <div className="shrink-0 flex flex-wrap items-center gap-2">
                    {/* Posttest Lock/Unlock Action Button */}
                    <button
                      onClick={() => togglePosttestLock(t)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                        t.isPosttestUnlocked
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      }`}
                      title={
                        t.isPosttestUnlocked
                          ? 'Akses Posttest saat ini TERBUKA untuk karyawan. Klik untuk mengunci.'
                          : 'Akses Posttest saat ini TERKUNCI. Klik untuk membuka akses setelah sesi pelatihan selesai.'
                      }
                    >
                      {t.isPosttestUnlocked ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Posttest Terbuka</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Posttest Terkunci</span>
                        </>
                      )}
                    </button>

                    {/* Selesaikan Pelatihan / Aktifkan Kembali Button */}
                    <button
                      onClick={() => toggleTrainingStatus(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      title={completed ? 'Kembalikan sesi ini ke daftar aktif' : 'Tandai sesi ini telah selesai dan pindahkan ke arsip histori'}
                    >
                      {completed ? (
                        <>
                          <PlayCircle className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Aktifkan Kembali</span>
                        </>
                      ) : (
                        <>
                          <CheckSquare className="w-3.5 h-3.5 text-slate-600" />
                          <span>Tandai Selesai</span>
                        </>
                      )}
                    </button>

                    {/* Delete Session Button (User Requirement) */}
                    <button
                      onClick={() => handleDelete(t)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Sesi Pelatihan Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {t.startDate} s/d {t.endDate}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Durasi: <strong className="font-mono text-slate-700">{t.durationMinutes}m</strong>
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      Passing Grade: <strong className="font-mono text-indigo-700">&ge; {t.passingGrade}</strong>
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Lulus: <strong className="font-mono text-slate-700">{passedCount}/{completedPost}</strong>
                    </span>
                  </div>

                  {/* Bank Soal Stats & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 text-xs font-mono mr-1 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                      <span>Pre: <strong className="text-slate-800">{preCount}</strong></span>
                      <span className="text-slate-300">|</span>
                      <span>Post: <strong className="text-slate-800">{postCount}</strong></span>
                      {mediaCount > 0 && (
                        <>
                          <span className="text-slate-300">|</span>
                          <span className="text-indigo-600 font-semibold">{mediaCount} Media</span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedTrainingForBank(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Bank Soal (Multimedia)</span>
                    </button>

                    <button
                      onClick={() => openAssignModal(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      title="Tandai / tugaskan karyawan mana saja yang boleh mengikuti kelas ini"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Penugasan Kelas ({t.certificateSettings?.assignedEmails?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setSelectedTrainingForCertSettings(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
                      title="Atur Logo, Trainer, Pejabat Penandatangan, dan Lokasi Sertifikat"
                    >
                      <Settings className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Atur Sertifikat & Trainer</span>
                    </button>

                    <button
                      onClick={() => setSelectedTrainingForReport(t)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-slate-200" />
                      <span>Laporan & Ekspor</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Bank Soal */}
      {selectedTrainingForBank && (
        <QuestionBankModal
          training={selectedTrainingForBank}
          questions={questions}
          onClose={() => setSelectedTrainingForBank(null)}
          onSaveQuestions={(newQ) => {
            onSaveQuestions(newQ);
          }}
          onDeleteQuestion={(id) => {
            onDeleteQuestion(id);
          }}
        />
      )}

      {/* Modal Executive Report */}
      {selectedTrainingForReport && (
        <ExecutiveReportModal
          training={selectedTrainingForReport}
          users={users}
          results={results}
          logs={logs}
          onClose={() => setSelectedTrainingForReport(null)}
        />
      )}

      {/* Modal Certificate & Trainer Settings */}
      {selectedTrainingForCertSettings && (
        <CertificateSettingsModal
          training={selectedTrainingForCertSettings}
          onSave={(updatedSettings) => {
            const updated: TrainingSession = {
              ...selectedTrainingForCertSettings,
              trainerName: updatedSettings.trainerName,
              trainerTitle: updatedSettings.trainerTitle,
              certificateSettings: updatedSettings,
            };
            onUpdateTraining(updated);
          }}
          onClose={() => setSelectedTrainingForCertSettings(null)}
        />
      )}

      {/* Create New Training Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Buat Sesi Pelatihan HR Baru</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTraining} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama / Judul Pelatihan:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Digital Transformation & Agile Mindset 2026"
                  className="w-full p-2 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none text-slate-900 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Pelatihan:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-800"
                  >
                    <option value="Manajerial & Kepemimpinan">Manajerial & Kepemimpinan</option>
                    <option value="Keamanan Informasi & Kepatuhan">Keamanan Informasi & Kepatuhan</option>
                    <option value="Komunikasi & Negosiasi">Komunikasi & Negosiasi</option>
                    <option value="Technical & Operations">Technical & Operations</option>
                    <option value="Culture & Core Values">Culture & Core Values</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Departemen Sasaran:</label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-800"
                    placeholder="Semua Divisi / Unit Kerja"
                  />
                </div>
              </div>

              {/* Trainer Inputs (User Requirement) */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Trainer:</label>
                  <input
                    type="text"
                    value={newTrainerName}
                    onChange={(e) => setNewTrainerName(e.target.value)}
                    placeholder="Contoh: Dr. Rian Hidayat, M.M."
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-slate-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gelar / Spesialisasi:</label>
                  <input
                    type="text"
                    value={newTrainerTitle}
                    onChange={(e) => setNewTrainerTitle(e.target.value)}
                    placeholder="Contoh: Senior Leadership Coach"
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Singkat:</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Tuliskan tujuan dan sasaran kompetensi pelatihan..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Mulai:</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Selesai:</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Durasi Pengerjaan Ujian:</label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-l-md"
                    />
                    <span className="p-2 bg-slate-100 border border-l-0 border-slate-300 rounded-r-md text-slate-500">
                      Menit
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Batas Lulus (Passing Grade):
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={newPassingGrade}
                      onChange={(e) => setNewPassingGrade(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-l-md font-bold text-indigo-700"
                    />
                    <span className="p-2 bg-slate-100 border border-l-0 border-slate-300 rounded-r-md text-slate-500">
                      Poin (Default 70)
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Simpan Sesi Pelatihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Replaces window.confirm for iframe safety) */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hapus Sesi Pelatihan?</h3>
                <p className="text-xs text-slate-500">Konfirmasi tindakan penghapusan</p>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3.5 text-xs text-rose-900 space-y-1.5">
              <p className="font-semibold text-rose-950">
                &ldquo;{sessionToDelete.title}&rdquo; (ID: #{sessionToDelete.id})
              </p>
              <p className="text-rose-700 leading-relaxed text-[11px]">
                Menghapus sesi ini akan menghapus seluruh butir soal ujian (pretest & posttest), nilai peserta, serta log proctoring terkait secara permanen dari database Cloud SQL.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = sessionToDelete.id;
                  setSessionToDelete(null);
                  onDeleteTraining(id);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Sesi</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Penugasan Peserta */}
      {selectedTrainingForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Penugasan Peserta</h3>
                  <p className="text-xs text-slate-500">Tentukan karyawan yang berhak mengakses sesi ini</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrainingForAssign(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 flex-1 overflow-y-auto">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs">
                <p className="font-bold text-slate-900 text-sm">{selectedTrainingForAssign.title}</p>
                <p className="text-slate-500 mt-1">{selectedTrainingForAssign.category} · {selectedTrainingForAssign.department}</p>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  * Catatan: Setelah disimpan, hanya karyawan yang dipilih di bawah ini yang akan melihat sesi ini pada dashboard &amp; bisa mengikuti Pretest/Posttest.
                </p>
              </div>

              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Cari nama, email, atau NIK karyawan..."
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                  className="p-2.5 text-xs border border-slate-300 rounded-lg w-full sm:max-w-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const allEmails = employees.map(u => u.email.toLowerCase());
                      setAssignedEmailsLocal(allEmails);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 cursor-pointer"
                  >
                    Pilih Semua ({employees.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignedEmailsLocal([])}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 cursor-pointer"
                  >
                    Kosongkan Semua
                  </button>
                </div>
              </div>

              {/* Employees List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[35vh] overflow-y-auto">
                {employees.filter(u => {
                  const q = assignSearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.nik.toLowerCase().includes(q);
                }).length === 0 ? (
                  <p className="p-8 text-center text-xs text-slate-400">Tidak ada karyawan yang cocok dengan pencarian.</p>
                ) : (
                  employees
                    .filter(u => {
                      const q = assignSearchQuery.toLowerCase().trim();
                      if (!q) return true;
                      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.nik.toLowerCase().includes(q);
                    })
                    .map((emp) => {
                      const isChecked = assignedEmailsLocal.includes(emp.email.toLowerCase());
                      return (
                        <label
                          key={emp.id}
                          className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAssignedEmailsLocal(prev => [...prev, emp.email.toLowerCase()]);
                                } else {
                                  setAssignedEmailsLocal(prev => prev.filter(email => email !== emp.email.toLowerCase()));
                                }
                              }}
                              className="w-4 h-4 text-indigo-600 border-slate-300 rounded-xs focus:ring-indigo-500"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{emp.name}</p>
                              <p className="text-slate-400 text-[11px] font-mono mt-0.5">{emp.nik} · {emp.email}</p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              isChecked
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {isChecked ? 'Ditugaskan' : 'Belum Ditugaskan'}
                          </span>
                        </label>
                      );
                    })
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Total ditugaskan: <strong>{assignedEmailsLocal.length}</strong> karyawan
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTrainingForAssign(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated: TrainingSession = {
                      ...selectedTrainingForAssign,
                      certificateSettings: {
                        ...(selectedTrainingForAssign.certificateSettings || DEFAULT_CERT_SETTINGS as any),
                        assignedEmails: assignedEmailsLocal,
                      },
                    };
                    onUpdateTraining(updated);
                    setSelectedTrainingForAssign(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan Penugasan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
