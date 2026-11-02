# Mediscan Security Specification & ABAC Rules

## 1. Data Invariants
1. **Clinic Isolation Invariant**: A clinic administrator or employee can only read/write data associated with their own `clinicId`.
2. **Developer Master Role**: Users with role `developer` have full administrative privileges to manage clinics, clinic administrators, and system settings.
3. **Role Elevation Protection**: Non-developer users can NEVER alter their own `role`, `clinicId`, or assign elevated permissions.
4. **Attendance Non-Repudiation**: Employees can only create or update attendance records for themselves (`userId == request.auth.uid`), matching their active `clinicId`.
5. **Terminal State & Timestamp Integrity**: Attendance `createdAt` and check-in/out timestamps cannot be back-dated or forged.
6. **Shared QR Non-Tamper**: Attendance QR records are created only by authorized developers or clinic admins for their respective clinics and cannot be arbitrarily rewritten by regular employees.

## 2. The "Dirty Dozen" Threat Payloads
1. **Payload 1 (Self-Role Elevation)**: An employee submits `{ "role": "developer" }` to `/users/{userId}` to gain superadmin access. *Blocked.*
2. **Payload 2 (Cross-Tenant Clinic Read/Write)**: A clinic admin of Clinic A attempts to read or modify Clinic B's records or employees. *Blocked.*
3. **Payload 3 (Orphaned Attendance Write)**: An employee writes an attendance record pointing to a non-existent clinic ID or another employee's user ID. *Blocked.*
4. **Payload 4 (Ghost Field Injection)**: A malicious user injects an unexpected system field `{ "bypass_check": true }` into an attendance session. *Blocked.*
5. **Payload 5 (Back-Dated Check-In)**: An employee sets `checkIn` to 5 hours in the past using client-manipulated time. *Blocked.*
6. **Payload 6 (Shadow QR Generation)**: An unauthenticated or unauthorized user writes to `/attendanceQrCodes/fake-qr` to spoof clinic location. *Blocked.*
7. **Payload 7 (Denial-of-Wallet Payload)**: Attacker attempts to store a 5MB payload in user `fullName` or `details`. *Blocked by size checks.*
8. **Payload 8 (Terminal State Tampering)**: An employee attempts to overwrite an already completed attendance session from yesterday. *Blocked.*
9. **Payload 9 (Unauthenticated Blanket Query)**: An anonymous caller attempts `list /attendance` without filtering by user ID or clinic. *Blocked.*
10. **Payload 10 (Deactivated User Impersonation)**: A user marked with `status: "inactive"` attempts to scan QR and log attendance. *Blocked.*
11. **Payload 11 (ID Poisoning Path Injection)**: Attacker calls document write with path `/clinics/../../admin` or non-alphanumeric IDs. *Blocked.*
12. **Payload 12 (Direct Password Modification in Firestore)**: Any attempt to store or read a plaintext password inside Firestore user documents. *Blocked.*
