# Mediscan Cloud Functions & Deployment Guide

## 1. Firebase Cloud Functions Deploy
To deploy the backend attendance verification function to Google Cloud:

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

## 2. Firestore Security Rules Deploy
The security rules in `/firestore.rules` are already deployed and active. To redeploy manually:

```bash
firebase deploy --only firestore:rules
```

## 3. Firestore Indexes Deploy
To deploy composite query indexes:

```bash
firebase deploy --only firestore:indexes
```

## 4. Attendance Cloud Function API
- **Endpoint**: `recordAttendance` (Callable Cloud Function)
- **Region**: `asia-east1`
- **Request Payload**: `{ "qrCode": string }`
- **Authentication**: Firebase Bearer Token (automatic with Firebase SDK)
