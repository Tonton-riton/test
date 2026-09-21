import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Bar, Review, BarCrawl, Badge, UserProfile, BarEvent } from '../types.js';
import { seedBars, seedReviews, seedCrawls, initialBadges, seedEvents } from '../data/seedBars.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  bars: Bar[];
  reviews: Review[];
  crawls: BarCrawl[];
  badges: Badge[];
  userProfiles: Record<string, UserProfile>;
  events: BarEvent[];
}

// Distance Haversine en kilomètres
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
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

// Vérifie si un bar est actuellement ouvert
export function isBarOpenNow(bar: Bar, date: Date = new Date()): boolean {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const currentDay = days[date.getDay()];
  const schedule = bar.hours ? bar.hours[currentDay] : undefined;

  if (!schedule || schedule.closed) return false;

  const currentHours = date.getHours();
  const currentMinutes = date.getMinutes();
  const currentTime = currentHours * 60 + currentMinutes;

  const [openH, openM] = schedule.open.split(':').map(Number);
  const [closeH, closeM] = schedule.close.split(':').map(Number);

  const openTime = openH * 60 + (openM || 0);
  let closeTime = closeH * 60 + (closeM || 0);

  // Si l'heure de fermeture est après minuit (ex: 18h -> 02h)
  if (closeTime < openTime) {
    closeTime += 24 * 60;
    const adjustedCurrent = currentTime < openTime ? currentTime + 24 * 60 : currentTime;
    return adjustedCurrent >= openTime && adjustedCurrent < closeTime;
  }

  return currentTime >= openTime && currentTime < closeTime;
}

class Store {
  private data: DatabaseSchema = {
    bars: [],
    reviews: [],
    crawls: [],
    badges: [],
    events: [],
    userProfiles: {},
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
        // Garantir que toutes les clés existent
        if (!this.data.bars || this.data.bars.length === 0) this.data.bars = [...seedBars];
        if (!this.data.reviews || this.data.reviews.length === 0) this.data.reviews = [...seedReviews];
        if (!this.data.crawls || this.data.crawls.length === 0) this.data.crawls = [...seedCrawls];
        if (!this.data.badges || this.data.badges.length === 0) {
          this.data.badges = [...initialBadges];
        } else {
          // Synchroniser tous les badges avec initialBadges pour garantir les propriétés tier et points
          this.data.badges = initialBadges.map((ib) => {
            const existing = this.data.badges.find((b) => b.id === ib.id);
            return existing ? { ...existing, ...ib } : ib;
          });
        }
        if (!this.data.events || this.data.events.length === 0) this.data.events = [...seedEvents];
        if (!this.data.userProfiles) this.data.userProfiles = {};
      } catch (err) {
        console.error('Erreur lecture DB, réinitialisation avec les seeds:', err);
        this.resetWithSeed();
      }
    } else {
      this.resetWithSeed();
    }

    // Profil par défaut pour l'utilisateur
    if (!this.data.userProfiles['default-user']) {
      this.data.userProfiles['default-user'] = {
        id: 'default-user',
        username: 'AlexNightExplorer',
        name: 'Alexandre Meyer',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        bio: 'Passionné de mixologie d\'auteur, de speakeasies mystérieux et de terrasses perchées.',
        favoriteBarIds: ['bar-paris-1', 'bar-nyc-1', 'bar-tokyo-1'],
        visitedBarIds: ['bar-paris-1', 'bar-paris-4', 'bar-london-1', 'bar-bcn-1'],
        bucketListBarIds: ['bar-tokyo-1', 'bar-cdmx-1', 'bar-sg-1'],
        unlockedBadgeIds: ['first_sip', 'cocktail_master'],
        createdBarIds: [],
        crawlsCreated: ['crawl-paris-1'],
      };
      this.save();
    }
  }

  private resetWithSeed() {
    this.data = {
      bars: [...seedBars],
      reviews: [...seedReviews],
      crawls: [...seedCrawls],
      badges: [...initialBadges],
      userProfiles: {},
      events: [...seedEvents],
    };
    this.save();
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de la DB:', err);
    }
  }

  // ==================== BARS ====================
  public getBars(filters: {
    q?: string;
    city?: string;
    country?: string;
    type?: string;
    types?: string[];
    priceLevel?: number;
    priceLevels?: number[];
    minRating?: number;
    openNow?: boolean;
    terrace?: boolean;
    food?: boolean;
    happyHour?: boolean;
    liveMusic?: boolean;
    vibe?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    bounds?: { north: number; south: number; east: number; west: number };
  }): (Bar & { distanceKm?: number; isOpen?: boolean })[] {
    let results = [...this.data.bars];

    // Recherche plein texte
    if (filters.q && filters.q.trim() !== '') {
      const term = filters.q.toLowerCase().trim();
      results = results.filter(
        (b) =>
          b.name.toLowerCase().includes(term) ||
          b.city.toLowerCase().includes(term) ||
          b.country.toLowerCase().includes(term) ||
          b.description.toLowerCase().includes(term) ||
          b.specialties.some((s) => s.toLowerCase().includes(term)) ||
          b.vibes.some((v) => v.toLowerCase().includes(term))
      );
    }

    // Ville
    if (filters.city) {
      const city = filters.city.toLowerCase();
      results = results.filter((b) => b.city.toLowerCase() === city);
    }

    // Pays
    if (filters.country) {
      const country = filters.country.toLowerCase();
      results = results.filter((b) => b.country.toLowerCase() === country);
    }

    // Type unique ou multiple
    if (filters.types && filters.types.length > 0) {
      results = results.filter((b) => filters.types!.includes(b.type));
    } else if (filters.type) {
      results = results.filter((b) => b.type === filters.type);
    }

    // Gamme de prix
    if (filters.priceLevels && filters.priceLevels.length > 0) {
      results = results.filter((b) => filters.priceLevels!.includes(b.priceLevel));
    } else if (filters.priceLevel) {
      results = results.filter((b) => b.priceLevel === filters.priceLevel);
    }

    // Note minimale
    if (filters.minRating) {
      results = results.filter((b) => b.rating >= filters.minRating!);
    }

    // Ambiance / Vibe
    if (filters.vibe) {
      const vibe = filters.vibe.toLowerCase();
      results = results.filter((b) => b.vibes.some((v) => v.toLowerCase().includes(vibe)));
    }

    // Équipements
    if (filters.terrace) {
      results = results.filter((b) => b.amenities.terrace);
    }
    if (filters.food) {
      results = results.filter((b) => b.amenities.food);
    }
    if (filters.happyHour) {
      results = results.filter((b) => b.amenities.happyHour);
    }
    if (filters.liveMusic) {
      results = results.filter((b) => b.amenities.liveMusic);
    }

    // Bounding Box
    if (filters.bounds) {
      const { north, south, east, west } = filters.bounds;
      results = results.filter((b) => b.lat <= north && b.lat >= south && b.lng <= east && b.lng >= west);
    }

    // Calcul isOpen et distance
    const enriched = results.map((b) => {
      const isOpen = isBarOpenNow(b);
      let distanceKm: number | undefined;
      if (filters.lat !== undefined && filters.lng !== undefined) {
        distanceKm = calculateDistanceKm(filters.lat, filters.lng, b.lat, b.lng);
      }
      return { ...b, isOpen, distanceKm };
    });

    // Filtre Ouvert maintenant
    if (filters.openNow) {
      return enriched.filter((b) => b.isOpen);
    }

    // Filtre par rayon de proximité
    if (filters.lat !== undefined && filters.lng !== undefined && filters.radiusKm) {
      return enriched
        .filter((b) => b.distanceKm !== undefined && b.distanceKm <= filters.radiusKm!)
        .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    return enriched;
  }

  public getBarById(id: string): (Bar & { isOpen?: boolean; reviews: Review[] }) | null {
    const bar = this.data.bars.find((b) => b.id === id);
    if (!bar) return null;
    const reviews = this.data.reviews.filter((r) => r.barId === id);
    const isOpen = isBarOpenNow(bar);
    return { ...bar, isOpen, reviews };
  }

  public addBar(newBarData: Omit<Bar, 'id' | 'createdAt' | 'rating' | 'reviewCount'>): Bar {
    const id = `bar-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const bar: Bar = {
      ...newBarData,
      id,
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      isVerified: true,
    };
    this.data.bars.unshift(bar);

    // Mettre à jour l'utilisateur par défaut s'il a soumis le bar
    const user = this.data.userProfiles['default-user'];
    if (user) {
      user.createdBarIds.push(id);
      this.checkAndAwardBadges(user);
    }

    this.save();
    return bar;
  }

  public addReview(barId: string, reviewData: { author: string; rating: number; comment: string; avatar?: string }): Review {
    const bar = this.data.bars.find((b) => b.id === barId);
    if (!bar) throw new Error('Bar introuvable');

    const newReview: Review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      barId,
      author: reviewData.author || 'Voyageur Anonyme',
      rating: Math.max(1, Math.min(5, reviewData.rating)),
      comment: reviewData.comment,
      createdAt: new Date().toISOString(),
      avatar: reviewData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      likes: 0,
    };

    this.data.reviews.unshift(newReview);

    // Recalcul de la moyenne et du nombre d'avis
    const barReviews = this.data.reviews.filter((r) => r.barId === barId);
    const sum = barReviews.reduce((acc, r) => acc + r.rating, 0);
    bar.rating = Math.round((sum / barReviews.length) * 10) / 10;
    bar.reviewCount = barReviews.length;

    // Débloquer badge de critique pour l'utilisateur
    const user = this.data.userProfiles['default-user'];
    if (user) {
      this.checkAndAwardBadges(user);
    }

    this.save();
    return newReview;
  }

  // ==================== BAR CRAWLS ====================
  public getCrawls(city?: string): BarCrawl[] {
    if (city) {
      return this.data.crawls.filter((c) => c.city.toLowerCase() === city.toLowerCase());
    }
    return this.data.crawls;
  }

  public getCrawlById(id: string): (BarCrawl & { stopsWithBars: (Bar & { order: number; notes?: string })[] }) | null {
    const crawl = this.data.crawls.find((c) => c.id === id);
    if (!crawl) return null;

    const stopsWithBars: (Bar & { order: number; notes?: string })[] = [];
    for (const stop of crawl.stops) {
      const bar = this.data.bars.find((b) => b.id === stop.barId);
      if (bar) {
        stopsWithBars.push({
          ...bar,
          order: stop.order,
          notes: stop.notes,
        });
      }
    }

    return { ...crawl, stopsWithBars };
  }

  public createCrawl(crawlData: Omit<BarCrawl, 'id' | 'createdAt'>): BarCrawl {
    const id = `crawl-${Date.now()}`;
    const newCrawl: BarCrawl = {
      ...crawlData,
      id,
      createdAt: new Date().toISOString(),
    };
    this.data.crawls.unshift(newCrawl);

    const user = this.data.userProfiles['default-user'];
    if (user) {
      user.crawlsCreated.push(id);
      this.checkAndAwardBadges(user);
    }

    this.save();
    return newCrawl;
  }

  // ==================== USER PROFILES & BADGES ====================
  public getUserProfile(userId: string = 'default-user'): UserProfile {
    if (!this.data.userProfiles[userId]) {
      this.data.userProfiles[userId] = {
        id: userId,
        username: 'Voyageur',
        name: 'Explorateur de Nuit',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        bio: 'Curieux des saveurs et des ambiances du monde entier.',
        favoriteBarIds: [],
        visitedBarIds: [],
        bucketListBarIds: [],
        unlockedBadgeIds: [],
        createdBarIds: [],
        crawlsCreated: [],
      };
      this.save();
    }
    return this.data.userProfiles[userId];
  }

  public toggleFavorite(userId: string = 'default-user', barId: string): UserProfile {
    const user = this.getUserProfile(userId);
    const index = user.favoriteBarIds.indexOf(barId);
    if (index > -1) {
      user.favoriteBarIds.splice(index, 1);
    } else {
      user.favoriteBarIds.push(barId);
    }
    this.save();
    return user;
  }

  public toggleVisited(userId: string = 'default-user', barId: string): UserProfile {
    const user = this.getUserProfile(userId);
    const index = user.visitedBarIds.indexOf(barId);
    if (index > -1) {
      user.visitedBarIds.splice(index, 1);
    } else {
      user.visitedBarIds.push(barId);
    }
    this.checkAndAwardBadges(user);
    this.save();
    return user;
  }

  public toggleBucketList(userId: string = 'default-user', barId: string): UserProfile {
    const user = this.getUserProfile(userId);
    const index = user.bucketListBarIds.indexOf(barId);
    if (index > -1) {
      user.bucketListBarIds.splice(index, 1);
    } else {
      user.bucketListBarIds.push(barId);
    }
    this.save();
    return user;
  }

  public getBadgesWithProgress(userId: string = 'default-user'): {
    badge: Badge;
    isUnlocked: boolean;
    currentCount: number;
    targetCount: number;
    progressPercentage: number;
  }[] {
    const user = this.getUserProfile(userId);
    const visitedBars = this.data.bars.filter((b) => user.visitedBarIds.includes(b.id));
    const visitedCountries = new Set(visitedBars.map((b) => b.country)).size;
    const cocktailBarsVisited = visitedBars.filter((b) => b.type === 'cocktail').length;
    const speakeasyVisited = visitedBars.filter((b) => b.type === 'speakeasy').length;
    const rooftopsVisited = visitedBars.filter((b) => b.type === 'rooftop').length;
    const breweriesVisited = visitedBars.filter((b) => b.type === 'brewery' || b.type === 'pub').length;
    const reviewsWritten = this.data.reviews.filter((r) => r.author === user.name || r.author === user.username).length;

    // Événements & Soirées
    const allEvents = this.data.events || [];
    const userEvents = allEvents.filter((e) => e.participants && e.participants.some((p) => p.id === userId));
    const eventsAttendedCount = userEvents.length;
    const eventsCreatedCount = allEvents.filter(
      (e) => e.organizer && (e.organizer.name === user.name || (e.organizer as any).id === userId)
    ).length;
    const distinctEventCategories = new Set(userEvents.map((e) => e.category)).size;
    const quizGamesAttended = userEvents.filter((e) => e.category === 'games').length;
    const cocktailEventsAttended = userEvents.filter((e) => {
      const bar = this.getBarById(e.barId);
      return (bar && (bar.type === 'cocktail' || bar.type === 'speakeasy')) || e.category === 'party';
    }).length;

    return this.data.badges.map((badge) => {
      let currentCount = 0;
      switch (badge.id) {
        case 'first_sip':
        case 'regular':
        case 'night_owl':
        case 'city_legend':
          currentCount = user.visitedBarIds.length;
          break;
        case 'country_rookie':
        case 'globe_trotter':
        case 'world_connoisseur':
        case 'world_master':
          currentCount = visitedCountries;
          break;
        case 'cocktail_rookie':
        case 'cocktail_master':
        case 'cocktail_alchemist':
          currentCount = cocktailBarsVisited;
          break;
        case 'speakeasy_hunter':
        case 'speakeasy_ghost':
          currentCount = speakeasyVisited;
          break;
        case 'sky_high':
          currentCount = rooftopsVisited;
          break;
        case 'brewmaster':
          currentCount = breweriesVisited;
          break;
        case 'crawl_master':
          currentCount = user.crawlsCreated.length;
          break;
        case 'critic':
          currentCount = reviewsWritten;
          break;
        case 'contributor':
          currentCount = user.createdBarIds.length;
          break;
        // Badges d'événements & rencontres
        case 'event_first_step':
        case 'event_social_butterfly':
        case 'event_party_animal':
        case 'event_night_lord':
          currentCount = eventsAttendedCount;
          break;
        case 'event_host':
        case 'event_host_silver':
        case 'event_host_gold':
          currentCount = eventsCreatedCount;
          break;
        case 'event_curious':
          currentCount = distinctEventCategories;
          break;
        case 'event_blind_test':
        case 'event_games_master':
          currentCount = quizGamesAttended;
          break;
        case 'event_cocktail_enthusiast':
          currentCount = cocktailEventsAttended;
          break;
        default:
          currentCount = 0;
      }

      const isUnlocked = currentCount >= badge.targetCount;
      const progressPercentage = Math.min(100, Math.round((currentCount / badge.targetCount) * 100));

      return {
        badge,
        isUnlocked,
        currentCount,
        targetCount: badge.targetCount,
        progressPercentage,
      };
    });
  }

  public checkAndAwardBadges(user: UserProfile): Badge[] {
    const badgesInfo = this.getBadgesWithProgress(user.id);
    const newlyUnlocked: Badge[] = [];
    badgesInfo.forEach((item) => {
      if (item.isUnlocked && !user.unlockedBadgeIds.includes(item.badge.id)) {
        user.unlockedBadgeIds.push(item.badge.id);
        newlyUnlocked.push(item.badge);
      }
    });
    if (newlyUnlocked.length > 0) {
      this.save();
    }
    return newlyUnlocked;
  }

  // ==================== IMPORT DEPUIS OPENSTREETMAP (OVERPASS) ====================
  public addImportedBars(bars: Bar[]): { added: number; skipped: number } {
    let added = 0;
    let skipped = 0;

    for (const b of bars) {
      const alreadyExists = this.data.bars.some(
        (existing) =>
          existing.name.toLowerCase() === b.name.toLowerCase() &&
          calculateDistanceKm(existing.lat, existing.lng, b.lat, b.lng) < 0.2
      );

      if (!alreadyExists) {
        this.data.bars.push(b);
        added++;
      } else {
        skipped++;
      }
    }

    this.save();
    return { added, skipped };
  }

  // ==================== EVENTS & SOIRÉES ====================
  public getEvents(filters?: { barId?: string; city?: string; category?: string }): BarEvent[] {
    if (!this.data.events) this.data.events = [...seedEvents];
    let result = [...this.data.events];
    if (filters?.barId) {
      result = result.filter((e) => e.barId === filters.barId);
    }
    if (filters?.city && filters.city !== 'all') {
      const q = filters.city.toLowerCase();
      result = result.filter((e) => e.barCity.toLowerCase().includes(q));
    }
    if (filters?.category && filters.category !== 'all') {
      result = result.filter((e) => e.category === filters.category);
    }
    return result.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  }

  public getEventById(id: string): BarEvent | undefined {
    if (!this.data.events) this.data.events = [...seedEvents];
    return this.data.events.find((e) => e.id === id);
  }

  public createEvent(eventData: Partial<BarEvent>): { event: BarEvent; newlyUnlockedBadges: Badge[] } {
    if (!this.data.events) this.data.events = [...seedEvents];
    const bar = eventData.barId ? this.getBarById(eventData.barId) : null;
    const newEvent: BarEvent = {
      id: `evt-${Date.now()}`,
      barId: eventData.barId || (bar ? bar.id : ''),
      barName: bar ? bar.name : (eventData.barName || 'Bar'),
      barCity: bar ? bar.city : (eventData.barCity || 'Paris'),
      barCountry: bar ? bar.country : (eventData.barCountry || 'France'),
      barPhoto: bar ? bar.coverPhoto : (eventData.barPhoto || 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80'),
      title: eventData.title || 'Soirée au bar',
      description: eventData.description || 'Rejoignez-nous pour partager un verre et faire de nouvelles connaissances !',
      category: (eventData.category as any) || 'meetup',
      date: eventData.date || new Date().toISOString().split('T')[0],
      time: eventData.time || '19:30',
      organizer: eventData.organizer || {
        name: 'Alexandre Meyer',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      },
      participants: eventData.participants || [
        {
          id: 'default-user',
          name: 'Alexandre Meyer',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          joinedAt: new Date().toISOString(),
        },
      ],
      maxParticipants: eventData.maxParticipants || 25,
      tags: eventData.tags || ['Soirée', 'Rencontres'],
      createdAt: new Date().toISOString(),
    };

    this.data.events.unshift(newEvent);
    this.save();
    const userProfile = this.getUserProfile('default-user');
    const newlyUnlockedBadges = this.checkAndAwardBadges(userProfile);
    return { event: newEvent, newlyUnlockedBadges };
  }

  public joinEvent(eventId: string, user: { id: string; name: string; avatar: string }): { event: BarEvent; newlyUnlockedBadges: Badge[] } {
    if (!this.data.events) this.data.events = [...seedEvents];
    const event = this.data.events.find((e) => e.id === eventId);
    if (!event) throw new Error('Événement non trouvé');

    let newlyUnlockedBadges: Badge[] = [];
    const alreadyJoined = event.participants.some((p) => p.id === user.id);
    if (!alreadyJoined) {
      if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
        throw new Error('Cet événement a atteint sa capacité maximale !');
      }
      event.participants.push({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        joinedAt: new Date().toISOString(),
      });
      this.save();
      const userProfile = this.getUserProfile(user.id);
      newlyUnlockedBadges = this.checkAndAwardBadges(userProfile);
    }
    return { event, newlyUnlockedBadges };
  }

  public leaveEvent(eventId: string, userId: string): BarEvent {
    if (!this.data.events) this.data.events = [...seedEvents];
    const event = this.data.events.find((e) => e.id === eventId);
    if (!event) throw new Error('Événement non trouvé');

    event.participants = event.participants.filter((p) => p.id !== userId);
    this.save();
    const userProfile = this.getUserProfile(userId);
    this.checkAndAwardBadges(userProfile);
    return event;
  }
}

export const store = new Store();
