import React, { useEffect, useState } from 'react';
import { QrCode, ShieldCheck, Info, LogIn, LogOut, Download, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Clinic, AttendanceQrCode } from '../../types';
import { getClinicById, getClinicQrCode } from '../../services/clinicService';
import { ClinicQrCard } from '../../components/qr/ClinicQrCard';

export const ClinicQrPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [qrData, setQrData] = useState<AttendanceQrCode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQrInfo = async () => {
      if (!userProfile?.clinicId) return;
      try {
        const [c, qr] = await Promise.all([
          getClinicById(userProfile.clinicId),
          getClinicQrCode(userProfile.clinicId),
        ]);
        setClinic(c);
        setQrData(qr);
      } catch (err) {
        console.error('QR ma\'lumotlarini olishda xatolik:', err);
      } finally {
        setLoading(false);
      }
    };

    loadQrInfo();
  }, [userProfile?.clinicId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="p-8 text-center text-slate-500">
        Klinika ma'lumotlari topilmadi.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <QrCode className="w-6 h-6 text-teal-600" />
          Klinika Kirish va Chiqish QR Kodlari
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Klinikangiz uchun maxsus <strong>Ishga Kirish</strong> va <strong>Ishdan Chiqish</strong> QR kodlarini yuklab oling va devorga iling
        </p>
      </div>

      {/* Guide Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <LogIn className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
              1. Ishga Kirish QR Kodi
            </h4>
            <p className="text-emerald-800 dark:text-emerald-300">
              Klinika kirish eshigiga yoki qabulxona (resepshn)ga o'rnatiladi. Xodimlar ertalab kelganda skanerlaydi.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm">
              2. Ishdan Chiqish QR Kodi
            </h4>
            <p className="text-blue-800 dark:text-blue-300">
              Klinika chiqish eshigiga yoki navbatchi xonasiga o'rnatiladi. Xodimlar smena yakunida ketayotganda skanerlaydi.
            </p>
          </div>
        </div>
      </div>

      {/* Render the printable & downloadable QR card component */}
      <ClinicQrCard clinic={clinic} qrData={qrData} />
    </div>
  );
};
