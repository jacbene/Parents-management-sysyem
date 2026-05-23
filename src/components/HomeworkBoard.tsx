import { useState } from 'react';
import { Homework } from '../types';
import { BookOpen, CheckCircle, Circle, Clock, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface HomeworkBoardProps {
  homeworks: Homework[];
  onUpdateHomework: (updated: Homework) => void;
}

export default function HomeworkBoard({ homeworks, onUpdateHomework }: HomeworkBoardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filter homeworks
  const filteredHomeworks = homeworks.filter(hw => {
    if (activeTab === 'pending') return hw.status === 'Pending';
    if (activeTab === 'completed') return hw.status === 'Completed';
    return true;
  });

  // Toggle status inside Firestore database
  const handleToggleStatus = async (hw: Homework) => {
    const newStatus = hw.status === 'Completed' ? 'Pending' : 'Completed';
    setUpdatingId(hw.id);
    try {
      const hwRef = doc(db, 'homeworks', hw.id);
      await updateDoc(hwRef, {
        status: newStatus
      });
      // Update local state in App wrapper
      onUpdateHomework({
        ...hw,
        status: newStatus
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `homeworks/${hw.id}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4 border-gray-100 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            Cahier de Textes & Devoirs
          </h2>
          <p className="text-sm text-gray-500">
            Suivi des devoirs maison à faire, dates de rendu et validation en ligne par les parents.
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
            Tous ({homeworks.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            À Faire ({homeworks.filter(h => h.status === 'Pending').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeTab === 'completed'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Terminés ({homeworks.filter(h => h.status === 'Completed').length})
          </button>
        </div>
      </div>

      {filteredHomeworks.length === 0 ? (
        <div className="text-center p-12 bg-gray-50/50 rounded-2xl border border-gray-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">Parfait ! Aucun devoir en attente pour cette sélection.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredHomeworks.map((hw, idx) => {
              const isExpired = new Date(hw.dueDate).getTime() < Date.now() && hw.status === 'Pending';
              return (
                <motion.div
                  key={hw.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 bg-white border rounded-xl flex items-start gap-4 transition-all duration-300 ${
                    hw.status === 'Completed'
                      ? 'border-gray-100 opacity-80'
                      : isExpired
                      ? 'border-red-200 bg-red-50/10'
                      : 'border-gray-150 hover:border-gray-200'
                  }`}
                >
                  {/* Status checkbox toggle */}
                  <button
                    onClick={() => handleToggleStatus(hw)}
                    disabled={updatingId === hw.id}
                    className="mt-1 flex items-center justify-center shrink-0 cursor-pointer text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    {updatingId === hw.id ? (
                      <span className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    ) : hw.status === 'Completed' ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600 fill-emerald-50" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300 hover:text-indigo-600" />
                    )}
                  </button>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                        {hw.subject}
                      </span>
                      {hw.grade && (
                        <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded-md">
                          Note / Éval : {hw.grade}
                        </span>
                      )}
                      {isExpired && (
                        <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> En retard !
                        </span>
                      )}
                    </div>

                    <h3 className={`font-semibold text-sm ${hw.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {hw.title}
                    </h3>

                    {hw.description && (
                      <p className={`text-xs leading-relaxed ${hw.status === 'Completed' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {hw.description}
                      </p>
                    )}

                    <div className="pt-2 flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Rendu exigé le {new Date(hw.dueDate).toLocaleDateString('fr-FR', { weekday: 'short', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
