import React, { useEffect } from 'react';
import { Badge, BadgeTier } from '../../types';
import confetti from 'canvas-confetti';
import { Trophy, X, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

interface BadgeUnlockModalProps {
  badges: Badge[];
  onClose: () => void;
  onOpenProfile?: () => void;
}

const TIER_META: Record<BadgeTier, { label: string; icon: string; badgeClass: string; borderClass: string; bgGradient: string }> = {
  bronze: {
    label: 'Palier Bronze',
    icon: '🥉',
    badgeClass: 'bg-amber-800/40 text-amber-200 border-amber-600/50',
    borderClass: 'border-amber-700/50',
    bgGradient: 'from-amber-950/40 via-slate-900 to-slate-950',
  },
  silver: {
    label: 'Palier Argent',
    icon: '🥈',
    badgeClass: 'bg-slate-300/20 text-slate-100 border-slate-300/40',
    borderClass: 'border-slate-300/50',
    bgGradient: 'from-slate-800/40 via-slate-900 to-slate-950',
  },
  gold: {
    label: 'Palier Or',
    icon: '🥇',
    badgeClass: 'bg-amber-400/25 text-amber-300 border-amber-400/60',
    borderClass: 'border-amber-400/60',
    bgGradient: 'from-amber-500/20 via-slate-900 to-slate-950',
  },
  diamond: {
    label: 'Palier Diamant',
    icon: '💎',
    badgeClass: 'bg-cyan-400/25 text-cyan-200 border-cyan-400/60 shadow-[0_0_10px_rgba(34,211,238,0.3)]',
    borderClass: 'border-cyan-400/70 shadow-[0_0_20px_rgba(34,211,238,0.2)]',
    bgGradient: 'from-cyan-950/50 via-indigo-950/30 to-slate-950',
  },
};

export const BadgeUnlockModal: React.FC<BadgeUnlockModalProps> = ({
  badges,
  onClose,
  onOpenProfile,
}) => {
  useEffect(() => {
    // Explosion festive de confettis dorés et multicolores
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#38bdf8'],
    });

    const timer = setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 110,
        origin: { y: 0.4 },
        colors: ['#fbbf24', '#38bdf8', '#8b5cf6'],
      });
    }, 450);

    return () => clearTimeout(timer);
  }, []);

  if (!badges || badges.length === 0) return null;

  const totalPointsAwarded = badges.reduce((sum, b) => sum + (b.points || 10), 0);

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-2 border-amber-400/60 rounded-3xl p-6 text-center shadow-[0_0_60px_rgba(251,191,36,0.35)] flex flex-col items-center animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-amber-500/20 to-transparent pointer-events-none" />
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Trophy icon */}
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.5)]">
            <Trophy className="w-9 h-9 animate-bounce" />
          </div>
          <Sparkles className="w-5 h-5 text-amber-300 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '4s' }} />
        </div>

        {/* Title */}
        <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          Nouveau Palier Validé !
        </span>

        <h3 className="text-xl font-black text-white font-['Space_Grotesk'] mb-2">
          {badges.length > 1 ? `${badges.length} Trophées Débloqués !` : 'Félicitations !'}
        </h3>

        <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-extrabold text-xs">
          <span>+{totalPointsAwarded} Points d'Exploration 🌟</span>
        </div>

        {/* Badges list */}
        <div className="w-full flex flex-col gap-3 my-1 max-h-64 overflow-y-auto custom-scrollbar">
          {badges.map((b) => {
            const tierMeta = TIER_META[b.tier || 'bronze'];
            return (
              <div
                key={b.id}
                className={`p-3.5 bg-gradient-to-r ${tierMeta.bgGradient} rounded-2xl border ${tierMeta.borderClass} flex items-center gap-3 text-left shadow-lg relative overflow-hidden`}
              >
                <div className="text-3xl p-2 rounded-xl bg-slate-950/80 border border-white/10 flex-shrink-0 shadow-inner">
                  {b.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <h4 className="font-bold text-sm text-white truncate">{b.name}</h4>
                    <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full border ${tierMeta.badgeClass} whitespace-nowrap`}>
                      {tierMeta.icon} {tierMeta.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-snug line-clamp-2">
                    {b.description}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>+{b.points || 10} XP débloqués</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="w-full flex flex-col gap-2 mt-5">
          {onOpenProfile && (
            <button
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Trophy className="w-4 h-4" />
              <span>Voir mes paliers dans le profil</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-colors"
          >
            Continuer l'exploration
          </button>
        </div>
      </div>
    </div>
  );
};
