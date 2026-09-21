import React, { useState, useEffect } from 'react';
import { UserProfile, Bar, BadgeWithProgress, BarEvent, BadgeTier } from '../../types';
import { getBadges, getEvents } from '../../services/api';
import {
  X, Star, Heart, MapPin, Trophy, Bookmark, Check, PartyPopper,
  Calendar, Users, CheckCircle2, Sparkles, ChevronRight, Award, ShieldCheck
} from 'lucide-react';

interface UserProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  allBars: Bar[];
  onSelectBar: (bar: Bar) => void;
  onOpenEvents?: () => void;
}

const TIER_STYLES: Record<BadgeTier, {
  label: string;
  emoji: string;
  pillClass: string;
  cardBorder: string;
  cardBg: string;
  progressBar: string;
  glow: string;
}> = {
  bronze: {
    label: 'Bronze',
    emoji: '🥉',
    pillClass: 'bg-amber-800/30 text-amber-200 border-amber-600/40',
    cardBorder: 'border-amber-700/40 hover:border-amber-600/70',
    cardBg: 'bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950',
    progressBar: 'bg-amber-600',
    glow: 'rgba(217,119,6,0.2)',
  },
  silver: {
    label: 'Argent',
    emoji: '🥈',
    pillClass: 'bg-slate-300/20 text-slate-100 border-slate-300/40',
    cardBorder: 'border-slate-400/40 hover:border-slate-300/70',
    cardBg: 'bg-gradient-to-b from-slate-800/30 via-slate-900 to-slate-950',
    progressBar: 'bg-slate-300',
    glow: 'rgba(203,213,225,0.2)',
  },
  gold: {
    label: 'Or',
    emoji: '🥇',
    pillClass: 'bg-amber-400/25 text-amber-300 border-amber-400/50',
    cardBorder: 'border-amber-400/50 hover:border-amber-300/80',
    cardBg: 'bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-950',
    progressBar: 'bg-amber-400',
    glow: 'rgba(251,191,36,0.3)',
  },
  diamond: {
    label: 'Diamant',
    emoji: '💎',
    pillClass: 'bg-cyan-400/25 text-cyan-200 border-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.3)]',
    cardBorder: 'border-cyan-400/60 hover:border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]',
    cardBg: 'bg-gradient-to-b from-cyan-950/40 via-indigo-950/20 to-slate-950',
    progressBar: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]',
    glow: 'rgba(34,211,238,0.35)',
  },
};

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  onClose,
  allBars,
  onSelectBar,
  onOpenEvents,
}) => {
  const [activeTab, setActiveTab] = useState<'badges' | 'events' | 'visited' | 'favorites' | 'bucket'>('badges');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [badges, setBadges] = useState<BadgeWithProgress[]>([]);
  const [allEventsList, setAllEventsList] = useState<BarEvent[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithProgress | null>(null);

  useEffect(() => {
    getBadges().then(setBadges).catch(console.error);
    getEvents().then(setAllEventsList).catch(console.error);
  }, []);

  const visitedBars = allBars.filter((b) => user.visitedBarIds.includes(b.id));
  const favoriteBars = allBars.filter((b) => user.favoriteBarIds.includes(b.id));
  const bucketListBars = allBars.filter((b) => user.bucketListBarIds.includes(b.id));
  
  // Soirées auxquelles l'utilisateur participe
  const userEvents = allEventsList.filter((e) => e.participants && e.participants.some((p) => p.id === user.id));

  const visitedCountries = new Set(visitedBars.map((b) => b.country)).size;
  const unlockedBadges = badges.filter((b) => b.isUnlocked);
  const unlockedCount = unlockedBadges.length;

  // Calcul des points totaux et du niveau du joueur
  const totalPoints = unlockedBadges.reduce((sum, b) => sum + (b.badge.points || 10), 0);
  
  let currentLevel = { name: 'Explorateur Novice', tierIcon: '🥉', nextPoints: 50, prevPoints: 0 };
  if (totalPoints >= 500) {
    currentLevel = { name: 'Légende Vivante des Nuits', tierIcon: '💎', nextPoints: 1000, prevPoints: 500 };
  } else if (totalPoints >= 250) {
    currentLevel = { name: 'Grand Maître Nocturne', tierIcon: '🥇', nextPoints: 500, prevPoints: 250 };
  } else if (totalPoints >= 100) {
    currentLevel = { name: 'Habitué des Comptoirs', tierIcon: '🥈', nextPoints: 250, prevPoints: 100 };
  } else if (totalPoints >= 50) {
    currentLevel = { name: 'Noctambule Curieux', tierIcon: '🥉', nextPoints: 100, prevPoints: 50 };
  }

  const levelPercentage = Math.min(
    100,
    Math.round(((totalPoints - currentLevel.prevPoints) / (currentLevel.nextPoints - currentLevel.prevPoints)) * 100)
  );

  // Compteurs de chaque palier
  const countByTier = (tier: BadgeTier) => {
    const total = badges.filter((b) => (b.badge.tier || 'bronze') === tier).length;
    const unlocked = badges.filter((b) => (b.badge.tier || 'bronze') === tier && b.isUnlocked).length;
    return { unlocked, total };
  };

  const bronzeCount = countByTier('bronze');
  const silverCount = countByTier('silver');
  const goldCount = countByTier('gold');
  const diamondCount = countByTier('diamond');

  // Filtrage des badges par catégorie ou par palier
  const filteredBadges = badges.filter((item) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'bronze' || selectedFilter === 'silver' || selectedFilter === 'gold' || selectedFilter === 'diamond') {
      return (item.badge.tier || 'bronze') === selectedFilter;
    }
    if (selectedFilter === 'events') return item.badge.category === 'events';
    if (selectedFilter === 'types') return item.badge.category === 'types';
    if (selectedFilter === 'countries') return item.badge.category === 'countries';
    if (selectedFilter === 'crawls_social') return item.badge.category === 'crawls' || item.badge.category === 'social';
    return true;
  });

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg max-h-[92vh] bg-slate-950 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 flex flex-col items-center border-b border-white/5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="relative mb-3 group">
            <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl group-hover:bg-amber-500/30 transition-colors duration-300"></div>
            <img
              src={user.avatar}
              alt={user.name}
              className="relative w-20 h-20 rounded-full object-cover border-2 border-amber-400/60 shadow-xl"
            />
            <span
              title="Succès débloqués"
              className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 flex items-center gap-1 text-xs font-black shadow-lg border-2 border-slate-950"
            >
              <Trophy className="w-3.5 h-3.5" />
              {unlockedCount}/{badges.length}
            </span>
          </div>

          <h2 className="text-xl font-black text-white font-['Space_Grotesk'] tracking-tight">
            {user.name}
          </h2>
          <p className="text-xs text-slate-400 mb-2">@{user.username}</p>

          {/* Level & XP Banner */}
          <div className="w-full max-w-xs mt-1 p-2.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 shadow-inner flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-amber-300 flex items-center gap-1">
                <span>{currentLevel.tierIcon}</span>
                <span>{currentLevel.name}</span>
              </span>
              <span className="font-black text-white px-2 py-0.5 rounded-md bg-amber-500/20 text-[11px] border border-amber-500/30">
                {totalPoints} pts XP
              </span>
            </div>
            
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                style={{ width: `${levelPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Palier actuel</span>
              <span>Prochain palier : {currentLevel.nextPoints} pts</span>
            </div>
          </div>
        </div>

        {/* Tiers counters row (Bronze, Silver, Gold, Diamond) */}
        <div className="grid grid-cols-4 border-b border-white/5 bg-slate-900/80 text-center py-2 px-1 text-xs">
          <div className="flex flex-col items-center justify-center border-r border-white/5">
            <span className="text-sm font-black text-amber-500 flex items-center gap-0.5">
              🥉 {bronzeCount.unlocked}/{bronzeCount.total}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">Bronze</span>
          </div>
          <div className="flex flex-col items-center justify-center border-r border-white/5">
            <span className="text-sm font-black text-slate-300 flex items-center gap-0.5">
              🥈 {silverCount.unlocked}/{silverCount.total}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">Argent</span>
          </div>
          <div className="flex flex-col items-center justify-center border-r border-white/5">
            <span className="text-sm font-black text-yellow-300 flex items-center gap-0.5">
              🥇 {goldCount.unlocked}/{goldCount.total}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">Or</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-sm font-black text-cyan-300 flex items-center gap-0.5">
              💎 {diamondCount.unlocked}/{diamondCount.total}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">Diamant</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 bg-slate-950 px-2 overflow-x-auto scrollbar-hide text-xs">
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-shrink-0 px-3.5 py-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'badges'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Paliers & Trophées ({unlockedCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-shrink-0 px-3.5 py-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'events'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Soirées ({userEvents.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-shrink-0 px-3.5 py-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'favorites'
                ? 'border-rose-400 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Favoris ({favoriteBars.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('visited')}
            className={`flex-shrink-0 px-3.5 py-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'visited'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Visités ({visitedBars.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('bucket')}
            className={`flex-shrink-0 px-3.5 py-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'bucket'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>À tester ({bucketListBars.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950/50">
          
          {/* BADGES & PALIERS TAB */}
          {activeTab === 'badges' && (
            <div className="flex flex-col gap-3">
              {/* Category & Tier Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-[11px]">
                {[
                  { key: 'all', label: `🌟 Tous (${badges.length})` },
                  { key: 'bronze', label: `🥉 Bronze (${bronzeCount.total})` },
                  { key: 'silver', label: `🥈 Argent (${silverCount.total})` },
                  { key: 'gold', label: `🥇 Or (${goldCount.total})` },
                  { key: 'diamond', label: `💎 Diamant (${diamondCount.total})` },
                  { key: 'events', label: `🎉 Soirées (${badges.filter((b) => b.badge.category === 'events').length})` },
                  { key: 'types', label: `🍸 Bars & Types (${badges.filter((b) => b.badge.category === 'types').length})` },
                ].map((pill) => (
                  <button
                    key={pill.key}
                    onClick={() => setSelectedFilter(pill.key)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-all ${
                      selectedFilter === pill.key
                        ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/5'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-3 gap-2.5 mt-1">
                {filteredBadges.map((item) => {
                  const isSelected = selectedBadge?.badge.id === item.badge.id;
                  const tier = item.badge.tier || 'bronze';
                  const tierStyle = TIER_STYLES[tier];

                  return (
                    <button
                      key={item.badge.id}
                      type="button"
                      onClick={() => setSelectedBadge(isSelected ? null : item)}
                      className={`relative p-3 rounded-2xl border text-center flex flex-col items-center justify-between gap-1.5 transition-all group ${
                        isSelected
                          ? `ring-2 ring-amber-400 ${tierStyle.cardBg} border-amber-400 shadow-lg`
                          : item.isUnlocked
                          ? `${tierStyle.cardBg} ${tierStyle.cardBorder} shadow-sm`
                          : 'bg-slate-900/30 border-white/5 opacity-60 hover:opacity-85 grayscale'
                      }`}
                    >
                      {/* Tier Tag Top Right */}
                      <span className={`absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.2 rounded-md border ${tierStyle.pillClass}`}>
                        {tierStyle.emoji}
                      </span>

                      <div className="text-3xl my-1 filter drop-shadow-sm group-hover:scale-110 transition-transform">
                        {item.badge.icon}
                      </div>

                      <div className="w-full text-center">
                        <h4 className={`font-bold text-[11px] leading-tight line-clamp-2 ${
                          item.isUnlocked ? 'text-white' : 'text-slate-400'
                        }`}>
                          {item.badge.name}
                        </h4>
                        <span className="text-[9px] font-semibold text-slate-400 mt-0.5 block">
                          +{item.badge.points || 10} pts
                        </span>
                      </div>

                      <div className="w-full mt-1">
                        <div className="flex items-center justify-between text-[9px] text-slate-400 mb-0.5">
                          <span>{item.currentCount}/{item.targetCount}</span>
                          <span>{item.progressPercentage}%</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              item.isUnlocked ? tierStyle.progressBar : 'bg-slate-600'
                            }`}
                            style={{ width: `${item.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Badge Detail Box */}
              {selectedBadge && (() => {
                const tier = selectedBadge.badge.tier || 'bronze';
                const tierStyle = TIER_STYLES[tier];
                return (
                  <div className={`mt-2 p-4 bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border ${tierStyle.cardBorder} shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl p-2.5 rounded-2xl bg-slate-950 border border-white/10 shadow-inner">
                          {selectedBadge.badge.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-base text-white">{selectedBadge.badge.name}</h4>
                            <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border ${tierStyle.pillClass}`}>
                              {tierStyle.emoji} {tierStyle.label} • +{selectedBadge.badge.points || 10} pts
                            </span>
                            <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${
                              selectedBadge.isUnlocked
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {selectedBadge.isUnlocked ? 'Validé !' : 'En cours'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-snug">{selectedBadge.badge.description}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedBadge(null)}
                        className="p-1 text-slate-500 hover:text-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        Objectif : <strong className="text-white">{selectedBadge.currentCount}</strong> / {selectedBadge.targetCount}
                      </span>
                      <span className="font-semibold text-amber-400">
                        {selectedBadge.isUnlocked
                          ? '🏆 Palier débloqué !'
                          : `${selectedBadge.targetCount - selectedBadge.currentCount} restant(s)`}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* EVENTS TAB (Mes soirées) */}
          {activeTab === 'events' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Vos participations aux soirées BarAtlas</span>
                {onOpenEvents && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenEvents();
                    }}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                  >
                    <span>Explorer toutes les soirées</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {userEvents.length === 0 ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <PartyPopper className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300">Aucune soirée rejointe pour l'instant</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Participez à des afterworks ou blind tests pour valider vos paliers Bronze, Argent, Or et Diamant !
                    </p>
                  </div>
                  {onOpenEvents && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenEvents();
                      }}
                      className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md"
                    >
                      Trouver une soirée →
                    </button>
                  )}
                </div>
              ) : (
                userEvents.map((evt) => {
                  const bar = allBars.find((b) => b.id === evt.barId);
                  return (
                    <div
                      key={evt.id}
                      onClick={() => {
                        if (bar) {
                          onSelectBar(bar);
                          onClose();
                        }
                      }}
                      className="group flex items-center gap-3.5 p-3 rounded-2xl bg-gradient-to-r from-purple-950/20 to-slate-900 border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-950/30 cursor-pointer transition-all duration-300 shadow-sm"
                    >
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                        <img
                          src={evt.barPhoto || bar?.coverPhoto || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200&auto=format&fit=crop&q=80'}
                          alt={evt.barName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-sm truncate group-hover:text-purple-300 transition-colors">
                          {evt.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                          📍 {evt.barName} ({evt.barCity})
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-purple-300 font-semibold mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(evt.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} • {evt.time}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400 font-normal">
                            <Users className="w-3 h-3" />
                            {evt.participants.length} inscrits
                          </span>
                        </div>
                      </div>
                      <div className="text-purple-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* LIST TABS (Favorites, Visited, Bucket) */}
          {(activeTab === 'favorites' || activeTab === 'visited' || activeTab === 'bucket') && (
            <div className="flex flex-col gap-2.5">
              {(() => {
                let currentBars: Bar[] = [];
                let emptyMessage = '';
                
                if (activeTab === 'favorites') {
                  currentBars = favoriteBars;
                  emptyMessage = 'Aucun bar en favori pour le moment.';
                } else if (activeTab === 'visited') {
                  currentBars = visitedBars;
                  emptyMessage = 'Vous n\'avez pas encore marqué de bars visités.';
                } else {
                  currentBars = bucketListBars;
                  emptyMessage = 'Votre liste à tester est vide.';
                }

                if (currentBars.length === 0) {
                  return (
                    <div className="py-12 text-center text-sm text-slate-500">
                      {emptyMessage}
                    </div>
                  );
                }

                return currentBars.map((bar) => (
                  <div
                    key={bar.id}
                    onClick={() => {
                      onSelectBar(bar);
                      onClose();
                    }}
                    className="group flex items-center gap-3.5 p-3 rounded-2xl bg-slate-900/50 hover:bg-slate-800/80 border border-white/5 hover:border-amber-500/30 cursor-pointer transition-all duration-300"
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-white/5">
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                      <img
                        src={bar.coverPhoto}
                        alt={bar.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm truncate group-hover:text-amber-400 transition-colors">
                        {bar.name}
                      </h4>
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{bar.city}, {bar.country}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-950/60 px-2 py-1 rounded-lg border border-white/5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-white">{bar.rating.toFixed(1)}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
