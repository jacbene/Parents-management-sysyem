import { Announcement } from '../types';
import { Newspaper, Bell, Award, Calendar, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

const STATIC_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_1',
    title: 'Réunion d\'information - Classes de Découverte',
    content: 'Chers parents, nous vous invitons à la réunion de présentation des classes vertes le vendredi 5 juin à 18h00 dans la grande salle polyvalente de l\'école. Présence recommandée.',
    category: 'Event',
    date: '2026-05-23',
    author: 'Direction de l\'Établissement'
  },
  {
    id: 'ann_2',
    title: 'Sécurité Routière et Accès École',
    content: 'Suite aux travaux dans la rue des Écoles, nous rappelons que le dépose-minute est temporairement déplacé devant la mairie. Merci de respecter la signalisation pour la sécurité des enfants.',
    category: 'Urgent',
    date: '2026-05-20',
    author: 'Bureau de la Sécurité Scolaire'
  },
  {
    id: 'ann_3',
    title: 'Fête de l\'École 2026 - Préparatifs',
    content: 'La grande kermesse de fin d\'année aura lieu le samedi 27 juin. Nous recherchons des parents bénévoles pour tenir les stands et amener des gâteaux. Inscrivez-vous auprès de l\'association des parents !',
    category: 'General',
    date: '2026-05-18',
    author: 'Association Parents GPE'
  },
  {
    id: 'ann_4',
    title: 'Bilan de Santé Scolaire - CP et CE2',
    content: 'Les visites médicales obligatoires débuteront le mois prochain. Un carnet de rendez-vous individuel et un questionnaire de santé confidentiel vous parviendront par le cahier de liaison de votre enfant.',
    category: 'Academic',
    date: '2026-05-15',
    author: 'Infirmerie Scolaire'
  }
];

export default function AnnouncementsFeed() {
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Urgent':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          badge: 'bg-red-100 text-red-800',
          icon: AlertTriangle
        };
      case 'Event':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          badge: 'bg-indigo-100 text-indigo-800',
          icon: Calendar
        };
      case 'Academic':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-800',
          icon: Award
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          badge: 'bg-slate-100 text-slate-800',
          icon: Bell
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4 border-gray-100">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-indigo-600" />
            Annonces & Actualités de l'École
          </h2>
          <p className="text-sm text-gray-500">
            Toutes les communications officielles diffusées par l'administration de l'établissement.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STATIC_ANNOUNCEMENTS.map((ann, idx) => {
          const config = getCategoryTheme(ann.category);
          const Icon = config.icon;
          return (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`p-5 rounded-2xl border ${config.bg} flex flex-col justify-between transition-all hover:shadow-sm duration-300`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${config.badge}`}>
                    {ann.category}
                  </span>
                  <span className="text-xs font-mono text-gray-500">{ann.date}</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  {ann.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-700">{ann.content}</p>
              </div>
              <div className="pt-4 mt-4 border-t border-black/5 flex items-center justify-between text-[11px] font-medium text-gray-500">
                <span>Émis par : <strong className="text-gray-700">{ann.author}</strong></span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
