# GPX-Trailimport Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline, one session). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Mehrere Mapy-GPX-Dateien einlesen, nach PO prüfen, zu einer Kette ordnen und als Prüfungsstand übernehmen (V1.8).

**Architecture:** Rein logische Teile kommen in die DOM-freien Blöcke `Planner` (Zuordnung, Kandidat, Kette „fest“) und `Pruefung` (GPX-Leser, Ort, Parser-Felder) und werden mit Node getestet. Der Dialog liegt im App-Block. Die GPX-Linie wird nie verändert: `c.v.pts` = projizierte GPX-Punkte, die Beinfolge dient nur `validate`/`describe`.

**Tech Stack:** Einzeldatei `index.html`, Node 24 `node:test` (`node --test "tests/*.test.mjs"`), Leaflet.

**Spec:** `docs/superpowers/specs/2026-10-22-gpx-import-design.md`

## Global Constraints

- Jede Änderung hebt `APP_VERSION` um 0.1 (hier `'1.8'`), Eintrag oben in `CHANGELOG.md`.
- Nie ins Repository: `testdaten/`, DVG-PO-PDF, echte Teamnamen. Tests nutzen erfundene Daten (`gridOSM`/`wideOSM`).
- Grenzen GPX: ≤ 1 MB je Datei, ≤ 50 Dateien, ≤ 5000 Punkte, Koordinaten gültig, ≥ 2 Punkte.
- Längen: MT-I 270–330, MT-II 540–660, MT-III 900–1100 (`LENGTH_TOL` 0,10); Stufe nur nach Länge.
- Zuordnung: Verdichtung 3 m, Sprünge < 8 m fallen weg, ⚠ wenn > 10 % der Linie > 10 m neben Wegen.
- Dateiformat bleibt Version 2; neue Trailfelder `imported` (boolean), `name` (Text) optional.
- Kein `innerHTML` mit Dateiinhalten (`textContent` bzw. `esc`).
- Kein `git push` ohne Freigabe des Nutzers.

## Review Focus

- GPX mit `wpt`, Kommentaren, CDATA, einfachen Anführungszeichen, `lon` vor `lat`: nur Strecke zählt (Task 1).
- `name` mit HTML/Skript: bleibt Text (Task 1, Task 5).
- Zwei Dateien mit gleichem Namen / gleiche Strecke zweimal: beide erscheinen, Kette läuft (Task 3).
- Alle Dateien gesperrt oder abgewählt: „Übernehmen“ ist deaktiviert, kein leerer Prüfungsstand (Task 5).
- Netz fällt aus: Abbruch mit bekannter Meldung, bisheriger Stand bleibt (Task 5).

---

### Task 1: GPX-Leser, Stufe und Ort (DOM-frei)

**Files:** Modify `index.html` (Block `Pruefung`, Block `Planner`); Test `tests/pruefung.test.mjs`, `tests/planner.test.mjs`.

**Interfaces:**
- Produces `Pruefung.parseGpx(text: string): { name: string, ll: [lat,lon][] }` – wirft `Error` mit deutscher Meldung bei Verstoß gegen die Grenzen oder fehlenden Punkten. Liest `<trkpt>` und `<rtept>`, beliebige Attributreihenfolge/Anführungszeichen, ignoriert `<!-- -->`, `<![CDATA[ ]]>`, `<wpt>`. `name` = erster `<name>` innerhalb `trk`/`rte` (Entitäten `&amp; &lt; &gt; &quot; &apos;` zurück, max. 80 Zeichen), sonst `''`.
- Produces `Pruefung.GPX_LIMITS = { bytes: 1e6, files: 50, points: 5000 }`.
- Produces `Pruefung.placeFor(places, startLL, endLL): place | null` – Ort, dessen Kreis (`center.lat/lon`, `radius` m) Start und Ziel enthält; mehrere: nächste Mitte zum Start; Orte ohne `center` zählen nicht.
- Produces `Planner.levelByLength(len: number): 'MT-I'|'MT-II'|'MT-III'|null` (Toleranz `LENGTH_TOL`).
- Produces `Pruefung.parseExam` akzeptiert `imported` (boolean, sonst ignorieren → `false`/weglassen) und `name` (String ≤ 80, sonst ablehnen).

- [ ] **Step 1: Tests schreiben** (alle erfundene Daten):
  - `parseGpx` liest `trk` mit zwei Segmenten zu einer Linie; `rte`; Attribute `lon="9.9" lat='49.6'`; ignoriert `wpt` und Kommentar mit `<trkpt lat="1" lon="1"/>`.
  - `name` `<name>&lt;img onerror=x&gt; &amp; Co</name>` → `'<img onerror=x> & Co'` (bleibt Text).
  - wirft bei: kein Punkt, 1 Punkt, `lat="95"`, `lat="abc"`, 5001 Punkte, Text > 1 MB.
  - `placeFor`: Treffer, kein Treffer (null), zwei Orte → näherer; Ort ohne Mitte ignoriert.
  - `Planner.levelByLength`: 270→MT-I, 330→MT-I, 331→null, 540→MT-II, 660→MT-II, 900/1100→MT-III, 450→null.
  - `parseExam`: Trail mit `imported: true, name: 'x'` bleibt; `name: {}` → Fehler „beschädigt“.
- [ ] **Step 2:** `node --test "tests/*.test.mjs"` → neue Tests FAIL.
- [ ] **Step 3: Implementieren** (`parseGpx` per Regex auf dem von Kommentaren/CDATA/`wpt` befreiten Text; Größe zuerst prüfen; `GPX_LIMITS`, `placeFor` mit Haversine, `levelByLength`, `parseExam`-Felder; neue Funktionen in die jeweiligen `return`-Objekte).
- [ ] **Step 4:** Tests → PASS.

### Task 2: Zuordnung zum Wegenetz und Kandidat

**Files:** Modify `index.html` (Block `Planner`: `validate`, `describe`, neu `matchTrack`, `trackCandidate`); Test `tests/planner.test.mjs`.

**Interfaces:**
- `validate(G, tr)`: optionale Felder `tr.pts` (Geometrie statt `trailPts`) und `tr.fixedLength` (Länge statt `polyLen`). Ohne die Felder unverändert (bestehende Tests grün).
- `describe(G, tr)`: ist `tr.fixedLength` gesetzt, werden alle `at` mit `fixedLength / Länge der Beinfolge` skaliert und gerundet.
- Produces `matchTrack(G, W, pts): { legs, far: number, maxOff: number } | null` – `pts` projizierte GPX-Punkte (`G.fromLatLon`), `W = walkGraph(G)`. Algorithmus wie Prototyp: auf 3 m verdichten, je Punkt `snapEdge(W,p)`, Position = `seg.cum[k] + t*e.len` (Kante→(Segment,k) in der Reihenfolge von `walkGraph`), aufeinanderfolgende Punkte desselben Segments zu einem Bein, Beine < 8 m (nicht erstes/letztes) fallen weg, Mittelbeine volle Länge (`d0=0,d1=len`), Anfang/Ende dürfen mitten im Segment liegen, Ende/Anfang nahe (< 8 m) der Segmentgrenze rasten ein. `far` = Anteil verdichteter Punkte > 10 m neben dem Weg. `null`, wenn keine Beine.
- Produces `trackCandidate(G, W, ll, level, o={}): c` mit `c = { id, tr:{level, legs, mode:'pruefung', pts, fixedLength}, v, segSet, nodeSet, samples, bbox, ll, far, matched:boolean }`; `pts = ll.map(G.fromLatLon)`, `fixedLength = polyLen(pts)`, `v = validate(G, tr)`, Rest wie in `pool.consider`. Bei `matchTrack === null`: `matched:false`, `v` ohne Prüfung (`ok:false, checks:[]`), `segSet/nodeSet` leer, Geometrie aus `pts` (bleibt für Kette/Abstand nutzbar).
- Exportiert: `matchTrack, trackCandidate`.

- [ ] **Step 1: Tests:** (a) Trail aus bekannten Beinen (`leg(G,…)`, ca. 300 m auf `gridOSM`) → `trailPts` → als GPX-Linie (`toLatLon`) zurück: `trackCandidate` liefert `matched`, dieselben `turns`, `v.length` = GPX-Länge, `v.pts` = GPX-Punkte (Punkt für Punkt), Level MT-I ok. (b) Linie um 15 m seitlich versetzt über volle Länge: `far > 0.1`. (c) Linie weit außerhalb (> 500 m neben allem): `matched:false` oder `far ≈ 1`, kein Absturz. (d) `describe` skaliert `at`: letzter Schritt `at` ≈ `fixedLength`. (e) Bestehende `validate`-Tests unverändert grün.
- [ ] **Step 2:** FAIL. **Step 3:** Implementieren (Wiederverwendung `snapEdge`, `polyLen`, `samples`). **Step 4:** PASS.

### Task 3: Kette „fest“

**Files:** Modify `index.html` (`Planner.chain`); Test `tests/planner.test.mjs`.

**Interfaces:**
- `chain(G, W, teams, pools, R, minDist, { fixed: true, … })`: `pools[level].list` sind die festen Kandidaten. Im Modus `fixed`: kein `nearList`/`pool`, kein `compatible` zwischen den Kandidaten (nur `chosen.includes(c)`), kein 25er-Limit, jeder Kandidat nach Position 0 wird auf Fußweg geprüft (`walkPath`, `minAir`, `minLen`, `[bStart(c)]`); ohne Fußweg zählt eine Lücke (Budget wie bisher). Rückfall statt `plans()`: Kandidaten je Stufe in Poolreihenfolge, Stufenreihenfolge, `links` alles `null`, `gaps = n-1`. Ergebnis wie bisher (`order, links, gaps, teams, index`); `order` enthält jeden Kandidaten genau einmal.
- Ohne `fixed` Verhalten unverändert.

- [ ] **Step 1: Tests** (`gridOSM`, Kandidaten aus `trackCandidate` aus erfundenen Beinfolgen, zwei MT-I und ein MT-II): MT-I vor MT-II; alle drei verwendet; kein neuer Kandidat (`order` nur aus Pool); zwei Kandidaten mit Abstand < `minDist` bleiben beide in der Kette; unerreichbare Reihe liefert `gaps ≥ 1`, `links[i] === null`; Rückfall liefert alle Kandidaten.
- [ ] **Step 2:** FAIL. **Step 3:** Implementieren (Änderungen nur an `options`, Prüfschleife, `general`, Rückfall). **Step 4:** PASS inkl. alter Ketten-Tests.

### Task 4: Einfrieren, Zeichnen, Speichern, Sperren

**Files:** Modify `index.html` (App-Block: `snapshot`, `renderExam`, `replaceTrail`-Aufruf, `replanPlace`); Test `tests/pruefung.test.mjs`.

**Interfaces:**
- `snapshot(c)`: ist `c.tr.fixedLength` gesetzt: `ll = c.ll` (Original), `imported: true`, `name: c.name || undefined`, `harder`/Prüfwerte aus `validate`, bei unsicherer Zuordnung (`c.far > 0.1`) Text in `harder` ergänzen („Zuordnung zum Wegenetz unsicher …“); bei `!c.matched` `turns/decisions/crossings = 0`, `steps = [{at:0,kind:'start',text:'Wegbeschreibung nicht möglich …'}]`, Straßennamen `''`.
- `renderExam`: Karte zeigt „importiert“-Chip und Hinweis „Wegbeschreibung abgeleitet, ungefähr“; Button „Ersetzen“ deaktiviert mit `title` „importierter Trail: neu importieren“. Bogen (`openSheets`): Hinweis „importiert“ im Titel.
- `replanPlace`: enthält der Ort importierte Trails, eigene Bestätigung „importierte Trails werden verworfen“.

- [ ] **Step 1: Test:** Round-trip `serializeExam`/`parseExam` mit `imported`, `name`, `ll` mit 6 Nachkommastellen bleibt Punkt für Punkt gleich.
- [ ] **Step 2–4:** Test, Umsetzung, `node --test` PASS. UI im Browser prüfen (Task 6).

### Task 5: Import-Dialog und Auswertung

**Files:** Modify `index.html` (HTML: Button `#importBtn` in `#examBar`, Dialog `#importDlg`; CSS; App-Block: `openImport`, `evaluateFiles`, `applyImport`).

**Interfaces:**
- `evaluateFiles(files: File[]) → Promise<items>`; Item `{ file, name, status:'ok'|'warn'|'bad'|'locked', reasons:string[], c, place, level, take:boolean }`. Ablauf: Größe/Anzahl prüfen, `parseGpx` (Fehler → gesperrt), `Planner.levelByLength` (null → gesperrt), `Pruefung.placeFor(state.places, start, ziel)` (null → gesperrt), `graphFor(place, place.radius)` je Ort (Netzfehler → Abbruch mit „OpenStreetMap ist gerade nicht erreichbar … Der bisherige Stand bleibt“), `Planner.setTerrain(G, place.terrain, …)`, `trackCandidate`; `status`: `bad` bei verletzter Pflichtregel oder `!matched`, `warn` bei `far > 0.1` oder weichem Hinweis, sonst `ok`.
- Danach `Planner.chain(..., { fixed:true, obstacles: [] })` je Ort in Ortslistenreihenfolge, Konflikte `compatible(a,b,minDist)` als Textliste, Kettenzusammenfassung über `chainStatus`.
- Vorschau: `state.plans=[order]`, `state.planTeams`, Zeichnen mit `drawPlan` (Karte hinter dem Dialog); „Abwählen“ eines Trails rechnet Kette neu.
- `applyImport`: Bestätigung (`state.exam` vorhanden → „ersetzt Prüfungsstand und Teamliste“); `state.teams` neu: ein Team je übernommenen Trail `Team N`, `level`, `place`; `state.planTeams` entsprechend; `startExam()`; `renderResults()`; `drawExam(true)`; Status mit Kettenzusammenfassung. Trails erhalten `imported`, `name` über `snapshot`.
- „Übernehmen“ deaktiviert, wenn nichts übernommen werden kann. Alle Texte mit `textContent`/`esc`.

- [ ] **Step 1:** HTML/CSS/Funktionen schreiben (Wiederverwendung `graphFor`, `chainStatus`, `radarStart/Stop`, `mk`, `esc`, `setStatus`).
- [ ] **Step 2:** `node --test` PASS (nichts Bestehendes gebrochen); im Browser mit erfundener Test-GPX (aus Fixture-Daten erzeugt, kein Netz nötig über `data/osm/` Giebelstadt) Dialog durchspielen: Liste, Häkchen, Vorschau, Übernehmen, Speichern/Öffnen.

### Task 6: Version, Changelog, Prüfung, Review

- [ ] `APP_VERSION = '1.8'`, `CHANGELOG.md` oben V1.8-Eintrag (nur Funktionen, kein Echtname).
- [ ] Gesamtlauf `node --test "tests/*.test.mjs"` grün, Browser-Check (Konsole fehlerfrei, schmal und breit).
- [ ] Unabhängiger Code-Review (Subagent, hohes Niveau) gegen Spec und Diff; Befunde bewerten, berechtigte beheben, erneut testen.
- [ ] `git add` gezielt, lokal committen (Spec-Commit `20e4fa5` geht beim Push mit). **Kein Push** ohne Freigabe.
