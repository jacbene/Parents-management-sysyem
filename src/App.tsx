import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { auth, loginWithGoogle, logout, db, handleFirestoreError, OperationType, loginAnonymously } from './firebase';
import { isDatabaseSeeded, seedUserData } from './seeder';
import { Student, Grade, Attendance, Homework, Appointment, Message, Invoice, ApeeParent, ApeeExpense, ApeeSettings } from './types';

// APEE Utilities and Components
import {
  fetchApeeData,
  saveApeeSettings,
  saveApeeParent,
  deleteApeeParent,
  saveApeeExpense,
  deleteApeeExpense,
  importFullBackup,
  resetApeeData,
  DEFAULT_SETTINGS
} from './utils/apeeDb';

import ApeeDashboard from './components/apee/ApeeDashboard';
import ApeeForm from './components/apee/ApeeForm';
import ApeeSearch from './components/apee/ApeeSearch';
import ApeeReporting from './components/apee/ApeeReporting';
import ApeeFinancial from './components/apee/ApeeFinancial';
import ApeeArchives from './components/apee/ApeeArchives';
import ApeeSettingsComp from './components/apee/ApeeSettingsComp';
import ApeeReminders from './components/apee/ApeeReminders';
import ApeeLegal from './components/ApeeLegal';

// Components
import StudentCard from './components/StudentCard';
import AnnouncementsFeed from './components/AnnouncementsFeed';
import GradesDashboard from './components/GradesDashboard';
import AttendanceTracker from './components/AttendanceTracker';
import HomeworkBoard from './components/HomeworkBoard';
import BillingPortal from './components/BillingPortal';
import AppointmentsScheduler from './components/AppointmentsScheduler';
import MessageInbox from './components/MessageInbox';
import StudentPrintModal from './components/StudentPrintModal';

// Icons
import {
  GraduationCap,
  LogOut,
  Newspaper,
  BookOpen,
  Calendar,
  Award,
  Landmark,
  MessageSquare,
  CalendarCheck2,
  Lock,
  Compass,
  Database,
  UserCheck,
  LayoutDashboard,
  Calculator,
  Search,
  History,
  Coins,
  Settings,
  Plus,
  Bell,
  Shield
} from 'lucide-react';

type TabType = 
  | 'apee_dashboard' 
  | 'apee_recording' 
  | 'apee_search' 
  | 'apee_reporting' 
  | 'apee_finance' 
  | 'apee_archives' 
  | 'apee_settings'
  | 'apee_reminders'
  | 'apee_legal'
  | 'announcements' 
  | 'homework' 
  | 'grades' 
  | 'attendance' 
  | 'billing' 
  | 'appointments' 
  | 'messages';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isIframe, setIsIframe] = useState(false);

  // Nav tab control (Default to APEE Dashboard)
  const [activeTab, setActiveTab] = useState<TabType>('apee_dashboard');
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    const decision = localStorage.getItem('cookie_consent_decision');
    if (!decision) {
      setShowCookieBanner(true);
    }
  }, []);

  // APEE App State
  const [apeeSettings, setApeeSettings] = useState<ApeeSettings>(DEFAULT_SETTINGS);
  const [apeeParents, setApeeParents] = useState<ApeeParent[]>([]);
  const [apeeExpenses, setApeeExpenses] = useState<ApeeExpense[]>([]);
  const [activeParentToEdit, setActiveParentToEdit] = useState<ApeeParent | null>(null);

  // Firestore App State
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [printingStudent, setPrintingStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Selected student entity helper
  const activeStudent = students.find(s => s.id === selectedStudentId) || students[0];

  // 1. Listen for Authentication changes
  useEffect(() => {
    setIsIframe(window.self !== window.top);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch and seed database state based on Authenticated Primitive userId
  const userId = user?.uid;
  useEffect(() => {
    if (!userId) {
      // Clear local states on sign out
      setStudents([]);
      setSelectedStudentId('');
      setGrades([]);
      setAttendanceLogs([]);
      setHomeworks([]);
      setAppointments([]);
      setMessages([]);
      setInvoices([]);
      
      // Clear APEE states
      setApeeSettings(DEFAULT_SETTINGS);
      setApeeParents([]);
      setApeeExpenses([]);
      setActiveParentToEdit(null);
      return;
    }

    const initAndFetchData = async () => {
      setDataLoading(true);
      try {
        // A. Verify if database has seeded profiles for this account
        const seeded = await isDatabaseSeeded(userId);
        if (!seeded) {
          setSeeding(true);
          await seedUserData(userId);
          setSeeding(false);
        }

        // B. Fetch all related collections under parentId
        await fetchAllData(userId);

        // C. Fetch APEE data (sync local cache and Firestore)
        const apeeData = await fetchApeeData(userId);
        if (apeeData.settings) setApeeSettings(apeeData.settings);
        if (apeeData.parents) setApeeParents(apeeData.parents);
        if (apeeData.expenses) setApeeExpenses(apeeData.expenses);
      } catch (err) {
        console.error("Initiation payload failure:", err);
      } finally {
        setDataLoading(false);
      }
    };

    initAndFetchData();
  }, [userId]);

  const fetchAllData = async (uid: string) => {
    try {
      // Create separate safe query references
      const studentQuery = query(collection(db, 'students'), where('parentId', '==', uid));
      const gradeQuery = query(collection(db, 'grades'), where('parentId', '==', uid));
      const attendanceQuery = query(collection(db, 'attendance'), where('parentId', '==', uid));
      const homeworkQuery = query(collection(db, 'homeworks'), where('parentId', '==', uid));
      const appointmentQuery = query(collection(db, 'appointments'), where('parentId', '==', uid));
      const messageQuery = query(collection(db, 'messages'), where('parentId', '==', uid));
      const invoiceQuery = query(collection(db, 'invoices'), where('parentId', '==', uid));

      // Resolve sequentially with custom handles
      const [
        studentSnapshot,
        gradeSnapshot,
        attendanceSnapshot,
        homeworkSnapshot,
        appointmentSnapshot,
        messageSnapshot,
        invoiceSnapshot
      ] = await Promise.all([
        getDocs(studentQuery).catch(err => handleFirestoreError(err, OperationType.LIST, 'students')),
        getDocs(gradeQuery).catch(err => handleFirestoreError(err, OperationType.LIST, 'grades')),
        getDocs(attendanceQuery).catch(err => handleFirestoreError(err, OperationType.LIST, 'attendance')),
        getDocs(homeworkQuery).catch(err => handleFirestoreError(err, OperationType.LIST, 'homeworks')),
        getDocs(appointmentQuery).catch(err => handleFirestoreError(err, OperationType.LIST, 'appointments')),
        getDocs(messageQuery).catch(err => handleFirestoreError(err, OperationType.LIST, 'messages')),
        getDocs(invoiceQuery).catch(err => handleFirestoreError(err, OperationType.LIST, 'invoices'))
      ]);

      // Map back collections safely
      if (studentSnapshot && !studentSnapshot.empty) {
        const studentList = studentSnapshot.docs.map(doc => doc.data() as Student);
        setStudents(studentList);
        // Default to the first student's workspace
        setSelectedStudentId(studentList[0]?.id || '');
      }

      if (gradeSnapshot) {
        setGrades(gradeSnapshot.docs.map(doc => doc.data() as Grade));
      }
      if (attendanceSnapshot) {
        setAttendanceLogs(attendanceSnapshot.docs.map(doc => doc.data() as Attendance));
      }
      if (homeworkSnapshot) {
        setHomeworks(homeworkSnapshot.docs.map(doc => doc.data() as Homework));
      }
      if (appointmentSnapshot) {
        setAppointments(appointmentSnapshot.docs.map(doc => doc.data() as Appointment));
      }
      if (messageSnapshot) {
        setMessages(messageSnapshot.docs.map(doc => doc.data() as Message));
      }
      if (invoiceSnapshot) {
        setInvoices(invoiceSnapshot.docs.map(doc => doc.data() as Invoice));
      }
    } catch (error) {
      console.error("Critical fetching issue occurred:", error);
    }
  };

  // State update actions for instant interactive UI (pushed down to submodules)
  const handleUpdateHomeworkInPlace = (updated: Homework) => {
    setHomeworks(prev => prev.map(hw => hw.id === updated.id ? updated : hw));
  };

  const handleUpdateInvoiceInPlace = (updated: Invoice) => {
    setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
  };

  const handleAddAppointmentInPlace = (newApt: Appointment) => {
    setAppointments(prev => [newApt, ...prev]);
  };

  const handleAddMessageInPlace = (newMsg: Message) => {
    setMessages(prev => [...prev, newMsg]);
  };

  const handleUpdateStudentInPlace = (updated: Student) => {
    setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  // APEE State Action Handlers
  const handleSaveApeeSettings = async (newSettings: ApeeSettings) => {
    setApeeSettings(newSettings);
    if (userId) {
      await saveApeeSettings(userId, newSettings);
    }
  };

  const handleSaveApeeParentInPlace = async (parent: ApeeParent) => {
    setActiveParentToEdit(null);
    setApeeParents(prev => {
      const idx = prev.findIndex(p => p.id === parent.id);
      if (idx !== -1) {
        return prev.map(p => p.id === parent.id ? parent : p);
      }
      return [...prev, parent];
    });
    if (userId) {
      await saveApeeParent(userId, parent);
    }
  };

  const handleDeleteApeeParentInPlace = async (id: string) => {
    if (activeParentToEdit?.id === id) {
      setActiveParentToEdit(null);
    }
    setApeeParents(prev => prev.filter(p => p.id !== id));
    if (userId) {
      await deleteApeeParent(userId, id);
    }
  };

  const handleSaveApeeExpenseInPlace = async (expense: ApeeExpense) => {
    setApeeExpenses(prev => {
      const idx = prev.findIndex(e => e.id === expense.id);
      if (idx !== -1) {
        return prev.map(e => e.id === expense.id ? expense : e);
      }
      return [...prev, expense];
    });
    if (userId) {
      await saveApeeExpense(userId, expense);
    }
  };

  const handleDeleteApeeExpenseInPlace = async (id: string) => {
    setApeeExpenses(prev => prev.filter(e => e.id !== id));
    if (userId) {
      await deleteApeeExpense(userId, id);
    }
  };

  const handleImportApeeBackup = async (data: { parents?: ApeeParent[]; expenses?: ApeeExpense[]; settings?: ApeeSettings }) => {
    if (data.settings) setApeeSettings(data.settings);
    if (data.parents) setApeeParents(data.parents);
    if (data.expenses) setApeeExpenses(data.expenses);
    if (userId) {
      await importFullBackup(userId, data);
    }
  };

  const handleResetApeeDatabase = async () => {
    setApeeSettings(DEFAULT_SETTINGS);
    setApeeParents([]);
    setApeeExpenses([]);
    setActiveParentToEdit(null);
    if (userId) {
      await resetApeeData(userId);
    }
  };

  // Select active filtered child lists
  const currentGrades = grades.filter(g => g.studentId === activeStudent?.id);
  const currentAttendance = attendanceLogs.filter(a => a.studentId === activeStudent?.id);
  const currentHomeworks = homeworks.filter(h => h.studentId === activeStudent?.id);

  // Compute stats counting for unread/active notifications in side drawer
  const pendingHomeworkCount = homeworks.filter(h => h.studentId === activeStudent?.id && h.status === 'Pending').length;
  const unpaidInvoiceCount = invoices.filter(i => i.status !== 'Paid').length;

  // Unauthenticated screen login handlings
  const handleLogin = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (e: any) {
      console.error("Google authentication process rejected:", e);
      let errorMsg = "La connexion a échoué. Les popups ou les cookies tiers peuvent être bloqués.";
      if (e?.code === 'auth/popup-closed-by-user') {
        errorMsg = "La fenêtre d'authentification Google a été fermée avant la fin de la connexion. N'hésitez pas à utiliser le mode Invité (Démo) ci-dessous si vous préférez tester sans compte.";
      } else if (e?.code === 'auth/popup-blocked') {
        errorMsg = "Le popup de connexion Google a été bloqué par votre navigateur. Veuillez autoriser les popups ou ouvrir l'application dans un nouvel onglet.";
      } else if (e?.code === 'auth/network-request-failed') {
        errorMsg = "Erreur réseau. Veuillez vérifier votre connexion internet.";
      } else if (e?.message) {
        errorMsg = e.message;
      }
      setAuthError(errorMsg);
    }
  };

  const handleGuestLogin = async () => {
    setAuthError(null);
    try {
      await loginAnonymously();
    } catch (e: any) {
      console.error("Anonymous authentication process failed:", e);
      setAuthError(
        "Impossible de se connecter en mode démo. Veuillez réessayer ou utiliser le lien externe."
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <span className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-mono">Chargement du portail d'authentification...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <AnimatePresence mode="wait">
        {!user ? (
          /* Landing Screen / Login */
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 flex items-center justify-center p-4 min-h-screen"
          >
            <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-150 shadow-xl overflow-hidden flex flex-col justify-between">
              <div className="p-8 space-y-2 text-center bg-slate-900 text-white">
                <div className="inline-flex p-3 bg-indigo-600 rounded-2xl mb-1 text-2xl font-black">
                  🏫
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight">Pasma-sys</h1>
                <p className="text-xs text-indigo-200">Parents Management System (Système de gestion parentale)</p>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4 text-sm text-gray-650 leading-relaxed">
                  <div className="flex gap-3">
                    <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold shrink-0">🤝</span>
                    <div>
                      <h4 className="font-bold text-gray-950 text-xs uppercase tracking-wider">Suivi Scolaire Simplifié</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Consultez en temps réel les notes de vos enfants, leur relevé d'assiduité, et l'avancement des devoirs exigés.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="p-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold shrink-0">💳</span>
                    <div>
                      <h4 className="font-bold text-gray-950 text-xs uppercase tracking-wider">Reglements & Planification</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Réglez la cantine ou l'abonnement transport, et dialoguez directement avec les professeurs principaux de l'école.</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6 space-y-4">
                  {/* Error display */}
                  {authError && (
                    <div className="p-3.5 bg-red-50 border border-red-200 text-red-900 text-xs rounded-xl font-medium space-y-1">
                      <p className="font-bold flex items-center gap-1">❌ Erreur de connexion</p>
                      <p className="leading-relaxed text-[11px] text-red-700">{authError}</p>
                    </div>
                  )}

                  {/* Google Login Trigger */}
                  <div className="space-y-2">
                    <button
                      onClick={handleLogin}
                      className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition active:scale-98 shadow-md shadow-indigo-100 cursor-pointer hover:bg-indigo-700"
                    >
                      <UserCheck className="h-4 w-4" /> Connectez-vous avec Google
                    </button>
                    <p className="text-[10px] text-gray-400 font-mono text-center">
                      Liaison sécurisée via Firebase Authentication
                    </p>
                  </div>

                  {/* Separator */}
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-widest bg-white px-2">Alternative</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  {/* Mode Démo button & Iframe Notice */}
                  <div className="space-y-3">
                    <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl text-[11px] leading-relaxed text-amber-900">
                      <p className="font-bold flex items-center gap-1.5 text-amber-950 mb-0.5">
                        ⚠️ Limitation de l'aperçu intégré (Iframe)
                      </p>
                      Les politiques de sécurité des navigateurs (Chrome, Safari, Firefox) bloquent souvent les popups Google Auth au sein d'un aperçu d'édition. Pour utiliser Pasma-sys, vous pouvez soit :
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <a
                        href={window.location.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs text-center"
                      >
                        Ouvrir l'App en grand ↗
                      </a>

                      <button
                        type="button"
                        onClick={handleGuestLogin}
                        className="py-2.5 bg-white hover:bg-slate-50 text-gray-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-gray-250 cursor-pointer shadow-2xs"
                      >
                        ⚡ Utiliser le Mode Démo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Main Authenticated Dashboard Portal */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            {/* Top Navigation Bar */}
            <header className="bg-white border-b border-gray-150 py-3.5 px-6 sticky top-0 z-30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl bg-indigo-50 p-2 rounded-xl">🏫</span>
                <div>
                  <h1 className="text-base font-black tracking-tight text-gray-950 flex items-center gap-1">
                    Pasma-sys <span className="text-[10px] bg-slate-900 text-white font-mono px-1.5 py-0.5 rounded-full uppercase scale-90">ENT</span>
                  </h1>
                  <p className="text-[10px] text-gray-400 font-medium">Parents Management Portal</p>
                </div>
              </div>

              {/* User Profil card & logout */}
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-gray-900">{user.displayName || user.email}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 justify-end">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" /> Parent Connecté
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 cursor-pointer transition"
                  title="Déconnexion"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </header>

            {/* Global Loader or Seeding Alert */}
            {dataLoading || seeding ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-8">
                <span className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <div className="text-center space-y-1">
                  <p className="font-bold text-sm text-gray-900">
                    {seeding ? "Création des données de simulation de vos élèves (Pasma)..." : "Synchronisation de votre profil parent..."}
                  </p>
                  <p className="text-xs text-gray-500">
                    {seeding ? "La base de données Firestore s'initialise pour votre UID." : "Chargement en cours depuis Google Firebase..."}
                  </p>
                </div>
              </div>
            ) : (
              /* Core Content Workspace */
              <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Left Side: Navigation side panels */}
                <div className="lg:col-span-1 space-y-5">
                  
                  {/* Supervised Pupils - Left panel - Only display if not in dedicated Apee workspace */}
                  {!activeTab.startsWith('apee_') ? (
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5" /> Éléves Supervisés (ENT)
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {students.map((stu) => (
                          <StudentCard
                            key={stu.id}
                            student={stu}
                            isSelected={selectedStudentId === stu.id}
                            onSelect={() => setSelectedStudentId(stu.id)}
                            onUpdateStudent={handleUpdateStudentInPlace}
                            onPrint={() => setPrintingStudent(stu)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* APEE General Cash Status Panel */
                    <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl p-4.5 border border-indigo-900 shadow-md space-y-3 font-mono">
                      <div>
                        <h4 className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider">État Général Caisse APEE</h4>
                        <p className="text-lg font-bold text-emerald-300 mt-0.5">
                          {(apeeParents.reduce((sum, p) => sum + p.totalPaid, 0) - apeeExpenses.filter(e => e.status === 'Executed').reduce((sum, e) => sum + e.amount, 0)).toLocaleString()} FCFA
                        </p>
                      </div>
                      <div className="text-[10px] text-slate-300 space-y-1 font-sans font-medium">
                        <div className="flex justify-between">
                          <span>Revenus :</span>
                          <span className="font-semibold text-white font-mono">{apeeParents.reduce((sum, p) => sum + p.totalPaid, 0).toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dépenses :</span>
                          <span className="font-semibold text-white font-mono">{apeeExpenses.filter(e => e.status === 'Executed').reduce((sum, e) => sum + e.amount, 0).toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between border-t border-indigo-900/55 pt-1 mt-1 text-xs">
                          <span>Recouvrement :</span>
                          <span className="font-bold text-emerald-400 font-mono">
                            {(apeeParents.reduce((sum, p) => sum + p.totalDue, 0) > 0 
                              ? (apeeParents.reduce((sum, p) => sum + p.totalPaid, 0) / apeeParents.reduce((sum, p) => sum + p.totalDue, 0)) * 100 
                              : 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Desktop Unified Nav Menu Card */}
                  <div className="bg-white border border-gray-150 rounded-2xl p-4 space-y-1 block shadow-2xs select-none">
                    
                    {/* SECTION 1: GESTION TRÉSORERIE APEE */}
                    <h3 className="text-[10px] font-black text-indigo-650 uppercase tracking-widest mb-2 pl-1 flex items-center gap-1">
                      💼 TRÉSORERIE APEE
                    </h3>
                    
                    <button
                      onClick={() => setActiveTab('apee_dashboard')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                        activeTab === 'apee_dashboard' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-650 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Tableau de Bord</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveParentToEdit(null);
                        setActiveTab('apee_recording');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                        activeTab === 'apee_recording' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-650 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2"><Calculator className="h-4 w-4" /> Enregistrer Cotis.</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('apee_search')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                        activeTab === 'apee_search' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-650 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2"><Search className="h-4 w-4" /> Fiches & Reçus</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('apee_reporting')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                        activeTab === 'apee_reporting' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-650 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2"><History className="h-4 w-4" /> Bilans Financiers</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('apee_finance')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                        activeTab === 'apee_finance' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-650 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2"><Coins className="h-4 w-4" /> Caisse & Dépenses</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('apee_archives')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                        activeTab === 'apee_archives' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-650 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2"><Database className="h-4 w-4" /> Archives & Imports</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('apee_settings')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                        activeTab === 'apee_settings' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-650 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2"><Settings className="h-4 w-4" /> Configurations</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('apee_reminders')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                        activeTab === 'apee_reminders' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-650 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2"><Bell className="h-4 w-4" /> Relances & Rappels</span>
                      {apeeParents.filter(p => p.status === 'partiel' || p.status === 'retard').length > 0 && (
                        <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-full font-mono shrink-0 transition-colors ${
                          activeTab === 'apee_reminders' ? 'bg-white text-indigo-700' : 'bg-red-100 text-red-800'
                        }`}>
                          {apeeParents.filter(p => p.status === 'partiel' || p.status === 'retard').length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab('apee_legal')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                        activeTab === 'apee_legal' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-650 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Droits & RGPD</span>
                    </button>

                    {/* SECTION 2: SUIVI SCOLAIRE E.N.T. */}
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4 mb-2 pl-1 flex items-center gap-1">
                      🎓 SUIVI SCOLAIRE ENT
                    </h3>

                    <button
                      onClick={() => setActiveTab('announcements')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                        activeTab === 'announcements'
                          ? 'bg-slate-900 text-white'
                          : 'text-gray-650 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2"><Newspaper className="h-4 w-4" /> Annonces & Actus</span>
                    </button>

                    {students.length > 0 && (
                      <>
                        <button
                          onClick={() => setActiveTab('homework')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                            activeTab === 'homework'
                              ? 'bg-slate-900 text-white'
                              : 'text-gray-650 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Devoirs / Cahier</span>
                          {pendingHomeworkCount > 0 && <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">{pendingHomeworkCount}</span>}
                        </button>

                        <button
                          onClick={() => setActiveTab('grades')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                            activeTab === 'grades'
                              ? 'bg-slate-900 text-white'
                              : 'text-gray-650 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-2"><Award className="h-4 w-4" /> Relevé de Notes</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('attendance')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                            activeTab === 'attendance'
                              ? 'bg-slate-900 text-white'
                              : 'text-gray-650 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Absentéisme</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setActiveTab('billing')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                        activeTab === 'billing'
                          ? 'bg-slate-900 text-white'
                          : 'text-gray-650 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2"><Landmark className="h-4 w-4" /> Cantine & Services</span>
                      {unpaidInvoiceCount > 0 && <span className="bg-red-100 text-red-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">{unpaidInvoiceCount}</span>}
                    </button>

                    {students.length > 0 && (
                      <>
                        <button
                          onClick={() => setActiveTab('appointments')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                            activeTab === 'appointments'
                              ? 'bg-slate-900 text-white'
                              : 'text-gray-650 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-2"><CalendarCheck2 className="h-4 w-4" /> Rédiger RDV</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('messages')}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                            activeTab === 'messages'
                              ? 'bg-slate-900 text-white'
                              : 'text-gray-650 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Messagerie</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Side / Centered: Main Screen Panel workspace */}
                <div className="lg:col-span-3 bg-white border border-gray-150 rounded-3xl p-5 lg:p-6 min-h-[500px] flex flex-col justify-between shadow-2xs">
                  <AnimatePresence mode="wait">
                    
                    {/* APEE WORKSPACE REGISTRATION & CALCULATOR */}
                    {activeTab === 'apee_dashboard' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="apee_dashboard">
                        <ApeeDashboard
                          parents={apeeParents}
                          expenses={apeeExpenses}
                          settings={apeeSettings}
                          onNavigate={(tab) => {
                            if (tab === 'recording') setActiveTab('apee_recording');
                            else if (tab === 'search') setActiveTab('apee_search');
                            else if (tab === 'reporting') setActiveTab('apee_reporting');
                          }}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'apee_recording' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="apee_recording">
                        <ApeeForm
                          settings={apeeSettings}
                          onSaveParent={handleSaveApeeParentInPlace}
                          activeParentToEdit={activeParentToEdit}
                          onCancelEdit={() => setActiveParentToEdit(null)}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'apee_search' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="apee_search">
                        <ApeeSearch
                          parents={apeeParents}
                          onEditParentRequest={(parent) => {
                            setActiveParentToEdit(parent);
                            setActiveTab('apee_recording');
                          }}
                          onDeleteParent={handleDeleteApeeParentInPlace}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'apee_reporting' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="apee_reporting">
                        <ApeeReporting
                          parents={apeeParents}
                          settings={apeeSettings}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'apee_finance' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="apee_finance">
                        <ApeeFinancial
                          expenses={apeeExpenses}
                          onSaveExpense={handleSaveApeeExpenseInPlace}
                          onDeleteExpense={handleDeleteApeeExpenseInPlace}
                          totalRevenue={apeeParents.reduce((sum, p) => sum + p.totalPaid, 0)}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'apee_archives' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="apee_archives">
                        <ApeeArchives
                          parents={apeeParents}
                          expenses={apeeExpenses}
                          settings={apeeSettings}
                          onImportBackup={handleImportApeeBackup}
                          onResetDatabase={handleResetApeeDatabase}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'apee_settings' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="apee_settings">
                        <ApeeSettingsComp
                          settings={apeeSettings}
                          onSaveSettings={handleSaveApeeSettings}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'apee_reminders' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="apee_reminders">
                        <ApeeReminders
                          parents={apeeParents}
                          settings={apeeSettings}
                          onSaveParent={handleSaveApeeParentInPlace}
                        />
                      </motion.div>
                    )}

                    {activeTab === 'apee_legal' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="apee_legal">
                        <ApeeLegal />
                      </motion.div>
                    )}

                    {/* CLASSIC PÉDAGOGIQUE CHANNELS */}
                    {activeTab === 'announcements' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="announcements">
                        <AnnouncementsFeed />
                      </motion.div>
                    )}

                    {activeTab === 'homework' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="homework">
                        <HomeworkBoard homeworks={currentHomeworks} onUpdateHomework={handleUpdateHomeworkInPlace} />
                      </motion.div>
                    )}

                    {activeTab === 'grades' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="grades">
                        <GradesDashboard grades={currentGrades} />
                      </motion.div>
                    )}

                    {activeTab === 'attendance' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="attendance">
                        <AttendanceTracker attendanceLogs={currentAttendance} />
                      </motion.div>
                    )}

                    {activeTab === 'billing' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="billing">
                        <BillingPortal invoices={invoices} onUpdateInvoice={handleUpdateInvoiceInPlace} />
                      </motion.div>
                    )}

                    {activeTab === 'appointments' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="appointments">
                        <AppointmentsScheduler appointments={appointments} students={students} onAddAppointment={handleAddAppointmentInPlace} />
                      </motion.div>
                    )}

                    {activeTab === 'messages' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="messages">
                        <MessageInbox messages={messages} students={students} onAddMessage={handleAddMessageInPlace} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono mt-8 text-gray-400">
                    <span className="flex items-baseline gap-1">
                      <Database className="h-3 w-3 text-indigo-500" /> Cloud Firestore Sync Active
                    </span>
                    <span>© {new Date().getFullYear()} Pasma-sys ENT Portal</span>
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cookie Consent Banner */}
      <AnimatePresence>
        {showCookieBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-xl bg-slate-900 border border-slate-800 text-white p-5 rounded-2xl shadow-2xl z-[999] font-sans space-y-3"
          >
            <div className="flex gap-3">
              <span className="text-2xl mt-0.5">🍪</span>
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-white tracking-tight">Gestion des Cookies & Conformité RGPD</h4>
                <p className="text-[11px] text-slate-300 leading-normal">
                  Nous utilisons des cookies de confort et jetons logiques pour sécuriser les cotisations APEE et l'E.N.T. Le délégué unique au traitement des données est <strong>Jacques Bene Mbama (+237 656 454 053)</strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setActiveTab('apee_legal');
                  setShowCookieBanner(false);
                }}
                className="px-3 py-1.5 text-[10.5px] font-bold text-indigo-300 hover:text-indigo-200 transition cursor-pointer"
              >
                En savoir plus & Gérer
              </button>

              <button
                onClick={() => {
                  localStorage.setItem('cookie_consent_decision', 'restricted');
                  localStorage.setItem('cookie_preferences', JSON.stringify({ essential: true, preferences: false, analytics: false }));
                  setShowCookieBanner(false);
                }}
                className="px-3 py-1.5 text-[10.5px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg transition cursor-pointer"
              >
                Refuser
              </button>

              <button
                onClick={() => {
                  localStorage.setItem('cookie_consent_decision', 'accepted');
                  localStorage.setItem('cookie_preferences', JSON.stringify({ essential: true, preferences: true, analytics: true }));
                  setShowCookieBanner(false);
                }}
                className="px-4 py-1.5 text-[10.5px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition cursor-pointer shadow-xs"
              >
                Tout Accepter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Profile Print Modal */}
      {printingStudent && (
        <StudentPrintModal
          student={printingStudent}
          grades={grades.filter(g => g.studentId === printingStudent.id)}
          attendance={attendanceLogs.filter(a => a.studentId === printingStudent.id)}
          isOpen={!!printingStudent}
          onClose={() => setPrintingStudent(null)}
        />
      )}
    </div>
  );
}
