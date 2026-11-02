import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  Search,
  Calendar,
  Clock,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AttendanceRecord } from '../../types';
import {
  getClinicAttendance,
  getTodayDateString,
  formatTimeUz,
  formatDateUz,
} from '../../services/attendanceService';
import { StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';

export const ClinicAttendancePage: React.FC = () => {
  const { userProfile } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'late' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    if (!userProfile?.clinicId) return;
    setLoading(true);
    try {
      const data = await getClinicAttendance(userProfile.clinicId, selectedDate || undefined);
      setRecords(data);
    } catch (err) {
      console.error('Davomatni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [userProfile?.clinicId, selectedDate]);

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.employeeId && r.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.department && r.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-teal-600" />
            Davomat Jurnali
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Xodimlarning kelish va ketish vaqtlari, ishlangan soatlar hisobi
          </p>
        </div>

        <button
          onClick={fetchAttendance}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Yangilash
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
            placeholder="Xodim F.I.Sh yoki ID bo'yicha qidiring..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-[10px] text-teal-600 font-bold ml-1 hover:underline"
              >
                Barchasi
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Barcha holatlar</option>
            <option value="present">O'z vaqtida</option>
            <option value="late">Kechikkan</option>
            <option value="completed">Yakunlangan</option>
          </select>
        </div>
      </div>

      {/* Attendance Table or Empty State */}
      {filteredRecords.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Davomat ma'lumotlari topilmadi."
          description={
            selectedDate
              ? `${selectedDate} sanasi uchun davomat yozuvlari mavjud emas.`
              : 'Xodimlar klinikaning umumiy QR kodini skanerlaganda ushbu jurnal to\'ldiriladi.'
          }
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Sana</th>
                  <th className="px-5 py-3.5 font-semibold">Xodim F.I.Sh</th>
                  <th className="px-5 py-3.5 font-semibold">Bo'lim</th>
                  <th className="px-5 py-3.5 font-semibold">Kirish vaqti</th>
                  <th className="px-5 py-3.5 font-semibold">Chiqish vaqti</th>
                  <th className="px-5 py-3.5 font-semibold">Ish soati</th>
                  <th className="px-5 py-3.5 font-semibold">Holati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {formatDateUz(r.date)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {r.employeeName}
                      </div>
                      {r.employeeId && (
                        <div className="text-[11px] font-mono text-teal-600 dark:text-teal-400">
                          {r.employeeId}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {r.department || '-'}
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
                    <td className="px-5 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
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
