import React, { useState } from 'react';
import { Grade, Student } from '../types';
import { Award, BookOpen, TrendingUp, Sparkles, Filter, Plus, Trash2, Lock, Unlock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface GradesDashboardProps {
  grades: Grade[];
  onAddGrade?: (grade: Grade) => Promise<boolean>;
  onDeleteGrade?: (id: string) => Promise<boolean>;
  isPedAuthorized?: boolean;
  onPromptUnlockPed?: () => void;
  pedManagerName?: string;
  hasPedPassword?: boolean;
  activeStudent?: Student | null;
}

export default function GradesDashboard({
  grades,
  onAddGrade,
  onDeleteGrade,
  isPedAuthorized = false,
  onPromptUnlockPed,
  pedManagerName = '',
  hasPedPassword = false,
  activeStudent,
}: GradesDashboardProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  
  // Add Grade states
  const [showAddForm, setShowAddForm] = useState(false);
  const [subject, setSubject] = useState('Mathématiques');
  const [examName, setExamName] = useState('');
  const [score, setScore] = useState<number>(10);
  const [maxScore, setMaxScore] = useState<number>(20);
  const [remarks, setRemarks] = useState('');
  const [gradeDate, setGradeDate] = useState('');

  // Compute unique subjects
  const subjects = ['all', ...Array.from(new Set(grades.map(g => g.subject)))];

  // Filter grades
  const filteredGrades = selectedSubject === 'all'
    ? grades
    : grades.filter(g => g.subject === selectedSubject);

  // Sort grades chronologically for charts
  const sortedGradesForChart = [...filteredGrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate Average Student mark
  const totalScoreVal = filteredGrades.reduce((acc, g) => acc + (g.score / g.maxScore) * 20, 0);
  const averageMark = filteredGrades.length > 0
    ? (totalScoreVal / filteredGrades.length).toFixed(1)
    : '0';

  const chartData = sortedGradesForChart.map(g => ({
    date: new Date(g.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    score: Number(((g.score / g.maxScore) * 20).toFixed(1)),
    maxScore: 20,
    subject: g.subject,
    examName: g.examName
  }));

  // Average color mapping
  const getAverageBadgeColor = (avg: number) => {
    if (avg >= 16) return 'bg-emerald-50 border-emerald-200 text-emerald-800';
    if (avg >= 13) return 'bg-indigo-50 border-indigo-200 text-indigo-800';
    if (avg >= 10) return 'bg-amber-50 border-amber-200 text-amber-800';
    return 'bg-red-50 border-red-200 text-red-800';
  };

  const handleOpenForm = () => {
    if (hasPedPassword && !isPedAuthorized && onPromptUnlockPed) {
      onPromptUnlockPed();
      return;
    }
    setGradeDate(new Date().toISOString().split('T')[0]);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent) {
      alert('Veuillez sélectionner un élève avant de pouvoir introduire des notes.');
      return;
    }
    if (!examName.trim()) {
      alert("Veuillez spécifier l'intitulé de l'évaluation.");
      return;
    }
    if (score < 0 || maxScore <= 0 || score > maxScore) {
      alert("La note saisie doit être entre 0 et la note maximale configured.");
      return;
    }

    if (onAddGrade) {
      const newGrade: Grade = {
        id: 'gr_' + Date.now(),
        studentId: activeStudent.id,
        parentId: activeStudent.parentId,
        subject,
        examName: examName.trim(),
        score: Number(score),
        maxScore: Number(maxScore),
        teacherRemarks: remarks.trim() || 'Bon travail.',
        date: gradeDate
      };

      const success = await onAddGrade(newGrade);
      if (success) {
        setExamName('');
        setRemarks('');
        setShowAddForm(false);
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (hasPedPassword && !isPedAuthorized && onPromptUnlockPed) {
      onPromptUnlockPed();
      return;
    }
    const confirm = window.confirm(`Voulez-vous supprimer l'évaluation "${name}" ?`);
    if (confirm && onDeleteGrade) {
      await onDeleteGrade(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-150 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" />
            Bulletins de Notes & Évaluations
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Suivi académique détaillé, moyennes pondérées et appréciations par matière.
          </p>
        </div>

        <button
          onClick={handleOpenForm}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="h-4 w-4" /> Introduire Note
        </button>
      </div>

      {/* Security Status Header */}
      {hasPedPassword && (
        <div className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isPedAuthorized ? 'bg-emerald-50 text-emerald-950 border-emerald-150' : 'bg-slate-50 text-slate-800 border-slate-150'
        }`}>
          <div className="flex items-center gap-2">
            {isPedAuthorized ? (
              <Unlock className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
            ) : (
              <Lock className="h-4.5 w-4.5 text-slate-500 shrink-0" />
            )}
            <div>
              <span className="font-extrabold flex items-center gap-1.5 uppercase tracking-wide text-[10px] text-slate-650">
                {isPedAuthorized ? '🔓 Accès Officiel Débloqué' : '🔒 Bulletin de Notes Verrouillé (Lecture Seule)'}
              </span>
              <p className="font-medium text-slate-600 mt-0.5">
                {isPedAuthorized 
                  ? `Vous agissez en qualité de : ${pedManagerName || "Principal Responsable Pédagogique"}`
                  : `L'introduction ou la suppression de notes officielles requiert le mot de passe du Surveillant ou Censeur.`}
              </p>
            </div>
          </div>
          {!isPedAuthorized && onPromptUnlockPed && (
            <button
              onClick={onPromptUnlockPed}
              className="px-3 py-1.5 bg-white text-slate-800 border border-slate-250 font-bold rounded-lg text-[10px] hover:bg-slate-50 uppercase tracking-wider transition cursor-pointer shrink-0"
            >
              Saisir mot de passe
            </button>
          )}
        </div>
      )}

      {/* Add Grade Section Form */}
      <AnimatePresence>
        {showAddForm && activeStudent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 shadow-3xs">
              <div className="flex items-center justify-between border-b border-slate-205 pb-2 select-none">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  📝 Introduire une note officielle pour {activeStudent.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-bold uppercase transition cursor-pointer"
                >
                  Annuler
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Matière / Discipline <span className="text-red-500">*</span></label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 font-medium text-slate-850"
                  >
                    <option value="Mathématiques">Mathématiques</option>
                    <option value="Physique-Chimie">Physique-Chimie</option>
                    <option value="Sciences de la Vie">Sciences de la Vie (SVT)</option>
                    <option value="Français / Littérature">Français</option>
                    <option value="Anglais">Anglais</option>
                    <option value="Histoire-Géographie">Histoire-Géographie</option>
                    <option value="Informatique">Informatique</option>
                    <option value="Allemand / Espagnol">Langue Vivante II</option>
                    <option value="Arts / Musique">Arts / Musique</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Intitulé de l'Évaluation <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="Ex: Devoir Harmonisé / Examen Trimestre 1"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 font-medium text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Date de l'évaluation <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={gradeDate}
                    onChange={(e) => setGradeDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Note obtenue <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.25"
                    required
                    min="0"
                    max={maxScore}
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 font-medium text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Sur (/ Max possible) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={maxScore}
                    onChange={(e) => setMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 font-medium text-slate-805"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Appréciation / Remarques</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Ex: Excellent trimestre, poursuivez ainsi."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-slate-250 bg-white text-slate-800 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-50 cursor-pointer text-center"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer text-center shadow-xs"
                >
                  <CheckCircle className="h-4 w-4" /> Enregistrer Note
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {grades.length === 0 ? (
        <div className="text-center p-12 bg-gray-50/50 rounded-2xl border border-gray-100 select-none">
          <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">Aucune note enregistrée pour cet élève.</p>
        </div>
      ) : (
        <>
          {/* Key Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl border flex items-center justify-between ${getAverageBadgeColor(Number(averageMark))}`}
            >
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider font-semibold opacity-80">Moyenne Générale</span>
                <div className="text-3xl font-black flex items-baseline gap-1">
                  {averageMark} <span className="text-xs font-normal opacity-70">/ 20</span>
                </div>
              </div>
              <TrendingUp className="h-10 w-10 opacity-30" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">Évaluations Terminées</span>
                <div className="text-3xl font-bold text-gray-900">{filteredGrades.length}</div>
              </div>
              <BookOpen className="h-10 w-10 text-indigo-100" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">Meilleure Note</span>
                <div className="text-3xl font-bold text-gray-900 flex items-baseline gap-1">
                  {filteredGrades.length > 0
                    ? Math.max(...filteredGrades.map(g => (g.score / g.maxScore) * 20)).toFixed(1)
                    : '0'
                  }
                  <span className="text-xs font-normal text-gray-400">/ 20</span>
                </div>
              </div>
              <Sparkles className="h-10 w-10 text-emerald-100" />
            </motion.div>
          </div>

          {/* Graphic Section */}
          {chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 bg-white border border-gray-100 rounded-2xl space-y-4 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-gray-800">Évolution Temporelle des Notes (sur 20)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickStyle={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis domain={[0, 20]} tickStyle={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        border: '1px solid #f1f5f9',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                        fontSize: '12px'
                      }}
                      formatter={(value: any, name: string, props: any) => [
                        `${value} / 20`,
                        `Note (${props.payload.subject})`
                      ]}
                      labelFormatter={(label) => `Évaluation du : ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#4f46e5', strokeWidth: 0 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Select and Filter Row */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800">Détail des Évaluations</h3>
              <div className="flex items-center gap-2 flex-wrap text-left">
                <span className="text-xs font-semibold text-gray-400">Filtrer par matière :</span>
                <div className="flex bg-gray-100 p-0.5 rounded-xl border border-gray-200">
                  {subjects.map((subj) => (
                    <button
                      key={subj}
                      onClick={() => setSelectedSubject(subj)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                        selectedSubject === subj
                          ? 'bg-white text-gray-900 shadow-3xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {subj === 'all' ? 'Toutes' : subj}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredGrades.map((g, idx) => {
                  const relativeScore = (g.score / g.maxScore) * 20;
                  const isCustom = g.id.startsWith('gr_') && Number(g.id.split('_')[1]) > 10000;

                  return (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.04 }}
                      className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between gap-4 flex-wrap hover:shadow-xs group duration-200 transition-all"
                    >
                      <div className="flex-1 space-y-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-md font-medium">
                            {g.subject}
                          </span>
                          <span className="text-[11px] font-mono text-gray-400">
                            {new Date(g.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {g.examName}
                        </h4>
                        <p className="text-xs text-gray-500 italic">
                          "{g.teacherRemarks}"
                        </p>
                      </div>

                      {/* Display score and custom delete action */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className={`text-lg font-bold px-3 py-1 rounded-xl ${
                            relativeScore >= 16 ? 'bg-emerald-50 text-emerald-700' :
                            relativeScore >= 12 ? 'bg-indigo-50 text-indigo-700' :
                            relativeScore >= 10 ? 'bg-amber-50 text-amber-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {g.score} <span className="text-xs opacity-60">/ {g.maxScore}</span>
                          </span>
                          <div className="text-[10px] text-gray-400 font-mono mt-1">
                            {relativeScore.toFixed(1)} / 20 eq.
                          </div>
                        </div>

                        {onDeleteGrade && (
                          <button
                            type="button"
                            onClick={() => handleDelete(g.id, g.examName)}
                            className={`text-red-650 hover:text-red-800 p-1.5 bg-red-100/15 hover:bg-red-200/30 border border-transparent hover:border-red-500/10 rounded-xl transition duration-200 cursor-pointer ${
                              isPedAuthorized || isCustom ? 'opacity-100' : 'opacity-45 hover:opacity-105 md:opacity-0 md:group-hover:opacity-100'
                            }`}
                            title="Supprimer cette note"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
