import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  runTransaction,
  serverTimestamp
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

export async function processAttendanceScan(
  user: UserProfile,
  scannedCode: string
): Promise<AttendanceResult> {
  // 1. Client pre-validations
  if (!user || user.role !== 'employee') {
    return {
      success: false,
      type: 'CHECK_IN',
      message: 'Faqat xodimlar davomatdan o\'tishlari mumkin.',
    };
  }

  if (user.status !== 'active') {
    return {
      success: false,
      type: 'CHECK_IN',
      message: 'Sizning hisobingiz nofaol holatda. Administratorga murojaat qiling.',
    };
  }

  if (!user.clinicId) {
    return {
      success: false,
      type: 'CHECK_IN',
      message: 'Siz hech qanday klinikaga biriktirilmagansiz.',
    };
  }

  // Parse QR content if it is JSON or string
  let parsedClinicId: string | null = null;
  let parsedToken: string = scannedCode.trim();

  try {
    if (scannedCode.startsWith('{') && scannedCode.endsWith('}')) {
      const json = JSON.parse(scannedCode);
      parsedClinicId = json.clinicId;
      parsedToken = json.code || json.qrId || scannedCode;
    }
  } catch {
    // raw string
  }

  // Atomic transaction
  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Fetch employee's clinic
      const clinicRef = doc(db, 'clinics', user.clinicId!);
      const clinicSnap = await transaction.get(clinicRef);

      if (!clinicSnap.exists()) {
        throw new Error('Klinika topilmadi.');
      }

      const clinicData = clinicSnap.data();
      if (clinicData.status !== 'active') {
        throw new Error('Klinika faoliyati vaqtincha to\'xtatilgan.');
      }

      // Check clinic matching
      if (parsedClinicId && parsedClinicId !== user.clinicId) {
        throw new Error('Ushbu QR kod sizning klinikangizga tegishli emas.');
      }

      // 2. Fetch active QR record
      const qrRef = doc(db, 'attendanceQrCodes', clinicData.attendanceQrId);
      const qrSnap = await transaction.get(qrRef);

      if (!qrSnap.exists() || qrSnap.data().status !== 'active') {
        throw new Error('Klinika QR kodi nofaol yoki yangilanmagan.');
      }

      const qrData = qrSnap.data();
      // Match verification token
      const expectedToken = qrData.code;
      if (
        parsedToken !== expectedToken &&
        parsedToken !== clinicData.attendanceQrId &&
        !parsedToken.includes(user.clinicId!)
      ) {
        throw new Error('Ushbu QR kod sizning klinikangizga tegishli emas.');
      }

      // 3. Check today's attendance session
      const today = getTodayDateString(clinicData.timezone || 'Asia/Tashkent');
      const attendanceDocId = `${today}_${user.id}`;
      const attendanceRef = doc(db, 'attendance', attendanceDocId);
      const attendanceSnap = await transaction.get(attendanceRef);

      const nowISO = new Date().toISOString();

      if (attendanceSnap.exists()) {
        const currentData = attendanceSnap.data() as AttendanceRecord;

        if (currentData.checkOut) {
          throw new Error('Bugungi davomat allaqachon yakunlangan.');
        }

        // Perform CHECK-OUT
        const checkInTime = new Date(currentData.checkIn).getTime();
        const checkOutTime = new Date(nowISO).getTime();
        const totalMinutes = Math.max(0, Math.round((checkOutTime - checkInTime) / 60000));

        transaction.update(attendanceRef, {
          checkOut: nowISO,
          serverCheckOut: serverTimestamp(),
          totalMinutes,
          status: 'completed',
          updatedAt: nowISO,
        });

        return {
          type: 'CHECK_OUT' as const,
          message: 'Ishdan chiqish muvaffaqiyatli qayd etildi.',
          record: {
            ...currentData,
            checkOut: nowISO,
            totalMinutes,
            status: 'completed' as const,
          },
        };
      } else {
        // Perform CHECK-IN
        // Check if late (e.g. after 09:00)
        const currentHour = new Date().getHours();
        const currentMinute = new Date().getMinutes();
        const isLate = currentHour > 9 || (currentHour === 9 && currentMinute > 15);

        const newRecord: AttendanceRecord = {
          id: attendanceDocId,
          userId: user.id,
          employeeName: user.fullName,
          employeeId: user.employeeId || '',
          department: user.department || '',
          clinicId: user.clinicId!,
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
          message: 'Ishga muvaffaqiyatli kirish qayd etildi.',
          record: newRecord,
        };
      }
    });

    // Log attendance action asynchronously
    await logActivity(
      user.id,
      user.fullName,
      'employee',
      result.type === 'CHECK_IN' ? 'ISHGA_KIRISH' : 'ISHDAN_CHIQISH',
      `${user.fullName} ${result.type === 'CHECK_IN' ? 'ishga kirdi' : 'ishdan chiqdi'}`,
      user.clinicId
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
      type: 'CHECK_IN',
      message: errorMsg,
    };
  }
}

export async function getTodayAttendanceForUser(userId: string): Promise<AttendanceRecord | null> {
  const today = getTodayDateString();
  const docId = `${today}_${userId}`;
  const path = `attendance/${docId}`;
  try {
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
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as AttendanceRecord));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
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
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as AttendanceRecord));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
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
  const todayRecords = attSnap.docs.map(d => d.data() as AttendanceRecord);

  const presentToday = todayRecords.length;
  const absentToday = Math.max(0, totalEmployees - presentToday);
  const currentlyWorking = todayRecords.filter(r => !r.checkOut).length;
  const completedShifts = todayRecords.filter(r => !!r.checkOut).length;
  const lateArrivals = todayRecords.filter(r => r.status === 'late').length;

  return {
    totalEmployees,
    presentToday,
    absentToday,
    currentlyWorking,
    lateArrivals,
    completedShifts,
  };
}

export function exportAttendanceToCsv(records: AttendanceRecord[], fileName: string) {
  const headers = [
    'Sana',
    'Xodim F.I.Sh',
    'Xodim ID',
    'Bo\'lim',
    'Kelish vaqti',
    'Ketish vaqti',
    'Jami daqiqalar',
    'Ish soati',
    'Holati'
  ];

  const statusLabels: Record<string, string> = {
    present: 'O\'z vaqtida',
    late: 'Kechikkan',
    completed: 'Tugallangan',
  };

  const rows = records.map(r => [
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

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
