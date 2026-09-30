import React, { useState } from 'react';
import { ExamResult, TrainingSession, User } from '../types';
import { CertificateVerificationModal } from './CertificateVerificationModal';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface VerificationLookupModalProps {
  trainings: TrainingSession[];
  results: ExamResult[];
  users: User[];
  onClose: () => void;
}

export const VerificationLookupModal: React.FC<VerificationLookupModalProps> = ({
  trainings,
  results,
  users,
  onClose,
}) => {
  const [certInput, setCertInput] = useState('');
  const [foundData, setFoundData] = useState<{
    result: ExamResult;
    training: TrainingSession;
    user: User;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available issued certificates for quick test clicking
  const issuedList = results
    .filter((r) => r.certificateId && r.passed)
    .map((res) => {
      const tr = trainings.find((t) => t.id === res.trainingId);
      const usr = users.find((u) => u.id === res.userId);
      return { res, tr, usr };
    })
    .filter((item): item is { res: ExamResult; tr: TrainingSession; usr: User } => !!item.tr && !!item.usr);

  const handleVerify = (codeToVerify?: string) => {
    const code = (codeToVerify || certInput).trim();
    if (!code) {
      setErrorMessage('Harap masukkan nomor seri / kode sertifikat.');
      return;
    }

    setErrorMessage(null);
    const match = results.find(
      (r) =>
        r.certificateId?.toLowerCase() === code.toLowerCase() ||
        r.id.toLowerCase() === code.toLowerCase()
    );

    if (match) {
      const tr = trainings.find((t) => t.id === match.trainingId);
      const usr = users.find((u) => u.id === match.userId);
      if (tr && usr) {
        setFoundData({ result: match, training: tr, user: usr });
        return;
      }
    }

    setErrorMessage(
      `Nomor sertifikat "${code}" tidak ditemukan dalam pangkalan data verifikasi resmi HR.`
    );
  };

  if (foundData) {
    return (
      <CertificateVerificationModal
        result={foundData.result}
        training={foundData.training}
        user={foundData.user}
        onClose={() => setFoundData(null)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Portal Verifikasi Keaslian QR Sertifikat</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600">
            Masukkan kode unik sertifikat (atau hasil scan QR Code smartphone) untuk mengecek lokasi pembuatan, waktu penerbitan presisi, dan IP komputer:
          </p>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                placeholder="Contoh: CERT-2026-TR01-10182"
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
              />
            </div>
            <button
              onClick={() => handleVerify()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cek Keabsahan</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-2 text-[11px]">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Click Demo Certificate Samples */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Uji Cepat Sertifikat Resmi Yang Telah Diterbitkan:
            </p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {issuedList.map(({ res, tr, usr }) => (
                <button
                  key={res.id}
                  onClick={() => handleVerify(res.certificateId)}
                  className="w-full text-left p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <span className="font-mono text-indigo-700 font-bold block">{res.certificateId}</span>
                    <span className="text-slate-600">{usr.name} · {tr.title}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    Skor: {res.score}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
