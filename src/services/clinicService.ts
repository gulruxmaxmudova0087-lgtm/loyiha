import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Clinic, AttendanceQrCode, UserProfile } from '../types';
import { logActivity } from './activityService';

export async function createClinic(
  data: {
    name: string;
    address: string;
    phone: string;
    timezone?: string;
  },
  creator: UserProfile
): Promise<Clinic> {
  const clinicId = 'clinic_' + Math.random().toString(36).substring(2, 10);
  const qrId = 'qr_' + Math.random().toString(36).substring(2, 12);
  const now = new Date().toISOString();

  // Shared permanent QR verification token for the clinic
  const qrCodeToken = `MEDISCAN_CLINIC_${clinicId}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const newClinic: Clinic = {
    id: clinicId,
    name: data.name.trim(),
    address: data.address.trim(),
    phone: data.phone.trim(),
    status: 'active',
    timezone: data.timezone || 'Asia/Tashkent',
    attendanceQrId: qrId,
    createdAt: now,
  };

  const qrDoc: AttendanceQrCode = {
    id: qrId,
    clinicId,
    code: qrCodeToken,
    status: 'active',
    createdAt: now,
  };

  try {
    // 1. Create clinic document
    await setDoc(doc(db, 'clinics', clinicId), newClinic);

    // 2. Create attendance QR code registry document
    await setDoc(doc(db, 'attendanceQrCodes', qrId), qrDoc);

    // 3. Log audit action
    await logActivity(
      creator.id,
      creator.fullName,
      creator.role,
      'KLINIKA_YARATILDI',
      `"${newClinic.name}" klinikasi muvaffaqiyatli ro'yxatga olindi`,
      clinicId
    );

    return newClinic;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `clinics/${clinicId}`);
  }
}

export async function updateClinic(
  clinicId: string,
  data: Partial<Clinic>,
  editor: UserProfile
): Promise<void> {
  const path = `clinics/${clinicId}`;
  try {
    const updatePayload = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(doc(db, 'clinics', clinicId), updatePayload);

    await logActivity(
      editor.id,
      editor.fullName,
      editor.role,
      'KLINIKA_TAHRIRLANDI',
      `"${data.name || clinicId}" klinikasi ma'lumotlari yangilandi`,
      clinicId
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleClinicStatus(
  clinicId: string,
  currentStatus: 'active' | 'inactive',
  editor: UserProfile
): Promise<'active' | 'inactive'> {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
  const path = `clinics/${clinicId}`;
  try {
    await updateDoc(doc(db, 'clinics', clinicId), {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    await logActivity(
      editor.id,
      editor.fullName,
      editor.role,
      newStatus === 'active' ? 'KLINIKA_FAOLLASHTIRILDI' : 'KLINIKA_NOFAOL_QILINDI',
      `Klinika holati "${newStatus === 'active' ? 'Faol' : 'Nofaol'}" ga o'zgartirildi`,
      clinicId
    );
    return newStatus;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getClinics(): Promise<Clinic[]> {
  const path = 'clinics';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Clinic));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getClinicById(clinicId: string): Promise<Clinic | null> {
  const path = `clinics/${clinicId}`;
  try {
    const docSnap = await getDoc(doc(db, 'clinics', clinicId));
    if (!docSnap.exists()) return null;
    return { ...docSnap.data(), id: docSnap.id } as Clinic;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getClinicQrCode(clinicId: string): Promise<AttendanceQrCode | null> {
  const path = 'attendanceQrCodes';
  try {
    const q = query(collection(db, path), where('clinicId', '==', clinicId), where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docData = snapshot.docs[0];
    return { ...docData.data(), id: docData.id } as AttendanceQrCode;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}
