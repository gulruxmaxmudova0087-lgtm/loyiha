import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users2,
  UserCog,
  BarChart3,
  History,
  Settings,
  UserPlus,
  QrCode,
  CalendarCheck,
  FileSpreadsheet,
  UserCheck,
  Activity,
  X,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}) => {
  const { userProfile } = useAuth();
  const role: UserRole = userProfile?.role || 'employee';

  const developerNav = [
    { id: 'dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
    { id: 'clinics', label: 'Klinikalar', icon: Building2 },
    { id: 'admins', label: 'Adminlar', icon: UserCog },
    { id: 'users', label: 'Foydalanuvchilar', icon: Users2 },
    { id: 'system_stats', label: 'Tizim statistikasi', icon: BarChart3 },
    { id: 'activity_logs', label: 'Faoliyat tarixi', icon: History },
    { id: 'settings', label: 'Sozlamalar', icon: Settings },
  ];

  const clinicAdminNav = [
    { id: 'dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
    { id: 'employees', label: 'Xodimlar', icon: Users2 },
    { id: 'add_employee', label: 'Xodim qo\'shish', icon: UserPlus },
    { id: 'attendance', label: 'Davomat', icon: CalendarCheck },
    { id: 'qr_code', label: 'QR kod', icon: QrCode },
    { id: 'reports', label: 'Hisobotlar', icon: FileSpreadsheet },
    { id: 'clinic_settings', label: 'Sozlamalar', icon: Settings },
  ];

  const employeeNav = [
    { id: 'dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
    { id: 'scan_qr', label: 'QR Skaner', icon: QrCode },
    { id: 'attendance_history', label: 'Davomat tarixi', icon: CalendarCheck },
    { id: 'profile', label: 'Shaxsiy profil', icon: UserCheck },
  ];

  const navItems =
    role === 'developer'
      ? developerNav
      : role === 'clinic_admin'
      ? clinicAdminNav
      : employeeNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                MEDISCAN <span className="text-teal-600 dark:text-teal-400 text-xs">PRO</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
                {role === 'developer'
                  ? 'Bosh Boshqaruv'
                  : role === 'clinic_admin'
                  ? 'Klinika Paneli'
                  : 'Xodim Paneli'}
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-teal-600 dark:text-teal-400'
                      : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>Tizim holati: Barqaror</span>
            </div>
            <p>Vaqt mintaqasi: Asia/Tashkent</p>
          </div>
        </div>
      </aside>
    </>
  );
};
