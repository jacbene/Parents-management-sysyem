import React, { useState } from 'react';
import { Search, UserCheck, MessageSquare, Edit2, Trash2, Printer, X, Phone, MapPin, Tag, Calendar, AlertTriangle, ChevronRight, Notebook } from 'lucide-react';
import { ApeeParent, ApeeStudentLink } from '../../types';

interface ApeeSearchProps {
  parents: ApeeParent[];
  onEditParentRequest: (parent: ApeeParent) => void;
  onDeleteParent: (id: string) => void;
}

export default function ApeeSearch({ parents, onEditParentRequest, onDeleteParent }: ApeeSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  
  // Active detail modal/card selection
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // Filter list of parents
  const filteredParents = parents.filter(p => {
    // 1. Text Query matches Parent Name, Parent Phone, or Pupil Name
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = query === '' || 
      p.name.toLowerCase().includes(query) ||
      p.phone.includes(query) ||
      p.students.some(s => s.name.toLowerCase().includes(query));

    // 2. Status matches
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    // 3. Class matches
    const matchesClass = classFilter === 'all' || p.students.some(s => s.classRoom === classFilter);

    return matchesQuery && matchesStatus && matchesClass;
  });

  const selectedParent = parents.find(p => p.id === selectedParentId);

  const handleDeleteClick = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer définitivement ce parent d'élève ainsi que l'ensemble de ses cotisations ? Cette action est irréversible.")) {
      onDeleteParent(id);
      if (selectedParentId === id) {
        setSelectedParentId(null);
      }
    }
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div id="content_apee_search" className="space-y-6">
      
      {/* Header and description */}
      <div className="border-b border-slate-150 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">🔍 Recherche Parents & Élèves</h2>
        <p className="text-xs text-gray-500 font-medium">
          Moteur de recherche temps réel. Saisir un nom de parent ou d'élève pour retrouver sa fiche et son solde.
        </p>
      </div>

      {/* Filter and input controls */}
      <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 md:p-5 space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-505" />
          <input
            type="text"
            placeholder="Rechercher par nom de parent, nom d'élève, ou numéro de téléphone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-indigo-500 shadow-2xs"
          />
        </div>

        {/* multifaceted dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Statut :</span>
            <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 text-[11px] font-semibold">
              {[
                { key: 'all', label: 'Tous' },
                { key: 'soldé', label: 'Soldés' },
                { key: 'partiel', label: 'Partiels' },
                { key: 'retard', label: 'En retard' }
              ].map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStatusFilter(opt.key)}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition ${
                    statusFilter === opt.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Classe :</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-indigo-500 text-slate-700 cursor-pointer"
            >
              <option value="all">Toutes les classes</option>
              <option value="6ème">6ème</option>
              <option value="5ème">5ème</option>
              <option value="4ème ALL">4ème ALL</option>
              <option value="4ème ESP">4ème ESP</option>
              <option value="3ème ALL">3ème ALL</option>
              <option value="3ème ESP">3ème ESP</option>
              <option value="2nde">Seconde</option>
              <option value="1ère">Première</option>
              <option value="Tle">Terminale</option>
            </select>
          </div>

        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Results List column */}
        <div className={`lg:col-span-7 space-y-3 ${selectedParentId ? 'hidden md:block' : ''}`}>
          
          <div className="flex justify-between items-center px-1 text-xs text-gray-500 font-bold select-none">
            <span>RÉSULTATS DE LA RECHERCHE</span>
            <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md">{filteredParents.length} parents</span>
          </div>

          {filteredParents.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-gray-400 space-y-2">
              <p className="text-xs font-medium">Aucun parent d'élève ne correspond à vos critères de recherche.</p>
              <p className="text-[10px]">Essayez de modifier l'orthographe du nom ou réinitialisez les filtres.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredParents.map((parent) => (
                <div
                  key={parent.id}
                  onClick={() => setSelectedParentId(parent.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center gap-3 ${
                    selectedParentId === parent.id
                      ? 'bg-slate-900 border-slate-800 text-white shadow-xs'
                      : 'bg-white border-slate-150 hover:bg-slate-50 hover:border-slate-350'
                  }`}
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      {parent.status === 'retard' && (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-500 animate-pulse shrink-0" title="En retard de paiement" />
                      )}
                      <span className="text-xs font-bold leading-tight truncate">{parent.name}</span>
                      <span className={`text-[9px] font-extrabold font-mono px-1.5 py-0.5 rounded uppercase shrink-0 ${
                        parent.status === 'soldé' 
                          ? 'bg-emerald-500 text-white' 
                          : (parent.status === 'partiel' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white')
                      }`}>
                        {parent.status}
                      </span>
                    </div>
                    <div className={`text-[10px] truncate ${selectedParentId === parent.id ? 'text-slate-300' : 'text-gray-500'}`}>
                      Pupilles: <strong className="font-semibold">{parent.students.map(s => s.name).join(', ')}</strong>
                    </div>
                    <div className={`text-[9px] font-mono ${selectedParentId === parent.id ? 'text-slate-400' : 'text-gray-400'}`}>
                      Classes: {parent.students.map(s => s.classRoom).join(', ')}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold font-mono">
                        {parent.totalPaid.toLocaleString()} / {parent.totalDue.toLocaleString()}
                      </div>
                      <div className={`text-[9px] font-mono ${selectedParentId === parent.id ? 'text-slate-400' : 'text-gray-400'}`}>
                        FCFA
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Parent Details column */}
        <div className="lg:col-span-5">
          {!selectedParent ? (
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 text-center text-gray-400 space-y-3 flex/col items-center justify-center min-h-[300px]">
              <AlertTriangle className="h-8 w-8 text-indigo-400 mx-auto" />
              <div>
                <p className="text-xs font-bold text-slate-800">Aucune fiche parent sélectionnée</p>
                <p className="text-[10px] text-gray-400 mt-1 max-w-xs mx-auto">
                  Cliquez sur un parent de la liste de gauche pour afficher son historique de cotisations, ré-imprimer son reçu et envoyer des rappels.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-150 rounded-2xl p-4 md:p-5 space-y-4 shadow-sm relative">
              
              {/* Close detail button for mobile devices */}
              <button
                onClick={() => setSelectedParentId(null)}
                className="absolute top-4 right-4 p-1 rounded-lg border hover:bg-slate-50 text-slate-600 md:hidden cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">{selectedParent.name}</h3>
                  <span className={`text-[9px] font-extrabold uppercase font-mono px-1.5 py-0.5 rounded ${
                    selectedParent.status === 'soldé' 
                      ? 'bg-emerald-500 text-white' 
                      : (selectedParent.status === 'partiel' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white')
                  }`}>
                    {selectedParent.status}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 font-mono">ID: {selectedParent.id}</p>
              </div>

              {/* Personal details table */}
              <div className="bg-slate-50/50 rounded-xl p-3 space-y-2 border border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span><strong>Téléphone :</strong> {selectedParent.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span><strong>Adresse / Résidence :</strong> {selectedParent.address || 'Non spécifiée'}</span>
                </div>
              </div>

              {/* Pupils listed */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1 border-b border-slate-100 pb-1">
                  <Notebook className="h-3.5 w-3.5 text-emerald-500" /> Élèves inscrits / Classes
                </h4>
                <div className="space-y-1.5">
                  {selectedParent.students.map((student, idx) => (
                    <div key={idx} className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 text-xs flex justify-between items-center font-medium text-slate-800">
                      <span>{student.name}</span>
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md font-mono">{student.classRoom}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction payment list */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1 border-b border-slate-100 pb-1">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Historique Financier
                </h4>
                {selectedParent.payments.length === 0 ? (
                  <p className="text-[10px] text-red-500 font-bold bg-red-50 p-2 rounded-lg text-center">Aucun versement n'a encore été enregistré pour ce parent.</p>
                ) : (
                  <div className="space-y-1.5 font-mono max-h-40 overflow-y-auto">
                    {selectedParent.payments.map((p, idx) => (
                      <div key={p.id || idx} className="bg-white border rounded-lg p-2 flex justify-between items-center text-xs">
                        <div>
                          <div className="font-extrabold text-slate-850 flex items-center gap-1.5">
                            <span>{p.amount.toLocaleString()} FCFA</span>
                            <span className="text-[8px] font-sans font-extrabold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                              {p.method || 'Espèces'}
                            </span>
                          </div>
                          <div className="text-[9px] text-gray-400 mt-0.5">
                            {p.date} {p.note && `(${p.note})`}
                            {p.transactionId && (
                              <span className="ml-1 px-1.5 py-0.5 text-[8px] font-semibold text-indigo-700 bg-indigo-50 rounded">
                                TX: {p.transactionId} ({p.provider || 'N/A'})
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 font-sans">Versement #{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dues breakdown statistics panel */}
              <div className="bg-slate-900 text-white rounded-xl p-3.5 font-mono text-xs space-y-1 border border-slate-850">
                <div className="flex justify-between">
                  <span className="text-slate-400">Exigible global :</span>
                  <span>{selectedParent.totalDue.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payé cumulé :</span>
                  <span className="text-emerald-400">{selectedParent.totalPaid.toLocaleString()} FCFA</span>
                </div>
                <hr className="border-slate-800 my-1" />
                <div className="flex justify-between text-sm font-bold">
                  <span>Reste à payer :</span>
                  <span className={selectedParent.totalDue - selectedParent.totalPaid > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                    {Math.max(0, selectedParent.totalDue - selectedParent.totalPaid).toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              {selectedParent.note && (
                <div className="bg-amber-50 rounded-xl p-3 text-[11px] text-amber-900 border border-amber-200">
                  <strong>Notes :</strong> {selectedParent.note}
                </div>
              )}

              {/* Bottom quick actions bar */}
              <div className="grid grid-cols-2 gap-2 border-t pt-3">
                <button
                  onClick={() => onEditParentRequest(selectedParent)}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-105 border hover:bg-slate-150 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition select-none"
                  title="Modifier la fiche parent"
                >
                  <Edit2 className="h-3.5 w-3.5 text-slate-700" /> Modifier
                </button>

                <button
                  onClick={() => handleDeleteClick(selectedParent.id)}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-red-50 text-red-650 hover:bg-red-100 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition select-none border border-red-200"
                  title="Supprimer la fiche parent"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" /> Supprimer
                </button>
              </div>

              <button
                onClick={handleTriggerPrint}
                className="w-full mt-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl py-2.5 text-xs uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <Printer className="h-4 w-4 text-amber-400" /> Imprimer Reçu Parent
              </button>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
