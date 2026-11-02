import React, { useEffect, useState } from 'react';
import {
  User,
  IdCard,
  Building2,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  Clock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/common/Badge';
import { PasswordChangeModal } from '../../components/common/PasswordChangeModal';
import { getUserAttendanceHistory, formatDateUz } from '../../services/attendanceService';
import { AttendanceRecord } from '../../types';

export const EmployeeProfilePage: React.FC = () => {
  const { userProfile } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (userProfile?.id) {
      getUserAttendanceHistory(userProfile.id).then(setHistory);
    }
  }, [userProfile?.id]);

  const totalWorkedMinutes = history.reduce((acc, r) => acc + (r.totalMinutes || 0), 0);
  const totalHours = (totalWorkedMinutes / 60).toFixed(1);
  const totalDays = history.filter(r => !!r.checkOut).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-teal-600" />
          Xodim Shaxsiy Profili
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Shaxsiy ma'lumotlar, xizmat guvohnomasi va davomat ko'rsatkichlari
        </p>
      </div>

      {/* Main Profile & Digital Badge Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs overflow-hidden relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar / Badge Icon */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-teal-500/20 shrink-0">
            {userProfile?.fullName?.charAt(0) || 'X'}
          </div>

          {/* Details */}
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {userProfile?.fullName}
              </h3>
              {userProfile?.status && <StatusBadge status={userProfile.status} />}
            </div>

            <p className="text-sm font-semibold text-teal-600 dark:text-teal-400">
              {userProfile?.position} • {userProfile?.department || 'Klinika xodimi'}
            </p>

            <div className="pt-2 flex flex-wrap justify-center sm:justify-start items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="inline-flex items-center gap-1 font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300">
                <IdCard className="w-3.5 h-3.5 text-teal-600" />
                <span>{userProfile?.employeeId || 'ID: EMP-0000'}</span>
              </div>
              <div className="inline-flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>{userProfile?.clinicName}</span>
              </div>
            </div>
          </div>

          {/* Password Action */}
          <div className="shrink-0">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-teal-600" />
              Parolni almashtirish
            </button>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block mb-0.5">Login (Foydalanuvchi nomi)</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              @{userProfile?.username}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block mb-0.5">Elektron pochta</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {userProfile?.email}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block mb-0.5">Telefon raqam</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {userProfile?.phone || 'Kiritilmagan'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block mb-0.5">Ish grafigi</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {userProfile?.schedule || '08:30 - 17:30'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block mb-0.5">Ish boshlagan sana</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {userProfile?.startDate || formatDateUz(userProfile?.createdAt?.split('T')[0])}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
            <span className="text-slate-400 block mb-0.5">Hisob turi</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Klinika Xodimi (Doimiy)
            </span>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
            Davomat Ko'rsatkichlari
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50">
              <span className="text-[11px] text-teal-800 dark:text-teal-300">Jami ishlangan soat</span>
              <div className="text-lg font-bold text-teal-900 dark:text-teal-200 mt-0.5">
                {totalHours} soat
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300">Tugallangan smenalar</span>
              <div className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">
                {totalDays} kun
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Jami davomatlar</span>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {history.length} ta yozuv
              </div>
            </div>
          </div>
        </div>
      </div>

      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
};
