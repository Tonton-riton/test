import React, { useState, useEffect, useRef } from 'react';
import { Bar } from '../../types';
import { BAR_TYPES_META, getPriceString } from '../../utils/barUtils';
import { X, Dices, Star, MapPin, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';

interface RandomBarModalProps {
  bars: Bar[];
  onClose: () => void;
  onSelectBar: (bar: Bar) => void;
}

export const RandomBarModal: React.FC<RandomBarModalProps> = ({
  bars,
  onClose,
  onSelectBar,
}) => {
  const [isSpinning, setIsSpinning] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chosenBar, setChosenBar] = useState<Bar | null>(null);

  useEffect(() => {
    if (bars.length === 0) return;

    let count = 0;
    const maxSpins = 20;
    const interval = setInterval(() => {
      const rand = Math.floor(Math.random() * bars.length);
      setCurrentIndex(rand);
      count++;

      if (count >= maxSpins) {
        clearInterval(interval);
        setChosenBar(bars[rand]);
        setIsSpinning(false);
      }
    }, 90);

    return () => clearInterval(interval);
  }, [bars]);

  const activeBar = chosenBar || bars[currentIndex] || bars[0];
  const meta = activeBar ? BAR_TYPES_META[activeBar.type] : null;

  const handleGo = () => {
    if (chosenBar) {
      onSelectBar(chosenBar);
      onClose();
    }
  };

  const spinAgain = () => {
    setIsSpinning(true);
    setChosenBar(null);
    let count = 0;
    const maxSpins = 18;
    const interval = setInterval(() => {
      const rand = Math.floor(Math.random() * bars.length);
      setCurrentIndex(rand);
      count++;

      if (count >= maxSpins) {
        clearInterval(interval);
        setChosenBar(bars[rand]);
        setIsSpinning(false);
      }
    }, 80);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-slate-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-200 relative animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/50 backdrop-blur-md relative z-20">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-amber-400 font-black text-lg">
              <Sparkles className="w-5 h-5" />
              <span>Surprends-moi !</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Laisse le hasard choisir...</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content area */}
        <div className="relative">
          {isSpinning ? (
            <div className="flex flex-col items-center justify-center py-24 px-6 space-y-8 bg-slate-900/50">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full scale-150"></div>
                <Dices className="w-24 h-24 text-amber-400 animate-spin relative z-10" />
                
                {/* Particle effects around the dice */}
                <div className="absolute top-0 left-0 w-full h-full">
                  <Sparkles className="w-6 h-6 text-amber-300 absolute -top-4 -left-4 animate-ping" />
                  <Sparkles className="w-4 h-4 text-pink-400 absolute bottom-0 -right-4 animate-pulse" />
                  <Star className="w-5 h-5 text-sky-400 absolute -bottom-6 left-4 animate-bounce" />
                </div>
              </div>
              <p className="text-amber-400/80 font-semibold animate-pulse text-lg tracking-wide">
                Recherche de la pépite...
              </p>
            </div>
          ) : (
            activeBar && (
              <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Hero image with gradient */}
                <div className="relative h-64 w-full bg-slate-900">
                  <img
                    src={activeBar.coverPhoto}
                    alt={activeBar.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  
                  {meta && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg">
                        <span>{meta.emoji}</span>
                        <span>{meta.label}</span>
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 px-6 pb-4">
                    <h2 className="text-3xl font-black text-white mb-2 leading-tight drop-shadow-md">
                      {activeBar.name}
                    </h2>
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-200 drop-shadow">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span>{activeBar.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>{activeBar.rating.toFixed(1)}</span>
                      </div>
                      <div className="text-amber-400/90 font-bold">
                        {getPriceString ? getPriceString(activeBar.priceLevel) : '€'.repeat(activeBar.priceLevel)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details and Actions */}
                <div className="p-6 pt-4 space-y-6 bg-slate-950">
                  <p className="text-slate-400 text-sm leading-relaxed italic">
                    {activeBar.tagline ? `« ${activeBar.tagline} »` : activeBar.description?.slice(0, 120) + '...'}
                  </p>
                  
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      onClick={handleGo}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                    >
                      Voir sur la carte
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={spinAgain}
                      className="w-full py-3.5 px-4 border-2 border-white/5 hover:bg-white/5 text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Relancer
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
