import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Building2,
  Users,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Clinic, UserProfile, AttendanceRecord } from '../../types';

interface SystemStatsPageProps {
  clinics: Clinic[];
  users: UserProfile[];
  attendanceRecords: AttendanceRecord[];
}

export const SystemStatsPage: React.FC<SystemStatsPageProps> = ({
  clinics,
  users,
  attendanceRecords,
}) => {
  const activeClinics = clinics.filter(c => c.status === 'active').length;
  const totalEmployees = users.filter(u => u.role === 'employee').length;
  const activeEmployees = users.filter(u => u.role === 'employee' && u.status === 'active').length;
  const totalAdmins = users.filter(u => u.role === 'clinic_admin').length;

  const totalAttendance = attendanceRecords.length;
  const onTimeAttendance = attendanceRecords.filter(a => a.status === 'present' || a.status === 'completed').length;
  const lateAttendance = attendanceRecords.filter(a => a.status === 'late').length;

  const onTimeRate = totalAttendance > 0 ? Math.round((onTimeAttendance / totalAttendance) * 100) : 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tizim Statistikasi & Tahlil</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Platformaning umumiy faolligi, xodimlar ko'rsatkichi va davomat intizomi
        </p>
      </div>

      {/* Primary Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Klinika qamrovi</span>
            <Building2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{activeClinics}</span>
            <span className="text-xs text-slate-400">/ {clinics.length} faol</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all"
              style={{ width: `${clinics.length ? (activeClinics / clinics.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Xodimlar faolligi</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{activeEmployees}</span>
            <span className="text-xs text-slate-400">/ {totalEmployees} faol xodim</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all"
              style={{ width: `${totalEmployees ? (activeEmployees / totalEmployees) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Vaqtida kelish ko'rsatkichi</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{onTimeRate}%</span>
            <span className="text-xs text-slate-400">intizom ko'rsatkichi</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${onTimeRate}%` }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Kechikishlar soni</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lateAttendance}</span>
            <span className="text-xs text-slate-400">ta holat qayd etilgan</span>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">09:15 dan keyingi kirishlar</p>
        </div>
      </div>

      {/* Clinic Distribution Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Klinikalar Bo'yicha Xodimlar va Davomat Taqsimoti
        </h3>
        {clinics.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Hozircha klinikalar mavjud emas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Klinika</th>
                  <th className="px-4 py-3">Administrator</th>
                  <th className="px-4 py-3">Xodimlar soni</th>
                  <th className="px-4 py-3">Davomat yozuvlari</th>
                  <th className="px-4 py-3">Holati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {clinics.map((c) => {
                  const empCount = users.filter(u => u.clinicId === c.id && u.role === 'employee').length;
                  const attCount = attendanceRecords.filter(a => a.clinicId === c.id).length;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">{c.name}</td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{c.adminName || 'Biriktirilmagan'}</td>
                      <td className="px-4 py-3.5 font-bold text-teal-600 dark:text-teal-400">{empCount} nafar</td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{attCount} ta</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          c.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}>
                          {c.status === 'active' ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
