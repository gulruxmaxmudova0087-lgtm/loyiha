import React, { useEffect, useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { testConnection } from './firebase/config';
import { LoginPage } from './pages/auth/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Stethoscope } from 'lucide-react';

// Developer Pages
import { DeveloperDashboard } from './pages/developer/DeveloperDashboard';
import { ClinicsPage } from './pages/developer/ClinicsPage';
import { AdminsPage } from './pages/developer/AdminsPage';
import { UsersPage } from './pages/developer/UsersPage';
import { SystemStatsPage } from './pages/developer/SystemStatsPage';
import { ActivityLogsPage } from './pages/developer/ActivityLogsPage';
import { SettingsPage } from './pages/developer/SettingsPage';

// Clinic Admin Pages
import { ClinicDashboard } from './pages/admin/ClinicDashboard';
import { EmployeesPage } from './pages/admin/EmployeesPage';
import { AddEmployeePage } from './pages/admin/AddEmployeePage';
import { ClinicAttendancePage } from './pages/admin/ClinicAttendancePage';
import { ClinicQrPage } from './pages/admin/ClinicQrPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { ClinicSettingsPage } from './pages/admin/ClinicSettingsPage';

// Employee Pages
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard';
import { EmployeeAttendanceHistory } from './pages/employee/EmployeeAttendanceHistory';
import { EmployeeProfilePage } from './pages/employee/EmployeeProfilePage';
import { QrScannerModal } from './components/qr/QrScannerModal';

// Services
import { getClinics } from './services/clinicService';
import { getAllUsers, getEmployeesByClinic, getAdmins } from './services/userService';
import { getClinicAttendance } from './services/attendanceService';
import { Clinic, UserProfile, AttendanceRecord } from './types';

function MainApp() {
  const { currentUser, userProfile, loading } = useAuth();
  const { info } = useToast();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openCreateClinicImmediately, setOpenCreateClinicImmediately] = useState(false);
  const [showDirectScanner, setShowDirectScanner] = useState(false);

  // Cached data state
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [clinicEmployees, setClinicEmployees] = useState<UserProfile[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Validate Firestore Connection on App Boot
  useEffect(() => {
    testConnection().then((connected) => {
      if (!connected) {
        console.warn('Firebase Firestore ulanishini tekshiring.');
      }
    });
  }, []);

  // Refresh shared datasets
  const refreshData = async () => {
    if (!userProfile) return;
    try {
      if (userProfile.role === 'developer') {
        const [cList, uList, aList] = await Promise.all([
          getClinics(),
          getAllUsers(),
          getAdmins(),
        ]);
        setClinics(cList);
        setAllUsers(uList);
        setAdmins(aList);
      } else if (userProfile.role === 'clinic_admin' && userProfile.clinicId) {
        const [eList, aList] = await Promise.all([
          getEmployeesByClinic(userProfile.clinicId),
          getClinicAttendance(userProfile.clinicId),
        ]);
        setClinicEmployees(eList);
        setAttendanceRecords(aList);
      }
    } catch (err) {
      console.warn('Ma\'lumotlarni yangilashda ogohlantirish:', err);
    }
  };

  useEffect(() => {
    if (userProfile) {
      setCurrentTab('dashboard');
      refreshData();
    }
  }, [userProfile?.id, userProfile?.role]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-xl shadow-teal-500/20 mb-4 animate-pulse">
          <Stethoscope className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 font-bold tracking-tight text-lg">
          MEDISCAN <span className="text-teal-600">PRO</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Tizim yuklanmoqda...</p>
      </div>
    );
  }

  // Not authenticated
  if (!userProfile) {
    return <LoginPage />;
  }

  // Tab selection handler
  const handleSelectTab = (tabId: string) => {
    if (tabId === 'scan_qr') {
      setShowDirectScanner(true);
      return;
    }
    setCurrentTab(tabId);
    setOpenCreateClinicImmediately(false);
  };

  // Get active page title
  const getPageTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'Boshqaruv Paneli',
      clinics: 'Klinikalar',
      admins: 'Administratorlar',
      users: 'Foydalanuvchilar',
      system_stats: 'Tizim Statistikasi',
      activity_logs: 'Faoliyat Tarixi',
      settings: 'Sozlamalar',
      employees: 'Xodimlar',
      add_employee: 'Xodim Qo\'shish',
      attendance: 'Davomat Jurnali',
      qr_code: 'Klinika QR Kodi',
      reports: 'Hisobotlar',
      clinic_settings: 'Klinika Sozlamalari',
      attendance_history: 'Davomat Tarixim',
      profile: 'Shaxsiy Profil',
    };
    return titles[currentTab] || 'Bosh sahifa';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          title={getPageTitle()}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* DEVELOPER VIEWS */}
          {userProfile.role === 'developer' && (
            <>
              {currentTab === 'dashboard' && (
                <DeveloperDashboard
                  onNavigate={handleSelectTab}
                  onOpenCreateClinic={() => {
                    setOpenCreateClinicImmediately(true);
                    setCurrentTab('clinics');
                  }}
                />
              )}
              {currentTab === 'clinics' && (
                <ClinicsPage
                  clinics={clinics}
                  admins={admins}
                  onRefresh={refreshData}
                  openCreateImmediately={openCreateClinicImmediately}
                />
              )}
              {currentTab === 'admins' && (
                <AdminsPage
                  admins={admins}
                  clinics={clinics}
                  onRefresh={refreshData}
                />
              )}
              {currentTab === 'users' && (
                <UsersPage users={allUsers} onRefresh={refreshData} />
              )}
              {currentTab === 'system_stats' && (
                <SystemStatsPage
                  clinics={clinics}
                  users={allUsers}
                  attendanceRecords={attendanceRecords}
                />
              )}
              {currentTab === 'activity_logs' && <ActivityLogsPage />}
              {currentTab === 'settings' && <SettingsPage />}
            </>
          )}

          {/* CLINIC ADMIN VIEWS */}
          {userProfile.role === 'clinic_admin' && (
            <>
              {currentTab === 'dashboard' && (
                <ClinicDashboard onNavigate={handleSelectTab} />
              )}
              {currentTab === 'employees' && (
                <EmployeesPage
                  employees={clinicEmployees}
                  onRefresh={refreshData}
                  onNavigateAdd={() => setCurrentTab('add_employee')}
                />
              )}
              {currentTab === 'add_employee' && (
                <AddEmployeePage
                  onSuccessNavigate={() => {
                    refreshData();
                    setCurrentTab('employees');
                  }}
                />
              )}
              {currentTab === 'attendance' && <ClinicAttendancePage />}
              {currentTab === 'qr_code' && <ClinicQrPage />}
              {currentTab === 'reports' && <ReportsPage />}
              {currentTab === 'clinic_settings' && <ClinicSettingsPage />}
            </>
          )}

          {/* EMPLOYEE VIEWS */}
          {userProfile.role === 'employee' && (
            <>
              {currentTab === 'dashboard' && (
                <EmployeeDashboard onNavigate={handleSelectTab} />
              )}
              {currentTab === 'attendance_history' && <EmployeeAttendanceHistory />}
              {currentTab === 'profile' && <EmployeeProfilePage />}
            </>
          )}
        </main>
      </div>

      {/* Direct QR Scanner Modal */}
      <QrScannerModal
        isOpen={showDirectScanner}
        onClose={() => setShowDirectScanner(false)}
        onSuccess={() => {
          refreshData();
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
