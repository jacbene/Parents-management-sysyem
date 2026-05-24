import React, { useState, useEffect } from 'react';
import { collection, doc, getDocs, query, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Landmark, Plus, CheckCircle, AlertOctagon, UserCheck, Phone, ShieldCheck, ArrowRight, X, Sparkles, User, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ApeeSettings, ApeeParent, Student, Grade, Homework, Attendance, Invoice } from '../types';

export interface Establishment {
  id: string;
  name: string;
  cotisationAmount: number;
  financialGoal: number;
  finManagerName: string;
  finManagerPhone: string;
  finManagerPassword?: string;
  pedManagerName?: string;
  pedManagerPhone?: string;
  pedManagerPassword?: string;
  schoolYear: string;
  ownerId: string;
}

interface PortalOnboardingProps {
  onSelectSchool: (schoolId: string, role: 'manager' | 'parent', parentDetails?: { name: string; phone: string; studentSubsetNames?: string[] }) => void;
  currentUserUid: string | null;
  onAutoLoginGuest: () => Promise<string>;
}

export default function PortalOnboarding({ onSelectSchool, currentUserUid, onAutoLoginGuest }: PortalOnboardingProps) {
  const [schools, setSchools] = useState<Establishment[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [activeTab, setActiveTab] = useState<'choose' | 'create'>('choose');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Parent Login Form State
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [verifyingParent, setVerifyingParent] = useState(false);

  // Create School Form State
  const [schoolName, setSchoolName] = useState('');
  const [cotisationAmount, setCotisationAmount] = useState<number>(25000);
  const [financialGoal, setFinancialGoal] = useState<number>(5000000);
  const [schoolYear, setSchoolYear] = useState('2025/2026');
  
  // Financier & Pedagogique Manager info
  const [finName, setFinName] = useState('');
  const [finPhone, setFinPhone] = useState('');
  const [finPassword, setFinPassword] = useState('');
  
  const [pedName, setPedName] = useState('');
  const [pedPhone, setPedPhone] = useState('');
  const [pedPassword, setPedPassword] = useState('');

  const [creatingSchool, setCreatingSchool] = useState(false);

  // Fetch establishments or fallback to pre-set seeds if empty
  const fetchSchools = async () => {
    setLoadingSchools(true);
    try {
      const q = query(collection(db, 'establishments'));
      const snapshot = await getDocs(q);
      const list: Establishment[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Establishment);
      });

      // Default fallback schools so there's always an active list
      const fallbackList: Establishment[] = [
        {
          id: 'demo_school_ekali',
          name: "CES d'Ekali 1 - MFOU",
          cotisationAmount: 25000,
          financialGoal: 5000000,
          finManagerName: 'Marie Béné',
          finManagerPhone: '677002233',
          schoolYear: '2025/2026',
          ownerId: 'demo_admin'
        },
        {
          id: 'demo_school_vogt',
          name: "Collège Vogt - Yaoundé",
          cotisationAmount: 35000,
          financialGoal: 12000000,
          finManagerName: 'Abbé Ondoa',
          finManagerPhone: '699445522',
          schoolYear: '2025/2026',
          ownerId: 'demo_admin'
        },
        {
          id: 'demo_school_bilingue',
          name: "Lycée Bilingue d'Ekounou",
          cotisationAmount: 25000,
          financialGoal: 8000000,
          finManagerName: 'M. Tchana',
          finManagerPhone: '655112233',
          schoolYear: '2025/2026',
          ownerId: 'demo_admin'
        }
      ];

      if (list.length === 0) {
        setSchools(fallbackList);
      } else {
        // Merge list with fallback fallback fallback to ensure variety
        const merged = [...list];
        fallbackList.forEach(fb => {
          if (!merged.some(m => m.id === fb.id)) {
            merged.push(fb);
          }
        });
        setSchools(merged);
      }
    } catch (err) {
      console.warn("Could not load establishments from Firestore:", err);
      // fallback in UI
      setSchools([
        {
          id: 'demo_school_ekali',
          name: "CES d'Ekali 1 - MFOU",
          cotisationAmount: 25000,
          financialGoal: 5000000,
          finManagerName: 'Marie Béné',
          finManagerPhone: '677002233',
          schoolYear: '2025/2026',
          ownerId: 'demo_admin'
        }
      ]);
    } finally {
      setLoadingSchools(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  // Quick preset loader helper
  const handleQuickPreset = (option: 'demo_school_ekali' | 'custom') => {
    if (option === 'demo_school_ekali') {
      setSelectedSchoolId('demo_school_ekali');
      setParentName('Martin');
      setParentPhone('677112233');
    }
  };

  // Perform Parent Verification logic
  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedSchoolId) {
      setErrorMessage("Veuillez sélectionner un établissement scolaire dans la liste.");
      return;
    }
    if (!parentName.trim() || !parentPhone.trim()) {
      setErrorMessage("Veuillez remplir votre nom complet et votre numéro de téléphone.");
      return;
    }

    setVerifyingParent(true);
    try {
      // 1. Ensure user is logged in (at least anonymously to allow read checks)
      let currentUid = currentUserUid;
      if (!currentUid) {
        currentUid = await onAutoLoginGuest();
      }

      // 2. Query invoices for the chosen school matching APEE parent record
      // The parent record is stored inside the 'invoices' collection where parentId == selectedSchoolId (or uid)
      // and studentId is 'apee_ces_ekali_1'
      const qInvoices = query(collection(db, 'invoices'));
      const snapshot = await getDocs(qInvoices);
      
      let matchedInvoice: any = null;
      let invoicesFoundCount = 0;

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        // Match conditions: 
        // 1. parentId equals selectedSchoolId (meaning this school)
        // 2. studentId equals 'apee_ces_ekali_1' (meaning Apee parent item)
        if (data.parentId === selectedSchoolId && data.studentId === 'apee_ces_ekali_1') {
          invoicesFoundCount++;
          const candidateTitle = (data.title || '').toLowerCase().trim();
          const candidatePhone = (data.phone || '').trim();
          
          const searchName = parentName.toLowerCase().trim();
          const searchPhone = parentPhone.trim();

          // Match by name containing searchName or phone matches exact
          const nameMatches = candidateTitle.includes(searchName) || searchName.includes(candidateTitle);
          const phoneMatches = candidatePhone === searchPhone || candidatePhone.replace(/\s+/g, '') === searchPhone.replace(/\s+/g, '');

          if (nameMatches || phoneMatches) {
            matchedInvoice = data;
          }
        }
      });

      // If we are looking at the pre-seeded "Ekali" school, and the database doesn't have it, let's create a beautiful client-side fallback/automatic verify!
      if (!matchedInvoice && selectedSchoolId === 'demo_school_ekali') {
        const searchName = parentName.toLowerCase().trim();
        const searchPhone = parentPhone.trim();

        if (searchName.includes('martin') || searchPhone.includes('677112233')) {
          matchedInvoice = {
            id: 'inv_martin',
            title: 'Jean Martin',
            phone: '677112233',
            amount: 25000,
            amountPaid: 15000, // Versé 15,000 FCFA (acompte > 0)
            studentsList: JSON.stringify([{ name: 'Lucas Martin', classRoom: 'CM2-A' }, { name: 'Chloé Martin', classRoom: 'CE2-B' }])
          };
        } else if (searchName.includes('diallo') || searchPhone.includes('699445566')) {
          matchedInvoice = {
            id: 'inv_diallo',
            title: 'Mariam Diallo',
            phone: '699445566',
            amount: 25000,
            amountPaid: 0, // Versé 0 (rejeté car pas d'acompte !)
            studentsList: JSON.stringify([{ name: 'Amadou Diallo', classRoom: 'CM1-A' }])
          };
        }
      }

      // Evaluate match result
      if (!matchedInvoice) {
        setErrorMessage(
          `Accès Rejeté – Aucun parent enregistré ne correspond à "${parentName}" (${parentPhone}) dans cet établissement scolaire.\n` +
          `Veuillez vérifier vos données ou contacter le surveillant de l'école.`
        );
        setVerifyingParent(false);
        return;
      }

      // Check "versé au moins un acompte" condition: amountPaid (or totalPaid) MUST be > 0
      const amountPaidVal = matchedInvoice.amountPaid || 0;
      if (amountPaidVal <= 0) {
        setErrorMessage(
          `🔴 Accès Rejeté – Cotisation APEE insuffisante.\n` +
          `Le dossier pour "${matchedInvoice.title}" est enregistré avec 0 FCFA versé (Aucun acompte régularisé au service financier).\n` +
          `L'accès au cahier de textes, relevés d'assiduité et notes nécessite de s'acquitter d'au moins un acompte de cotisation.`
        );
        setVerifyingParent(false);
        return;
      }

      // Parents is accepted !
      setSuccessMessage(` ✅ Accès Autorisé ! Parent "${matchedInvoice.title}" validé. Redirection vers le portail scolaire...`);
      
      // Parse kids names
      let subs: string[] = [];
      try {
        if (matchedInvoice.studentsList) {
          const sList = JSON.parse(matchedInvoice.studentsList);
          subs = sList.map((x: any) => x.name);
        }
      } catch (e) {
        console.error(e);
      }

      // Let them in (redirect)
      setTimeout(() => {
        onSelectSchool(selectedSchoolId, 'parent', {
          name: matchedInvoice.title,
          phone: matchedInvoice.phone || parentPhone,
          studentSubsetNames: subs
        });
      }, 1500);

    } catch (err) {
      console.error(err);
      setErrorMessage("Une erreur de communication est survenue lors de l'accès à Firestore.");
    } finally {
      setVerifyingParent(false);
    }
  };

  // Create School and seed mock parents, kids, grades
  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!schoolName.trim() || !finName.trim() || !finPassword.trim()) {
      setErrorMessage("Veuillez spécifier le nom, le responsable financier et le mot de passe.");
      return;
    }

    setCreatingSchool(true);
    try {
      // 1. Authenticate guest in background if not already signed in
      let currentUid = currentUserUid;
      if (!currentUid) {
        currentUid = await onAutoLoginGuest();
      }

      const newSchoolId = `sch_${Date.now()}`;
      
      // 2. Map establishment profile
      const estDoc: Establishment = {
        id: newSchoolId,
        name: schoolName.trim(),
        cotisationAmount: Number(cotisationAmount),
        financialGoal: Number(financialGoal),
        finManagerName: finName.trim(),
        finManagerPhone: finPhone.trim(),
        finManagerPassword: finPassword.trim(),
        pedManagerName: pedName.trim() || 'Principal Responsable Pédagogique',
        pedManagerPhone: pedPhone.trim() || '',
        pedManagerPassword: pedPassword.trim() || '1234',
        schoolYear,
        ownerId: currentUid
      };

      const batch = writeBatch(db);

      // Write school profile to 'establishments'
      batch.set(doc(db, 'establishments', newSchoolId), estDoc);

      // 3. Write default APEE Settings inside the invoices collection
      const budgetLines = [
        { id: 'bl_1', name: 'Soutien Pédagogique et Matériel Didactique', allocatedAmount: Math.round(financialGoal * 0.3), description: 'Frais de craie, vacataires, etc.' },
        { id: 'bl_2', name: 'Aménagement & Réparations', allocatedAmount: Math.round(financialGoal * 0.25), description: 'Tables-bancs, entretien' },
        { id: 'bl_3', name: 'Santé et Hygiène', allocatedAmount: Math.round(financialGoal * 0.15), description: 'Secourisme, eau potable' },
        { id: 'bl_4', name: 'Activités Périscolaires FENASSCO', allocatedAmount: Math.round(financialGoal * 0.15), description: 'Compétitions de sport' },
        { id: 'bl_5', name: 'Fonds d\'Administration Générale', allocatedAmount: Math.round(financialGoal * 0.15), description: 'Frais divers de bureau' }
      ];

      batch.set(doc(db, 'invoices', `${newSchoolId}_settings`), {
        id: 'apee_settings',
        studentId: 'apee_settings',
        parentId: newSchoolId,
        title: schoolName.trim(),
        amount: Number(cotisationAmount),
        dueDate: schoolYear,
        status: 'Paid',
        amountPaid: Number(financialGoal),
        budgetLinesList: JSON.stringify(budgetLines),
        finManagerName: finName.trim(),
        finManagerPhone: finPhone.trim(),
        finManagerPassword: finPassword.trim(),
        pedManagerName: pedName.trim() || 'Principal Responsable Pédagogique',
        pedManagerPhone: pedPhone.trim() || '',
        pedManagerPassword: pedPassword.trim() || '1234',
      });

      // 4. Seed standard students for this specific school
      const student1Id = `stu_lucas_${newSchoolId.slice(4, 10)}`;
      const student2Id = `stu_chloe_${newSchoolId.slice(4, 10)}`;
      const student3Id = `stu_amadou_${newSchoolId.slice(4, 10)}`;

      const s1: Student = {
        id: student1Id,
        parentId: newSchoolId,
        name: 'Lucas Martin',
        grade: 'CM2 (10-11 ans)',
        classRoom: 'Classe CM2-A de M. Picard',
        avatar: '👦',
        teacherName: 'M. Jean Picard',
        teacherEmail: 'jean.picard@pasma.sys',
        dob: '2016-04-12'
      };

      const s2: Student = {
        id: student2Id,
        parentId: newSchoolId,
        name: 'Chloé Martin',
        grade: 'CE2 (8-9 ans)',
        classRoom: 'Classe CE2-B de Mme Laurent',
        avatar: '👧',
        teacherName: 'Mme Sophie Laurent',
        teacherEmail: 'sophie.laurent@pasma.sys',
        dob: '2018-09-21'
      };

      const s3: Student = {
        id: student3Id,
        parentId: newSchoolId,
        name: 'Amadou Diallo',
        grade: 'CM1 (9-10 ans)',
        classRoom: 'Classe CM1-A de M. Diallo',
        avatar: '👦',
        teacherName: 'M. Aliou Diallo',
        teacherEmail: 'aliou.diallo@pasma.sys',
        dob: '2017-11-04'
      };

      batch.set(doc(db, 'students', student1Id), s1);
      batch.set(doc(db, 'students', student2Id), s2);
      batch.set(doc(db, 'students', student3Id), s3);

      // 5. Seed standard grades (notes)
      const grade1: Grade = {
        id: `grd_luc1_${newSchoolId.slice(4, 10)}`,
        studentId: student1Id,
        parentId: newSchoolId,
        subject: 'Mathématiques',
        examName: 'Contrôle - Calcul de Volumes',
        score: 16.5,
        maxScore: 20,
        teacherRemarks: 'Excellent travail, très soigné.',
        date: '2026-05-18'
      };
      
      const grade2: Grade = {
        id: `grd_chl1_${newSchoolId.slice(4, 10)}`,
        studentId: student2Id,
        parentId: newSchoolId,
        subject: 'Français',
        examName: 'Grammaire & Conjugaison',
        score: 15,
        maxScore: 20,
        teacherRemarks: 'Bonne participation en classe.',
        date: '2026-05-19'
      };

      batch.set(doc(db, 'grades', grade1.id), grade1);
      batch.set(doc(db, 'grades', grade2.id), grade2);

      // 6. Seed homeworks
      const hw1: Homework = {
        id: `hw_1_${newSchoolId.slice(4, 10)}`,
        studentId: student1Id,
        parentId: newSchoolId,
        subject: 'Mathématiques',
        title: 'Exercices 5 p. 45 sur les fractions',
        description: 'Faire tous les calculs sur feuille de brouillon puis recopier.',
        dueDate: '2026-05-28',
        status: 'Pending'
      };
      
      const hw2: Homework = {
        id: `hw_2_${newSchoolId.slice(4, 10)}`,
        studentId: student2Id,
        parentId: newSchoolId,
        subject: 'Histoire-Géographie',
        title: 'Leçon sur l\'Afrique Centrale',
        description: 'Relire le résumé et repérer la capitale du Cameroun sur la carte.',
        dueDate: '2026-05-27',
        status: 'Pending'
      };

      batch.set(doc(db, 'homeworks', hw1.id), hw1);
      batch.set(doc(db, 'homeworks', hw2.id), hw2);

      // 7. Write parent cotisations (invoices marked as apee_ces_ekali_1)
      // Parent A (Jean Martin): COT paid of 15,000 FCFA -> ACCEPTED
      const parentAInvoice = {
        id: `apee_par_martin_${newSchoolId.slice(4, 10)}`,
        studentId: 'apee_ces_ekali_1',
        parentId: newSchoolId,
        title: 'Jean Martin',
        amount: Number(cotisationAmount),
        dueDate: schoolYear,
        status: 'Unpaid',
        paymentDate: new Date().toISOString(),
        phone: '677112233',
        address: 'Quartier Ekali, face école',
        email: 'j.martin@email.com',
        note: 'Acompte versé directement au Censeur',
        amountPaid: 15000, // SUCCESS! > 0
        studentsList: JSON.stringify([{ name: 'Lucas Martin', classRoom: 'CM2-A' }, { name: 'Chloé Martin', classRoom: 'CE2-B' }]),
        paymentsHistory: JSON.stringify([{ id: 'p_1', amount: 15000, date: '2026-05-02', note: 'Versement de rentrée', method: 'Orange Money' }])
      };

      // Parent B (Amadou Diallo): COT paid of 0 FCFA -> REJECTED
      const parentBInvoice = {
        id: `apee_par_diallo_${newSchoolId.slice(4, 10)}`,
        studentId: 'apee_ces_ekali_1',
        parentId: newSchoolId,
        title: 'Mariam Diallo',
        amount: Number(cotisationAmount),
        dueDate: schoolYear,
        status: 'Unpaid',
        paymentDate: '',
        phone: '699445566',
        address: 'Mfou Centre',
        email: '',
        note: 'Aucun versement effectué pour le moment',
        amountPaid: 0, // FAILURE! 0
        studentsList: JSON.stringify([{ name: 'Amadou Diallo', classRoom: 'CM1-A' }]),
        paymentsHistory: JSON.stringify([])
      };

      batch.set(doc(db, 'invoices', parentAInvoice.id), parentAInvoice);
      batch.set(doc(db, 'invoices', parentBInvoice.id), parentBInvoice);

      // Commit full batch write
      await batch.commit();

      setSuccessMessage("✨ Établissement créé et configuré avec succès ! Seeding de démo rattaché.");
      
      // Update local listing
      await fetchSchools();

      // Automatically log inside the new school as Administrator
      setTimeout(() => {
        onSelectSchool(newSchoolId, 'manager');
      }, 1500);

    } catch (err) {
      console.error(err);
      setErrorMessage("Une erreur est survenue lors de la création de la base de l'établissement.");
    } finally {
      setCreatingSchool(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="text-center space-y-3 mb-8">
        <span className="p-3 bg-indigo-600/10 text-indigo-600 rounded-3xl inline-flex text-3xl font-bold">🏫</span>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 font-sans">Portail Scolaire Pasma-sys</h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Bienvenue sur le portail de suivi et de gestion parentale des établissements scolaires.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/60 p-1.5 rounded-2xl w-fit mx-auto mb-8 border border-slate-300/40">
        <button
          onClick={() => { setActiveTab('choose'); setErrorMessage(null); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'choose'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Landmark className="h-4.5 w-4.5" /> Choisir un Établissement Visiteur
        </button>
        <button
          onClick={() => { setActiveTab('create'); setErrorMessage(null); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'create'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Plus className="h-4.5 w-4.5" /> Enregistrer mon Établissement
        </button>
      </div>

      {/* Error / Success Display box */}
      <AnimatePresence mode="wait">
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-900 text-xs rounded-2xl font-medium leading-relaxed flex items-start gap-2.5 shadow-sm"
          >
            <AlertOctagon className="h-5 w-5 text-red-650 shrink-0 mt-0.5" />
            <div className="whitespace-pre-line">{errorMessage}</div>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-50 border border-emerald-250 text-emerald-950 text-xs rounded-2xl font-bold leading-relaxed flex items-center gap-2.5 shadow-xs"
          >
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>{successMessage}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Core Screen Panels Custom layout based on active tab selection */}
        <div className="md:col-span-2 bg-white border border-slate-150 p-6 rounded-3xl shadow-sm">
          {activeTab === 'choose' ? (
            <form onSubmit={handleParentSubmit} className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  🔐 Connexion Espace Parents d'Élèves
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Les parents d'élèves autorisés doivent justifier d'un paiement d'acompte de la cotisation APEE de l'année scolaire en cours.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    Établissement Scolaire à visiter <span className="text-red-500">*</span>
                  </label>
                  {loadingSchools ? (
                    <div className="py-2.5 px-3 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-500">
                      Chargement des établissements disponibles...
                    </div>
                  ) : (
                    <select
                      value={selectedSchoolId}
                      required
                      onChange={(e) => setSelectedSchoolId(e.target.value)}
                      className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-indigo-500 focus:bg-white cursor-pointer"
                    >
                      <option value="">-- Choisissez l'établissement en visite --</option>
                      {schools.map(sch => (
                        <option key={sch.id} value={sch.id}>
                          🏫 {sch.name} (Cotisation APEE: {sch.cotisationAmount.toLocaleString()} FCFA)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                      Nom complet du parent <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder="Ex: Martin"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-indigo-500 focus:bg-white"
                      />
                      <User className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                      Numéro de téléphone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        placeholder="Ex: 677112233"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-indigo-500 focus:bg-white"
                      />
                      <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={verifyingParent}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-md shadow-indigo-150 relative cursor-pointer"
                >
                  {verifyingParent ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Vérification comptable en cours...
                    </>
                  ) : (
                    <>
                      Vérifier versement APEE & Entrer <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateSchool} className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  🏫 Enregistrer un établissement scolaire
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Créez le profil public de votre école pour y gérer ses cotisations, son budget, ses élèves, ses bulletins de notes et assiduité.
                </p>
              </div>

              <div className="space-y-5">
                {/* School main inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                      Nom officiel de l'établissement <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="Ex: Lycée Classique de Bafoussam"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                      Année Académique de Référence
                    </label>
                    <input
                      type="text"
                      required
                      value={schoolYear}
                      onChange={(e) => setSchoolYear(e.target.value)}
                      placeholder="Ex: 2025/2026"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-indigo-500 focus:bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                      Montant de la cotisation APEE (FCFA) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="5000"
                      value={cotisationAmount}
                      onChange={(e) => setCotisationAmount(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-indigo-500 focus:bg-white font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                      Budget Prévisionnel Total (FCFA)
                    </label>
                    <input
                      type="number"
                      required
                      min="100000"
                      value={financialGoal}
                      onChange={(e) => setFinancialGoal(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-indigo-500 focus:bg-white font-mono"
                    />
                  </div>
                </div>

                {/* Financier Profile */}
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-indigo-650" /> Paramètres Secrétariat Financier (APEE)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase">Nom du responsable *</label>
                      <input
                        type="text"
                        required
                        value={finName}
                        onChange={(e) => setFinName(e.target.value)}
                        placeholder="Ex: M. Béné"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-850"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase">Téléphone portable</label>
                      <input
                        type="tel"
                        value={finPhone}
                        onChange={(e) => setFinPhone(e.target.value)}
                        placeholder="Ex: 677334455"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-850"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase">Code secret d'accès *</label>
                      <input
                        type="password"
                        required
                        value={finPassword}
                        onChange={(e) => setFinPassword(e.target.value)}
                        placeholder="Ex: 1234"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 font-mono focus:outline-indigo-550"
                      />
                    </div>
                  </div>
                </div>

                {/* Pedagogic Profile */}
                <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl space-y-4">
                  <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-650" /> Paramètres Surveillant Général / Censeur (Pédagogique)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase">Nom du surveillant / censeur</label>
                      <input
                        type="text"
                        value={pedName}
                        onChange={(e) => setPedName(e.target.value)}
                        placeholder="Ex: Mme Sissoko"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-850"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase">Téléphone portable</label>
                      <input
                        type="tel"
                        value={pedPhone}
                        onChange={(e) => setPedPhone(e.target.value)}
                        placeholder="Ex: 666778891"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-850"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase">Code de protection cahier textes *</label>
                      <input
                        type="password"
                        required
                        value={pedPassword}
                        onChange={(e) => setPedPassword(e.target.value)}
                        placeholder="Ex: 5678"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 font-mono focus:outline-emerald-550"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creatingSchool}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition shadow-md shadow-slate-350 relative cursor-pointer"
                >
                  {creatingSchool ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Initialisation de l'ENT et de l'APEE de l'établissement...
                    </>
                  ) : (
                    <>
                      Créer le Compte Établissement <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Side: Demo Helper Controls / Guidance */}
        <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-3xl space-y-5">
          <div className="flex items-center gap-1 text-[10px] font-black text-amber-800 uppercase bg-amber-100/70 px-2.5 py-1 rounded-md w-fit">
            <Sparkles className="h-3.5 w-3.5 shrink-0" /> Guide de Test Rapide & Démonstration
          </div>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <p>
              Pour expérimenter les deux cas de figure imposés par les exigences d'inscription d'acompte :
            </p>

            <div className="space-y-3.5 pt-1">
              <div className="p-3 bg-white border border-emerald-150 rounded-2xl space-y-1.5 hover:border-emerald-300 transition shadow-3xs cursor-pointer"
                   onClick={() => handleQuickPreset('demo_school_ekali')}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-800 text-[10px] uppercase bg-emerald-50 px-2 py-0.5 rounded-md">
                    👍 Cas Accepté (Acompte Versé)
                  </span>
                  <span className="text-[10px] text-indigo-600 font-bold underline">Appliquer</span>
                </div>
                <p className="font-medium text-slate-800 leading-tight">
                  Entrez avec un parent qui a versé au moins un acompte à l'APEE.
                </p>
                <div className="text-[10.5px] font-mono text-slate-500 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100">
                  <div>👤 Nom : <span className="font-extrabold text-slate-800 select-all">Martin</span></div>
                  <div>📞 Tél : <span className="font-extrabold text-slate-800 select-all">677112233</span></div>
                  <div className="text-[9.5px] mt-1 text-slate-400">Total Versé : 15 000 FCFA</div>
                </div>
              </div>

              <div className="p-3 bg-white border border-red-150 rounded-2xl space-y-1.5 hover:border-red-300 transition shadow-3xs"
                   onClick={() => {
                     setSelectedSchoolId('demo_school_ekali');
                     setParentName('Diallo');
                     setParentPhone('699445566');
                   }}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-red-800 text-[10px] uppercase bg-red-50 px-2 py-0.5 rounded-md">
                    ❌ Cas Rejeté (Aucun Acompte)
                  </span>
                  <span className="text-[10px] text-indigo-600 font-bold underline">Appliquer</span>
                </div>
                <p className="font-medium text-slate-800 leading-tight">
                  Tentez de connecter un parent enregistré ayant 0 FCFA versé.
                </p>
                <div className="text-[10.5px] font-mono text-slate-500 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100">
                  <div>👤 Nom : <span className="font-extrabold text-slate-800 select-all">Diallo</span></div>
                  <div>📞 Tél : <span className="font-extrabold text-slate-800 select-all">699445566</span></div>
                  <div className="text-[9.5px] mt-1 text-slate-400">Total Versé : 0 FCFA (Retard)</div>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-indigo-50 text-indigo-950 rounded-2xl border border-indigo-100 space-y-1.5">
              <span className="font-black text-indigo-900 text-[10px] uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5 shrink-0" /> Comment ça marche ?
              </span>
              <p className="text-[11px] leading-relaxed opacity-90">
                La création d'un établissement enregistre le taux de cotisation (APEE), le budget prévisionnel de l'école dans Firestore, et pré-génère un jeu complet de données de démonstration de ses élèves pour tester instantanément.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
