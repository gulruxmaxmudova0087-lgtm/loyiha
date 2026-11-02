import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Power,
  KeyRound,
  Building2,
  Mail,
  Phone,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import { Clinic, UserProfile } from '../../types';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createClinicAdmin, toggleUserStatus } from '../../services/userService';

interface AdminsPageProps {
  admins: UserProfile[];
  clinics: Clinic[];
  onRefresh: () => void;
}

export const AdminsPage: React.FC<AdminsPageProps> = ({ admins, clinics, onRefresh }) => {
  const { userProfile } = useAuth();
  const { success, error } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Success modal displaying generated credentials securely
  const [createdCredentials, setCreatedCredentials] = useState<{
    fullName: string;
    username: string;
    email: string;
    password: string;
    clinicName: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setFullName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setPhone('');
    setClinicId('');
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !password || !clinicId) {
      error('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    const selectedClinic = clinics.find((c) => c.id === clinicId);
    if (!selectedClinic) {
      error('Klinika topilmadi');
      return;
    }

    if (!userProfile) return;
    setLoading(true);

    try {
      const newAdmin = await createClinicAdmin(
        {
          fullName,
          username,
          email: email.trim() || `${username.trim().toLowerCase()}@system.local`,
          password,
          phone,
          clinicId,
          clinicName: selectedClinic.name,
        },
        userProfile
      );

      setCreatedCredentials({
        fullName: newAdmin.fullName,
        username: newAdmin.username,
        email: newAdmin.email,
        password,
        clinicName: selectedClinic.name,
      });

      success(`"${newAdmin.fullName}" muvaffaqiyatli administrator etib yaratildi!`);
      resetForm();
      setIsCreateOpen(false);
      onRefresh();
    } catch (err: any) {
      error(err?.message || 'Admin yaratishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (admin: UserProfile) => {
    if (!userProfile) return;
    try {
      const newStatus = await toggleUserStatus(admin.id, admin.status, userProfile, admin.clinicId);
      success(`Admin holati: ${newStatus === 'active' ? 'Faollashtirildi' : 'Nofaol qilindi'}`);
      onRefresh();
    } catch {
      error('Admin holatini o\'zgartirishda xatolik');
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `MEDISCAN - Klinika Administratori Kirish Ma'lumotlari:\nKlinika: ${createdCredentials.clinicName}\nF.I.Sh: ${createdCredentials.fullName}\nLogin / Username: ${createdCredentials.username}\nEmail: ${createdCredentials.email}\nParol: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    success('Kirish ma\'lumotlari nusxalandi');
  };

  const filteredAdmins = admins.filter((a) => {
    return (
      a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.clinicName && a.clinicName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Klinika Administratorlari
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Har bir klinikaga biriktirilgan mas'ul adminlar hisoblari
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Yangi admin yaratish
        </button>
      </div>

      {/* Search Input */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Ism, login yoki klinika bo'yicha qidiring..."
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Table or Empty State */}
      {filteredAdmins.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="Hozircha klinika adminlari mavjud emas."
          description="Klinikalarni boshqarish uchun yangi administrator hisobini yarating."
          actionLabel="Admin yaratish"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Administrator</th>
                  <th className="px-5 py-3.5 font-semibold">Biriktirilgan klinika</th>
                  <th className="px-5 py-3.5 font-semibold">Aloqa</th>
                  <th className="px-5 py-3.5 font-semibold">Holati</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAdmins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                          <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {admin.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400">@{admin.username}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                        <Building2 className="w-4 h-4 text-teal-600" />
                        <span>{admin.clinicName || 'Biriktirilmagan'}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{admin.email}</span>
                      </div>
                      {admin.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{admin.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={admin.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(admin)}
                        title={admin.status === 'active' ? 'Nofaol qilish' : 'Faollashtirish'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          admin.status === 'active'
                            ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Admin */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Yangi klinika administratorini yaratish"
        description="Admin uchun kirish hisobini yarating va uni tegishli klinikaga biriktiring."
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Biriktiriladigan klinika *
            </label>
            {clinics.length === 0 ? (
              <p className="text-xs text-rose-500">
                Avval kamida bitta klinika yaratishingiz zarur!
              </p>
            ) : (
              <select
                required
                value={clinicId}
                onChange={(e) => setClinicId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Klinikani tanlang --</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.status === 'active' ? 'Faol' : 'Nofaol'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Administrator F.I.Sh *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masalan: Azizbek Rahimov"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Username (Login) *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin_aziz"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Telefon raqam
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Elektron pochta (ixtiyoriy)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aziz@shifonur.uz"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Boshlang'ich parol *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 6 ta belgi"
                className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading || clinics.length === 0}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Yaratilmoqda...' : 'Adminni yaratish'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Created Credentials Notification */}
      {createdCredentials && (
        <Modal
          isOpen={true}
          onClose={() => setCreatedCredentials(null)}
          title="Administrator hisobi yaratildi!"
          description="Ushbu ma'lumotlarni adminga xavfsiz tarzda yetkazing."
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-2 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500">Klinika:</span>{' '}
                <strong className="text-slate-900 dark:text-white">{createdCredentials.clinicName}</strong>
              </div>
              <div>
                <span className="text-slate-500">F.I.Sh:</span>{' '}
                <strong className="text-slate-900 dark:text-white">{createdCredentials.fullName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Login (Username):</span>{' '}
                <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 font-mono font-bold text-teal-700 dark:text-teal-300">
                  {createdCredentials.username}
                </code>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>{' '}
                <strong className="text-slate-900 dark:text-white">{createdCredentials.email}</strong>
              </div>
              <div>
                <span className="text-slate-500">Parol:</span>{' '}
                <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 font-mono font-bold text-rose-600 dark:text-rose-400">
                  {createdCredentials.password}
                </code>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyCredentials}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 cursor-pointer shadow-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Ma'lumotlarni nusxalash
              </button>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Tushunarli
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
