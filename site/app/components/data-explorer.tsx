'use client';

import { useEffect, useMemo, useState } from 'react';
import { hospitalLocations } from '../data/hospital-locations';

type HistoryPoint = {
  date: string;
  waiting_over_60: number;
  treated_previous_6_months: number;
  reporting_lists: number;
};

type ProcedureRow = {
  source_list_id: string;
  hospital_code: string;
  hospital_name: string;
  region: string;
  list_name: string;
  waiting_over_60: number;
  treated_previous_6_months: number;
  median_wait_days: number;
  mean_wait_days: number;
  quality_flags: string[];
  source_url: string;
};

type Procedure = {
  code: string;
  name: string;
  waiting_over_60: number;
  treated_previous_6_months: number;
  hospital_count: number;
  reporting_list_count: number;
  flagged_list_count: number;
  history: HistoryPoint[];
  rows: ProcedureRow[];
};

type Hospital = {
  code: string;
  name: string;
  region: string;
  list_count: number;
  waiting_over_60: number;
  treated_previous_6_months: number;
  flagged_list_count: number;
  procedures: string[];
};

type SiteData = {
  updated_date: string;
  history_start_date: string;
  snapshot_count: number;
  source_url: string;
  summary: {
    reporting_hospitals: number;
    procedure_types: number;
    current_rows: number;
    waiting_over_60: number;
    treated_previous_6_months: number;
    flagged_rows: number;
  };
  procedures: Procedure[];
  hospitals: Hospital[];
};

type UserLocation = {
  lat: number;
  lon: number;
  label: string;
};

const REMOTE_DATA = 'https://raw.githubusercontent.com/olahgabortamas/KorhazTukor/main/site/public/data/korhaztukor.json';
const number = new Intl.NumberFormat('hu-HU');
const date = new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' });

const flagLabels: Record<string, string> = {
  LOW_SAMPLE: 'Kevés ellátott eset',
  STRONGLY_SKEWED: 'Erősen ferde eloszlás',
  HIGH_MEAN_MEDIAN_GAP: 'Nagy átlag–medián eltérés',
};

function normalize(value: string) {
  return value.toLocaleLowerCase('hu-HU').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function distanceInKm(from: UserLocation, to: { lat: number; lon: number }) {
  const radians = (value: number) => value * Math.PI / 180;
  const earthRadiusKm = 6371;
  const latitudeDifference = radians(to.lat - from.lat);
  const longitudeDifference = radians(to.lon - from.lon);
  const value = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(longitudeDifference / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function DataExplorer() {
  const [data, setData] = useState<SiteData | null>(null);
  const [error, setError] = useState(false);
  const [view, setView] = useState<'procedures' | 'hospitals'>('procedures');
  const [query, setQuery] = useState('');
  const [activeCode, setActiveCode] = useState('O20');
  const [locationQuery, setLocationQuery] = useState('');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [radius, setRadius] = useState(100);

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get('q') ?? '';
    setQuery(initialQuery);
    const source = window.location.hostname === 'localhost' ? '/data/korhaztukor.json' : REMOTE_DATA;
    fetch(source, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Data fetch failed');
        return response.json() as Promise<SiteData>;
      })
      .then((payload) => {
        setData(payload);
        if (!payload.procedures.some((item) => item.code === 'O20')) {
          setActiveCode(payload.procedures[0]?.code ?? '');
        }
      })
      .catch(() => setError(true));
  }, []);

  const filteredProcedures = useMemo(() => {
    if (!data) return [];
    const needle = normalize(query);
    return data.procedures.filter((item) => normalize(item.name).includes(needle));
  }, [data, query]);

  const filteredHospitals = useMemo(() => {
    if (!data) return [];
    const needle = normalize(query);
    return data.hospitals.filter((item) =>
      normalize(`${item.name} ${item.region} ${item.procedures.join(' ')}`).includes(needle),
    );
  }, [data, query]);

  const active = data?.procedures.find((item) => item.code === activeCode)
    ?? filteredProcedures[0]
    ?? data?.procedures[0];

  const nearbyOptions = useMemo(() => {
    if (!active || !userLocation) return [];
    return active.rows
      .map((row) => {
        const location = hospitalLocations[row.hospital_code];
        if (!location) return null;
        return { ...row, locality: location.locality, distance: distanceInKm(userLocation, location) };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null && row.distance <= radius)
      .sort((first, second) => first.distance - second.distance);
  }, [active, radius, userLocation]);

  async function searchLocation() {
    const queryToFind = locationQuery.trim();
    if (!queryToFind) return;
    setLocationStatus('loading');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=hu&q=${encodeURIComponent(queryToFind)}`);
      const results = await response.json() as Array<{ lat: string; lon: string; display_name: string }>;
      const result = results[0];
      if (!result) throw new Error('No result');
      setUserLocation({ lat: Number(result.lat), lon: Number(result.lon), label: result.display_name.split(',').slice(0, 2).join(',') });
      setLocationStatus('idle');
    } catch {
      setLocationStatus('error');
    }
  }

  function useBrowserLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lon: coords.longitude, label: 'Jelenlegi helyzeted' });
        setLocationStatus('idle');
      },
      () => setLocationStatus('error'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  if (error) {
    return (
      <section className="section-shell explorer-error" id="varolistak">
        <span>Az adatnézet most nem érhető el.</span>
        <p>A legutóbbi jó snapshot biztonságban van; próbáld újra később.</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="section-shell explorer-loading" id="varolistak" aria-live="polite">
        <span /> <span /> <span />
        <p>Aktuális adatok betöltése…</p>
      </section>
    );
  }

  const maxTrend = Math.max(...(active?.history.map((item) => item.waiting_over_60) ?? [1]), 1);

  return (
    <section className="data-explorer" id="varolistak">
      <div className="section-shell explorer-heading">
        <div>
          <span className="section-kicker">Aktuális kép</span>
          <h2>Fedezd fel az adatokat</h2>
        </div>
        <p>
          Frissítve: <strong>{date.format(new Date(`${data.updated_date}T12:00:00Z`))}</strong><br />
          {data.snapshot_count === 1 ? 'A történeti gyűjtés első napja.' : `${data.snapshot_count} napi snapshot érhető el.`}
        </p>
      </div>

      <div className="section-shell explorer-toolbar">
        <div className="view-tabs" role="tablist" aria-label="Adatnézet">
          <button className={view === 'procedures' ? 'active' : ''} onClick={() => setView('procedures')} role="tab" aria-selected={view === 'procedures'}>
            Beavatkozások <span>{data.procedures.length}</span>
          </button>
          <button className={view === 'hospitals' ? 'active' : ''} onClick={() => setView('hospitals')} role="tab" aria-selected={view === 'hospitals'} id="intezmenyek">
            Intézmények <span>{data.hospitals.length}</span>
          </button>
        </div>
        <label className="filter-input">
          <span className="search-icon" aria-hidden="true" />
          <span className="sr-only">Szűrés</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={view === 'procedures' ? 'Beavatkozás szűrése…' : 'Intézmény szűrése…'} />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Keresés törlése">×</button>}
        </label>
      </div>

      {view === 'procedures' ? (
        <>
          <div className="section-shell procedure-grid">
            {filteredProcedures.slice(0, 6).map((procedure, index) => (
              <button
                type="button"
                key={procedure.code}
                className={`procedure-card ${procedure.code === active?.code ? 'selected' : ''}`}
                onClick={() => setActiveCode(procedure.code)}
              >
                <span className="card-index">{String(index + 1).padStart(2, '0')}</span>
                <h3>{procedure.name}</h3>
                <div className="card-metric">
                  <strong>{number.format(procedure.waiting_over_60)}</strong>
                  <span>60+ napja várakozik</span>
                </div>
                <p>{procedure.hospital_count} intézmény · {number.format(procedure.treated_previous_6_months)} ellátott / 6 hó</p>
                <span className="card-link">Részletek <i>→</i></span>
              </button>
            ))}
          </div>

          {active && (
            <article className="section-shell procedure-detail" id="reszletek">
              <header className="detail-header">
                <div>
                  <span className="section-kicker">Beavatkozás részletei</span>
                  <h2>{active.name}</h2>
                </div>
                <span className="code-pill">NEAK {active.code}</span>
              </header>

              <div className="detail-metrics">
                <div><span>60+ napja vár</span><strong>{number.format(active.waiting_over_60)}</strong></div>
                <div><span>Ellátott / 6 hó</span><strong>{number.format(active.treated_previous_6_months)}</strong></div>
                <div><span>Intézmények</span><strong>{active.hospital_count}</strong></div>
                <div><span>Értelmezési jelzés</span><strong>{active.flagged_list_count}</strong></div>
              </div>

              <div className="trend-panel">
                <div>
                  <span className="panel-label">60+ napja várakozók története</span>
                  <strong>{number.format(active.waiting_over_60)}</strong>
                  <p>{active.history.length === 1 ? 'Ez az első adatpont. A vonal a következő napi gyűjtésekkel indul el.' : `${active.history.length} napi adatpont.`}</p>
                </div>
                <div className={`mini-trend ${active.history.length === 1 ? 'single' : ''}`} aria-label={`${active.history.length} történeti adatpont`}>
                  {active.history.map((point) => (
                    <i key={point.date} style={{ height: `${Math.max(14, point.waiting_over_60 / maxTrend * 100)}%` }} title={`${point.date}: ${point.waiting_over_60}`} />
                  ))}
                </div>
              </div>

              <section className="nearby-panel" aria-labelledby="nearby-heading">
                <div className="nearby-intro">
                  <div>
                    <span className="section-kicker">Környékbeli lehetőségek</span>
                    <h3 id="nearby-heading">Mely intézmények érhetők el a közeledben?</h3>
                  </div>
                  <p>Távolság szerint rendezett, megfigyelt várólista-adatok. Ez nem beutalási vagy kezelési javaslat.</p>
                </div>

                <div className="location-controls">
                  <label className="location-input">
                    <span className="sr-only">Város, cím vagy irányítószám</span>
                    <input
                      value={locationQuery}
                      onChange={(event) => setLocationQuery(event.target.value)}
                      onKeyDown={(event) => { if (event.key === 'Enter') void searchLocation(); }}
                      placeholder="Város, cím vagy irányítószám"
                    />
                    <button type="button" onClick={() => void searchLocation()} disabled={locationStatus === 'loading'}>
                      {locationStatus === 'loading' ? 'Keresés…' : 'Keresés'}
                    </button>
                  </label>
                  <button type="button" className="location-button" onClick={useBrowserLocation} disabled={locationStatus === 'loading'}>
                    ⌖ Jelenlegi helyzet
                  </button>
                  <label className="radius-select">Körzet
                    <select value={radius} onChange={(event) => setRadius(Number(event.target.value))}>
                      <option value={25}>25 km</option>
                      <option value={50}>50 km</option>
                      <option value={100}>100 km</option>
                      <option value={200}>200 km</option>
                    </select>
                  </label>
                </div>

                {locationStatus === 'error' && <p className="location-error">A helyet most nem találtuk. Próbálj meg várost vagy irányítószámot megadni.</p>}

                {userLocation ? (
                  <div className="nearby-results">
                    <div className="nearby-result-header"><span>Kiindulópont: <strong>{userLocation.label}</strong></span><span>{nearbyOptions.length} lehetőség {radius} km-en belül</span></div>
                    {nearbyOptions.length ? (
                      <ol className="nearby-list">
                        {nearbyOptions.map((option) => (
                          <li key={option.source_list_id}>
                            <span className="nearby-distance">{Math.round(option.distance)}<small>km</small></span>
                            <div><a href={option.source_url} target="_blank" rel="noreferrer">{option.hospital_name}</a><p>{option.locality} · {option.region}</p></div>
                            <div className="nearby-metric"><span>Medián</span><strong>{option.median_wait_days} nap</strong></div>
                            <div className="nearby-metric"><span>60+ nap</span><strong>{number.format(option.waiting_over_60)}</strong></div>
                          </li>
                        ))}
                      </ol>
                    ) : <p className="nearby-empty">Ebben a körzetben nincs geokódolt, jelentő intézmény ennél a beavatkozásnál. Próbálj nagyobb körzetet.</p>}
                  </div>
                ) : <p className="nearby-hint">Adj meg egy helyet, és megmutatjuk az ennél a beavatkozásnál jelentő intézményeket légvonalbeli távolság szerint.</p>}
                <p className="nearby-note">A távolság intézményi központok közötti légvonal. A tényleges ellátási lehetőséget az orvosi beutalás, a területi ellátási kötelezettség és az intézmény határozza meg.</p>
              </section>

              <div className="table-wrap">
                <table>
                  <thead><tr><th>Intézmény</th><th>60+ nap</th><th>Medián</th><th>Átlag</th><th>Ellátott / 6 hó</th><th>Jelzés</th></tr></thead>
                  <tbody>
                    {active.rows.map((row) => (
                      <tr key={row.source_list_id}>
                        <td><a href={row.source_url} target="_blank" rel="noreferrer">{row.hospital_name}<small>{row.region}</small></a></td>
                        <td>{number.format(row.waiting_over_60)}</td>
                        <td>{row.median_wait_days} nap</td>
                        <td>{row.mean_wait_days} nap</td>
                        <td>{number.format(row.treated_previous_6_months)}</td>
                        <td>{row.quality_flags.length ? <span className="quality-pill" title={row.quality_flags.map((flag) => flagLabels[flag]).join(', ')}>Értelmezd óvatosan</span> : <span className="no-flag">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          )}
        </>
      ) : (
        <div className="section-shell hospital-grid">
          {filteredHospitals.map((hospital) => (
            <article className="hospital-card" key={hospital.code}>
              <div className="hospital-card-top"><span>{hospital.code}</span>{hospital.flagged_list_count > 0 && <i title="Van óvatosan értelmezendő adatsor" />}</div>
              <h3>{hospital.name}</h3>
              <p>{hospital.region}</p>
              <div><strong>{number.format(hospital.waiting_over_60)}</strong><span>60+ napja vár</span></div>
              <footer>{hospital.list_count} jelentett lista <span>·</span> {number.format(hospital.treated_previous_6_months)} ellátott</footer>
            </article>
          ))}
          {!filteredHospitals.length && <p className="empty-state">Nincs a keresésnek megfelelő intézmény.</p>}
        </div>
      )}
    </section>
  );
}
