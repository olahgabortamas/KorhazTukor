'use client';

import { useEffect, useRef } from 'react';

type MapOption = {
  source_list_id: string;
  hospital_name: string;
  locality: string;
  distance: number;
  median_wait_days: number;
  waiting_over_60: number;
  lat: number;
  lon: number;
};

type NearbyMapProps = {
  origin: { lat: number; lon: number; label: string };
  options: MapOption[];
};

declare global {
  interface Window {
    L?: any;
  }
}

const leafletStyleId = 'korhaztukor-leaflet-style';
const leafletScriptId = 'korhaztukor-leaflet-script';

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  return new Promise<any>((resolve, reject) => {
    const existingScript = document.getElementById(leafletScriptId) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.L), { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }
    if (!document.getElementById(leafletStyleId)) {
      const stylesheet = document.createElement('link');
      stylesheet.id = leafletStyleId;
      stylesheet.rel = 'stylesheet';
      stylesheet.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(stylesheet);
    }
    const script = document.createElement('script');
    script.id = leafletScriptId;
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Leaflet could not be loaded'));
    document.head.appendChild(script);
  });
}

function tooltip(document: Document, name: string, locality: string, distance: number, median: number) {
  const content = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = name;
  const detail = document.createElement('span');
  detail.textContent = `${locality} · ${Math.round(distance)} km · medián ${median} nap`;
  content.append(title, detail);
  return content;
}

export function NearbyMap({ origin, options }: NearbyMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: any;
    let cancelled = false;
    void loadLeaflet().then((L) => {
      if (cancelled || !mapElement.current || !L) return;
      map = L.map(mapElement.current, { scrollWheelZoom: false, zoomControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const points: Array<[number, number]> = [[origin.lat, origin.lon]];
      L.circleMarker([origin.lat, origin.lon], {
        radius: 9,
        color: '#ffffff',
        weight: 3,
        fillColor: '#0c7567',
        fillOpacity: 1,
      }).addTo(map).bindTooltip(origin.label, { direction: 'top' });

      options.forEach((option) => {
        points.push([option.lat, option.lon]);
        L.circleMarker([option.lat, option.lon], {
          radius: 8,
          color: '#0d302b',
          weight: 2,
          fillColor: '#62d2bd',
          fillOpacity: 1,
        }).addTo(map).bindTooltip(tooltip(document, option.hospital_name, option.locality, option.distance, option.median_wait_days), { direction: 'top' });
      });
      map.fitBounds(points, { padding: [36, 36], maxZoom: options.length === 1 ? 10 : 12 });
    }).catch(() => undefined);

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [options, origin]);

  return <div className="nearby-map" ref={mapElement} aria-label="Közeli intézmények térképe" />;
}
