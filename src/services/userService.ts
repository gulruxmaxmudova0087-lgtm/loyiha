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
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import firebaseConfig from '../../firebase-applet-config.json';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { UserProfile, UserRole, AccountStatus } from '../types';
import { logActivity } from './activityService';
import { normalizeAuthPassword } from '../context/AuthContext';

// Initialize a secondary Firebase Auth instance so creating new users doesn't log out current admin
function getSecondaryAuth() {
  const appName = 'SecondaryUserCreationApp';
  const existingApp = getApps().find(app => app.name === appName);
  const app = existingApp || initializeApp(firebaseConfig, appName);
  return getAuth(app);
}

export function generateEmployeeId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `EMP-${randomNum}`;
}

export async function createClinicAdmin(
  data: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
    clinicId: string;
    clinicName: string;
  },
  creator: UserProfile
): Promise<UserProfile> {
  const secondaryAuth = getSecondaryAuth();
  const normalizedEmail = data.email.includes('@') ? data.email.trim().toLowerCase() : `${data.username.trim().toLowerCase()}@system.local`;
  
  // 1. Create Firebase Auth user
  let uid = 'admin_' + Math.random().toString(36).substring(2, 12);
  try {
    const securePassword = normalizeAuthPassword(data.password);
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, securePassword);
    uid = userCredential.user.uid;
    await signOut(secondaryAuth);
  } catch (authErr: any) {
    console.warn('Firebase Auth yaratish o\'tkazib yuborildi, Firestore profilingiz yaratiladi:', authErr?.message);
  }

  const now = new Date().toISOString();
  const newAdmin: UserProfile = {
    id: uid,
    fullName: data.fullName.trim(),
    username: data.username.trim(),
    email: normalizedEmail,
    role: 'clinic_admin',
    clinicId: data.clinicId,
    clinicName: data.clinicName,
    phone: data.phone?.trim() || '',
    position: 'Klinika Administratori',
    status: 'active',
    mustChangePassword: true,
    createdAt: now,
  };

  try {
    await setDoc(doc(db, 'users', uid), newAdmin);

    // Also update clinic doc with assigned admin
    await updateDoc(doc(db, 'clinics', data.clinicId), {
      adminId: uid,
      adminName: newAdmin.fullName,
      updatedAt: now,
    });

    await logActivity(
      creator.id,
      creator.fullName,
      creator.role,
      'ADMIN_YARATILDI',
      `"${newAdmin.fullName}" (${newAdmin.username}) "${data.clinicName}" klinikasiga administrator etib tayinlandi`,
      data.clinicId
    );

    return newAdmin;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}

export async function createEmployee(
  data: {
    firstName: string;
    lastName: string;
    username: string;
    email?: string;
    password: string;
    phone?: string;
    position: string;
    department: string;
    schedule: string;
    startDate?: string;
    photoURL?: string;
    clinicId: string;
    clinicName: string;
  },
  creator: UserProfile
): Promise<UserProfile> {
  const secondaryAuth = getSecondaryAuth();
  const normalizedUsername = data.username.trim().toLowerCase();
  const normalizedEmail = data.email && data.email.includes('@')
    ? data.email.trim().toLowerCase()
    : `${normalizedUsername}@system.local`;

  // 1. Create Firebase Auth account
  let uid = 'emp_' + Math.random().toString(36).substring(2, 12);
  try {
    const securePassword = normalizeAuthPassword(data.password);
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, securePassword);
    uid = userCredential.user.uid;
    await signOut(secondaryAuth);
  } catch (authErr: any) {
    console.warn('Firebase Auth yaratish o\'tkazib yuborildi, Firestore profilingiz yaratiladi:', authErr?.message);
  }

  const now = new Date().toISOString();
  const employeeId = generateEmployeeId();
  const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;

  const newEmployee: UserProfile = {
    id: uid,
    fullName,
    username: normalizedUsername,
    email: normalizedEmail,
    role: 'employee',
    clinicId: data.clinicId,
    clinicName: data.clinicName,
    phone: data.phone?.trim() || '',
    position: data.position.trim(),
    department: data.department.trim(),
    schedule: data.schedule.trim() || '08:30 - 17:30',
    startDate: data.startDate || now.split('T')[0],
    photoURL: data.photoURL || '',
    employeeId,
    status: 'active',
    mustChangePassword: true,
    createdAt: now,
  };

  try {
    await setDoc(doc(db, 'users', uid), newEmployee);

    await logActivity(
      creator.id,
      creator.fullName,
      creator.role,
      'XODIM_QO_SHILDI',
      `Yangi xodim qo'shildi: "${fullName}" (${employeeId}, ${newEmployee.position})`,
      data.clinicId
    );

    return newEmployee;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}

export async function toggleUserStatus(
  userId: string,
  currentStatus: AccountStatus,
  actor: UserProfile,
  clinicId?: string
): Promise<AccountStatus> {
  const newStatus: AccountStatus = currentStatus === 'active' ? 'inactive' : 'active';
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    await logActivity(
      actor.id,
      actor.fullName,
      actor.role,
      newStatus === 'active' ? 'FOYDALANUVCHI_FAOLLASHTIRILDI' : 'FOYDALANUVCHI_NOFAOL_QILINDI',
      `Foydalanuvchi holati "${newStatus === 'active' ? 'Faol' : 'Nofaol'}" ga o'zgartirildi`,
      clinicId
    );

    return newStatus;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>,
  actor: UserProfile
): Promise<void> {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    await logActivity(
      actor.id,
      actor.fullName,
      actor.role,
      'PROFIL_YANGILANDI',
      `Foydalanuvchi ma'lumotlari yangilandi: ${updates.fullName || userId}`,
      updates.clinicId
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function getEmployeesByClinic(clinicId: string): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const q = query(
      collection(db, path),
      where('clinicId', '==', clinicId),
      where('role', '==', 'employee')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as UserProfile));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getAdmins(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const q = query(
      collection(db, path),
      where('role', '==', 'clinic_admin')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as UserProfile));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as UserProfile));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
