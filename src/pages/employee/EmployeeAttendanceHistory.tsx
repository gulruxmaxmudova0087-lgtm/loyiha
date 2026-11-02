import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  Search,
  Calendar,
  Clock,
  TrendingUp,
  Download,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AttendanceRecord } from '../../types';
import {
  getUserAttendanceHistory,
  formatTimeUz,
  formatDateUz,
  exportAttendanceToCsv,
} from '../../services/attendanceService';
import { StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';

export const EmployeeAttendanceHistory: React.FC = () => {
  const { userProfile } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userProfile?.id) return;
      try {
        const list = await getUserAttendanceHistory(userProfile.id);
        setRecords(list);
      } catch (err) {
        console.error('Tarixni yuklashda xatolik:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [userProfile?.id]);

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.date.includes(searchTerm) ||
      (r.status && r.status.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMonth = selectedMonth ? r.date.startsWith(selectedMonth) : true;

    return matchesSearch && matchesMonth;
  });

  const totalMinutes = filteredRecords.reduce((acc, r) => acc + (r.totalMinutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const completedCount = filteredRecords.filter((r) => !!r.checkOut).length;
  const lateCount = filteredRecords.filter((r) => r.status === 'late').length;

  const handleExport = () => {
    exportAttendanceToCsv(
      filteredRecords,
      `Mening_Davomat_Tarixim_${userProfile?.fullName || 'Xodim'}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-teal-600" />
            Shaxsiy Davomat Tarixi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Barcha kirish va chiqish vaqtlaringiz, ishlangan soatlar hisobi
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={filteredRecords.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Eksport qilish (CSV)
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Jami ishlangan soat</span>
            <Clock className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {totalHours} <span className="text-xs font-normal text-slate-400">soat</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tanlangan davr bo'yicha</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">To'liq smenalar</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {completedCount} <span className="text-xs font-normal text-slate-400">kun</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Chiqish qayd etilgan</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Kechikishlar</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {lateCount} <span className="text-xs font-normal text-slate-400">marta</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Belgilangan vaqtdan kech</p>
        </div>
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
            placeholder="Sana bo'yicha qidirish (YYYY-MM-DD)..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            {selectedMonth && (
              <button
                onClick={() => setSelectedMonth('')}
                className="text-[10px] text-teal-600 font-bold ml-1 hover:underline"
              >
                Barchasi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History Table */}
      {filteredRecords.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Davomat yozuvlari topilmadi"
          description="Siz hali umumiy QR kod orqali davomat qayd etmagansiz."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Sana</th>
                  <th className="px-5 py-3.5 font-semibold">Kirish vaqti</th>
                  <th className="px-5 py-3.5 font-semibold">Chiqish vaqti</th>
                  <th className="px-5 py-3.5 font-semibold">Ishlangan vaqt</th>
                  <th className="px-5 py-3.5 font-semibold">Holati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4 font-mono font-semibold text-slate-900 dark:text-white">
                      {formatDateUz(r.date)}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-teal-700 dark:text-teal-400">
                      {formatTimeUz(r.checkIn)}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {r.checkOut ? (
                        formatTimeUz(r.checkOut)
                      ) : (
                        <span className="text-amber-500 font-sans italic">Hali ishda</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-800 dark:text-slate-200">
                      {r.totalMinutes !== undefined
                        ? `${(r.totalMinutes / 60).toFixed(1)} soat (${r.totalMinutes} daq)`
                        : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={r.status} />
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
