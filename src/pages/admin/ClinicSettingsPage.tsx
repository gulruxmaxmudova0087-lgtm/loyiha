import React, { useEffect, useState } from 'react';
import { Building2, Save, MapPin, Phone, Globe, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getClinicById, updateClinic } from '../../services/clinicService';
import { Clinic } from '../../types';

export const ClinicSettingsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const { success, error } = useToast();

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('Asia/Tashkent');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadClinic = async () => {
      if (!userProfile?.clinicId) return;
      try {
        const c = await getClinicById(userProfile.clinicId);
        if (c) {
          setClinic(c);
          setName(c.name);
          setAddress(c.address);
          setPhone(c.phone);
          setTimezone(c.timezone || 'Asia/Tashkent');
        }
      } catch (err) {
        console.error('Klinika ma\'lumotlarini yuklashda xatolik:', err);
      } finally {
        setLoading(false);
      }
    };
    loadClinic();
  }, [userProfile?.clinicId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.clinicId || !userProfile) return;

    setSaving(true);
    try {
      await updateClinic(userProfile.clinicId, { name, address, phone, timezone }, userProfile);
      success('Klinika ma\'lumotlari muvaffaqiyatli saqlandi!');
    } catch (err: any) {
      error(err?.message || 'Ma\'lumotlarni saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-600" />
          Klinika Sozlamalari
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Klinika nomi, manzili, aloqa raqamlari va vaqt mintaqasi
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Klinika nomi *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Manzil *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Telefon raqami *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Vaqt mintaqasi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Globe className="w-4 h-4" />
              </div>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                <option value="Asia/Samarkand">Asia/Samarkand (UTC+5)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saqlanmoqda...' : 'O\'zgarishlarni saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
