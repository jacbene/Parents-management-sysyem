import React, { useState } from 'react';
import { Download, FileSpreadsheet, Printer, Calendar, RefreshCw, BarChart2, DollarSign, Percent, TrendingUp, CheckCircle } from 'lucide-react';
import { ApeeParent, ApeeSettings } from '../../types';

interface ApeeReportingProps {
  parents: ApeeParent[];
  settings: ApeeSettings;
}

export default function ApeeReporting({ parents, settings }: ApeeReportingProps) {
  const [filterPeriod, setFilterPeriod] = useState<string>('all'); // 'all' | 'today' | 'month' | 'custom'
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Visual action alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter payments list based on active dates
  const getFilteredPayments = () => {
    const list: { parentName: string; parentPhone: string; amount: number; date: string; method?: string; note?: string }[] = [];
    
    parents.forEach(p => {
      p.payments.forEach(pay => {
        // Evaluate dates
        const dateStr = pay.date; // "YYYY-MM-DD"
        let include = true;
        
        if (filterPeriod === 'today') {
          const todayStr = new Date().toISOString().slice(0, 10);
          include = (dateStr === todayStr);
        } else if (filterPeriod === 'month') {
          const activeMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
          include = dateStr.startsWith(activeMonth);
        } else if (filterPeriod === 'custom') {
          if (startDate && dateStr < startDate) include = false;
          if (endDate && dateStr > endDate) include = false;
        }
        
        if (include) {
          list.push({
            parentName: p.name,
            parentPhone: p.phone,
            amount: pay.amount,
            date: pay.date,
            method: pay.method,
            note: pay.note,
          });
        }
      });
    });

    // Sort by date desc
    return list.sort((a, b) => b.date.localeCompare(a.date));
  };

  const filteredPayments = getFilteredPayments();
  const totalCollectedInPeriod = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  // Global calculations
  const totalExpectedAmount = parents.reduce((sum, p) => sum + p.totalDue, 0);
  const totalCollectedAmountAlready = parents.reduce((sum, p) => sum + p.totalPaid, 0);
  const totalDebtAmount = Math.max(0, totalExpectedAmount - totalCollectedAmountAlready);
  const rateCollectedPercent = totalExpectedAmount > 0 ? (totalCollectedAmountAlready / totalExpectedAmount) * 100 : 0;

  // Class by class statistics calculation
  const classStatsMap: { [cls: string]: { pupilsCount: number; expected: number; collected: number } } = {};
  
  // Seed basic classes
  const ALL_CLASSES = ['6ème', '5ème', '4ème ALL', '4ème ESP', '3ème ALL', '3ème ESP', '2nde', '1ère', 'Tle'];
  ALL_CLASSES.forEach(c => {
    classStatsMap[c] = { pupilsCount: 0, expected: 0, collected: 0 };
  });

  parents.forEach(p => {
    p.students.forEach(s => {
      const cls = s.classRoom || 'Inconnue';
      if (!classStatsMap[cls]) {
        classStatsMap[cls] = { pupilsCount: 0, expected: 0, collected: 0 };
      }
      classStatsMap[cls].pupilsCount += 1;
      classStatsMap[cls].expected += settings.cotisationAmount;
      // Distribute parent payments proportionally
      const proportionalPaid = p.students.length > 0 ? p.totalPaid / p.students.length : 0;
      classStatsMap[cls].collected += proportionalPaid;
    });
  });

  // Export JSON function
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredPayments, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bilan_APEE_periodique_${filterPeriod}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSuccessMsg('Fichier JSON du bilan exporté avec succès !');
    setTimeout(() => setSuccessMsg(null), 3050);
  };

  // Copy values as tab-separated values ready for Excel/Spreadsheets
  const handleCopyTsv = () => {
    let tsv = 'Date\tNom Parent\tTéléphone\tMoyen de paiement\tMontant Versé (FCFA)\tObservations\n';
    filteredPayments.forEach(p => {
      tsv += `${p.date}\t${p.parentName}\t${p.parentPhone}\t${p.method || 'Espèces'}\t${p.amount}\t${p.note || ''}\n`;
    });

    navigator.clipboard.writeText(tsv).then(() => {
      setSuccessMsg('Tableau copié ! Vous pouvez maintenant le coller directement dans Excel ou Google Sheets.');
      setTimeout(() => setSuccessMsg(null), 3500);
    }).catch(err => {
      alert("Échec de la copie automatique: " + err);
    });
  };

  const handlePrintBilan = () => {
    window.print();
  };

  return (
    <div id="content_apee_report" className="space-y-6">

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-150 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">📈 Générateur de Bilans Financiers</h2>
          <p className="text-xs text-gray-500 font-medium">
            Générer des états récapitulatifs périodiques des cotisations récupérées. Filtres dynamiques de trésorerie.
          </p>
        </div>
        
        <div className="flex items-center gap-2 select-none shrink-0">
          <button
            onClick={handleCopyTsv}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-800 rounded-xl hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5 cursor-pointer transition"
            title="Copier le tableau pour coller dans Excel"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Vers Excel (Copier)
          </button>
          
          <button
            onClick={handleExportJson}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-800 rounded-xl hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5 cursor-pointer transition"
            title="Télécharger fichier JSON"
          >
            <Download className="h-3.5 w-3.5 text-indigo-600" /> Export JSON
          </button>

          <button
            onClick={handlePrintBilan}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-black text-white rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
            title="Lancer l'impression"
          >
            <Printer className="h-3.5 w-3.5 text-amber-400" /> Imprimer Bilan
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs px-4 py-3 rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Numerical summaries */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 select-none">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1 text-center">
          <span className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wide">Total Recettes Brut</span>
          <p className="text-sm font-bold text-emerald-600 font-mono">{totalCollectedAmountAlready.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1 text-center">
          <span className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wide">Reste Dû Établissement</span>
          <p className="text-sm font-bold text-amber-600 font-mono">{totalDebtAmount.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1 text-center">
          <span className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wide">Taux Moyen d'Apport</span>
          <p className="text-sm font-bold text-sky-600 font-mono">{rateCollectedPercent.toFixed(1)}%</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-1 text-center">
          <span className="text-[10px] text-indigo-700 uppercase font-extrabold tracking-wide">Période Active Filtrée</span>
          <p className="text-sm font-bold text-indigo-900 font-mono">{totalCollectedInPeriod.toLocaleString()} FCFA</p>
        </div>
      </div>

      {/* Filters Form */}
      <div className="bg-slate-50/45 border rounded-2xl p-4 flex flex-wrap items-end gap-4">
        
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Période fiscale
          </label>
          <div className="flex bg-white border rounded-lg p-0.5 font-semibold text-xs">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'today', label: "Aujourd'hui" },
              { id: 'month', label: 'Ce mois' },
              { id: 'custom', label: 'Personnalisé' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setFilterPeriod(p.id)}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition ${
                  filterPeriod === p.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {filterPeriod === 'custom' && (
          <div className="flex items-center gap-2">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Du :</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 text-xs border rounded bg-white text-slate-700 focus:outline-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Au :</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 text-xs border rounded bg-white text-slate-700 focus:outline-indigo-500"
              />
            </div>
          </div>
        )}

      </div>

      {/* Main reporting logs list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Tabular payment log */}
        <div className="lg:col-span-7 bg-white border border-slate-150 rounded-2xl p-4 space-y-3.5">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-500" /> Journal Général de Recettes
            </h3>
            <span className="text-[10px] font-mono text-gray-400">Total : {filteredPayments.length} transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-gray-505 font-bold uppercase text-[9px] tracking-wider select-none">
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Parent d'Élève</th>
                  <th className="py-2 px-2">Moyen</th>
                  <th className="py-2 px-2 text-right">Montant</th>
                  <th className="py-2 px-2">Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-400 text-[11px] font-medium leading-relaxed">
                      Aucune transaction financière n'a été enregistrée durant cette période.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-2 font-mono text-gray-450">{p.date}</td>
                      <td className="py-2 px-2 font-semibold text-slate-800">{p.parentName}</td>
                      <td className="py-2 px-2">
                        <span className="text-[9px] font-sans font-extrabold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {p.method || 'Espèces'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-emerald-600">{p.amount.toLocaleString()} FCFA</td>
                      <td className="py-2 px-2 text-gray-500 text-[10px] truncate max-w-[150px]">{p.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Class level breakdown list */}
        <div className="lg:col-span-5 bg-white border border-slate-150 rounded-2xl p-4 space-y-3.5">
          <div className="border-b pb-2 font-bold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
            <BarChart2 className="h-4 w-4 text-indigo-500" /> Performances par division de classe
          </div>

          <div className="space-y-2.5">
            {Object.keys(classStatsMap).map(cls => {
              const item = classStatsMap[cls];
              if (item.pupilsCount === 0) return null; // Only show classes with students
              const percent = item.expected > 0 ? (item.collected / item.expected) * 100 : 0;
              
              return (
                <div key={cls} className="space-y-1 text-xs">
                  <div className="flex justify-between items-baseline font-medium text-slate-700">
                    <span>
                      <strong className="font-bold text-slate-900">{cls}</strong> ({item.pupilsCount} élève{item.pupilsCount > 1 ? 's' : ''})
                    </span>
                    <span className="font-mono text-[10px] font-bold text-indigo-700">
                      {percent.toFixed(0)}% ({Math.round(item.collected).toLocaleString()} FCFA / {item.expected.toLocaleString()} FCFA)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        percent >= 100 ? 'bg-emerald-500' : (percent >= 50 ? 'bg-indigo-500' : 'bg-red-500')
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {parents.length === 0 && (
              <p className="text-center text-gray-400 text-[11px] py-4">Aucune donnée disponible pour le comparatif par classe.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
