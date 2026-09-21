export type BarType =
  | 'cocktail'
  | 'pub'
  | 'brewery'
  | 'rooftop'
  | 'speakeasy'
  | 'wine_bar'
  | 'live_music'
  | 'arcade';

export interface OpeningHour {
  open: string;  // Format "HH:mm", ex: "17:00"
  close: string; // Format "HH:mm", ex: "02:00"
  closed?: boolean;
}

export interface WeeklyHours {
  monday: OpeningHour;
  tuesday: OpeningHour;
  wednesday: OpeningHour;
  thursday: OpeningHour;
  friday: OpeningHour;
  saturday: OpeningHour;
  sunday: OpeningHour;
}

export interface Review {
  id: string;
  barId: string;
  author: string;
  avatar?: string;
  rating: number; // 1 à 5
  comment: string;
  createdAt: string;
  likes?: number;
}

export interface Bar {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  type: BarType;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  priceLevel: 1 | 2 | 3 | 4; // 1 = €, 2 = €€, 3 = €€€, 4 = €€€€
  rating: number;
  reviewCount: number;
  photos: string[];
  coverPhoto: string;
  specialties: string[];
  vibes: string[]; // ex: ['Cosy', 'Mixologie', 'Romantique', 'Festif', 'Live Jazz']
  amenities: {
    terrace: boolean;
    food: boolean;
    happyHour: boolean;
    wifi: boolean;
    liveMusic: boolean;
    accessible: boolean;
  };
  phone?: string;
  website?: string;
  hours: WeeklyHours;
  createdAt: string;
  submittedBy?: string;
  isVerified?: boolean;
}

export interface BarCrawlStop {
  barId: string;
  order: number;
  suggestedDurationMinutes?: number;
  notes?: string;
}

export interface BarCrawl {
  id: string;
  title: string;
  description: string;
  city: string;
  country: string;
  author: string;
  coverImage?: string;
  stops: BarCrawlStop[];
  estimatedTotalTimeMinutes?: number;
  estimatedWalkingKm?: number;
  createdAt: string;
  tags?: string[];
}

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'visits' | 'countries' | 'types' | 'social' | 'crawls' | 'events';
  targetCount: number;
  tier: BadgeTier;
  points: number;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  avatar: string;
  bio: string;
  favoriteBarIds: string[];
  visitedBarIds: string[];
  bucketListBarIds: string[];
  unlockedBadgeIds: string[];
  createdBarIds: string[];
  crawlsCreated: string[];
}

export type EventCategory = 'meetup' | 'afterwork' | 'singles' | 'party' | 'games' | 'music';

export interface EventParticipant {
  id: string;
  name: string;
  avatar: string;
  joinedAt: string;
}

export interface BarEvent {
  id: string;
  barId: string;
  barName: string;
  barCity: string;
  barCountry: string;
  barPhoto?: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  organizer: {
    name: string;
    avatar: string;
  };
  participants: EventParticipant[];
  maxParticipants?: number;
  tags?: string[];
  createdAt: string;
}
