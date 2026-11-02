import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  AlertTriangle,
  Clock,
  UserX,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AttendanceRecord, UserProfile } from '../../types';
import {
  getClinicAttendance,
  exportAttendanceToCsv,
  formatTimeUz,
  formatDateUz,
  getTodayDateString,
} from '../../services/attendanceService';
import { getEmployeesByClinic } from '../../services/userService';
import { StatusBadge } from '../../components/common/Badge';

export const ReportsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { success } = useToast();

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [reportType, setReportType] = useState<
    'all' | 'today' | 'late' | 'working_hours' | 'absent'
  >('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReportData = async () => {
      if (!userProfile?.clinicId) return;
      setLoading(true);
      try {
        const [att, emp] = await Promise.all([
          getClinicAttendance(userProfile.clinicId),
          getEmployeesByClinic(userProfile.clinicId),
        ]);
        setRecords(att);
        setEmployees(emp);
      } catch (err) {
        console.error('Hisobot ma\'lumotlarini yuklashda xatolik:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, [userProfile?.clinicId]);

  const todayStr = getTodayDateString();

  // Filter records based on report type
  const getFilteredData = () => {
    switch (reportType) {
      case 'today':
        return records.filter((r) => r.date === todayStr);
      case 'late':
        return records.filter((r) => r.status === 'late');
      case 'working_hours':
        return records.filter((r) => r.totalMinutes !== undefined && r.totalMinutes > 0);
      case 'absent':
        // Return active employees who haven't checked in today
        const todayAttendeeIds = new Set(
          records.filter((r) => r.date === todayStr).map((r) => r.userId)
        );
        return employees
          .filter((e) => e.status === 'active' && !todayAttendeeIds.has(e.id))
          .map((e): AttendanceRecord => ({
            id: `absent_${e.id}`,
            userId: e.id,
            employeeName: e.fullName,
            employeeId: e.employeeId,
            department: e.department,
            clinicId: e.clinicId!,
            date: todayStr,
            checkIn: '',
            checkOut: undefined,
            totalMinutes: undefined,
            status: 'present' as any,
            createdAt: todayStr,
          }));
      default:
        return records;
    }
  };

  const filteredData = getFilteredData();

  const handleExportCsv = () => {
    const filename = `${userProfile?.clinicName || 'Klinika'}_${reportType}_hisoboti_${todayStr}`;
    exportAttendanceToCsv(filteredData, filename);
    success('Excel uchun CSV hisobot muvaffaqiyatli yuklab olindi!');
  };

  // Metrics summary
  const totalWorkedMinutes = records.reduce((acc, r) => acc + (r.totalMinutes || 0), 0);
  const totalHours = (totalWorkedMinutes / 60).toFixed(1);
  const lateCount = records.filter((r) => r.status === 'late').length;

  return (
    <div className="space-y-6">
      {/* Header and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-600" />
            Hisobotlar va Tahliliy Ma'lumotlar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Davomat, kechikishlar, ish soatlari va Excel (CSV) eksporti
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={filteredData.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Excel (CSV) Yuklab Olish
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Jami ishlangan vaqt</span>
            <Clock className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {totalHours} <span className="text-sm font-normal text-slate-400">soat</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Barcha sessiyalar yig'indisi</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Kechikishlar</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {lateCount} <span className="text-sm font-normal text-slate-400">holat</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Belgilangan vaqtdan kech kelganlar</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Jami davomatlar</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {records.length} <span className="text-sm font-normal text-slate-400">yozuv</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Muvaffaqiyatli qaydlar</p>
        </div>
      </div>

      {/* Report Types Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setReportType('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            reportType === 'all'
              ? 'bg-teal-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Umumiy Davomat ({records.length})
        </button>
        <button
          onClick={() => setReportType('today')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            reportType === 'today'
              ? 'bg-teal-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Bugungi Hisobot ({records.filter((r) => r.date === todayStr).length})
        </button>
        <button
          onClick={() => setReportType('late')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            reportType === 'late'
              ? 'bg-amber-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Kechikkanlar ({lateCount})
        </button>
        <button
          onClick={() => setReportType('working_hours')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            reportType === 'working_hours'
              ? 'bg-teal-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Ish Soatlari Hisoboti
        </button>
        <button
          onClick={() => setReportType('absent')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            reportType === 'absent'
              ? 'bg-rose-600 text-white'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Bugun Kelmaganlar
        </button>
      </div>

      {/* Table */}
      {filteredData.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          Ushbu mezon bo'yicha ma'lumot topilmadi.
        </div>
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
                {filteredData.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {formatDateUz(r.date)}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                      {r.employeeName}
                      {r.employeeId && (
                        <span className="ml-1.5 text-[11px] font-mono text-teal-600 font-normal">
                          ({r.employeeId})
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {r.department || '-'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs">
                      {r.checkIn ? formatTimeUz(r.checkIn) : '-'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs">
                      {r.checkOut ? formatTimeUz(r.checkOut) : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {r.totalMinutes !== undefined
                        ? `${(r.totalMinutes / 60).toFixed(1)} soat`
                        : '-'}
                    </td>
                    <td className="px-5 py-3.5">
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
