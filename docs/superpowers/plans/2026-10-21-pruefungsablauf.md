# Prüfungsablauf – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der Trailplaner bekommt im Modus „Prüfung“ einen durchgehenden Ablauf: Trails planen, abhaken, als Datei speichern und laden, einzeln ersetzen, am Prüfungstag Teams und Versteckpersonen zuteilen und pro Trail einen A4-Prüfungsbogen als PDF drucken. Außerdem läuft die App künftig über GitHub Pages.

**Architecture:** Alles bleibt in der einen Datei `index.html`. Ein neuer DOM-freier Skriptblock `Pruefung` enthält die reine Logik: Dateiformat, Namenslisten, Würfeln, Tauschen, Hindernisse für den Abstandstest. Er wird wie `Planner` per `module.exports` mit Node getestet. Ein geplanter Trail wird beim Übergang in den Prüfungsablauf zu einem **Schnappschuss** eingefroren: Punkte als Lat/Lon, Länge, Kennzahlen, Verlauf, Straßennamen. Alles danach, also Anzeige, Speichern, Zuteilen und Bögen, arbeitet nur mit diesen Schnappschüssen und nie mehr mit dem OSM-Graphen. Die einzige Ausnahme ist „Ersetzen“.

**Tech Stack:** HTML/CSS/JavaScript ohne Build, Leaflet 1.9.4 (cdnjs, schon eingebunden), Esri-Kacheln ohne Schlüssel, Node 24 mit `node:test` für die Logiktests, Browser-Druck („Als PDF speichern“) für die Bögen.

**Spec:** `docs/superpowers/specs/2026-10-21-pruefungsablauf-design.md`

## Global Constraints

- Eine einzige HTML-Datei, kein Server, keine Anmeldung, keine kostenpflichtigen Dienste und keine API-Schlüssel. Fremdbibliotheken nur per CDN (wie Leaflet von cdnjs).
- Alle neuen Funktionen gibt es **nur, wenn oben „Prüfung“ gewählt ist**. Im Modus „Training“ verhält sich der Planer genau wie heute.
- Ein gespeicherter Trail sieht nach dem Laden **exakt** so aus wie beim Abfahren. Zum Anzeigen, Zuteilen und Drucken wird nichts neu berechnet und nichts neu aus OpenStreetMap geholt.
- Ein Team landet nie auf einem Trail einer anderen Stufe.
- Ungleiche Zahlen blockieren nichts: Jeder Trail bleibt in der Tabelle und bekommt einen Bogen. Leere Felder werden als Linie zum Ausfüllen gedruckt.
- Die Seite muss als normale Webseite (GitHub Pages) **und** im Apps-Script-Rahmen (HtmlService-iframe) funktionieren.
- Echte Namen kommen nie ins Repository. Tests und Beispiele verwenden erfundene Namen. `testdaten/` ist durch `.gitignore` ausgeschlossen.
- Die Oberfläche ist auf Deutsch, im Ton der bestehenden App.
- Reihenfolge nach Termin (Prüfung am 31.10.2026): erst Phase 1 (Tasks 1–4) und Pages (Task 5), damit sofort neu geplant und abgefahren werden kann, danach Zuteilung (Task 6) und Bögen (Task 7).

## Review Focus

1. **Falsche oder fremde Datei beim Öffnen**, etwa eine GPX-Datei, eine kaputte JSON oder eine Datei aus einer neueren Version: Es erscheint eine klare deutsche Meldung, und der aktuelle Stand bleibt unverändert. Getestet in Task 1 (`parseExam`) und geprüft in Task 3.
2. **Unsaubere Namenslisten** mit Leerzeilen, Leerzeichen und doppelten Namen: Leerzeilen werden ignoriert, Leerzeichen entfernt, Dubletten nur einmal übernommen. Getestet in Task 1 (`parseNames`).
3. **Mehr Teams einer Stufe als Trails dieser Stufe:** Das Würfeln verteilt, was passt, und meldet die übrigen Namen. Kein Team rutscht in eine andere Stufe. Getestet in Task 1 (`draw`).
4. **OpenStreetMap beim Ersetzen nicht erreichbar oder kein passender Ersatz:** Es erscheint eine Meldung, und der Trail bleibt samt Häkchen unverändert. Geprüft in Task 4.
5. **Luftbild-Kacheln laden beim Drucken nicht**, zum Beispiel offline: Die Vorschau erscheint nach einer Wartezeit trotzdem, mit einem Hinweis, und hängt nicht endlos. Geprüft in Task 7.

---

### Task 1: Prüfungslogik als testbarer Block

**Files:**
- Modify: `index.html`, neuer `<script>`-Block direkt nach dem Planner-Block (nach der heutigen Zeile 987 `</script>`)
- Create: `tests/load.mjs`, `tests/pruefung.test.mjs`

**Interfaces:**
- Consumes: `Planner.compatible(A, B, minDist)`, `Planner.rng(seed)` (bestehend)
- Produces (global `Pruefung`, in Node über `module.exports`):
  - `FORMAT = 'trailplaner-pruefung'`, `VERSION = 1`
  - `parseNames(text: string) -> string[]`: trimmen, Leerzeilen weg, Dubletten weg, Reihenfolge bleibt
  - `splitTeam(name: string) -> { hf: string, hund: string }`: trennt am ersten „ mit “. Ohne „ mit “ gilt `{ hf: name, hund: '' }`.
  - `draw(trails: {level}[], teams: {[level]: string[]}, vps: string[], R: () => number) -> { assign: {team, vp}[], unplaced: { teams: string[], vps: string[] } }`
  - `setCell(assign, i, field: 'team'|'vp', name: string) -> void`: Steht `name` schon in einer anderen Zeile `j` im selben Feld, bekommt `j` den alten Wert von `i` (Tausch). Ein leerer `name` leert nur `i`.
  - `obstacle(trail: {ll}, fromLatLon: (ll) => [x, y]) -> { segSet: Set, nodeSet: Set, bbox: [x0, y0, x1, y1], v: { pts } }`, passend für `Planner.compatible`
  - `serializeExam(exam) -> string` und `parseExam(text) -> exam`. Bei Fehlern wirft `parseExam` einen `Error` mit deutscher Meldung (siehe Test).
  - Exam-Objekt (auch das Dateiformat):
    `{ format, version, savedAt, placeName, center: {lat, lon}, settings: {radius, minDist, terrain, allowPaths, avoidLoops, startTime}, date: 'YYYY-MM-DD', trails: Trail[], names: { teams: {'MT-I': string[], 'MT-II': string[], 'MT-III': string[]}, vps: string[] }, assign: {team, vp}[] }`
  - Trail: `{ level, ll: [lat, lon][], length, turns, decisions, crossings, steps: {at, kind, text}[], startStreet, endStreet, checked: boolean }`

- [ ] **Step 1: Testlader schreiben** (`tests/load.mjs`): liest `index.html` und schneidet die beiden Blöcke heraus. Der Planner-Block beginnt mit `/* Trailplaner – Planungslogik`, der Prüfungsblock mit `/* Trailplaner – Prüfungslogik`. Beide laufen nacheinander mit `vm.runInContext` in **einem** Kontext. Dort gibt es ein `module`-Objekt pro Block, und `Planner` ist für den zweiten Block global sichtbar. Export: `export const { Planner, Pruefung } = …`.

- [ ] **Step 2: Fehlschlagende Tests schreiben** (`tests/pruefung.test.mjs`, `node:test` + `node:assert/strict`):

```js
test('parseNames trimmt, ignoriert Leerzeilen und Dubletten', () => {
  assert.deepEqual(Pruefung.parseNames('  Anna mit Luna \n\n Ben mit Rex\nAnna mit Luna\n'), ['Anna mit Luna', 'Ben mit Rex']);
});
test('splitTeam trennt am ersten " mit "', () => {
  assert.deepEqual(Pruefung.splitTeam('Eva mit Carl von der Mühle'), { hf: 'Eva', hund: 'Carl von der Mühle' });
  assert.deepEqual(Pruefung.splitTeam('Eva'), { hf: 'Eva', hund: '' });
});
const T = lv => ({ level: lv });
test('draw: Teams bleiben in ihrer Stufe, alle Trails werden besetzt', () => {
  const trails = [T('MT-I'), T('MT-II'), T('MT-I'), T('MT-II')];
  const r = Pruefung.draw(trails, { 'MT-I': ['A', 'B'], 'MT-II': ['C', 'D'] }, ['V1', 'V2', 'V3', 'V4'], Planner.rng(1));
  assert.deepEqual(r.assign.filter((_, i) => trails[i].level === 'MT-I').map(a => a.team).sort(), ['A', 'B']);
  assert.deepEqual(r.assign.filter((_, i) => trails[i].level === 'MT-II').map(a => a.team).sort(), ['C', 'D']);
  assert.deepEqual(r.assign.map(a => a.vp).sort(), ['V1', 'V2', 'V3', 'V4']);
});
test('draw: zu wenige Namen lassen Felder leer, zu viele werden gemeldet', () => {
  const r = Pruefung.draw([T('MT-I'), T('MT-I')], { 'MT-I': ['A', 'B', 'X'] }, ['V1'], Planner.rng(2));
  assert.equal(r.assign.length, 2);
  assert.equal(r.unplaced.teams.length, 1);
  assert.equal(r.assign.filter(a => a.vp === '').length, 1);
  assert.deepEqual(r.unplaced.vps, []);
});
test('draw: gleicher Startwert ergibt gleiche Zuteilung', () => {
  const args = [[T('MT-I'), T('MT-I'), T('MT-I')], { 'MT-I': ['A', 'B', 'C'] }, ['V1', 'V2', 'V3']];
  assert.deepEqual(Pruefung.draw(...args, Planner.rng(7)), Pruefung.draw(...args, Planner.rng(7)));
});
test('setCell tauscht, wenn der Name schon vergeben ist', () => {
  const a = [{ team: 'A', vp: 'V1' }, { team: 'B', vp: 'V2' }];
  Pruefung.setCell(a, 0, 'vp', 'V2');
  assert.deepEqual(a, [{ team: 'A', vp: 'V2' }, { team: 'B', vp: 'V1' }]);
  Pruefung.setCell(a, 1, 'team', '');
  assert.equal(a[1].team, '');
});
test('obstacle + Planner.compatible erkennt zu nahe Trails', () => {
  const id = ll => [ll[1], ll[0]];                       // Test-Projektion: x = lon, y = lat (Meter)
  const a = Pruefung.obstacle({ ll: [[0, 0], [0, 200]] }, id);
  const near = Pruefung.obstacle({ ll: [[10, 0], [10, 200]] }, id);
  const far = Pruefung.obstacle({ ll: [[100, 0], [100, 200]] }, id);
  assert.equal(Planner.compatible(a, near, 30), false);
  assert.equal(Planner.compatible(a, far, 30), true);
});
test('serializeExam/parseExam: Hin und zurück ohne Verlust', () => {
  const exam = { format: 'trailplaner-pruefung', version: 1, savedAt: '2026-10-22T10:00:00Z', placeName: 'Musterdorf',
    center: { lat: 49.65, lon: 9.95 }, settings: { radius: 1200, minDist: 30, terrain: 'ort', allowPaths: false, avoidLoops: true, startTime: '10:00' },
    date: '2026-10-31', trails: [{ level: 'MT-I', ll: [[49.65, 9.95], [49.651, 9.951]], length: 305, turns: 1, decisions: 1, crossings: 0,
      steps: [{ at: 0, kind: 'start', text: 'Start' }], startStreet: 'Industriestraße', endStreet: 'Bavariastraße', checked: true }],
    names: { teams: { 'MT-I': ['Anna mit Luna'], 'MT-II': [], 'MT-III': [] }, vps: ['VP1'] }, assign: [{ team: 'Anna mit Luna', vp: 'VP1' }] };
  assert.deepEqual(Pruefung.parseExam(Pruefung.serializeExam(exam)), exam);
});
test('parseExam lehnt fremde und kaputte Dateien mit deutscher Meldung ab', () => {
  assert.throws(() => Pruefung.parseExam('<gpx></gpx>'), /kein gespeicherter Trailplan/);
  assert.throws(() => Pruefung.parseExam('{"format":"x"}'), /kein gespeicherter Trailplan/);
  assert.throws(() => Pruefung.parseExam('{"format":"trailplaner-pruefung","version":2,"trails":[]}'), /neueren Version/);
  assert.throws(() => Pruefung.parseExam('{"format":"trailplaner-pruefung","version":1,"trails":[{"level":"MT-I","ll":[[1,2]]}]}'), /Trail 1 hat keine Strecke/);
});
test('parseExam ergänzt fehlende Zuteilung und Namenslisten', () => {
  const ex = Pruefung.parseExam('{"format":"trailplaner-pruefung","version":1,"trails":[{"level":"MT-II","ll":[[1,2],[1,3]]}]}');
  assert.deepEqual(ex.assign, [{ team: '', vp: '' }]);
  assert.deepEqual(ex.names, { teams: { 'MT-I': [], 'MT-II': [], 'MT-III': [] }, vps: [] });
  assert.equal(ex.trails[0].checked, false);
});
```

- [ ] **Step 3: Tests laufen lassen.** Run: `node --test tests/`. Expected: FAIL (`Pruefung` fehlt).

- [ ] **Step 4: Block `Pruefung` in `index.html` anlegen.** Kopfkommentar: `/* Trailplaner – Prüfungslogik (ohne DOM, testbar mit Node) */`. Aufbau wie beim Planner: `const Pruefung = (() => { 'use strict'; … return {…}; })(); if (typeof module !== 'undefined') module.exports = Pruefung;`.
  - `draw`: Pro Stufe werden die Trail-Indizes und die Teamnamen getrennt per Fisher-Yates mit `R` gemischt und paarweise zugeordnet. Übrige Trails bekommen `''`, übrige Namen kommen in `unplaced.teams`. Die Versteckpersonen werden genauso über alle Trails gemischt.
  - `obstacle`: `pts = ll.map(fromLatLon)`, `bbox` aus `pts`, leere `segSet`/`nodeSet`.
  - Meldungen in `parseExam` wörtlich:
    - „Die Datei ist kein gespeicherter Trailplan.“
    - „Diese Datei stammt aus einer neueren Version des Trailplaners.“
    - „Die Datei ist beschädigt: Trail N hat keine Strecke.“ (Trail ohne `ll` oder mit weniger als 2 Punkten)
  - Fehlende `assign`, `names` oder `checked` werden mit Leerwerten ergänzt. `assign` hat immer genau `trails.length` Einträge.

- [ ] **Step 5: Tests laufen lassen.** Run: `node --test tests/`. Expected: alle PASS.

- [ ] **Step 6: Commit**

```bash
git add index.html tests/
git commit -m "Prüfungslogik als testbarer Block (Dateiformat, Würfeln, Tauschen)"
```

---

### Task 2: Schnappschüsse, Prüfungskarten und Häkchen

**Files:**
- Modify: `index.html`:
  - Planner: `buildGraph` (Rückgabe Zeile ~545) und Export-Zeile ~985
  - App-Block: `state` (~998), `run` (~1189), `renderResults` (~1327), `drawPlan` (~1293), CSS

**Interfaces:**
- Consumes: `Pruefung` (Task 1), `Planner.describe`, `Planner.validate`
- Produces:
  - `G.fromLatLon(ll: [lat, lon]) -> [x, y]` im Graph-Objekt, Gegenstück zu `toLatLon`
  - `Planner.endpointNames(G, tr) -> { start: string, end: string }`: Wegnamen am Start (wie im ersten `describe`-Schritt) und am Ende (letztes Bein, Teilstück bei `d1`), beide über `wayName`
  - App: `state.exam` (Exam-Objekt aus Task 1 oder `null`), `snapshot(c) -> Trail`, `startExam()`, `renderExam()`, `drawExam()`, `persistExam()` (Task 3 füllt den Rumpf, hier zunächst leer)

- [ ] **Step 1: Fehlschlagenden Test schreiben** (`tests/planner.test.mjs`): `Planner.endpointNames` existiert und ist eine Funktion. *(Einen Graphen mit Trail baut nur ein OSM-Abruf, deshalb prüft der Test nur den Export. Das Verhalten prüft Step 6 im Browser.)*

- [ ] **Step 2: Test laufen lassen.** Run: `node --test tests/`. Expected: FAIL.

- [ ] **Step 3: `fromLatLon` und `endpointNames` im Planner ergänzen.** `fromLatLon = ll => P(ll[0], ll[1])` kommt neben `toLatLon` ins Rückgabeobjekt. `endpointNames` kommt in den Export.

- [ ] **Step 4: Test laufen lassen.** Run: `node --test tests/`. Expected: PASS.

- [ ] **Step 5: Prüfungsablauf im App-Block verdrahten.**
  - `snapshot(c)` übernimmt `c.tr.level`, `c.v.pts` umgerechnet mit `state.graph.toLatLon`, `Math.round(c.v.length)`, `turns`, `decisions` und `crossings` aus `Planner.validate`, die Schritte aus `Planner.describe` sowie `endpointNames`, mit `checked: false`.
  - `startExam()` baut aus `state.plans[state.active]` ein neues `state.exam`: `format`/`version` aus `Pruefung`, Ort, Mitte, Einstellungen aus den Eingabefeldern, `date` = heute, leere Namen und `assign`.
  - `run()` ruft im Modus `pruefung` nach erfolgreicher Planung `startExam()` auf. Gibt es schon ein `state.exam`, fragt `confirm('Neu planen verwirft den aktuellen Prüfungsstand. Fortfahren?')` vorher nach. Bei „Abbrechen“ wird nicht geplant.
  - `renderResults()` zeigt im Modus `pruefung` bei vorhandenem `state.exam` stattdessen `renderExam()`. Im Training bleibt alles wie heute.
  - `renderExam()` zeigt die Überschrift „4 · Prüfungstrails“ und eine Karte pro Trail mit:
    - Nummer und Stufe, Länge, Kennzahlen, aufklappbarem Verlauf aus `steps`
    - Links zu Start- und Endpunkt (bestehendes `pointLink`)
    - Checkbox „geprüft (abgefahren)“, die `trail.checked` setzt und `persistExam()` aufruft
    - Knopf „Ersetzen“ (Task 4, hier zunächst deaktiviert)
    - Über den Karten den Zähler „N von M Trails geprüft“
  - `drawExam()` zeichnet wie `drawPlan()`, aber aus `trail.ll`, mit der Beschriftung „Trail N · Stufe“. Abbiegemarker kommen aus `steps` mit `kind === 'turn'` und `pointAtDist` auf den umgerechneten Punkten. Dafür bekommt `pointAtDist` eine Lat/Lon-Variante: Abstände über `L.latLng().distanceTo`.

- [ ] **Step 6: Im Browser prüfen.** Start mit `npx --yes http-server -p 8080 -c-1`, dann Giebelstadt öffnen.
  - **Prüfung:** 7× MT-I und 3× MT-II einstellen und „Trails planen“ drücken. Es erscheinen 10 Karten mit Checkbox. Der Zähler zählt mit. Die Karte zeigt alle Trails.
  - **Training:** Die Ansicht ist unverändert wie vorher, mit Alternativ-Trail und WhatsApp-Links.

- [ ] **Step 7: Commit**

```bash
git add index.html tests/
git commit -m "Prüfungsmodus: Trails als Schnappschuss mit Häkchen"
```

---

### Task 3: Speichern, Öffnen und automatische Sicherung

**Files:**
- Modify: `index.html`, App-Block (neu neben `download`, ~1285), Ergebnisbereich von `renderExam`, Start der App (nach `renderMode()`)

**Interfaces:**
- Consumes: `Pruefung.serializeExam`, `Pruefung.parseExam`, `state.exam`, `renderExam`, `drawExam`
- Produces: `persistExam()` (Rumpf), `saveExamFile()`, `openExamFile(file: File)`, Schlüssel `localStorage['trailplaner-pruefung']`

- [ ] **Step 1: `download` verallgemeinern.** Die Signatur wird `download(name, text, type = 'application/gpx+xml')`, sodass der bestehende GPX-Aufruf unverändert bleibt.
- [ ] **Step 2: Funktionen schreiben.**
  - `persistExam()` schreibt `serializeExam(state.exam)` in `try/catch` nach `localStorage['trailplaner-pruefung']`.
  - `saveExamFile()` setzt `savedAt` und lädt `Trailplan_<Ort bis zum ersten Komma, Leerzeichen → _>_<date>.json` als `application/json` herunter.
  - `openExamFile(file)` liest die Datei. Klappt `parseExam`, ersetzt der Inhalt `state.exam`. Dann werden Mitte, Ortsname, Kreis und Eingabefelder aus `settings` gesetzt, der Modus wird `pruefung`, und es folgen `persistExam()`, `renderResults()` und `drawExam()`. Bei einem Fehler erscheint die Meldung über `setStatus(msg, true)`, und der Stand bleibt unverändert.
  - Jeder Aufruf, der `state.exam` ändert, endet mit `persistExam()`.
- [ ] **Step 3: Bedienelemente einbauen.** Nur sichtbar im Modus `pruefung`, in der Aktionsleiste unter „Trails planen“:
  - Knopf „Stand speichern …“, aktiv nur mit `state.exam`
  - Knopf „Gespeicherten Stand öffnen …“ mit verstecktem `<input type="file" accept=".json,application/json">`
- [ ] **Step 4: Wiederherstellen beim Start.** Ist der Modus `pruefung` und gibt es `localStorage['trailplaner-pruefung']`, wird der Stand still geladen. Die Statuszeile meldet dann „Letzter Prüfungsstand wiederhergestellt (N Trails).“. Eine kaputte Sicherung wird ignoriert und nicht gemeldet.
- [ ] **Step 5: Im Browser prüfen.**
  1. Planen, zwei Trails abhaken, speichern, Seite neu laden: Die Häkchen sind noch da.
  2. Die Sicherung im Browser löschen, die Datei öffnen: Die Trails liegen exakt deckungsgleich auf der Karte, die Häkchen sind gesetzt.
  3. Eine `.gpx`-Datei öffnen: Es erscheint die Meldung, und der Stand bleibt.
  4. In Training wechseln und zurück: Der Stand ist noch da.
  5. Mit DevTools offline gehen und die Datei öffnen: Die Trails erscheinen trotzdem. Das zeigt, dass kein OSM-Abruf passiert.
- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "Prüfungsstand speichern, öffnen und automatisch sichern"
```

---

### Task 4: Einzelnen Trail ersetzen, auch nach dem Laden

**Files:**
- Modify: `index.html`, App-Block (`renderExam`, neue Funktion `replaceTrail`)

**Interfaces:**
- Consumes: `loadOSM`, `Planner.buildGraph`, `Planner.setTerrain`, `Planner.pool`, `Planner.compatible`, `Pruefung.obstacle`, `snapshot`, `state.exam.settings`
- Produces: `async replaceTrail(i: number) -> void`, `state.examSeen: Set<string>[]` (schon gezeigte Kandidaten-IDs je Trail, nur im Speicher)

- [ ] **Step 1: `replaceTrail(i)` schreiben.**
  - Vorher fragt `confirm('Trail N ersetzen? Das Häkchen geht verloren, der neue Trail muss abgefahren werden.')` nach.
  - Den Graphen gibt es nur, wenn er fehlt oder der Schlüssel aus Mitte und Radius nicht passt. Dann wird er mit `state.exam.center` und `state.exam.settings.radius` aufgebaut, über denselben Weg wie in `run()`. `Planner.setTerrain` bekommt die `settings` der Datei.
  - Der Pool der Stufe wird mit `mode: 'pruefung'` gewürfelt und pro Stufe in einem eigenen Zwischenspeicher `state.examPools` abgelegt, nicht in `state.pools`, denn dort können Trainings-Pools liegen. `state.examPools` wird geleert, sobald der Graph neu gebaut wird.
  - Hindernisse sind die `Pruefung.obstacle(t, G.fromLatLon)` aller **anderen** Trails.
  - Genommen wird der erste Kandidat, der zu allen Hindernissen mit `settings.minDist` passt und noch nicht in `state.examSeen[i]` steht. Sind alle gesehen, wird `examSeen[i]` geleert und neu angefangen.
  - Der Trail wird durch `snapshot(k)` mit `checked: false` ersetzt, dann `persistExam()`, `renderExam()` und `drawExam()`.
  - Fehlerfälle per `setStatus(…, true)`, der Trail bleibt dabei unverändert:
    - OSM nicht erreichbar: „OpenStreetMap ist gerade nicht erreichbar. Trail N bleibt unverändert.“
    - Kein passender Kandidat: „Für Trail N habe ich keinen Ersatz gefunden, der zu den anderen Trails passt. Trail N bleibt unverändert.“
- [ ] **Step 2: Knopf „Ersetzen“ in `renderExam` freischalten.** Während der Suche ist er deaktiviert und zeigt „Suche Ersatz …“.
- [ ] **Step 3: Im Browser prüfen.**
  1. Planen, speichern, Seite neu laden (der Graph ist dann leer).
  2. Trail 3 ersetzen: Nur Trail 3 ändert sich, und sein Häkchen ist weg. Die übrigen Trails bleiben deckungsgleich. Der neue Trail hält mindestens den eingestellten Abstand.
  3. Offline ersetzen: Die Meldung erscheint, und Trail 3 samt Häkchen bleibt unverändert.
- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Einzelnen Prüfungstrail ersetzen, auch nach dem Laden"
```

---

### Task 5: Veröffentlichen über GitHub Pages (Zwischenstand für die Planung)

**Files:** keine Codeänderung

- [ ] **Step 1: Tests und Hochladen.** Run: `node --test tests/`, Expected PASS, dann `git push`.
- [ ] **Step 2: Pages einschalten (macht der Nutzer).** Auf `github.com/Lefix-oss/Trailplaner` → *Settings* → *Pages* → *Source: Deploy from a branch* → *Branch: main*, Ordner `/ (root)` → *Save*.
- [ ] **Step 3: Erreichbarkeit prüfen.** `https://lefix-oss.github.io/Trailplaner/` im Browser öffnen, sobald die Seite bereitsteht (das dauert ein bis zwei Minuten). Erwartet:
  - Die App lädt.
  - Die OpenStreetMap-Kacheln erscheinen.
  - Im Modus „Prüfung“ funktionieren Planen und Speichern.
- [ ] **Step 4: Meldung an den Nutzer.** Er kann ab jetzt die Prüfungstrails neu planen und abfahren.

---

### Task 6: Zuteil-Tabelle mit Würfeln (Prüfungstag)

**Files:**
- Modify: `index.html`, App-Block (neuer Abschnitt in `renderExam`), CSS

**Interfaces:**
- Consumes: `Pruefung.parseNames`, `Pruefung.draw`, `Pruefung.setCell`, `Planner.rng`, `state.exam.names`, `state.exam.assign`
- Produces: `renderAssign(host: HTMLElement)`

- [ ] **Step 1: Abschnitt „5 · Zuteilung“ unter den Prüfungskarten bauen.**
  - Ein Datumsfeld „Prüfungsdatum“ (`input type="date"`) bindet an `exam.date`.
  - Je Stufe, die unter den Trails vorkommt, gibt es eine Textarea „Teams MT-I (N Trails)“, einen Namen pro Zeile, im Format „Hundeführer mit Hund“. Dazu eine Textarea „Versteckpersonen (M Trails)“. Beim Verlassen eines Felds wird die Liste mit `parseNames` nach `exam.names` übernommen.
  - Die Tabelle hat die Spalten Trail · Stufe · Versteckperson · Team, eine Zeile pro Trail. Jede Zelle ist ein `<select>` mit der leeren Option „—“. Für Teams stehen nur die Namen der Stufe dieser Zeile zur Auswahl, für Versteckpersonen alle. Eine Änderung ruft `Pruefung.setCell` auf und zeichnet die Tabelle neu.
  - Der Knopf „🎲 Zuwürfeln“ ruft `draw` mit `Planner.rng(Date.now() % 1000003)` auf. Ist die Tabelle nicht leer, fragt er vorher mit `confirm('Bisherige Zuteilung überschreiben?')` nach. Für `unplaced` erscheint ein Hinweis „Nicht zugeteilt (mehr Namen als Trails): …“.
  - Der Knopf „Leeren“ setzt alle Zellen auf `''`.
  - Ist mindestens ein Trail ohne Häkchen, steht oben ein Warnkasten: „Achtung: Trail 3, 7 sind noch nicht als geprüft markiert.“ Er sperrt nichts.
  - Jede Änderung endet mit `persistExam()`.
- [ ] **Step 2: Im Browser mit erfundenen Namen prüfen** (7× MT-I, 3× MT-II, VP1–VP10).
  1. Würfeln: Alle MT-I-Teams stehen auf MT-I-Trails.
  2. Einen Namen per Auswahl tauschen: Er wandert ohne Dublette.
  3. Mit 9 Teams würfeln: Ein Feld bleibt „—“.
  4. Seite neu laden: Die Zuteilung ist noch da.
  5. Speichern und öffnen: Die Zuteilung ist enthalten.
- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Zuteil-Tabelle: Teams und Versteckpersonen zuwürfeln oder von Hand"
```

---

### Task 7: Prüfungsbögen als PDF

**Files:**
- Modify: `index.html`, App-Block (neue Funktion `openSheets`), CSS inklusive `@media print` und `@page`

**Interfaces:**
- Consumes: `state.exam`, `Pruefung.splitTeam`, Logo-SVG aus `header.brand svg.logo`
- Produces: `async openSheets()`, Overlay `#sheets`

- [ ] **Step 1: `openSheets()` schreiben.** Sie legt ein Vollbild-Overlay `#sheets` über die App. Oben ist eine Leiste mit „Drucken / Als PDF speichern“ (`window.print()`) und „Schließen“, darunter eine `.sheet` pro Trail.
  - **Seite:** 190 × 277 mm (A4 hoch, Seitenrand 10 mm), ein Rahmen wie im abgenommenen Entwurf.
  - **Kopfzeile:**
    - „Trail N · MT-I“ groß, rechts „Prüfung HSV Giebelstadt · Sa, 31.10.2026“ aus `exam.date` (Wochentag kurz, `de-DE`)
    - **HF**, **Hund** (aus `splitTeam`), **VP**, **Länge** „305 m“
    - **Ort:** „<Ortsname bis zum ersten Komma> · <startStreet> → <endStreet>“
    - Leere Werte als Linie zum Ausfüllen (`border-bottom`, Mindestbreite 45 mm). Lange Namen umbrechen statt abschneiden.
  - **Karte:** Sie füllt den Rest der Seite, als eigenes `L.map` ohne Zoom-Knöpfe, mit Esri World Imagery `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` (`maxZoom: 19`). Darauf:
    - der Trail als Linie, weiße Unterlage 9 px, darüber Orange `#e8590c` 5 px
    - die Marke „START“ in Grün am ersten Punkt, die Marke „ENDE · 305 m“ in Rot am letzten Punkt
    - `L.control.scale({ imperial: false })` und ein Nordpfeil „▲ N“
    - die Quellenangabe „Luftbild © Esri und Partner · Wege © OpenStreetMap-Mitwirkende“
    - der Ausschnitt per `fitBounds` mit 40 px Rand
  - **Fußzeile:** links „Start: 49.65310, 9.94530 · Ende: …“ (5 Nachkommastellen), rechts das geklonte Logo in 12 mm Höhe und „Trailplaner · HSV Giebelstadt“.
  - Der Druckknopf wird erst aktiv, wenn auf allen Karten das `load`-Ereignis der Kachelebene eingetroffen ist, spätestens aber nach 15 s. Im zweiten Fall erscheint der Hinweis „Einige Luftbilder sind nicht geladen. Internetverbindung prüfen oder trotzdem drucken.“.
  - **`@media print`:** `.app` und die Overlay-Leiste werden ausgeblendet, jede `.sheet` bekommt `break-after: page`. Dazu `@page { size: A4 portrait; margin: 10mm }`.
- [ ] **Step 2: Knopf „📄 Prüfungsbögen (PDF)“ einbauen.** Er steht unter der Zuteil-Tabelle, nur im Modus `pruefung`.
- [ ] **Step 3: Im Browser prüfen.**
  - Bögen öffnen, dann „Als PDF speichern“: 10 Seiten, je ein Trail mit echtem Luftbild, START, ENDE mit Länge, Maßstab, Nordpfeil, Logo.
  - Ein erfundener langer Name wie „Eva mit Carl von der Mühle“ bricht sauber um.
  - Ein leeres Feld erscheint als Linie.
  - Mit DevTools offline öffnen: Nach 15 s erscheint der Hinweis, und der Druck bleibt möglich.
- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Prüfungsbögen als PDF: ein A4-Blatt pro Trail mit Luftbild"
```

---

### Task 8: Abschlussprüfung mit echten Daten, Pages und Apps Script

**Files:** keine Codeänderung (Fehler, die hier auftauchen, werden in der jeweiligen Task behoben)

- [ ] **Step 1: Tests und Hochladen.** Run: `node --test tests/`, Expected PASS, dann `git push`. Danach `https://lefix-oss.github.io/Trailplaner/` neu laden.
- [ ] **Step 2: Durchlauf auf Pages** mit den echten Namen aus `testdaten/pruefung-teams.txt`, nur lokal eingetippt und nie committet: planen, abhaken, speichern, neu laden, öffnen, einen Trail ersetzen, zuwürfeln, Bögen als PDF speichern. Erwartet:
  - Jede Stufe stimmt.
  - Der längste echte Teamname (Hund mit dreiteiligem Namen) passt auf den Bogen.
  - Das PDF hat 10 Seiten.
- [ ] **Step 3: Kurztest in Apps Script (macht der Nutzer, mit Anleitung).**
  1. Den Inhalt von `index.html` in die Datei `index` des Apps-Script-Projekts kopieren und eine neue Bereitstellung anlegen.
  2. Dann prüfen: Planen, Speichern (Download), Öffnen (Dateiauswahl) und Bögen drucken.
  3. Ergebnis festhalten. Was dort nicht geht, wird dem Nutzer ehrlich gemeldet, denn Apps Script ist nur die Rückfallebene.
- [ ] **Step 4: Probedruck auf Papier (macht der Nutzer).** Mindestens ein Bogen, deutlich vor dem 31.10.2026.
