import React, { useState } from 'react';
import { ProctorLog, TrainingSession, User } from '../../types';
import {
  ShieldAlert,
  Camera,
  AlertTriangle,
  ExternalLink,
  Filter,
  Eye,
  CheckCircle,
  X,
  Clock,
  User as UserIcon,
} from 'lucide-react';

interface ProctoringMonitorProps {
  logs: ProctorLog[];
  trainings: TrainingSession[];
  users: User[];
  onAddManualLog?: (log: ProctorLog) => void;
}

export const ProctoringMonitor: React.FC<ProctoringMonitorProps> = ({
  logs,
  trainings,
  users,
}) => {
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [previewSnapshot, setPreviewSnapshot] = useState<ProctorLog | null>(null);

  const filteredLogs = logs.filter((l) => {
    if (selectedTrainingId !== 'all' && l.trainingId !== selectedTrainingId) return false;
    if (selectedSeverity !== 'all' && l.severity !== selectedSeverity) return false;
    return true;
  });

  const highSeverityCount = logs.filter((l) => l.severity === 'high').length;
  const mediumSeverityCount = logs.filter((l) => l.severity === 'medium').length;
  const snapshotCount = logs.filter((l) => l.snapshotUrl || l.violationType === 'periodic_snapshot').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Panel Pengawasan Kamera (Online Proctoring)</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Rekam jejak tangkapan webcam acak, deteksi perpindahan tab browser, dan monitoring fullscreen integritas ujian karyawan.
          </p>
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center min-w-[90px]">
            <p className="text-slate-400">Total Log</p>
            <p className="text-lg font-bold text-slate-900">{logs.length}</p>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-center min-w-[90px]">
            <p className="text-rose-600 font-sans font-semibold">Tinggi</p>
            <p className="text-lg font-bold text-rose-700">{highSeverityCount}</p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center min-w-[90px]">
            <p className="text-amber-600 font-sans font-semibold">Sedang</p>
            <p className="text-lg font-bold text-amber-700">{mediumSeverityCount}</p>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-center min-w-[90px]">
            <p className="text-indigo-600 font-sans font-semibold">Webcam</p>
            <p className="text-lg font-bold text-indigo-700">{snapshotCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">Filter Modul:</span>
            <select
              value={selectedTrainingId}
              onChange={(e) => setSelectedTrainingId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
            >
              <option value="all">Semua Sesi Pelatihan</option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Tingkat Risiko:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-800"
            >
              <option value="all">Semua Tingkat</option>
              <option value="high">Bahaya / Kritis (High)</option>
              <option value="medium">Peringatan (Medium)</option>
              <option value="low">Rutin / Normal (Low)</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Menampilkan {filteredLogs.length} kejadian
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Waktu Kejadian</th>
                <th className="py-3.5 px-4">Peserta Karyawan</th>
                <th className="py-3.5 px-4">Modul & Ujian</th>
                <th className="py-3.5 px-4">Jenis Pelanggaran</th>
                <th className="py-3.5 px-4">Deskripsi Audit</th>
                <th className="py-3.5 px-4 text-center">Tangkapan Kamera</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <CheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                    <p className="text-sm font-semibold text-slate-700">Tidak ada catatan pelanggaran.</p>
                    <p className="text-xs text-slate-400 mt-0.5">Semua ujian berjalan sesuai kepatuhan proctoring.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const logTime = new Date(log.timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                  const logDate = new Date(log.timestamp).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Time */}
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{logTime}</span>
                          <span className="text-slate-400 font-sans text-[10px]">({logDate})</span>
                        </div>
                      </td>

                      {/* Participant */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{log.userName}</div>
                        <div className="font-mono text-slate-400 text-[11px]">{log.userNik}</div>
                      </td>

                      {/* Module */}
                      <td className="py-3 px-4">
                        <p className="text-slate-800 font-medium truncate max-w-[200px]" title={log.trainingTitle}>
                          {log.trainingTitle}
                        </p>
                        <span className="text-[10px] font-mono uppercase text-slate-500">
                          {log.examType}
                        </span>
                      </td>

                      {/* Violation type & severity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              log.severity === 'high'
                                ? 'bg-rose-500'
                                : log.severity === 'medium'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span className="font-semibold text-slate-800 capitalize">
                            {log.violationType === 'tab_switch'
                              ? 'Perpindahan Tab'
                              : log.violationType === 'fullscreen_exit'
                              ? 'Keluar Layar Penuh'
                              : log.violationType === 'webcam_blocked'
                              ? 'Kamera Tertutup'
                              : 'Snapshot Wajah Berkala'}
                          </span>
                        </div>
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4 text-slate-600 max-w-xs">
                        <p className="truncate" title={log.details}>
                          {log.details}
                        </p>
                      </td>

                      {/* Snapshot Thumbnail / Action */}
                      <td className="py-3 px-4 text-center">
                        {log.snapshotUrl ? (
                          <button
                            onClick={() => setPreviewSnapshot(log)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors font-medium text-[11px]"
                          >
                            <Camera className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Lihat Foto</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Tidak Ada Gambar</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Snapshot Preview Modal */}
      {previewSnapshot && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Bukti Rekaman Tangkapan Layar Webcam</h3>
              </div>
              <button
                onClick={() => setPreviewSnapshot(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 aspect-4/3 flex items-center justify-center">
                {previewSnapshot.snapshotUrl ? (
                  <img
                    src={previewSnapshot.snapshotUrl}
                    alt="Webcam Snapshot Evidence"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center text-slate-400 text-xs">Snapshot tidak tersedia</div>
                )}
                <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                  {new Date(previewSnapshot.timestamp).toLocaleTimeString()}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Peserta:</span>
                  <span className="font-semibold text-slate-900">{previewSnapshot.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NIK:</span>
                  <span className="font-mono text-slate-800">{previewSnapshot.userNik}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Modul Pelatihan:</span>
                  <span className="font-medium text-slate-800 text-right">{previewSnapshot.trainingTitle}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 text-slate-700">
                  <span className="font-semibold">Catatan Audit: </span>
                  {previewSnapshot.details}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setPreviewSnapshot(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
