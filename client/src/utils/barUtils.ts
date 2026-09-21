import { BarType, WeeklyHours } from '../types';

export interface BarTypeMeta {
  type: BarType;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  accentHex: string;
}

export const BAR_TYPES_META: Record<BarType, BarTypeMeta> = {
  cocktail: {
    type: 'cocktail',
    label: 'Cocktail Bar',
    emoji: '🍸',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    accentHex: '#ec4899',
  },
  pub: {
    type: 'pub',
    label: 'Pub Traditionnel',
    emoji: '🍺',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    accentHex: '#f59e0b',
  },
  brewery: {
    type: 'brewery',
    label: 'Brasserie Artisanale',
    emoji: '🍻',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    accentHex: '#eab308',
  },
  rooftop: {
    type: 'rooftop',
    label: 'Rooftop & Skybar',
    emoji: '🌇',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    accentHex: '#06b6d4',
  },
  speakeasy: {
    type: 'speakeasy',
    label: 'Speakeasy (Caché)',
    emoji: '🗝️',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    accentHex: '#a855f7',
  },
  wine_bar: {
    type: 'wine_bar',
    label: 'Bar à Vin & Tapas',
    emoji: '🍷',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    accentHex: '#f43f5e',
  },
  live_music: {
    type: 'live_music',
    label: 'Live Music & Jazz',
    emoji: '🎸',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    accentHex: '#10b981',
  },
  arcade: {
    type: 'arcade',
    label: 'Bar à Jeux & Arcade',
    emoji: '🕹️',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    accentHex: '#6366f1',
  },
};

export function getPriceString(level: 1 | 2 | 3 | 4): string {
  switch (level) {
    case 1:
      return '€ (Économique)';
    case 2:
      return '€€ (Modéré)';
    case 3:
      return '€€€ (Haut de gamme)';
    case 4:
      return '€€€€ (Prestige & Luxe)';
    default:
      return '€€';
  }
}

export function formatDayName(dayKey: string): string {
  const map: Record<string, string> = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
  };
  return map[dayKey] || dayKey;
}

export function isCurrentlyOpen(hours?: WeeklyHours): { isOpen: boolean; label: string } {
  if (!hours) return { isOpen: false, label: 'Horaires non renseignés' };

  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const currentDay = days[now.getDay()];
  const todaySchedule = hours[currentDay];

  if (!todaySchedule || todaySchedule.closed) {
    return { isOpen: false, label: 'Fermé aujourd\'hui' };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = todaySchedule.open.split(':').map(Number);
  const [closeH, closeM] = todaySchedule.close.split(':').map(Number);

  const openMinutes = openH * 60 + (openM || 0);
  let closeMinutes = closeH * 60 + (closeM || 0);

  if (closeMinutes < openMinutes) {
    closeMinutes += 24 * 60;
    const adjustedCurrent = currentMinutes < openMinutes ? currentMinutes + 24 * 60 : currentMinutes;
    const open = adjustedCurrent >= openMinutes && adjustedCurrent < closeMinutes;
    return {
      isOpen: open,
      label: open ? `Ouvert jusqu'à ${todaySchedule.close}` : `Fermé (Ouvre à ${todaySchedule.open})`,
    };
  }

  const open = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  return {
    isOpen: open,
    label: open ? `Ouvert jusqu'à ${todaySchedule.close}` : `Fermé (Ouvre à ${todaySchedule.open})`,
  };
}

export const CITIES_SHORTCUTS = [
  { name: 'Toutes les villes', query: 'all', emoji: '🌍', coords: [20, 0], zoom: 3 },
  { name: 'Paris', query: 'Paris', emoji: '🇫🇷', coords: [48.86, 2.35], zoom: 13 },
  { name: 'Londres', query: 'Londres', emoji: '🇬🇧', coords: [51.507, -0.127], zoom: 13 },
  { name: 'New York', query: 'New York', emoji: '🇺🇸', coords: [40.73, -73.99], zoom: 13 },
  { name: 'Tokyo', query: 'Tokyo', emoji: '🇯🇵', coords: [35.689, 139.692], zoom: 14 },
  { name: 'Barcelone', query: 'Barcelone', emoji: '🇪🇸', coords: [41.385, 2.173], zoom: 13 },
  { name: 'Berlin', query: 'Berlin', emoji: '🇩🇪', coords: [52.52, 13.405], zoom: 13 },
  { name: 'Rome', query: 'Rome', emoji: '🇮🇹', coords: [41.896, 12.482], zoom: 13 },
  { name: 'Dublin', query: 'Dublin', emoji: '🇮🇪', coords: [53.345, -6.26], zoom: 14 },
  { name: 'Singapour', query: 'Singapour', emoji: '🇸🇬', coords: [1.3, 103.85], zoom: 14 },
  { name: 'Mexico', query: 'Mexico', emoji: '🇲🇽', coords: [19.42, -99.16], zoom: 13 },
  { name: 'Amsterdam', query: 'Amsterdam', emoji: '🇳🇱', coords: [52.37, 4.89], zoom: 13 },
  { name: 'Montréal', query: 'Montréal', emoji: '🇨🇦', coords: [45.51, -73.58], zoom: 13 },
  { name: 'Sydney', query: 'Sydney', emoji: '🇦🇺', coords: [-33.86, 151.21], zoom: 13 },
];

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

