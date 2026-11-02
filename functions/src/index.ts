import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

interface AttendanceRequest {
  qrCode: string;
}

/**
 * Cloud Function to verify attendance scan with strict server-side transaction
 */
export const recordAttendance = functions.https.onCall(
  { region: 'asia-east1', cors: true },
  async (request) => {
    // 1. Authenticated session check
    if (!request.auth || !request.auth.uid) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Foydalanuvchi tizimga kirmagan.'
      );
    }

    const uid = request.auth.uid;
    const { qrCode } = request.data as AttendanceRequest;

    if (!qrCode || typeof qrCode !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'QR kod ma\'lumoti kiritilmagan.'
      );
    }

    // Parse QR payload
    let targetClinicId: string | null = null;
    let qrToken = qrCode.trim();
    try {
      if (qrCode.startsWith('{') && qrCode.endsWith('}')) {
        const parsed = JSON.parse(qrCode);
        targetClinicId = parsed.clinicId;
        qrToken = parsed.code || parsed.qrId || qrCode;
      }
    } catch {
      // raw string
    }

    try {
      return await db.runTransaction(async (transaction) => {
        // 2. Fetch Employee Profile
        const userRef = db.collection('users').doc(uid);
        const userSnap = await transaction.get(userRef);

        if (!userSnap.exists) {
          throw new functions.https.HttpsError('not-found', 'Foydalanuvchi profili topilmadi.');
        }

        const userData = userSnap.data()!;
        if (userData.role !== 'employee') {
          throw new functions.https.HttpsError(
            'permission-denied',
            'Faqat xodimlar davomatdan o\'tishi mumkin.'
          );
        }

        if (userData.status !== 'active') {
          throw new functions.https.HttpsError(
            'permission-denied',
            'Sizning hisobingiz nofaol holatda. Administratorga murojaat qiling.'
          );
        }

        const clinicId = userData.clinicId;
        if (!clinicId) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Siz hech qaysi klinikaga biriktirilmagansiz.'
          );
        }

        if (targetClinicId && targetClinicId !== clinicId) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Ushbu QR kod sizning klinikangizga tegishli emas.'
          );
        }

        // 3. Fetch Clinic Profile
        const clinicRef = db.collection('clinics').doc(clinicId);
        const clinicSnap = await transaction.get(clinicRef);

        if (!clinicSnap.exists) {
          throw new functions.https.HttpsError('not-found', 'Klinika topilmadi.');
        }

        const clinicData = clinicSnap.data()!;
        if (clinicData.status !== 'active') {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Klinika faoliyati vaqtincha to\'xtatilgan.'
          );
        }

        // 4. Verify Clinic QR Code
        const qrRef = db.collection('attendanceQrCodes').doc(clinicData.attendanceQrId);
        const qrSnap = await transaction.get(qrRef);

        if (!qrSnap.exists || qrSnap.data()!.status !== 'active') {
          throw new functions.https.HttpsError(
            'failed-precondition',
            'Klinika QR kodi nofaol holatda.'
          );
        }

        const expectedCode = qrSnap.data()!.code;
        if (qrToken !== expectedCode && qrToken !== clinicData.attendanceQrId && !qrToken.includes(clinicId)) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Ushbu QR kod sizning klinikangizga tegishli emas.'
          );
        }

        // 5. Calculate date in clinic timezone
        const timezone = clinicData.timezone || 'Asia/Tashkent';
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        const todayDate = formatter.format(new Date());

        const attendanceId = `${todayDate}_${uid}`;
        const attendanceRef = db.collection('attendance').doc(attendanceId);
        const attendanceSnap = await transaction.get(attendanceRef);

        const now = new Date();
        const nowISO = now.toISOString();

        if (attendanceSnap.exists) {
          const currentAttendance = attendanceSnap.data()!;

          if (currentAttendance.checkOut) {
            throw new functions.https.HttpsError(
              'already-exists',
              'Bugungi davomat allaqachon yakunlangan.'
            );
          }

          // Record CHECK-OUT
          const checkInDate = new Date(currentAttendance.checkIn);
          const totalMinutes = Math.max(0, Math.round((now.getTime() - checkInDate.getTime()) / 60000));

          transaction.update(attendanceRef, {
            checkOut: nowISO,
            serverCheckOut: admin.firestore.FieldValue.serverTimestamp(),
            totalMinutes,
            status: 'completed',
            updatedAt: nowISO,
          });

          return {
            success: true,
            type: 'CHECK_OUT',
            message: 'Ishdan chiqish muvaffaqiyatli qayd etildi.',
            totalMinutes,
          };
        } else {
          // Record CHECK-IN
          const hour = now.getHours();
          const minute = now.getMinutes();
          const isLate = hour > 9 || (hour === 9 && minute > 15);

          const newRecord = {
            id: attendanceId,
            userId: uid,
            employeeName: userData.fullName,
            employeeId: userData.employeeId || '',
            department: userData.department || '',
            clinicId,
            date: todayDate,
            checkIn: nowISO,
            serverCheckIn: admin.firestore.FieldValue.serverTimestamp(),
            status: isLate ? 'late' : 'present',
            createdAt: nowISO,
          };

          transaction.set(attendanceRef, newRecord);

          return {
            success: true,
            type: 'CHECK_IN',
            message: 'Ishga muvaffaqiyatli kirish qayd etildi.',
            status: isLate ? 'late' : 'present',
          };
        }
      });
    } catch (error: any) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError('internal', error.message || 'Davomatda xatolik yuz berdi.');
    }
  }
);
