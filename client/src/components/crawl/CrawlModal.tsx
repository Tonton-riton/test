import React, { useState, useEffect } from 'react';
import { Bar, BarCrawl } from '../../types';
import { getCrawls, createCrawl } from '../../services/api';
import { X, Footprints, MapPin, Plus, Trash2, Play, Trophy, Clock } from 'lucide-react';

interface CrawlModalProps {
  onClose: () => void;
  availableBars: Bar[];
  onActivateCrawl: (crawl: BarCrawl | null) => void;
  activeCrawl: BarCrawl | null;
  onSelectBar: (bar: Bar) => void;
}

export const CrawlModal: React.FC<CrawlModalProps> = ({
  onClose,
  availableBars,
  onActivateCrawl,
  activeCrawl,
  onSelectBar,
}) => {
  const [crawls, setCrawls] = useState<BarCrawl[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'create' | 'active'>('list');
  const [selectedCrawlDetail, setSelectedCrawlDetail] = useState<BarCrawl | null>(null);

  // Formulaire de création de Bar Crawl
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newStops, setNewStops] = useState<{ bar: Bar; notes: string }[]>([]);
  const [selectedBarToAdd, setSelectedBarToAdd] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCrawls();
  }, []);

  const loadCrawls = async () => {
    setLoading(true);
    try {
      const data = await getCrawls();
      setCrawls(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCrawlDetail = async (crawl: BarCrawl) => {
    try {
      setSelectedCrawlDetail(crawl);
      setViewMode('detail');
    } catch (err) {
      console.error(err);
    }
  };

  const handleActivate = (crawl: BarCrawl) => {
    onActivateCrawl(crawl);
    onClose();
  };

  const handleDeactivate = () => {
    onActivateCrawl(null);
    setViewMode('list');
  };

  // Ajout d'un bar à la nouvelle tournée
  const handleAddStop = () => {
    if (!selectedBarToAdd) return;
    const bar = availableBars.find((b) => b.id === selectedBarToAdd);
    if (!bar) return;

    if (newStops.some((s) => s.bar.id === bar.id)) {
      alert('Ce bar est déjà dans votre tournée');
      return;
    }

    if (newStops.length === 0 && !newCity) {
      setNewCity(bar.city);
    }

    setNewStops([...newStops, { bar, notes: '' }]);
    setSelectedBarToAdd('');
  };

  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newStops.length) return;
    const copy = [...newStops];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setNewStops(copy);
  };

  const handleRemoveStop = (index: number) => {
    setNewStops(newStops.filter((_, i) => i !== index));
  };

  // Calcul estimation de distance et temps pour la nouvelle tournée
  const calculateCrawlMetrics = () => {
    if (newStops.length < 2) return { km: 0, minutes: 0 };
    let totalKm = 0;
    for (let i = 0; i < newStops.length - 1; i++) {
      const b1 = newStops[i].bar;
      const b2 = newStops[i + 1].bar;
      const dLat = ((b2.lat - b1.lat) * Math.PI) / 180;
      const dLon = ((b2.lng - b1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((b1.lat * Math.PI) / 180) *
          Math.cos((b2.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalKm += 6371 * c;
    }
    const roundedKm = Math.round(totalKm * 10) / 10;
    const walkMinutes = Math.round(roundedKm * 15);
    const barMinutes = newStops.length * 50;
    return { km: roundedKm, minutes: walkMinutes + barMinutes };
  };

  const metrics = calculateCrawlMetrics();

  // Création effective du crawl
  const handleCreateCrawlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStops.length < 2) {
      alert('Veuillez ajouter au moins 2 bars pour créer un Bar Crawl');
      return;
    }

    setIsSubmitting(true);
    try {
      const stops = newStops.map((s, idx) => ({
        barId: s.bar.id,
        order: idx + 1,
        suggestedDurationMinutes: 60,
        notes: s.notes,
      }));

      const created = await createCrawl({
        title: newTitle,
        description: newDescription || 'Tournée créée par la communauté',
        city: newCity || newStops[0].bar.city,
        country: newStops[0].bar.country,
        author: 'Explorateur',
        stops,
        estimatedTotalTimeMinutes: metrics.minutes,
        estimatedWalkingKm: metrics.km,
      });

      onActivateCrawl(created);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création du crawl');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'list', label: 'Tournées populaires' },
    { id: 'create', label: 'Créer une tournée' },
  ];
  if (activeCrawl) {
    tabs.push({ id: 'active', label: 'Tournée active' });
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-0 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl bg-slate-950 border border-white/10 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 animate-in zoom-in-95 duration-300 relative">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-slate-950/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-900/40 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-900/20">
              <Footprints className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Bar Crawls</h2>
              <p className="text-sm text-slate-400 font-medium">Itinéraires nocturnes curatés</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white/5 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        {viewMode !== 'detail' && (
          <div className="px-6 pt-4 border-b border-white/5 bg-slate-950/50">
            <div className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as any)}
                  className={`pb-4 text-sm font-semibold transition-all relative ${
                    viewMode === tab.id
                      ? 'text-amber-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                  {viewMode === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-t-full shadow-[0_-2px_10px_rgba(251,191,36,0.5)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          
          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                  <p className="text-slate-500 font-medium text-sm">Découverte des parcours...</p>
                </div>
              ) : crawls.length === 0 ? (
                <div className="py-20 text-center text-slate-500 font-medium">
                  Aucun parcours pour l'instant.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {crawls.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => openCrawlDetail(c)}
                      className="group cursor-pointer bg-slate-900 border border-white/5 hover:border-amber-500/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:-translate-y-1"
                    >
                      <div className="p-5 flex flex-col h-full justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                              <MapPin className="w-3.5 h-3.5" />
                              {c.city}
                            </span>
                            <span className="text-slate-400 text-xs font-medium bg-slate-800/50 px-2.5 py-1 rounded-lg">
                              {c.stops.length} étapes
                            </span>
                          </div>
                          
                          <div>
                            <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors leading-tight">
                              {c.title}
                            </h3>
                            <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                              {c.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <Footprints className="w-4 h-4 text-amber-500" />
                              {c.estimatedWalkingKm} km
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-amber-500" />
                              {Math.round((c.estimatedTotalTimeMinutes || 180) / 60)}h
                            </span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                            <Play className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-950 ml-0.5" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DETAIL VIEW */}
          {viewMode === 'detail' && selectedCrawlDetail && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500 space-y-6">
              <button
                onClick={() => setViewMode('list')}
                className="text-slate-400 hover:text-amber-400 flex items-center gap-2 font-semibold text-sm transition-colors w-fit"
              >
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                  ←
                </div>
                Retour aux tournées
              </button>

              <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                
                <div className="relative z-10 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/20">
                      {selectedCrawlDetail.city}, {selectedCrawlDetail.country}
                    </span>
                    <span className="text-slate-400 text-sm font-medium flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500/70" />
                      Par {selectedCrawlDetail.author}
                    </span>
                  </div>
                  
                  <h3 className="text-3xl font-black text-white tracking-tight">{selectedCrawlDetail.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed max-w-xl">{selectedCrawlDetail.description}</p>

                  <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Distance</span>
                      <span className="flex items-center gap-2 text-white font-bold">
                        <Footprints className="w-4 h-4 text-amber-500" />
                        {selectedCrawlDetail.estimatedWalkingKm} km
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Durée</span>
                      <span className="flex items-center gap-2 text-white font-bold">
                        <Clock className="w-4 h-4 text-amber-500" />
                        {Math.round((selectedCrawlDetail.estimatedTotalTimeMinutes || 180) / 60)}h
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-300 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Itinéraire ({selectedCrawlDetail.stopsWithBars?.length || 0} étapes)
                </h4>

                <div className="relative space-y-4 pl-4 border-l-2 border-white/5">
                  {selectedCrawlDetail.stopsWithBars?.map((stopBar, idx) => (
                    <div
                      key={stopBar.id}
                      onClick={() => onSelectBar(stopBar)}
                      className="group relative bg-slate-900 border border-white/5 hover:border-amber-500/30 rounded-xl p-4 cursor-pointer transition-all hover:bg-slate-800/80"
                    >
                      <div className="absolute top-1/2 -left-[27px] -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950 border-2 border-slate-800 group-hover:border-amber-500 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:text-amber-400 transition-colors z-10">
                        {idx + 1}
                      </div>

                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h5 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                            {stopBar.name}
                          </h5>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {stopBar.address}
                          </p>
                          {stopBar.notes && (
                            <div className="mt-2 text-sm text-amber-200/80 bg-amber-500/5 px-3 py-2 rounded-lg border border-amber-500/10">
                              {stopBar.notes}
                            </div>
                          )}
                        </div>
                        <div className="px-2 py-1 bg-slate-950 rounded-lg border border-white/5 font-bold text-amber-400 text-sm">
                          ★ {stopBar.rating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 pb-2 sticky bottom-0 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
                <button
                  onClick={() => handleActivate(selectedCrawlDetail)}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-base shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  <Play className="w-5 h-5" fill="currentColor" />
                  Démarrer cette tournée
                </button>
              </div>
            </div>
          )}

          {/* CREATE VIEW */}
          {viewMode === 'create' && (
            <form onSubmit={handleCreateCrawlSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Titre de la tournée</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Nuit électro à Pigalle..."
                    required
                    className="w-full p-4 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ville</label>
                    <input
                      type="text"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      placeholder="Ex: Paris"
                      required
                      className="w-full p-4 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                    <input
                      type="text"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Ambiance, dress code..."
                      className="w-full p-4 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-900/50 border border-white/5 rounded-2xl space-y-4">
                <label className="block text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  Tracer l'itinéraire
                </label>
                
                <div className="flex gap-2">
                  <select
                    value={selectedBarToAdd}
                    onChange={(e) => setSelectedBarToAdd(e.target.value)}
                    className="flex-1 p-3 bg-slate-950 border border-white/10 rounded-xl text-slate-200 outline-none focus:border-amber-500"
                  >
                    <option value="">Sélectionner un bar...</option>
                    {availableBars
                      .filter((b) => !newCity || b.city.toLowerCase() === newCity.toLowerCase() || newStops.length === 0)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.type})
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="px-5 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Ajouter
                  </button>
                </div>

                <div className="space-y-3 pt-4">
                  {newStops.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-white/5 rounded-xl text-center text-slate-500 text-sm">
                      Sélectionnez au moins 2 bars pour créer un itinéraire.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {newStops.map((stop, idx) => (
                        <div
                          key={stop.bar.id}
                          className="p-3 bg-slate-950 border border-white/5 hover:border-white/10 rounded-xl flex items-center gap-4 transition-colors group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 font-black flex items-center justify-center text-sm flex-shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-white block truncate">{stop.bar.name}</span>
                            <span className="text-xs text-slate-500 block truncate">{stop.bar.address}</span>
                          </div>
                          <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleRemoveStop(idx)}
                              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {newStops.length >= 2 && (
                  <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex flex-wrap items-center gap-6 text-sm">
                    <span className="flex items-center gap-2 text-amber-400 font-semibold">
                      <Footprints className="w-4 h-4" />
                      {metrics.km} km
                    </span>
                    <span className="flex items-center gap-2 text-amber-400 font-semibold">
                      <Clock className="w-4 h-4" />
                      ~{Math.round(metrics.minutes / 60)}h total
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || newStops.length < 2}
                  className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-slate-950 font-black rounded-xl shadow-[0_0_30px_-10px_rgba(245,158,11,0.5)] transition-all"
                >
                  {isSubmitting ? 'Création en cours...' : 'Publier la tournée'}
                </button>
              </div>
            </form>
          )}

          {/* ACTIVE VIEW */}
          {viewMode === 'active' && activeCrawl && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <div className="bg-gradient-to-br from-amber-500/20 to-amber-900/10 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
                <div className="relative z-10 space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    En cours
                  </div>
                  <h3 className="text-2xl font-black text-white">{activeCrawl.title}</h3>
                  <div className="flex items-center gap-4 text-sm font-semibold text-amber-200/80 pt-2">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {activeCrawl.city}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Footprints className="w-4 h-4" />
                      {activeCrawl.estimatedWalkingKm} km
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-300">Votre progression</h4>
                <div className="space-y-3">
                  {activeCrawl.stopsWithBars?.map((stop, idx) => (
                    <div
                      key={stop.id}
                      onClick={() => {
                        onSelectBar(stop);
                        onClose();
                      }}
                      className="p-4 bg-slate-900 border border-white/5 hover:border-amber-500/30 rounded-xl flex items-center gap-4 cursor-pointer transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-slate-800 group-hover:border-amber-500 flex items-center justify-center font-black text-slate-500 group-hover:text-amber-400 transition-colors">
                        {idx + 1}
                      </div>
                      <div>
                        <h5 className="font-bold text-white group-hover:text-amber-400 transition-colors">{stop.name}</h5>
                        <p className="text-xs text-slate-500">{stop.address}</p>
                      </div>
                      <div className="ml-auto">
                        <MapPin className="w-5 h-5 text-slate-600 group-hover:text-amber-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleDeactivate}
                  className="w-full py-4 bg-slate-900 hover:bg-rose-950/40 text-rose-400 border border-slate-800 hover:border-rose-900/50 font-bold rounded-xl transition-colors"
                >
                  Arrêter la tournée
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
