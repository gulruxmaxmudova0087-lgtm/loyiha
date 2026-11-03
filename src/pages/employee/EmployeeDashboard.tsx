import React, { useEffect, useState } from 'react';
import {
  QrCode,
  Clock,
  CalendarCheck,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Building2,
  Briefcase,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AttendanceRecord } from '../../types';
import {
  getTodayAttendanceForUser,
  getUserAttendanceHistory,
  formatTimeUz,
  formatDateUz,
} from '../../services/attendanceService';
import { StatusBadge } from '../../components/common/Badge';
import { QrScannerModal } from '../../components/qr/QrScannerModal';

interface EmployeeDashboardProps {
  onNavigate: (tabId: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ onNavigate }) => {
  const { userProfile } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAttendance = async () => {
    if (!userProfile?.id) return;
    try {
      const [today, list] = await Promise.all([
        getTodayAttendanceForUser(userProfile.id),
        getUserAttendanceHistory(userProfile.id),
      ]);
      setTodayAttendance(today);
      setHistory(list);
    } catch (err) {
      console.error('Xodim davomatini yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [userProfile?.id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate monthly stats
  const totalWorkedMinutes = history.reduce((acc, r) => acc + (r.totalMinutes || 0), 0);
  const totalHours = (totalWorkedMinutes / 60).toFixed(1);
  const completedDays = history.filter((r) => !!r.checkOut).length;

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-teal-200 backdrop-blur-sm mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5" /> {userProfile?.clinicName || 'Klinika'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Assalomu alaykum, {userProfile?.fullName}!
            </h2>
            <p className="mt-1.5 text-teal-100 text-xs sm:text-sm">
              Lavozim: {userProfile?.position} • Xodim ID: {userProfile?.employeeId || '-'}
            </p>
          </div>

          {/* Quick Scan Action */}
          <div>
            <button
              onClick={() => setShowScanner(true)}
              className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl text-sm sm:text-base font-bold text-teal-950 bg-white hover:bg-teal-50 shadow-lg shadow-black/20 hover:shadow-xl transition-all transform active:scale-95 cursor-pointer"
            >
              <QrCode className="w-6 h-6 text-teal-600" />
              <span>QR Skaner (1-Kirish / 2-Chiqish)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Today's Status Banner Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              Bugungi Davomat Holati
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              1-Kirish yoki 2-Chiqish QR kodini skanerlash orqali belgilanadi
            </p>
          </div>

          <div>
            {!todayAttendance ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                Kelmagan / Qayd etilmagan
              </span>
            ) : !todayAttendance.checkOut ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 animate-pulse">
                Hozir Ishda (Smenada)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ish Yakunlangan
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500 dark:text-slate-400">Ishga kelish vaqti</span>
            <div className="mt-1 text-lg font-bold font-mono text-slate-900 dark:text-white">
              {todayAttendance ? formatTimeUz(todayAttendance.checkIn) : '--:--'}
            </div>
            {todayAttendance?.status === 'late' && (
              <span className="text-[10px] text-amber-600 font-semibold">Kechikkan</span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500 dark:text-slate-400">Ishdan chiqish vaqti</span>
            <div className="mt-1 text-lg font-bold font-mono text-slate-900 dark:text-white">
              {todayAttendance?.checkOut ? formatTimeUz(todayAttendance.checkOut) : '--:--'}
            </div>
            {todayAttendance && !todayAttendance.checkOut && (
              <span className="text-[10px] text-teal-600 font-medium">Smena davom etmoqda</span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40">
            <span className="text-xs text-slate-500 dark:text-slate-400">Bugungi ishlangan vaqt</span>
            <div className="mt-1 text-lg font-bold text-teal-600 dark:text-teal-400">
              {todayAttendance?.totalMinutes !== undefined
                ? `${(todayAttendance.totalMinutes / 60).toFixed(1)} soat`
                : todayAttendance
                ? 'Hisoblanmoqda...'
                : '0 soat'}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Jami ishlangan soat
          </span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {totalHours} <span className="text-xs font-normal text-slate-400">soat</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Barcha qaydlar bo'yicha</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Tugallangan smenalar
          </span>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {completedDays} <span className="text-xs font-normal text-slate-400">kun</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">To'liq chiqish qilingan kunlar</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Ish tartibi
          </span>
          <div className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-200">
            {userProfile?.schedule || '08:30 - 17:30'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Belgilangan jadval</p>
        </div>
      </div>

      {/* Recent Attendance Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Oxirgi Davomat Tarixi
          </h3>
          <button
            onClick={() => onNavigate('attendance_history')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
          >
            Barchasini ko'rish <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Hozircha davomat yozuvlari mavjud emas. "QR Skaner" tugmasi orqali klinika kodini skanerlang.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.slice(0, 5).map((rec) => (
              <div
                key={rec.id}
                className="py-3 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {formatDateUz(rec.date)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Kirish: {formatTimeUz(rec.checkIn)} • Chiqish:{' '}
                    {rec.checkOut ? formatTimeUz(rec.checkOut) : 'Hali ishda'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {rec.totalMinutes !== undefined && (
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {(rec.totalMinutes / 60).toFixed(1)} soat
                    </span>
                  )}
                  <StatusBadge status={rec.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onSuccess={() => loadAttendance()}
      />
    </div>
  );
};
