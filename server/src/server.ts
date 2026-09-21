import express, { Request, Response } from 'express';
import cors from 'cors';
import { store } from './db/store.js';
import { Bar, BarType } from './types.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ==================== BARS ROUTES ====================

// GET /api/bars - Liste filtrée des bars
app.get('/api/bars', (req: Request, res: Response) => {
  try {
    const {
      q,
      city,
      country,
      type,
      types,
      priceLevel,
      priceLevels,
      minRating,
      openNow,
      terrace,
      food,
      happyHour,
      liveMusic,
      vibe,
      lat,
      lng,
      radiusKm,
      north,
      south,
      east,
      west,
    } = req.query;

    const parsedTypes = types
      ? typeof types === 'string'
        ? types.split(',')
        : (types as string[])
      : undefined;

    const parsedPriceLevels = priceLevels
      ? typeof priceLevels === 'string'
        ? priceLevels.split(',').map(Number)
        : (priceLevels as string[]).map(Number)
      : undefined;

    let bounds = undefined;
    if (north && south && east && west) {
      bounds = {
        north: Number(north),
        south: Number(south),
        east: Number(east),
        west: Number(west),
      };
    }

    const bars = store.getBars({
      q: q as string,
      city: city as string,
      country: country as string,
      type: type as string,
      types: parsedTypes,
      priceLevel: priceLevel ? Number(priceLevel) : undefined,
      priceLevels: parsedPriceLevels,
      minRating: minRating ? Number(minRating) : undefined,
      openNow: openNow === 'true' || openNow === '1',
      terrace: terrace === 'true' || terrace === '1',
      food: food === 'true' || food === '1',
      happyHour: happyHour === 'true' || happyHour === '1',
      liveMusic: liveMusic === 'true' || liveMusic === '1',
      vibe: vibe as string,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      radiusKm: radiusKm ? Number(radiusKm) : undefined,
      bounds,
    });

    res.json({ total: bars.length, bars });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erreur lors de la récupération des bars' });
  }
});

// GET /api/bars/random - Mode Découverte Roulette
app.get('/api/bars/random', (req: Request, res: Response) => {
  try {
    const { city, country, type } = req.query;
    const bars = store.getBars({
      city: city as string,
      country: country as string,
      type: type as string,
    });

    if (bars.length === 0) {
      return res.status(404).json({ error: 'Aucun bar disponible pour la sélection aléatoire' });
    }

    const randomIndex = Math.floor(Math.random() * bars.length);
    res.json(bars[randomIndex]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bars/:id - Détails d'un bar
app.get('/api/bars/:id', (req: Request, res: Response) => {
  try {
    const bar = store.getBarById(req.params.id);
    if (!bar) {
      return res.status(404).json({ error: 'Bar non trouvé' });
    }
    res.json(bar);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bars - Ajout d'un nouveau bar (contribution communautaire)
app.post('/api/bars', (req: Request, res: Response) => {
  try {
    const {
      name,
      tagline,
      description,
      type,
      address,
      city,
      country,
      lat,
      lng,
      priceLevel,
      photos,
      coverPhoto,
      specialties,
      vibes,
      amenities,
      phone,
      website,
      hours,
      submittedBy,
    } = req.body;

    if (!name || !lat || !lng || !city || !country) {
      return res.status(400).json({ error: 'Les champs nom, ville, pays et coordonnées GPS sont obligatoires' });
    }

    const defaultHours = {
      monday: { open: '17:00', close: '01:00' },
      tuesday: { open: '17:00', close: '01:00' },
      wednesday: { open: '17:00', close: '01:00' },
      thursday: { open: '17:00', close: '02:00' },
      friday: { open: '16:00', close: '02:00' },
      saturday: { open: '16:00', close: '02:00' },
      sunday: { open: '17:00', close: '00:00' },
    };

    const newBar = store.addBar({
      name,
      tagline: tagline || '',
      description: description || 'Bar ajouté par la communauté BarAtlas.',
      type: (type as BarType) || 'cocktail',
      address: address || `${city}, ${country}`,
      city,
      country,
      lat: Number(lat),
      lng: Number(lng),
      priceLevel: Math.min(4, Math.max(1, Number(priceLevel) || 2)) as 1 | 2 | 3 | 4,
      photos: photos && photos.length > 0 ? photos : [coverPhoto || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&auto=format&fit=crop&q=80'],
      coverPhoto: coverPhoto || (photos && photos[0]) || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&auto=format&fit=crop&q=80',
      specialties: specialties || ['Cocktails maison', 'Sélection locale'],
      vibes: vibes || ['Convivial', 'Chaleureux'],
      amenities: amenities || { terrace: false, food: true, happyHour: false, wifi: true, liveMusic: false, accessible: true },
      phone: phone || '',
      website: website || '',
      hours: hours || defaultHours,
      submittedBy: submittedBy || 'Membre Communauté',
    });

    res.status(201).json(newBar);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bars/:id/reviews - Ajout d'un avis
app.post('/api/bars/:id/reviews', (req: Request, res: Response) => {
  try {
    const { author, rating, comment, avatar } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ error: 'La note et le commentaire sont requis' });
    }

    const review = store.addReview(req.params.id, {
      author,
      rating: Number(rating),
      comment,
      avatar,
    });

    res.status(201).json(review);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bars/:id/report - Signalement d'une erreur ou fermeture
app.post('/api/bars/:id/report', (req: Request, res: Response) => {
  try {
    const { reason, details } = req.body;
    res.json({ success: true, message: 'Signalement reçu et transmis à l\'équipe de modération.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== BAR CRAWLS ROUTES ====================

// GET /api/crawls - Liste des parcours
app.get('/api/crawls', (req: Request, res: Response) => {
  try {
    const { city } = req.query;
    const crawls = store.getCrawls(city as string);
    res.json(crawls);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/crawls/:id - Détail d'un parcours avec bars associés
app.get('/api/crawls/:id', (req: Request, res: Response) => {
  try {
    const crawl = store.getCrawlById(req.params.id);
    if (!crawl) {
      return res.status(404).json({ error: 'Parcours non trouvé' });
    }
    res.json(crawl);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/crawls - Création d'une tournée
app.post('/api/crawls', (req: Request, res: Response) => {
  try {
    const { title, description, city, country, author, stops, tags, coverImage, estimatedTotalTimeMinutes, estimatedWalkingKm } = req.body;
    if (!title || !city || !stops || stops.length < 2) {
      return res.status(400).json({ error: 'Un Bar Crawl nécessite au moins un titre, une ville et 2 bars' });
    }

    const newCrawl = store.createCrawl({
      title,
      description: description || 'Superbe tournée nocturne.',
      city,
      country: country || 'Monde',
      author: author || 'Explorateur BarAtlas',
      stops,
      tags: tags || ['Bar Crawl', city],
      coverImage: coverImage || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&auto=format&fit=crop&q=80',
      estimatedTotalTimeMinutes: estimatedTotalTimeMinutes || stops.length * 60,
      estimatedWalkingKm: estimatedWalkingKm || 2.5,
    });

    res.status(201).json(newCrawl);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== USER PROFILE & BADGES ROUTES ====================

// GET /api/user - Profil
app.get('/api/user', (req: Request, res: Response) => {
  try {
    const user = store.getUserProfile();
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/user/favorite - Basculer favori
app.post('/api/user/favorite', (req: Request, res: Response) => {
  try {
    const { barId } = req.body;
    if (!barId) return res.status(400).json({ error: 'barId requis' });
    const user = store.toggleFavorite('default-user', barId);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/user/visited - Basculer visité
app.post('/api/user/visited', (req: Request, res: Response) => {
  try {
    const { barId } = req.body;
    if (!barId) return res.status(400).json({ error: 'barId requis' });
    const user = store.toggleVisited('default-user', barId);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/user/bucketlist - Basculer liste d'envie
app.post('/api/user/bucketlist', (req: Request, res: Response) => {
  try {
    const { barId } = req.body;
    if (!barId) return res.status(400).json({ error: 'barId requis' });
    const user = store.toggleBucketList('default-user', barId);
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/badges - Liste des badges et avancement
app.get('/api/badges', (req: Request, res: Response) => {
  try {
    const badges = store.getBadgesWithProgress('default-user');
    res.json(badges);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== OPENSTREETMAP IMPORT PROXY ====================

// POST /api/import/osm - Import dynamique de bars réels d'une zone via Overpass API
app.post('/api/import/osm', async (req: Request, res: Response) => {
  try {
    const { city, country, lat, lng, radiusMeters = 3000 } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Coordonnées lat/lng requises pour l\'import OpenStreetMap' });
    }

    // Overpass QL query: recherche des bars et pubs dans le rayon spécifié
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"~"bar|pub"](around:${radiusMeters},${lat},${lng});
      );
      out body 30;
    `;

    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    
    const response = await fetch(overpassUrl);
    if (!response.ok) {
      throw new Error(`Erreur Overpass API: ${response.statusText}`);
    }

    const osmData: any = await response.json();
    const elements: any[] = osmData.elements || [];

    const defaultPhotos = [
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574096079513-d8259312b785?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1538488881522-4321453a9927?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200&auto=format&fit=crop&q=80'
    ];

    const importedBars: Bar[] = elements
      .filter((el) => el.tags && el.tags.name)
      .map((el, index) => {
        const tags = el.tags;
        let type: BarType = 'pub';
        if (tags.amenity === 'bar' || tags.cuisine === 'cocktail') type = 'cocktail';
        if (tags.brewery || tags.microbrewery) type = 'brewery';
        if (tags.rooftop === 'yes') type = 'rooftop';
        if (tags.wine) type = 'wine_bar';

        const photo = defaultPhotos[index % defaultPhotos.length];

        return {
          id: `osm-${el.id}`,
          name: tags.name,
          tagline: tags.description || `Bar authentique répertorié sur OpenStreetMap`,
          description: tags.description || `Bar situé à ${city || 'proximité'}, importé depuis les données cartographiques ouvertes mondiales OpenStreetMap.`,
          type,
          address: tags['addr:street'] ? `${tags['addr:housenumber'] || ''} ${tags['addr:street']}` : `${city || 'Centre-ville'}, ${country || ''}`,
          city: city || tags['addr:city'] || 'Inconnue',
          country: country || tags['addr:country'] || 'Monde',
          lat: el.lat,
          lng: el.lon,
          priceLevel: ((index % 3) + 1) as 1 | 2 | 3 | 4,
          rating: Math.round((4.0 + (index % 10) * 0.1) * 10) / 10,
          reviewCount: 5 + (index % 15),
          photos: [photo],
          coverPhoto: photo,
          specialties: ['Boissons fraîches', 'Sélection du patron'],
          vibes: ['Local', 'Authentique', 'Convivial'],
          amenities: {
            terrace: tags.outdoor_seating === 'yes',
            food: tags.food === 'yes',
            happyHour: false,
            wifi: tags.internet_access === 'wlan' || tags.wifi === 'yes',
            liveMusic: tags.live_music === 'yes',
            accessible: tags.wheelchair === 'yes',
          },
          phone: tags.phone || tags['contact:phone'] || '',
          website: tags.website || tags['contact:website'] || '',
          hours: {
            monday: { open: '17:00', close: '01:00' },
            tuesday: { open: '17:00', close: '01:00' },
            wednesday: { open: '17:00', close: '01:00' },
            thursday: { open: '17:00', close: '02:00' },
            friday: { open: '16:00', close: '02:00' },
            saturday: { open: '16:00', close: '02:00' },
            sunday: { open: '17:00', close: '00:00' },
          },
          createdAt: new Date().toISOString(),
          isVerified: false,
          submittedBy: 'OpenStreetMap Import',
        };
      });

    const result = store.addImportedBars(importedBars);
    res.json({
      message: `${result.added} bars importés avec succès (${result.skipped} déjà existants ignorés).`,
      added: result.added,
      totalReceived: importedBars.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EVENTS / SOIRÉES ROUTES ====================

// GET /api/events - Liste des soirées et événements
app.get('/api/events', (req: Request, res: Response) => {
  try {
    const { barId, city, category } = req.query;
    const events = store.getEvents({
      barId: barId ? String(barId) : undefined,
      city: city ? String(city) : undefined,
      category: category ? String(category) : undefined,
    });
    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/:id - Détail d'un événement
app.get('/api/events/:id', (req: Request, res: Response) => {
  try {
    const event = store.getEventById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Événement non trouvé' });
    res.json(event);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events - Créer une nouvelle soirée
app.post('/api/events', (req: Request, res: Response) => {
  try {
    const { barId, title, description, category, date, time, maxParticipants, tags } = req.body;
    if (!barId || !title || !date || !time) {
      return res.status(400).json({ error: 'barId, title, date et time sont obligatoires' });
    }

    const { event, newlyUnlockedBadges } = store.createEvent({
      barId,
      title,
      description,
      category,
      date,
      time,
      maxParticipants: maxParticipants ? Number(maxParticipants) : 25,
      tags: Array.isArray(tags) ? tags : undefined,
    });

    res.status(201).json({ ...event, newlyUnlockedBadges });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events/:id/join - Participer à une soirée
app.post('/api/events/:id/join', (req: Request, res: Response) => {
  try {
    const { userId, name, avatar } = req.body;
    const user = {
      id: userId || 'default-user',
      name: name || 'Alexandre Meyer',
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    };
    const { event, newlyUnlockedBadges } = store.joinEvent(req.params.id, user);
    res.json({ ...event, newlyUnlockedBadges });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/events/:id/leave - Annuler sa participation
app.post('/api/events/:id/leave', (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const event = store.leaveEvent(req.params.id, userId || 'default-user');
    res.json(event);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur BarAtlas API démarré sur http://localhost:${PORT}`);
});
