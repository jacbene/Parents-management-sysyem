import React, { useState } from 'react';
import { Invoice, Student } from '../types';
import { CreditCard, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, X, Landmark, Receipt, QrCode, Smartphone } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import PaymentMethodSelector from './PaymentMethodSelector';

interface BillingPortalProps {
  invoices: Invoice[];
  onUpdateInvoice: (updated: Invoice) => void;
  parentPhone?: string;
  students?: Student[];
  portalUserRole?: 'manager' | 'parent' | null;
  filteredStudents?: Student[];
}

export default function BillingPortal({ 
  invoices, 
  onUpdateInvoice, 
  parentPhone, 
  students,
  portalUserRole,
  filteredStudents
}: BillingPortalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

  // Helper to format currency and fetch student name
  const student = payingInvoice ? students?.find(s => s.id === payingInvoice.studentId) : null;
  const studentName = student ? student.name : "Élève de l'établissement";
  const studentInfo = student ? `${student.grade} - ${student.classRoom}` : "";

  const formatAmountTtc = (amount: number) => {
    if (amount < 2000) {
      const fcfaVal = Math.round(amount * 655.957);
      return {
        euro: `${amount.toFixed(2)} €`,
        fcfa: `${fcfaVal.toLocaleString('fr-FR')} FCFA`,
      };
    } else {
      const euroVal = amount / 655.957;
      return {
        euro: `${euroVal.toFixed(2)} €`,
        fcfa: `${amount.toLocaleString('fr-FR')} FCFA`,
      };
    }
  };

  const formatted = payingInvoice ? formatAmountTtc(payingInvoice.amount) : { euro: '0.00 €', fcfa: '0 FCFA' };

  // Filter out non-student (administrative/settings/cotisation parent) documents
  const studentInvoices = invoices.filter(inv => {
    if (
      inv.studentId === 'apee_ces_ekali_1' ||
      inv.studentId === 'apee_expense' ||
      inv.studentId === 'apee_settings' ||
      inv.id.endsWith('_settings')
    ) {
      return false;
    }
    // If the active role is parent and filteredStudents list is available, restrict to matching active pupils
    if (portalUserRole === 'parent' && filteredStudents) {
      return filteredStudents.some(s => s.id === inv.studentId);
    }
    return true;
  });

  // Filter invoices for tabs
  const filteredInvoices = studentInvoices.filter(inv => {
    if (activeTab === 'unpaid') return inv.status === 'Unpaid' || inv.status === 'Overdue';
    if (activeTab === 'paid') return inv.status === 'Paid';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const startPayment = (invoice: Invoice) => {
    setPayingInvoice(invoice);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Alert Banner showing supported payment providers */}
      <div className="bg-gradient-to-r from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-4.5 text-xs text-indigo-950 flex flex-col sm:flex-row gap-3 items-start sm:items-center shadow-2xs">
        <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-700 shrink-0">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <p className="font-extrabold text-indigo-900">💳 Modes de règlement acceptés par l'APEE</p>
          <p className="text-gray-600 leading-relaxed font-sans">
            Nous acceptons les paiements sécurisés par <strong>Orange Money</strong>, <strong>MTN Mobile Money (MoMo)</strong>, <strong>Wave</strong>, ou par <strong>Carte Bancaire Visa/Mastercard</strong>. Toutes les cotisations sont perçues directement en <strong>Francs CFA (FCFA)</strong>.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b pb-4 border-gray-100 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight flex items-center gap-2">
            <Landmark className="h-5 w-5 text-indigo-600" />
            Régie Financière & Facturation
          </h2>
          <p className="text-sm text-gray-500">
            Paiement sécurisé en ligne des frais de scolarité, de cantine, d'APEE et d'activités périscolaires.
          </p>
        </div>

        {/* Status filtering tabs */}
        <div className="flex bg-gray-100 p-0.5 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'all'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Tous ({studentInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('unpaid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'unpaid'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            À Payer ({studentInvoices.filter(i => i.status !== 'Paid').length})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'paid'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Payés ({studentInvoices.filter(i => i.status === 'Paid').length})
          </button>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="text-center p-12 bg-gray-50/50 rounded-2xl border border-gray-100">
          <Receipt className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">Aucun avis de facturation trouvé dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className="p-5 bg-white border border-gray-150 rounded-2xl flex items-center justify-between gap-4 flex-wrap hover:shadow-sm hover:border-gray-250 transition-all duration-200"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(inv.status)}`}>
                    {inv.status === 'Paid' ? 'Reglé' : inv.status === 'Overdue' ? 'Relance exigée' : 'À régler'}
                  </span>
                  <span className="text-xs font-mono text-gray-400">Réf: {inv.id.toUpperCase()}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{inv.title}</h3>
                <div className="text-xs text-gray-500 font-medium">
                  {inv.status === 'Paid' ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Payé le {new Date(inv.paymentDate!).toLocaleDateString('fr-FR')}
                    </span>
                  ) : (
                    <span className="text-gray-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Échéance règlementaire : {new Date(inv.dueDate).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="text-right">
                  <div className="text-base font-black text-indigo-750 font-mono">
                    {formatAmountTtc(inv.amount).fcfa}
                  </div>
                  <span className="text-[10px] text-gray-400 block">
                    soit {formatAmountTtc(inv.amount).euro} (TTC)
                  </span>
                </div>
                {inv.status !== 'Paid' && (
                  <button
                    onClick={() => startPayment(inv)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer hover:bg-indigo-700 transition"
                  >
                    <CreditCard className="h-3.5 w-3.5" /> Payer ma dette
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simulated Billing Gateway Modal */}
      <AnimatePresence>
        {payingInvoice && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md border border-gray-100 shadow-2xl overflow-hidden animate-fade-in"
            >
              <div className="p-5 bg-slate-900 text-white relative">
                <button
                  onClick={() => setPayingInvoice(null)}
                  className="absolute right-4 top-4 text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="space-y-1">
                  <span className="text-[10px] text-indigo-300 font-black uppercase tracking-widest block">🔒 Passerelle de Paiement Sécurisée</span>
                  <h3 className="text-base font-black">Règlement de Facture</h3>
                </div>
              </div>

              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Récapitulatif de paiement avant validation */}
                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/40 pb-2">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-700">
                      🧾 Récapitulatif avant validation
                    </span>
                    <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full select-all">
                      Avis #{payingInvoice.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Nom de l'élève */}
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nom de l'élève</span>
                      <div className="flex items-center gap-2.5 mt-1">
                        <div className="h-6 w-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xxs flex items-center justify-center shrink-0 uppercase">
                          {studentName.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 leading-tight">{studentName}</p>
                          {studentInfo && <p className="text-[9.5px] text-indigo-600 font-semibold">{studentInfo}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Objet de la facture */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Objet de la facture</span>
                      <p className="text-xs font-bold text-slate-800 mt-1 leading-snug">{payingInvoice.title}</p>
                    </div>

                    {/* Montant TTC */}
                    <div className="pt-2 border-t border-slate-150 flex items-center justify-between bg-indigo-50/50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">Montant Total TTC</span>
                        <p className="text-[8px] text-slate-400 font-medium">Équivalence fixe BEAC : 1 € = 655,957 FCFA</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-500 font-mono leading-none">
                          {formatted.euro}
                        </p>
                        <p className="text-xs font-black text-indigo-700 font-mono mt-0.5">
                          {formatted.fcfa}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <PaymentMethodSelector
                  invoice={payingInvoice}
                  parentPhone={parentPhone}
                  onPaymentSuccess={(updated) => {
                    onUpdateInvoice(updated);
                    // Hide modal after display success
                    setTimeout(() => {
                      setPayingInvoice(null);
                    }, 1500);
                  }}
                  onCancel={() => setPayingInvoice(null)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
