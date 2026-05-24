import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, DollarSign, Wallet2, FileText, ArrowDownLeft, ArrowUpRight, Check, AlertCircle, TrendingUp } from 'lucide-react';
import { ApeeExpense, ApeeSettings } from '../../types';

interface ApeeFinancialProps {
  expenses: ApeeExpense[];
  onSaveExpense: (expense: ApeeExpense) => void;
  onDeleteExpense: (id: string) => void;
  totalRevenue: number;
  settings: ApeeSettings;
}

export default function ApeeFinancial({ expenses, onSaveExpense, onDeleteExpense, totalRevenue, settings }: ApeeFinancialProps) {
  // New expense form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'command' | 'payment-order' | 'refund'>('command');
  const [amount, setAmount] = useState<number>(0);
  const [status, setStatus] = useState<'Pending' | 'Approved' | 'Executed'>('Pending');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [budgetLineId, setBudgetLineId] = useState<string>('');

  // Active filter tab
  const [activeFilter, setActiveFilter] = useState<string>('all'); // 'all' | 'command' | 'payment-order' | 'refund'

  // Calculations
  const calculatedExpenses = expenses.reduce((sums, e) => {
    if (e.status === 'Executed') {
      sums.totalExecuted += e.amount;
    } else {
      sums.totalPending += e.amount;
    }
    
    if (e.type === 'command') sums.commands += e.amount;
    else if (e.type === 'payment-order') sums.orders += e.amount;
    else if (e.type === 'refund') sums.refunds += e.amount;

    return sums;
  }, { totalExecuted: 0, totalPending: 0, commands: 0, orders: 0, refunds: 0 });

  const currentBoxBalance = totalRevenue - calculatedExpenses.totalExecuted;

  const budgetLines = settings.budgetLines || [];

  // Calculate spent per budget category
  const spentByBudgetLine = expenses.reduce((acc, exp) => {
    if (exp.budgetLineId && exp.status === 'Executed') {
      acc[exp.budgetLineId] = (acc[exp.budgetLineId] || 0) + exp.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) {
      alert("Veuillez remplir correctement les champs obligatoires (libellé et montant).");
      return;
    }

    const newExpense: ApeeExpense = {
      id: 'exp_' + Date.now().toString(36),
      type,
      title: title.trim(),
      amount,
      status,
      date,
      description: description.trim(),
      budgetLineId: budgetLineId || undefined,
    };

    onSaveExpense(newExpense);
    setTitle('');
    setAmount(0);
    setDescription('');
    setStatus('Pending');
    setBudgetLineId('');
    setShowAddForm(false);
  };

  const handleUpdateStatus = (exp: ApeeExpense, newStatus: 'Pending' | 'Approved' | 'Executed') => {
    onSaveExpense({
      ...exp,
      status: newStatus,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Voulez-vous vraiment supprimer cette ligne de dépense financière ?")) {
      onDeleteExpense(id);
    }
  };

  // Filter expenses list
  const filteredExpenses = expenses.filter(e => activeFilter === 'all' || e.type === activeFilter)
                                .sort((a,b) => b.date.localeCompare(a.date));

  return (
    <div id="content_apee_financial" className="space-y-6">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-150 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">💸 Gestion Financière & Décaissements</h2>
          <p className="text-xs text-gray-500 font-medium">
            Suivi budgétaire, bons d'achat, ordres d'affectations, remboursements aux parents et états de caisse.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-xs font-bold bg-slate-900 hover:bg-black text-white px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition select-none shadow-2xs shrink-0"
        >
          <Plus className="h-4 w-4" />
          {showAddForm ? 'Fermer le formulaire' : 'Enregistrer une opération'}
        </button>
      </div>

      {/* Financial math visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono select-none">
        
        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-4.5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-350 flex items-center gap-1">
            <Wallet2 className="h-3 w-3 text-indigo-400" /> SOLDE DISPONIBLE EN CAISSE
          </span>
          <p className="text-lg font-bold text-indigo-300">
            {currentBoxBalance.toLocaleString()} FCFA
          </p>
          <p className="text-[10px] text-slate-400 font-medium">Total collectes: {totalRevenue.toLocaleString()} FCFA</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl space-y-1">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <ArrowUpRight className="h-3 w-3 text-red-500" /> TOTAL DÉPENSES ENGAGÉES
          </span>
          <p className="text-lg font-bold text-red-600">
            {calculatedExpenses.totalExecuted.toLocaleString()} FCFA
          </p>
          <p className="text-[10px] text-gray-550 font-medium">Lignes de dépenses décaissées</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl space-y-1">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-indigo-500" /> DÉPENSES EN ATTENTE D'ACCORD
          </span>
          <p className="text-lg font-bold text-amber-600">
            {calculatedExpenses.totalPending.toLocaleString()} FCFA
          </p>
          <p className="text-[10px] text-gray-550 font-medium">Actions en instance de signature</p>
        </div>

      </div>

      {/* Real-time Budget Consumption Rates */}
      {budgetLines.length > 0 && (
        <div className="bg-white border border-slate-150 rounded-2xl p-4 md:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 select-none">
            <h3 className="text-xs font-bold text-slate-850 uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-indigo-500" /> Taux de Consommation des Rubriques Budgétaires
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">Flux de décaissements effectifs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetLines.map((line) => {
              const spent = spentByBudgetLine[line.id] || 0;
              const allocated = line.allocatedAmount;
              const percent = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
              const remaining = Math.max(0, allocated - spent);

              let barColor = 'bg-indigo-600';
              let badgeColor = 'bg-indigo-50 text-indigo-700';
              if (percent >= 100) {
                barColor = 'bg-rose-500 animate-pulse';
                badgeColor = 'bg-rose-50 text-rose-700 border border-rose-200';
              } else if (percent >= 85) {
                barColor = 'bg-amber-500';
                badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200';
              } else if (percent > 0) {
                barColor = 'bg-emerald-500';
                badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
              }

              return (
                <div key={line.id} className="border border-slate-100 rounded-xl p-3 space-y-2 bg-slate-50/20 hover:border-slate-300 transition-all duration-200">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">{line.name}</span>
                    <span className={`text-[9px] font-sans font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0 ${badgeColor}`}>
                      {percent}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(100, percent)}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-semibold text-slate-500 font-mono">
                    <span>Décavé: {spent.toLocaleString()} F</span>
                    <span>Alloué: {allocated.toLocaleString()} F</span>
                  </div>

                  {percent >= 100 ? (
                    <div className="text-[8px] font-bold text-rose-600 uppercase flex items-center gap-1">
                      ⚠️ Rubrique entièrement consommée ({percent}%)
                    </div>
                  ) : (
                    <div className="text-[8px] font-semibold text-gray-400 font-sans">
                      Quota restant : <span className="font-mono text-emerald-600 font-bold">{remaining.toLocaleString()} FCFA</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Operation input form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50/50 border border-slate-150 p-4.5 rounded-2xl space-y-4">
          <div className="border-b pb-2 flex justify-between items-center text-xs text-slate-800 font-bold select-none">
            <span>AJOUTER UNE NOUVELLE OPÉRATION BUDGETAIRE</span>
            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[9px]">CAISSE APEE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Libellé principal <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="Ex: Achat de craies orthopédiques"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white focus:outline-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Type d'opération <span className="text-red-500">*</span></label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white text-slate-700 focus:outline-indigo-500 cursor-pointer"
              >
                <option value="command">🧾 Bon de commande</option>
                <option value="payment-order">💸 Ordre de paiement</option>
                <option value="refund">↩️ Remboursement parent d'élève</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Montant (FCFA) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="1"
                required
                placeholder="Montant total effectif"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white font-mono focus:outline-indigo-500"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Date de validation des pièces</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white focus:outline-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-550 uppercase">Rubrique Budgétaire Associée</label>
              <select
                value={budgetLineId}
                onChange={(e) => setBudgetLineId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white text-slate-700 focus:outline-indigo-505 cursor-pointer"
              >
                <option value="">-- Non spécifiée / Fonctionnement --</option>
                {budgetLines.map(line => (
                  <option key={line.id} value={line.id}>📁 {line.name} ({line.allocatedAmount.toLocaleString()} FCFA)</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">État de validation</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white text-slate-700 focus:outline-indigo-500 cursor-pointer"
              >
                <option value="Pending">En attente / Brouillon</option>
                <option value="Approved">Accompagnement autorisé (Signé COGE / Chef d'étab)</option>
                <option value="Executed">Décaissement exécuté (Trésorier)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Détail des pièces jointes ou Réfs</label>
              <input
                type="text"
                placeholder="Ex: Facture proforma N°0382, reçu de caisse..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border rounded-lg bg-white focus:outline-indigo-500"
              />
            </div>

          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase tracking-wide cursor-pointer transition shadow-xs"
          >
            Confirmer et Enregistrer l'opération budgétaire
          </button>
        </form>
      )}

      {/* Categories filters */}
      <div className="flex bg-slate-50 border p-0.5 rounded-lg text-xs font-semibold max-w-lg select-none">
        {[
          { key: 'all', label: 'Toutes les lignes' },
          { key: 'command', label: 'Bons de Commande' },
          { key: 'payment-order', label: 'Ordres de Paiement' },
          { key: 'refund', label: 'Remboursements' },
        ].map(opt => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setActiveFilter(opt.key)}
            className={`flex-1 py-1 px-3 text-center rounded-md cursor-pointer transition ${
              activeFilter === opt.key ? 'bg-slate-900 text-white' : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tabular logs of expenses */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b text-gray-505 font-bold uppercase text-[9px] select-none">
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Libellé</th>
              <th className="py-2.5 px-3 text-right">Montant</th>
              <th className="py-2.5 px-3">État</th>
              <th className="py-2.5 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">
                  Aucune pièce comptable n'est référencée pour cette catégorie.
                </td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 font-mono text-gray-450">{exp.date}</td>
                  <td className="py-2 px-3">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${
                      exp.type === 'command' ? 'bg-indigo-50 text-indigo-800' : (exp.type === 'payment-order' ? 'bg-sky-50 text-sky-800' : 'bg-pink-50 text-pink-800')
                    }`}>
                      {exp.type === 'command' ? 'B. Commande' : (exp.type === 'payment-order' ? 'O. Paiement' : 'Rembours.')}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <p className="font-bold text-slate-800">{exp.title}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {exp.description && <span className="text-[10px] text-gray-400 font-serif mr-1">{exp.description}</span>}
                      {exp.budgetLineId && (
                        <span className="text-[8px] font-sans font-extrabold bg-slate-100 text-slate-600 px-1 py-0.5 rounded tracking-wide uppercase select-none">
                          📁 {budgetLines.find(l => l.id === exp.budgetLineId)?.name || 'Rubrique générale'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {exp.amount.toLocaleString()} FCFA
                  </td>
                  <td className="py-2 px-3">
                    <span className={`text-[9px] font-sans font-extrabold px-1.5 py-0.5 rounded uppercase flex items-center gap-1 w-fit select-none ${
                      exp.status === 'Executed' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : (exp.status === 'Approved' ? 'bg-sky-100 text-sky-800 border border-sky-200' : 'bg-amber-100 text-amber-800 border border-amber-200')
                    }`}>
                      {exp.status === 'Executed' ? 'Payé / Décavé' : (exp.status === 'Approved' ? 'Autorisé' : 'En examen')}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-2 select-none">
                      {exp.status !== 'Executed' && (
                        <button
                          onClick={() => handleUpdateStatus(exp, 'Executed')}
                          className="p-1 bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 rounded cursor-pointer"
                          title="Exécuter (Payer)"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
