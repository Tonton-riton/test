import React, { useEffect, useRef, useState, useCallback } from 'react';
import Globe from 'globe.gl';
import * as THREE from 'three';
import { Bar, BarCrawl } from '../../types';
import { BAR_TYPES_META } from '../../utils/barUtils';
import { Play, Pause, Compass, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';

interface BarGlobe3DProps {
  bars: Bar[];
  selectedBar: Bar | null;
  onSelectBar: (bar: Bar) => void;
  activeCrawl: BarCrawl | null;
  isPinDropperActive?: boolean;
  onPinDropped?: (lat: number, lng: number) => void;
  userLocation: { lat: number; lng: number } | null;
  targetCoords?: { lat: number; lng: number; zoom?: number } | null;
}

export const BarGlobe3D: React.FC<BarGlobe3DProps> = ({
  bars,
  selectedBar,
  onSelectBar,
  activeCrawl,
  isPinDropperActive,
  onPinDropped,
  userLocation,
  targetCoords,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [globeTexture, setGlobeTexture] = useState<'dark' | 'night'>('dark');

  // Keep references to latest props for callbacks
  const onSelectBarRef = useRef(onSelectBar);
  onSelectBarRef.current = onSelectBar;
  const isPinDropperActiveRef = useRef(isPinDropperActive);
  isPinDropperActiveRef.current = isPinDropperActive;
  const onPinDroppedRef = useRef(onPinDropped);
  onPinDroppedRef.current = onPinDropped;
  const selectedBarRef = useRef(selectedBar);
  selectedBarRef.current = selectedBar;

  // Tooltip HTML generator
  const getTooltipHtml = useCallback((d: any) => {
    const meta = BAR_TYPES_META[d.type as keyof typeof BAR_TYPES_META] || BAR_TYPES_META.cocktail;
    return `
      <div style="
        background: rgba(10, 15, 29, 0.95);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 14px;
        padding: 10px 14px;
        color: #fff;
        font-family: 'Plus Jakarta Sans', sans-serif;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 20px ${d.color}55;
        pointer-events: none;
        max-width: 240px;
      ">
        <div style="display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 14px; color: #f8fafc;">
          <span style="font-size: 16px;">${meta.emoji}</span>
          <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${d.name}</span>
        </div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 3px;">
          ${d.city}, ${d.country}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 12px;">
          <span style="color: #fbbf24; font-weight: bold;">★ ${d.rating.toFixed(1)}</span>
          <span style="color: #64748b; font-weight: 600;">${'€'.repeat(d.priceLevel)}</span>
          <span style="color: ${d.isOpen ? '#10b981' : '#f43f5e'}; font-size: 10px; font-weight: 800;">
            ${d.isOpen ? '● Ouvert' : 'Fermé'}
          </span>
        </div>
      </div>
    `;
  }, []);

  // Initialize Globe
  useEffect(() => {
    if (!containerRef.current || globeRef.current) return;

    const globe = (Globe as any)()(containerRef.current)
      .backgroundColor('#030712')
      .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-dark.jpg')
      .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .showAtmosphere(true)
      .atmosphereColor('#94a3b8')
      .atmosphereAltitude(0.18)
      // Pure glowing spheres via 3D Objects (clean, no depth fighting)
      .objectLat('lat')
      .objectLng('lng')
      .objectAltitude(0.005)
      .objectThreeObject((d: any) => {
        const isSel = selectedBarRef.current?.id === d.id;
        const color = d.color || '#f59e0b';
        const group = new THREE.Group();

        // 1. Core solid glowing sphere
        const coreRadius = isSel ? 1.8 : 1.3;
        const coreGeo = new THREE.SphereGeometry(coreRadius, 24, 24);
        const coreMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        group.add(coreMesh);

        // 2. Outer glowing halo sphere (depthWrite: false prevents flickering/glitches!)
        const haloRadius = isSel ? 2.8 : 1.9;
        const haloGeo = new THREE.SphereGeometry(haloRadius, 20, 20);
        const haloMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity: isSel ? 0.5 : 0.22,
          blending: THREE.AdditiveBlending,
          depthWrite: false, // CRITICAL: prevents depth buffer clipping and flickering!
        });
        const haloMesh = new THREE.Mesh(haloGeo, haloMat);
        haloMesh.raycast = () => {}; // only raycast the solid core
        group.add(haloMesh);

        return group;
      })
      .objectLabel(getTooltipHtml)
      .onObjectClick((obj: any) => {
        onSelectBarRef.current(obj as Bar);
      })
      // Ripple rings
      .ringLat('lat')
      .ringLng('lng')
      .ringColor('color')
      .ringMaxRadius('maxR')
      .ringPropagationSpeed('propagationSpeed')
      .ringRepeatPeriod('repeatPeriod')
      // Crawl arcs
      .arcStartLat('startLat')
      .arcStartLng('startLng')
      .arcEndLat('endLat')
      .arcEndLng('endLng')
      .arcColor('color')
      .arcAltitudeAutoScale(0.3)
      .arcStroke(1.8)
      .arcDashLength(0.4)
      .arcDashGap(0.2)
      .arcDashAnimateTime(2000)
      .onGlobeClick((coords: { lat: number; lng: number }) => {
        if (isPinDropperActiveRef.current && onPinDroppedRef.current) {
          onPinDroppedRef.current(coords.lat, coords.lng);
        }
      });

    // Orbit controls settings
    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.6;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 110;
      controls.maxDistance = 450;
    }

    globe.pointOfView({ lat: 25, lng: 10, altitude: 2.2 });
    globeRef.current = globe;

    // Resize observer
    const handleResize = () => {
      if (containerRef.current && globeRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        if (w > 0 && h > 0) {
          globeRef.current.width(w).height(h);
        }
      }
    };
    handleResize();

    const observer = new ResizeObserver(() => handleResize());
    observer.observe(containerRef.current);
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      if (globeRef.current) {
        try {
          globeRef.current._destructor();
        } catch {}
        globeRef.current = null;
      }
    };
  }, [getTooltipHtml]);

  // Update Objects Data (Sphères lumineuses 3D)
  useEffect(() => {
    if (!globeRef.current) return;
    const objectsData = bars.map((b) => {
      const meta = BAR_TYPES_META[b.type] || BAR_TYPES_META.cocktail;
      const isSel = selectedBar?.id === b.id;
      return {
        ...b,
        color: isSel ? '#f59e0b' : meta.accentHex,
      };
    });
    globeRef.current.objectsData(objectsData);
  }, [bars, selectedBar]);

  // Update Rings Data (glowing pulsing circles)
  useEffect(() => {
    if (!globeRef.current) return;
    const rings: Array<{
      lat: number;
      lng: number;
      maxR: number;
      propagationSpeed: number;
      repeatPeriod: number;
      color: string;
    }> = [];

    // Selected bar gets a strong glowing amber ripple
    if (selectedBar) {
      rings.push({
        lat: selectedBar.lat,
        lng: selectedBar.lng,
        maxR: 4.8,
        propagationSpeed: 2.5,
        repeatPeriod: 1000,
        color: '#f59e0b',
      });
    }

    // User location ring
    if (userLocation) {
      rings.push({
        lat: userLocation.lat,
        lng: userLocation.lng,
        maxR: 3.8,
        propagationSpeed: 2.5,
        repeatPeriod: 1400,
        color: '#38bdf8',
      });
    }

    globeRef.current.ringsData(rings);
  }, [bars, selectedBar, userLocation]);

  // Update Arcs Data (Crawls)
  useEffect(() => {
    if (!globeRef.current) return;
    if (!activeCrawl?.stopsWithBars || activeCrawl.stopsWithBars.length < 2) {
      globeRef.current.arcsData([]);
      return;
    }
    const arcs = [];
    for (let i = 0; i < activeCrawl.stopsWithBars.length - 1; i++) {
      const from = activeCrawl.stopsWithBars[i];
      const to = activeCrawl.stopsWithBars[i + 1];
      arcs.push({
        startLat: from.lat,
        startLng: from.lng,
        endLat: to.lat,
        endLng: to.lng,
        color: ['#f59e0b', '#ef4444'],
      });
    }
    globeRef.current.arcsData(arcs);
  }, [activeCrawl]);

  // Handle Target Coords Fly-to
  useEffect(() => {
    if (!globeRef.current || !targetCoords) return;
    const alt = targetCoords.zoom ? Math.max(0.25, 2.5 / (targetCoords.zoom * 0.4)) : 0.8;
    globeRef.current.pointOfView({ lat: targetCoords.lat, lng: targetCoords.lng, altitude: alt }, 1600);
  }, [targetCoords]);

  // Handle Texture change
  useEffect(() => {
    if (!globeRef.current) return;
    const url =
      globeTexture === 'dark'
        ? 'https://unpkg.com/three-globe/example/img/earth-dark.jpg'
        : 'https://unpkg.com/three-globe/example/img/earth-night.jpg';
    globeRef.current.globeImageUrl(url);
  }, [globeTexture]);

  // Auto-rotation toggle
  const toggleRotation = () => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) {
      const next = !isRotating;
      controls.autoRotate = next;
      setIsRotating(next);
    }
  };

  const handleZoom = (delta: number) => {
    if (!globeRef.current) return;
    const pov = globeRef.current.pointOfView();
    const newAlt = Math.max(0.18, Math.min(3.5, pov.altitude + delta));
    globeRef.current.pointOfView({ ...pov, altitude: newAlt }, 500);
  };

  const resetView = () => {
    if (!globeRef.current) return;
    globeRef.current.pointOfView({ lat: 25, lng: 10, altitude: 2.2 }, 1200);
  };

  return (
    <div className="relative w-full h-full bg-[#030712] overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full" />

      {/* Pin dropper alert */}
      {isPinDropperActive && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] px-5 py-2.5 rounded-full
                        bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl shadow-amber-500/40
                        border-2 border-white/30 animate-pulse flex items-center gap-2">
          📍 Cliquez sur le globe pour placer votre bar
        </div>
      )}

      {/* 3D HUD Controls */}
      <div className="absolute right-4 bottom-8 z-[1000] flex flex-col gap-2">
        <button
          onClick={toggleRotation}
          title={isRotating ? 'Mettre en pause la rotation' : 'Activer la rotation'}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-300
                     hover:bg-white/15 hover:text-amber-400 transition-all active:scale-95 shadow-lg cursor-pointer"
        >
          {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setGlobeTexture(globeTexture === 'dark' ? 'night' : 'dark')}
          title="Changer de texture (Noir & Gris / Nuit & Lumières)"
          className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-300
                     hover:bg-white/15 hover:text-amber-400 transition-all active:scale-95 shadow-lg cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 ${globeTexture === 'night' ? 'text-amber-400' : ''}`} />
        </button>

        <button
          onClick={() => handleZoom(-0.4)}
          title="Zoom +"
          className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-300
                     hover:bg-white/15 hover:text-white transition-all active:scale-95 shadow-lg cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleZoom(0.4)}
          title="Zoom -"
          className="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-300
                     hover:bg-white/15 hover:text-white transition-all active:scale-95 shadow-lg cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={resetView}
          title="Réinitialiser la vue"
          className="w-10 h-10 rounded-xl glass flex items-center justify-center text-cyan-400
                     hover:bg-white/15 hover:text-cyan-300 transition-all active:scale-95 shadow-lg cursor-pointer"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Watermark badge */}
      <div className="absolute left-4 bottom-4 z-[900] pointer-events-none opacity-70 text-[10px] text-slate-400 font-mono flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
        <span>Globe 3D interactif • Sphères Lumineuses</span>
      </div>
    </div>
  );
};

export default BarGlobe3D;
