import React, { useState, useEffect } from 'react';
import { Bar, Review, UserProfile, BarEvent } from '../../types';
import { BAR_TYPES_META, getPriceString, formatDayName, isCurrentlyOpen } from '../../utils/barUtils';
import { addReview, reportBar, toggleFavorite, toggleVisited, toggleBucketList, getEvents } from '../../services/api';
import confetti from 'canvas-confetti';
import {
  X, Star, MapPin, Clock, Phone, Globe, Heart, CheckCircle2, BookmarkPlus,
  AlertTriangle, Send, MessageSquarePlus, Navigation, Sparkles, PartyPopper, Calendar, Users, ArrowRight, Plus,
} from 'lucide-react';

interface BarDetailModalProps {
  bar: Bar;
  onClose: () => void;
  userProfile: UserProfile | null;
  onUserProfileUpdate: (updated: UserProfile) => void;
  onAddToCrawl?: (bar: Bar) => void;
  onOpenEvents?: (barId: string) => void;
}

export const BarDetailModal: React.FC<BarDetailModalProps> = ({
  bar,
  onClose,
  userProfile,
  onUserProfileUpdate,
  onAddToCrawl,
  onOpenEvents,
}) => {
  const meta = BAR_TYPES_META[bar.type] || BAR_TYPES_META.cocktail;
  const status = isCurrentlyOpen(bar.hours);

  const [barEvents, setBarEvents] = useState<BarEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoadingEvents(true);
    getEvents({ barId: bar.id })
      .then((data) => {
        if (isMounted) setBarEvents(data);
      })
      .catch((err) => {
        console.error('Failed to load events for bar:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingEvents(false);
      });
    return () => {
      isMounted = false;
    };
  }, [bar.id]);

  const [reviews, setReviews] = useState<Review[]>((bar as any).reviews || []);
  const [currentRating, setCurrentRating] = useState(bar.rating);
  const [reviewCount, setReviewCount] = useState(bar.reviewCount);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Formulaire d'avis
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState(userProfile?.name || '');
  const [newRating, setNewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  // Formulaire de signalement
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Horaires incorrects');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSent, setReportSent] = useState(false);

  const isFavorite = userProfile?.favoriteBarIds.includes(bar.id);
  const isVisited = userProfile?.visitedBarIds.includes(bar.id);
  const isBucketList = userProfile?.bucketListBarIds.includes(bar.id);

  // Basculer favori
  const handleToggleFavorite = async () => {
    try {
      const updated = await toggleFavorite(bar.id);
      onUserProfileUpdate(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Basculer visité avec confetti
  const handleToggleVisited = async () => {
    try {
      const updated = await toggleVisited(bar.id);
      onUserProfileUpdate(updated);
      if (!isVisited) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ec4899', '#38bdf8'],
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Basculer liste d'envies
  const handleToggleBucketList = async () => {
    try {
      const updated = await toggleBucketList(bar.id);
      onUserProfileUpdate(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Soumission d'un avis
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const createdReview = await addReview(bar.id, {
        author: reviewAuthor || 'Voyageur Curieux',
        rating: newRating,
        comment: reviewComment,
      });

      setReviews([createdReview, ...reviews]);
      const newTotal = reviewCount + 1;
      const newAvg = Math.round(((currentRating * reviewCount + newRating) / newTotal) * 10) / 10;
      setCurrentRating(newAvg);
      setReviewCount(newTotal);

      setReviewComment('');
      setShowReviewForm(false);
      setReviewSuccessMsg('Merci pour votre avis !');
      setTimeout(() => setReviewSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'envoi de l\'avis');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Signalement
  const handleSubmitReport = async () => {
    try {
      await reportBar(bar.id, reportReason, reportDetails);
      setReportSent(true);
      setTimeout(() => {
        setReportSent(false);
        setShowReportModal(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] pointer-events-none flex justify-end">
      {/* Dim overlay on mobile only */}
      <div
        onClick={onClose}
        className="sm:hidden absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
      />

      {/* Main Panel */}
      <div className="pointer-events-auto w-full max-w-xl h-full bg-slate-950/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col overflow-hidden text-slate-200 animate-in slide-in-from-right duration-300 ease-out">
        
        {/* Hero Image Area */}
        <div className="relative w-full h-64 sm:h-80 flex-shrink-0 bg-slate-900 group">
          <img
            src={bar.photos[selectedPhotoIndex] || bar.coverPhoto}
            alt={bar.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Multi-stop gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950" />

          {/* Quick Action: View full map */}
          <button
            onClick={onClose}
            title="Explorer la carte des rues"
            className="absolute top-4 right-16 px-3 py-1.5 rounded-full bg-black/50 hover:bg-amber-500 hover:text-slate-950 text-white flex items-center gap-1.5 backdrop-blur-xl border border-white/15 shadow-xl transition-all font-bold text-xs cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Plein écran carte</span>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            title="Fermer la fiche"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xl border border-white/15 shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Status badge */}
          <div className="absolute top-16 right-4">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-2 backdrop-blur-md shadow-lg border ${
                status.isOpen 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-emerald-900/50' 
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30 shadow-rose-900/50'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {status.isOpen && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${status.isOpen ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              </span>
              {status.isOpen ? 'Ouvert' : 'Fermé'}
            </span>
          </div>

          {/* Type badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20 backdrop-blur-xl flex items-center gap-2 shadow-lg">
              <span className="text-base">{meta.emoji}</span>
              <span className="tracking-wide uppercase">{meta.label}</span>
            </span>
          </div>

          {/* Photo gallery thumbnails */}
          {bar.photos.length > 1 && (
            <div className="absolute bottom-6 right-6 flex items-center gap-2">
              {bar.photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedPhotoIndex(i)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    selectedPhotoIndex === i 
                      ? 'border-amber-400 scale-110 shadow-[0_0_15px_rgba(251,191,36,0.4)]' 
                      : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  <img src={photo} alt="miniature" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Bar name and location */}
          <div className="absolute bottom-6 left-6 right-32">
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight">
              {bar.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-medium flex items-center gap-1.5 mt-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="truncate">{bar.city}, {bar.country}</span>
            </p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8 custom-scrollbar">
          
          {/* Action buttons row */}
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={handleToggleFavorite}
              className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-2xl transition-all duration-300 group ${
                isFavorite
                  ? 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                  : 'bg-slate-900/50 hover:bg-slate-800 border-slate-800/50 hover:border-slate-700'
              } border`}
            >
              <Heart className={`w-6 h-6 transition-transform group-active:scale-90 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400 group-hover:text-slate-300'}`} />
              <span className={`text-[11px] font-semibold tracking-wide ${isFavorite ? 'text-rose-400' : 'text-slate-400 group-hover:text-slate-300'}`}>Favoris</span>
            </button>

            <button
              onClick={handleToggleVisited}
              className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-2xl transition-all duration-300 group ${
                isVisited
                  ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                  : 'bg-slate-900/50 hover:bg-slate-800 border-slate-800/50 hover:border-slate-700'
              } border`}
            >
              <CheckCircle2 className={`w-6 h-6 transition-transform group-active:scale-90 ${isVisited ? 'fill-emerald-500 text-slate-950' : 'text-slate-400 group-hover:text-slate-300'}`} />
              <span className={`text-[11px] font-semibold tracking-wide ${isVisited ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'}`}>Visité</span>
            </button>

            <button
              onClick={handleToggleBucketList}
              className={`flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-2xl transition-all duration-300 group ${
                isBucketList
                  ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-900/50 hover:bg-slate-800 border-slate-800/50 hover:border-slate-700'
              } border`}
            >
              <BookmarkPlus className={`w-6 h-6 transition-transform group-active:scale-90 ${isBucketList ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
              <span className={`text-[11px] font-semibold tracking-wide ${isBucketList ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'}`}>À tester</span>
            </button>

            <button
              onClick={() => onAddToCrawl && onAddToCrawl(bar)}
              className="flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-2xl transition-all duration-300 group bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            >
              <Sparkles className="w-6 h-6 text-amber-400 transition-transform group-active:scale-90 group-hover:rotate-12" />
              <span className="text-[11px] font-semibold tracking-wide text-amber-400">+ Crawl</span>
            </button>
          </div>

          {/* Rating & Price Line */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span className="text-sm">{currentRating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-slate-400 font-medium">({reviewCount} avis)</span>
            </div>
            <div className="text-amber-400 font-bold text-lg tracking-widest px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20">
              {getPriceString(bar.priceLevel)}
            </div>
          </div>

          {/* Description Section */}
          <div className="flex flex-col gap-4">
            {bar.tagline && (
              <p className="text-base sm:text-lg italic font-serif text-amber-100/90 border-l-4 border-amber-500 pl-4 py-1 bg-gradient-to-r from-amber-500/10 to-transparent">
                « {bar.tagline} »
              </p>
            )}
            <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed font-light">
              {bar.description}
            </p>
          </div>

          {/* Specialties & Vibes */}
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Spécialités & Saveurs</h3>
              <div className="flex flex-wrap gap-2">
                {bar.specialties.map((spec, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-300 border border-amber-500/30 shadow-sm"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Ambiance & Style</h3>
              <div className="flex flex-wrap gap-2">
                {bar.vibes.map((vibe, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500/10 to-fuchsia-600/10 text-purple-300 border border-purple-500/30 shadow-sm"
                  >
                    {vibe}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Amenities Grid */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Équipements</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: 'terrace', label: 'Terrasse', icon: '☀️' },
                { key: 'food', label: 'Restauration', icon: '🍔' },
                { key: 'happyHour', label: 'Happy Hour', icon: '🍹' },
                { key: 'liveMusic', label: 'Live Music', icon: '🎸' },
                { key: 'wifi', label: 'Wi-Fi', icon: '📶' },
                { key: 'accessible', label: 'Accès PMR', icon: '♿' },
              ].map((amenity) => {
                const hasAmenity = bar.amenities[amenity.key as keyof typeof bar.amenities];
                return (
                  <div
                    key={amenity.key}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      hasAmenity
                        ? 'bg-slate-800/80 border-slate-700 text-slate-200 shadow-sm'
                        : 'bg-slate-900/30 border-slate-800/50 text-slate-600'
                    }`}
                  >
                    <span className={`text-lg ${!hasAmenity && 'opacity-40 grayscale'}`}>{amenity.icon}</span>
                    <span className="text-xs font-medium">{amenity.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hours Table */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Horaires</span>
              </h3>
              <span className="text-xs text-amber-400 font-semibold px-2 py-1 bg-amber-400/10 rounded-md border border-amber-400/20">
                {status.label}
              </span>
            </div>

            {bar.hours ? (
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 text-sm flex flex-col gap-2 shadow-inner">
                {Object.entries(bar.hours).map(([dayKey, sched]) => {
                  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                  const isToday = days[new Date().getDay()] === dayKey;
                  return (
                    <div
                      key={dayKey}
                      className={`flex justify-between py-1.5 px-3 rounded-xl transition-colors ${
                        isToday ? 'bg-amber-500/20 font-bold text-amber-300 border border-amber-500/20' : 'text-slate-300 hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="capitalize">{formatDayName(dayKey)} {isToday && <span className="ml-1 text-xs opacity-75">(Aujourd'hui)</span>}</span>
                      <span className={sched.closed ? 'text-slate-500 italic' : ''}>{sched.closed ? 'Fermé' : `${sched.open} - ${sched.close}`}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-center">
                Horaires non communiqués
              </p>
            )}
          </div>

          {/* Contact Section */}
          <div className="flex flex-col gap-4 p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="flex items-start gap-3 relative z-10">
              <div className="p-2 bg-slate-800 rounded-lg mt-0.5">
                <MapPin className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-200 text-sm leading-snug">{bar.address}</p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${bar.lat},${bar.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold mt-2 text-xs uppercase tracking-wide group"
                >
                  <Navigation className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  <span>Y aller</span>
                </a>
              </div>
            </div>

            {(bar.phone || bar.website) && (
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-700/50 relative z-10">
                {bar.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <a href={`tel:${bar.phone}`} className="text-sm text-slate-300 hover:text-white transition-colors">
                      {bar.phone}
                    </a>
                  </div>
                )}
                {bar.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <a
                      href={bar.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline truncate transition-colors"
                    >
                      {bar.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Events / Meetups Section */}
          <div className="flex flex-col gap-4 p-5 bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 rounded-2xl border border-purple-500/20 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <PartyPopper className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Soirées & Rencontres</span>
                    {barEvents.length > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {barEvents.length}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">Rejoignez un groupe ou organisez un afterwork ici</p>
                </div>
              </div>

              {onOpenEvents && (
                <button
                  type="button"
                  onClick={() => onOpenEvents(bar.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-md shadow-purple-950/50 hover:scale-105 active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Proposer</span>
                </button>
              )}
            </div>

            {loadingEvents ? (
              <div className="py-4 text-center text-xs text-slate-400 animate-pulse">
                Chargement des soirées...
              </div>
            ) : barEvents.length > 0 ? (
              <div className="flex flex-col gap-2.5 relative z-10">
                {barEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => onOpenEvents && onOpenEvents(bar.id)}
                    className="group flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-950/20 transition-all cursor-pointer"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100 group-hover:text-purple-300 transition-colors truncate">
                          {evt.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 text-purple-400 font-medium">
                          <Calendar className="w-3 h-3" />
                          {new Date(evt.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} • {evt.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          {evt.participants.length} {evt.maxParticipants ? `/ ${evt.maxParticipants}` : ''}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-purple-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 relative z-10">
                <span>Aucune soirée programmée pour l'instant. Soyez le premier à réunir du monde !</span>
                {onOpenEvents && (
                  <button
                    type="button"
                    onClick={() => onOpenEvents(bar.id)}
                    className="text-purple-400 hover:text-purple-300 font-semibold whitespace-nowrap"
                  >
                    Créer un événement →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="flex flex-col gap-5 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Avis des explorateurs</span>
                <span className="text-sm font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">{reviews.length}</span>
              </h3>

              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="flex items-center gap-2 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(251,191,36,0.2)] hover:scale-105 active:scale-95"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Laisser un avis</span>
              </button>
            </div>

            {reviewSuccessMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-bold text-center animate-in zoom-in duration-300">
                {reviewSuccessMsg}
              </div>
            )}

            {/* Review Form */}
            {showReviewForm && (
              <form
                onSubmit={handleSubmitReview}
                className="p-5 bg-slate-900/80 border border-slate-700/50 rounded-2xl flex flex-col gap-4 text-sm animate-in slide-in-from-top-4 duration-300 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="font-bold text-white">Évaluez votre expérience</span>
                  <div className="flex items-center gap-1 bg-slate-950 p-2 rounded-xl border border-slate-800">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewRating(s)}
                        className="p-1 hover:scale-125 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            s <= newRating ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]' : 'text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={reviewAuthor}
                    onChange={(e) => setReviewAuthor(e.target.value)}
                    placeholder="Votre nom / pseudo"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                    required
                  />

                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Qu'avez-vous pensé de l'ambiance, des cocktails, de la musique ?"
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewForm(false)}
                    className="px-5 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                  >
                    <Send className="w-4 h-4" />
                    <span>Publier</span>
                  </button>
                </div>
              </form>
            )}

            {/* Review List */}
            <div className="flex flex-col gap-4">
              {reviews.length === 0 ? (
                <div className="text-center py-8 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                  <p className="text-sm text-slate-500 italic">Aucun avis rédigé pour le moment.</p>
                  <p className="text-sm text-slate-400 font-medium mt-1">Soyez le premier à partager votre expérience !</p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 flex flex-col gap-3 hover:bg-slate-900/80 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800">
                          <img
                            src={rev.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                            alt={rev.author}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-slate-200 block">{rev.author}</span>
                          <span className="text-xs text-slate-500">{new Date(rev.createdAt).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                      "{rev.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Report Link */}
          <div className="pt-8 pb-4 text-center mt-auto">
            <button
              onClick={() => setShowReportModal(true)}
              className="text-xs text-slate-500 hover:text-rose-400 flex items-center justify-center gap-1.5 mx-auto transition-colors group"
            >
              <AlertTriangle className="w-4 h-4 opacity-70 group-hover:opacity-100" />
              <span>Signaler une erreur ou une fermeture définitive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-slate-200 flex flex-col gap-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <div className="p-2 bg-rose-500/10 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <span>Signaler un problème</span>
            </h3>

            {reportSent ? (
              <div className="py-8 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm text-emerald-400 font-medium">Signalement envoyé. Merci !</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 text-sm">
                  <label className="text-slate-400 font-medium">Motif du signalement</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50"
                  >
                    <option value="Fermeture définitive">Bar définitivement fermé</option>
                    <option value="Horaires incorrects">Horaires d'ouverture erronés</option>
                    <option value="Adresse erronée">Mauvais emplacement sur la carte</option>
                    <option value="Autre erreur">Autre information erronée</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 text-sm">
                  <label className="text-slate-400 font-medium">Détails complémentaires</label>
                  <textarea
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Précisions utiles pour les modérateurs..."
                    rows={3}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 resize-none focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setShowReportModal(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-medium">
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-colors"
                  >
                    Envoyer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
