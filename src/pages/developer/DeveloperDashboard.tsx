import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  UserCheck,
  CalendarCheck,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
  Activity,
  QrCode,
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Clinic, UserProfile, ActivityLog } from '../../types';
import { StatusBadge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDateUz } from '../../services/attendanceService';

interface DeveloperDashboardProps {
  onNavigate: (tabId: string) => void;
  onOpenCreateClinic: () => void;
}

export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({
  onNavigate,
  onOpenCreateClinic,
}) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch clinics
        const clinicSnap = await getDocs(collection(db, 'clinics'));
        const loadedClinics = clinicSnap.docs.map(d => ({ ...d.data(), id: d.id } as Clinic));
        setClinics(loadedClinics);

        // 2. Fetch users
        const usersSnap = await getDocs(collection(db, 'users'));
        const loadedUsers = usersSnap.docs.map(d => ({ ...d.data(), id: d.id } as UserProfile));
        setUsers(loadedUsers);

        // 3. Fetch attendance count
        const attSnap = await getDocs(collection(db, 'attendance'));
        setAttendanceCount(attSnap.size);

        // 4. Fetch recent logs
        const logsQ = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(6));
        const logsSnap = await getDocs(logsQ);
        setRecentLogs(logsSnap.docs.map(d => ({ ...d.data(), id: d.id } as ActivityLog)));
      } catch (err) {
        console.error('Boshqaruv paneli ma\'lumotlarini yuklashda xatolik:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalClinics = clinics.length;
  const activeClinics = clinics.filter(c => c.status === 'active').length;
  const totalAdmins = users.filter(u => u.role === 'clinic_admin').length;
  const totalEmployees = users.filter(u => u.role === 'employee').length;

  const statCards = [
    {
      label: 'Jami klinikalar',
      value: totalClinics,
      sub: `${activeClinics} ta faol holatda`,
      icon: Building2,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/40',
    },
    {
      label: 'Klinika adminlari',
      value: totalAdmins,
      sub: 'Biriktirilgan administratorlar',
      icon: UserCheck,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      label: 'Jami xodimlar',
      value: totalEmployees,
      sub: 'Ro\'yxatdan o\'tgan xodimlar',
      icon: Users,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      label: 'Davomat yozuvlari',
      value: attendanceCount,
      sub: 'Jami qayd etilgan sessiyalar',
      icon: CalendarCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-teal-200 backdrop-blur-sm mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Bosh Dasturchi & Super Admin Boshqaruvi
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Tizim Umumiy Ko'rsatkichlari
          </h2>
          <p className="mt-2 text-teal-100 text-sm leading-relaxed">
            Mediscan platformasida ro'yxatdan o'tgan barcha tibbiyot maskanlari, administratorlar, xodimlar va yagona QR kod orqali davomat yozuvlarini markazlashgan boshqaruvi.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={onOpenCreateClinic}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-teal-900 hover:bg-teal-50 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Yangi klinika qo'shish
            </button>
            <button
              onClick={() => onNavigate('admins')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-colors cursor-pointer"
            >
              Admin tayinlash
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {card.value}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Clinics Overview & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clinics list (2 columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ro'yxatdagi Klinikalar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Eng oxirgi qo'shilgan klinikalar ro'yxati
              </p>
            </div>
            {clinics.length > 0 && (
              <button
                onClick={() => onNavigate('clinics')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                Barchasini ko'rish <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {clinics.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Hozircha klinika mavjud emas."
              description="Tizimni ishga tushirish uchun dastlabki klinika yoki shifoxonani qo'shing."
              actionLabel="Birinchi klinikani yaratish"
              onAction={onOpenCreateClinic}
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {clinics.slice(0, 5).map((clinic) => (
                <div
                  key={clinic.id}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {clinic.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {clinic.address} • {clinic.adminName || 'Admin tayinlanmagan'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={clinic.status} />
                    <button
                      onClick={() => onNavigate('clinics')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Activity Logs (1 column) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Faoliyat Tarixi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tizimdagi oxirgi harakatlar
              </p>
            </div>
          </div>

          {recentLogs.length === 0 ? (
            <div className="my-auto py-8 text-center text-xs text-slate-400">
              Faoliyat jurnali hozircha bo'sh.
            </div>
          ) : (
            <div className="space-y-3.5 flex-1">
              {recentLogs.map((log) => (
                <div key={log.id} className="text-xs border-l-2 border-teal-500 pl-3 py-0.5 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {log.actorName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDateUz(log.timestamp.split('T')[0])}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-2">
                    {log.details}
                  </p>
                </div>
              ))}
            </div>
          )}

          {recentLogs.length > 0 && (
            <button
              onClick={() => onNavigate('activity_logs')}
              className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-center text-teal-600 dark:text-teal-400 hover:underline"
            >
              Barcha jurnalni ko'rish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
