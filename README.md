# KórházTükör

Kórházi várólista-adatok nyílt, történeti követése a NEAK nyilvános aggregált adatközléséből.

Az első verzió naponta egy alkalommal archiválja az intézményenként és várólistánként közölt aggregált mutatókat. Nem kezel betegadatot, nem becsül személyes várakozási időt, és nem rangsorolja a kórházakat.

## Napi adatgyűjtés

A [collect workflow](.github/workflows/collect.yml) minden nap 02:17 UTC-kor fut, validálja a forrás táblaszerkezetét, majd dátumozott, tömörített CSV-t és metadata JSON-t commitol:

```text
data/
├─ snapshots/YYYY/MM/YYYY-MM-DD.csv.gz
└─ metadata/YYYY/MM/YYYY-MM-DD.json
```

Hiba vagy váratlan forrásváltozás esetén nem készül snapshot, így az utolsó jó adat érintetlen marad.

## Lokális futtatás

Python 3.12 vagy újabb szükséges. Külső csomag nincs.

```powershell
python -m unittest discover -s tests -v
python -m collector.collect --data-dir data
```

Opcionális, publikus kapcsolati URL a gyűjtő User-Agent fejlécében:

```powershell
$env:KORHAZTUKOR_CONTACT = "https://github.com/<user>/<repo>"
```

## GitHub-beállítás

1. Hozz létre egy **public** repositoryt, és pushold a projektet a `main` branchre.
2. Hagyd a repository alapértelmezett workflow-jogosultságát **Read repository contents and packages** értéken. A gyűjtő saját fájlja kizárólag magának kér `contents: write` jogot az adatcommithoz.
3. Az **Actions** fülön engedélyezd a workflow-kat, ha a GitHub ezt kéri.
4. Indítsd el egyszer kézzel: **Actions → Collect NEAK waiting-list snapshot → Run workflow**.
5. Ellenőrizd, hogy a futás sikeres-e. Ha aznapi snapshot már létezik, a validáció lefut, de nem készül új commit.

Ne állíts be repository secretet. A workflow a beépített, rövid életű `GITHUB_TOKEN` jogosultságát használja a saját adatcommitjához.

Ha a `main` branch védett, a GitHub Actions botnak engedélyezni kell a push-t, vagy a gyűjtő commitlépését külön adatbranch/PR folyamatra kell módosítani. Az MVP kezdetén a legegyszerűbb, ha nincs push-t tiltó branch rule.

## Forrás és értelmezés

- Forrás: <https://varolista.neak.gov.hu/varolista_pub/varolistak-teteles-lekerdezese/?tk=MIND>
- Részletes terv: [MVP_IMPLEMENTATION_PLAN.md](MVP_IMPLEMENTATION_PLAN.md)

A medián és az átlag az előző hat hónapban ellátott esetek tényleges várakozását írja le. Nem egy új beteg várható várakozási ideje. Ez a projekt nem a NEAK hivatalos szolgáltatása és nem orvosi tanács.
