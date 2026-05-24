import React, { useState } from 'react';
import { Save, HelpCircle, Shield, Settings, Info, CheckCircle2, Plus, Trash2, Edit2, X, TrendingUp, Lock, Unlock, UserCheck } from 'lucide-react';
import { ApeeSettings, ApeeBudgetLine } from '../../types';

interface ApeeSettingsProps {
  settings: ApeeSettings;
  onSaveSettings: (settings: ApeeSettings) => void;
}

export default function ApeeSettingsComp({ settings, onSaveSettings }: ApeeSettingsProps) {
  const [associationName, setAssociationName] = useState(settings.associationName);
  const [schoolYear, setSchoolYear] = useState(settings.schoolYear);
  const [cotisationAmount, setCotisationAmount] = useState<number>(settings.cotisationAmount);
  const [financialGoal, setFinancialGoal] = useState<number>(settings.financialGoal);

  // Financial Manager credentials states
  const [finManagerName, setFinManagerName] = useState(settings.finManagerName || '');
  const [finManagerPhone, setFinManagerPhone] = useState(settings.finManagerPhone || '');
  const [finManagerPassword, setFinManagerPassword] = useState(settings.finManagerPassword || '');
  const [showPassword, setShowPassword] = useState(false);

  // Pedagogical Manager credentials states
  const [pedManagerName, setPedManagerName] = useState(settings.pedManagerName || '');
  const [pedManagerPhone, setPedManagerPhone] = useState(settings.pedManagerPhone || '');
  const [pedManagerPassword, setPedManagerPassword] = useState(settings.pedManagerPassword || '');
  const [showPedPassword, setShowPedPassword] = useState(false);

  // Budget lines states
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [lineName, setLineName] = useState('');
  const [lineAmount, setLineAmount] = useState<number>(0);
  const [lineDescription, setLineDescription] = useState('');

  // Success indicators
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Paramètres enregistrés avec succès !');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!associationName.trim() || !schoolYear.trim() || cotisationAmount <= 0 || financialGoal <= 0) {
      alert("Veuillez renseigner correctement l'ensemble des champs obligatoires.");
      return;
    }

    onSaveSettings({
      associationName: associationName.trim(),
      schoolYear: schoolYear.trim(),
      cotisationAmount,
      financialGoal,
      budgetLines: settings.budgetLines || [],
      finManagerName: finManagerName.trim(),
      finManagerPhone: finManagerPhone.trim(),
      finManagerPassword: finManagerPassword.trim(),
      pedManagerName: pedManagerName.trim(),
      pedManagerPhone: pedManagerPhone.trim(),
      pedManagerPassword: pedManagerPassword.trim(),
    });

    setSuccessMessage("Paramètres généraux d'administration sauvegardés avec succès !");
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3500);
  };

  const handleSaveBudgetLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineName.trim() || lineAmount <= 0) {
      alert("Veuillez saisir un libellé valide et un montant alloué supérieur à 0.");
      return;
    }

    const currentLines = settings.budgetLines || [];
    let updatedLines = [...currentLines];

    if (editingLineId) {
      updatedLines = updatedLines.map(l => 
        l.id === editingLineId 
          ? { id: l.id, name: lineName.trim(), allocatedAmount: lineAmount, description: lineDescription.trim() || undefined }
          : l
      );
      setSuccessMessage("Ligne budgétaire modifiée avec succès.");
    } else {
      const newLine: ApeeBudgetLine = {
        id: 'bl_' + Date.now(),
        name: lineName.trim(),
        allocatedAmount: lineAmount,
        description: lineDescription.trim() || undefined
      };
      updatedLines.push(newLine);
      setSuccessMessage("Nouvelle ligne budgétaire enregistrée.");
    }

    onSaveSettings({
      associationName,
      schoolYear,
      cotisationAmount,
      financialGoal,
      budgetLines: updatedLines,
      finManagerName: finManagerName.trim(),
      finManagerPhone: finManagerPhone.trim(),
      finManagerPassword: finManagerPassword.trim(),
      pedManagerName: pedManagerName.trim(),
      pedManagerPhone: pedManagerPhone.trim(),
      pedManagerPassword: pedManagerPassword.trim(),
    });

    // Reset budget form
    setEditingLineId(null);
    setLineName('');
    setLineAmount(0);
    setLineDescription('');

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3500);
  };

  const handleStartEditLine = (line: ApeeBudgetLine) => {
    setEditingLineId(line.id);
    setLineName(line.name);
    setLineAmount(line.allocatedAmount);
    setLineDescription(line.description || '');
  };

  const handleCancelEditLine = () => {
    setEditingLineId(null);
    setLineName('');
    setLineAmount(0);
    setLineDescription('');
  };

  const handleDeleteLine = (id: string, name: string) => {
    const confirm = window.confirm(`Voulez-vous vraiment supprimer la ligne budgétaire "${name}" ?`);
    if (!confirm) return;

    const currentLines = settings.budgetLines || [];
    const updatedLines = currentLines.filter(l => l.id !== id);

    onSaveSettings({
      associationName,
      schoolYear,
      cotisationAmount,
      financialGoal,
      budgetLines: updatedLines,
      finManagerName: finManagerName.trim(),
      finManagerPhone: finManagerPhone.trim(),
      finManagerPassword: finManagerPassword.trim(),
      pedManagerName: pedManagerName.trim(),
      pedManagerPhone: pedManagerPhone.trim(),
      pedManagerPassword: pedManagerPassword.trim(),
    });

    setSuccessMessage("Ligne budgétaire supprimée de la planification annuelle.");
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3500);
  };

  // Calculations for budget consumption status
  const budgetLinesList = settings.budgetLines || [];
  const totalAllocated = budgetLinesList.reduce((acc, curr) => acc + curr.allocatedAmount, 0);
  const percentAllocated = Math.min(100, Math.round((totalAllocated / financialGoal) * 100)) || 0;

  return (
    <div id="content_apee_settings" className="space-y-6">

      <div className="border-b border-slate-150 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">⚙️ Configuration des Paramètres & Budget</h2>
        <p className="text-xs text-gray-500 font-medium">
          Ajuster les tarifs unitaires exigibles par élève, définir l'enveloppe annuelle et structurer la planification des lignes budgétaires.
        </p>
      </div>

      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs px-4 py-3 rounded-xl flex items-center gap-2 font-semibold animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: main config form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white border border-slate-150 rounded-2xl p-4 md:p-5 space-y-4">
          <div className="border-b pb-2 text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide border-slate-100 select-none">
            <Settings className="h-4 w-4 text-indigo-500 animate-spin" style={{ animationDuration: '6s' }} /> Configuration Administrative et Tarifaire
          </div>

          <div className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Nom Officiel de l'Association <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={associationName}
                onChange={(e) => setAssociationName(e.target.value)}
                placeholder="Ex: APEE CES d'Ekali 1 - MFOU"
                className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-indigo-505 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Année Scolaire Active <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  placeholder="Ex: 2025/2026"
                  className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-indigo-550 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Taux Par Élève Camerounais (FCFA) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  min="500"
                  required
                  value={cotisationAmount || ''}
                  onChange={(e) => setCotisationAmount(Number(e.target.value))}
                  placeholder="Ex: 25000"
                  className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-indigo-550 font-mono text-right"
                />
              </div>

            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-600 uppercase">Objectif prévisionnel du budget APEE (FCFA) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="10000"
                required
                value={financialGoal || ''}
                onChange={(e) => setFinancialGoal(Number(e.target.value))}
                placeholder="Ex: 5000000"
                className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-indigo-550 font-mono text-right"
              />
              <p className="text-[9px] text-gray-400">Ce montant sert de base de calcul pour la gauge de progression et l'allocation des lignes de dépenses.</p>
            </div>

          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 bg-slate-900 border border-slate-800 hover:border-black hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
          >
            <Save className="h-4 w-4 text-emerald-400" /> Enregistrer les Configurations
          </button>
        </form>

        {/* Right column: help notes & Financial Manager Profile */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-4 ">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide border-b pb-2">
              <Info className="h-4 w-4 text-sky-500" /> Planification Budgétaire
            </h3>

            <div className="text-xs text-gray-500 space-y-3 leading-relaxed font-normal">
              <p>
                Les cotisations scolaires APEE sont capitalisées à hauteur de la prévision globale. Il est conseillé de répartir cet objectif en **lignes budgétaires** strictes pour chaque type de dépenses (Didactique, Réparations, Fonctionnement COGE).
              </p>
              <p>
                En liant chaque dépense saisie sous <strong>Régie Financière</strong> à sa ligne budgétaire associée, le système calcule automatiquement les <strong>taux de consommation budgétaire</strong> en temps réel.
              </p>
              <hr className="border-slate-200" />
              <div className="bg-sky-50 text-sky-900 p-3 rounded-lg flex gap-2 items-start text-[10px]">
                <Shield className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
                <div>
                  <strong>Allocation d'Enveloppe :</strong>
                  <p className="mt-1">Veillez à ce que la somme des montants alloués ne dépasse pas l'objectif budgétaire prévisionnel pour conserver l'équilibre financier de l'école.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-150 rounded-2xl p-4.5 space-y-4 shadow-3xs">
            <h3 className="text-xs font-bold text-slate-850 flex items-center gap-1.5 uppercase tracking-wide border-b pb-2 select-none">
              <Shield className="h-4 w-4 text-indigo-500" /> Responsable Financier & Restreindre
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Nom Complet <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400">👤</span>
                  <input
                    type="text"
                    required
                    value={finManagerName}
                    onChange={(e) => setFinManagerName(e.target.value)}
                    placeholder="Ex: M. Jean-Pierre Atangana"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Téléphone <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400">📞</span>
                  <input
                    type="text"
                    required
                    value={finManagerPhone}
                    onChange={(e) => setFinManagerPhone(e.target.value)}
                    placeholder="Ex: +237 6xx xx xx xx"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-indigo-500 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Mot de passe de contrôle <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400">🔑</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={finManagerPassword}
                    onChange={(e) => setFinManagerPassword(e.target.value)}
                    placeholder="Saisir un mot de passe vigile"
                    className="w-full pl-8 pr-12 py-1.5 text-xs bg-slate-50 border border-slate-250 rounded-lg focus:outline-indigo-500 font-mono text-slate-800 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1.5 text-[9px] text-gray-500 hover:text-indigo-650 cursor-pointer p-0.5 font-bold uppercase"
                  >
                    {showPassword ? "Masquer" : "Afficher"}
                  </button>
                </div>
              </div>

              {/* Status Indicator */}
              <div className={`p-3 rounded-xl flex gap-2.5 items-start text-[10px] border leading-normal ${
                finManagerPassword ? 'bg-emerald-50 text-emerald-950 border-emerald-250' : 'bg-amber-50 text-amber-950 border-amber-250'
              }`}>
                {finManagerPassword ? (
                  <>
                    <Lock className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <strong>Contrôle d'accès actif (Verrouillé)</strong>
                      <p className="mt-1 font-normal text-slate-600">
                        La création ou suppression des parents, reçus et dépenses exigera le mot de passe de {finManagerName || "M. le Responsable"}.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <strong>Sécurité désactivée</strong>
                      <p className="mt-1 font-normal text-slate-600">
                        Aucun vigile configuré. N'importe quel utilisateur connecté peut librement ajouter et supprimer des données dans l'espace APEE.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!finManagerName.trim() || !finManagerPhone.trim() || !finManagerPassword.trim()) {
                    alert("Veuillez renseigner tous les champs du Responsable Financier (Nom, Téléphone et Mot de passe).");
                    return;
                  }
                  onSaveSettings({
                    associationName,
                    schoolYear,
                    cotisationAmount,
                    financialGoal,
                    budgetLines: settings.budgetLines || [],
                    finManagerName: finManagerName.trim(),
                    finManagerPhone: finManagerPhone.trim(),
                    finManagerPassword: finManagerPassword.trim(),
                    pedManagerName: pedManagerName.trim(),
                    pedManagerPhone: pedManagerPhone.trim(),
                    pedManagerPassword: pedManagerPassword.trim(),
                  });
                  setSuccessMessage("Accès du Responsable Financier enregistrés avec succès !");
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 3500);
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs"
              >
                <UserCheck className="h-4 w-4" /> Sauvegarder les accès
              </button>
            </div>
          </div>

          {/* Pedagogical Manager Profile */}
          <div className="bg-white border border-slate-150 rounded-2xl p-4.5 space-y-4 shadow-3xs">
            <h3 className="text-xs font-bold text-slate-850 flex items-center gap-1.5 uppercase tracking-wide border-b pb-2 select-none">
              <Shield className="h-4 w-4 text-emerald-500" /> Responsable Pédagogique & Administratif
            </h3>

            <div className="space-y-3.5 text-xs">
              <p className="text-[10px] text-slate-500 leading-normal">
                Configurez l'autorité pédagogique officielle (Censeur ou Surveillant Général) seule habilitée à introduire et modifier les informations de scolarité (bulletins, notes, assiduité, devoirs et communiqués).
              </p>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Nom Complet (Censeur / SG) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400">👤</span>
                  <input
                    type="text"
                    required
                    value={pedManagerName}
                    onChange={(e) => setPedManagerName(e.target.value)}
                    placeholder="Ex: M. François Bidzogo (Censeur)"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Téléphone <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400">📞</span>
                  <input
                    type="text"
                    required
                    value={pedManagerPhone}
                    onChange={(e) => setPedManagerPhone(e.target.value)}
                    placeholder="Ex: +237 6xx xx xx xx"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-500 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Mot de Passe Vigile <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-slate-400">🔑</span>
                  <input
                    type={showPedPassword ? "text" : "password"}
                    required
                    value={pedManagerPassword}
                    onChange={(e) => setPedManagerPassword(e.target.value)}
                    placeholder="Mot de passe d'administration académique"
                    className="w-full pl-8 pr-12 py-1.5 text-xs bg-slate-50 border border-slate-250 rounded-lg focus:outline-emerald-500 font-mono text-slate-800 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPedPassword(!showPedPassword)}
                    className="absolute right-2.5 top-1.5 text-[9px] text-gray-500 hover:text-emerald-650 cursor-pointer p-0.5 font-bold uppercase select-none"
                  >
                    {showPedPassword ? "Masquer" : "Afficher"}
                  </button>
                </div>
              </div>

              {/* Status Indicator */}
              <div className={`p-3 rounded-xl flex gap-2.5 items-start text-[10px] border leading-normal ${
                pedManagerPassword ? 'bg-emerald-50 text-emerald-950 border-emerald-250' : 'bg-amber-50 text-amber-950 border-amber-250'
              }`}>
                {pedManagerPassword ? (
                  <>
                    <Lock className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <strong>Contrôle académique strict activé</strong>
                      <p className="mt-1 font-normal text-slate-600">
                        La modification des notes, devoirs, fiches d'assiduité et publication d'actualités exige le mot de passe de {pedManagerName || "l'autorité pédagogique"}.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <strong>Accès libre (Saisie non sécurisée)</strong>
                      <p className="mt-1 font-normal text-slate-600">
                        Aucun responsable académique enregistré. N'importe quel visiteur connecté de l'ENT peut introduire et réinitialiser les données scolaires.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!pedManagerName.trim() || !pedManagerPhone.trim() || !pedManagerPassword.trim()) {
                    alert("Veuillez renseigner tous les champs du Responsable Pédagogique (Nom, Téléphone et Mot de passe).");
                    return;
                  }
                  onSaveSettings({
                    associationName,
                    schoolYear,
                    cotisationAmount,
                    financialGoal,
                    budgetLines: settings.budgetLines || [],
                    finManagerName: finManagerName.trim(),
                    finManagerPhone: finManagerPhone.trim(),
                    finManagerPassword: finManagerPassword.trim(),
                    pedManagerName: pedManagerName.trim(),
                    pedManagerPhone: pedManagerPhone.trim(),
                    pedManagerPassword: pedManagerPassword.trim(),
                  });
                  setSuccessMessage("Accès du Responsable Pédagogique enregistrés avec succès !");
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 3500);
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs"
              >
                <UserCheck className="h-4 w-4" /> Sauvegarder les accès scolaires
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* NEW SECTION: Annual Budget Lines Allocation */}
      <div className="bg-white border border-slate-150 rounded-2xl p-4 md:p-6 space-y-6">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-indigo-500" /> Répartition du Budget Annuel de l'Établissement
            </h3>
            <p className="text-[10px] text-gray-400">Définissez les enveloppes allouées par rubrique de dépenses pour l'exercice {schoolYear}.</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-right">
            <div className="text-[9px] font-bold text-slate-500">Allocation Budgétaire Totale</div>
            <div className="font-mono text-xs font-black text-slate-800">
              {totalAllocated.toLocaleString()} FCFA <span className="text-[10px] font-medium text-gray-400">/ {financialGoal.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>

        {/* Visual progress allocated */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-semibold">
            <span className="text-slate-600">Pourcentage alloué de l'enveloppe globale</span>
            <span className={percentAllocated > 100 ? "text-rose-600" : "text-indigo-600"}>{percentAllocated}% alloués</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                percentAllocated > 100 ? "bg-rose-500" : percentAllocated === 100 ? "bg-emerald-500" : "bg-indigo-500"
              }`}
              style={{ width: `${percentAllocated}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Form to enter budget line */}
          <form onSubmit={handleSaveBudgetLine} className="lg:col-span-4 bg-slate-50/50 border border-slate-150 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-150 pb-2 uppercase tracking-wide">
              {editingLineId ? <Edit2 className="h-3.5 w-3.5 text-indigo-500" /> : <Plus className="h-3.5 w-3.5 text-indigo-500" />}
              {editingLineId ? 'Modifier la Rubrique' : 'Créer une Rubrique Budgétaire'}
            </h4>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Nom de la Ligne Budgétaire <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={lineName}
                  onChange={(e) => setLineName(e.target.value)}
                  placeholder="Ex: Didactique et Craies"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 font-medium text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Montant Alloué (FCFA) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-2.5 text-[10px] top-2 font-mono text-slate-400">FCFA</span>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={lineAmount || ''}
                    onChange={(e) => setLineAmount(Number(e.target.value))}
                    placeholder="Ex: 500000"
                    className="w-full pl-12 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 font-mono text-slate-800 text-right font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Description / Détails d'usage</label>
                <textarea
                  value={lineDescription}
                  onChange={(e) => setLineDescription(e.target.value)}
                  placeholder="Ex: Pour l'achat de rames de papier, agendas pédagogiques..."
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 font-medium text-slate-800 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {editingLineId && (
                <button
                  type="button"
                  onClick={handleCancelEditLine}
                  className="flex-1 py-1.5 bg-white border border-slate-250 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1"
                >
                  <X className="h-3 w-3" /> Annuler
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1 min-h-[30px]"
              >
                {editingLineId ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </form>

          {/* List of budget lines */}
          <div className="lg:col-span-8 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 px-1 border-l-2 border-indigo-500 select-none">
              Rubriques Enregistrées ({budgetLinesList.length})
            </h4>

            {budgetLinesList.length === 0 ? (
              <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-8 text-center text-xs text-slate-400">
                Aucune rubrique budgétaire n'est enregistrée pour cette année académique. 
                Utilisez le formulaire pour découper l'objectif global en centres de dépenses.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                {budgetLinesList.map((line) => {
                  const percentOfTotal = Math.round((line.allocatedAmount / financialGoal) * 100) || 0;
                  return (
                    <div 
                      key={line.id} 
                      className={`border p-3.5 rounded-xl space-y-2 transition-all duration-200 flex flex-col justify-between ${
                        editingLineId === line.id 
                          ? 'border-indigo-500 bg-indigo-50/20 shadow-xs' 
                          : 'border-slate-150 bg-white hover:border-slate-350 hover:shadow-2xs'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h5 className="text-xs font-bold text-slate-850 line-clamp-1">{line.name}</h5>
                          <span className="text-[9px] font-sans font-extrabold bg-slate-100 text-slate-700 px-1 rounded shrink-0">
                            {percentOfTotal}% du budget
                          </span>
                        </div>
                        {line.description && (
                          <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">
                            {line.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-50 pt-2 shrink-0">
                        <div className="font-mono text-xs font-bold text-slate-700">
                          {line.allocatedAmount.toLocaleString()} FCFA
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditLine(line)}
                            title="Modifier cette rubrique"
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded transition cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLine(line.id, line.name)}
                            title="Supprimer cette rubrique"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded transition cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
