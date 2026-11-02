import React, { useState } from 'react';
import { Settings, Shield, Clock, Globe, Save, CheckCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const SettingsPage: React.FC = () => {
  const { success } = useToast();

  const [timezone, setTimezone] = useState('Asia/Tashkent');
  const [defaultWorkStart, setDefaultWorkStart] = useState('08:30');
  const [defaultWorkEnd, setDefaultWorkEnd] = useState('17:30');
  const [lateGracePeriod, setLateGracePeriod] = useState('15');
  const [requirePasswordChange, setRequirePasswordChange] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      success('Tizim sozlamalari muvaffaqiyatli saqlandi!');
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Umumiy Tizim Sozlamalari</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Mediscan platformasining asosiy konfiguratsiyasi va ish vaqti qoidalari
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Work Time Rules */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <Clock className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Ish Grafigi va Kechikish Qoidalari
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Standart ish boshlanish vaqti
              </label>
              <input
                type="time"
                value={defaultWorkStart}
                onChange={(e) => setDefaultWorkStart(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Standart ish tugash vaqti
              </label>
              <input
                type="time"
                value={defaultWorkEnd}
                onChange={(e) => setDefaultWorkEnd(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Ruxsat berilgan kechikish chegarasi (daqiqa)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={lateGracePeriod}
                onChange={(e) => setLateGracePeriod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Ushbu daqiqadan so'ng kirish qayd etilsa "Kechikkan" deb belgilanadi
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Vaqt mintaqasi
              </label>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                  <option value="Asia/Samarkand">Asia/Samarkand (UTC+5)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Security Rules */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <Shield className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Xavfsizlik va Kirish Qoidalari
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requirePasswordChange}
                onChange={(e) => setRequirePasswordChange(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                Yangi yaratilgan foydalanuvchilar birinchi kirishda parollarini almashtirishlari shart
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saqlanmoqda...' : 'Sozlamalarni saqlash'}
          </button>
        </div>
      </form>
    </div>
  );
};
