import React, { useState } from 'react';
import { FilterState, BarType } from '../../types';
import { BAR_TYPES_META, CITIES_SHORTCUTS } from '../../utils/barUtils';
import { Search, X, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  totalResults: number;
  onCitySelect: (city: { name: string; query: string; coords: [number, number]; zoom: number }) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  totalResults,
  onCitySelect,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (val: string) => {
    onFilterChange({ ...filters, search: val });
  };

  const handleTypeToggle = (type: BarType) => {
    const exists = filters.types.includes(type);
    const newTypes = exists
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFilterChange({ ...filters, types: newTypes });
  };

  const handlePriceToggle = (price: number) => {
    const exists = filters.priceLevels.includes(price);
    const newPrices = exists
      ? filters.priceLevels.filter((p) => p !== price)
      : [...filters.priceLevels, price];
    onFilterChange({ ...filters, priceLevels: newPrices });
  };

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFilterChange({
      search: '',
      city: 'all',
      country: '',
      types: [],
      priceLevels: [],
      minRating: 0,
      openNow: false,
      terrace: false,
      food: false,
      happyHour: false,
      liveMusic: false,
      vibe: '',
    });
  };

  const hasActiveFilters =
    filters.search !== '' ||
    filters.city !== 'all' ||
    filters.types.length > 0 ||
    filters.priceLevels.length > 0 ||
    filters.minRating > 0 ||
    filters.openNow ||
    filters.terrace ||
    filters.food ||
    filters.happyHour ||
    filters.liveMusic ||
    filters.vibe !== '';

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-5xl z-50 flex flex-col gap-3 px-3 sm:px-4">
      {/* Main Search Bar - Glassmorphism */}
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 flex flex-col p-3 transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input Container */}
          <div className="relative w-full sm:flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-white/50 group-focus-within:text-amber-400 transition-colors duration-300" />
            </div>
            <input
              type="text"
              placeholder="Rechercher un bar, un lieu, une ambiance..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-black/20 text-white placeholder-white/40 border border-white/5 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 focus:bg-white/10 transition-all duration-300 shadow-inner shadow-black/50"
            />
            {filters.search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white/80 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            {/* Quick Filters */}
            <button
              onClick={() => updateFilter('openNow', !filters.openNow)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 border ${
                filters.openNow
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-black/20 border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                {filters.openNow && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${filters.openNow ? 'bg-green-500' : 'bg-white/30'}`}></span>
              </span>
              Ouvert
            </button>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex-1 sm:flex-none relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 border ${
                showAdvanced || hasActiveFilters
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-black/20 border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filtres</span>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border-2 border-black/80"></span>
                </span>
              )}
            </button>

            {/* Results Counter Badge (Mobile Hidden) */}
            <div className="hidden md:flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold px-3 py-2.5 rounded-xl whitespace-nowrap min-w-[100px] shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              {totalResults} résultat{totalResults > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* City Shortcuts (Scrollable) */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {CITIES_SHORTCUTS.map((city) => {
            const isActive = filters.city === city.query;
            return (
              <button
                key={city.name}
                onClick={() => {
                  updateFilter('city', city.query);
                  onCitySelect(city as any);
                }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 snap-start hover:-translate-y-0.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <span>{city.emoji}</span>
                <span>{city.name}</span>
              </button>
            );
          })}
        </div>

        {/* Bar Types Shortcuts */}
        <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => onFilterChange({ ...filters, types: [] })}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 snap-start hover:-translate-y-0.5 ${
              filters.types.length === 0
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-transparent border border-white/5 text-white/50 hover:text-white/90 hover:bg-white/5'
            }`}
          >
            Tous les styles
          </button>
          {(Object.keys(BAR_TYPES_META) as BarType[]).map((typeKey) => {
            const meta = BAR_TYPES_META[typeKey];
            const isSelected = filters.types.includes(meta.type);
            return (
              <button
                key={meta.type}
                onClick={() => handleTypeToggle(meta.type)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border snap-start hover:-translate-y-0.5 ${
                  isSelected
                    ? 'text-white'
                    : 'bg-transparent border-white/5 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: `${meta.accentHex}33`,
                        borderColor: `${meta.accentHex}80`,
                        boxShadow: `0 0 10px ${meta.accentHex}33`,
                      }
                    : {}
                }
              >
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Filters Sliding Panel */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          showAdvanced ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col gap-6">
          {/* Header of Advanced Panel */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-white/90 text-sm font-semibold tracking-wide flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              Filtres détaillés
            </h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 bg-red-400/10 hover:bg-red-400/20 rounded-lg border border-red-400/20"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Réinitialiser tout
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price Level Segments */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">Gamme de Prix</span>
              <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                {[1, 2, 3, 4].map((level) => {
                  const isSelected = filters.priceLevels.includes(level);
                  const priceStr = '€'.repeat(level);
                  return (
                    <button
                      key={level}
                      onClick={() => handlePriceToggle(level)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all duration-300 ${
                        isSelected
                          ? 'bg-white/15 text-amber-400 shadow-sm border border-white/10'
                          : 'text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {priceStr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rating Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">Note minimale</span>
                <span className="text-amber-400 text-xs font-bold">{filters.minRating > 0 ? `≥ ${filters.minRating} ★` : 'Toutes'}</span>
              </div>
              <div className="pt-2">
                <input
                  type="range"
                  min="0"
                  max="4.8"
                  step="0.2"
                  value={filters.minRating}
                  onChange={(e) => updateFilter('minRating', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
                />
              </div>
            </div>

            {/* Vibe input */}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">Ambiance recherchée</span>
              <input
                type="text"
                value={filters.vibe}
                onChange={(e) => updateFilter('vibe', e.target.value)}
                placeholder="Ex: Cosy, Romantique, Live Jazz..."
                className="w-full bg-black/20 text-white placeholder-white/30 border border-white/5 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 focus:bg-white/10 transition-all duration-300"
              />
            </div>
          </div>

          {/* Amenities Chips */}
          <div className="pt-2 border-t border-white/5">
            <span className="text-xs text-white/50 uppercase tracking-wider font-semibold mb-3 block">Commodités & Services</span>
            <div className="flex flex-wrap gap-2.5">
              {[
                { key: 'terrace', label: 'Terrasse extérieure', icon: '☀️' },
                { key: 'food', label: 'Restauration / Tapas', icon: '🍔' },
                { key: 'happyHour', label: 'Happy Hour', icon: '🍹' },
                { key: 'liveMusic', label: 'Musique Live', icon: '🎸' },
              ].map(({ key, label, icon }) => {
                const k = key as keyof FilterState;
                const isSelected = filters[k] as boolean;
                return (
                  <button
                    key={key}
                    onClick={() => updateFilter(k, !isSelected)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-medium transition-all duration-300 ${
                      isSelected
                        ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                        : 'bg-black/30 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white hover:border-white/10'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
