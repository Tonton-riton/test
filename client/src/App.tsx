import React, { useState, useEffect, useCallback } from 'react';
import { Bar, BarCrawl, FilterState, UserProfile, Badge } from './types';
import { getBars, getUserProfile, getBarById } from './services/api';
import { BarMap } from './components/map/BarMap';
import { BarGlobe3D } from './components/map/BarGlobe3D';
import { FilterBar } from './components/filters/FilterBar';
import { BarDetailModal } from './components/bar/BarDetailModal';
import { CrawlModal } from './components/crawl/CrawlModal';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { AddBarModal } from './components/contribute/AddBarModal';
import { RandomBarModal } from './components/discovery/RandomBarModal';
import { OsmImportModal } from './components/map/OsmImportModal';
import { EventsModal } from './components/events/EventsModal';
import { BadgeUnlockModal } from './components/common/BadgeUnlockModal';
import {
  Footprints,
  PlusCircle,
  Dices,
  Locate,
  DownloadCloud,
  Menu,
  X,
  GlassWater,
  Globe,
  Map as MapIcon,
  PartyPopper,
} from 'lucide-react';

const DEFAULT_FILTERS: FilterState = {
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
};

export const App: React.FC = () => {
  const [bars, setBars] = useState<Bar[]>([]);
  const [totalBars, setTotalBars] = useState(0);
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [activeCrawl, setActiveCrawl] = useState<BarCrawl | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [isCrawlModalOpen, setIsCrawlModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAddBarModalOpen, setIsAddBarModalOpen] = useState(false);
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
  const [isOsmImportModalOpen, setIsOsmImportModalOpen] = useState(false);
  const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
  const [eventDefaultBarId, setEventDefaultBarId] = useState<string | undefined>(undefined);
  const [unlockedBadgesCelebration, setUnlockedBadgesCelebration] = useState<Badge[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [targetCoords, setTargetCoords] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [isPinDropperActive, setIsPinDropperActive] = useState(false);
  const [droppedCoords, setDroppedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<'globe' | 'map'>('globe');

  useEffect(() => {
    loadBars();
    loadProfile();
  }, [filters]);

  const loadBars = async () => {
    try {
      const data = await getBars(filters);
      setBars(data.bars);
      setTotalBars(data.total);
    } catch (err) { console.error(err); }
  };

  const loadProfile = async () => {
    try { setUserProfile(await getUserProfile()); } catch (err) { console.error(err); }
  };

  const handleCelebrateBadges = (badges: Badge[]) => {
    if (badges && badges.length > 0) {
      setUnlockedBadgesCelebration(badges);
      loadProfile();
    }
  };

  const handleSelectBar = useCallback(async (bar: Bar) => {
    // Switch to real normal map at street level
    setViewMode('map');
    setTargetCoords({ lat: bar.lat, lng: bar.lng, zoom: 17 });

    try {
      const full = await getBarById(bar.id);
      setSelectedBar(full as any);
    } catch {
      setSelectedBar(bar);
    }
  }, []);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return alert('Géolocalisation non supportée');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(c);
        setTargetCoords({ ...c, zoom: 14 });
      },
      (err) => alert('Position impossible : ' + err.message),
      { enableHighAccuracy: true }
    );
  };

  const handleCitySelect = (city: { name: string; query: string; coords: [number, number]; zoom: number }) => {
    setFilters((p) => ({ ...p, city: city.query }));
    setTargetCoords({ lat: city.coords[0], lng: city.coords[1], zoom: city.zoom });
  };

  const handleBarCreated = (newBar: Bar) => {
    setBars((p) => [newBar, ...p]);
    setTotalBars((p) => p + 1);
    setSelectedBar(newBar);
    setTargetCoords({ lat: newBar.lat, lng: newBar.lng, zoom: 16 });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030712]">
      {/* ═══════════ HEADER ═══════════ */}
      <header className="absolute top-0 inset-x-0 z-[1100] h-[60px]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#030712ee] to-transparent pointer-events-none" />
        <div className="relative h-full flex items-center justify-between px-4 lg:px-6">
          {/* Logo */}
          <button
            onClick={() => { setFilters(DEFAULT_FILTERS); setTargetCoords({ lat: 25, lng: 10, zoom: 3 }); }}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-[2px] shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/40 transition-shadow">
              <div className="w-full h-full rounded-[10px] bg-[#0a0e1a] flex items-center justify-center">
                <GlassWater className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-extrabold text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  BarAtlas
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-[1px] rounded bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950">
                  World
                </span>
              </div>
              <p className="text-[9px] text-slate-500 font-medium -mt-0.5 tracking-wide">
                Carte mondiale des bars
              </p>
            </div>
          </button>

          {/* Desktop Actions */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {/* View Mode Toggle (3D Globe vs 2D Map) */}
            <div className="flex items-center p-0.5 rounded-xl bg-white/5 border border-white/10 shadow-inner mr-1">
              <button
                onClick={() => setViewMode('globe')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  viewMode === 'globe'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Globe 3D</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  viewMode === 'map'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Carte 2D</span>
              </button>
            </div>

            <NavButton
              icon={<PartyPopper className="w-3.5 h-3.5" />}
              label="Soirées & Rencontres"
              color="rose"
              onClick={() => {
                setEventDefaultBarId(undefined);
                setIsEventsModalOpen(true);
              }}
            />
            <NavButton icon={<Dices className="w-3.5 h-3.5" />} label="Surprends-moi" color="purple" onClick={() => setIsRandomModalOpen(true)} />
            <NavButton icon={<Locate className="w-3.5 h-3.5" />} label="Autour de moi" color="cyan" onClick={handleLocateMe} />
            <NavButton
              icon={<Footprints className="w-3.5 h-3.5" />}
              label={activeCrawl ? '🔥 Crawl actif' : 'Bar Crawls'}
              color="amber"
              active={!!activeCrawl}
              onClick={() => setIsCrawlModalOpen(true)}
            />
            <NavButton icon={<DownloadCloud className="w-3.5 h-3.5" />} label="Import OSM" color="slate" onClick={() => setIsOsmImportModalOpen(true)} />

            <div className="w-px h-6 bg-white/10 mx-1" />

            <button
              onClick={() => setIsAddBarModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold
                         bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950
                         shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40
                         hover:from-amber-400 hover:to-orange-400
                         active:scale-[0.97] transition-all duration-200"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Ajouter un bar</span>
            </button>
          </nav>

          {/* Profile + Mobile toggle */}
          <div className="flex items-center gap-2">
            {userProfile && (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full
                           bg-white/5 hover:bg-white/10 border border-white/10
                           transition-all duration-200 active:scale-[0.97]"
              >
                <img
                  src={userProfile.avatar}
                  alt=""
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-amber-500/40"
                />
                <span className="text-[11px] font-semibold text-slate-200 hidden sm:block">
                  {userProfile.name.split(' ')[0]}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300
                         flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-[60px] inset-x-0 z-[1200] bg-[#030712ee] backdrop-blur-2xl border-b border-white/10 p-3 flex flex-col gap-1.5 animate-slide-up">
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 mb-1">
            <button
              onClick={() => { setViewMode('globe'); setIsMobileMenuOpen(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'globe'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950'
                  : 'text-slate-400'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Globe 3D</span>
            </button>
            <button
              onClick={() => { setViewMode('map'); setIsMobileMenuOpen(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'map'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950'
                  : 'text-slate-400'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>Carte 2D</span>
            </button>
          </div>

          {[
            { icon: <PartyPopper className="w-4 h-4 text-rose-400" />, label: 'Soirées & Rencontres', action: () => { setEventDefaultBarId(undefined); setIsEventsModalOpen(true); } },
            { icon: <Dices className="w-4 h-4" />, label: 'Surprends-moi !', action: () => setIsRandomModalOpen(true) },
            { icon: <Locate className="w-4 h-4" />, label: 'Autour de moi', action: handleLocateMe },
            { icon: <Footprints className="w-4 h-4" />, label: 'Tournées & Crawls', action: () => setIsCrawlModalOpen(true) },
            { icon: <DownloadCloud className="w-4 h-4" />, label: 'Import OpenStreetMap', action: () => setIsOsmImportModalOpen(true) },
            { icon: <PlusCircle className="w-4 h-4" />, label: 'Ajouter un bar', action: () => setIsAddBarModalOpen(true) },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => { item.action(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-slate-200
                         bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ═══════════ FILTER BAR (floating) ═══════════ */}
      <div className="absolute top-[68px] inset-x-0 z-[1000] pointer-events-none">
        <div className="pointer-events-auto">
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            totalResults={totalBars}
            onCitySelect={handleCitySelect}
          />
        </div>
      </div>

      {/* ═══════════ MAP / GLOBE 3D ═══════════ */}
      <main className="absolute inset-0">
        {viewMode === 'globe' ? (
          <BarGlobe3D
            bars={bars}
            selectedBar={selectedBar}
            onSelectBar={handleSelectBar}
            activeCrawl={activeCrawl}
            isPinDropperActive={isPinDropperActive}
            onPinDropped={(lat, lng) => { setDroppedCoords({ lat, lng }); setIsPinDropperActive(false); setIsAddBarModalOpen(true); }}
            userLocation={userLocation}
            targetCoords={targetCoords}
          />
        ) : (
          <BarMap
            bars={bars}
            selectedBar={selectedBar}
            onSelectBar={handleSelectBar}
            activeCrawl={activeCrawl}
            isPinDropperActive={isPinDropperActive}
            onPinDropped={(lat, lng) => { setDroppedCoords({ lat, lng }); setIsPinDropperActive(false); setIsAddBarModalOpen(true); }}
            userLocation={userLocation}
            targetCoords={targetCoords}
            onBackToGlobe={() => setViewMode('globe')}
          />
        )}
      </main>

      {/* ═══════════ MODALS ═══════════ */}
      {selectedBar && (
        <BarDetailModal
          bar={selectedBar}
          onClose={() => setSelectedBar(null)}
          userProfile={userProfile}
          onUserProfileUpdate={setUserProfile}
          onAddToCrawl={() => setIsCrawlModalOpen(true)}
          onOpenEvents={(barId) => { setEventDefaultBarId(barId); setIsEventsModalOpen(true); }}
        />
      )}
      {isEventsModalOpen && (
        <EventsModal
          onClose={() => setIsEventsModalOpen(false)}
          bars={bars}
          defaultBarId={eventDefaultBarId}
          onSelectBar={handleSelectBar}
          onBadgeUnlocked={handleCelebrateBadges}
        />
      )}
      {isCrawlModalOpen && (
        <CrawlModal
          onClose={() => setIsCrawlModalOpen(false)}
          availableBars={bars}
          onActivateCrawl={setActiveCrawl}
          activeCrawl={activeCrawl}
          onSelectBar={handleSelectBar}
        />
      )}
      {isProfileModalOpen && userProfile && (
        <UserProfileModal
          user={userProfile}
          onClose={() => setIsProfileModalOpen(false)}
          allBars={bars}
          onSelectBar={handleSelectBar}
          onOpenEvents={() => setIsEventsModalOpen(true)}
        />
      )}
      {isAddBarModalOpen && (
        <AddBarModal
          onClose={() => setIsAddBarModalOpen(false)}
          onBarCreated={handleBarCreated}
          droppedCoords={droppedCoords}
          onStartPinDrop={() => { setIsPinDropperActive(true); setIsAddBarModalOpen(false); }}
        />
      )}
      {isRandomModalOpen && (
        <RandomBarModal
          bars={bars}
          onClose={() => setIsRandomModalOpen(false)}
          onSelectBar={(b) => { handleSelectBar(b); setTargetCoords({ lat: b.lat, lng: b.lng, zoom: 15 }); }}
        />
      )}
      {isOsmImportModalOpen && (
        <OsmImportModal
          onClose={() => setIsOsmImportModalOpen(false)}
          onImportComplete={loadBars}
          defaultCoords={targetCoords || { lat: 48.8566, lng: 2.3522 }}
        />
      )}
      {unlockedBadgesCelebration.length > 0 && (
        <BadgeUnlockModal
          badges={unlockedBadgesCelebration}
          onClose={() => setUnlockedBadgesCelebration([])}
          onOpenProfile={() => {
            setUnlockedBadgesCelebration([]);
            setIsProfileModalOpen(true);
          }}
        />
      )}
    </div>
  );
};

/* ── Small reusable nav button ── */
function NavButton({ icon, label, color, active, onClick }: {
  icon: React.ReactNode; label: string; color: string; active?: boolean; onClick: () => void;
}) {
  const colorMap: Record<string, string> = {
    purple: active
      ? 'bg-purple-500 text-white border-purple-400 shadow-purple-500/30'
      : 'bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20',
    cyan: active
      ? 'bg-cyan-500 text-white border-cyan-400 shadow-cyan-500/30'
      : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20 hover:bg-cyan-500/20',
    amber: active
      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/30 font-black'
      : 'bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20',
    slate: 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200',
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold border
                  transition-all duration-200 active:scale-[0.97] shadow-sm ${colorMap[color] || colorMap.slate}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default App;
