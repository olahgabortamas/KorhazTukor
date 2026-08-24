import { ThemeToggle } from './components/theme-toggle';
import { DataExplorer } from './components/data-explorer';

const overview = [
  { value: '38', label: 'jelentő intézmény' },
  { value: '19', label: 'várólista-típus' },
  { value: '113', label: 'aktuális adatsor' },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="KórházTükör kezdőlap">
          <span className="brand-mark" aria-hidden="true">KT</span>
          <span className="brand-name">KórházTükör</span>
        </a>
        <nav className="main-nav" aria-label="Fő navigáció">
          <a href="#varolistak">Várólisták</a>
          <a href="#intezmenyek">Intézmények</a>
          <a href="#modszertan">Módszertan</a>
        </nav>
        <ThemeToggle />
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span /> Független, nyílt adatprojekt</div>
          <h1>A várólisták változása,<br /><em>érthetően.</em></h1>
          <p className="hero-lead">
            Kövesd a magyar kórházak hivatalosan közölt várólista-adatait
            intézményenként és beavatkozásonként — rangsorok és félrevezető
            ígéretek nélkül.
          </p>

          <form className="search-shell" action="#varolistak">
            <label htmlFor="hero-search">Milyen beavatkozás érdekel?</label>
            <div className="search-control">
              <span className="search-icon" aria-hidden="true" />
              <input id="hero-search" name="q" placeholder="Például: térdprotézis" />
              <button type="submit">Keresés</button>
            </div>
            <div className="search-hints" aria-label="Népszerű keresések">
              <span>Gyakori:</span>
              <a href="?q=Térdprotézis#varolistak">Térdprotézis</a>
              <a href="?q=Csípőprotézis#varolistak">Csípőprotézis</a>
              <a href="?q=Szürkehályog#varolistak">Szürkehályog</a>
            </div>
          </form>
        </div>

        <aside className="data-card" aria-label="Aktuális adatállapot">
          <div className="card-topline">
            <span className="live-pill"><i /> Adatgyűjtés aktív</span>
            <span className="mono">2026. 08. 24.</span>
          </div>
          <div className="pulse-visual" aria-hidden="true">
            <span className="pulse-label">60+ napja várakozik</span>
            <strong>42 649</strong>
            <div className="bars">
              {[38, 48, 44, 62, 58, 76, 70, 88, 82, 92, 86, 96].map((height, index) => (
                <i key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
          <div className="overview-grid">
            {overview.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <p className="source-note">
            <span aria-hidden="true">↗</span>
            Forrás: NEAK nyilvános várólista-nyilvántartás
          </p>
        </aside>
      </section>

      <section className="context-strip" aria-label="Adatok értelmezése">
        <p><strong>Fontos:</strong> a közölt várakozási idő az előző hat hónapban ellátott eseteket írja le, nem személyes előrejelzés.</p>
        <a href="#modszertan">Hogyan értelmezd? <span>→</span></a>
      </section>

      <DataExplorer />

      <section className="methodology" id="modszertan">
        <div className="section-shell methodology-grid">
          <div>
            <span className="section-kicker">Módszertan</span>
            <h2>Adatot mutatunk,<br />nem ítéletet.</h2>
          </div>
          <div className="principles">
            <article><span>01</span><div><h3>Hivatalos forrás</h3><p>Minden adat a NEAK nyilvános, intézményi várólista-felületéről származik. Az eredeti sor egy kattintással megnyitható.</p></div></article>
            <article><span>02</span><div><h3>Nem személyes előrejelzés</h3><p>A medián és az átlag az előző hat hónapban már ellátott esetek tényleges várakozását írja le.</p></div></article>
            <article><span>03</span><div><h3>Nincs kórházrangsor</h3><p>Az intézmények betegösszetétele és működése eltér. A számokat kontextussal, nem pontszámmal közöljük.</p></div></article>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="section-shell footer-grid">
          <div className="brand"><span className="brand-mark" aria-hidden="true">KT</span><span><strong>KórházTükör</strong><small>Közérdekű adatok, közérthetően.</small></span></div>
          <p>Független, nyílt adatprojekt. Nem a NEAK hivatalos szolgáltatása és nem minősül orvosi tanácsnak.</p>
          <div><a href="https://github.com/olahgabortamas/KorhazTukor">GitHub ↗</a><a href={"https://varolista.neak.gov.hu/varolista_pub/"}>NEAK forrás ↗</a></div>
        </div>
      </footer>
    </main>
  );
}
