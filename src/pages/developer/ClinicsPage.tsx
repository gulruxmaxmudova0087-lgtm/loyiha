import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Power,
  QrCode,
  Phone,
  MapPin,
  Clock,
  UserCheck,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Clinic, UserProfile } from '../../types';
import { StatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { ClinicQrCard } from '../../components/qr/ClinicQrCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  createClinic,
  updateClinic,
  toggleClinicStatus,
} from '../../services/clinicService';

interface ClinicsPageProps {
  clinics: Clinic[];
  admins: UserProfile[];
  onRefresh: () => void;
  openCreateImmediately?: boolean;
}

export const ClinicsPage: React.FC<ClinicsPageProps> = ({
  clinics,
  admins,
  onRefresh,
  openCreateImmediately = false,
}) => {
  const { userProfile } = useAuth();
  const { success, error } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(openCreateImmediately);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [viewingQrClinic, setViewingQrClinic] = useState<Clinic | null>(null);
  const [assigningAdminClinic, setAssigningAdminClinic] = useState<Clinic | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('Asia/Tashkent');
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setAddress('');
    setPhone('');
    setTimezone('Asia/Tashkent');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !phone.trim()) {
      error('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    if (!userProfile) return;
    setLoading(true);
    try {
      await createClinic({ name, address, phone, timezone }, userProfile);
      success(`"${name}" klinikasi muvaffaqiyatli yaratildi va umumiy QR kodi faollashtirildi!`);
      resetForm();
      setIsCreateOpen(false);
      onRefresh();
    } catch (err: any) {
      error(err?.message || 'Klinika yaratishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClinic || !userProfile) return;

    setLoading(true);
    try {
      await updateClinic(editingClinic.id, { name, address, phone, timezone }, userProfile);
      success('Klinika ma\'lumotlari muvaffaqiyatli yangilandi');
      setEditingClinic(null);
      resetForm();
      onRefresh();
    } catch (err: any) {
      error(err?.message || 'Klinikani yangilashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (clinic: Clinic) => {
    if (!userProfile) return;
    try {
      const newStatus = await toggleClinicStatus(clinic.id, clinic.status, userProfile);
      success(`Klinika ${newStatus === 'active' ? 'faollashtirildi' : 'nofaol qilindi'}`);
      onRefresh();
    } catch (err: any) {
      error('Holatni o\'zgartirishda xatolik');
    }
  };

  const handleAssignAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningAdminClinic || !userProfile || !selectedAdminId) return;

    const chosenAdmin = admins.find(a => a.id === selectedAdminId);
    if (!chosenAdmin) return;

    setLoading(true);
    try {
      await updateClinic(
        assigningAdminClinic.id,
        { adminId: chosenAdmin.id, adminName: chosenAdmin.fullName },
        userProfile
      );
      success(`"${chosenAdmin.fullName}" ${assigningAdminClinic.name} klinikasiga admin etib biriktirildi`);
      setAssigningAdminClinic(null);
      setSelectedAdminId('');
      onRefresh();
    } catch (err: any) {
      error('Admin biriktirishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredClinics = clinics.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm));
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Klinikalar Boshqaruvi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ro'yxatdan o'tgan barcha shifoxona va klinikalarni boshqarish
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
          Yangi klinika qo'shish
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Klinika nomi, manzili yoki telefon raqami bo'yicha qidiring..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Barchasi ({clinics.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
              filterStatus === 'active'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Faol ({clinics.filter((c) => c.status === 'active').length})
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
              filterStatus === 'inactive'
                ? 'bg-rose-600 text-white'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Nofaol ({clinics.filter((c) => c.status === 'inactive').length})
          </button>
        </div>
      </div>

      {/* Clinics Table or Empty State */}
      {filteredClinics.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={searchTerm ? 'Qidiruv bo\'yicha klinika topilmadi' : 'Hozircha klinika mavjud emas.'}
          description={
            searchTerm
              ? 'Boshqa kalit so\'zlar bilan qidirib ko\'ring'
              : 'Tizimga yangi klinika qo\'shish uchun quyidagi tugmani bosing.'
          }
          actionLabel={!searchTerm ? 'Klinika qo\'shish' : undefined}
          onAction={!searchTerm ? () => setIsCreateOpen(true) : undefined}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Klinika nomi</th>
                  <th className="px-5 py-3.5 font-semibold">Manzil & Aloqa</th>
                  <th className="px-5 py-3.5 font-semibold">Administrator</th>
                  <th className="px-5 py-3.5 font-semibold">Holati</th>
                  <th className="px-5 py-3.5 font-semibold">Umumiy QR</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClinics.map((clinic) => (
                  <tr
                    key={clinic.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {clinic.name}
                          </div>
                          <div className="text-[11px] text-slate-400">ID: {clinic.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{clinic.address}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{clinic.phone}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {clinic.adminName ? (
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                          <span>{clinic.adminName}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAssigningAdminClinic(clinic);
                            setSelectedAdminId('');
                          }}
                          className="text-xs text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                        >
                          + Admin tayinlash
                        </button>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={clinic.status} />
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => setViewingQrClinic(clinic)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        QR Kodni ko'rish
                      </button>
                    </td>

                    <td className="px-5 py-4 text-right space-x-1">
                      <button
                        onClick={() => {
                          setEditingClinic(clinic);
                          setName(clinic.name);
                          setAddress(clinic.address);
                          setPhone(clinic.phone);
                          setTimezone(clinic.timezone || 'Asia/Tashkent');
                        }}
                        title="Tahrirlash"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(clinic)}
                        title={clinic.status === 'active' ? 'Nofaol qilish' : 'Faollashtirish'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          clinic.status === 'active'
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

      {/* Modal: Create Clinic */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Yangi klinika qo'shish"
        description="Klinika ma'lumotlarini to'ldiring. Tizim avtomatik ravishda yagona umumiy davomat QR kodini yaratadi."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Klinika nomi *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Shifo Nur Markaziy Klinikasi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Manzil *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Masalan: Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko'chasi 42-uy"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Telefon raqami *
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Masalan: +998 (71) 200-00-00"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Vaqt mintaqasi
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Asia/Tashkent">Asia/Tashkent (O'zbekiston vaqti, UTC+5)</option>
              <option value="Asia/Samarkand">Asia/Samarkand (UTC+5)</option>
            </select>
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
              disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Yaratilmoqda...' : 'Klinikani saqlash'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Clinic */}
      {editingClinic && (
        <Modal
          isOpen={true}
          onClose={() => setEditingClinic(null)}
          title="Klinika ma'lumotlarini tahrirlash"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Klinika nomi
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Manzil
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Telefon raqami
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingClinic(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? 'Saqlanmoqda...' : 'O\'zgarishlarni saqlash'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: View QR Code */}
      {viewingQrClinic && (
        <Modal
          isOpen={true}
          onClose={() => setViewingQrClinic(null)}
          title={`${viewingQrClinic.name} - Kirish va Chiqish Davomat QR Kodlari`}
          maxWidth="4xl"
        >
          <ClinicQrCard clinic={viewingQrClinic} />
        </Modal>
      )}

      {/* Modal: Assign Admin */}
      {assigningAdminClinic && (
        <Modal
          isOpen={true}
          onClose={() => setAssigningAdminClinic(null)}
          title="Klinika administratorini tayinlash"
          description={`"${assigningAdminClinic.name}" klinikasi uchun mas'ul administratorni tanlang`}
        >
          <form onSubmit={handleAssignAdminSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Administrator
              </label>
              {admins.length === 0 ? (
                <p className="text-xs text-amber-600">
                  Hozircha tizimda administratorlar ro'yxatdan o'tmagan. Avval "Adminlar" bo'limida yangi admin yarating.
                </p>
              ) : (
                <select
                  value={selectedAdminId}
                  onChange={(e) => setSelectedAdminId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Adminni tanlang --</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.fullName} (@{admin.username}) {admin.clinicName ? `[${admin.clinicName}]` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssigningAdminClinic(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={loading || !selectedAdminId}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
              >
                Tayinlash
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
