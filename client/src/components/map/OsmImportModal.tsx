import React, { useState } from 'react';
import { importOsmBars } from '../../services/api';
import confetti from 'canvas-confetti';
import { X, DownloadCloud, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface OsmImportModalProps {
  onClose: () => void;
  onImportComplete: () => void;
  defaultCoords?: { lat: number; lng: number };
}

export const OsmImportModal: React.FC<OsmImportModalProps> = ({
  onClose,
  onImportComplete,
  defaultCoords,
}) => {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [lat, setLat] = useState(defaultCoords?.lat?.toFixed(4) || '48.8566');
  const [lng, setLng] = useState(defaultCoords?.lng?.toFixed(4) || '2.3522');
  const [radiusMeters, setRadiusMeters] = useState(2500);

  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Raccourcis de villes pour un import rapide
  const quickImportPresets = [
    { name: 'Marseille (Vieux-Port)', country: 'France', lat: 43.2965, lng: 5.3698 },
    { name: 'Lyon (Presqu\'île)', country: 'France', lat: 45.764, lng: 4.8357 },
    { name: 'Bordeaux (Saint-Pierre)', country: 'France', lat: 44.8378, lng: -0.5792 },
    { name: 'Madrid (Malasaña)', country: 'Espagne', lat: 40.426, lng: -3.704 },
    { name: 'Lisbonne (Bairro Alto)', country: 'Portugal', lat: 38.713, lng: -9.144 },
    { name: 'Kyoto (Gion)', country: 'Japon', lat: 35.0037, lng: 135.7772 },
  ];

  const handleSelectPreset = (p: typeof quickImportPresets[0]) => {
    setCity(p.name);
    setCountry(p.country);
    setLat(p.lat.toString());
    setLng(p.lng.toString());
  };

  const handleRunImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResultMessage(null);

    try {
      const res = await importOsmBars({
        city: city || 'Zone sélectionnée',
        country: country || 'Monde',
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radiusMeters: Number(radiusMeters),
      });

      setResultMessage(res.message);
      if (res.added > 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#10b981', '#f59e0b'],
        });
      }
      onImportComplete();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'importation OpenStreetMap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-200 animate-in zoom-in-95">
        {/* En-tête */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Import Massif OpenStreetMap</h2>
              <p className="text-xs text-slate-400">
                Aspiration en direct de bars réels via l'Overpass API d'OpenStreetMap
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-4 sm:p-6 flex flex-col gap-4 text-xs">
          {/* Raccourcis villes à importer */}
          <div className="flex flex-col gap-1.5">
            <span className="text-slate-400 font-semibold">Suggestions de zones à importer en un clic :</span>
            <div className="flex flex-wrap gap-1.5">
              {quickImportPresets.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 rounded-lg transition-colors text-[11px]"
                >
                  📍 {p.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleRunImport} className="flex flex-col gap-3 pt-2 border-t border-slate-800/80">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-slate-400">Nom de la ville</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ex: Marseille"
                  className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-400">Pays</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Ex: France"
                  className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-slate-400">Latitude GPS</label>
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  required
                  className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-400">Longitude GPS</label>
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  required
                  className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-slate-400">
                <label>Rayon de recherche : {(radiusMeters / 1000).toFixed(1)} km</label>
              </div>
              <input
                type="range"
                min="1000"
                max="5000"
                step="500"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(Number(e.target.value))}
                className="accent-cyan-400 cursor-pointer"
              />
            </div>

            {resultMessage && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-xl font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{resultMessage}</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-500/20 border border-rose-500 text-rose-300 rounded-xl font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Fermer
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Aspiration en cours...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-4 h-4" />
                    <span>Lancer l'importation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
