# KórházTükör — MVP- és megvalósítási terv

Állapot: tervezési alapverzió  
Dátum: 2026-08-24  
Cél: nyilvános, hosszú távon is 0 Ft-os pet project, amely a magyar kórházi várólisták hivatalos aggregált adatait naponta archiválja és érthető időbeli nézetben mutatja meg.

## 1. Termékdöntés

A termék neve **KórházTükör**. Az MVP első és egyetlen modulja a várólisták történeti követése.

Az MVP ígérete:

> Lásd, hogyan változnak a hivatalosan közölt magyar kórházi várólista-mutatók intézményenként és beavatkozásonként.

Az MVP nem azt állítja meg, hogy „hol kerülsz leggyorsabban sorra”, és nem rangsorolja a kórházakat. A közölt medián és átlag az előző hat hónapban már ellátott eseteket írja le; nem egy új beteg személyes, várható várakozási ideje.

### Elsődleges felhasználók

1. Beteg vagy hozzátartozó, aki érteni szeretné egy beavatkozás jelenlegi és korábbi helyzetét.
2. Újságíró vagy kutató, aki intézményi és országos trendet keres.
3. Egészségügyi szakember vagy döntéshozó, aki visszakereshető adatot szeretne.

### Fő felhasználói feladat

„Térdprotézisre várok. Mutasd meg, hogy az egyes intézmények hivatalos mutatói hogyan alakultak, és figyelmeztess, ha az adatot óvatosan kell értelmezni.”

## 2. Az MVP pontos határa

### Benne van

- napi egy aggregált NEAK-snapshot;
- beavatkozáskereső és beavatkozásoldal;
- intézménykereső és intézményoldal;
- aktuális értékek és az összegyűjtés kezdete óta látható idősor;
- négy hivatalosan közölt mutató:
  - 60 napnál régebben várakozók száma;
  - az előző hat hónapban ellátott esetek száma;
  - az előző hat hónap tényleges várakozási idejének mediánja;
  - ugyanezen időszak átlaga;
- egyszerű, determinisztikus adatminőségi figyelmeztetések;
- minden oldalon adatdátum, hivatalos forráslink és módszertani magyarázat;
- mobilbarát, akadálymentes statikus weboldal;
- normalizált adatok letöltése CSV-ben;
- nyilvános adatfrissítési státusz.

### Nincs benne

- regisztráció, profil, e-mailes értesítés vagy push;
- TAJ, várólista-esetazonosító vagy bármilyen betegszintű adat;
- „legjobb/legrosszabb” kórház, pontszám vagy automatikus ajánlás;
- várható személyes műtéti időpont becslése;
- térkép, útvonaltervezés vagy területi ellátási jogosultság;
- mesterséges intelligencia;
- fertőzési, ágy-, halálozási, finanszírozási, császármetszési vagy egynapos sebészeti adat;
- adminfelület és kézi tartalomkezelő;
- fizetős domain, fizetős adatbázis vagy szerver.

Ezek bármelyike csak a stabil MVP és legalább 30 jó minőségű napi snapshot után kerülhet új döntésre.

## 3. Ellenőrzött kiinduló helyzet

A NEAK nyilvános tételes aggregált oldala:

`https://varolista.neak.gov.hu/varolista_pub/varolistak-teteles-lekerdezese/?tk=MIND`

2026-08-24-én az oldal:

- egyetlen HTTP-kérésre visszaadta az összes aktuális intézmény × várólista sort;
- 45 805 bájt HTML-t tartalmazott;
- 113 aggregált adatsort adott;
- mind a 113 sorhoz egyedi forrásbeli listaazonosító tartozott;
- egy `tb_int` azonosítójú, hétoszlopos HTML-táblát használt.

Ez kis terhelésű gyűjtőt tesz lehetővé: naponta egy kérés elég a magadathalmazhoz.

Fontos jogi kapu: a NEAK külön eljárást ír le közadatok újrahasznosítására. A gyűjtő fejlesztése és belső futtatása elkezdhető, de a nyilvános újraközlés előtt írásban érdemes megerősítést kérni a NEAK-tól a rendszeres aggregált újraközlés feltételeiről. Ez nem jogi tanács.

## 4. Mit mutat a weboldal?

### 4.1 Kezdőlap

- rövid termékígéret;
- „Milyen beavatkozás érdekel?” kereső;
- beavatkozások listája;
- utolsó sikeres frissítés ideje;
- hány intézmény, várólista és snapshot érhető el;
- jól látható „nem hivatalos oldal, nem orvosi tanács” figyelmeztetés.

Nem kell látványos országos toplista. A kezdőlap feladata, hogy a látogató egy beavatkozásoldalra jusson.

### 4.2 Beavatkozásoldal

Példa: `/beavatkozas/terdprotezis`

- közérthető cím és a forrás szerinti pontos elnevezés;
- aktuálisan jelentő intézmények száma;
- 60 napnál régebben várakozók intézményi sorokból számolt összege;
- előző hat hónapban ellátottak intézményi sorokból számolt összege;
- az összegek történeti grafikonja;
- intézménytábla az aktuális négy mutatóval és adatminőségi jelzéssel;
- rendezés név, medián, átlag, 60+ várakozó és ellátott szám szerint;
- intézményoldal-link és közvetlen NEAK-forráslink.

Nem számolunk „országos mediánt” az intézményi mediánokból. Egy mediánokból képzett medián vagy súlyozott átlag nem azonos az országos betegszintű mediánnal. Ha később a külön NEAK országos aggregátumot is gyűjtjük, azt egyértelműen hivatalos országos értékként lehet megjeleníteni.

### 4.3 Intézményoldal

Példa: `/intezmeny/u915`

- aktuális forrás szerinti intézménynév és korábbi névváltozatok;
- az intézmény összes jelentett várólistája;
- aktuális mutatók listánként;
- választható lista idősora;
- eltűnt vagy újonnan megjelent listák jelölése;
- forrás, adatdátum és értelmezési figyelmeztetés.

Az azonos intézményhez tartozó telephelyi/listaváltozatokat nem vonjuk automatikusan össze. Például egy városi vagy klinikai utótaggal külön közölt lista külön idősor marad.

### 4.4 Módszertan és adatstátusz

- pontos meződefiníciók;
- mit lehet és mit nem lehet az adatokból következtetni;
- gyűjtési gyakoriság és forrás;
- adatminőségi szabályok;
- ismert törések, intézményátnevezések;
- utolsó 30 gyűjtési futás eredménye;
- normalizált CSV letöltése.

## 5. Ingyenes technikai architektúra

```text
NEAK nyilvános aggregált HTML
              │ napi 1 kérés
              ▼
GitHub Actions + Python gyűjtő
              │ parse → validál → normalizál
              ▼
verziózott .csv.gz snapshotok a publikus repóban
              │ build
              ▼
előállított, oldalakra bontott JSON
              │
              ▼
Astro statikus weboldal → GitHub Pages
```

### Választott stack

- **Adatgyűjtés:** Python 3.12 standard library (`urllib`, `html.parser`), külső csomag nélkül.
- **Adatmodellezés/validálás:** Python dataclass és explicit séma.
- **Teszt:** Python `unittest`, eltárolt HTML-fixture-ök.
- **Web:** Astro + TypeScript, teljesen statikus build.
- **Grafikon:** könnyű kliensoldali könyvtár, például uPlot; minden grafikonhoz táblázatos alternatíva.
- **Automatizálás:** GitHub Actions.
- **Hoszting:** GitHub Pages egy nyilvános repóból.
- **URL az induláskor:** `https://<felhasznalo>.github.io/<repo>/`.

Nincs futó alkalmazásszerver, konténer, felhős adatbázis, objektumtár, CDN-előfizetés vagy titkos API-kulcs.

### Valódi költség

| Tétel | MVP-költség |
|---|---:|
| Publikus GitHub repository | 0 Ft |
| GitHub Actions publikus repóban | 0 Ft |
| GitHub Pages publikus repóban | 0 Ft |
| TLS a `github.io` címen | 0 Ft |
| Adatbázis/backend | 0 Ft |
| Analitika | 0 Ft, mert nincs |
| Saját `.hu` domain | nem része az MVP-nek; ez nem ingyenes |

A GitHub Pages nem fizetős SaaS hosztolására való; ez a terv nyílt, nem kereskedelmi adatközlő pet projectre vonatkozik. A jelenlegi dokumentált korlátok mellett az 1 GB-os ajánlott repository- és publikáltoldal-méret, valamint a havi 100 GB-os puha sávszélességi limit bőséges. Ha a projekt később üzleti termékké válik, új hosztingdöntés kell.

## 6. Adatmodell

### 6.1 Snapshot metadata

```json
{
  "schema_version": 1,
  "captured_at_utc": "2026-08-24T02:17:31Z",
  "source_url": "https://varolista.neak.gov.hu/.../?tk=MIND",
  "source_sha256": "...",
  "http_status": 200,
  "parser_version": "1.0.0",
  "row_count": 113
}
```

### 6.2 Normalizált napi CSV

Egy sor egy forrásbeli intézményi várólista egy adott napon.

| Mező | Jelentés |
|---|---|
| `captured_date` | UTC szerinti snapshotnap |
| `source_list_id` | a NEAK-link teljes `v` paramétere; elsődleges forrásazonosító |
| `source_institution_code` | a forrásazonosító első négy karaktere, amíg a NEAK meg nem erősíti a jelentését |
| `procedure_code` | a következő három karakter, szövegként megőrizve, például `001` vagy `O20` |
| `variant_code` | esetleges további telephely/listaváltozat-kód |
| `waiting_list_name_raw` | forrás szerinti listaelnevezés |
| `region_name_raw` | forrás szerinti térségnév |
| `hospital_name_raw` | forrás szerinti intézménynév |
| `waiting_over_60` | 60 napnál régebben várakozók száma |
| `treated_previous_6_months` | előző hat hónapban ellátott esetek |
| `median_wait_days_previous_6_months` | az ellátott esetek tényleges várakozási mediánja |
| `mean_wait_days_previous_6_months` | az ellátott esetek tényleges várakozási átlaga |

Egyediség: `(captured_date, source_list_id)`.

Minden kód szöveg, nem szám. Így a vezető nullák és az `O20`/`O22` értékek nem sérülnek.

### 6.3 Intézményidentitás

Az első verzió nem próbál szervezeti jogutódlást kitalálni. Külön kézi mappingfájl kezeli:

```yaml
U915:
  canonical_name: Semmelweis Egyetem Klinikai Központ
  aliases:
    - ...
  valid_from: null
  valid_to: null
  successor_code: null
  notes: null
```

Új forráskód automatikusan új intézményként jelenik meg. Két intézményt csak dokumentált bizonyíték alapján kötünk össze.

## 7. Gyűjtőfolyamat

### HTTP-viselkedés

- naponta egyszer, például 02:17 UTC-kor fut;
- az egész országos aggregált táblához egy kérés;
- beszédes User-Agent repó- és kapcsolati URL-lel;
- 20 másodperces timeout;
- legfeljebb két újrapróbálás 5, majd 20 másodperces késleltetéssel;
- nincs párhuzamos kérés;
- nincs betegszintű/tételes esetoldal-lekérés;
- a forrás hibája esetén a korábbi jó adat marad publikálva.

### Feldolgozási lépések

1. HTML lekérése memóriába.
2. SHA-256 és technikai metadata képzése.
3. `table#tb_int` megkeresése.
4. Fejléc szerkezeti ellenőrzése.
5. Minden hételemű sor beolvasása.
6. `v` paraméter és nyers szövegek kinyerése.
7. `nap` utótag eltávolítása, egész számok parse-olása.
8. Forráskódok változtatás nélküli megőrzése.
9. Minőségi ellenőrzések futtatása.
10. Siker esetén dátumozott `.csv.gz` és metadata JSON írása.
11. Derived JSON generálása és webbuild.
12. Automatikus commit és Pages-deploy.

### „Fail closed” validáció

A futás hibával leáll, és nem írja felül az aktuális publikált adatot, ha:

- a HTTP-státusz nem 200;
- hiányzik a várt tábla;
- a fejléc vagy az oszlopszám megváltozott;
- bármely kulcsmező üres;
- azonos snapshotban duplikált `source_list_id` van;
- numerikus mező nem egész szám vagy negatív;
- a sorszám kívül esik a kezdeti 50–500 biztonsági tartományon;
- a sorszám több mint 25%-kal tér el az előző jó snapshottól.

Az utolsó két szabály nem azt jelenti, hogy az új adat biztosan rossz, csak kézi felülvizsgálatot kér. Jóváhagyás után a küszöb vagy mapping frissíthető.

## 8. Adatminőségi és értelmezési szabályok

A jelzések nem minősítik az intézményt; azt jelzik, hogy az adott szám önmagában félrevezető lehet.

Kezdeti szabályok:

```text
LOW_SAMPLE:
  treated_previous_6_months < 20

STRONGLY_SKEWED:
  median == 0 és mean > 30

HIGH_MEAN_MEDIAN_GAP:
  abs(mean - median) > 60

LARGE_DAILY_CHANGE:
  előző naphoz képest > 50% változás
  ÉS az abszolút változás > 20

NEW_OR_RETURNING_LIST:
  az előző snapshotban nem szerepelt

MISSING_LIST:
  az előző snapshotban szerepelt, a mostaniban nem
```

Megjelenítési elv:

- nem piros/zöld „jó–rossz” színezés;
- semleges információs vagy figyelmeztető ikon;
- rövid magyarázat közvetlenül az adat mellett;
- a raw érték mindig elérhető;
- nincs elrejtett, összetett pontszám.

## 9. Repository-struktúra

```text
/
├─ .github/workflows/
│  ├─ collect.yml
│  ├─ ci.yml
│  └─ deploy.yml
├─ collector/
│  ├─ fetch.py
│  ├─ parse.py
│  ├─ validate.py
│  ├─ derive.py
│  └─ models.py
├─ config/
│  ├─ hospitals.yml
│  └─ procedures.yml
├─ data/
│  ├─ snapshots/YYYY/MM/YYYY-MM-DD.csv.gz
│  └─ metadata/YYYY/MM/YYYY-MM-DD.json
├─ fixtures/
│  ├─ neak_valid_2026-08-24.html
│  └─ malformed/
├─ site/
│  ├─ src/pages/
│  ├─ src/components/
│  ├─ src/content/
│  └─ public/data/
├─ tests/
├─ pyproject.toml
├─ package.json
├─ README.md
├─ METHODOLOGY.md
└─ LICENSE
```

Az eredeti napi HTML-t nem szükséges örökké commitolni. A normalizált snapshot, a forrás hash-e, a parserverzió és a teszt-fixture elegendő a kis, auditálható repóhoz. Egy 113 soros tömörített napi CSV várhatóan csak néhány kilobájt, így több év adata is kényelmesen elfér.

## 10. Automatizálás

### `collect.yml`

- cron naponta 02:17 UTC;
- kézzel is indítható;
- `contents: write` kizárólag az adatcommit miatt;
- concurrency group megakadályozza az átfedő futást;
- dependency install;
- fetch → parse → validate → tests → snapshot;
- csak sikeres validálás után commit;
- rövid Actions Summary: sorok, új/eltűnt listák, figyelmeztetések;
- hiba esetén nem commitol és a GitHub értesít.

### `ci.yml`

- minden pull request és releváns push;
- Python lint/typecheck/test;
- parser fixture-tesztek;
- derived JSON schema-ellenőrzés;
- Astro typecheck és statikus build;
- link- és accessibility smoke test.

### `deploy.yml`

- csak a `main` jó buildje után;
- statikus artifact feltöltése;
- GitHub Pages deploy;
- az előző jó deploy megmarad, ha a build hibás.

A publikus repók ütemezett workflow-ját a GitHub 60 nap inaktivitás után letilthatja. A napi adatcommit normál esetben repository-aktivitást ad; ettől függetlenül a havi karbantartási ellenőrzőlistán szerepeljen a workflow státusza.

## 11. Tesztstratégia

### Parser unit tesztek

- normál 7 oszlopos sor;
- HTML-entitások és magyar ékezetek;
- `001`, `O20`, `O22` kódok;
- telephelyi suffix;
- `0 nap`;
- többjegyű értékek;
- hiányzó cella;
- átnevezett fejléc;
- duplikált forrásazonosító;
- hibás számformátum.

### Snapshot/regressziós teszt

A 2026-08-24-i fixture parse-olása determinisztikusan ugyanazt a normalizált eredményt adja. A teszt ne rögzítsen örökre pontos 113-as sorszámot a production fetchhez; a fixture-nél viszont igen.

### Derived data tesztek

- intézményi összegek helyesek;
- idősor dátum szerint rendezett és duplikációmentes;
- kórházi mediánokból nem keletkezik országos medián;
- eltűnt sor nem válik automatikusan nullává;
- névváltozás nem szakítja szét a kód szerinti idősorokat;
- warning rule-ok határértékei.

### Felületi elfogadási tesztek

- mobilon használható keresés és táblázat;
- billentyűzettel minden funkció elérhető;
- grafikon adatai táblázatként is elérhetők;
- minden szám mellett egyértelmű időszak és mértékegység;
- JavaScript nélkül legalább a fő aktuális adatok és szövegek látszanak;
- 48 óránál régebbi adatnál automatikus „frissítés késik” banner.

## 12. Megvalósítási ütemterv

### 0. szakasz — kapuk és döntések (fél nap)

- [ ] Publikus GitHub repository létrehozása.
- [x] Terméknév: KórházTükör; domainvásárlás elhalasztása.
- [ ] Nyílt forrású kódlicenc kiválasztása, például MIT.
- [ ] A publikált adatokra külön, forrásfeltételeknek megfelelő adatlicenc/dokumentáció tisztázása.
- [ ] Rövid írásos megkeresés a NEAK felé az aggregált adatok rendszeres archiválásáról és újraközléséről.
- [ ] Kapcsolati e-mail létrehozása a User-Agenthez és a weboldalhoz.

Kilépési feltétel: a technikai fejlesztés elindulhat; nyilvános adatpublikálás csak a felhasználási feltételek felülvizsgálata után.

### 1. szakasz — megbízható gyűjtő (1–2 nap)

- [ ] Projektváz, dependency lockok.
- [ ] Egykéréses fetcher timeouttal és retry-jal.
- [ ] HTML-parser és explicit adatséma.
- [ ] Metadata és gzip CSV írás.
- [ ] Fixture és legalább 12 parser unit teszt.
- [ ] Fail-closed validáció.
- [ ] Lokális futtatási parancsok a README-ben.

Kilépési feltétel: ugyanaz a fixture determinisztikusan parse-olható; hibás fixture nem hoz létre snapshotot.

### 2. szakasz — automatizált napi archívum (1 nap)

- [ ] `collect.yml` cron és manual dispatch.
- [ ] Minimális GitHub-permissions.
- [ ] Automatikus, dátumozott adatcommit.
- [ ] Futási összefoglaló és failure notification ellenőrzése.
- [ ] Öt egymást követő sikeres napi futás.

Kilépési feltétel: öt napig nincs kézi beavatkozás, nincs hiányzó vagy duplikált snapshot.

### 3. szakasz — derived data és minőségi réteg (1–2 nap)

- [ ] Intézmény- és beavatkozás-indexek.
- [ ] Historikus JSON generátor.
- [ ] Warning engine.
- [ ] Új/eltűnt lista diff.
- [ ] Kézi mappingfájlok és validálásuk.
- [ ] Letölthető CSV-generálás.

Kilépési feltétel: a generált JSON-ok sémája stabil, tesztelt, és nincs hibás országos mediánaggregáció.

### 4. szakasz — statikus web MVP (3–5 nap)

- [ ] Design tokenek és alaplayout.
- [ ] Kezdőlap és kereső.
- [ ] Beavatkozásoldal.
- [ ] Intézményoldal.
- [ ] Idősorgrafikon és táblázatos alternatíva.
- [ ] Módszertan, adatstátusz, impresszum és disclaimer.
- [ ] Stale-data banner.
- [ ] Mobil, accessibility és teljesítmény QA.

Kilépési feltétel: a három fő feladat mobilról is teljesíthető, nincs rangsorolásra vagy személyes prognózisra utaló szöveg.

### 5. szakasz — deploy és csendes próba (1 nap + 2 hét megfigyelés)

- [ ] GitHub Pages Actions-deploy.
- [ ] Base path és canonical URL helyes beállítása.
- [ ] Robots/sitemap/meta tagek.
- [ ] 404 és hibás azonosító kezelése.
- [ ] Öt kézi felhasználói próba analitika nélkül.
- [ ] Két hét futás közbeni hibák és névváltozások naplózása.

Kilépési feltétel: legalább 14 egymást követő napból 13 sikeres gyűjtés, nincs csendes adatsérülés.

### 6. szakasz — nyilvános MVP (30 napi snapshot után)

- [ ] 30 napos trend megjelenítése.
- [ ] Módszertan végső átolvasása egészségügyi/statisztikai szemmel.
- [ ] NEAK-megkeresés eredményének beépítése.
- [ ] Nyilvános bejelentés kis közönségnek.
- [ ] Feedback GitHub Issue vagy e-mail útján.

Aktív fejlesztési becslés: kb. 20–30 fókuszált óra. A 30 napos időtáv nagy része passzív adatgyűjtés.

## 13. Definition of Done

Az MVP kész, ha mind teljesül:

- 30 napnyi visszakereshető snapshot van;
- az utolsó 30 automatikus futás legalább 95%-a sikeres;
- hibás forrásstruktúra nem tud érvényes adatként publikálódni;
- minden aktuális adat 48 óránál frissebb, vagy jól látható stale banner van;
- minden számhoz tartozik dátum, mértékegység és forrás;
- a medián/átlag hat hónapos, visszatekintő jelentése minden releváns oldalon egyértelmű;
- nincs betegszintű vagy felhasználói személyes adat;
- nincs kórházpontszám, toplista vagy személyes várakozási becslés;
- mobilon és billentyűzettel használható;
- a web, a gyűjtő és a hoszting havi pénzköltsége 0 Ft;
- legalább öt célfelhasználó segítség nélkül megtalál egy beavatkozást és annak intézményi trendjét.

## 14. Fő kockázatok és válaszok

| Kockázat | Válasz |
|---|---|
| NEAK felhasználási feltételek vagy újraközlési korlát | Írásos tisztázás a nyilvános launch előtt; forrásmegjelölés; alacsony lekérési gyakoriság |
| HTML-struktúra változik | Fixture-tesztek, fejléc/séma validáció, fail closed, korábbi jó deploy megtartása |
| Egy adat félrevezető | Hat hónapos visszatekintő definíció, warning engine, nincs rangsor vagy személyes becslés |
| Intézmény átnevezés/összevonás | Forráskód-alapú identitás, alias- és jogutódmapping csak bizonyítékkal |
| Lista eltűnik | Hiányzóként jelöljük, nem nullaként |
| GitHub workflow leáll | Státuszoldal, GitHub failure notification, havi kézi ellenőrzés |
| Repository nő | Gzip napi CSV, raw HTML nem archiválódik naponta, éves méretfigyelés |
| Nő a forgalom vagy üzletivé válik | Külön hoszting-ADR; GitHub Pages nem marad automatikusan a végleges platform |
| A 30 napos trend még kevés | Pontos kezdődátum; régi, eltérő módszertanú adatok nem kerülnek automatikusan ugyanarra a grafikonra |

## 15. MVP utáni sorrend

Csak a Definition of Done után:

1. Hivatalos történeti adatigénylés a NEAK-tól, egységes havi intézmény × lista aggregátumra.
2. Külön hivatalos országos aggregátum gyűjtése, ha statisztikailag korrekt országos medián kell.
3. 2018-as és más történeti baseline-ok külön, módszertani töréssel jelölve.
4. Ágy- és aktivitási kontextus.
5. NNGYK intézményi fertőzési adatok csak a közzétett módszertan megértése és külön termékterv után.
6. Értesítések csak akkor, ha felhasználói interjúk bizonyítják az igényt; ez már adatkezelést és valószínűleg backendet jelent.

Nem következő lépés: AI-összefoglaló, pontszám, „legjobb kórház”, túl korai saját domain vagy több adatforrás egyszerre.

## 16. Hivatalos hivatkozások

- NEAK nyilvános várólista: <https://varolista.neak.gov.hu/varolista_pub/>
- NEAK tételes aggregált várólista: <https://varolista.neak.gov.hu/varolista_pub/varolistak-teteles-lekerdezese/?tk=MIND>
- NEAK tájékoztató a várólistákról: <https://neak.gov.hu/felso_menu/lakossagnak/varolista/orszagos_varolista_nyilvantartas_lakossag>
- NEAK közadat-újrahasznosítás: <https://neak.gov.hu/felso_menu/rolunk/kozerdeku_adatok/kozadatok_igenylese/kozadat_ujrahasznositas>
- GitHub Pages korlátok: <https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits>
- GitHub Actions workflow letiltás/inaktivitás: <https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows>
- NNGYK 2026-os intézményi fertőzési közzétételi módszertan híre: <https://nngyk.gov.hu/hu/tovabbi-hirek/szeptembertol-nyilvanosan-is-elerhetok-lesznek-az-egeszsegugyi-ellatassal-osszefuggo-fertozesek-intezmenyi-adatai-elkeszult-a-kozzetetel-modszertana.html>
