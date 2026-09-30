import React, { useState } from 'react';
import { User } from '../../types';
import {
  ShieldCheck,
  Database,
  AlertCircle,
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../../lib/firebase';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      if (!user.email) {
        throw new Error('Alamat email Google tidak ditemukan atau tidak tersedia.');
      }

      // Send authenticated Google profile to login endpoint
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: user.email,
          name: user.displayName || undefined,
          avatarUrl: user.photoURL || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyinkronkan login Google ke database.');
      }

      if (data.user) {
        onLogin(data.user);
      } else {
        throw new Error('Data profil pengguna tidak valid.');
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Proses masuk Google dibatalkan karena jendela pop-up ditutup.');
      } else if (err.code === 'auth/blocked-by-popup-killer') {
        setErrorMsg('Pop-up masuk diblokir browser. Izinkan pop-up untuk melanjutkan.');
      } else {
        setErrorMsg(err.message || 'Gagal masuk menggunakan akun Google.');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/30 ring-1 ring-white/20 mb-4">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          HR Training Evaluation System
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-sm mx-auto">
          Sistem Terpadu Pretest & Posttest, Monitoring Proctoring Kamera & Generator E-Sertifikat
        </p>

        {/* Database Status indicator */}
        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium">
          <Database className="w-3.5 h-3.5" />
          <span>Cloud SQL PostgreSQL (asia-southeast1) Aktif & Tersinkron</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white text-slate-900 py-8 px-6 sm:px-8 shadow-2xl rounded-2xl border border-slate-100 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Masuk ke Sistem</h2>
            <p className="text-xs text-slate-500 mt-1">
              Masukkan alamat email Anda untuk mengakses jadwal pelatihan atau evaluasi.
            </p>
          </div>

          {/* Google Single Sign-On Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-xs focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{loading ? 'Menghubungkan Google...' : 'Masuk dengan Akun Google (Gmail)'}</span>
            </button>
          </div>

          {/* Error Message banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Security & System Note Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-xs text-slate-400">
            Sistem evaluasi HR terenkripsi dengan pengawasan kamera proctoring aktif dan tanda tangan e-sertifikat digital.
          </p>
          <p className="text-[11px] text-slate-500">
            &copy; 2026 HR Training & Development. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </div>
  );
};
