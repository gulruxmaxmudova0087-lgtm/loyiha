import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Download,
  Printer,
  Copy,
  Check,
  QrCode as QrIcon,
  LogIn,
  LogOut,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { Clinic, AttendanceQrCode } from '../../types';
import { useToast } from '../../context/ToastContext';

interface ClinicQrCardProps {
  clinic: Clinic;
  qrData?: AttendanceQrCode | null;
}

export const ClinicQrCard: React.FC<ClinicQrCardProps> = ({ clinic, qrData }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'both' | 'check_in' | 'check_out'>('both');
  const { success } = useToast();

  const checkInCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const checkOutCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Exact QR payloads
  const checkInPayload = JSON.stringify({
    type: 'MEDISCAN_ATTENDANCE',
    clinicId: clinic.id,
    action: 'CHECK_IN',
    token: qrData?.code || `MEDISCAN_${clinic.id}`,
  });

  const checkOutPayload = JSON.stringify({
    type: 'MEDISCAN_ATTENDANCE',
    clinicId: clinic.id,
    action: 'CHECK_OUT',
    token: qrData?.code || `MEDISCAN_${clinic.id}`,
  });

  // Render on-screen QR canvases
  useEffect(() => {
    if (checkInCanvasRef.current) {
      QRCode.toCanvas(
        checkInCanvasRef.current,
        checkInPayload,
        {
          width: 240,
          margin: 2,
          color: {
            dark: '#064e3b', // Deep Emerald
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Kirish QR chizishda xatolik:', error);
        }
      );
    }

    if (checkOutCanvasRef.current) {
      QRCode.toCanvas(
        checkOutCanvasRef.current,
        checkOutPayload,
        {
          width: 240,
          margin: 2,
          color: {
            dark: '#1e3a8a', // Deep Blue
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('Chiqish QR chizishda xatolik:', error);
        }
      );
    }
  }, [checkInPayload, checkOutPayload, viewMode]);

  // Generate High-Resolution (900x1200) A4 Poster Canvas
  const generatePosterCanvas = async (type: 'CHECK_IN' | 'CHECK_OUT'): Promise<HTMLCanvasElement> => {
    const posterCanvas = document.createElement('canvas');
    posterCanvas.width = 900;
    posterCanvas.height = 1200;
    const ctx = posterCanvas.getContext('2d')!;

    // 1. Background fill
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 900, 1200);

    // 2. White main card container
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(40, 40, 820, 1120, 28);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    // 3. Top Banner Gradient
    const bannerGradient = ctx.createLinearGradient(40, 40, 860, 40);
    if (type === 'CHECK_IN') {
      bannerGradient.addColorStop(0, '#047857'); // emerald-700
      bannerGradient.addColorStop(1, '#10b981'); // emerald-500
    } else {
      bannerGradient.addColorStop(0, '#1d4ed8'); // blue-700
      bannerGradient.addColorStop(1, '#3b82f6'); // blue-500
    }

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(40, 40, 820, 160, [28, 28, 0, 0]);
    ctx.fillStyle = bannerGradient;
    ctx.fill();
    ctx.restore();

    // Banner Text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('MEDISCAN • KLINIKA DAVOMAT TIZIMI', 450, 95);

    ctx.font = 'normal 17px system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('Xodimlar Davomatini Qayd Etish Rasmiy QR Kodi', 450, 140);

    // 4. Clinic Name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '0px';

    const clinicName = clinic.name;
    if (clinicName.length > 32) {
      const words = clinicName.split(' ');
      const half = Math.ceil(words.length / 2);
      ctx.fillText(words.slice(0, half).join(' '), 450, 245);
      ctx.fillText(words.slice(half).join(' '), 450, 290);
    } else {
      ctx.fillText(clinicName, 450, 260);
    }

    // 5. Action Badge (1-Kirish vs 2-Chiqish)
    const isCheckIn = type === 'CHECK_IN';
    const badgeNumber = isCheckIn ? '1' : '2';
    const badgeText = isCheckIn ? '1 - ISHGA KIRISH DAVOMATI' : '2 - ISHDAN CHIQISH DAVOMATI';
    const badgeSub = isCheckIn
      ? 'Klinikaga kirish eshigi yoki qabulxona (resepshn)ga ilinadi'
      : 'Klinikadan chiqish eshigiga ilinadi (ish kuni yakunida)';
    const badgeBg = isCheckIn ? '#ecfdf5' : '#eff6ff';
    const badgeBorder = isCheckIn ? '#10b981' : '#3b82f6';
    const badgeTextColor = isCheckIn ? '#065f46' : '#1e40af';

    // Badge Pill
    ctx.fillStyle = badgeBg;
    ctx.beginPath();
    ctx.roundRect(160, 310, 580, 52, 26);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = badgeBorder;
    ctx.stroke();

    ctx.fillStyle = badgeTextColor;
    ctx.font = 'bold 23px system-ui, -apple-system, sans-serif';
    ctx.fillText(badgeText, 450, 345);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(badgeSub, 450, 395);

    // 6. Draw QR Code onto temporary canvas
    const qrTempCanvas = document.createElement('canvas');
    const qrDataUrl = isCheckIn ? checkInPayload : checkOutPayload;
    await QRCode.toCanvas(qrTempCanvas, qrDataUrl, {
      width: 440,
      margin: 1,
      color: {
        dark: isCheckIn ? '#064e3b' : '#1e3a8a',
        light: '#ffffff',
      },
    });

    // White card behind QR
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(210, 425, 480, 480, 20);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = isCheckIn ? '#a7f3d0' : '#bfdbfe';
    ctx.stroke();

    // QR Image
    ctx.drawImage(qrTempCanvas, 230, 445, 440, 440);

    // 7. Instructions Card
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(140, 930, 620, 120, 16);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#e2e8f0';
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.fillText('DAVOMATDAN O\'TISH QOIDASI:', 450, 960);

    ctx.fillStyle = '#334155';
    ctx.font = '500 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('1. Mediscan tizimidagi profilingizga kiring', 450, 990);
    ctx.fillText(
      isCheckIn
        ? '2. "QR Skaner" tugmasini bosib, ertalab ushbu 1-Kirish QR kodini skanerlang'
        : '2. "QR Skaner" tugmasini bosib, ish kuni oxirida ushbu 2-Chiqish QR kodini skanerlang',
      450,
      1018
    );

    // 8. Footer (Clinic details)
    ctx.fillStyle = '#64748b';
    ctx.font = 'normal 14px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${clinic.address} • Tel: ${clinic.phone || 'Klinika ma\'lumotlari'}`, 450, 1100);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'normal 12px system-ui, -apple-system, sans-serif';
    ctx.fillText('© Mediscan Professional Clinic Attendance • Barcha huquqlar himoyalangan', 450, 1125);

    return posterCanvas;
  };

  // Download Single Poster as PNG
  const handleDownloadPoster = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    setIsGenerating(true);
    try {
      const poster = await generatePosterCanvas(type);
      const link = document.createElement('a');
      const typeLabel = type === 'CHECK_IN' ? '1_ISHGA_KIRISH' : '2_ISHDAN_CHIQISH';
      link.download = `${clinic.name.replace(/\s+/g, '_')}_${typeLabel}_QR_POSTER.png`;
      link.href = poster.toDataURL('image/png');
      link.click();
      success(`${type === 'CHECK_IN' ? '1-Kirish' : '2-Chiqish'} QR poster rasmi yuklab olindi!`);
    } catch (err) {
      console.error('Poster yuklashda xatolik:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Raw QR image
  const handleDownloadRawQr = (type: 'CHECK_IN' | 'CHECK_OUT') => {
    const canvas = type === 'CHECK_IN' ? checkInCanvasRef.current : checkOutCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    const label = type === 'CHECK_IN' ? '1_Kirish' : '2_Chiqish';
    link.download = `${clinic.name.replace(/\s+/g, '_')}_${label}_QR_Kod.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    success(`${label} QR kodi rasmi (.png) yuklab olindi!`);
  };

  // Download Both Posters
  const handleDownloadBoth = async () => {
    setIsGenerating(true);
    try {
      // 1. Kirish
      const inPoster = await generatePosterCanvas('CHECK_IN');
      const link1 = document.createElement('a');
      link1.download = `${clinic.name.replace(/\s+/g, '_')}_1_ISHGA_KIRISH_QR_POSTER.png`;
      link1.href = inPoster.toDataURL('image/png');
      link1.click();

      // 2. Chiqish shortly after
      setTimeout(async () => {
        const outPoster = await generatePosterCanvas('CHECK_OUT');
        const link2 = document.createElement('a');
        link2.download = `${clinic.name.replace(/\s+/g, '_')}_2_ISHDAN_CHIQISH_QR_POSTER.png`;
        link2.href = outPoster.toDataURL('image/png');
        link2.click();
        success('Ikkala QR poster rasmlari (1-Kirish va 2-Chiqish) muvaffaqiyatli yuklab olindi!');
        setIsGenerating(false);
      }, 600);
    } catch (err) {
      console.error('Yuklashda xato:', err);
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = (type: 'CHECK_IN' | 'CHECK_OUT') => {
    const payload = type === 'CHECK_IN' ? checkInPayload : checkOutPayload;
    navigator.clipboard.writeText(payload);
    setCopiedType(type);
    success(`${type === 'CHECK_IN' ? '1-Kirish' : '2-Chiqish'} QR kodi nusxalandi!`);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('both')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'both'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Ikkala QR kod (Yonma-yon)
          </button>
          <button
            onClick={() => setViewMode('check_in')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'check_in'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Faqat 1-Kirish QR
          </button>
          <button
            onClick={() => setViewMode('check_out')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'check_out'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Faqat 2-Chiqish QR
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadBoth}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ikkala QR kodni yuklab olish (.png)</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Chop etish (A4)"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2 Distinct QR Cards Grid */}
      <div
        className={`grid gap-6 ${
          viewMode === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-xl mx-auto'
        }`}
      >
        {/* ============================================================ */}
        {/* CARD 1: 1-KIRISH DAVOMAT QR KODI (CHECK-IN) */}
        {/* ============================================================ */}
        {(viewMode === 'both' || viewMode === 'check_in') && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-200 dark:border-emerald-800/60 shadow-md overflow-hidden flex flex-col justify-between">
            {/* Header Banner */}
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 text-white backdrop-blur-xs mb-1">
                    <LogIn className="w-3.5 h-3.5" /> 1-KIRISH DAVOMAT QR KODI
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight">{clinic.name}</h3>
                  <p className="text-white/85 text-xs mt-0.5">
                    Klinika kirish eshigi yoki qabulxonaga ilinadi
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <LogIn className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Poster Card Body */}
            <div className="p-6 flex flex-col items-center flex-1">
              <div className="w-full max-w-sm p-5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900 text-center">
                <div className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 mb-3">
                  ▶ ISHGA KIRISH (CHECK-IN) ◀
                </div>

                {/* QR Canvas */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-100 inline-block my-1">
                  <canvas ref={checkInCanvasRef} className="w-52 h-52 sm:w-56 sm:h-56 mx-auto rounded-lg" />
                </div>

                <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300">
                    Xodimlar ertalab ishga kelganda:
                  </p>
                  <p>1. Tizimdagi profilingizga kiring</p>
                  <p>2. "QR Skaner" tugmasini bosing</p>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                    3. Ushbu 1-Kirish kodiga qarating
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 w-full max-w-sm space-y-2">
                <button
                  onClick={() => handleDownloadPoster('CHECK_IN')}
                  disabled={isGenerating}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>1-Kirish QR-ni rasm qilib yuklab olish (.png)</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadRawQr('CHECK_IN')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Faqat QR rasm
                  </button>

                  <button
                    onClick={() => handleCopy('CHECK_IN')}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="QR ma'lumotlarini nusxalash"
                  >
                    {copiedType === 'CHECK_IN' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CARD 2: 2-CHIQISH DAVOMAT QR KODI (CHECK-OUT) */}
        {/* ============================================================ */}
        {(viewMode === 'both' || viewMode === 'check_out') && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-blue-200 dark:border-blue-800/60 shadow-md overflow-hidden flex flex-col justify-between">
            {/* Header Banner */}
            <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 text-white backdrop-blur-xs mb-1">
                    <LogOut className="w-3.5 h-3.5" /> 2-CHIQISH DAVOMAT QR KODI
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight">{clinic.name}</h3>
                  <p className="text-white/85 text-xs mt-0.5">
                    Klinika chiqish eshigiga ilinadi (smena yakunida)
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <LogOut className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Poster Card Body */}
            <div className="p-6 flex flex-col items-center flex-1">
              <div className="w-full max-w-sm p-5 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-900 text-center">
                <div className="inline-block px-3.5 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700 mb-3">
                  ◀ ISHDAN CHIQISH (CHECK-OUT) ▶
                </div>

                {/* QR Canvas */}
                <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-blue-100 inline-block my-1">
                  <canvas ref={checkOutCanvasRef} className="w-52 h-52 sm:w-56 sm:h-56 mx-auto rounded-lg" />
                </div>

                <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-blue-800 dark:text-blue-300">
                    Xodimlar ish kuni yakunida:
                  </p>
                  <p>1. Tizimdagi profilingizga kiring</p>
                  <p>2. "QR Skaner" tugmasini bosing</p>
                  <p className="font-semibold text-blue-700 dark:text-blue-400">
                    3. Ushbu 2-Chiqish kodiga qarating
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 w-full max-w-sm space-y-2">
                <button
                  onClick={() => handleDownloadPoster('CHECK_OUT')}
                  disabled={isGenerating}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>2-Chiqish QR-ni rasm qilib yuklab olish (.png)</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadRawQr('CHECK_OUT')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Faqat QR rasm
                  </button>

                  <button
                    onClick={() => handleCopy('CHECK_OUT')}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="QR ma'lumotlarini nusxalash"
                  >
                    {copiedType === 'CHECK_OUT' ? (
                      <Check className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Helpful Instructions Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900 dark:text-white">
            Klinikada QR kodlardan to'g'ri foydalanish tartibi:
          </h4>
          <p>
            • <strong>1-Kirish QR kodi:</strong> Shifoxona kirish eshigiga ilinadi. Xodimlar ertalab kelganda ushbu kodni skanerlaydi.
          </p>
          <p>
            • <strong>2-Chiqish QR kodi:</strong> Shifoxonaning chiqish eshigiga ilinadi. Xodimlar ish vaqti tugab ketayotganda ushbu kodni skanerlaydi.
          </p>
          <p>
            • Rasmlarni <strong>.png</strong> formatda yuklab olib, rangli printerda yoki A4 fotoqog'ozda to'g'ridan-to'g'ri chop etish mumkin.
          </p>
        </div>
      </div>
    </div>
  );
};
