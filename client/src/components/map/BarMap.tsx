import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { Bar, BarCrawl } from '../../types';
import { BAR_TYPES_META } from '../../utils/barUtils';
import { Layers, ZoomIn, ZoomOut, Compass } from 'lucide-react';

interface BarMapProps {
  bars: Bar[];
  selectedBar: Bar | null;
  onSelectBar: (bar: Bar) => void;
  activeCrawl: BarCrawl | null;
  isPinDropperActive?: boolean;
  onPinDropped?: (lat: number, lng: number) => void;
  userLocation: { lat: number; lng: number } | null;
  targetCoords?: { lat: number; lng: number; zoom?: number } | null;
  onBackToGlobe?: () => void;
}

export const BarMap: React.FC<BarMapProps> = ({
  bars, selectedBar, onSelectBar, activeCrawl,
  isPinDropperActive, onPinDropped, userLocation, targetCoords, onBackToGlobe,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterIndexRef = useRef<Supercluster<any, any> | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const crawlLayerRef = useRef<L.LayerGroup | null>(null);
  const droppedPinMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [currentTile, setCurrentTile] = useState<'voyager' | 'osm' | 'dark' | 'satellite'>('voyager');
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  // ─── init map ───
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, {
      center: selectedBar ? [selectedBar.lat, selectedBar.lng] : [48.8566, 2.3522],
      zoom: selectedBar ? 17 : 13,
      minZoom: 2,
      maxZoom: 19,
      zoomControl: false,
      worldCopyJump: true,
    });
    // Default to CartoDB Voyager: clean real normal street map
    const tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO &copy; OpenStreetMap', subdomains: 'abcd', maxZoom: 20,
    }).addTo(map);
    tileLayerRef.current = tiles;
    markersLayerRef.current = L.layerGroup().addTo(map);
    crawlLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ─── tile switching ───
  const changeTiles = (t: 'voyager' | 'osm' | 'dark' | 'satellite') => {
    if (!mapRef.current) return;
    setCurrentTile(t); setShowLayerMenu(false);
    if (tileLayerRef.current) mapRef.current.removeLayer(tileLayerRef.current);
    const urls: Record<string, string> = {
      voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    };
    const layer = L.tileLayer(urls[t], { attribution: '&copy; OSM', maxZoom: 19 }).addTo(mapRef.current);
    tileLayerRef.current = layer;
  };

  // ─── pin drop mode ───
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    const handler = (e: L.LeafletMouseEvent) => {
      if (!isPinDropperActive || !onPinDropped) return;
      onPinDropped(e.latlng.lat, e.latlng.lng);
      if (droppedPinMarkerRef.current) map.removeLayer(droppedPinMarkerRef.current);
      const icon = L.divIcon({
        className: '', iconSize: [36, 36], iconAnchor: [18, 36],
        html: `<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:28px;filter:drop-shadow(0 4px 12px rgba(245,158,11,.6))">📍</div>`,
      });
      droppedPinMarkerRef.current = L.marker([e.latlng.lat, e.latlng.lng], { icon }).addTo(map);
    };
    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [isPinDropperActive, onPinDropped]);

  // ─── fly to target ───
  useEffect(() => {
    if (!mapRef.current || !targetCoords) return;
    mapRef.current.flyTo([targetCoords.lat, targetCoords.lng], targetCoords.zoom || 13, { duration: 1.5 });
  }, [targetCoords]);

  // ─── fly to selected bar (zoom 17 street level) ───
  useEffect(() => {
    if (!mapRef.current || !selectedBar) return;
    mapRef.current.flyTo([selectedBar.lat, selectedBar.lng], 17, { duration: 1.2 });
  }, [selectedBar]);

  // ─── build cluster index ───
  useEffect(() => {
    if (bars.length === 0) return;
    const sc = new Supercluster({ radius: 55, maxZoom: 16 });
    sc.load(bars.map((b) => ({
      type: 'Feature' as const,
      properties: { cluster: false, barId: b.id, bar: b },
      geometry: { type: 'Point' as const, coordinates: [b.lng, b.lat] },
    })));
    clusterIndexRef.current = sc;
    renderMarkers();
  }, [bars, selectedBar]);

  // ─── render markers ───
  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    const sc = clusterIndexRef.current;
    if (!map || !layer || !sc) return;
    layer.clearLayers();
    const bounds = map.getBounds();
    const zoom = Math.floor(map.getZoom());
    const bbox: [number, number, number, number] = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];

    sc.getClusters(bbox, zoom).forEach((f) => {
      const [lng, lat] = f.geometry.coordinates;

      if (f.properties.cluster) {
        const count = f.properties.point_count;
        const sz = count < 10 ? 38 : count < 50 ? 46 : 54;
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:${sz}px;height:${sz}px;display:flex;align-items:center;justify-content:center;
            border-radius:50%;font-weight:800;font-size:${count > 99 ? 11 : 13}px;color:#fff;
            background:linear-gradient(135deg,#f59e0b,#ef4444);
            border:2px solid rgba(255,255,255,.35);
            box-shadow:0 0 20px rgba(245,158,11,.45),0 4px 12px rgba(0,0,0,.5);
            cursor:pointer;transition:transform .2s;font-family:'Space Grotesk',sans-serif;
          " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">${count}</div>`,
          iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2],
        });
        const m = L.marker([lat, lng], { icon });
        m.on('click', () => {
          const ez = sc.getClusterExpansionZoom(f.id as number);
          map.flyTo([lat, lng], Math.min(ez, 17), { duration: 0.8 });
        });
        layer.addLayer(m);
      } else {
        const bar: Bar = f.properties.bar;
        const isSel = selectedBar?.id === bar.id;
        const meta = BAR_TYPES_META[bar.type] || BAR_TYPES_META.cocktail;

        // Marker SVG Pin
        const pinSize = isSel ? 48 : 40;
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            display:flex;flex-direction:column;align-items:center;cursor:pointer;
            transition:transform .25s cubic-bezier(.34,1.56,.64,1);
            transform:scale(${isSel ? 1.25 : 1});z-index:${isSel ? 1001 : 'auto'};
          " onmouseover="this.style.transform='scale(${isSel ? 1.3 : 1.18})'" onmouseout="this.style.transform='scale(${isSel ? 1.25 : 1})'">
            <div style="
              width:${pinSize}px;height:${pinSize}px;border-radius:14px;display:flex;align-items:center;justify-content:center;
              font-size:${isSel ? 22 : 18}px;
              background:${isSel ? 'linear-gradient(135deg,#f59e0b,#f97316)' : '#0c1222'};
              border:2px solid ${isSel ? '#fff' : meta.accentHex};
              box-shadow:0 0 ${isSel ? '24px rgba(245,158,11,.65)' : '14px ' + meta.accentHex + '55'},0 4px 10px rgba(0,0,0,.6);
            ">${meta.emoji}</div>
            <div style="width:5px;height:5px;border-radius:50%;margin-top:3px;
              background:${isSel ? '#f59e0b' : meta.accentHex};opacity:.8;
              box-shadow:0 0 6px ${isSel ? '#f59e0b' : meta.accentHex};"></div>
          </div>`,
          iconSize: [pinSize, pinSize + 10], iconAnchor: [pinSize / 2, pinSize + 8],
        });

        const m = L.marker([lat, lng], { icon });

        // Rich popup
        const popup = document.createElement('div');
        popup.style.cssText = 'min-width:220px;cursor:pointer;';
        popup.innerHTML = `
          <div style="position:relative;border-radius:10px;overflow:hidden;height:96px;margin-bottom:8px;">
            <img src="${bar.coverPhoto}" style="width:100%;height:100%;object-fit:cover;" />
            <div style="position:absolute;inset:0;background:linear-gradient(0deg,#0f172a 0%,transparent 60%);"></div>
            <span style="position:absolute;top:6px;left:6px;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;
              background:rgba(15,23,42,.85);backdrop-filter:blur(6px);color:#fff;border:1px solid rgba(255,255,255,.15);">
              ${meta.emoji} ${meta.label}
            </span>
            <span style="position:absolute;top:6px;right:6px;padding:2px 7px;border-radius:6px;font-size:9px;font-weight:800;
              background:${bar.isOpen ? 'rgba(16,185,129,.9)' : 'rgba(239,68,68,.9)'};color:#fff;">
              ${bar.isOpen ? '● Ouvert' : 'Fermé'}
            </span>
          </div>
          <div style="font-weight:800;font-size:13px;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${bar.name}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:1px;">${bar.city}, ${bar.country}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,.08);font-size:11px;">
            <span style="color:#fbbf24;font-weight:700;">★ ${bar.rating.toFixed(1)}</span>
            <span style="color:#64748b;font-weight:600;">${'€'.repeat(bar.priceLevel)}</span>
          </div>
        `;
        popup.addEventListener('click', () => onSelectBar(bar));

        m.bindPopup(popup, { offset: [0, -pinSize - 4], className: 'bar-popup-custom' });
        m.on('click', () => onSelectBar(bar));
        layer.addLayer(m);
      }
    });
  }, [selectedBar, onSelectBar]);

  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    map.on('moveend', renderMarkers); map.on('zoomend', renderMarkers);
    return () => { map.off('moveend', renderMarkers); map.off('zoomend', renderMarkers); };
  }, [renderMarkers]);

  // ─── crawl polyline ───
  useEffect(() => {
    const map = mapRef.current; const cl = crawlLayerRef.current;
    if (!map || !cl) return; cl.clearLayers();
    const stops = activeCrawl?.stopsWithBars; if (!stops || stops.length < 2) return;
    const ll: L.LatLngExpression[] = stops.map((b) => [b.lat, b.lng]);
    cl.addLayer(L.polyline(ll, { color: '#ef4444', weight: 8, opacity: 0.25 }));
    cl.addLayer(L.polyline(ll, { color: '#f59e0b', weight: 4, opacity: 0.9, dashArray: '12, 8' }));
    stops.forEach((bar, i) => {
      const ic = L.divIcon({
        className: '', iconSize: [30, 30], iconAnchor: [15, 15],
        html: `<div style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;
          background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;font-weight:900;font-size:12px;
          border:2px solid #fff;box-shadow:0 0 18px rgba(245,158,11,.7),0 4px 8px rgba(0,0,0,.5);
          font-family:'Space Grotesk',sans-serif;">${i + 1}</div>`,
      });
      const sm = L.marker([bar.lat, bar.lng], { icon: ic }).addTo(cl);
      sm.bindTooltip(`Étape ${i + 1}: ${bar.name}`, { direction: 'top' });
      sm.on('click', () => onSelectBar(bar));
    });
    map.fitBounds(L.latLngBounds(ll), { padding: [60, 60], maxZoom: 15 });
  }, [activeCrawl, onSelectBar]);

  // ─── user location ───
  useEffect(() => {
    const map = mapRef.current; if (!map || !userLocation) return;
    if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
    const um = L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 8, fillColor: '#38bdf8', color: '#fff', weight: 3, opacity: 1, fillOpacity: 1,
    }).addTo(map);
    um.bindTooltip('Vous êtes ici', { permanent: false, direction: 'top' });
    userMarkerRef.current = um;
    map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.2 });
  }, [userLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className={`w-full h-full ${isPinDropperActive ? 'cursor-crosshair' : ''}`} />

      {isPinDropperActive && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] px-5 py-2.5 rounded-full
                        bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl shadow-amber-500/40
                        border-2 border-white/30 animate-pulse flex items-center gap-2">
          📍 Cliquez sur la carte pour placer votre bar
        </div>
      )}

      {/* Return to 3D Globe Button */}
      {onBackToGlobe && (
        <button
          onClick={onBackToGlobe}
          className="absolute left-4 bottom-8 z-[1000] flex items-center gap-2 px-3.5 py-2.5 rounded-xl
                     glass-strong border border-amber-500/40 text-amber-300 hover:text-white
                     hover:border-amber-400 hover:bg-amber-500/20 font-bold text-xs shadow-2xl
                     active:scale-95 transition-all cursor-pointer"
        >
          <span className="text-base">🌐</span>
          <span>Revenir au Globe 3D</span>
        </button>
      )}

      {/* Map controls */}
      <div className="absolute right-3 bottom-8 z-[1000] flex flex-col gap-1.5">
        <div className="relative">
          <MapCtrlBtn onClick={() => setShowLayerMenu(!showLayerMenu)} title="Couches">
            <Layers className="w-4 h-4 text-amber-400" />
          </MapCtrlBtn>
          {showLayerMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-48 glass-strong rounded-xl p-1.5 flex flex-col gap-0.5 text-[11px] animate-slide-up shadow-2xl">
              {[
                { id: 'voyager' as const, emoji: '🗺️', label: 'Carte Rue (Normale)' },
                { id: 'osm' as const, emoji: '🧭', label: 'OpenStreetMap' },
                { id: 'dark' as const, emoji: '🌙', label: 'Mode Nuit' },
                { id: 'satellite' as const, emoji: '🛰️', label: 'Satellite HD' },
              ].map((t) => (
                <button key={t.id} onClick={() => changeTiles(t.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-colors text-left
                    ${currentTile === t.id
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-300 hover:bg-white/10'}`}
                >{t.emoji} {t.label}</button>
              ))}
            </div>
          )}
        </div>
        <MapCtrlBtn onClick={() => mapRef.current?.zoomIn()} title="Zoom +"><ZoomIn className="w-4 h-4" /></MapCtrlBtn>
        <MapCtrlBtn onClick={() => mapRef.current?.zoomOut()} title="Zoom -"><ZoomOut className="w-4 h-4" /></MapCtrlBtn>
        <MapCtrlBtn onClick={() => mapRef.current?.flyTo([25, 10], 3, { duration: 1.2 })} title="Vue monde">
          <Compass className="w-4 h-4 text-cyan-400" />
        </MapCtrlBtn>
      </div>
    </div>
  );
};

function MapCtrlBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button onClick={onClick} title={title}
      className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-300
                 hover:bg-white/15 hover:text-white transition-all active:scale-95 shadow-lg">
      {children}
    </button>
  );
}
