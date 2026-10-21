# Trails in Reihe – Umsetzungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline, gewählt vom Nutzer). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Im Prüfungsmodus bilden die Trails eines Orts eine Kette (MT-I zuerst, dann MT-II). Jeder Übergang vom Ziel zum nächsten Start ist 75–250 m Fußweg und mindestens 75 m Luftlinie, und der Fußweg meidet alle noch nicht gelaufenen Trails. Wo das nicht geht, entstehen möglichst wenige Lücken.

**Architecture:** Neu im `Planner`: ein Fußweg-Graph aus allen begehbaren Wegen, Dijkstra mit gesperrten Kanten und eine Kettensuche **rückwärts**. Rückwärts heißt: Beim Wählen eines Vorgängers sind alle später gelaufenen Trails schon bekannt, und ihre Kanten sind gesperrt. Gesucht wird mit steigendem Lückenbudget (0, 1, 2, …), mit Zeitlimit. Die App nutzt `chain` statt `plans` im Prüfungsmodus. Trails erhalten `link` (Fußweg, Lücke, Wegverlauf).

**Tech Stack:** wie bisher; Tests `node --test "tests/*.test.mjs"`.

**Spec:** `docs/superpowers/specs/2026-10-22-trails-in-reihe-design.md`

## Global Constraints

- Nur Prüfungsmodus. Training unverändert.
- Übergang: Fußweg 75–250 m **und** Luftlinie ≥ 75 m. Nie dehnen.
- Fußweg meidet alle Trails, die später gelaufen werden (Mindestabstand), mit Ausnahme der letzten 20 m am nächsten Start.
- Fußweg über alle begehbaren Wege, unabhängig von Gelände und Fußweg-Schalter. Straßen mit Verkehr darf die Gruppe überqueren.
- Reihenfolge je Ort: MT-I, dann MT-II, dann MT-III. Die Nummerierung folgt der Kette, die Orte folgen in Listenreihenfolge.
- Bestehende harte Regeln bleiben unverändert.
- Version +0.1 (V1.4), Changelog-Eintrag.

## Review Focus

1. Ort mit nur einem Trail: keine Übergänge, kein Fehler.
2. Kein einziger gültiger Übergang: Plan ohne Kette (alles Lücken) mit klarer Meldung.
3. Ersetzen eines Trails mitten in der Kette: Beide Übergänge müssen gültig bleiben, sonst bleibt der Trail unverändert.
4. Alte Dateien ohne `link`: Sie öffnen ohne Kettenanzeige.
5. Laufzeit: Die Suche bricht nach einem Zeitlimit ab und nimmt die beste gefundene Lösung.

---

### Task 1: Fußweg-Graph und Messung (Planner)

**Produces:**
- `walkGraph(G)` → Kanten aus allen `G.segs` (Folgepunkte), Knoten-Positionen, Nachbarlisten.
- `blockedEdges(W, pts, minDist, exceptPt = null, exceptR = 20)` → Set der Kanten-IDs näher als `minDist` an der Linie `pts`. Kanten innerhalb von `exceptR` um `exceptPt` sind ausgenommen.
- `walk(G, W, fromPt, toPt, blocked: Set[], maxLen = 250)` → `{ dist, pts } | null`. Der kürzeste Weg vom Punkt `fromPt` (Trail-Ende, liegt auf einem Segment) zum Punkt `toPt`. Beide Punkte werden auf die nächste Kante gesetzt. Gesperrte Kanten sind tabu.

**Tests:** auf dem 90-m-Raster:
- Fußweg zwischen zwei Punkten um eine Ecke = Summe der Strecken.
- Mit gesperrter Kante wird umgeleitet (länger) oder es gibt `null`.
- `maxLen` wird eingehalten.

### Task 2: Kettensuche (Planner)

**Produces:** `chain(G, W, teams, pools, R, minDist, opts)` → `{ order: cand[], teams: team[] (in Kettenreihenfolge), links: ({dist, pts} | null)[] (links[i] = Übergang zu order[i], links[0] = null), gaps: n }` oder `{ order: [] }`.

**Ablauf:**
- Stufenfolge MT-I…MT-III.
- Rückwärts-DFS mit Lückenbudget 0…n−1.
- Kandidaten je Position nach `excess` sortiert, höchstens 25 je Position.
- Paarweise `compatible(minDist)`.
- Übergang: Luftlinie ≥ 75 m, `walk` 75–250 m mit gesperrten Kanten aller späteren Trails. Beim direkten Nachfolger zählen nur die Kanten außerhalb von 20 m um seinen Start.
- Zeitlimit `opts.ms` (Standard 4000 ms über alle Budgets).

**Tests:** auf dem 180-m-Raster (`wideOSM`):
- 3× MT-I ergibt eine Kette mit 0 Lücken. Alle Übergänge liegen bei 75–250 m Fußweg und ≥ 75 m Luftlinie.
- Kein Fußweg kommt einem späteren Trail näher als `minDist`.
- Mit `maxLen` 10 ergeben sich n−1 Lücken (Kette nicht möglich).

### Task 3: App – Planen und Anzeige

- In `planPlaces` im Modus `pruefung`: `Planner.chain` statt `plans`. Die Teamreihenfolge des Orts ist die Kettenreihenfolge. Das Ergebnis wird je Ort in Ortsreihenfolge aneinandergehängt, nicht nach dem Teamindex sortiert.
- `snapshot(c, link)` setzt `t.link = { dist, gap, ll }`. `gap: true` heißt Lücke, mit Luftlinie in `dist`. `null` steht beim ersten Trail eines Orts.
- Trailkarte:
  - „Weg vom vorigen Ziel: 180 m“
  - „Lücke: neuer Abschnitt (X m Luftlinie vom vorigen Ziel)“
- Status: „Kette ohne Lücke / mit N Lücken / keine Kette möglich“.
- Karte: gestrichelte Linie entlang `link.ll`.
- Browserprüfung mit Giebelstadt 2,2 km, Gelände frei, 7× MT-I + 3× MT-II.

### Task 4: Ersetzen in der Kette

- `replaceTrail`: Hatte der Trail einen gültigen Übergang zum Vorgänger oder zum Nachfolger, muss der Ersatz beide Übergänge erfüllen. Gesperrt sind die Kanten aller späteren Trails, gemessen auf dem neu aufgebauten Fußweg-Graphen. `link` von Ersatz und Nachfolger werden neu gesetzt.
- Browserprüfung: Ein Trail mitten in der Kette wird ersetzt, die Übergänge bleiben 75–250 m.

### Task 5: Abschluss

- Real-Daten-Bericht Giebelstadt: Lücken, Übergänge
- Ein Review
- V1.4, Changelog, Push, Prüfung der Online-Version
