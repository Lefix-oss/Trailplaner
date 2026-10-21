# Mehrere Orte – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine Prüfung kann sich auf mehrere Orte verteilen (Ort je Team, Gelände je Ort). Geplant wird je Ort, einzelne Orte lassen sich im Prüfungsmodus neu planen, und Trails behalten ihren Ort bis auf den Bogen.

**Architecture:** Die reine Logik für Dateiformat Version 2, Migration, Ersetzen der Trails eines Orts und die nach Orten gegliederte WhatsApp-Nachricht kommt in den DOM-freien Block `Pruefung` und wird mit Node getestet. In der App ersetzt eine Ortsliste `state.places` die bisherigen Einzelfelder `state.center`, `state.placeName` und `#terrain`. Graphen werden je Ort (Mitte + Radius) zwischengespeichert, und jeder Kandidat trägt seinen Graphen als `c.G`. Dadurch arbeiten Trainingsansicht, Schnappschuss und Links ohne `state.graph`.

**Tech Stack:** wie bisher. Eine Datei `index.html` mit Leaflet 1.9.4, Tests mit Node 24 `node:test`: `node --test "tests/*.test.mjs"`.

**Spec:** `docs/superpowers/specs/2026-10-21-mehrere-orte-design.md` (baut auf `2026-10-21-pruefungsablauf-design.md` auf)

## Global Constraints

- Mit nur einem Ort sieht und verhält sich alles wie bisher. Die Ortsauswahl beim Team erscheint erst ab zwei Orten.
- Ein Team kommt nie auf einen Trail einer anderen Stufe.
- Gespeicherte Trails behalten Ort und Geometrie. Zum Anzeigen, Zuteilen und Drucken wird nichts neu berechnet.
- Alte Dateien (Version 1) und alte Browser-Sicherungen (`trailplaner`, `trailplaner-pruefung`) laden weiterhin.
- **Gelände je Ort.** Radius, Fuß- und Feldwege, Mindestabstand und „nicht auf sich zurücklaufen“ gelten für alle Orte.
- Abstand und Kreuzungsfreiheit werden nur zwischen Trails desselben Orts geprüft.
- Die Orte im Prüfungsstand sind eingefroren. Änderungen an der Ortsliste wirken erst bei der nächsten Planung.
- „Nur diesen Ort neu planen“ lässt Trails, Häkchen und Zuteilung aller anderen Orte unverändert. Scheitert die Planung, bleibt der ganze Stand unverändert.
- Ortskennungen: `A`, `B`, `C`, `D` (höchstens 4 Orte).
- Echte Namen nie ins Repository. Tests verwenden erfundene Namen und Orte.

## Review Focus

1. **Alte Datei (v1) öffnen und danach einen Ort neu planen:** Die migrierte Datei hat den Ort `A` mit dem alten Namen. Neu planen ersetzt nur die Trails von `A`. Getestet in Task 1 (`parseExam` Migration + `replacePlaceTrails`).
2. **Neu planen mit anderer Teamzahl für den Ort**, zum Beispiel vorher 3, jetzt 2 Teams an Ort B: Überzählige alte Trails von B verschwinden. Die Nummern anderer Orte rutschen nach, aber deren Häkchen und Zuteilung bleiben am richtigen Trail. Getestet in Task 1.
3. **Ort ohne gewählte Mitte**, aber mit Teams: Planen meldet „Für Ort B ist noch keine Ortschaft gewählt“ und ändert nichts. Geprüft in Task 3.
4. **Ort in der Liste entfernen, während der Prüfungsstand Trails dort hat:** Die Trails bleiben, Bögen und „Ersetzen“ funktionieren weiter über die eingefrorenen Ortsdaten. Geprüft in Task 4.
5. **Zwei Orte, ein Ort scheitert bei „Trails planen“:** Die Meldung nennt den Ort, es entsteht kein halber Plan. Geprüft in Task 3.

---

### Task 1: Dateiformat Version 2 und Ortslogik in `Pruefung`

**Files:**
- Modify: `index.html`, Block `Pruefung` (`parseExam`, `shareText`, Export)
- Test: `tests/pruefung.test.mjs`

**Interfaces:**
- Produces:
  - `VERSION = 2`; `PLACE_IDS = ['A', 'B', 'C', 'D']`
  - Exam v2: wie v1, aber `places: [{ id, name, center: {lat, lon}, terrain }]` statt `placeName`/`center`, `settings` ohne `terrain`, jeder Trail mit `place: 'A' | 'B' | …`
  - `parseExam(text)` akzeptiert v1 und v2. **v1-Migration:** `places = [{ id: 'A', name: placeName || '', center, terrain: settings.terrain || 'ort' }]`, jeder Trail bekommt `place: 'A'`, `version: 2`. Bei v2 ist `places` Pflicht (mindestens 1, jede Mitte numerisch), und jeder `trail.place` muss in `places` vorkommen. Sonst gilt „Die Datei ist beschädigt: Trail N ist beschädigt.“ bzw. „… Ortsmitte fehlt.“
  - `replacePlaceTrails(exam, placeId, newTrails, place) -> exam` (neues Objekt, das alte bleibt unverändert):
    - Die bisherigen Trails mit `place === placeId` werden der Reihe nach durch `newTrails` ersetzt, jeweils an der Stelle des alten Trails.
    - Weitere neue Trails werden angehängt, überzählige alte entfernt.
    - Ersetzte und neue Zeilen bekommen `assign = {team:'', vp:''}`. Alle anderen behalten ihren Eintrag in `assign`.
    - `place` (Name, Mitte, Gelände) ersetzt bzw. ergänzt den Eintrag in `exam.places`.
  - `placeOf(exam, trail) -> {id, name, …}`
  - `shareText(exam, kind, link)`: Bei mehr als einem Ort gibt es vor jeder Gruppe eine Zwischenzeile `— <Ortsname> —`, Gruppen in der Reihenfolge von `exam.places`. Die Kopfzeile lautet dann „Startpunkte Prüfung“ ohne Ortsnamen. Bei einem Ort bleibt alles wie heute.

- [ ] **Step 1: Fehlschlagende Tests schreiben:**

```js
const v2 = () => ({ format: 'trailplaner-pruefung', version: 2, date: '2026-10-31', settings: { radius: 1200, minDist: 30, allowPaths: true, avoidLoops: true, startTime: '10:00' },
  places: [{ id: 'A', name: 'Musterdorf', center: { lat: 49.1, lon: 9.1 }, terrain: 'ort' }, { id: 'B', name: 'Beispielhausen', center: { lat: 49.5, lon: 9.5 }, terrain: 'mix' }],
  trails: [T2('MT-I', 'A', true), T2('MT-II', 'B', true), T2('MT-I', 'A', false)],
  names: { teams: { 'MT-I': [], 'MT-II': [], 'MT-III': [] }, vps: [] },
  assign: [{ team: 'Anna mit Luna', vp: 'VP1' }, { team: 'Ben mit Rex', vp: 'VP2' }, { team: '', vp: 'VP3' }] });
// T2(level, place, checked) → Trail mit zwei Punkten, steps [], harder ''

test('parseExam migriert Version 1 auf einen Ort A', ...)          // places[0] = {id:'A', name, center, terrain}; trails[*].place === 'A'; version 2; settings.terrain entfernt
test('parseExam lehnt Trail mit unbekanntem Ort ab', ...)          // place 'C' bei places A,B → /Trail 1 ist beschädigt/
test('replacePlaceTrails ersetzt nur die Trails des Orts', ...)     // B neu mit 1 Trail: Trail 1 und 3 (Ort A) unverändert inkl. checked und assign; Trail 2 neu, assign leer
test('replacePlaceTrails mit weniger neuen Trails entfernt überzählige', ...)  // A neu mit 1 Trail: Ergebnis 2 Trails [A-neu, B-alt], assign [leer, Ben/VP2]
test('replacePlaceTrails hängt zusätzliche Trails an und ergänzt neuen Ort', ...)  // Ort C mit 2 Trails → 5 Trails, places hat C
test('shareText gliedert bei mehreren Orten nach Ort', ...)           // enthält '— Musterdorf —' vor Trail 1 und '— Beispielhausen —' vor Trail 2; Trail 3 steht unter Musterdorf
```

- [ ] **Step 2:** Run `node --test "tests/*.test.mjs"`. Expected: die neuen Tests FAIL. Bestehende v1-Tests werden angepasst: der Rundlauf-Test auf v2, `ergänzt fehlende …` erwartet zusätzlich `places[0].id === 'A'`.
- [ ] **Step 3:** Implementieren wie unter *Produces*.
- [ ] **Step 4:** Run `node --test "tests/*.test.mjs"`. Expected: alle PASS.
- [ ] **Step 5:** Commit: `Dateiformat v2 mit mehreren Orten, Migration von v1`

---

### Task 2: Ortsliste, Gelände je Ort, Ort je Team

**Files:**
- Modify: `index.html`: HTML Abschnitt „1 · Ortschaft“ und „3 · Rahmen“ (Feld `#terrain` entfällt dort), App-Block (`state`, `persist`, `setCenter`, Ortssuche `pick`, `map.on('click')`, `drawArea`, `renderTeams`, `resetAll`, Start)

**Interfaces:**
- Consumes: `Pruefung.PLACE_IDS`
- Produces:
  - `state.places: [{ id, name, center|null, terrain }]` mit mindestens einem Ort `A`, dazu `state.activePlace` (id)
  - Teams: `{ name, level, place }` (Standard `'A'`)
  - `activePlace() -> place`, `renderPlaces()`
  - `drawArea()` zeichnet einen Kreis je Ort mit Mitte, den aktiven kräftiger, mit Kennbuchstabe als Beschriftung
  - Browser-Speicher `trailplaner`: neue Felder `places`, `activePlace`. Alt (`center`, `placeName`, `terrain`) wird beim Start zu `places = [{ id:'A', name: placeName, center, terrain }]`.

- [ ] **Step 1:** HTML anpassen:
  - In Abschnitt 1 kommt `<div id="places"></div>` und ein Knopf `+ weiteren Ort` unter `#chosen`. `#chosen` entfällt, weil die Ortsliste den Namen zeigt.
  - In Abschnitt 3 entfällt das Feld „Gelände“.
- [ ] **Step 2:** `renderPlaces()` baut je Ort eine Zeile:
  - Kennbuchstabe als farbige Marke und Name, oder „noch kein Ort gewählt“
  - Gelände-Auswahl (`ort` / `mix` / `frei`, Beschriftungen wie das alte `#terrain`)
  - ✕, deaktiviert, wenn es nur einen Ort gibt
  - Klick auf die Zeile macht den Ort aktiv. Der aktive Ort ist hervorgehoben, und die Karte springt zu seiner Mitte.
  - `+ weiteren Ort` legt den nächsten freien Kennbuchstaben an (höchstens 4) und macht ihn aktiv.
  - Entfernen: Teams dieses Orts bekommen `place: 'A'` bzw. den ersten verbleibenden Ort.
  - Jede Änderung ruft `invalidate()` und `persist()` auf. Eine Gelände-Änderung macht den Graphen nicht ungültig, nur die Pools.
- [ ] **Step 3:** `setCenter(c, name)` setzt Mitte und Namen des **aktiven** Orts. Ortssuche und Kartenklick bleiben sonst unverändert.
- [ ] **Step 4:** `renderTeams()`: Ab zwei Orten bekommt jede Teamzeile ein kleines `<select>` mit den Kennbuchstaben, als Titel der Ortsname. Neue Teams bekommen den aktiven Ort.
- [ ] **Step 5:** `resetAll()` setzt `places = [{ id:'A', name:'', center:null, terrain:'ort' }]`, `activePlace = 'A'` und alle Teams auf `place:'A'`.
- [ ] **Step 6:** Im Browser prüfen:
  1. Alter Stand (localStorage mit `center`/`placeName`/`terrain`) lädt als Ort A mit gleichem Namen und Gelände.
  2. Ort B anlegen, Eßfeld suchen: Zwei Kreise erscheinen, B ist aktiv.
  3. Teams zeigen die Ortsauswahl. Ort B entfernen: Die Auswahl verschwindet, die Teams stehen auf A.
  4. Mit einem Ort sieht die Oberfläche bis auf die Ortszeile aus wie vorher.
- [ ] **Step 7:** Commit: `Ortsliste mit Gelände je Ort und Ort je Team`

---

### Task 3: Planen je Ort

**Files:**
- Modify: `index.html`, App-Block (`run`, `invalidate`, Trainings-Helfer `startLL`, `routeLink`, `endLink`, `trailText`, `drawPlan`, `renderResults`)

**Interfaces:**
- Consumes: `state.places`, Teams mit `place`, `loadOSM` (mit Zwischenspeicher), `Planner.buildGraph`, `setTerrain`, `pool`, `plans`, `alternatives`
- Produces:
  - `graphFor(place, radius) -> Promise<G>` mit Cache `state.graphs` (Map, Schlüssel `Pruefung.osmKey(center, radius)`). Ersetzt `state.graph` und `state.graphKey`.
  - `state.pools: { [placeId]: { [level]: pool } }`. Jeder Kandidat bekommt beim Poolen `c.G = G` und `c.place = placeId`.
  - `async planPlaces(placeIds, mode) -> { ok: true, plan: cand[] (Reihenfolge = Teams dieser Orte in Teamliste), teams } | { ok: false, msg }`
  - `run()` plant alle Orte, die Teams haben, über `planPlaces`.
- [ ] **Step 1:** `planPlaces` implementieren:
  - Für jeden Ort mit Teams: Ohne Mitte gibt es `{ ok:false, msg:'Für Ort B ist noch keine Ortschaft gewählt.' }`.
  - Dann Graph holen, `setTerrain(G, place.terrain, allowPaths, avoidLoops)`, Pools je Stufe der Teams dieses Orts (`mode` wie heute) und `Planner.plans(G, placeTeams, pools, R, minDist, 1)`.
  - Scheitert ein Ort, gibt es die bisherige Fehlermeldung mit vorangestelltem Ortsnamen (`In Eßfeld: …`). Das Gelände-Tipp-Argument kommt aus `place.terrain`.
  - Der Gesamtplan wird in Teamreihenfolge zusammengesetzt.
- [ ] **Step 2:** `run()` auf `planPlaces(alle Orte mit Teams)` umstellen. Die Status- und Fehlertexte bleiben wie heute. Bei Misserfolg bleibt `state.plans` leer wie heute.
- [ ] **Step 3:** Trainings-Helfer: `state.graph` → `c.G`. `drawPlan` und die Karten nutzen `c.G.toLatLon`. Ab zwei Orten zeigt die Karte „Trail N · Team · Stufe · Ortsname“. „Alternativ-Trail“ ruft `Planner.alternatives(placePlan, idxInPlace, state.pools[c.place], placeTeams, minDist)` nur mit den Trails desselben Orts auf. Der WhatsApp-Kopf nennt bei mehreren Orten den Ort je Zeile.
- [ ] **Step 4:** Run `node --test "tests/*.test.mjs"`. Expected: PASS, da die Planner-Logik unverändert ist.
- [ ] **Step 5:** Im Browser prüfen (Wegedaten kommen aus dem Zwischenspeicher, falls vorhanden):
  1. Training mit einem Ort Giebelstadt und 3 Teams: wie vorher, inklusive Alternativ-Trail, Maps-Links und WhatsApp.
  2. Prüfung mit A Giebelstadt (7× MT-I) und B Eßfeld (3× MT-II): Ein Plan entsteht, Trails 1–7 liegen in Giebelstadt, 8–10 in Eßfeld.
  3. Ort B ohne Mitte: Die Meldung erscheint, nichts ändert sich.
  4. Ein unmöglicher Ort, etwa mit 10 MT-II-Teams an einem kleinen Ort: Die Meldung nennt den Ort.
- [ ] **Step 6:** Commit: `Planen je Ort mit Graph je Ort`

---

### Task 4: Prüfungsablauf mit Orten

**Files:**
- Modify: `index.html`, App-Block (`snapshot`, `startExam`, `examSettings`, `applyExam`, `replaceTrail`, `renderExam`, `renderAssign`, `openSheets`, `renderPlaces`)

**Interfaces:**
- Consumes: `Pruefung.replacePlaceTrails`, `placeOf`, `shareText` (Task 1), `planPlaces`, `graphFor` (Task 3)
- Produces: `async replanPlace(placeId)`; Trails mit `place`; `state.examPools` mit Schlüssel `placeId + '|' + level`

- [ ] **Step 1:** `snapshot(c)` nutzt `c.G` und setzt `place: c.place`. `startExam()` schreibt `places` als Kopie aller Orte, die Teams haben (Name, Mitte, Gelände), `version: Pruefung.VERSION`, und `settings` ohne `terrain`.
- [ ] **Step 2:** `replanPlace(placeId)`:
  - Nach `confirm('Nur Ort B (Eßfeld) neu planen? Trails, Häkchen und Zuteilung dieses Orts gehen verloren, die anderen Orte bleiben.')` folgt `planPlaces([placeId], 'pruefung')`.
  - Bei Erfolg: `state.exam = Pruefung.replacePlaceTrails(state.exam, placeId, plan.map(snapshot), place)`. Danach `examSeen` neu, `examPools` des Orts löschen, `persistExam()`, `renderResults()`, `drawExam(true)`.
  - Bei Misserfolg: Meldung, der Stand bleibt unverändert.
  - Der Knopf „nur diesen Ort neu planen“ erscheint in `renderPlaces()` je Ort, nur im Modus `pruefung` mit vorhandenem `state.exam`.
- [ ] **Step 3:** `replaceTrail(i)` nimmt Ort und Gelände aus `Pruefung.placeOf(ex, old)`. Der Graph kommt über `graphFor(place, settings.radius)`, Hindernisse sind nur Trails mit gleichem `place`, der Pool-Schlüssel ist `place|level`.
- [ ] **Step 4:** Anzeige:
  - `renderExam` zeigt ab zwei Orten „Trail N · Ortsname“ im Kartenkopf.
  - Die Zuteil-Tabelle zeigt ab zwei Orten „8 · MT-II · Eßfeld“.
  - Auf dem Bogen lautet die Zeile „Ort“ `placeOf(...).name` (bis zum ersten Komma) · Start → Ende.
  - `applyExam` setzt `state.places` aus `ex.places` und den aktiven Ort auf den ersten. Die Teams behalten ihren Ort, sofern es ihn gibt, sonst A.
- [ ] **Step 5:** Run `node --test "tests/*.test.mjs"`. Expected: PASS.
- [ ] **Step 6:** Im Browser prüfen:
  1. Prüfung mit A und B planen, Trails 1–3 abhaken, Trail 2 zuteilen.
  2. „Nur Ort B neu planen“: Trails 1–7 sind unverändert samt Häkchen und Zuteilung, 8–10 sind neu.
  3. Trail 9 ersetzen: Er bleibt in Eßfeld.
  4. Speichern, Seite neu laden, Datei öffnen: Orte und Trails sind gleich.
  5. Eine alte v1-Datei öffnen: Ort A ist korrekt.
  6. Ort B aus der Liste entfernen: Die Bögen zeigen weiter „Eßfeld“.
  7. Bögen und WhatsApp zeigen die Orte.
- [ ] **Step 7:** Commit: `Prüfungsablauf mit mehreren Orten: Ort je Trail, einzelner Ort neu planen`

---

### Task 5: Abschlussprüfung

- [ ] **Step 1:** Run `node --test "tests/*.test.mjs"`. Expected: PASS.
- [ ] **Step 2:** Durchlauf mit echten Daten: Giebelstadt (MT-I) und Eßfeld (MT-II), planen, ersetzen, Ort neu planen, Bögen als Vorschau.
- [ ] **Step 3:** Ein unabhängiger Prüfer liest den ganzen Zweig (`superpowers:requesting-code-review`). Wichtige Funde behebe ich mit Test.
