export type UserRole = 'developer' | 'clinic_admin' | 'employee';
export type AccountStatus = 'active' | 'inactive';
export type AttendanceStatus = 'present' | 'late' | 'completed';

export interface Clinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  status: AccountStatus;
  timezone: string;
  attendanceQrId: string;
  adminId?: string;
  adminName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string; // Auth UID
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  clinicId?: string;
  clinicName?: string;
  position?: string;
  department?: string;
  phone?: string;
  photoURL?: string;
  employeeId?: string; // e.g. EMP-1042
  schedule?: string; // e.g. 08:30 - 17:30
  startDate?: string;
  status: AccountStatus;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string; // YYYY-MM-DD_userId
  userId: string;
  employeeName: string;
  employeeId?: string;
  department?: string;
  clinicId: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // ISO string
  checkOut?: string; // ISO string
  totalMinutes?: number;
  status: AttendanceStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceQrCode {
  id: string;
  clinicId: string;
  code: string;
  status: 'active' | 'revoked';
  createdAt: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  details: string;
  clinicId?: string;
  timestamp: string;
}

export interface AttendancePayload {
  qrCode: string;
  userId: string;
  timestamp?: string;
}

export interface AttendanceResult {
  success: boolean;
  type: 'CHECK_IN' | 'CHECK_OUT';
  message: string;
  record?: AttendanceRecord;
}
