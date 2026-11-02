import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import {
  Camera,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Keyboard,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { processAttendanceScan, formatTimeUz } from '../../services/attendanceService';
import { AttendanceResult } from '../../types';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: AttendanceResult) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { userProfile } = useAuth();
  const [scannerStarted, setScannerStarted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<AttendanceResult | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [showManualInput, setShowManualInput] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(true);

  // Play audio chime for success
  const playAudioFeedback = (isSuccess: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.35);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch {
      // AudioContext not allowed or not supported
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Stop scanner preview temporarily
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.pause(true);
      } catch (err) {
        console.warn('Skanerni to\'xtatishda xatolik:', err);
      }
    }

    if (!userProfile) {
      setScanResult({
        success: false,
        type: 'CHECK_IN',
        message: 'Foydalanuvchi ma\'lumotlari aniqlanmadi.',
      });
      setIsProcessing(false);
      return;
    }

    try {
      const result = await processAttendanceScan(userProfile, decodedText);
      setScanResult(result);

      if (result.success) {
        playAudioFeedback(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0d9488', '#10b981', '#38bdf8', '#fbbf24'],
        });
        if (onSuccess) onSuccess(result);
      } else {
        playAudioFeedback(false);
      }
    } catch (err: any) {
      playAudioFeedback(false);
      setScanResult({
        success: false,
        type: 'CHECK_IN',
        message: err?.message || 'Davomatni tekshirishda xatolik yuz berdi.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Start Camera Scanner
  const startCamera = async () => {
    setCameraError(null);
    setScanResult(null);

    const element = document.getElementById('qr-reader-container');
    if (!element) return;

    try {
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
        } catch {
          // Ignore
        }
      }

      const html5QrCode = new Html5Qrcode('qr-reader-container', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // onScanError: silent
        }
      );

      if (isMountedRef.current) {
        setScannerStarted(true);
        setScanning(true);
      }
    } catch (err: any) {
      console.error('Kamera xatoligi:', err);
      if (isMountedRef.current) {
        setCameraError(
          err?.message?.includes('Permission')
            ? 'Kamera ruxsati rad etildi. Brauzer sozlamalarida kameraga ruxsat bering.'
            : 'Kamera topilmadi yoki u boshqa dastur tomonidan band qilingan.'
        );
        setShowManualInput(true);
      }
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Kamerani to\'xtatishda xatolik:', err);
      }
      scannerRef.current = null;
    }
    setScannerStarted(false);
    setScanning(false);
  };

  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen) {
      setScanResult(null);
      setCameraError(null);
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScanSuccess(manualCode.trim());
  };

  const handleResetAndScanAgain = async () => {
    setScanResult(null);
    setManualCode('');
    if (scannerRef.current) {
      try {
        await scannerRef.current.resume();
      } catch {
        startCamera();
      }
    } else {
      startCamera();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={() => {
          stopCamera();
          onClose();
        }}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Davomat QR Skaneri
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Klinikaning umumiy QR kodini skanerlang
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Body */}
        <div className="mt-4 flex flex-col items-center">
          {scanResult ? (
            /* Result Screen */
            <div
              className={`w-full p-6 rounded-2xl border text-center transition-all ${
                scanResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="flex justify-center mb-3">
                {scanResult.success ? (
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                )}
              </div>

              <h4 className="text-lg font-bold mb-1">
                {scanResult.success
                  ? scanResult.type === 'CHECK_IN'
                    ? 'Ishga Kirish Qayd Etildi!'
                    : 'Ishdan Chiqish Qayd Etildi!'
                  : 'Davomat Qayd Etilmadi'}
              </h4>
              <p className="text-sm font-medium mb-4">{scanResult.message}</p>

              {scanResult.record && (
                <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-black/5 dark:border-white/5 text-left text-xs space-y-1.5 mb-4 text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Xodim:</span>
                    <span className="font-semibold">{scanResult.record.employeeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sana:</span>
                    <span className="font-semibold">{scanResult.record.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kirish vaqti:</span>
                    <span className="font-semibold">{formatTimeUz(scanResult.record.checkIn)}</span>
                  </div>
                  {scanResult.record.checkOut && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Chiqish vaqti:</span>
                      <span className="font-semibold">{formatTimeUz(scanResult.record.checkOut)}</span>
                    </div>
                  )}
                  {scanResult.record.totalMinutes !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ishlangan vaqt:</span>
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {(scanResult.record.totalMinutes / 60).toFixed(1)} soat ({scanResult.record.totalMinutes} daqiqa)
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleResetAndScanAgain}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer"
                >
                  Qayta skanerlash
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-sm cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera View */
            <div className="w-full flex flex-col items-center">
              {/* QR Container */}
              <div className="relative w-full aspect-square max-w-[300px] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800 shadow-inner">
                <div id="qr-reader-container" className="w-full h-full" />

                {/* Scanning Target Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-teal-500/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                    <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-teal-400 rounded-tl" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-teal-400 rounded-tr" />
                    <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-teal-400 rounded-bl" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-teal-400 rounded-br" />
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-pulse" />
                  </div>
                </div>

                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                    <RefreshCw className="w-8 h-8 animate-spin text-teal-400 mb-2" />
                    <p className="text-xs font-medium">Tekshirilmoqda...</p>
                  </div>
                )}
              </div>

              {/* Camera Error Alert */}
              {cameraError && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{cameraError}</p>
                </div>
              )}

              {/* Quick Controls */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Kamerani almashtirish
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  {showManualInput ? 'Kamerani ko\'rsatish' : 'Kodni qo\'lda kiritish'}
                </button>
              </div>

              {/* Manual QR Code Input (for testing / fallback) */}
              {showManualInput && (
                <form onSubmit={handleManualSubmit} className="mt-4 w-full">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    QR kod ma'lumotini qo'lda kiritish / nusxalash:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder='Masalan: MEDISCAN_CLINIC_...'
                      className="flex-1 px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={isProcessing || !manualCode.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50"
                    >
                      Yuborish
                    </button>
                  </div>
                </form>
              )}

              {/* Instructions */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 w-full text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Eslatma:</span> Birinchi skan qilishda <strong>Ishga kirish</strong>, ikkinchi skan qilishda <strong>Ishdan chiqish</strong> qayd etiladi.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
