import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { ActivityLog, UserRole } from '../types';

export async function logActivity(
  actorId: string,
  actorName: string,
  actorRole: UserRole,
  action: string,
  details: string,
  clinicId?: string
): Promise<void> {
  const path = 'activityLogs';
  try {
    await addDoc(collection(db, path), {
      actorId,
      actorName,
      actorRole,
      action,
      details,
      clinicId: clinicId || null,
      timestamp: new Date().toISOString(),
      serverCreated: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Faoliyat jurnalini yozishda xatolik:', error);
    // Don't interrupt main flow for non-critical logging failures
  }
}
