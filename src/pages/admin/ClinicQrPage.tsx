import React, { useEffect, useState } from 'react';
import { QrCode, ShieldCheck, Info } from 'lucide-react';
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
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <QrCode className="w-5 h-5 text-teal-600" />
          Klinika Umumiy Davomat QR Kodi
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Ushbu QR kod barcha xodimlar uchun yagona bo'lib, ishga kelish va ketishni qayd etish uchun xizmat qiladi
        </p>
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 flex items-start gap-3">
        <Info className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <div className="text-xs text-teal-900 dark:text-teal-200 space-y-1">
          <p className="font-bold">Muhim qoida:</p>
          <p>
            Har bir xodimga alohida QR kod yaratilmaydi. Ushbu QR kodni chop etib (A4 formatda), klinika kirish eshigi yoki qabulxona (resepshn) peshtaxtasiga o'rnating.
          </p>
          <p>
            Xodimlar ishga kelganda o'z telefonlarida Mediscan'ni ochib ushbu kodni skaner qiladilar (Kirish qayd etiladi), ishdan ketishda esa yana shu kodni skaner qiladilar (Chiqish qayd etiladi).
          </p>
        </div>
      </div>

      {/* Render the printable & downloadable QR card */}
      <ClinicQrCard clinic={clinic} qrData={qrData} />
    </div>
  );
};
