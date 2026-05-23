import React, { useState } from 'react';
import { Save, HelpCircle, Shield, Settings, Info, CheckCircle2 } from 'lucide-react';
import { ApeeSettings } from '../../types';

interface ApeeSettingsProps {
  settings: ApeeSettings;
  onSaveSettings: (settings: ApeeSettings) => void;
}

export default function ApeeSettingsComp({ settings, onSaveSettings }: ApeeSettingsProps) {
  const [associationName, setAssociationName] = useState(settings.associationName);
  const [schoolYear, setSchoolYear] = useState(settings.schoolYear);
  const [cotisationAmount, setCotisationAmount] = useState<number>(settings.cotisationAmount);
  const [financialGoal, setFinancialGoal] = useState<number>(settings.financialGoal);

  // Success indicators
  const [showSuccess, setShowSuccess] = useState(false);

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
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3500);
  };

  return (
    <div id="content_apee_settings" className="space-y-6">

      <div className="border-b border-slate-150 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">⚙️ Configuration des Paramètres</h2>
        <p className="text-xs text-gray-500 font-medium">
          Ajuster les tarifs unitaires exigibles par élève, les objectifs de recouvrement globaux et modifier le nom officiel de l'association.
        </p>
      </div>

      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs px-4 py-3 rounded-xl flex items-center gap-2 font-semibold">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Paramètres généraux d'administration sauvegardés avec succès !</span>
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
                  className="w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-indigo-505 font-mono"
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
              <p className="text-[9px] text-gray-400">Ce montant sert de base de calcul pour la gauge de progression sur le tableau de bord.</p>
            </div>

          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 bg-slate-900 border border-slate-800 hover:border-black hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition shadow-2xs"
          >
            <Save className="h-4 w-4 text-emerald-400" /> Enregistrer les Configurations
          </button>
        </form>

        {/* Right column: help notes */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-150 rounded-2xl p-4.5 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide border-b pb-2">
            <Info className="h-4 w-4 text-sky-500" /> Informations Utiles
          </h3>

          <div className="text-xs text-gray-500 space-y-3 leading-relaxed font-normal">
            <p>
              Les cotisations scolaires APEE (Association des Parents d'Élèves et d'Enseignants) sont fixées par le conseil de l'école (COGE) d'Ekali 1 à Mfou conformément à la réglementation en vigueur.
            </p>
            <p>
              Toute modification des tarifs unitaires est immédiatement répercutée dans l'ensemble des modules : 
              les fiches d'enregistrements recalcule automatiquement le restant exigible par rapport au nombre d'élèves déclarés pour chaque parent.
            </p>
            <hr className="border-slate-200" />
            <div className="bg-sky-50 text-sky-900 p-3 rounded-lg flex gap-2 items-start text-[10px]">
              <Shield className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
              <div>
                <strong>Sauvegarde Sécurisée Automatique :</strong>
                <p className="mt-1">Les modifications d'administration de l'association sont répliquées en tâche de fond sur votre instance de stockage Firebase afin de garantir une synchronisation multidevice robuste.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
