import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { AttendanceRecord, AttendanceResult, UserProfile } from '../types';
import { logActivity } from './activityService';

export function getTodayDateString(timezone: string = 'Asia/Tashkent'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()); // Returns YYYY-MM-DD
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export function formatTimeUz(isoString?: string): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '--:--';
  }
}

export function formatDateUz(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateString;
  }
}

/**
 * Robust Attendance QR Scan Processor
 * Supports:
 * 1. Action: 1-Kirish (CHECK_IN) and 2-Chiqish (CHECK_OUT)
 * 2. Formats: JSON payload or raw string tokens
 * 3. Roles: Employees (production) + Developer & Clinic Admin (for testing and verification)
 */
export async function processAttendanceScan(
  user: UserProfile,
  scannedCode: string
): Promise<AttendanceResult> {
  if (!user) {
    return {
      success: false,
      type: 'CHECK_IN',
      message: 'Foydalanuvchi ma\'lumotlari topilmadi.',
    };
  }

  if (user.status !== 'active') {
    return {
      success: false,
      type: 'CHECK_IN',
      message: 'Sizning hisobingiz nofaol holatda. Administratorga murojaat qiling.',
    };
  }

  const rawCode = scannedCode.trim();
  let parsedClinicId: string | null = null;
  let parsedAction: 'CHECK_IN' | 'CHECK_OUT' | 'AUTO' = 'AUTO';

  // 1. Try JSON parsing
  try {
    if (rawCode.startsWith('{') && rawCode.endsWith('}')) {
      const json = JSON.parse(rawCode);
      if (json.clinicId) parsedClinicId = json.clinicId;
      if (json.action === 'CHECK_IN' || json.action === 'CHECK_OUT' || json.action === 'AUTO') {
        parsedAction = json.action;
      }
    }
  } catch {
    // raw string
  }

  // 2. Parse plain text string if not JSON
  if (!parsedClinicId) {
    if (rawCode.includes('CHECK_IN') || rawCode.includes('KIRISH') || rawCode.startsWith('1-')) {
      parsedAction = 'CHECK_IN';
    } else if (rawCode.includes('CHECK_OUT') || rawCode.includes('CHIQISH') || rawCode.startsWith('2-')) {
      parsedAction = 'CHECK_OUT';
    }

    const clinicMatch = rawCode.match(/clinic_[a-zA-Z0-9_-]+/);
    if (clinicMatch) {
      parsedClinicId = clinicMatch[0];
    }
  }

  // Determine target clinic
  const targetClinicId = user.clinicId || parsedClinicId;

  if (!targetClinicId) {
    return {
      success: false,
      type: parsedAction === 'CHECK_OUT' ? 'CHECK_OUT' : 'CHECK_IN',
      message: 'Klinika aniqlanmadi. Iltimos, haqiqiy klinika QR kodini skanerlang.',
    };
  }

  // If user is employee and belongs to clinic A, block scanning clinic B
  if (user.role === 'employee' && user.clinicId && parsedClinicId && parsedClinicId !== user.clinicId) {
    return {
      success: false,
      type: parsedAction === 'CHECK_OUT' ? 'CHECK_OUT' : 'CHECK_IN',
      message: 'Ushbu QR kod siz biriktirilgan klinikaga tegishli emas.',
    };
  }

  // Atomic transaction
  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Verify Clinic
      const clinicRef = doc(db, 'clinics', targetClinicId);
      const clinicSnap = await transaction.get(clinicRef);

      if (!clinicSnap.exists()) {
        throw new Error('Klinika topilmadi yoki o\'chirilgan.');
      }

      const clinicData = clinicSnap.data();
      if (clinicData.status !== 'active') {
        throw new Error(`"${clinicData.name}" klinikasi hozirda faol emas.`);
      }

      // 2. Check today's attendance record
      const today = getTodayDateString(clinicData.timezone || 'Asia/Tashkent');
      const attendanceDocId = `${today}_${user.id}`;
      const attendanceRef = doc(db, 'attendance', attendanceDocId);
      const attendanceSnap = await transaction.get(attendanceRef);

      const nowISO = new Date().toISOString();
      const nowFormattedTime = formatTimeUz(nowISO);

      // Determine operation
      if (parsedAction === 'CHECK_IN') {
        if (attendanceSnap.exists()) {
          const existing = attendanceSnap.data() as AttendanceRecord;
          if (existing.checkOut) {
            throw new Error(`Siz bugungi ish smenasini allaqachon yakunlagansiz (Chiqish vaqti: ${formatTimeUz(existing.checkOut)}).`);
          } else {
            throw new Error(`Siz bugun soat ${formatTimeUz(existing.checkIn)} da allaqachon ishga kirgansiz! Hozir smenadasiz. Ish kuni tugagach 2-Chiqish QR kodini skanerlang.`);
          }
        }

        // Perform CHECK-IN
        const currentHour = new Date().getHours();
        const currentMinute = new Date().getMinutes();
        const isLate = currentHour > 9 || (currentHour === 9 && currentMinute > 15);

        const newRecord: AttendanceRecord = {
          id: attendanceDocId,
          userId: user.id,
          employeeName: user.fullName,
          employeeId: user.employeeId || (user.role === 'developer' ? 'DEV-01' : 'ADM-01'),
          department: user.department || (user.role === 'developer' ? 'Dasturchi' : 'Boshqaruv'),
          clinicId: targetClinicId,
          date: today,
          checkIn: nowISO,
          status: isLate ? 'late' : 'present',
          createdAt: nowISO,
        };

        transaction.set(attendanceRef, {
          ...newRecord,
          serverCheckIn: serverTimestamp(),
        });

        return {
          type: 'CHECK_IN' as const,
          message: `1-Kirish davomati muvaffaqiyatli qayd etildi! Ish vaqti: ${nowFormattedTime}. Xush kelibsiz!`,
          record: newRecord,
        };
      } else if (parsedAction === 'CHECK_OUT') {
        if (!attendanceSnap.exists()) {
          throw new Error('Siz hali bugun ishga kirmagansiz! Avval "1-Kirish davomat" QR kodini skanerlang.');
        }

        const existing = attendanceSnap.data() as AttendanceRecord;
        if (existing.checkOut) {
          throw new Error(`Bugungi ish smenasi allaqachon yakunlangan (Chiqish soat ${formatTimeUz(existing.checkOut)} da qayd etilgan).`);
        }

        // Perform CHECK-OUT
        const checkInTime = new Date(existing.checkIn).getTime();
        const checkOutTime = new Date(nowISO).getTime();
        const diffMinutes = Math.round((checkOutTime - checkInTime) / 60000);
        const totalMinutes = Math.max(1, diffMinutes);
        const hoursWorked = (totalMinutes / 60).toFixed(1);

        transaction.update(attendanceRef, {
          checkOut: nowISO,
          serverCheckOut: serverTimestamp(),
          totalMinutes,
          status: 'completed',
          updatedAt: nowISO,
        });

        const updatedRecord: AttendanceRecord = {
          ...existing,
          checkOut: nowISO,
          totalMinutes,
          status: 'completed',
        };

        return {
          type: 'CHECK_OUT' as const,
          message: `2-Chiqish davomati muvaffaqiyatli qayd etildi! Ish smenasi yakunlandi (Chiqish: ${nowFormattedTime}). Jami ishlangan: ${hoursWorked} soat (${totalMinutes} daqiqa).`,
          record: updatedRecord,
        };
      } else {
        // AUTO Mode: First scan = Check-in, Second scan = Check-out
        if (!attendanceSnap.exists()) {
          // Check-in
          const currentHour = new Date().getHours();
          const currentMinute = new Date().getMinutes();
          const isLate = currentHour > 9 || (currentHour === 9 && currentMinute > 15);

          const newRecord: AttendanceRecord = {
            id: attendanceDocId,
            userId: user.id,
            employeeName: user.fullName,
            employeeId: user.employeeId || 'EMP',
            department: user.department || 'Umumiy',
            clinicId: targetClinicId,
            date: today,
            checkIn: nowISO,
            status: isLate ? 'late' : 'present',
            createdAt: nowISO,
          };

          transaction.set(attendanceRef, {
            ...newRecord,
            serverCheckIn: serverTimestamp(),
          });

          return {
            type: 'CHECK_IN' as const,
            message: `Ishga kirish muvaffaqiyatli qayd etildi! (Kirish: ${nowFormattedTime})`,
            record: newRecord,
          };
        } else {
          const existing = attendanceSnap.data() as AttendanceRecord;
          if (existing.checkOut) {
            throw new Error(`Bugungi ish smenasi allaqachon yakunlangan (Chiqish: ${formatTimeUz(existing.checkOut)}).`);
          }

          // Check-out
          const checkInTime = new Date(existing.checkIn).getTime();
          const checkOutTime = new Date(nowISO).getTime();
          const diffMinutes = Math.round((checkOutTime - checkInTime) / 60000);
          const totalMinutes = Math.max(1, diffMinutes);
          const hoursWorked = (totalMinutes / 60).toFixed(1);

          transaction.update(attendanceRef, {
            checkOut: nowISO,
            serverCheckOut: serverTimestamp(),
            totalMinutes,
            status: 'completed',
            updatedAt: nowISO,
          });

          const updatedRecord: AttendanceRecord = {
            ...existing,
            checkOut: nowISO,
            totalMinutes,
            status: 'completed',
          };

          return {
            type: 'CHECK_OUT' as const,
            message: `Ishdan chiqish muvaffaqiyatli qayd etildi! Jami ishlangan: ${hoursWorked} soat.`,
            record: updatedRecord,
          };
        }
      }
    });

    // Log Activity asynchronously
    await logActivity(
      user.id,
      user.fullName,
      user.role,
      result.type === 'CHECK_IN' ? 'ISHGA_KIRISH' : 'ISHDAN_CHIQISH',
      `${user.fullName} ${result.type === 'CHECK_IN' ? 'ishga kirdi (1-Kirish QR)' : 'ishdan chiqdi (2-Chiqish QR)'}`,
      targetClinicId
    );

    return {
      success: true,
      type: result.type,
      message: result.message,
      record: result.record,
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Davomatni qayd etishda xatolik yuz berdi.';
    return {
      success: false,
      type: parsedAction === 'CHECK_OUT' ? 'CHECK_OUT' : 'CHECK_IN',
      message: errorMsg,
    };
  }
}

export async function getTodayAttendanceForUser(userId: string): Promise<AttendanceRecord | null> {
  const today = getTodayDateString();
  const docId = `${today}_${userId}`;
  const path = `attendance/${docId}`;
  try {
    const docSnap = await getDoc(doc(db, 'attendance', docId));
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id } as AttendanceRecord;
    }

    // Fallback query
    const q = query(
      collection(db, 'attendance'),
      where('userId', '==', userId),
      where('date', '==', today)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as AttendanceRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function getUserAttendanceHistory(userId: string): Promise<AttendanceRecord[]> {
  const path = 'attendance';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as AttendanceRecord));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export async function getClinicAttendance(clinicId: string, targetDate?: string): Promise<AttendanceRecord[]> {
  const path = 'attendance';
  try {
    let q;
    if (targetDate) {
      q = query(
        collection(db, path),
        where('clinicId', '==', clinicId),
        where('date', '==', targetDate)
      );
    } else {
      q = query(
        collection(db, path),
        where('clinicId', '==', clinicId),
        orderBy('date', 'desc')
      );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as AttendanceRecord));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

export interface ClinicAttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  currentlyWorking: number;
  lateArrivals: number;
  completedShifts: number;
}

export async function getClinicStats(clinicId: string): Promise<ClinicAttendanceStats> {
  const today = getTodayDateString();

  try {
    // 1. Fetch total employees
    const employeesQuery = query(
      collection(db, 'users'),
      where('clinicId', '==', clinicId),
      where('role', '==', 'employee'),
      where('status', '==', 'active')
    );
    const empSnap = await getDocs(employeesQuery);
    const totalEmployees = empSnap.size;

    // 2. Fetch today's attendance
    const attQuery = query(
      collection(db, 'attendance'),
      where('clinicId', '==', clinicId),
      where('date', '==', today)
    );
    const attSnap = await getDocs(attQuery);
    const todayRecords = attSnap.docs.map((d) => d.data() as AttendanceRecord);

    const presentToday = todayRecords.length;
    const absentToday = Math.max(0, totalEmployees - presentToday);
    const currentlyWorking = todayRecords.filter((r) => !r.checkOut).length;
    const completedShifts = todayRecords.filter((r) => !!r.checkOut).length;
    const lateArrivals = todayRecords.filter((r) => r.status === 'late').length;

    return {
      totalEmployees,
      presentToday,
      absentToday,
      currentlyWorking,
      lateArrivals,
      completedShifts,
    };
  } catch (err) {
    return {
      totalEmployees: 0,
      presentToday: 0,
      absentToday: 0,
      currentlyWorking: 0,
      lateArrivals: 0,
      completedShifts: 0,
    };
  }
}

export function exportAttendanceToCsv(records: AttendanceRecord[], fileName: string) {
  const headers = [
    'Sana',
    'Xodim F.I.Sh',
    'Xodim ID',
    'Bo\'lim',
    'Kelish vaqti (1-Kirish)',
    'Ketish vaqti (2-Chiqish)',
    'Jami daqiqalar',
    'Ish soati',
    'Holati',
  ];

  const statusLabels: Record<string, string> = {
    present: 'O\'z vaqtida',
    late: 'Kechikkan',
    completed: 'Tugallangan',
  };

  const rows = records.map((r) => [
    r.date,
    `"${r.employeeName || ''}"`,
    r.employeeId || '',
    `"${r.department || ''}"`,
    formatTimeUz(r.checkIn),
    formatTimeUz(r.checkOut),
    r.totalMinutes ?? 0,
    r.totalMinutes ? (r.totalMinutes / 60).toFixed(1) + ' soat' : 'Hali ishda',
    statusLabels[r.status] || r.status,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
