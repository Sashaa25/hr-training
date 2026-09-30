import React, { useState } from 'react';
import { TrainingSession, User, ExamResult, ProctorLog } from '../../types';
import { calculateMetrics, downloadNarrativeWordReport, printFormalPdfReport } from '../../utils/exportHelper';
import { exportExamResultsToExcel } from '../../utils/excelHelper';
import {
  X,
  FileSpreadsheet,
  FileText,
  Printer,
  TrendingUp,
  Award,
  Users,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Camera,
} from 'lucide-react';

interface ExecutiveReportModalProps {
  training: TrainingSession;
  users: User[];
  results: ExamResult[];
  logs: ProctorLog[];
  onClose: () => void;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  training,
  users,
  results,
  logs,
  onClose,
}) => {
  const [activeView, setActiveView] = useState<'interactive' | 'formal_pdf_preview'>('interactive');

  const metrics = calculateMetrics(training, users, results);
  const employees = users.filter((u) => u.role === 'karyawan');
  const trainingLogs = logs.filter((l) => l.trainingId === training.id);
  const violationLogs = trainingLogs.filter((l) => l.severity === 'high' || l.severity === 'medium');

  const handleExportExcel = () => {
    exportExamResultsToExcel(training, users, results);
  };

  const handleExportWord = () => {
    downloadNarrativeWordReport(training, users, results);
  };

  const handlePrintPdf = () => {
    printFormalPdfReport();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Header (Hidden when printing) */}
        <div className="no-print px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Laporan Eksekutif Evaluasi Pelatihan</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Program: <strong className="text-slate-800">{training.title}</strong> · Passing Grade: Skor &ge; {training.passingGrade}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3-Format Export Action Bar (Hidden when printing) */}
        <div className="no-print px-6 py-3.5 bg-indigo-50/40 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              Ekspor Hasil Evaluasi:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Format 1: Excel */}
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Unduh tabel lengkap mentah & perhitungan Delta format Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>1. Format Excel (.xlsx)</span>
            </button>

            {/* Format 2: Word */}
            <button
              onClick={handleExportWord}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-white hover:bg-blue-50 border border-blue-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Unduh laporan naratif otomatis berbasis template teks format Word"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>2. Format Word (.doc)</span>
            </button>

            {/* Format 3: PDF */}
            <button
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Cetak atau simpan sebagai PDF laporan read-only berinfografis"
            >
              <Printer className="w-4 h-4 text-slate-200" />
              <span>3. Format PDF (.pdf / Cetak)</span>
            </button>
          </div>
        </div>

        {/* Report Content Body (Printable area) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 print:p-0 print:space-y-4 print-container">
          {/* Executive Header Banner */}
          <div className="border-b border-slate-200 pb-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  DOKUMEN RESMI EVALUASI SDM · PT CIPTA INOVASI PERSADA
                </p>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  Laporan Hasil Evaluasi Pelatihan (Pretest & Posttest)
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Modul: <span className="font-semibold text-slate-900">{training.title}</span> ({training.category}) · Divisi: {training.department}
                </p>
              </div>
              <div className="text-right text-xs font-mono text-slate-500 hidden sm:block">
                <p>Status: Laporan Final</p>
                <p>Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Narrative Summary Highlight Box (Word template requirement) */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Kesimpulan Naratif Efektivitas Pelatihan
                </h3>
                <p className="text-sm font-medium text-indigo-950 mt-1.5 leading-relaxed">
                  &ldquo;Evaluasi pelatihan <strong className="font-bold">{training.title}</strong> menunjukkan peningkatan nilai rata-rata karyawan sebesar{' '}
                  <strong className="text-indigo-700 underline decoration-indigo-300">
                    {metrics.deltaPercent >= 0 ? '+' : ''}{metrics.deltaPercent}%
                  </strong>{' '}
                  dari Pretest (rata-rata <strong>{metrics.avgPretestScore}</strong> poin) ke Posttest (rata-rata <strong>{metrics.avgPosttestScore}</strong> poin), dengan tingkat kelulusan peserta mencapai{' '}
                  <strong className="text-indigo-700">{metrics.passRate}%</strong>.&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* 4 Quantitative Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs font-medium text-slate-500">Rata-rata Pretest</p>
              <p className="text-2xl font-bold font-mono text-slate-700 mt-1">
                {metrics.avgPretestScore}
                <span className="text-xs font-normal text-slate-400 ml-1">/ 100</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Pemahaman Awal</p>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 text-center">
              <p className="text-xs font-medium text-indigo-800">Rata-rata Posttest</p>
              <p className="text-2xl font-bold font-mono text-indigo-700 mt-1">
                {metrics.avgPosttestScore}
                <span className="text-xs font-normal text-indigo-400 ml-1">/ 100</span>
              </p>
              <p className="text-[11px] text-indigo-600 mt-1">Hasil Evaluasi Akhir</p>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-xs font-medium text-emerald-800">Kenaikan Kompetensi (&Delta;)</p>
              <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                {metrics.deltaPercent >= 0 ? '+' : ''}{metrics.deltaPercent}%
              </p>
              <p className="text-[11px] text-emerald-600 mt-1">
                +{metrics.deltaScore} poin peningkatan
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs font-medium text-slate-500">Tingkat Kelulusan</p>
              <p className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {metrics.passRate}%
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {metrics.passCount} dari {metrics.completedPosttest} Lulus
              </p>
            </div>
          </div>

          {/* Dynamic Infographics Bar Chart (Section 6.3 & 8.B requirement) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Infografis Perbandingan Nilai: Pretest vs Posttest Peserta
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-xs bg-slate-300" />
                  Pretest
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-3 h-3 rounded-xs bg-indigo-600" />
                  Posttest
                </span>
                <span className="flex items-center gap-1.5 text-slate-400 font-mono">
                  (Passing Grade: {training.passingGrade})
                </span>
              </div>
            </div>

            {/* Visual Bar Comparison per participant */}
            <div className="space-y-4 pt-2">
              {employees.map((emp) => {
                const pre = results.find(
                  (r) => r.userId === emp.id && r.trainingId === training.id && r.examType === 'pretest'
                );
                const post = results.find(
                  (r) => r.userId === emp.id && r.trainingId === training.id && r.examType === 'posttest'
                );

                const preScore = pre ? pre.score : 0;
                const postScore = post ? post.score : 0;
                const isPassed = post && post.score >= training.passingGrade;

                return (
                  <div key={emp.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        {emp.name} <span className="font-normal text-slate-400">({emp.department})</span>
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-slate-500">Pre: {pre ? `${preScore}` : '-'}</span>
                        <span>&rarr;</span>
                        <span className={`font-bold ${isPassed ? 'text-emerald-600' : 'text-slate-800'}`}>
                          Post: {post ? `${postScore}` : '-'}
                        </span>
                        {post && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-sans font-bold ${
                              isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isPassed ? 'LULUS' : 'REMEDIAL'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Comparative Double Bar */}
                    <div className="space-y-1">
                      {/* Pretest Bar */}
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex items-center">
                        <div
                          className="h-full bg-slate-300 rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${Math.min(100, Math.max(4, preScore))}%` }}
                        />
                      </div>
                      {/* Posttest Bar */}
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex items-center">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            isPassed ? 'bg-indigo-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(4, postScore))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Participant Questionnaire Feedback Analysis */}
          {(() => {
            const postResults = results.filter((r) => r.trainingId === training.id && r.examType === 'posttest');
            const feedbackResults = postResults.filter((r) => r.userAnswers && (r.userAnswers as any).__feedback);

            if (feedbackResults.length === 0) {
              return (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 text-center text-slate-500 text-xs">
                  <p className="font-semibold text-slate-700">Evaluasi Kuesioner Wajib (Posttest) Belum Terisi</p>
                  <p className="text-[11px] text-slate-400 mt-1">Umpan balik wajib diisi oleh peserta karyawan setelah mereka menyelesaikan ujian Posttest.</p>
                </div>
              );
            }

            let totalTrainer = 0;
            let totalModule = 0;
            let totalPlatform = 0;

            feedbackResults.forEach((r) => {
              const fb = (r.userAnswers as any).__feedback;
              totalTrainer += Number(fb.trainerRating || 0);
              totalModule += Number(fb.moduleRating || 0);
              totalPlatform += Number(fb.platformRating || 0);
            });

            const avgTrainer = (totalTrainer / feedbackResults.length).toFixed(1);
            const avgModule = (totalModule / feedbackResults.length).toFixed(1);
            const avgPlatform = (totalPlatform / feedbackResults.length).toFixed(1);

            return (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Umpan Balik Kuesioner Evaluasi & Kualitas Program (ISO 9001)
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                    {feedbackResults.length} Tanggapan Terkumpul
                  </span>
                </div>

                {/* Quantitative Ratings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">1. Efektivitas Trainer</p>
                    <p className="text-xl font-bold font-mono text-slate-900 flex items-baseline gap-1.5 pt-0.5">
                      ★ {avgTrainer} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                    </p>
                    <div className="flex text-amber-400 text-xs">
                      {"★".repeat(Math.round(Number(avgTrainer)))}
                      {"☆".repeat(5 - Math.round(Number(avgTrainer)))}
                    </div>
                    <p className="text-[10px] text-slate-400 pt-0.5">Fasilitator: {training.trainerName}</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">2. Kualitas Modul</p>
                    <p className="text-xl font-bold font-mono text-slate-900 flex items-baseline gap-1.5 pt-0.5">
                      ★ {avgModule} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                    </p>
                    <div className="flex text-amber-400 text-xs">
                      {"★".repeat(Math.round(Number(avgModule)))}
                      {"☆".repeat(5 - Math.round(Number(avgModule)))}
                    </div>
                    <p className="text-[10px] text-slate-400 pt-0.5">Relevansi & Nilai Kegunaan</p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 space-y-1">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">3. Platform & Proctoring</p>
                    <p className="text-xl font-bold font-mono text-slate-900 flex items-baseline gap-1.5 pt-0.5">
                      ★ {avgPlatform} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                    </p>
                    <div className="flex text-amber-400 text-xs">
                      {"★".repeat(Math.round(Number(avgPlatform)))}
                      {"☆".repeat(5 - Math.round(Number(avgPlatform)))}
                    </div>
                    <p className="text-[10px] text-slate-400 pt-0.5">Kemudahan Ujian & Keamanan</p>
                  </div>
                </div>

                {/* Qualitative Responses Scroll Area */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Rencana Penerapan Kompetensi & Saran Peserta:
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-3 pr-2 divide-y divide-slate-100">
                    {feedbackResults.map((r) => {
                      const fb = (r.userAnswers as any).__feedback;
                      return (
                        <div key={r.id} className="pt-3 text-xs space-y-2 first:pt-0">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-900">{r.userName} ({r.department})</span>
                            <span className="text-slate-400 font-mono text-[10px]">Skor Posttest: {r.score}</span>
                          </div>
                          <div className="space-y-1 bg-slate-50/70 p-2.5 rounded-lg border border-slate-150 text-[11px]">
                            <p className="text-slate-700 leading-relaxed">
                              <strong className="text-indigo-700">Kompetensi didapatkan:</strong> &ldquo;{fb.learningTakeaway}&rdquo;
                            </p>
                            {fb.suggestions && (
                              <p className="text-slate-600 italic">
                                <strong>Saran perbaikan:</strong> &ldquo;{fb.suggestions}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Full Participant Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Tabel Lengkap Rekapitulasi Nilai Seluruh Karyawan
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {employees.length} Peserta Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3.5 text-center">No</th>
                    <th className="py-3 px-3.5">Karyawan</th>
                    <th className="py-3 px-3.5">Departemen</th>
                    <th className="py-3 px-3.5 text-center">Skor Pre</th>
                    <th className="py-3 px-3.5 text-center">Skor Post</th>
                    <th className="py-3 px-3.5 text-center">Kenaikan (&Delta;)</th>
                    <th className="py-3 px-3.5 text-center">Durasi Post</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5 text-center">e-Sertifikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp, idx) => {
                    const pre = results.find(
                      (r) => r.userId === emp.id && r.trainingId === training.id && r.examType === 'pretest'
                    );
                    const post = results.find(
                      (r) => r.userId === emp.id && r.trainingId === training.id && r.examType === 'posttest'
                    );

                    const preScore = pre ? pre.score : null;
                    const postScore = post ? post.score : null;
                    const delta =
                      preScore !== null && postScore !== null ? postScore - preScore : null;
                    const isPassed = post && post.score >= training.passingGrade;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-slate-900">{emp.name}</div>
                          <div className="font-mono text-slate-400 text-[10px]">{emp.nik}</div>
                        </td>
                        <td className="py-3 px-3.5 text-slate-600">{emp.department}</td>
                        <td className="py-3 px-3.5 text-center font-mono">
                          {preScore !== null ? preScore : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-900">
                          {postScore !== null ? postScore : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono">
                          {delta !== null ? (
                            <span className={delta >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600'}>
                              {delta >= 0 ? `+${delta}` : delta}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono text-slate-500">
                          {post ? `${Math.floor(post.durationSeconds / 60)}m ${post.durationSeconds % 60}s` : '-'}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          {post ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPassed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isPassed ? 'LULUS' : 'GAGAL'}
                            </span>
                          ) : pre ? (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                              Menunggu Posttest
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Belum Ujian</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-center font-mono text-[10px]">
                          {post?.certificateId ? (
                            <span className="text-indigo-600 font-semibold">{post.certificateId}</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 6.3 Requirement: Lampiran foto bukti jika terdapat catatan kecurangan */}
          {violationLogs.length > 0 && (
            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  Lampiran Bukti Pengawasan Proctoring (Audit Kecurangan)
                </h3>
              </div>
              <p className="text-xs text-rose-800">
                Sistem proctoring mencatat riwayat insiden di bawah ini selama ujian berlangsung untuk tinjauan dewan HR:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {violationLogs.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 bg-white border border-rose-200 rounded-lg flex items-start gap-3 shadow-2xs"
                  >
                    <div className="w-16 h-12 bg-slate-800 rounded shrink-0 overflow-hidden flex items-center justify-center">
                      {v.snapshotUrl ? (
                        <img src={v.snapshotUrl} alt="Violation Snapshot" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-slate-900">
                        {v.userName} ({v.userNik})
                      </p>
                      <p className="text-[11px] font-semibold text-rose-700">
                        {v.violationType === 'tab_switch' ? 'Peralihan Tab Browser' : 'Keluar Layar Penuh'}
                      </p>
                      <p className="text-[11px] text-slate-600">{v.details}</p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {new Date(v.timestamp).toLocaleTimeString('id-ID')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formal Approval Signatures (Printable) */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-xs border-t border-slate-200">
            <div>
              <p className="text-slate-500">Disusun oleh:</p>
              <div className="h-16 flex items-end">
                <div>
                  <p className="font-bold text-slate-900 underline">Diana Rahardian, S.Psi.</p>
                  <p className="text-[11px] text-slate-500">Lead HR Training & Talent Development</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Disahkan oleh:</p>
              <div className="h-16 flex items-end justify-end">
                <div>
                  <p className="font-bold text-slate-900 underline">Ir. Hendra Kusuma, MBA</p>
                  <p className="text-[11px] text-slate-500">Head of Human Resources Division</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer (Hidden when printing) */}
        <div className="no-print px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            *Dokumen ini sah untuk keperluan audit ISO 9001 & pelaporan internal manajemen.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Tutup Laporan
          </button>
        </div>
      </div>
    </div>
  );
};
