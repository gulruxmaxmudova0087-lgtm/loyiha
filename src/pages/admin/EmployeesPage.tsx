import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Power,
  Edit,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  IdCard,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { toggleUserStatus, updateUserProfile } from '../../services/userService';

interface EmployeesPageProps {
  employees: UserProfile[];
  onRefresh: () => void;
  onNavigateAdd: () => void;
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({
  employees,
  onRefresh,
  onNavigateAdd,
}) => {
  const { userProfile } = useAuth();
  const { success, error } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Edit employee modal
  const [editingEmp, setEditingEmp] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editSchedule, setEditSchedule] = useState('');
  const [loading, setLoading] = useState(false);

  // Departments list for filter
  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  const handleToggleStatus = async (emp: UserProfile) => {
    if (!userProfile) return;
    try {
      const newStatus = await toggleUserStatus(emp.id, emp.status, userProfile, emp.clinicId);
      success(`Xodim holati: ${newStatus === 'active' ? 'Faollashtirildi' : 'Nofaol qilindi'}`);
      onRefresh();
    } catch {
      error('Xodim holatini o\'zgartirishda xatolik');
    }
  };

  const handleOpenEdit = (emp: UserProfile) => {
    setEditingEmp(emp);
    setEditFullName(emp.fullName);
    setEditPhone(emp.phone || '');
    setEditPosition(emp.position || '');
    setEditDepartment(emp.department || '');
    setEditSchedule(emp.schedule || '08:30 - 17:30');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp || !userProfile) return;

    setLoading(true);
    try {
      await updateUserProfile(
        editingEmp.id,
        {
          fullName: editFullName,
          phone: editPhone,
          position: editPosition,
          department: editDepartment,
          schedule: editSchedule,
        },
        userProfile
      );
      success('Xodim ma\'lumotlari yangilandi');
      setEditingEmp(null);
      onRefresh();
    } catch {
      error('Xodim ma\'lumotlarini saqlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.employeeId && emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = departmentFilter === 'all' || emp.department === departmentFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Klinika Xodimlari</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Shifokorlar, hamshiralar va texnik xodimlar ro'yxati
          </p>
        </div>
        <button
          onClick={onNavigateAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Yangi xodim qo'shish
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
            placeholder="Ism, xodim ID, login yoki lavozim bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {departments.length > 0 && (
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Barcha bo'limlar</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

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

      {/* Employees Table or Empty State */}
      {filteredEmployees.length === 0 ? (
        <EmptyState
          icon={Users}
          title={searchTerm ? 'Qidiruv bo\'yicha xodim topilmadi' : 'Hozircha xodimlar mavjud emas.'}
          description={
            searchTerm
              ? 'Boshqa so\'zlar bilan qidirib ko\'ring'
              : 'Klinikangiz xodimlarini qo\'shish uchun quyidagi tugmani bosing.'
          }
          actionLabel={!searchTerm ? 'Xodim qo\'shish' : undefined}
          onAction={!searchTerm ? onNavigateAdd : undefined}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Xodim F.I.Sh</th>
                  <th className="px-5 py-3.5 font-semibold">Lavozim & Bo'lim</th>
                  <th className="px-5 py-3.5 font-semibold">Aloqa & Login</th>
                  <th className="px-5 py-3.5 font-semibold">Ish grafigi</th>
                  <th className="px-5 py-3.5 font-semibold">Holati</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {emp.fullName}
                          </div>
                          <div className="text-[11px] font-mono text-teal-600 dark:text-teal-400 font-semibold">
                            {emp.employeeId || 'ID: -'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {emp.position}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {emp.department || 'Umumiy bo\'lim'}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      <div className="text-xs">@{emp.username}</div>
                      {emp.phone && (
                        <div className="text-[11px] text-slate-400 mt-0.5">{emp.phone}</div>
                      )}
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                      {emp.schedule || '08:30 - 17:30'}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={emp.status} />
                    </td>

                    <td className="px-5 py-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        title="Tahrirlash"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(emp)}
                        title={emp.status === 'active' ? 'Nofaol qilish' : 'Faollashtirish'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          emp.status === 'active'
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

      {/* Edit Modal */}
      {editingEmp && (
        <Modal
          isOpen={true}
          onClose={() => setEditingEmp(null)}
          title="Xodim ma'lumotlarini tahrirlash"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                F.I.Sh
              </label>
              <input
                type="text"
                required
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Lavozim
                </label>
                <input
                  type="text"
                  required
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Bo'lim
                </label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Telefon
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Ish grafigi
                </label>
                <input
                  type="text"
                  value={editSchedule}
                  onChange={(e) => setEditSchedule(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingEmp(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
              >
                {loading ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
