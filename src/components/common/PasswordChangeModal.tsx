import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mandatory?: boolean;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
  mandatory = false,
}) => {
  const { updateUserPassword } = useAuth();
  const { success, error } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      error('Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Parollar bir-biriga mos kelmadi');
      return;
    }

    setLoading(true);
    try {
      await updateUserPassword(newPassword);
      success('Parolingiz muvaffaqiyatli yangilandi!');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      error(err?.message || 'Parolni yangilashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={mandatory ? () => {} : onClose}
      title="Parolni yangilash"
      description={
        mandatory
          ? 'Tizim xavfsizligi uchun boshlang\'ich "1234" parolini yangi xavfsiz parolga almashtiring.'
          : 'Hisobingiz uchun yangi xavfsiz parol o\'rnating.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Yangi parol
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Kamida 6 ta belgi"
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            Parolni tasdiqlang
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Parolni qayta kiriting"
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          {!mandatory && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Bekor qilish
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? 'Saqlanmoqda...' : 'Parolni saqlash'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
