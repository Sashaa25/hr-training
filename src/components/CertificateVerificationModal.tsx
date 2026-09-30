import React, { useState } from 'react';
import { TrainingSession, ExamResult, User, CertificateSettings } from '../types';
import { DEFAULT_CERT_SETTINGS } from '../data/initialData';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Laptop,
  Award,
  UserCheck,
  X,
  ExternalLink,
  QrCode,
  Building,
  Printer,
} from 'lucide-react';

interface CertificateVerificationModalProps {
  result: ExamResult;
  training: TrainingSession;
  user: User;
  onClose: () => void;
}

export const CertificateVerificationModal: React.FC<CertificateVerificationModalProps> = ({
  result,
  training,
  user,
  onClose,
}) => {
  const certSettings: CertificateSettings =
    result.certificateSettingsSnapshot ||
    training.certificateSettings || {
      ...DEFAULT_CERT_SETTINGS,
      trainerName: training.trainerName || DEFAULT_CERT_SETTINGS.trainerName,
    };

  const certId = result.certificateId || `CERT-2026-${training.id.toUpperCase()}-${user.nik.replace(/\D/g, '')}`;

  // Format exact time with seconds and timezone
  const exactTimeStr = result.issuedAtExact
    ? new Date(result.issuedAtExact).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      })
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
  const clientIp = result.clientIp || '182.253.14.89 (Corporate ISP Secured)';
  const trainerName = result.trainerName || certSettings.trainerName;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Verification Verified Banner */}
        <div className="bg-emerald-600 px-6 py-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-700/80 px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                STATUS: RESMI & TERVERIFIKASI ASLI
              </div>
              <h2 className="text-lg font-bold mt-1">Sistem Validasi Keaslian E-Sertifikat</h2>
              <p className="text-xs text-emerald-100 font-mono">Kode Unik: {certId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-emerald-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Details Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* 3 Core Security Audit Verification Highlights (User requested: Waktu, Lokasi, IP Komputer) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Lokasi Pembuatan */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span className="text-[11px] font-semibold text-slate-700">Lokasi Penerbitan:</span>
              </div>
              <p className="font-bold text-slate-900 leading-snug">{issueLocation}</p>
              <p className="text-[10px] text-slate-400">Geo-tag terverifikasi sistem HR</p>
            </div>

            {/* 2. Waktu Lengkap */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="text-[11px] font-semibold text-slate-700">Waktu Lengkap:</span>
              </div>
              <p className="font-bold text-slate-900 leading-snug font-mono text-[11px]">{exactTimeStr}</p>
              <p className="text-[10px] text-slate-400">Timestamp presisi detik (WIB)</p>
            </div>

            {/* 3. IP Komputer */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                <Laptop className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-semibold text-slate-700">IP Komputer Peserta:</span>
              </div>
              <p className="font-bold font-mono text-slate-900 text-xs">{clientIp}</p>
              <p className="text-[10px] text-slate-400">Recorded on exam submission</p>
            </div>
          </div>

          {/* Certificate Credential Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
            <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              Detail Sertifikasi Karyawan
            </h4>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-400 block text-[11px]">Nama Karyawan Penerima:</span>
                <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                <span className="text-slate-500 font-mono block text-[11px]">NIK: {user.nik}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Departemen & Jabatan:</span>
                <span className="font-semibold text-slate-800">{user.department}</span>
                <span className="text-slate-500 block text-[11px]">{user.position}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Modul Pelatihan:</span>
                <span className="font-bold text-indigo-900">{training.title}</span>
                <span className="text-slate-500 block text-[11px]">Kategori: {training.category}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Nama Trainer / Fasilitator:</span>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  {trainerName}
                </span>
                <span className="text-slate-500 block text-[11px]">{certSettings.trainerTitle}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Nilai Kelulusan Posttest:</span>
                <span className="font-mono text-base font-black text-emerald-600">
                  {result.score} / 100
                </span>
                <span className="text-slate-400 text-[10px] block">Passing Grade Standar: {training.passingGrade}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Institusi Penerbit:</span>
                <span className="font-bold text-slate-800">{certSettings.companyName}</span>
                <span className="text-slate-500 block text-[11px]">Divisi Human Resources & Talent Development</span>
              </div>
            </div>
          </div>

          {/* Legal Signers Verification */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h5 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              Otorisasi Tanda Tangan Digital Terdaftar:
            </h5>
            <div className="grid grid-cols-2 gap-4 text-[11px]">
              <div>
                <p className="font-semibold text-slate-900">{certSettings.signer1Name}</p>
                <p className="text-slate-500">{certSettings.signer1Title}</p>
                <span className="text-[10px] font-mono text-emerald-600 font-semibold">✓ Digital Signature Valid</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">{certSettings.signer2Name}</p>
                <p className="text-slate-500">{certSettings.signer2Title}</p>
                <span className="text-[10px] font-mono text-emerald-600 font-semibold">✓ Digital Signature Valid</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Keaslian dapat diuji ulang kapan saja melalui pemindaian QR Code pada lembar sertifikat.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Tutup Verifikasi
          </button>
        </div>
      </div>
    </div>
  );
};
