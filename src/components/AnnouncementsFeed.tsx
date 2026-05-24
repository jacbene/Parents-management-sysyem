import React, { useState } from 'react';
import { Announcement, AnnouncementCategory } from '../types';
import { Newspaper, Bell, Award, Calendar, AlertTriangle, Plus, Trash2, Shield, Lock, Unlock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

interface AnnouncementsFeedProps {
  customAnnouncements?: Announcement[];
  onAddAnnouncement?: (ann: Announcement) => Promise<boolean>;
  onDeleteAnnouncement?: (id: string) => Promise<boolean>;
  isPedAuthorized?: boolean;
  onPromptUnlockPed?: () => void;
  pedManagerName?: string;
  hasPedPassword?: boolean;
}

export default function AnnouncementsFeed({
  customAnnouncements = [],
  onAddAnnouncement,
  onDeleteAnnouncement,
  isPedAuthorized = false,
  onPromptUnlockPed,
  pedManagerName = '',
  hasPedPassword = false,
}: AnnouncementsFeedProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('General');
  const [author, setAuthor] = useState(pedManagerName || 'Responsable Pédagogique');

  // Merge custom dynamic announcements with static ones
  const allAnnouncements = [...customAnnouncements, ...STATIC_ANNOUNCEMENTS];

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
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

  const handleOpenForm = () => {
    if (hasPedPassword && !isPedAuthorized && onPromptUnlockPed) {
      onPromptUnlockPed();
      return;
    }
    setAuthor(pedManagerName || 'Direction / Censeur');
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Veuillez remplir le titre et le contenu du communiqué.');
      return;
    }

    if (onAddAnnouncement) {
      const newAnn: Announcement = {
        id: 'ann_' + Date.now(),
        title: title.trim(),
        content: content.trim(),
        category,
        date: new Date().toISOString().split('T')[0],
        author: author.trim() || 'Responsable Pédagogique'
      };

      const success = await onAddAnnouncement(newAnn);
      if (success) {
        setTitle('');
        setContent('');
        setShowAddForm(false);
      }
    }
  };

  const handleDelete = async (id: string, annTitle: string) => {
    if (hasPedPassword && !isPedAuthorized && onPromptUnlockPed) {
      onPromptUnlockPed();
      return;
    }
    const confirm = window.confirm(`Voulez-vous supprimer le communiqué officiel "${annTitle}" ?`);
    if (confirm && onDeleteAnnouncement) {
      await onDeleteAnnouncement(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-150 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-indigo-600" />
            Annonces & Actualités de l'École
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Toutes les communications officielles diffusées par l'administration de l'établissement.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleOpenForm}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Publier un Communiqué
        </button>
      </div>

      {/* Security Status Header */}
      {hasPedPassword && (
        <div className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
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
                {isPedAuthorized ? '🔓 Accès Officiel Débloqué' : '🔒 Consultation (Saisies Verrouillées)'}
              </span>
              <p className="font-medium text-slate-600 mt-0.5">
                {isPedAuthorized 
                  ? `Vous écrivez en tant que : ${pedManagerName || "Principal Responsable Pédagogique"}`
                  : `La modification des communiqués nécessite le mot de passe du Surveillant Général / Censeur.`}
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

      {/* Add Announcement Dialog */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 shadow-3xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 select-none">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                  📝 Publier un nouveau communiqué de l'Établissement
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-bold uppercase transition cursor-pointer shrink-0"
                >
                  Annuler
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Titre du Communiqué <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Report des évaluations harmonisées du 2e trimestre"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 font-medium text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Catégorie <span className="text-red-500">*</span></label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 font-medium text-slate-850"
                  >
                    <option value="General">Normal / Général</option>
                    <option value="Urgent">Urgent / Alerte</option>
                    <option value="Event">Événementiel</option>
                    <option value="Academic">Académique</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Signataire / Auteur <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Ex: Le Censeur des Études"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 font-medium text-slate-850"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Corps du message <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Écrivez ici le message officiel détaillé à l'attention des parents d'élèves..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-indigo-500 font-medium text-slate-800 leading-normal"
                ></textarea>
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
                  <CheckCircle className="h-4 w-4" /> Diffuser
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allAnnouncements.map((ann, idx) => {
          const config = getCategoryTheme(ann.category);
          const Icon = config.icon;
          const isCustom = ann.id.startsWith('ann_') && Number(ann.id.split('_')[1]) > 100000;

          return (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-5 rounded-2xl border ${config.bg} flex flex-col justify-between transition-all hover:shadow-xs relative group duration-300`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${config.badge}`}>
                    {ann.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">{ann.date}</span>
                    {onDeleteAnnouncement && (
                      <button
                        type="button"
                        onClick={() => handleDelete(ann.id, ann.title)}
                        className={`text-red-650 hover:text-red-800 p-1 bg-red-100/10 hover:bg-red-150/30 rounded-lg transition-all border border-red-500/10 cursor-pointer ${
                          isPedAuthorized || isCustom ? 'opacity-100' : 'opacity-40 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100'
                        }`}
                        title="Supprimer ce communiqué officiel"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 text-base flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  {ann.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{ann.content}</p>
              </div>
              <div className="pt-4 mt-4 border-t border-black/5 flex items-center justify-between text-[11px] font-medium text-gray-500 select-none">
                <span>Émis par : <strong className="text-gray-700">{ann.author}</strong></span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
