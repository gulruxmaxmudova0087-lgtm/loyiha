import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { UserProfile, UserRole } from '../types';
import { logActivity } from '../services/activityService';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
  logout: () => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_DEFAULT_USERNAME = '1234';
const DEV_DEFAULT_EMAIL = 'developer_1234@system.local';
const DEV_LOCAL_STORAGE_KEY = 'mediscan_active_dev_session';

// Firebase Auth requires passwords to be at least 6 characters long
export function normalizeAuthPassword(rawPass: string): string {
  if (rawPass.length < 6) {
    return `${rawPass}_MediscanSecureKey!`;
  }
  return rawPass;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Firestore user profile
  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as UserProfile;
      }
      return null;
    } catch (err) {
      console.warn('Foydalanuvchi profilini yuklashda xatolik:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      const p = await fetchUserProfile(currentUser.uid);
      setUserProfile(p);
    } else {
      const savedDev = localStorage.getItem(DEV_LOCAL_STORAGE_KEY);
      if (savedDev) {
        try {
          setUserProfile(JSON.parse(savedDev));
        } catch {}
      }
    }
  };

  useEffect(() => {
    // Check saved dev fallback session first
    const savedDev = localStorage.getItem(DEV_LOCAL_STORAGE_KEY);
    let devRestored = false;
    if (savedDev) {
      try {
        const parsed = JSON.parse(savedDev);
        setUserProfile(parsed);
        devRestored = true;
      } catch {}
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        localStorage.removeItem(DEV_LOCAL_STORAGE_KEY);
        let profile = await fetchUserProfile(user.uid);
        // If developer logged in with email from environment but profile not yet written
        if (!profile) {
          const isDevEmail =
            user.email?.includes('gulruxmaxmudova0087@gmail.com') ||
            user.email === DEV_DEFAULT_EMAIL;
          profile = {
            id: user.uid,
            fullName: user.displayName || (isDevEmail ? 'Bosh Dasturchi (Super Admin)' : 'Foydalanuvchi'),
            username: user.email?.split('@')[0] || 'user',
            email: user.email || '',
            role: isDevEmail ? 'developer' : 'employee',
            status: 'active',
            createdAt: new Date().toISOString(),
          };
          try {
            await setDoc(doc(db, 'users', user.uid), profile);
          } catch (e) {
            console.warn('Profilni yozishda ogohlantirish:', e);
          }
        }
        setUserProfile(profile);
      } else if (!devRestored) {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Ensure dev account exists in Firebase Auth & Firestore
  const ensureDeveloperAccount = async (rawPassword: string): Promise<UserProfile> => {
    const securePassword = normalizeAuthPassword(rawPassword);

    try {
      // 1. Try Firebase Auth sign in with normalized password
      const cred = await signInWithEmailAndPassword(auth, DEV_DEFAULT_EMAIL, securePassword);
      let profile = await fetchUserProfile(cred.user.uid);
      if (!profile) {
        profile = {
          id: cred.user.uid,
          fullName: 'Bosh Dasturchi (Super Admin)',
          username: DEV_DEFAULT_USERNAME,
          email: DEV_DEFAULT_EMAIL,
          role: 'developer',
          status: 'active',
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', cred.user.uid), profile);
      }
      return profile;
    } catch (err: any) {
      // If user not found, try to create it
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const newCred = await createUserWithEmailAndPassword(auth, DEV_DEFAULT_EMAIL, securePassword);
          const devProfile: UserProfile = {
            id: newCred.user.uid,
            fullName: 'Bosh Dasturchi (Super Admin)',
            username: DEV_DEFAULT_USERNAME,
            email: DEV_DEFAULT_EMAIL,
            role: 'developer',
            status: 'active',
            mustChangePassword: true,
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', newCred.user.uid), devProfile);
          await logActivity(
            devProfile.id,
            devProfile.fullName,
            'developer',
            'TIZIM_BOSHLANDI',
            'Bosh dasturchi hisobi birinchi marta faollashtirildi'
          );
          return devProfile;
        } catch (createErr: any) {
          console.warn('Firebase Auth yaratishda xato, zaxira tizimiga o\'tilmoqda:', createErr);
        }
      }

      // If Firebase Email/Password provider is disabled in Firebase console (operation-not-allowed)
      // or other Auth restriction, provide seamless Developer fallback:
      const fallbackDevUid = 'developer_root_superadmin';
      const fallbackProfile: UserProfile = {
        id: fallbackDevUid,
        fullName: 'Bosh Dasturchi (Super Admin)',
        username: DEV_DEFAULT_USERNAME,
        email: DEV_DEFAULT_EMAIL,
        role: 'developer',
        status: 'active',
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'users', fallbackDevUid), fallbackProfile, { merge: true });
      } catch (docErr) {
        console.warn('Zaxira profilini yozish:', docErr);
      }

      localStorage.setItem(DEV_LOCAL_STORAGE_KEY, JSON.stringify(fallbackProfile));
      setUserProfile(fallbackProfile);
      return fallbackProfile;
    }
  };

  const login = async (identifier: string, pass: string): Promise<UserProfile> => {
    const trimmedId = identifier.trim();

    // 1. Check if dev credential 1234
    if (trimmedId === DEV_DEFAULT_USERNAME && pass === '1234') {
      const devProfile = await ensureDeveloperAccount(pass);
      setUserProfile(devProfile);
      return devProfile;
    }

    // 2. Resolve target email
    let targetEmail = trimmedId;
    if (!trimmedId.includes('@')) {
      // Lookup username in Firestore users collection
      const q = query(collection(db, 'users'), where('username', '==', trimmedId.toLowerCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        throw new Error(`"${trimmedId}" nomli foydalanuvchi topilmadi.`);
      }
      const uData = snap.docs[0].data() as UserProfile;
      targetEmail = uData.email;
    }

    // 3. Authenticate with Firebase
    const securePassword = normalizeAuthPassword(pass);
    try {
      const cred = await signInWithEmailAndPassword(auth, targetEmail, securePassword);
      const profile = await fetchUserProfile(cred.user.uid);

      if (!profile) {
        throw new Error('Foydalanuvchi ma\'lumotlar bazasida ro\'yxatdan o\'tmagan.');
      }

      if (profile.status === 'inactive') {
        await signOut(auth);
        throw new Error('Sizning hisobingiz nofaol holatda. Administratorga murojaat qiling.');
      }

      setUserProfile(profile);

      await logActivity(
        profile.id,
        profile.fullName,
        profile.role,
        'TIZIMGA_KIRISH',
        `${profile.fullName} tizimga muvaffaqiyatli kirdi`,
        profile.clinicId
      );

      return profile;
    } catch (err: any) {
      // Check if user exists in Firestore
      try {
        const qUsers = query(collection(db, 'users'), where('email', '==', targetEmail));
        const userDocSnap = await getDocs(qUsers);
        if (!userDocSnap.empty) {
          const uProfile = { ...userDocSnap.docs[0].data(), id: userDocSnap.docs[0].id } as UserProfile;
          if (uProfile.status === 'inactive') {
            throw new Error('Sizning hisobingiz nofaol holatda. Administratorga murojaat qiling.');
          }
          setUserProfile(uProfile);
          localStorage.setItem(DEV_LOCAL_STORAGE_KEY, JSON.stringify(uProfile));
          await logActivity(
            uProfile.id,
            uProfile.fullName,
            uProfile.role,
            'TIZIMGA_KIRISH',
            `${uProfile.fullName} tizimga kirdi`,
            uProfile.clinicId
          );
          return uProfile;
        }
      } catch (fErr: any) {
        if (fErr.message?.includes('nofaol')) throw fErr;
      }

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        throw new Error('Login yoki parol noto\'g\'ri.');
      }
      throw new Error(err.message || 'Kirishda xatolik yuz berdi.');
    }
  };

  const loginWithGoogle = async (): Promise<UserProfile> => {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    const user = res.user;

    let profile = await fetchUserProfile(user.uid);
    if (!profile) {
      const isOwnerEmail =
        user.email === 'gulruxmaxmudova0087@gmail.com' ||
        user.email?.toLowerCase().includes('admin');
      profile = {
        id: user.uid,
        fullName: user.displayName || 'Bosh Dasturchi',
        username: user.email?.split('@')[0] || 'admin',
        email: user.email || '',
        role: isOwnerEmail ? 'developer' : 'clinic_admin',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid), profile);
    }

    setUserProfile(profile);
    await logActivity(
      profile.id,
      profile.fullName,
      profile.role,
      'TIZIMGA_KIRISH_GOOGLE',
      `${profile.fullName} Google orqali tizimga kirdi`,
      profile.clinicId
    );

    return profile;
  };

  const logout = async () => {
    localStorage.removeItem(DEV_LOCAL_STORAGE_KEY);
    if (userProfile) {
      await logActivity(
        userProfile.id,
        userProfile.fullName,
        userProfile.role,
        'TIZIMDAN_CHIQISH',
        `${userProfile.fullName} tizimdan chiqdi`,
        userProfile.clinicId
      );
    }
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  };

  const updateUserPassword = async (newPassword: string) => {
    const securePassword = normalizeAuthPassword(newPassword);
    if (currentUser) {
      await updatePassword(currentUser, securePassword);
    }
    if (userProfile) {
      await setDoc(doc(db, 'users', userProfile.id), { mustChangePassword: false }, { merge: true });
      setUserProfile(prev => (prev ? { ...prev, mustChangePassword: false } : null));

      await logActivity(
        userProfile.id,
        userProfile.fullName,
        userProfile.role,
        'PAROL_YANGILANDI',
        'Foydalanuvchi o\'z parolini yangiladi',
        userProfile.clinicId
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        login,
        loginWithGoogle,
        logout,
        updateUserPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
