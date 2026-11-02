import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, Copy, Check, QrCode as QrIcon, ShieldCheck } from 'lucide-react';
import { Clinic, AttendanceQrCode } from '../../types';
import { useToast } from '../../context/ToastContext';

interface ClinicQrCardProps {
  clinic: Clinic;
  qrData?: AttendanceQrCode | null;
}

export const ClinicQrCard: React.FC<ClinicQrCardProps> = ({ clinic, qrData }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const printAreaRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const qrPayload = JSON.stringify({
    type: 'CLINIC_ATTENDANCE_QR',
    clinicId: clinic.id,
    qrId: clinic.attendanceQrId,
    code: qrData?.code || `MEDISCAN_CLINIC_${clinic.id}`,
  });

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        qrPayload,
        {
          width: 320,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('QR kod chizishda xatolik:', error);
        }
      );
    }
  }, [qrPayload]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${clinic.name.replace(/\s+/g, '_')}_Davomat_QR.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    success('QR kod yuklab olindi!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    success('QR kodi nusxalandi');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Rasmiy Davomat QR Kodi
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{clinic.name}</h2>
            <p className="text-teal-100 text-xs sm:text-sm mt-1">
              Barcha xodimlar uchun yagona umumiy davomat QR kodi (Kirish & Chiqish)
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <QrIcon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 flex flex-col items-center">
        {/* Printable Card Area */}
        <div
          ref={printAreaRef}
          className="print:visible print:fixed print:inset-0 print:m-0 print:p-8 print:bg-white print:z-[9999] flex flex-col items-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 max-w-sm w-full text-center"
        >
          <div className="mb-3">
            <span className="text-xs uppercase tracking-widest font-bold text-teal-600 dark:text-teal-400">
              MEDISCAN DAVOMAT
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {clinic.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Xodimlar kirish va chiqish paytida skanerlashlari shart
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200/80 my-3">
            <canvas ref={canvasRef} className="w-64 h-64 mx-auto rounded-lg" />
          </div>

          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Qanday ishlatiladi?
            </p>
            <p>1. Mediscan tizimidagi profilingizga kiring</p>
            <p>2. "QR Skaner" tugmasini bosing</p>
            <p>3. Kamerani ushbu QR kodga qarating</p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 w-full text-[11px] text-slate-400">
            <p>{clinic.address}</p>
            {clinic.phone && <p className="mt-0.5">Tel: {clinic.phone}</p>}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center w-full max-w-sm">
          <button
            onClick={handleDownload}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Yuklab olish
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Chop etish
          </button>
          <button
            onClick={handleCopy}
            title="QR ma'lumotlarini nusxalash"
            className="inline-flex items-center justify-center p-2.5 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="mt-5 text-center text-xs text-slate-400">
          Ushbu QR kod klinika devoriga yoki qabulxonaga o'rnatiladi. Har bir xodim bitta QR orqali davomat qiladi.
        </div>
      </div>
    </div>
  );
};
