import React, { useState } from 'react';
import { Invoice } from '../types';
import { CreditCard, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, X, Landmark, Receipt, QrCode, Smartphone } from 'lucide-react';
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
  
  // Payment Mode States
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'momo' | 'qr'>('card');
  const [momoProvider, setMomoProvider] = useState<'mtn' | 'orange' | 'wave'>('mtn');
  const [momoPhone, setMomoPhone] = useState('');
  const [qrProvider, setQrProvider] = useState<'mtn' | 'orange' | 'wave'>('mtn');
  
  // Card states
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  
  const [processing, setProcessing] = useState(false);
  const [momoStep, setMomoStep] = useState<string>('');
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
    setMomoPhone('');
    setPaymentMethod('card');
    setQrProvider('mtn');
    setMomoStep('');
    setSuccess(false);
  };

  const handleSimulatedPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;

    setProcessing(true);

    if (paymentMethod === 'momo') {
      const providerLabel = momoProvider === 'mtn' ? 'MTN MoMo' : momoProvider === 'orange' ? 'Orange Money' : 'Wave';
      setMomoStep(`Envoi de la notification Push vers ${momoPhone}...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMomoStep(`Attente de confirmation du code PIN par l'utilisateur sur ${providerLabel}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMomoStep(`Validation de la transaction en cours...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else if (paymentMethod === 'qr') {
      const providerLabel = qrProvider === 'mtn' ? 'MTN MoMo' : qrProvider === 'orange' ? 'Orange Money' : 'Wave';
      setMomoStep(`Scan du code QR détecté par l'appareil mobile du parent...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMomoStep(`Traitement et vérification des détails de facturation de l'envoi (${providerLabel})...`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      setMomoStep(`Règlement de ${payingInvoice.amount.toLocaleString()} FCFA validé par l'opérateur local...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    try {
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
      setMomoStep('');
    }
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
                  <span className="text-xs text-indigo-300 font-semibold uppercase tracking-widest">Paiement Sécurisé LCB</span>
                  <h3 className="text-lg font-black">{payingInvoice.title}</h3>
                  <div className="font-mono text-xl text-yellow-300 font-bold">{payingInvoice.amount.toLocaleString()} FCFA</div>
                </div>
              </div>

              {/* Payment Method Selector Tab */}
              {!success && (
                <div className="grid grid-cols-3 border-b border-gray-100 bg-gray-50 text-[10px] sm:text-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-3 font-bold text-center border-b-2 cursor-pointer transition flex items-center justify-center gap-1 ${
                      paymentMethod === 'card'
                        ? 'border-indigo-600 text-indigo-750 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <CreditCard className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                    <span>Carte Visa/MC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('momo')}
                    className={`py-3 font-bold text-center border-b-2 cursor-pointer transition flex items-center justify-center gap-1 ${
                      paymentMethod === 'momo'
                        ? 'border-indigo-600 text-indigo-750 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <Smartphone className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                    <span>Orange / MTN MoMo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qr')}
                    className={`py-3 font-bold text-center border-b-2 cursor-pointer transition flex items-center justify-center gap-1 ${
                      paymentMethod === 'qr'
                        ? 'border-indigo-600 text-indigo-750 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <QrCode className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
                    <span>Code QR</span>
                  </button>
                </div>
              )}

              <div className="p-6 space-y-5">
                {success ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="text-center p-8 space-y-2"
                  >
                    <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto animate-bounce" />
                    <h4 className="text-base font-bold text-gray-900">Règlement Validé !</h4>
                    <p className="text-xs text-gray-500">Un reçu fiscal APEE vous a été envoyé par messagerie électronique.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSimulatedPayment} className="space-y-4">
                    {paymentMethod === 'card' && (
                      <div className="space-y-4 animate-fade-in">
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
                              placeholder="4970 8593 1039 4820"
                              value={cardNumber}
                              onChange={(e) => {
                                const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                                setCardNumber(v.substring(0, 16).replace(/(.{4})/g, '$1 ').trim());
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
                      </div>
                    )}

                    {paymentMethod === 'momo' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-600 block">Sélectionnez votre opérateur</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setMomoProvider('mtn')}
                              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                                momoProvider === 'mtn'
                                  ? 'bg-amber-50 border-amber-500 text-amber-850'
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center font-black text-[10px] text-gray-900 border border-yellow-500">M</div>
                              <span className="text-[10px] font-black uppercase">MTN MoMo</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMomoProvider('orange')}
                              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                                momoProvider === 'orange'
                                  ? 'bg-orange-50 border-orange-500 text-orange-850'
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center font-black text-[10px] text-white border border-orange-600">O</div>
                              <span className="text-[10px] font-black uppercase">Orange</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMomoProvider('wave')}
                              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                                momoProvider === 'wave'
                                  ? 'bg-sky-50 border-sky-500 text-sky-850'
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="w-5 h-5 rounded-full bg-sky-400 flex items-center justify-center font-black text-[10px] text-white border border-sky-500">W</div>
                              <span className="text-[10px] font-black uppercase">Wave</span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-600 block">Numéro de téléphone payeur</label>
                          <input
                            type="tel"
                            required
                            placeholder="Ex: +237 677 88 99 00"
                            value={momoPhone}
                            onChange={(e) => setMomoPhone(e.target.value)}
                            className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 font-mono"
                          />
                          <p className="text-[9.5px] text-gray-400">
                            Une notification de validation de transaction de {payingInvoice.amount.toLocaleString()} FCFA sera immédiatement envoyée sur ce numéro de mobile.
                          </p>
                        </div>

                        {processing && momoStep && (
                          <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl space-y-1.5 animate-pulse">
                            <span className="text-[9.5px] uppercase font-black tracking-widest text-indigo-700 block">🔗 Transaction Mobile Money en Cours</span>
                            <div className="text-xs text-indigo-900 font-semibold flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-indigo-650 animate-ping shrink-0" />
                              {momoStep}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {paymentMethod === 'qr' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-600 block">Sélectionnez l'opérateur Mobile Money</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => setQrProvider('mtn')}
                              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                                qrProvider === 'mtn'
                                  ? 'bg-amber-50 border-amber-500 text-amber-850'
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center font-black text-[10px] text-gray-900 border border-yellow-500">M</div>
                              <span className="text-[10px] font-black uppercase">MTN MoMo</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setQrProvider('orange')}
                              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                                qrProvider === 'orange'
                                  ? 'bg-orange-50 border-orange-500 text-orange-850'
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center font-black text-[10px] text-white border border-orange-600">O</div>
                              <span className="text-[10px] font-black uppercase">Orange</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setQrProvider('wave')}
                              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                                qrProvider === 'wave'
                                  ? 'bg-sky-50 border-sky-500 text-sky-850'
                                  : 'bg-white border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <div className="w-5 h-5 rounded-full bg-sky-400 flex items-center justify-center font-black text-[10px] text-white border border-sky-500">W</div>
                              <span className="text-[10px] font-black uppercase">Wave</span>
                            </button>
                          </div>
                        </div>

                        {/* Interactive dynamic QR Code panel with animated line */}
                        <div className="flex flex-col items-center justify-center p-5 bg-slate-50 border border-slate-200/60 rounded-3xl relative shadow-xs overflow-hidden">
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-[9px] font-black text-emerald-600 font-mono tracking-wider">SECURE LINK</span>
                          </div>

                          <div className="relative p-3 bg-white rounded-2xl border border-slate-200/80 shadow-md">
                            {/* Scanning laser beam simulation */}
                            <div className="absolute left-3 right-3 h-0.5 bg-emerald-500/80 opacity-75 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-bounce" style={{ top: 'calc(50% - 1px)' }} />

                            <img
                              referrerPolicy="no-referrer"
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                                `${qrProvider === 'mtn' ? 'mtn_momo' : qrProvider === 'orange' ? 'orange_money' : 'wave'}://payment?invoiceId=${payingInvoice.id}&amount=${payingInvoice.amount}&school=CES_Ekali_1&recipient=CES_Ekali_1_APEE_Treasury`
                              )}&color=0f172a&bgcolor=ffffff&qzone=1`}
                              alt={`QR code ${qrProvider}`}
                              className="w-[140px] h-[140px] object-contain relative z-10"
                            />
                          </div>

                          <div className="text-center mt-3 max-w-[280px]">
                            <p className="text-xs font-extrabold text-slate-800 leading-tight">
                              Scannez pour payer <span className="font-mono text-indigo-600 text-sm block mt-1">{payingInvoice.amount.toLocaleString()} FCFA</span>
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1.5 leading-normal">
                              Ouvrez votre application <span className="font-bold text-slate-700">{qrProvider === 'mtn' ? 'MTN MoMo' : qrProvider === 'orange' ? 'Orange Money' : 'Wave'}</span>, choisissez "Scanner Code QR", cadrez ce code puis saisissez votre code PIN pour finaliser l'opération.
                            </p>
                          </div>
                        </div>

                        {processing && momoStep && (
                          <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-xl space-y-1.5 animate-pulse">
                            <span className="text-[9.5px] uppercase font-black tracking-widest text-indigo-700 block text-center">🔳 Détection du Scanner en Cours</span>
                            <div className="text-xs text-indigo-900 font-semibold flex items-center justify-center gap-1.5 text-center">
                              <span className="h-2 w-2 rounded-full bg-indigo-650 animate-ping shrink-0" />
                              {momoStep}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-850 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {processing ? (
                          <>
                            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Traitement en cours...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            {paymentMethod === 'qr' ? "Simuler le scan & règlement" : `Confirmer le Règlement de ${payingInvoice.amount.toLocaleString()} FCFA`}
                          </>
                        )}
                      </button>
                    </div>

                    <div className="text-center font-mono text-[9.5px] text-gray-400 flex items-center justify-center gap-1 select-none">
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
