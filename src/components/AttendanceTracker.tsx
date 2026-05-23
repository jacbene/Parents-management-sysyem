import { Attendance, AttendanceStatus } from '../types';
import { Calendar, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface AttendanceTrackerProps {
  attendanceLogs: Attendance[];
}

export default function AttendanceTracker({ attendanceLogs }: AttendanceTrackerProps) {
  // Compute basic attendance statistics
  const totalDays = attendanceLogs.length;
  const presentDays = attendanceLogs.filter(a => a.status === 'Present').length;
  const lateDays = attendanceLogs.filter(a => a.status === 'Late').length;
  const excusedDays = attendanceLogs.filter(a => a.status === 'Excused').length;
  const absentDays = attendanceLogs.filter(a => a.status === 'Absent').length;

  const attendanceRate = totalDays > 0
    ? (((presentDays + excusedDays + lateDays / 2) / totalDays) * 100).toFixed(0)
    : '100';

  const getStatusConfig = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return {
          icon: CheckCircle2,
          text: 'Présent',
          color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
          badge: 'bg-emerald-100 text-emerald-800'
        };
      case 'Absent':
        return {
          icon: XCircle,
          text: 'Absent Non Justifié',
          color: 'text-red-600 bg-red-50 border-red-100',
          badge: 'bg-red-100 text-red-800'
        };
      case 'Late':
        return {
          icon: Clock,
          text: 'Arrivée Tardive',
          color: 'text-amber-600 bg-amber-50 border-amber-100',
          badge: 'bg-amber-100 text-amber-800'
        };
      case 'Excused':
        return {
          icon: CheckCircle2,
          text: 'Absence Justifiée',
          color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
          badge: 'bg-indigo-100 text-indigo-800'
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4 border-gray-100">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Registre d'Assiduité & Présences
          </h2>
          <p className="text-sm text-gray-500">
            Consultez le relevé quotidien des présences, retards signalés et justificatifs validés.
          </p>
        </div>
      </div>

      {attendanceLogs.length === 0 ? (
        <div className="text-center p-12 bg-gray-50/50 rounded-2xl border border-gray-100">
          <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">Relevé de présences vierge pour cet élève.</p>
        </div>
      ) : (
        <>
          {/* Circular Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-white border border-gray-100 rounded-2xl text-center space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Taux de Présence</span>
              <div className="text-3xl font-black text-indigo-600 font-mono">{attendanceRate}%</div>
            </div>

            <div className="p-4 bg-white border border-gray-100 rounded-2xl text-center space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Présences</span>
              <div className="text-3xl font-black text-emerald-600 font-mono">{presentDays}</div>
            </div>

            <div className="p-4 bg-white border border-gray-100 rounded-2xl text-center space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Retards</span>
              <div className="text-3xl font-black text-amber-500 font-mono">{lateDays}</div>
            </div>

            <div className="p-4 bg-white border border-gray-100 rounded-2xl text-center space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Excusés</span>
              <div className="text-3xl font-black text-indigo-500 font-mono">{excusedDays}</div>
            </div>

            <div className="p-4 bg-white border border-gray-100 rounded-2xl text-center col-span-2 lg:col-span-1 space-y-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Absences</span>
              <div className="text-3xl font-black text-red-500 font-mono">{absentDays}</div>
            </div>
          </div>

          {/* Timeline listing */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Historique d'Émargement Récent</h3>
            <div className="relative border-l-2 border-gray-150 pl-6 ml-3 space-y-5">
              {attendanceLogs.map((log, idx) => {
                const config = getStatusConfig(log.status);
                const Icon = config.icon;
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="relative"
                  >
                    {/* Timeline bullet icon */}
                    <div className={`absolute -left-[37px] top-0 p-1.5 rounded-full border-2 border-white ${config.color} shadow-sm`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-gray-100 flex items-center justify-between gap-4 flex-wrap hover:shadow-xs transition-shadow">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-gray-700">
                            {new Date(log.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                        </div>
                        {log.remarks && (
                          <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                            <span>{log.remarks}</span>
                          </div>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.badge}`}>
                        {config.text}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
