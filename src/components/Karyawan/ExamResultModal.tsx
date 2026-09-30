import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { TrainingSession, ExamResult, User } from '../../types';
import { Award, CheckCircle2, XCircle, TrendingUp, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface ExamResultModalProps {
  result: ExamResult;
  training: TrainingSession;
  user: User;
  pretestResult?: ExamResult;
  onViewCertificate?: () => void;
  onClose: () => void;
}

export const ExamResultModal: React.FC<ExamResultModalProps> = ({
  result,
  training,
  user,
  pretestResult,
  onViewCertificate,
  onClose,
}) => {
  const isPosttest = result.examType === 'posttest';
  const isPassed = isPosttest && result.score >= training.passingGrade && !result.disqualified;

  useEffect(() => {
    if (isPassed) {
      // Trigger interactive confetti celebration as required in Section 8.B
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#4f46e5', '#10b981', '#f59e0b', '#3b82f6'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isPassed]);

  const preScore = pretestResult?.score;
  const deltaScore = preScore !== undefined ? result.score - preScore : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Result Header Badge */}
        <div className="text-center space-y-3">
          {result.disqualified ? (
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-9 h-9" />
            </div>
          ) : isPassed ? (
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
              <Award className="w-9 h-9" />
            </div>
          ) : isPosttest ? (
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-9 h-9" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
          )}

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-400">
              HASIL EVALUASI {result.examType.toUpperCase()}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              {result.disqualified
                ? 'Didiskualifikasi (Pelanggaran Proctoring)'
                : isPassed
                ? 'Selamat! Anda Dinyatakan Lulus'
                : isPosttest
                ? 'Belum Memenuhi Batas Kelulusan'
                : 'Pretest Berhasil Diselesaikan'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">{training.title}</p>
          </div>
        </div>

        {/* Score Display Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Skor Yang Diperoleh:
          </p>
          <div className="flex items-baseline justify-center gap-1 font-mono">
            <span
              className={`text-5xl font-black ${
                result.disqualified
                  ? 'text-rose-600'
                  : isPassed
                  ? 'text-emerald-600'
                  : isPosttest
                  ? 'text-amber-600'
                  : 'text-indigo-600'
              }`}
            >
              {result.score}
            </span>
            <span className="text-slate-400 font-bold text-lg">/ 100</span>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200/80 font-mono">
            <span>
              Jawaban Benar: <strong className="text-slate-800">{result.correctAnswers}/{result.totalQuestions}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Durasi: <strong className="text-slate-800">{Math.floor(result.durationSeconds / 60)}m {result.durationSeconds % 60}s</strong>
            </span>
          </div>
        </div>

        {/* Pretest vs Posttest Delta Comparison (if Posttest) */}
        {isPosttest && preScore !== undefined && (
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="font-semibold text-indigo-950">Perbandingan Pemahaman (Delta):</p>
                <p className="text-[11px] text-indigo-700">
                  Pretest: <strong className="font-mono">{preScore}</strong> &rarr; Posttest: <strong className="font-mono">{result.score}</strong>
                </p>
              </div>
            </div>
            <div className="text-right font-mono">
              <span
                className={`text-sm font-bold ${
                  deltaScore !== null && deltaScore >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {deltaScore !== null && deltaScore >= 0 ? `+${deltaScore}` : deltaScore} poin
              </span>
            </div>
          </div>
        )}

        {/* Information Notice based on Status */}
        {result.disqualified ? (
          <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-lg border border-rose-200">
            Nilai Anda dibatalkan menjadi 0 karena terdeteksi 3 kali pelanggaran protokol keamanan proctoring (keluar fullscreen atau berpindah jendela browser).
          </p>
        ) : isPassed ? (
          <p className="text-xs text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
            Skor Anda memenuhi standar passing grade (&ge; {training.passingGrade}). E-Sertifikat kelulusan resmi ber-QR Code telah otomatis diterbitkan untuk Anda!
          </p>
        ) : isPosttest ? (
          <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">
            Skor Anda belum mencapai batas standar kelulusan minimum ({training.passingGrade} poin). Silakan berkoordinasi dengan tim HR untuk sesi pendampingan materi.
          </p>
        ) : (
          <p className="text-xs text-indigo-800 bg-indigo-50 p-3 rounded-lg border border-indigo-200">
            Hasil Pretest tersimpan sebagai acuan pembanding awal. Akses Posttest akan terbuka setelah sesi pelatihan HR selesai dilaksanakan.
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isPassed && onViewCertificate && (
            <button
              onClick={onViewCertificate}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Buka E-Sertifikat Saya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
