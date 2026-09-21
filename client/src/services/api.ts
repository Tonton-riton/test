import { Bar, BarCrawl, BadgeWithProgress, UserProfile, FilterState, Review, BarEvent } from '../types';

const API_BASE = '/api';

export async function getBars(filters?: Partial<FilterState> & { lat?: number; lng?: number; radiusKm?: number }): Promise<{ total: number; bars: Bar[] }> {
  const params = new URLSearchParams();

  if (filters?.search) params.append('q', filters.search);
  if (filters?.city && filters.city !== 'all') params.append('city', filters.city);
  if (filters?.country) params.append('country', filters.country);
  if (filters?.types && filters.types.length > 0) params.append('types', filters.types.join(','));
  if (filters?.priceLevels && filters.priceLevels.length > 0) params.append('priceLevels', filters.priceLevels.join(','));
  if (filters?.minRating && filters.minRating > 0) params.append('minRating', filters.minRating.toString());
  if (filters?.openNow) params.append('openNow', 'true');
  if (filters?.terrace) params.append('terrace', 'true');
  if (filters?.food) params.append('food', 'true');
  if (filters?.happyHour) params.append('happyHour', 'true');
  if (filters?.liveMusic) params.append('liveMusic', 'true');
  if (filters?.vibe) params.append('vibe', filters.vibe);
  if (filters?.lat !== undefined && filters?.lng !== undefined) {
    params.append('lat', filters.lat.toString());
    params.append('lng', filters.lng.toString());
    if (filters.radiusKm) params.append('radiusKm', filters.radiusKm.toString());
  }

  const res = await fetch(`${API_BASE}/bars?${params.toString()}`);
  if (!res.ok) throw new Error('Impossible de charger les bars');
  return res.json();
}

export async function getBarById(id: string): Promise<Bar & { reviews: Review[] }> {
  const res = await fetch(`${API_BASE}/bars/${id}`);
  if (!res.ok) throw new Error('Bar non trouvé');
  return res.json();
}

export async function getRandomBar(params?: { city?: string; type?: string }): Promise<Bar> {
  const query = new URLSearchParams();
  if (params?.city && params.city !== 'all') query.append('city', params.city);
  if (params?.type) query.append('type', params.type);

  const res = await fetch(`${API_BASE}/bars/random?${query.toString()}`);
  if (!res.ok) throw new Error('Erreur lors du tirage aléatoire');
  return res.json();
}

export async function createBar(barData: Partial<Bar>): Promise<Bar> {
  const res = await fetch(`${API_BASE}/bars`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(barData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur lors de la création du bar');
  }
  return res.json();
}

export async function addReview(barId: string, review: { author: string; rating: number; comment: string }): Promise<Review> {
  const res = await fetch(`${API_BASE}/bars/${barId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur lors de l\'ajout de l\'avis');
  }
  return res.json();
}

export async function reportBar(barId: string, reason: string, details?: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/bars/${barId}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason, details }),
  });
  if (!res.ok) throw new Error('Erreur signalement');
  return res.json();
}

export async function getCrawls(city?: string): Promise<BarCrawl[]> {
  const params = city && city !== 'all' ? `?city=${encodeURIComponent(city)}` : '';
  const res = await fetch(`${API_BASE}/crawls${params}`);
  if (!res.ok) throw new Error('Erreur chargement des parcours');
  return res.json();
}

export async function getCrawlById(id: string): Promise<BarCrawl> {
  const res = await fetch(`${API_BASE}/crawls/${id}`);
  if (!res.ok) throw new Error('Erreur chargement du parcours');
  return res.json();
}

export async function createCrawl(crawlData: Partial<BarCrawl>): Promise<BarCrawl> {
  const res = await fetch(`${API_BASE}/crawls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(crawlData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur lors de la création du bar crawl');
  }
  return res.json();
}

export async function getUserProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/user`);
  if (!res.ok) throw new Error('Erreur chargement profil');
  return res.json();
}

export async function toggleFavorite(barId: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/user/favorite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barId }),
  });
  if (!res.ok) throw new Error('Erreur mise à jour favoris');
  return res.json();
}

export async function toggleVisited(barId: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/user/visited`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barId }),
  });
  if (!res.ok) throw new Error('Erreur mise à jour visité');
  return res.json();
}

export async function toggleBucketList(barId: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/user/bucketlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barId }),
  });
  if (!res.ok) throw new Error('Erreur mise à jour liste d\'envie');
  return res.json();
}

export async function getBadges(): Promise<BadgeWithProgress[]> {
  const res = await fetch(`${API_BASE}/badges`);
  if (!res.ok) throw new Error('Erreur chargement badges');
  return res.json();
}

export async function importOsmBars(data: { city?: string; country?: string; lat: number; lng: number; radiusMeters?: number }): Promise<{ message: string; added: number }> {
  const res = await fetch(`${API_BASE}/import/osm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur lors de l\'import OSM');
  }
  return res.json();
}

// ==================== EVENTS / SOIRÉES ====================

export async function getEvents(filters?: { barId?: string; city?: string; category?: string }): Promise<BarEvent[]> {
  const params = new URLSearchParams();
  if (filters?.barId) params.append('barId', filters.barId);
  if (filters?.city) params.append('city', filters.city);
  if (filters?.category) params.append('category', filters.category);
  const res = await fetch(`${API_BASE}/events?${params.toString()}`);
  if (!res.ok) throw new Error('Erreur chargement soirées');
  return res.json();
}

export async function getEventById(id: string): Promise<BarEvent> {
  const res = await fetch(`${API_BASE}/events/${id}`);
  if (!res.ok) throw new Error('Erreur chargement événement');
  return res.json();
}

export async function createEvent(data: Partial<BarEvent>): Promise<BarEvent> {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur lors de la création de la soirée');
  }
  return res.json();
}

export async function joinEvent(eventId: string, user?: { userId?: string; name?: string; avatar?: string }): Promise<BarEvent> {
  const res = await fetch(`${API_BASE}/events/${eventId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user || {}),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur pour rejoindre la soirée');
  }
  return res.json();
}

export async function leaveEvent(eventId: string, userId?: string): Promise<BarEvent> {
  const res = await fetch(`${API_BASE}/events/${eventId}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erreur pour quitter la soirée');
  }
  return res.json();
}
