# BarAtlas 🍸 — Carte Interactive Mondiale des Bars & Tournées Nocturnes

BarAtlas est une application web moderne, immersive et communautaire permettant de recenser, explorer et découvrir les meilleurs bars à travers le monde. Conçue autour d'une carte interactive fluide en thème sombre nocturne, elle intègre des fiches détaillées, des filtres avancés, un générateur de tournées (Bar Crawl), un profil utilisateur gamifié avec badges déblocables et un module d'aspiration en direct via OpenStreetMap.

---

## 🌟 Fonctionnalités Principales

### 1. 🗺️ Carte Interactive Mondiale & Ambiance Nocturne
- **Fond de carte sombre immersif** : Carte *CartoDB Dark Matter* par défaut, avec sélecteur de style (Vue Sombre Nuit, OpenStreetMap Standard, Vue Satellite).
- **Zoom fluide** : navigation du niveau Monde → Pays → Ville → Rue avec animations `flyTo`.
- **Clustering intelligent (Supercluster)** : regroupement dynamique des bars proches avec compteur stylisé et halo lumineux.
- **Marqueurs thématiques personnalisés** :
  - 🍸 *Cocktail Bar*
  - 🍺 *Pub Traditionnel*
  - 🍻 *Brasserie Artisanale (Craft Beer)*
  - 🌇 *Rooftop & Skybar*
  - 🗝️ *Speakeasy (Bar Caché)*
  - 🍷 *Bar à Vin & Tapas*
  - 🎸 *Live Music & Jazz*
  - 🕹️ *Bar à Jeux & Arcade*

### 2. 📋 Fiches Détaillées & Avis Communautaires
- **Statut en temps réel** : Badge dynamique `Ouvert maintenant` ou `Fermé` calculé selon les horaires de la semaine et l'heure actuelle.
- **Galerie photos haute résolution** avec sélecteur de clichés.
- **Spécialités, gamme de prix (`€` à `€€€€`) et ambiances**.
- **Équipements** : Terrasse, Restauration/Tapas, Happy Hour, Wi-Fi, Musique Live, Accès PMR.
- **Horaires complets de la semaine** avec mise en surbrillance du jour actuel.
- **Avis et notation** : Formulaire d'évaluation 1 à 5 étoiles avec calcul automatique de la moyenne.
- **Boutons d'action rapides** :
  - ❤️ *Ajouter aux favoris*
  - ✅ *Marquer comme visité* (avec animation confetti 🎉)
  - 📌 *Ajouter à la liste d'envies (Bucket List)*
  - 🗺️ *Ajouter à un Bar Crawl*
  - 🚗 *Itinéraire GPS Google Maps direct*
  - ⚠️ *Signalement d'erreur ou fermeture*

### 3. 🔍 Recherche & Filtres Multi-critères
- Barre de recherche instantanée (nom, spécialité, ville, description).
- Raccourcis de métropoles mondiales avec déplacement automatique de la carte (Paris, Londres, New York, Tokyo, Berlin, Barcelone, Rome, Dublin, Singapour, Mexico, Amsterdam, Montréal, Sydney...).
- Filtres par catégories, prix, note minimale, ambiance et commodités (terrasse, happy hour...).

### 4. 🚶‍♂️ Tournées Nocturnes (Bar Crawls)
- **Visualiseur de tournées** : Affichage d'itinéraires thématiques pré-configurés (ex: *Paris Bastille Speakeasy*, *Tokyo Shinjuku Golden Gai*, *Manhattan Iconic Ales*).
- **Tracé dynamique sur la carte** : Polyligne lumineuse et puces numérotées pour chaque étape (Étape 1, 2, 3...).
- **Calculateur de parcours** : Calcul automatique de la distance de marche (en km via la formule de Haversine) et du temps total estimé.
- **Créateur de Bar Crawl** : Concevez votre propre tournée personnalisée, réorganisez les étapes et enregistrez-la pour la communauté.

### 5. 🏆 Profil Utilisateur & Gamification (Système de Badges)
- Tableau de bord personnel : Nombre de bars visités, pays explorés, favoris et crawls créés.
- **Système de Badges déblocables avec jauges de progression** :
  - 🍺 *Première Gorgée* : 1er bar visité
  - 🍻 *Habitué des Comptoirs* : 5 bars visités
  - 🦉 *Noctambule Invétéré* : 10 bars visités
  - 🌍 *Globe-Trotter de la Nuit* : Visité des bars dans au moins 3 pays
  - ✈️ *Connaisseur International* : Visité des bars dans au moins 5 pays
  - 🍸 *Maître du Shaker* : 3 bars à cocktails testés
  - 🗝️ *Agent Secret* : 2 speakeasies dénichés
  - 🌇 *Tête dans les Nuages* : 3 rooftops explorés
  - 🗺️ *Capitaine de Tournée* : Créer ou compléter un Bar Crawl
  - ✍️ *Critique Averti* : Rédiger 3 avis
  - 🌟 *Pionnier Urbain* : Ajouter un nouveau bar à la carte

### 6. 🎲 Mode Découverte & Géolocalisation
- **Surprends-moi ! (Roulette Aléatoire)** : Animation type machine à sous qui sélectionne un bar surprise et vous y emmène sur la carte en un clic.
- **Autour de moi** : Géolocalisation par le navigateur pour centrer la carte et afficher les bars les plus proches.

### 7. 🌐 Cold-Start Résolu & Import Massif OpenStreetMap
- **Base initiale riche** : Plus de 40 bars iconiques réels dans plus de 15 métropoles mondiales avec coordonnées GPS exactes, horaires et photos.
- **Module d'import OpenStreetMap (Overpass API)** : Permet d'aspirer en temps réel des dizaines de bars réels d'une ville ou zone géographique (avec coordonnées, nom, type et dédoublonnage automatique).

---

## 🛠️ Stack Technique

- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Leaflet, Supercluster, Canvas-Confetti.
- **Backend** : Node.js, Express, TypeScript, tsx.
- **Base de données** : Fichier persistant JSON structuré (`server/data/db.json`) avec calculs géospatiaux (formule Haversine).
- **Services tiers** : OpenStreetMap Overpass API, CartoDB Dark Tiles, Esri World Imagery.

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
# À la racine du projet
npm install
npm run install:all # ou cd client && npm install; cd ../server && npm install
```

### 2. Lancement en développement (Client + Serveur)
```bash
npm run dev
```
- **Application Web** : [http://localhost:5173](http://localhost:5173)
- **API REST** : [http://localhost:3001](http://localhost:3001)

### 3. Build de production
```bash
npm run build
```
