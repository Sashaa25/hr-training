import React, { useState } from 'react';
import { TrainingSession, Question, ExamResult, User, ExamType } from '../../types';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  Unlock,
  Award,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { CertificateModal } from './CertificateModal';

interface KaryawanDashboardProps {
  currentUser: User;
  trainings: TrainingSession[];
  questions: Question[];
  results: ExamResult[];
  onStartExam: (training: TrainingSession, examType: ExamType) => void;
  activeSubTab?: 'exams' | 'certificates';
}

export const KaryawanDashboard: React.FC<KaryawanDashboardProps> = ({
  currentUser,
  trainings,
  questions,
  results,
  onStartExam,
  activeSubTab = 'exams',
}) => {
  const [selectedCertResult, setSelectedCertResult] = useState<{
    training: TrainingSession;
    result: ExamResult;
  } | null>(null);

  const [karyawanTab, setKaryawanTab] = useState<'active' | 'history'>('active');
  const todayStr = new Date().toISOString().slice(0, 10);

  const isTrainingCompleted = (t: TrainingSession) => {
    if (t.status === 'completed') return true;
    if (t.endDate && t.endDate < todayStr) return true;
    return false;
  };

  const userEmailLower = currentUser.email?.toLowerCase() || '';
  const isAssigned = (t: TrainingSession) => {
    const emails = t.certificateSettings?.assignedEmails || [];
    return emails.map(e => e.toLowerCase()).includes(userEmailLower);
  };

  const activeTrainings = trainings.filter((t) => !isTrainingCompleted(t) && isAssigned(t));
  const historyTrainings = trainings.filter((t) => isTrainingCompleted(t) && isAssigned(t));
  const displayedTrainings = karyawanTab === 'active' ? activeTrainings : historyTrainings;

  // Filter results for current employee
  const myResults = results.filter((r) => r.userId === currentUser.id);

  // All completed posttests that passed
  const passedCertificates = myResults
    .filter((r) => r.examType === 'posttest' && r.passed && r.certificateId)
    .map((res) => {
      const tr = trainings.find((t) => t.id === res.trainingId);
      return { result: res, training: tr };
    })
    .filter((item): item is { result: ExamResult; training: TrainingSession } => !!item.training);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{currentUser.name}</h1>
                <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {currentUser.nik}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser.position} · {currentUser.department}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center min-w-[80px]">
              <p className="text-slate-400 text-[10px]">Ujian Diikuti</p>
              <p className="text-base font-bold text-slate-900">{myResults.length}</p>
            </div>
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-center min-w-[80px]">
              <p className="text-emerald-700 text-[10px]">Sertifikat</p>
              <p className="text-base font-bold text-emerald-800">{passedCertificates.length}</p>
            </div>
          </div>
        </div>
      </div>

      {activeSubTab === 'certificates' ? (
        /* Certificates Collection View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Koleksi E-Sertifikat Kelulusan ({passedCertificates.length})
            </h2>
            <span className="text-xs text-slate-500">
              *Tiap sertifikat memuat QR Code terenkripsi yang dapat diverifikasi keasliannya
            </span>
          </div>

          {passedCertificates.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              <Award className="w-12 h-12 mx-auto stroke-1 mb-2 opacity-50" />
              <p className="text-sm font-medium text-slate-700">Belum ada e-sertifikat yang diterbitkan.</p>
              <p className="text-xs text-slate-400 mt-1">
                Selesaikan ujian Posttest dengan nilai minimal &ge; 70 untuk memperoleh sertifikat otomatis.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {passedCertificates.map(({ result, training }) => (
                <div
                  key={result.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-indigo-300 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                        {result.certificateId}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">{training.title}</h3>
                      <p className="text-xs text-slate-500">{training.category}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Award className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400">Skor Kelulusan: </span>
                      <strong className="font-mono text-emerald-700 font-bold">{result.score}/100</strong>
                    </div>
                    <button
                      onClick={() => setSelectedCertResult({ training, result })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Lihat & Unduh PDF</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Training & Exams List View */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setKaryawanTab('active')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  karyawanTab === 'active'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sesi Berjalan ({activeTrainings.length})
              </button>
              <button
                onClick={() => setKaryawanTab('history')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  karyawanTab === 'history'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Histori Pelatihan Selesai ({historyTrainings.length})
              </button>
            </div>

            <span className="text-xs text-slate-500">
              *Pelaksanaan ujian diawasi kamera aktif & mode fullscreen (Maksimal 3 peringatan)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {displayedTrainings.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto w-full my-6">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {karyawanTab === 'active'
                    ? 'Belum Ditugaskan ke Kelas Mana pun'
                    : 'Belum Ada Histori Kelas'}
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {karyawanTab === 'active'
                    ? 'Akun Anda aktif sebagai peserta, namun administrator HR belum menandai atau mendaftarkan akun email Anda ke dalam kelas pelatihan mana pun.'
                    : 'Anda belum memiliki riwayat kelas pelatihan yang selesai.'}
                </p>
                {karyawanTab === 'active' && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Alamat Email Terdaftar</span>
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">{currentUser.email}</span>
                  </div>
                )}
              </div>
            ) : (
              displayedTrainings.map((t) => {
              const preResult = myResults.find((r) => r.trainingId === t.id && r.examType === 'pretest');
              const postResult = myResults.find((r) => r.trainingId === t.id && r.examType === 'posttest');

              const hasCompletedPre = !!preResult;
              const hasCompletedPost = !!postResult;
              const isPostUnlocked = t.isPosttestUnlocked;

              const isPostPassed = postResult && postResult.score >= t.passingGrade;

              return (
                <div
                  key={t.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5"
                >
                  {/* Training Info Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          #{t.id}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{t.title}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 max-w-2xl">{t.description}</p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 shrink-0 font-mono">
                      <span>Durasi: <strong>{t.durationMinutes} Menit</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>Passing Grade: <strong className="text-indigo-700">&ge; {t.passingGrade}</strong></span>
                    </div>
                  </div>

                  {/* 2-Step Exam Flow: Pretest & Posttest Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pretest Step */}
                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        hasCompletedPre
                          ? 'bg-slate-50/70 border-slate-200'
                          : 'bg-white border-indigo-200 ring-1 ring-indigo-100 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                            1
                          </span>
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                            Pretest (Asesmen Awal)
                          </span>
                        </div>
                        {hasCompletedPre && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Selesai
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                        Mengukur pemahaman dasar Anda sebelum materi pelatihan dipaparkan. Nilai tidak menentukan kelulusan.
                      </p>

                      {hasCompletedPre ? (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                          <span className="text-slate-500">Skor Diperoleh:</span>
                          <span className="font-mono text-base font-bold text-slate-800">
                            {preResult.score} <span className="text-xs font-normal text-slate-400">/ 100</span>
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onStartExam(t, 'pretest')}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Mulai Pretest Sekarang</span>
                        </button>
                      )}
                    </div>

                    {/* Posttest Step */}
                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        hasCompletedPost
                          ? 'bg-slate-50/70 border-slate-200'
                          : !hasCompletedPre
                          ? 'bg-slate-50/50 border-slate-200 opacity-60'
                          : isPostUnlocked
                          ? 'bg-white border-indigo-200 ring-1 ring-indigo-100 shadow-2xs'
                          : 'bg-amber-50/40 border-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                              hasCompletedPost || isPostUnlocked
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-300 text-slate-600'
                            }`}
                          >
                            2
                          </span>
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                            Posttest (Evaluasi Akhir)
                          </span>
                        </div>

                        {hasCompletedPost ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isPostPassed
                                ? 'text-emerald-800 bg-emerald-100'
                                : 'text-rose-800 bg-rose-100'
                            }`}
                          >
                            {isPostPassed ? 'LULUS EVALUASI' : 'BELUM LULUS'}
                          </span>
                        ) : !isPostUnlocked ? (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Terkunci
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Unlock className="w-3 h-3" /> Akses Dibuka
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                        Evaluasi capaian materi setelah sesi training. Skor &ge; {t.passingGrade} otomatis menerbitkan e-sertifikat ber-QR code.
                      </p>

                      {hasCompletedPost ? (
                        <div className="space-y-3 pt-2 border-t border-slate-200">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Skor Posttest:</span>
                            <span className="font-mono text-base font-bold text-slate-900">
                              {postResult.score} <span className="text-xs font-normal text-slate-400">/ 100</span>
                            </span>
                          </div>

                          {isPostPassed && (
                            <button
                              onClick={() => setSelectedCertResult({ training: t, result: postResult })}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                            >
                              <Award className="w-4 h-4" />
                              <span>Buka / Unduh E-Sertifikat Digital</span>
                            </button>
                          )}
                        </div>
                      ) : !hasCompletedPre ? (
                        <div className="py-2 text-center text-xs text-slate-400 italic">
                          Selesaikan modul Pretest terlebih dahulu.
                        </div>
                      ) : !isPostUnlocked ? (
                        <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Akses Posttest masih ditutup. Admin HR akan membukanya setelah sesi materi selesai.</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onStartExam(t, 'posttest')}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Mulai Posttest Sekarang (Webcam Aktif)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {selectedCertResult && (
        <CertificateModal
          training={selectedCertResult.training}
          user={currentUser}
          result={selectedCertResult.result}
          onClose={() => setSelectedCertResult(null)}
        />
      )}
    </div>
  );
};
