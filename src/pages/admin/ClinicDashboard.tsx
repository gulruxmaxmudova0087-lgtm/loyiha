import React, { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  UserPlus,
  ArrowRight,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  ClinicAttendanceStats,
  getClinicStats,
  getClinicAttendance,
  getTodayDateString,
  formatTimeUz,
} from '../../services/attendanceService';
import { AttendanceRecord, Clinic } from '../../types';
import { StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { getClinicById } from '../../services/clinicService';

interface ClinicDashboardProps {
  onNavigate: (tabId: string) => void;
}

export const ClinicDashboard: React.FC<ClinicDashboardProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [stats, setStats] = useState<ClinicAttendanceStats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    currentlyWorking: 0,
    lateArrivals: 0,
    completedShifts: 0,
  });
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClinicData = async () => {
      if (!userProfile?.clinicId) return;
      try {
        const [c, s, records] = await Promise.all([
          getClinicById(userProfile.clinicId),
          getClinicStats(userProfile.clinicId),
          getClinicAttendance(userProfile.clinicId, getTodayDateString()),
        ]);
        setClinic(c);
        setStats(s);
        setRecentAttendance(records);
      } catch (err) {
        console.error('Klinika ma\'lumotlarini yuklashda xatolik:', err);
      } finally {
        setLoading(false);
      }
    };

    loadClinicData();
  }, [userProfile?.clinicId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Jami xodimlar',
      value: stats.totalEmployees,
      sub: 'Ro\'yxatdagi faol xodimlar',
      icon: Users,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/40',
    },
    {
      label: 'Bugun kelganlar',
      value: stats.presentToday,
      sub: `${stats.totalEmployees > 0 ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}% davomat`,
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      label: 'Bugun kelmaganlar',
      value: stats.absentToday,
      sub: 'Davomatdan o\'tmagan',
      icon: UserX,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
    },
    {
      label: 'Hozir ishda',
      value: stats.currentlyWorking,
      sub: 'Smenada ishlamoqda',
      icon: Briefcase,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      label: 'Kechikkanlar',
      value: stats.lateArrivals,
      sub: 'Belgilangan vaqtdan kech',
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      label: 'Smenani yakunlagan',
      value: stats.completedShifts,
      sub: 'Chiqish qayd etilgan',
      icon: CheckCircle2,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-teal-700 to-emerald-800 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm mb-2">
            <Calendar className="w-3.5 h-3.5" /> Bugungi Kunlik Hisobot: {getTodayDateString()}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {clinic?.name || userProfile?.clinicName || 'Klinika Paneli'}
          </h2>
          <p className="mt-1.5 text-teal-100 text-xs sm:text-sm max-w-lg">
            Xodimlar davomati, kunlik monitoring va umumiy QR kod boshqaruvi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('add_employee')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-teal-900 hover:bg-teal-50 shadow-sm transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Xodim qo'shish
          </button>
          <button
            onClick={() => onNavigate('qr_code')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            1-Kirish & 2-Chiqish QR kodlari
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  {card.label}
                </span>
                <div className={`w-7 h-7 rounded-lg ${card.bg} ${card.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {card.value}
                </span>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's Attendance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Bugungi Davomat Jurnali
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bugun umumiy QR kodni skaner qilgan xodimlar ro'yxati
            </p>
          </div>
          {recentAttendance.length > 0 && (
            <button
              onClick={() => onNavigate('attendance')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
            >
              Barchasini ko'rish <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentAttendance.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Bugun hali hech kim davomatdan o'tmadi"
            description="Xodimlar klinikaning umumiy QR kodini skanerlaganda ushbu jadvalda real vaqt rejimida paydo bo'ladi."
            actionLabel="QR Kodni ochish"
            onAction={() => onNavigate('qr_code')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-semibold">Xodim F.I.Sh</th>
                  <th className="px-5 py-3 font-semibold">Bo'lim</th>
                  <th className="px-5 py-3 font-semibold">Kirish vaqti</th>
                  <th className="px-5 py-3 font-semibold">Chiqish vaqti</th>
                  <th className="px-5 py-3 font-semibold">Ish soati</th>
                  <th className="px-5 py-3 font-semibold">Holati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {rec.employeeName}
                      </div>
                      {rec.employeeId && (
                        <div className="text-[11px] text-slate-400">{rec.employeeId}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {rec.department || '-'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-teal-700 dark:text-teal-400">
                      {formatTimeUz(rec.checkIn)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {rec.checkOut ? formatTimeUz(rec.checkOut) : <span className="text-amber-500 italic">Hali ishda</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {rec.totalMinutes !== undefined
                        ? `${(rec.totalMinutes / 60).toFixed(1)} soat`
                        : '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={rec.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
