import { useState } from 'react';
import { Grade } from '../types';
import { Award, BookOpen, TrendingUp, Sparkles, Filter, Percent } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

interface GradesDashboardProps {
  grades: Grade[];
}

export default function GradesDashboard({ grades }: GradesDashboardProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4 border-gray-100 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600" />
            Bulletins de Notes & Évaluations
          </h2>
          <p className="text-sm text-gray-500">
            Suivi académique détaillé, moyennes pondérées et appréciations par matière.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-500 mr-1">Filtrer par matière :</span>
          <div className="flex gap-1">
            {subjects.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  selectedSubject === subj
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {subj === 'all' ? 'Toutes' : subj}
              </button>
            ))}
          </div>
        </div>
      </div>

      {grades.length === 0 ? (
        <div className="text-center p-12 bg-gray-50/50 rounded-2xl border border-gray-100">
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

          {/* Grades List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Détail des Évaluations</h3>
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredGrades.map((g, idx) => {
                  const relativeScore = (g.score / g.maxScore) * 20;
                  return (
                    <motion.div
                      key={g.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 bg-white border border-gray-100 rounded-xl flex items-center justify-between gap-4 flex-wrap hover:shadow-sm hover:border-gray-200 transition-all"
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

                      {/* Display score */}
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
