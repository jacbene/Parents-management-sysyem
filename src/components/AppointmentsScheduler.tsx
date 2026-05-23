import React, { useState } from 'react';
import { Appointment, Student } from '../types';
import { Calendar, User, Clock, CheckCircle2, AlertTriangle, Video, MapPin, Plus, X, CalendarCheck2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface AppointmentsSchedulerProps {
  appointments: Appointment[];
  students: Student[];
  onAddAppointment: (newApt: Appointment) => void;
}

export default function AppointmentsScheduler({ appointments, students, onAddAppointment }: AppointmentsSchedulerProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [subject, setSubject] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !teacherName || !subject || !dateStr || !timeStr) return;

    setProcessing(true);
    const id = `apt_${Date.now().toString().slice(-6)}`;
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    // Combine date and time
    const dateTime = new Date(`${dateStr}T${timeStr}:00`).toISOString();

    const newApt: Appointment = {
      id,
      studentId: selectedStudentId,
      parentId: student.parentId,
      teacherName,
      subject,
      dateTime,
      status: 'Scheduled',
      notes: notes || undefined
    };

    try {
      await setDoc(doc(db, 'appointments', id), newApt);
      onAddAppointment(newApt);
      setShowForm(false);
      // Reset
      setSelectedStudentId('');
      setTeacherName('');
      setSubject('');
      setDateStr('');
      setTimeStr('');
      setNotes('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `appointments/${id}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4 border-gray-100 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5 text-indigo-600" />
            Rencontres Parents-Enseignants (RDV)
          </h2>
          <p className="text-sm text-gray-500">
            Prenez rendez-vous en ligne avec l'équipe pédagogique et suivez votre calendrier de réunions.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" /> Solliciter une Réunion
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center p-12 bg-gray-50/50 rounded-2xl border border-gray-100">
          <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">Aucun rendez-vous planifié.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((apt, idx) => {
            const studentRef = students.find(s => s.id === apt.studentId);
            return (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-5 bg-white border border-gray-150 rounded-2xl flex flex-col justify-between hover:shadow-xs transition duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(apt.status)}`}>
                      {apt.status === 'Completed' ? 'Réalisé' : apt.status === 'Cancelled' ? 'Annulé' : 'Planifié'}
                    </span>
                    <span className="text-xs font-mono text-gray-400">ID: {apt.id}</span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900 text-base">{apt.subject}</h3>
                    <div className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      <span>Professeur : <strong className="text-gray-700">{apt.teacherName}</strong></span>
                    </div>
                     {studentRef && (
                      <div className="text-[11px] text-gray-500 font-semibold flex items-center gap-1.5">
                        {studentRef.avatar.startsWith('data:image') || studentRef.avatar.startsWith('http') || studentRef.avatar.startsWith('/') ? (
                          <img src={studentRef.avatar} alt={studentRef.name} className="w-5 h-5 object-cover rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                        ) : (
                          <span role="img" aria-label="student link">{studentRef.avatar}</span>
                        )}
                        <span>Élève concerné : {studentRef.name}</span>
                      </div>
                    )}
                  </div>

                  {apt.notes && (
                    <p className="text-xs text-slate-500 italic bg-slate-50/50 border border-slate-100 p-2.5 rounded-xl">
                      "{apt.notes}"
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-4 text-xs font-bold text-gray-700">
                  <div className="flex items-center gap-1.5 text-indigo-700">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(apt.dateTime).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(apt.dateTime).toLocaleTimeString('fr-FR', { hour: 'numeric', minute: '2-digit' })}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Booking Consultation Modal Form */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg border border-gray-100 shadow-2xl overflow-hidden"
            >
              <div className="p-5 bg-indigo-600 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black">Planifier un Rendez-vous</h3>
                  <p className="text-xs text-indigo-100">Négociez une période de rencontre avec un enseignant.</p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600">Sélectionner l'élève</label>
                    <select
                      required
                      value={selectedStudentId}
                      onChange={(e) => {
                        const sId = e.target.value;
                        setSelectedStudentId(sId);
                        // Auto-select corresponding teacher
                        const studentObj = students.find(s => s.id === sId);
                        if (studentObj) {
                          setTeacherName(studentObj.teacherName);
                          setSubject(`Consultation de bilan - ${studentObj.name}`);
                        }
                      }}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500 bg-white"
                    >
                      <option value="">-- Choisir un enfant --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600">Nom de l'enseignant</label>
                    <input
                      type="text"
                      required
                      placeholder="M. Jean Picard"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Objet de l'entretien</label>
                  <input
                    type="text"
                    required
                    placeholder="Bilan pédagogique trimestriel"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600">Date souhaitée</label>
                    <input
                      type="date"
                      required
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600">Heure souhaitée</label>
                    <input
                      type="time"
                      required
                      value={timeStr}
                      onChange={(e) => setTimeStr(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Remarques / Questions complémentaires (Facultatif)</label>
                  <textarea
                    rows={3}
                    placeholder="Précisez les points que vous souhaitez aborder durant l'entretien..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {processing ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Envoi de la demande...
                      </>
                    ) : (
                      'Consigner la Demande d\'Entretien'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
