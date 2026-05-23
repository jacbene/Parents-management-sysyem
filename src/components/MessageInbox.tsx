import React, { useState, useRef, useEffect } from 'react';
import { Message, Student } from '../types';
import { Send, MessageSquare, User, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface MessageInboxProps {
  messages: Message[];
  students: Student[];
  onAddMessage: (newMsg: Message) => void;
}

export default function MessageInbox({ messages, students, onAddMessage }: MessageInboxProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [textInput, setTextInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter messages by selected student conversation thread
  const threadMessages = messages
    .filter(m => m.studentId === selectedStudentId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const currentStudent = students.find(s => s.id === selectedStudentId);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || !selectedStudentId || !currentStudent) return;

    setSending(true);
    const id = `msg_${Date.now().toString().slice(-6)}`;

    const newMsg: Message = {
      id,
      studentId: selectedStudentId,
      parentId: currentStudent.parentId,
      senderType: 'Parent',
      content: textInput,
      timestamp: new Date().toISOString(),
      teacherName: currentStudent.teacherName
    };

    try {
      await setDoc(doc(db, 'messages', id), newMsg);
      onAddMessage(newMsg);
      setTextInput('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `messages/${id}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4 border-gray-100 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            Messagerie Directe Enseignants
          </h2>
          <p className="text-sm text-gray-500">
            Échangez directement avec les professeurs principaux de vos enfants.
          </p>
        </div>

        {/* Child thread selector */}
        {students.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Liaison avec :</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold bg-white focus:outline-hidden focus:border-indigo-500"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {students.length === 0 ? (
        <div className="text-center p-12 bg-gray-50/50 rounded-2xl border border-gray-100">
          <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">Aucun élève associé pour pouvoir converser.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px] border border-gray-150 rounded-3xl overflow-hidden bg-slate-50">
          {/* Sibling Context bar */}
          <div className="bg-white p-5 border-r border-gray-150 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Enseignant Référent</h3>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold shrink-0">
                    🧑‍🏫
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{currentStudent?.teacherName}</h4>
                    <p className="text-[11px] text-gray-450 font-medium">Professeur principal de {currentStudent?.name}</p>
                  </div>
                </div>
                <div className="text-[11px] text-gray-400 font-mono break-all py-1.5 border-t border-slate-100">
                  Email : {currentStudent?.teacherEmail}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] leading-relaxed flex gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Les enseignants répondent généralement sous 24 à 48 heures ouvrées sur les périodes scolaires.</span>
            </div>
          </div>

          {/* Conversation Thread panel */}
          <div className="lg:col-span-2 flex flex-col justify-between bg-slate-50/50 h-full relative">
            <div className="p-5 overflow-y-auto flex-1 h-full space-y-3.5 max-h-[415px]">
              {threadMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                  <MessageSquare className="h-10 w-10 text-slate-300 stroke-1 mb-2 animate-pulse" />
                  <p className="text-xs">Aucun message échangé pour le moment.</p>
                  <p className="text-[10px] text-gray-400 mt-1">Écrivez un message ci-dessous pour initier la conversation.</p>
                </div>
              ) : (
                <>
                  {threadMessages.map((msg, idx) => {
                    const isParent = msg.senderType === 'Parent';
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`flex ${isParent ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[75%] rounded-2xl p-3.5 text-sm ${
                          isParent
                            ? 'bg-indigo-600 text-white shadow-xs rounded-tr-none'
                            : 'bg-white text-gray-800 border border-gray-150 shadow-2xs rounded-tl-none'
                        }`}>
                          <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 opacity-75 ${isParent ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {isParent ? 'Vous (Parent)' : msg.teacherName || 'Enseignant'}
                          </div>
                          <p className="leading-relaxed">{msg.content}</p>
                          <div className={`text-[9px] font-mono mt-2 text-right opacity-60 ${isParent ? 'text-white' : 'text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={scrollRef} />
                </>
              )}
            </div>

            {/* Input form panel */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-150 flex gap-2 items-center">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={`Écrire à ${currentStudent?.teacherName || 'l\'enseignant'}...`}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={sending || !textInput.trim()}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 cursor-pointer transition shrink-0"
              >
                {sending ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
