import React, { useState, useEffect } from 'react';
import { Bar, BarEvent, EventCategory, Badge } from '../../types';
import { getEvents, createEvent, joinEvent, leaveEvent } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  X, Calendar, Clock, MapPin, Users, Plus, Check, Sparkles, Filter,
  PartyPopper, Heart, Briefcase, Gamepad2, Music, Coffee, ArrowRight, Trophy
} from 'lucide-react';

interface EventsModalProps {
  onClose: () => void;
  bars: Bar[];
  onSelectBar: (bar: Bar) => void;
  defaultBarId?: string;
  initialTab?: 'list' | 'create';
  onBadgeUnlocked?: (badges: Badge[]) => void;
}

const CATEGORY_META: Record<EventCategory, { label: string; emoji: string; color: string; bg: string }> = {
  singles: { label: 'Rencontres & Célibataires', emoji: '💘', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' },
  afterwork: { label: 'Afterwork & Pro', emoji: '💼', color: 'text-cyan-400', bg: 'bg-cyan-500/15 border-cyan-500/30' },
  meetup: { label: 'Meetup & Échanges', emoji: '🤝', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  party: { label: 'Soirée Festive', emoji: '🪩', color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30' },
  games: { label: 'Jeux & Quizz', emoji: '🎲', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  music: { label: 'Concert & Live', emoji: '🎸', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
};

export const EventsModal: React.FC<EventsModalProps> = ({
  onClose,
  bars,
  onSelectBar,
  defaultBarId,
  initialTab = 'list',
  onBadgeUnlocked,
}) => {
  const [events, setEvents] = useState<BarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const currentUserId = 'default-user';

  // Form state
  const [formBarId, setFormBarId] = useState<string>(defaultBarId || (bars[0]?.id || ''));
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<EventCategory>('singles');
  const [formDate, setFormDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [formTime, setFormTime] = useState('19:30');
  const [formMaxParticipants, setFormMaxParticipants] = useState(20);
  const [formTags, setFormTags] = useState('Rencontres, Verres, Convivialité');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load events
  const loadAllEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllEvents();
  }, []);

  // Handle Join / Leave
  const handleToggleJoin = async (event: BarEvent) => {
    const isJoined = event.participants.some((p) => p.id === currentUserId);
    try {
      if (isJoined) {
        const updated = await leaveEvent(event.id, currentUserId);
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
        const updated = await joinEvent(event.id);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ec4899', '#38bdf8'],
        });
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
        if (updated.newlyUnlockedBadges && updated.newlyUnlockedBadges.length > 0) {
          onBadgeUnlocked?.(updated.newlyUnlockedBadges);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour de votre participation');
    }
  };

  // Handle Create Event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBarId) {
      alert('Veuillez renseigner un bar et un titre pour votre soirée.');
      return;
    }

    try {
      setSubmitting(true);
      const selectedBarObj = bars.find((b) => b.id === formBarId);
      const newEvent = await createEvent({
        barId: formBarId,
        barName: selectedBarObj?.name,
        barCity: selectedBarObj?.city,
        barCountry: selectedBarObj?.country,
        barPhoto: selectedBarObj?.coverPhoto,
        title: formTitle,
        description: formDescription,
        category: formCategory,
        date: formDate,
        time: formTime,
        maxParticipants: formMaxParticipants,
        tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
      });

      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 },
      });

      setEvents((prev) => [newEvent, ...prev]);
      if (newEvent.newlyUnlockedBadges && newEvent.newlyUnlockedBadges.length > 0) {
        onBadgeUnlocked?.(newEvent.newlyUnlockedBadges);
      }

      setSuccessMessage('🎉 Votre soirée a été créée avec succès !');
      setTimeout(() => {
        setSuccessMessage('');
        setActiveTab('list');
      }, 1500);

      // Reset form
      setFormTitle('');
      setFormDescription('');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création de la soirée');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter events
  const filteredEvents = events.filter((e) => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    if (selectedCity !== 'all' && e.barCity.toLowerCase() !== selectedCity.toLowerCase()) return false;
    return true;
  });

  // Unique cities from events
  const cities = Array.from(new Set(events.map((e) => e.barCity))).sort();

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border-b border-white/10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950">
                Communauté & Rencontres
              </span>
              <span className="text-xs text-slate-400">
                {events.length} soirée{events.length > 1 ? 's' : ''} organisée{events.length > 1 ? 's' : ''}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Soirées & Rencontres dans les Bars</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Trouvez des personnes pour sortir ce soir, rejoignez un meetup ou proposez votre propre événement pour faire de nouvelles connaissances !
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/5 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'border-amber-400 text-amber-400 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PartyPopper className="w-4 h-4" />
            <span>Toutes les soirées ({filteredEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'border-amber-400 text-amber-400 bg-white/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Proposer une soirée</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {activeTab === 'list' ? (
            <div>
              {/* Achievement Announcement Banner */}
              <div className="mb-5 p-3.5 bg-gradient-to-r from-amber-500/10 via-purple-950/30 to-slate-900 border border-amber-500/25 rounded-2xl flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 flex-shrink-0 shadow-inner">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Succès de Soirées Disponibles !
                    </span>
                    <p className="text-slate-300 mt-0.5 leading-snug">
                      Rejoignez un afterwork, participez à un blind test ou organisez une soirée pour décrocher les 7 trophées communautaires.
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'glass text-slate-300 hover:bg-white/10'
                  }`}
                >
                  Tous
                </button>
                {(Object.keys(CATEGORY_META) as EventCategory[]).map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const isSel = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSel
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md'
                          : 'glass text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span>{meta.emoji}</span>
                      <span>{meta.label}</span>
                    </button>
                  );
                })}

                {/* City dropdown */}
                {cities.length > 1 && (
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold glass text-slate-200 bg-slate-900 border border-white/10 outline-none cursor-pointer"
                  >
                    <option value="all">Toutes les villes</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        📍 {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Events Grid */}
              {loading ? (
                <div className="py-16 text-center text-slate-500 text-sm animate-pulse">
                  Chargement des soirées...
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-3xl mb-2">🍹</p>
                  <p className="text-white font-bold text-base">Aucune soirée trouvée dans cette catégorie</p>
                  <p className="text-slate-400 text-xs mt-1">Soyez le premier à en proposer une !</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-all cursor-pointer"
                  >
                    + Proposer une soirée maintenant
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEvents.map((evt) => {
                    const meta = CATEGORY_META[evt.category] || CATEGORY_META.meetup;
                    const isJoined = evt.participants.some((p) => p.id === currentUserId);
                    const spotsLeft = evt.maxParticipants ? Math.max(0, evt.maxParticipants - evt.participants.length) : null;
                    const isFull = spotsLeft !== null && spotsLeft === 0 && !isJoined;
                    const barObj = bars.find((b) => b.id === evt.barId);

                    return (
                      <div
                        key={evt.id}
                        className="glass-strong rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-white/10 hover:border-amber-500/30 transition-all duration-300 group"
                      >
                        <div>
                          {/* Top row: Category + Bar Info */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${meta.bg} ${meta.color}`}>
                              <span>{meta.emoji}</span>
                              <span>{meta.label}</span>
                            </span>

                            <button
                              onClick={() => {
                                if (barObj) {
                                  onSelectBar(barObj);
                                  onClose();
                                }
                              }}
                              className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 group-hover:underline cursor-pointer"
                              title="Voir ce bar sur la carte"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[140px]">{evt.barName}</span>
                              <span className="text-slate-500 font-normal">({evt.barCity})</span>
                            </button>
                          </div>

                          {/* Title */}
                          <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                            {evt.title}
                          </h3>

                          {/* Description */}
                          <p className="text-xs text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                            {evt.description}
                          </p>

                          {/* Date & Time pill */}
                          <div className="flex items-center gap-3 mt-3 text-xs text-slate-300">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                              <Calendar className="w-3.5 h-3.5 text-amber-400" />
                              <span className="font-semibold">{evt.date}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="font-semibold">{evt.time}</span>
                            </div>
                          </div>

                          {/* Tags */}
                          {evt.tags && evt.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {evt.tags.map((t, idx) => (
                                <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Bottom Row: Participants & RSVP button */}
                        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                          {/* Participants preview */}
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2 overflow-hidden">
                              {evt.participants.slice(0, 4).map((p, idx) => (
                                <img
                                  key={idx}
                                  src={p.avatar}
                                  alt={p.name}
                                  title={p.name}
                                  className="w-7 h-7 rounded-full object-cover ring-2 ring-slate-950"
                                />
                              ))}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              <span className="font-bold text-slate-200">{evt.participants.length}</span> participant{evt.participants.length > 1 ? 's' : ''}
                              {spotsLeft !== null && spotsLeft <= 5 && (
                                <span className="block text-[10px] text-amber-400 font-semibold">
                                  Plus que {spotsLeft} place{spotsLeft > 1 ? 's' : ''} !
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <button
                            onClick={() => handleToggleJoin(evt)}
                            disabled={isFull}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                              isJoined
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
                                : isFull
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/25 active:scale-95'
                            }`}
                          >
                            {isJoined ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Inscrit(e)</span>
                              </>
                            ) : isFull ? (
                              <span>Complet</span>
                            ) : (
                              <>
                                <Users className="w-3.5 h-3.5" />
                                <span>Participer</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Tab: Create Event Form */
            <form onSubmit={handleCreateEvent} className="max-w-2xl mx-auto flex flex-col gap-4">
              {successMessage && (
                <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-sm text-center">
                  {successMessage}
                </div>
              )}

              {/* Bar selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Dans quel bar ?
                </label>
                <select
                  value={formBarId}
                  onChange={(e) => setFormBarId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass text-slate-100 bg-slate-900 border border-white/10 text-sm outline-none focus:border-amber-400"
                  required
                >
                  {bars.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.city}, {b.country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Titre de la soirée
                </label>
                <input
                  type="text"
                  placeholder="Ex: Soirée Rencontres Célibataires 25-35 ans, Afterwork Mixologie..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass text-slate-100 bg-slate-900 border border-white/10 text-sm outline-none focus:border-amber-400 placeholder:text-slate-600"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Ambiance / Thème
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(CATEGORY_META) as EventCategory[]).map((cat) => {
                    const meta = CATEGORY_META[cat];
                    const isSel = formCategory === cat;
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setFormCategory(cat)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                          isSel
                            ? 'bg-amber-500/20 border-amber-400 text-white'
                            : 'glass border-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-base">{meta.emoji}</span>
                        <span className="truncate">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date & Time & Max */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass text-slate-100 bg-slate-900 border border-white/10 text-xs outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Heure de rendez-vous
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass text-slate-100 bg-slate-900 border border-white/10 text-xs outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Participants max
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={100}
                    value={formMaxParticipants}
                    onChange={(e) => setFormMaxParticipants(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl glass text-slate-100 bg-slate-900 border border-white/10 text-xs outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description & Programme
                </label>
                <textarea
                  rows={3}
                  placeholder="Décrivez l'ambiance, comment se retrouver sur place, le dress code ou le concept de la soirée..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass text-slate-100 bg-slate-900 border border-white/10 text-xs outline-none focus:border-amber-400 placeholder:text-slate-600 resize-none"
                  required
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Mots-clés (séparés par des virgules)
                </label>
                <input
                  type="text"
                  placeholder="Rencontres, Célibataires, Cocktails, 20-35 ans"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass text-slate-100 bg-slate-900 border border-white/10 text-xs outline-none focus:border-amber-400 placeholder:text-slate-600"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full py-3.5 rounded-2xl font-black text-sm text-slate-950
                           bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500
                           shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40
                           transition-all active:scale-[0.98] cursor-pointer"
              >
                {submitting ? 'Création en cours...' : '🚀 Publier ma soirée'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsModal;
