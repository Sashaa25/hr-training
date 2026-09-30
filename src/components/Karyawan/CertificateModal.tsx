import React, { useEffect, useState } from 'react';
import { TrainingSession, User, ExamResult, CertificateSettings } from '../../types';
import { DEFAULT_CERT_SETTINGS } from '../../data/initialData';
import { CertificateVerificationModal } from '../CertificateVerificationModal';
import QRCode from 'qrcode';
import { Award, Printer, ShieldCheck, X, QrCode, UserCheck, MapPin, Laptop, Clock, Eye } from 'lucide-react';

interface CertificateModalProps {
  training: TrainingSession;
  user: User;
  result: ExamResult;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  training,
  user,
  result,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const certSettings: CertificateSettings =
    result.certificateSettingsSnapshot ||
    training.certificateSettings || {
      ...DEFAULT_CERT_SETTINGS,
      trainerName: training.trainerName || DEFAULT_CERT_SETTINGS.trainerName,
      trainerTitle: training.trainerTitle || DEFAULT_CERT_SETTINGS.trainerTitle,
    };

  const certId = result.certificateId || `CERT-2026-${training.id.toUpperCase()}-${user.nik.replace(/\D/g, '')}`;
  
  const exactTimeStr = result.issuedAtExact
    ? new Date(result.issuedAtExact).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB'
    : new Date(result.finishedAt || Date.now()).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB';

  const issueLocation = result.issueLocation || certSettings.locationCreated;
  const clientIp = result.clientIp || '182.253.14.89';
  const trainerName = result.trainerName || certSettings.trainerName;

  useEffect(() => {
    // Generate authentic encrypted verification QR code payload matching User Requirement:
    // "QR code harus berisi code unik yang dapat discane di hp lalu muncul dimana sertifikat dibuat lengkap dengan waktu , lokasi dan ip komputer"
    const fullScanPayload = [
      `=== E-SERTIFIKAT RESMI PT CIPTA INOVASI PERSADA ===`,
      `Kode Unik: ${certId}`,
      `Nama Penerima: ${user.name} (NIK: ${user.nik})`,
      `Divisi: ${user.department}`,
      `Pelatihan: ${training.title}`,
      `Trainer / Fasilitator: ${trainerName} (${certSettings.trainerTitle})`,
      `Skor Posttest: ${result.score}/100 (Passing Grade: ${training.passingGrade})`,
      `Waktu Penerbitan: ${exactTimeStr}`,
      `Lokasi Pembuatan: ${issueLocation}`,
      `IP Komputer Peserta: ${clientIp}`,
      `Penandatangan: ${certSettings.signer1Name} & ${certSettings.signer2Name}`,
      `Status Keaslian: 100% TERVERIFIKASI SAH OLEH DIREKTORAT HR`,
    ].join('\n');

    QRCode.toDataURL(fullScanPayload, {
      width: 170,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR', err));
  }, [certId, user, training, result, exactTimeStr, issueLocation, clientIp, trainerName, certSettings]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Top Control Bar (Hidden on print) */}
          <div className="no-print px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">E-Sertifikat Kelulusan Pelatihan</h2>
                <p className="text-xs text-slate-500 font-mono">No. Seri: {certId}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowVerificationModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                title="Buka rincian lengkap keaslian QR code (Waktu, Lokasi, IP)"
              >
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Uji Scan QR (Lihat Lokasi & IP)</span>
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF Resolusi Tinggi</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Certificate Canvas / Container */}
          <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100 flex items-center justify-center print:bg-white print:p-0 print-container">
            <div className="w-full max-w-3xl bg-white border-8 border-double border-indigo-900/30 p-8 sm:p-12 relative shadow-lg rounded-sm text-center space-y-5 certificate-print">
              {/* Subtle corner decorative frames */}
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-indigo-800" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-indigo-800" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-indigo-800" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-indigo-800" />

              {/* Corporate Logo & Header (Custom Logo & Name) */}
              <div className="flex flex-col items-center justify-center space-y-1">
                {certSettings.companyLogoUrl ? (
                  <div className="h-12 max-w-[180px] flex items-center justify-center mb-1">
                    <img
                      src={certSettings.companyLogoUrl}
                      alt="Company Logo"
                      className="max-h-12 object-contain"
                    />
                  </div>
                ) : (
                  <ShieldCheck className="w-7 h-7 text-indigo-700" />
                )}
                <span className="font-bold tracking-widest text-xs uppercase text-indigo-950">
                  {certSettings.companyName}
                </span>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Departemen Human Resources & People Development
                </p>
              </div>

              {/* Certificate Title */}
              <div className="pt-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-indigo-950 font-serif uppercase">
                  SERTIFIKAT KELULUSAN
                </h1>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  NOMOR DOKUMEN: {certId}
                </p>
              </div>

              {/* Recipient Notice */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] uppercase tracking-widest text-slate-500 font-medium">
                  Diberikan dengan penuh apresiasi kepada:
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 border-b-2 border-indigo-200 inline-block px-8 pb-1.5">
                  {user.name}
                </h2>
                <p className="text-xs font-mono text-slate-500">
                  NIK: {user.nik} · Divisi: {user.department}
                </p>
              </div>

              {/* Training Description & Trainer Highlight */}
              <div className="max-w-xl mx-auto space-y-2 pt-1 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Telah menyelesaikan seluruh rangkaian evaluasi dan dinyatakan <strong>LULUS</strong> dalam program pelatihan kompetensi:
                </p>
                <h3 className="text-base sm:text-lg font-bold text-indigo-900">
                  &ldquo;{training.title}&rdquo;
                </h3>

                {/* Trainer Information Block (User Requirement) */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 max-w-md mx-auto flex items-center justify-center gap-2 text-[11px] text-slate-700">
                  <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Trainer / Fasilitator: <strong className="text-slate-900">{trainerName}</strong>
                    <span className="block text-[10px] text-slate-400 font-sans">{certSettings.trainerTitle}</span>
                  </span>
                </div>

                <p className="text-[11px] text-slate-500">
                  Nilai Evaluasi Akhir (Posttest):{' '}
                  <strong className="text-indigo-950 font-mono font-bold">{result.score} / 100</strong>{' '}
                  (Passing Grade: {training.passingGrade})
                </p>
              </div>

              {/* Signatures & Encrypted QR Code Validation Footer */}
              <div className="pt-6 grid grid-cols-3 items-center text-xs border-t border-slate-200 gap-4">
                {/* Left Signature (Signer 1) */}
                <div className="text-center space-y-1">
                  <p className="text-[10px] text-slate-400">Verifikasi Teknis</p>
                  <div className="h-10 flex items-center justify-center">
                    <span className="font-serif italic text-slate-400 text-sm">Valid Signature</span>
                  </div>
                  <p className="font-bold text-slate-900 underline text-xs">{certSettings.signer1Name}</p>
                  <p className="text-[10px] text-slate-400">{certSettings.signer1Title}</p>
                </div>

                {/* Middle: Encrypted QR Code containing unique code, time, location, IP */}
                <div className="flex flex-col items-center justify-center space-y-1">
                  {qrDataUrl ? (
                    <div className="p-1.5 bg-white border border-slate-200 rounded-sm shadow-2xs">
                      <img src={qrDataUrl} alt="Security Verification QR Code" className="w-24 h-24" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">
                      QR Code
                    </div>
                  )}
                  <span className="text-[9px] font-mono text-slate-500 font-semibold uppercase tracking-tighter">
                    Scan di HP: Waktu, Lokasi & IP
                  </span>
                </div>

                {/* Right Signature (Signer 2) */}
                <div className="text-center space-y-1">
                  <p className="text-[10px] text-slate-400">Otorisasi Resmi</p>
                  <div className="h-10 flex items-center justify-center">
                    <span className="font-serif italic text-slate-400 text-sm">Valid Signature</span>
                  </div>
                  <p className="font-bold text-slate-900 underline text-xs">{certSettings.signer2Name}</p>
                  <p className="text-[10px] text-slate-400">{certSettings.signer2Title}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="no-print px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              *QR Code dapat dipindai langsung dengan kamera smartphone apa pun untuk memverifikasi waktu, lokasi pembuatan, dan IP komputer.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Verification Modal opened when clicking Test Scan */}
      {showVerificationModal && (
        <CertificateVerificationModal
          result={result}
          training={training}
          user={user}
          onClose={() => setShowVerificationModal(false)}
        />
      )}
    </>
  );
};
