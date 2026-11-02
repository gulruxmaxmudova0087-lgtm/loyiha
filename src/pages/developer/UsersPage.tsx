import React, { useState } from 'react';
import { Search, Users, Power, Mail, Phone, Building2 } from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { RoleBadge, StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { toggleUserStatus } from '../../services/userService';

interface UsersPageProps {
  users: UserProfile[];
  onRefresh: () => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ users, onRefresh }) => {
  const { userProfile } = useAuth();
  const { success, error } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const handleToggleStatus = async (user: UserProfile) => {
    if (!userProfile) return;
    try {
      const newStatus = await toggleUserStatus(user.id, user.status, userProfile, user.clinicId);
      success(`Foydalanuvchi holati: ${newStatus === 'active' ? 'Faollashtirildi' : 'Nofaol qilindi'}`);
      onRefresh();
    } catch {
      error('Holatni o\'zgartirishda xatolik yuz berdi');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.clinicName && u.clinicName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.position && u.position.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Foydalanuvchilar Ro'yxati
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Tizimdagi barcha dasturchilar, klinika adminlari va xodimlar hisoblari
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ism, login, email yoki lavozim bo'yicha qidiring..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Barcha rollar</option>
            <option value="developer">Bosh Dasturchilar</option>
            <option value="clinic_admin">Klinika Adminlari</option>
            <option value="employee">Xodimlar</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Barcha holatlar</option>
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
          </select>
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Foydalanuvchilar topilmadi"
          description="Qidiruv mezonlari bo'yicha hech qanday hisob topilmadi."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Foydalanuvchi</th>
                  <th className="px-5 py-3.5 font-semibold">Roli</th>
                  <th className="px-5 py-3.5 font-semibold">Klinika / Tashkilot</th>
                  <th className="px-5 py-3.5 font-semibold">Aloqa</th>
                  <th className="px-5 py-3.5 font-semibold">Holati</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {u.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          @{u.username} {u.employeeId ? `• ID: ${u.employeeId}` : ''}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <RoleBadge role={u.role} />
                    </td>

                    <td className="px-5 py-4">
                      {u.clinicName ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>{u.clinicName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Asosiy tizim</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      <div className="text-xs">{u.email}</div>
                      {u.phone && <div className="text-[11px] text-slate-400 mt-0.5">{u.phone}</div>}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={u.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      {u.role !== 'developer' && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.status === 'active' ? 'Nofaol qilish' : 'Faollashtirish'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            u.status === 'active'
                              ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                              : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
