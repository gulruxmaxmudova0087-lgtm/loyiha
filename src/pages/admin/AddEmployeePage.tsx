import React, { useState } from 'react';
import {
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle2,
  Calendar,
  Briefcase,
  Phone,
  Mail,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createEmployee } from '../../services/userService';
import { Modal } from '../../components/common/Modal';

interface AddEmployeePageProps {
  onSuccessNavigate: () => void;
}

export const AddEmployeePage: React.FC<AddEmployeePageProps> = ({ onSuccessNavigate }) => {
  const { userProfile } = useAuth();
  const { success, error } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [schedule, setSchedule] = useState('08:30 - 17:30');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Secure one-time credentials display modal
  const [createdEmployee, setCreatedEmployee] = useState<{
    fullName: string;
    employeeId: string;
    username: string;
    email: string;
    password: string;
    position: string;
    department: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !password || !position.trim()) {
      error('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    if (!userProfile?.clinicId) {
      error('Siz klinikaga biriktirilmagansiz');
      return;
    }

    setLoading(true);
    try {
      const newEmp = await createEmployee(
        {
          firstName,
          lastName,
          username,
          email: email.trim() || `${username.trim().toLowerCase()}@system.local`,
          password,
          phone,
          position,
          department: department || 'Umumiy bo\'lim',
          schedule,
          startDate,
          clinicId: userProfile.clinicId,
          clinicName: userProfile.clinicName || 'Klinika',
        },
        userProfile
      );

      setCreatedEmployee({
        fullName: newEmp.fullName,
        employeeId: newEmp.employeeId || 'EMP',
        username: newEmp.username,
        email: newEmp.email,
        password,
        position: newEmp.position || '',
        department: newEmp.department || '',
      });

      success(`"${newEmp.fullName}" muvaffaqiyatli ro'yxatga olindi!`);
    } catch (err: any) {
      error(err?.message || 'Xodimni yaratishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdEmployee) return;
    const text = `MEDISCAN - Xodim Kirish Ma'lumotlari:\nKlinika: ${userProfile?.clinicName}\nF.I.Sh: ${createdEmployee.fullName}\nXodim ID: ${createdEmployee.employeeId}\nLavozim: ${createdEmployee.position}\nLogin (Username): ${createdEmployee.username}\nEmail: ${createdEmployee.email}\nParol: ${createdEmployee.password}\n\nTizimga kirib, umumiy QR kod orqali davomatingizni qayd etishingiz mumkin.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    success('Xodim ma\'lumotlari nusxalandi');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-teal-600" />
          Yangi Xodim Qo'shish
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Xodim ma'lumotlarini to'ldiring, tizim unga avtomatik ID va hisob yaratadi
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Personal Info */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" />
              Shaxsiy Ma'lumotlar
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Ism *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Masalan: Sardor"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Familiya *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Masalan: Karimov"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Telefon raqami
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 987 65 43"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Ish boshlagan sana
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Job & Work Schedule */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-teal-600" />
              Lavozim va Ish Tartibi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Lavozim *
                </label>
                <input
                  type="text"
                  required
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Masalan: Kardiolog shifokor"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Bo'lim
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Masalan: Terapiya bo'limi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Ish grafigi
                </label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  placeholder="08:30 - 17:30"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Authentication Credentials */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600" />
              Tizimga Kirish Ma'lumotlari
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Foydalanuvchi nomi (Login) *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="sardor_dr"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Email (ixtiyoriy)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sardor@klinika.uz"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Boshlang'ich parol *
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Generatsiya
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kamida 6 ta belgi"
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Xodim ro\'yxatga olinmoqda...' : 'Xodimni saqlash va hisob yaratish'}
            </button>
          </div>
        </form>
      </div>

      {/* One-time credentials display modal */}
      {createdEmployee && (
        <Modal
          isOpen={true}
          onClose={() => {
            setCreatedEmployee(null);
            onSuccessNavigate();
          }}
          title="Xodim Muvaffaqiyatli Qo'shildi!"
          description="Xodim uchun quyidagi kirish ma'lumotlari yaratildi. Ushbu ma'lumotlarni xodimga xavfsiz taqdim eting."
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-teal-200/50 pb-1.5">
                <span className="text-slate-500">Xodim ID:</span>
                <span className="font-bold text-teal-700 dark:text-teal-400">
                  {createdEmployee.employeeId}
                </span>
              </div>
              <div>
                <span className="text-slate-500">F.I.Sh:</span>{' '}
                <strong className="text-slate-900 dark:text-white">{createdEmployee.fullName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Lavozim:</span>{' '}
                <span className="text-slate-800 dark:text-slate-200">
                  {createdEmployee.position} ({createdEmployee.department})
                </span>
              </div>
              <div>
                <span className="text-slate-500">Login (Username):</span>{' '}
                <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 font-mono font-bold text-teal-700 dark:text-teal-300">
                  {createdEmployee.username}
                </code>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>{' '}
                <strong className="text-slate-900 dark:text-white">{createdEmployee.email}</strong>
              </div>
              <div>
                <span className="text-slate-500">Boshlang'ich parol:</span>{' '}
                <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 font-mono font-bold text-rose-600 dark:text-rose-400">
                  {createdEmployee.password}
                </code>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Xodim o'z telefoni yoki kompyuteridan tizimga kirib, umumiy QR kodni skaner qilishi mumkin.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleCopyCredentials}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 cursor-pointer shadow-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Ma'lumotlarni nusxalash
              </button>
              <button
                onClick={() => {
                  setCreatedEmployee(null);
                  onSuccessNavigate();
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Xodimlar ro'yxatiga o'tish
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
