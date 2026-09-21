import React, { useState, useEffect } from 'react';
import { Bar, BarType } from '../../types';
import { BAR_TYPES_META } from '../../utils/barUtils';
import { createBar } from '../../services/api';
import confetti from 'canvas-confetti';
import { X, MapPinPlus, Upload, Camera, PlusCircle, Sparkles } from 'lucide-react';

interface AddBarModalProps {
  onClose: () => void;
  onBarCreated: (bar: Bar) => void;
  droppedCoords: { lat: number; lng: number } | null;
  onStartPinDrop: () => void;
}

export const AddBarModal: React.FC<AddBarModalProps> = ({
  onClose,
  onBarCreated,
  droppedCoords,
  onStartPinDrop,
}) => {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<BarType>('cocktail');
  const [priceLevel, setPriceLevel] = useState<1 | 2 | 3 | 4>(2);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [coverPhoto, setCoverPhoto] = useState('');
  const [specialtiesText, setSpecialtiesText] = useState('Cocktails signatures, Tapas');
  const [vibesText, setVibesText] = useState('Cosy, Ambiance chaleureuse');

  // Équipements
  const [terrace, setTerrace] = useState(false);
  const [food, setFood] = useState(true);
  const [happyHour, setHappyHour] = useState(false);
  const [wifi, setWifi] = useState(true);
  const [liveMusic, setLiveMusic] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronisation des coordonnées issues du clic sur la carte
  useEffect(() => {
    if (droppedCoords) {
      setLat(droppedCoords.lat.toFixed(5));
      setLng(droppedCoords.lng.toFixed(5));
    }
  }, [droppedCoords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city || !country || !lat || !lng) {
      alert('Veuillez remplir au moins le nom, la ville, le pays et les coordonnées GPS.');
      return;
    }

    setIsSubmitting(true);
    try {
      const specialties = specialtiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const vibes = vibesText
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);

      const defaultPhoto =
        'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&auto=format&fit=crop&q=80';

      const barData: Partial<Bar> = {
        name,
        tagline,
        description: description || 'Bar proposé par la communauté BarAtlas.',
        type,
        priceLevel,
        city,
        country,
        address: address || `${city}, ${country}`,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        coverPhoto: coverPhoto.trim() || defaultPhoto,
        photos: [coverPhoto.trim() || defaultPhoto],
        specialties: specialties.length > 0 ? specialties : ['Cocktails signatures'],
        vibes: vibes.length > 0 ? vibes : ['Convivial'],
        amenities: {
          terrace,
          food,
          happyHour,
          wifi,
          liveMusic,
          accessible: true,
        },
        submittedBy: 'Explorateur de Nuit',
      };

      const created = await createBar(barData);

      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#38bdf8', '#a855f7'],
      });

      onBarCreated(created);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'ajout du bar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg max-h-[90vh] bg-slate-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="relative p-5 border-b border-white/10 flex items-center justify-between overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide">Contribuer un bar</h2>
              <p className="text-xs text-slate-400">Ajoutez une nouvelle pépite à la carte</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="relative z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
            
            {/* Identity */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-300">Nom de l'établissement *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Le Comptoir Céleste"
                  required
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-300">Slogan / Phrase d'accroche</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Ex: Cocktails d'auteur et terrasse cachée"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Bar Type Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300">Type d'établissement *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(Object.keys(BAR_TYPES_META) as BarType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                      type === t
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-2xl drop-shadow-md">{BAR_TYPES_META[t].emoji}</span>
                    <span className="text-xs font-medium">{BAR_TYPES_META[t].label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Level */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300">Gamme de Prix *</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriceLevel(p as any)}
                    className={`flex-1 py-2.5 rounded-xl border font-bold text-center transition-all ${
                      priceLevel === p
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {'€'.repeat(p)}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-300">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Atmosphère, spécialités, déco, musiques..."
                rows={3}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Pin Drop & Location */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <MapPinPlus className="w-5 h-5" />
                  <span className="font-semibold text-sm">Localisation GPS</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onStartPinDrop();
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all"
                >
                  Pointer sur la carte
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ville *"
                  required
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-sm"
                />
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Pays *"
                  required
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-sm"
                />
              </div>

              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Adresse complète *"
                className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-sm"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="Latitude *"
                  required
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-amber-100 placeholder-white/20 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none font-mono text-sm"
                />
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="Longitude *"
                  required
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-amber-100 placeholder-white/20 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none font-mono text-sm"
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-300">Photo de couverture</label>
              <div className="relative group rounded-xl border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 hover:border-amber-500/50 transition-all p-6 flex flex-col items-center justify-center gap-3 overflow-hidden min-h-[120px]">
                {coverPhoto ? (
                  <div className="absolute inset-0 w-full h-full">
                    <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover opacity-40 group-hover:opacity-20 transition-opacity" />
                  </div>
                ) : null}
                <Upload className="w-7 h-7 text-slate-400 group-hover:text-amber-400 transition-colors relative z-10" />
                <input
                  type="url"
                  value={coverPhoto}
                  onChange={(e) => setCoverPhoto(e.target.value)}
                  placeholder="Collez l'URL de l'image ici..."
                  className="relative z-10 text-center w-full bg-transparent border-none focus:ring-0 text-sm text-white placeholder-slate-400 outline-none"
                />
              </div>
            </div>

            {/* Specialties & Vibes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-300">Spécialités</label>
                <input
                  type="text"
                  value={specialtiesText}
                  onChange={(e) => setSpecialtiesText(e.target.value)}
                  placeholder="Séparées par des virgules"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-sm"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-300">Ambiance</label>
                <input
                  type="text"
                  value={vibesText}
                  onChange={(e) => setVibesText(e.target.value)}
                  placeholder="Séparées par des virgules"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none text-sm"
                />
              </div>
            </div>

            {/* Amenities Grid */}
            <div className="flex flex-col gap-3 pt-2">
              <label className="text-sm font-semibold text-slate-300">Équipements & Services</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={terrace}
                    onChange={(e) => setTerrace(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500/50 bg-slate-900"
                  />
                  <span className="text-sm text-slate-300">Terrasse</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={food}
                    onChange={(e) => setFood(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500/50 bg-slate-900"
                  />
                  <span className="text-sm text-slate-300">Restauration</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={happyHour}
                    onChange={(e) => setHappyHour(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500/50 bg-slate-900"
                  />
                  <span className="text-sm text-slate-300">Happy Hour</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={wifi}
                    onChange={(e) => setWifi(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500/50 bg-slate-900"
                  />
                  <span className="text-sm text-slate-300">Wi-Fi</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <input
                    type="checkbox"
                    checked={liveMusic}
                    onChange={(e) => setLiveMusic(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500/50 bg-slate-900"
                  />
                  <span className="text-sm text-slate-300">Musique Live</span>
                </label>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="pt-4 mt-2 border-t border-white/10">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Création en cours...' : 'Ajouter à la carte'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};
