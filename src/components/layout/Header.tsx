import React, { useState } from 'react';
import {
  Sun,
  Moon,
  LogOut,
  KeyRound,
  Building2,
  Menu,
  QrCode,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { RoleBadge } from '../common/Badge';
import { PasswordChangeModal } from '../common/PasswordChangeModal';
import { QrScannerModal } from '../qr/QrScannerModal';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, title = 'Bosh sahifa' }) => {
  const { userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        {/* Mandatory Password Change Alert Banner */}
        {userProfile?.mustChangePassword && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Diqqat: Siz dastlabki vaqtinchalik paroldan foydalanmoqdasiz. Xavfsizlik uchun yangi parol o'rnating!
              </span>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="underline font-bold hover:opacity-80 ml-2 cursor-pointer"
            >
              Parolni almashtirish
            </button>
          </div>
        )}

        <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          {/* Left section: Mobile menu & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {title}
              </h1>
              {userProfile?.clinicName && (
                <div className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-medium">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{userProfile.clinicName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right section: Quick actions, Theme, Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick QR Scanner button for employees */}
            {userProfile?.role === 'employee' && (
              <button
                onClick={() => setShowScannerModal(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all transform active:scale-95 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">QR Skaner</span>
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Yorug\' rejim' : 'Qorong\'i rejim'}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />}
            </button>

            {/* User Info & Actions */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                  {userProfile?.fullName || 'Foydalanuvchi'}
                </span>
                <span className="text-[11px] text-slate-400">
                  @{userProfile?.username || 'user'}
                </span>
              </div>

              {userProfile?.role && <RoleBadge role={userProfile.role} />}

              {/* Password button */}
              <button
                onClick={() => setShowPasswordModal(true)}
                title="Parolni almashtirish"
                className="p-2 rounded-xl text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
              </button>

              {/* Logout button */}
              <button
                onClick={() => logout()}
                title="Tizimdan chiqish"
                className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        mandatory={userProfile?.mustChangePassword}
      />

      <QrScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
      />
    </>
  );
};
