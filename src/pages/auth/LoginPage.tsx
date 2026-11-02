import React, { useState } from 'react';
import {
  Stethoscope,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Building2,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password) {
      setErrorMessage('Iltimos, barcha maydonlarni to\'ldiring');
      return;
    }

    setLoading(true);
    try {
      const user = await login(identifier, password);
      toastSuccess(`Xush kelibsiz, ${user.fullName}!`);
    } catch (err: any) {
      const msg = err?.message || 'Kirishda xatolik yuz berdi. Ma\'lumotlarni tekshiring.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillDev = () => {
    setIdentifier('1234');
    setPassword('1234');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-teal-500/10 dark:bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-[400px] h-[400px] bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-lg shadow-teal-500/25 mb-4">
            <Stethoscope className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            MEDISCAN <span className="text-teal-600 dark:text-teal-400">PRO</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            Klinikalar, xodimlar va yagona QR kod orqali davomatni boshqarish platformasi
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tizimga kirish</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Foydalanuvchi nomi yoki elektron pochta orqali kiring
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Foydalanuvchi nomi yoki Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masalan: 1234 yoki admin@klinika.uz"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Parol
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Parolingizni kiriting"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-600/20 hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <>
                  <span>Tizimga kirish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Alternative Google Sign In */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setErrorMessage(null);
                try {
                  const user = await loginWithGoogle();
                  toastSuccess(`Xush kelibsiz, ${user.fullName}!`);
                } catch (err: any) {
                  setErrorMessage(err?.message || 'Google orqali kirishda xatolik yuz berdi');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google hisobi orqali kirish</span>
            </button>
          </div>

          {/* Development Quick Login Helper */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3.5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-900/50">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  Dasturchi boshlang'ich hisobi
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-teal-200/60 dark:bg-teal-900 text-teal-800 dark:text-teal-300">
                  Dev
                </span>
              </div>
              <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 mb-2 leading-relaxed">
                Tizimning dastlabki sozlamalari va klinikalarni yaratish uchun:
              </p>
              <div className="flex items-center justify-between text-xs bg-white dark:bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-teal-100 dark:border-teal-950">
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  Login: <strong>1234</strong> | Parol: <strong>1234</strong>
                </span>
                <button
                  type="button"
                  onClick={handleQuickFillDev}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  To'ldirish
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security notice footer */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          Xavfsiz va shifrlangan korporativ tizim &copy; {new Date().getFullYear()} Mediscan
        </p>
      </div>
    </div>
  );
};
