import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { api } from '../../utils/api';
import { Storage } from '../../utils/storage';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  X,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Crown,
  KeyRound,
  Sparkles,
} from 'lucide-react';

interface AdminManagementModalProps {
  currentUser: User;
  onClose: () => void;
  onAdminListChanged: () => void;
}

const MASTER_DEVELOPER_EMAIL = 'dysaraswati24@gmail.com';

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({
  currentUser,
  onClose,
  onAdminListChanged,
}) => {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('HR Specialist / Facilitator');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isMasterDev = currentUser.email.toLowerCase() === MASTER_DEVELOPER_EMAIL;

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const list = await api.getAdmins();
      setAdmins(list);
    } catch (err: any) {
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setMessage({ text: 'Masukkan alamat email yang valid.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const addedUser = await api.addAdmin({
        email: newEmail.trim().toLowerCase(),
        name: newName.trim() || undefined,
        position: newPosition.trim() || 'HR Administrator',
      });

      Storage.updateUserRole(addedUser.email, 'admin');

      setMessage({
        text: `Berhasil mengangkat ${addedUser.email} sebagai Administrator HR.`,
        type: 'success',
      });
      setNewEmail('');
      setNewName('');
      await fetchAdmins();
      onAdminListChanged();
    } catch (err: any) {
      setMessage({
        text: err.message || 'Gagal menambahkan admin baru.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeAdmin = async (adminUser: User) => {
    if (adminUser.email.toLowerCase() === MASTER_DEVELOPER_EMAIL) {
      setMessage({
        text: 'Akun Master Developer tidak dapat dicabut hak adminnya.',
        type: 'error',
      });
      return;
    }

    setMessage(null);
    try {
      await api.removeAdmin(adminUser.email);
      Storage.updateUserRole(adminUser.email, 'karyawan');
      setMessage({
        text: `Hak akses admin untuk ${adminUser.email} berhasil dicabut (diturunkan ke Karyawan).`,
        type: 'success',
      });
      await fetchAdmins();
      onAdminListChanged();
    } catch (err: any) {
      setMessage({
        text: err.message || 'Gagal mencabut hak akses admin.',
        type: 'error',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 my-8 space-y-6">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Manajemen Hak Akses Administrator</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono px-2 py-0.5 rounded-full font-semibold">
                  RBAC
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengembang utama: <strong className="text-indigo-600 font-mono">{MASTER_DEVELOPER_EMAIL}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Developer Notice Banner */}
        <div className="p-3.5 bg-linear-to-r from-indigo-50 via-slate-50 to-indigo-50/40 border border-indigo-100 rounded-xl flex items-start gap-3 text-xs text-indigo-950">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-indigo-900">
              Kebijakan Keamanan Tingkat Tinggi
            </p>
            <p className="text-slate-600 text-[11px] mt-0.5">
              Hanya akun Developer (<span className="font-mono text-indigo-700 font-semibold">{MASTER_DEVELOPER_EMAIL}</span>) yang memiliki hak wewenang utama untuk menetapkan dan mencabut hak akses administrator akun lainnya di Cloud SQL.
            </p>
          </div>
        </div>

        {/* Notification message */}
        {message && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Add New Admin Form */}
        <form onSubmit={handleAddAdmin} className="bg-slate-50 border border-slate-200/80 rounded-xl p-4.5 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Tambah / Tetapkan Administrator Baru
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email Kantor *
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="contoh: kolega.hr@perusahaan.co.id"
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap (Opsional)
              </label>
              <div className="relative">
                <UserIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="contoh: Rina Wijaya, S.Psi."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-slate-500">
              Akun akan langsung tersinkronisasi ke PostgreSQL dengan wewenang Admin (HR).
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Angkat Sebagai Admin'}</span>
            </button>
          </div>
        </form>

        {/* Current Admins List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>Daftar Administrator Aktif ({admins.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400">Tersimpan di Cloud SQL</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Memuat daftar administrator...
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {admins.map((adm) => {
                const isDev = adm.email.toLowerCase() === MASTER_DEVELOPER_EMAIL;

                return (
                  <div
                    key={adm.id}
                    className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                      isDev ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isDev
                            ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200'
                            : 'bg-slate-800 text-white'
                        }`}
                      >
                        {isDev ? '⭐' : adm.name.charAt(0)}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900">{adm.name}</p>
                          {isDev ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                              <Crown className="w-2.5 h-2.5" />
                              Master Developer
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                              HR Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{adm.email}</p>
                        <p className="text-[10px] text-slate-400">{adm.position} · {adm.department}</p>
                      </div>
                    </div>

                    <div>
                      {isDev ? (
                        <span className="text-[10px] text-indigo-600 bg-indigo-100/70 font-semibold px-2 py-1 rounded-md">
                          Permanen
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRevokeAdmin(adm)}
                          title="Cabut wewenang admin (ubah jadi Karyawan)"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Cabut Akses</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
