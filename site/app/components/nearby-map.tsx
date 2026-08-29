'use client';

import { useEffect, useRef, useState } from 'react';

type MapOption = {
  source_list_id: string;
  hospital_name: string;
  locality: string;
  distance: number;
  travel_distance_km?: number;
  travel_duration_minutes?: number;
  median_wait_days: number;
  waiting_over_60: number;
  treated_previous_6_months: number;
  quality_flags: string[];
  lat: number;
  lon: number;
  history: Array<{ date: string; waiting_over_60: number }>;
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

const number = { format: (value: number) => Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') };

function markerColour(option: MapOption) {
  if (option.quality_flags.length) return '#78658b';
  if (option.median_wait_days <= 60) return '#159b68';
  if (option.median_wait_days <= 120) return '#dd9718';
  return '#cf584c';
}

function tooltip(document: Document, option: MapOption) {
  const content = document.createElement('div');
  const title = document.createElement('strong');
  title.textContent = option.hospital_name;
  const detail = document.createElement('span');
  detail.textContent = `${option.locality} · ${option.travel_duration_minutes ? `${Math.round(option.travel_duration_minutes)} perc autóval` : `${Math.round(option.distance)} km légvonalban`}`;
  const median = document.createElement('span');
  median.textContent = `Medián: ${option.median_wait_days} nap · 60+ napja vár: ${number.format(option.waiting_over_60)}`;
  const treated = document.createElement('span');
  treated.textContent = `Ellátott / 6 hó: ${number.format(option.treated_previous_6_months)}`;
  const trend = document.createElement('span');
  const first = option.history[0]?.waiting_over_60;
  const latest = option.history[option.history.length - 1]?.waiting_over_60;
  const change = first === undefined || latest === undefined ? null : latest - first;
  trend.textContent = option.history.length < 3 || change === null
    ? 'Trend: még nincs elég adat'
    : `Változás: ${change > 0 ? '+' : change < 0 ? '−' : '±'} ${number.format(Math.abs(change))} a gyűjtés kezdete óta`;
  if (option.quality_flags.length) {
    const caution = document.createElement('em');
    caution.textContent = 'Értelmezd óvatosan: az adatsor minőségi jelzést kapott.';
    content.append(title, detail, median, treated, trend, caution);
  } else {
    content.append(title, detail, median, treated, trend);
  }
  return content;
}

export function NearbyMap({ origin, options }: NearbyMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => setDark(document.documentElement.dataset.theme === 'dark');
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let map: any;
    let cancelled = false;
    void loadLeaflet().then((L) => {
      if (cancelled || !mapElement.current || !L) return;
      map = L.map(mapElement.current, { scrollWheelZoom: false, zoomControl: true });
      L.tileLayer(dark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
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
          fillColor: markerColour(option),
          fillOpacity: 1,
        }).addTo(map).bindTooltip(tooltip(document, option), { direction: 'top' });
      });
      map.fitBounds(points, { padding: [36, 36], maxZoom: options.length === 1 ? 10 : 12 });
    }).catch(() => undefined);

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [dark, options, origin]);

  return <div className="nearby-map" ref={mapElement} aria-label="Közeli intézmények térképe" />;
}
