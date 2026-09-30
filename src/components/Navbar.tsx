import React from 'react';
import { User } from '../types';
import { ShieldCheck, Award, BookOpen, QrCode, LogOut, User as UserIcon, KeyRound } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onLogout: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenVerification?: () => void;
  onOpenAdminManagement?: () => void;
  inExamMode?: boolean;
  viewMode?: 'admin' | 'peserta';
  onToggleViewMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  activeTab,
  onSelectTab,
  onOpenVerification,
  onOpenAdminManagement,
  inExamMode = false,
  viewMode = 'admin',
  onToggleViewMode,
}) => {
  if (inExamMode) {
    // In Exam Mode, keep clean minimal header with zero distraction
    return null;
  }

  const isAdmin = currentUser.role === 'admin' && viewMode === 'admin';

  return (
    <>
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab(isAdmin ? 'trainings' : 'exams')}
              className="text-left group flex items-center gap-2.5 focus:outline-none cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  HR Training Evaluation
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-mono">
                  Cloud SQL
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Clean navigation links */}
          <nav className="hidden md:flex items-center gap-1">
            {isAdmin ? (
              <>
                <button
                  onClick={() => onSelectTab('trainings')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === 'trainings'
                      ? 'text-indigo-600 bg-indigo-50/70 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    Jadwal Pelatihan
                  </span>
                </button>
                <button
                  onClick={() => onSelectTab('proctoring')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === 'proctoring'
                      ? 'text-indigo-600 bg-indigo-50/70 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Proctoring Logs
                  </span>
                </button>
                <button
                  onClick={() => onSelectTab('reports')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === 'reports'
                      ? 'text-indigo-600 bg-indigo-50/70 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    Laporan Eksekutif
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onSelectTab('exams')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === 'exams'
                      ? 'text-indigo-600 bg-indigo-50/70 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    Ujian Saya (Pre & Post)
                  </span>
                </button>
                <button
                  onClick={() => onSelectTab('certificates')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    activeTab === 'certificates'
                      ? 'text-indigo-600 bg-indigo-50/70 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    Sertifikat Kelulusan
                  </span>
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Real User Profile, Admin Management & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Manage Admins Button (Only visible for Developer) */}
            {currentUser.email.toLowerCase() === 'dysaraswati24@gmail.com' && onOpenAdminManagement && (
              <button
                onClick={onOpenAdminManagement}
                title="Kelola Daftar Administrator & Hak Akses Akun"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Kelola Admin</span>
              </button>
            )}

            {/* Mode Switcher Button (Only visible for Admins) */}
            {currentUser.role === 'admin' && onToggleViewMode && (
              <button
                onClick={onToggleViewMode}
                title={viewMode === 'admin' ? "Beralih ke tampilan simulasi mode peserta (karyawan)" : "Kembali ke dashboard manajemen HR Admin"}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer shadow-2xs ${
                  viewMode === 'admin'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                    : 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                {viewMode === 'admin' ? (
                  <>
                    <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mode Peserta</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Mode Admin</span>
                  </>
                )}
              </button>
            )}

            {/* Verify Certificate QR Code Button */}
            {onOpenVerification && (
              <button
                onClick={onOpenVerification}
                title="Portal Verifikasi QR Code Sertifikat (Waktu, Lokasi & IP)"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-600" />
                <span>Verifikasi QR</span>
              </button>
            )}

            {/* Current Real User Profile Display */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold ring-1 ring-indigo-200 shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <div className="text-left text-xs leading-tight">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-slate-900 truncate max-w-[120px] sm:max-w-[160px]">
                    {currentUser.name || currentUser.email}
                  </p>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                      isAdmin
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isAdmin ? 'HR Admin' : 'Karyawan'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-[140px] sm:max-w-[180px]">
                  {currentUser.email}
                </p>
              </div>
            </div>

            {/* Logout / Keluar Button */}
            <button
              onClick={onLogout}
              title="Keluar dari Akun (Logout)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* Mobile Bottom Navigation Bar (Responsive Smartphone Support) */}
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg md:hidden flex justify-around items-center h-16 px-2 pb-safe no-print">
      {isAdmin ? (
        <>
          <button
            onClick={() => onSelectTab('trainings')}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] font-bold transition-colors cursor-pointer ${
              activeTab === 'trainings' ? 'text-indigo-600 font-extrabold' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Jadwal</span>
          </button>
          <button
            onClick={() => onSelectTab('proctoring')}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] font-bold transition-colors cursor-pointer ${
              activeTab === 'proctoring' ? 'text-indigo-600 font-extrabold' : 'text-slate-500'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Proctoring</span>
          </button>
          <button
            onClick={() => onSelectTab('reports')}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] font-bold transition-colors cursor-pointer ${
              activeTab === 'reports' ? 'text-indigo-600 font-extrabold' : 'text-slate-500'
            }`}
          >
            <Award className="w-5 h-5" />
            <span>Laporan</span>
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => onSelectTab('exams')}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] font-bold transition-colors cursor-pointer ${
              activeTab === 'exams' ? 'text-indigo-600 font-extrabold' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Ujian Saya</span>
          </button>
          {onOpenVerification && (
            <button
              onClick={onOpenVerification}
              className="flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] font-bold text-slate-500 transition-colors cursor-pointer"
            >
              <QrCode className="w-5 h-5 text-indigo-600 animate-pulse" />
              <span>Verifikasi QR</span>
            </button>
          )}
          <button
            onClick={() => onSelectTab('certificates')}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] font-bold transition-colors cursor-pointer ${
              activeTab === 'certificates' ? 'text-indigo-600 font-extrabold' : 'text-slate-500'
            }`}
          >
            <Award className="w-5 h-5" />
            <span>Sertifikat</span>
          </button>
        </>
      )}
    </nav>
    </>
  );
};
