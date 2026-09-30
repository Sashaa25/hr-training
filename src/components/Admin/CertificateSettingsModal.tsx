import React, { useState, useRef } from 'react';
import { TrainingSession, CertificateSettings } from '../../types';
import { DEFAULT_CERT_SETTINGS } from '../../data/initialData';
import {
  Award,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  X,
  MapPin,
  UserCheck,
  Building,
  RotateCcw,
} from 'lucide-react';

interface CertificateSettingsModalProps {
  training: TrainingSession;
  onSave: (updatedSettings: CertificateSettings) => void;
  onClose: () => void;
}

export const CertificateSettingsModal: React.FC<CertificateSettingsModalProps> = ({
  training,
  onSave,
  onClose,
}) => {
  const currentSettings = training.certificateSettings || {
    ...DEFAULT_CERT_SETTINGS,
    trainerName: training.trainerName || DEFAULT_CERT_SETTINGS.trainerName,
    trainerTitle: training.trainerTitle || DEFAULT_CERT_SETTINGS.trainerTitle,
  };

  const [companyName, setCompanyName] = useState(currentSettings.companyName);
  const [logoUrl, setLogoUrl] = useState(currentSettings.companyLogoUrl);
  const [locationCreated, setLocationCreated] = useState(currentSettings.locationCreated);
  const [trainerName, setTrainerName] = useState(currentSettings.trainerName);
  const [trainerTitle, setTrainerTitle] = useState(currentSettings.trainerTitle);
  const [signer1Name, setSigner1Name] = useState(currentSettings.signer1Name);
  const [signer1Title, setSigner1Title] = useState(currentSettings.signer1Title);
  const [signer2Name, setSigner2Name] = useState(currentSettings.signer2Name);
  const [signer2Title, setSigner2Title] = useState(currentSettings.signer2Title);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(String(event.target.result));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefault = () => {
    setCompanyName(DEFAULT_CERT_SETTINGS.companyName);
    setLogoUrl(DEFAULT_CERT_SETTINGS.companyLogoUrl);
    setLocationCreated(DEFAULT_CERT_SETTINGS.locationCreated);
    setTrainerName(DEFAULT_CERT_SETTINGS.trainerName);
    setTrainerTitle(DEFAULT_CERT_SETTINGS.trainerTitle);
    setSigner1Name(DEFAULT_CERT_SETTINGS.signer1Name);
    setSigner1Title(DEFAULT_CERT_SETTINGS.signer1Title);
    setSigner2Name(DEFAULT_CERT_SETTINGS.signer2Name);
    setSigner2Title(DEFAULT_CERT_SETTINGS.signer2Title);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CertificateSettings = {
      companyName: companyName.trim() || DEFAULT_CERT_SETTINGS.companyName,
      companyLogoUrl: logoUrl.trim() || DEFAULT_CERT_SETTINGS.companyLogoUrl,
      locationCreated: locationCreated.trim() || DEFAULT_CERT_SETTINGS.locationCreated,
      trainerName: trainerName.trim() || DEFAULT_CERT_SETTINGS.trainerName,
      trainerTitle: trainerTitle.trim() || DEFAULT_CERT_SETTINGS.trainerTitle,
      signer1Name: signer1Name.trim() || DEFAULT_CERT_SETTINGS.signer1Name,
      signer1Title: signer1Title.trim() || DEFAULT_CERT_SETTINGS.signer1Title,
      signer2Name: signer2Name.trim() || DEFAULT_CERT_SETTINGS.signer2Name,
      signer2Title: signer2Title.trim() || DEFAULT_CERT_SETTINGS.signer2Title,
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">Pengaturan Desain & Legalitas E-Sertifikat</h2>
              <p className="text-xs text-slate-500">
                Modul: <strong className="text-slate-800">{training.title}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Logo Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Logo Perusahaan / Institusi Sertifikat
              </label>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Standar
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-20 h-16 rounded-lg bg-white border border-slate-300 flex items-center justify-center p-2 shadow-2xs overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                ) : (
                  <Building className="w-8 h-8 text-slate-300" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Berkas Logo</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">Format PNG/JPG/SVG</span>
                </div>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Atau tempel URL gambar logo online..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-md text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Company Name & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                Nama Perusahaan / Penerbit:
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-900 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                Lokasi Pembuatan Sertifikat:
              </label>
              <input
                type="text"
                value={locationCreated}
                onChange={(e) => setLocationCreated(e.target.value)}
                placeholder="Contoh: Jakarta Pusat, DKI Jakarta - Gedung Bursa Efek Lt. 18"
                className="w-full p-2 bg-white border border-slate-300 rounded-md text-slate-900 font-medium"
                required
              />
              <span className="text-[10px] text-slate-400">
                *Lokasi ini akan tertanam dan muncul saat QR Code discan di HP.
              </span>
            </div>
          </div>

          {/* Trainer Section (User Requirement) */}
          <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-indigo-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-indigo-600" />
              Nama Trainer / Fasilitator Pelatihan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nama Lengkap & Gelar Trainer:</label>
                <input
                  type="text"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  placeholder="Contoh: Dr. Rian Hidayat, M.M., CPC"
                  className="w-full p-2 bg-white border border-indigo-300 rounded-md text-slate-900 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Jabatan / Spesialisasi Trainer:</label>
                <input
                  type="text"
                  value={trainerTitle}
                  onChange={(e) => setTrainerTitle(e.target.value)}
                  placeholder="Contoh: Lead Executive Leadership Coach"
                  className="w-full p-2 bg-white border border-indigo-300 rounded-md text-slate-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Signers Section */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Nama-Nama Pejabat Penandatangan Sertifikat
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Penandatangan 1 */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <p className="font-semibold text-slate-700">Penandatangan 1 (Kiri - Tim Teknis / HR Lead):</p>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Nama & Gelar:</label>
                  <input
                    type="text"
                    value={signer1Name}
                    onChange={(e) => setSigner1Name(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded text-slate-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Jabatan:</label>
                  <input
                    type="text"
                    value={signer1Title}
                    onChange={(e) => setSigner1Title(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded text-slate-700"
                    required
                  />
                </div>
              </div>

              {/* Penandatangan 2 */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <p className="font-semibold text-slate-700">Penandatangan 2 (Kanan - Direktur HR / Eksekutif):</p>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Nama & Gelar:</label>
                  <input
                    type="text"
                    value={signer2Name}
                    onChange={(e) => setSigner2Name(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded text-slate-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Jabatan:</label>
                  <input
                    type="text"
                    value={signer2Title}
                    onChange={(e) => setSigner2Title(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded text-slate-700"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              *Perubahan akan otomatis terintegrasi ke seluruh e-Sertifikat dan QR code verification.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Simpan Pengaturan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
