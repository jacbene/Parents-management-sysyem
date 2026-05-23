import React, { useState } from 'react';
import { Invoice } from '../types';
import { CreditCard, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, X, Landmark, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface BillingPortalProps {
  invoices: Invoice[];
  onUpdateInvoice: (updated: Invoice) => void;
}

export default function BillingPortal({ invoices, onUpdateInvoice }: BillingPortalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
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
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setCardholderName('');
    setSuccess(false);
  };

  const handleSimulatedPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    setProcessing(true);

    // Simulate payment processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const parentIdPart = payingInvoice.parentId;
      const invRef = doc(db, 'invoices', payingInvoice.id);
      const paidDate = new Date().toISOString().split('T')[0];

      await updateDoc(invRef, {
        status: 'Paid',
        paymentDate: paidDate
      });

      // Update local state in App shell
      onUpdateInvoice({
        ...payingInvoice,
        status: 'Paid',
        paymentDate: paidDate
      });

      setSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPayingInvoice(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `invoices/${payingInvoice.id}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4 border-gray-100 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight flex items-center gap-2">
            <Landmark className="h-5 w-5 text-indigo-600" />
            Régie Financière & Facturation
          </h2>
          <p className="text-sm text-gray-500">
            Paiement sécurisé en ligne des frais de scolarité, de cantine et d'activités périscolaires.
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
            Tous ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('unpaid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'unpaid'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            À Payer ({invoices.filter(i => i.status !== 'Paid').length})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'paid'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Payés ({invoices.filter(i => i.status === 'Paid').length})
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
                  <div className="text-xl font-black text-gray-900 font-mono">{inv.amount.toFixed(2)} €</div>
                  <span className="text-[10px] text-gray-400">Total Taxe Incluse</span>
                </div>
                {inv.status !== 'Paid' && (
                  <button
                    onClick={() => startPayment(inv)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer hover:bg-indigo-700 transition"
                  >
                    <CreditCard className="h-3.5 w-3.5" /> Payer
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
              className="bg-white rounded-3xl w-full max-w-md border border-gray-100 shadow-2xl overflow-hidden"
            >
              <div className="p-5 bg-slate-900 text-white relative">
                <button
                  onClick={() => setPayingInvoice(null)}
                  className="absolute right-4 top-4 text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="space-y-1">
                  <span className="text-xs text-indigo-300 font-semibold uppercase tracking-widest">Paiement Sécurisé LCB</span>
                  <h3 className="text-lg font-black">{payingInvoice.title}</h3>
                  <div className="font-mono text-xl text-yellow-300 font-bold">{payingInvoice.amount.toFixed(2)} €</div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {success ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-center p-8 space-y-2"
                  >
                    <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto animate-bounce" />
                    <h4 className="text-base font-bold text-gray-900">Règlement Validé !</h4>
                    <p className="text-xs text-gray-500">Un reçu fiscal vous a été envoyé par messagerie électronique.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSimulatedPayment} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 block">Titulaire de la carte</label>
                      <input
                        type="text"
                        required
                        placeholder="M. ou Mme Martin"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 block">Numéro de carte bancaire</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          maxLength={19}
                          placeholder="4970 8593 1039 4820"
                          value={cardNumber}
                          onChange={(e) => {
                            // Format card with spaces
                            const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                            const matches = v.match(/\d{4,16}/g);
                            const match = (matches && matches[0]) || '';
                            const parts = [];
                            for (let i = 0, len = match.length; i < len; i += 4) {
                              parts.push(match.substring(i, i + 4));
                            }
                            if (parts.length > 0) {
                              setCardNumber(parts.join(' '));
                            } else {
                              setCardNumber(v);
                            }
                          }}
                          className="w-full pl-10 pr-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 font-mono"
                        />
                        <CreditCard className="h-4 w-4 text-gray-400 absolute left-3.5 top-3" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 block">Date d'expiration</label>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          placeholder="MM/AA"
                          value={expiry}
                          onChange={(e) => {
                            let v = e.target.value.replace(/[^0-9]/gi, '');
                            if (v.length > 2) {
                              v = `${v.slice(0, 2)}/${v.slice(2, 4)}`;
                            }
                            setExpiry(v);
                          }}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 block">CVV / CVC</label>
                        <input
                          type="password"
                          required
                          maxLength={3}
                          placeholder="853"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/gi, ''))}
                          className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {processing ? (
                          <>
                            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Traitement bancaire de l'opération...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            Confirmer le Règlement de {payingInvoice.amount.toFixed(2)} €
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-center font-mono text-[10px] text-gray-400 flex items-center justify-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-500" /> Standard Chiffrement Fort SSL 256 bits garanti
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
