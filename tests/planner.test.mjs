import test from 'node:test';
import assert from 'node:assert/strict';
import { Planner } from './load.mjs';
import { CENTER, gridOSM, wideOSM, leg } from './fixtures.mjs';

test('Planner exportiert endpointNames', () => {
  assert.equal(typeof Planner.endpointNames, 'function');
});

function grid(allowPaths = false, strict = false) {
  const G = Planner.buildGraph(gridOSM(), CENTER, 1200);
  Planner.setTerrain(G, 'ort', allowPaths, true, strict);
  return G;
}
const check = (v, re) => v.checks.find(c => re.test(c.label));
// 30 m + 90 m geradeaus, links ab, 90 m + 88 m geradeaus: 1 Richtungswechsel, 2 zusätzliche Entscheidungsstellen
const oneTurnTwoExtra = G => ({ level: 'MT-I', mode: 'pruefung', legs: [leg(G, [1, 0], [1, 1], 60), leg(G, [1, 1], [1, 2]), leg(G, [1, 2], [2, 2]), leg(G, [2, 2], [3, 2], 0, 88)] });

// ---------- Richtungswechsel und zusätzliche Entscheidungsstellen getrennt ----------
test('PO: nur Mindestzahlen an Richtungswechseln, keine Höchstzahlen', () => {
  assert.deepEqual(['MT-I', 'MT-II', 'MT-III'].map(l => Planner.LEVELS[l].minTurns), [1, 2, 4]);
  for (const l of ['MT-I', 'MT-II', 'MT-III']) {
    assert.equal(Planner.LEVELS[l].maxTurns, undefined, l);
    assert.equal(Planner.LEVELS[l].maxDecisions, undefined, l);
  }
});

test('zusätzliche Entscheidungsstellen werden getrennt gezählt und machen den Trail nicht PO-widrig', () => {
  const G = grid();
  const v = Planner.validate(G, oneTurnTwoExtra(G));
  assert.equal(v.turns, 1);
  assert.equal(v.extraDecisions, 2);
  assert.equal(v.decisions, 3);
  assert.equal(check(v, /PO: mind\. 1 Richtungswechsel/).ok, true);
  assert.equal(v.ok, true);
  const soft = v.checks.find(c => c.soft);
  assert.equal(soft.ok, false);
  assert.match(soft.detail, /2 zusätzliche Entscheidungsstellen/);
});

test('geradeaus passierte Abzweigungen zählen nicht als Richtungswechsel', () => {
  const G = grid();
  // Reihe 1 geradeaus nach Osten über zwei Abzweigungen, ohne abzubiegen
  const tr = { level: 'MT-I', mode: 'pruefung', legs: [leg(G, [1, 0], [1, 1], 30), leg(G, [1, 1], [1, 2]), leg(G, [1, 2], [1, 3]), leg(G, [1, 3], [1, 4], 0, 30)] };
  const v = Planner.validate(G, tr);
  assert.equal(v.turns, 0);
  assert.ok(v.extraDecisions >= 2);
  assert.equal(check(v, /PO: mind\. 1 Richtungswechsel/).ok, false);
  assert.equal(v.ok, false);
});

test('strenge Einstellung verwirft Trails mit zusätzlichen Entscheidungsstellen', () => {
  const G = grid(false, true);
  const v = Planner.validate(G, oneTurnTwoExtra(G));
  assert.equal(v.ok, false);
  assert.equal(check(v, /Streng/).ok, false);
});

test('pool bevorzugt Trails mit weniger zusätzlichen Entscheidungsstellen', () => {
  const G = grid();
  const p = Planner.pool(G, 'MT-I', Planner.rng(3), { want: 30, maxTries: 4000, mode: 'pruefung' });
  assert.ok(p.list.length > 0);
  const cost = c => c.v.extraDecisions + Math.max(0, c.v.turns - 1);
  for (let i = 1; i < p.list.length; i++) assert.ok(cost(p.list[i - 1]) <= cost(p.list[i]), `Reihenfolge bei ${i}`);
  for (const c of p.list) assert.ok(c.v.ok && c.v.turns >= 1);
});

test('Auch Zufahrten zählen als mögliche Abzweigung, sind aber keine Kreuzung', () => {
  const g = (lat, lon) => ({ lat: 49.65 + lat / 110574, lon: 9.95 + lon / 72000 });
  const osm = { elements: [
    { type: 'way', id: 1, nodes: [1, 2, 3], geometry: [g(0, 0), g(0, 100), g(0, 200)], tags: { highway: 'residential', name: 'Hauptweg' } },
    { type: 'way', id: 2, nodes: [2, 4], geometry: [g(0, 100), g(40, 100)], tags: { highway: 'service', service: 'driveway' } },
    { type: 'way', id: 5, nodes: [2, 6], geometry: [g(0, 100), g(-40, 100)], tags: { highway: 'service', service: 'driveway' } },
    { type: 'way', id: 3, nodes: [3, 5], geometry: [g(0, 200), g(0, 260)], tags: { highway: 'footway', footway: 'sidewalk' } },
  ] };
  const G = Planner.buildGraph(osm, CENTER, 1200);
  assert.equal(G.deg(2), 4);       // zwei Zufahrten: mögliche Abzweigungen
  assert.equal(G.walkDeg(2), 2);   // aber keine begehbare Straßenkreuzung
  assert.equal(G.deg(3), 1);       // Gehweg neben der Straße ist kein Abzweig
});

test('PO: „Kreuzungen“ und „befahrener Straßenbereich“ beschreiben das erlaubte Gelände, keine Mindestzahl', () => {
  const G = grid();
  const tr = { level: 'MT-II', mode: 'pruefung', legs: [leg(G, [1, 0], [1, 1], 60), leg(G, [1, 1], [1, 2]), leg(G, [1, 2], [2, 2]), leg(G, [2, 2], [3, 2], 0, 88)] };
  const v = Planner.validate(G, tr);
  assert.equal(check(v, /Kreuzungen \(mind/), undefined);
  assert.equal(check(v, /befahrener Straßenbereich/), undefined);
});

// ---------- Straßen, Wege ----------
// Reihe 1 nach Osten über Spalte 3 (Kreisstraße bzw. Bundesstraße)
const crossing = (G, level) => ({ level, mode: 'pruefung', legs: [leg(G, [1, 2], [1, 3], 30), leg(G, [1, 3], [1, 4]), leg(G, [1, 4], [2, 4], 0, 88)] });

test('MT-I darf eine Kreisstraße queren', () => {
  const G = grid();
  assert.equal(check(Planner.validate(G, crossing(G, 'MT-I')), /gequert/).ok, true);
});

test('MT-I und MT-II dürfen keine Bundesstraße queren', () => {
  const G = Planner.buildGraph(gridOSM({ bundesstrasse: true }), CENTER, 1200);
  Planner.setTerrain(G, 'ort', false, true);
  for (const lv of ['MT-I', 'MT-II']) assert.equal(check(Planner.validate(G, crossing(G, lv)), /gequert/).ok, false, lv);
});

test('MT-II darf eine Kreisstraße queren', () => {
  const G = grid();
  assert.equal(check(Planner.validate(G, crossing(G, 'MT-II')), /gequert/).ok, true);
});

test('Fußweg mit Namen ist gesperrt, solange Fußwege nicht erlaubt sind', () => {
  const tr = G => ({ level: 'MT-I', mode: 'pruefung', legs: [leg(G, [5, 1], [5, 2], 30), leg(G, [5, 2], [5, 3], 0, 80)] });
  const off = grid(false), on = grid(true);
  assert.equal(check(Planner.validate(off, tr(off)), /Wegarten/).ok, false);
  assert.equal(check(Planner.validate(on, tr(on)), /Wegarten/).ok, true);
});

test('pool findet seltene MT-II-Trails zuverlässig (systematische Suche)', () => {
  const osm = wideOSM();
  const G = Planner.buildGraph(osm, osm.center, 1200);
  Planner.setTerrain(G, 'ort', false, true);
  const p = Planner.pool(G, 'MT-II', Planner.rng(5), { want: 6, maxTries: 1500, mode: 'pruefung' });
  assert.ok(p.list.length >= 6, `nur ${p.list.length} Trails`);
  for (const c of p.list) assert.ok(c.v.ok && c.v.turns >= 2);
});

// ---------- Fußweg zwischen Trails (Kette) ----------
test('walk: kürzester Fußweg um eine Ecke', () => {
  const G = grid(true), W = Planner.walkGraph(G);
  const r = Planner.walkPath(G, W, [45, 0], [90, 45], [], 250);
  assert.ok(r && Math.abs(r.dist - 90) < 1, r && r.dist);
});

test('walk: gesperrte Kante wird umgangen, maxLen wird eingehalten', () => {
  const G = grid(true), W = Planner.walkGraph(G);
  const free = Planner.walkPath(G, W, [45, 0], [180, 45], [], 400);
  assert.ok(Math.abs(free.dist - 180) < 1, free.dist);
  const block = Planner.blockedEdges(W, [[100, 0], [170, 0]], 5);
  const around = Planner.walkPath(G, W, [45, 0], [180, 45], [block], 400);
  assert.ok(Math.abs(around.dist - 270) < 1, around && around.dist);
  assert.equal(Planner.walkPath(G, W, [45, 0], [180, 45], [block], 250), null);
  assert.equal(Planner.walkPath(G, W, [45, 0], [180, 45], [], 100), null);
});

test('blockedEdges: Ausnahme rund um einen Startpunkt', () => {
  const G = grid(true), W = Planner.walkGraph(G);
  const all = Planner.blockedEdges(W, [[0, 0], [270, 0]], 5);
  const except = Planner.blockedEdges(W, [[0, 0], [270, 0]], 5, [45, 0], 20);
  assert.ok(except.size < all.size);
});

test('chain: Trails in Reihe, Übergänge 75–250 m Fußweg und mind. 75 m Luftlinie, Fußwege meiden spätere Trails', () => {
  const osm = wideOSM();
  const G = Planner.buildGraph(osm, osm.center, 1200);
  Planner.setTerrain(G, 'ort', true, true);
  const W = Planner.walkGraph(G);
  const pools = { 'MT-I': Planner.pool(G, 'MT-I', Planner.rng(4), { want: 40, maxTries: 3000, mode: 'pruefung' }) };
  const teams = [{ level: 'MT-I' }, { level: 'MT-I' }, { level: 'MT-I' }];
  const r = Planner.chain(G, W, teams, pools, Planner.rng(4), 30, { ms: 3000 });
  assert.equal(r.order.length, 3);
  assert.equal(r.gaps, 0);
  assert.equal(r.links[0], null);
  for (let i = 1; i < 3; i++) {
    const l = r.links[i], a = r.order[i - 1].v.pts, b = r.order[i].v.pts;
    assert.ok(l.dist >= 75 && l.dist <= 250, `Fußweg ${l.dist}`);
    assert.ok(Math.hypot(a[a.length - 1][0] - b[0][0], a[a.length - 1][1] - b[0][1]) >= 75, 'Luftlinie');
    // Fußweg hält Abstand zu allen später gelaufenen Trails (außer am Start des nächsten)
    const later = r.order.slice(i + 1);
    for (const c of later) for (const p of l.pts) for (let k = 1; k < c.v.pts.length; k++) {
      const q0 = c.v.pts[k - 1], q1 = c.v.pts[k];
      const dx = q1[0] - q0[0], dy = q1[1] - q0[1], t = Math.max(0, Math.min(1, ((p[0] - q0[0]) * dx + (p[1] - q0[1]) * dy) / (dx * dx + dy * dy || 1)));
      assert.ok(Math.hypot(p[0] - (q0[0] + t * dx), p[1] - (q0[1] + t * dy)) >= 29, 'Fußweg zu nah an späterem Trail');
    }
  }
});

test('chain: ohne möglichen Übergang entstehen Lücken statt längerer Wege', () => {
  const osm = wideOSM();
  const G = Planner.buildGraph(osm, osm.center, 1200);
  Planner.setTerrain(G, 'ort', true, true);
  const W = Planner.walkGraph(G);
  const pools = { 'MT-I': Planner.pool(G, 'MT-I', Planner.rng(4), { want: 40, maxTries: 3000, mode: 'pruefung' }) };
  const r = Planner.chain(G, W, [{ level: 'MT-I' }, { level: 'MT-I' }, { level: 'MT-I' }], pools, Planner.rng(4), 30, { ms: 1500, maxLen: 10 });
  assert.equal(r.order.length, 3);
  assert.equal(r.gaps, 2);
  assert.deepEqual(r.links, [null, null, null]);
});

test('chain: Reihenfolge MT-I vor MT-II, Teams in Kettenreihenfolge', () => {
  const osm = wideOSM();
  const G = Planner.buildGraph(osm, osm.center, 1200);
  Planner.setTerrain(G, 'ort', true, true);
  const W = Planner.walkGraph(G);
  const R = Planner.rng(9);
  const pools = { 'MT-I': Planner.pool(G, 'MT-I', R, { want: 30, maxTries: 3000, mode: 'pruefung' }), 'MT-II': Planner.pool(G, 'MT-II', R, { want: 30, maxTries: 3000, mode: 'pruefung' }) };
  const teams = [{ level: 'MT-II', name: 'x' }, { level: 'MT-I', name: 'y' }];
  const r = Planner.chain(G, W, teams, pools, R, 30, { ms: 2000 });
  assert.deepEqual(r.order.map(c => c.tr.level), ['MT-I', 'MT-II']);
  assert.deepEqual(r.teams.map(t => t.name), ['y', 'x']);
  assert.deepEqual(r.index, [1, 0]);
});

// ---------- Ersetzen in der Kette ----------
const air = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const last = pts => pts[pts.length - 1];
function chained() {
  const osm = wideOSM();
  const G = Planner.buildGraph(osm, osm.center, 1200);
  Planner.setTerrain(G, 'ort', true, true);
  const W = Planner.walkGraph(G);
  const pools = { 'MT-I': Planner.pool(G, 'MT-I', Planner.rng(4), { want: 40, maxTries: 3000, mode: 'pruefung' }) };
  const r = Planner.chain(G, W, [{ level: 'MT-I' }, { level: 'MT-I' }, { level: 'MT-I' }], pools, Planner.rng(4), 30, { ms: 3000 });
  assert.equal(r.gaps, 0);
  const isOld = old => c => Math.abs(c.v.length - old.v.length) < 5 && air(c.v.pts[0], old.v.pts[0]) < 5;
  return { G, W, r, base: pools['MT-I'].list, isOld };
}

test('reverseTrail: gleicher Weg in Gegenrichtung, weiterhin PO-konform', () => {
  const { G, r } = chained();
  const c = r.order[0], rev = Planner.reverseTrail(G, c.tr);
  const v = Planner.validate(G, { ...rev, mode: 'pruefung' });
  assert.ok(v.ok);
  assert.ok(Math.abs(v.length - c.v.length) < 1);
  assert.ok(air(v.pts[0], last(c.v.pts)) < 1 && air(last(v.pts), c.v.pts[0]) < 1);
});

test('pool rückwärts: Trails enden auf den vorgegebenen Wegen', () => {
  const { G, r } = chained();
  const p = r.order[1].v.pts[0];
  const starts = G._starts['MT-I'].filter(sg => sg.pts.some(q => air(q, p) <= 250));
  const res = Planner.pool(G, 'MT-I', Planner.rng(3), { want: 10, maxTries: 800, mode: 'pruefung', starts, reverse: true, searchSteps: 20000 });
  assert.ok(res.list.length > 0);
  const ids = new Set(starts.map(s => s.id));
  for (const c of res.list) assert.ok(c.v.ok && ids.has(c.tr.legs[c.tr.legs.length - 1].seg));
});

test('replacement am Kettenanfang: Ersatz endet in Fußweite vor dem nächsten Start', () => {
  const { G, W, r, base, isOld } = chained();
  // Trail 2 als Anfang eines Abschnitts (im kleinen Raster bleibt für Trail 1 kein anderer Platz)
  const [a, b, c] = r.order;
  const res = Planner.replacement(G, W, 'MT-I', Planner.rng(1), {
    base: [], minDist: 30, prevEnd: null, nextStart: c.v.pts[0], later: [c.v.pts], earlier: [], obstacles: [a, c], isOld: isOld(b),
  });
  assert.ok(res && res.full, 'kein lückenloser Ersatz');
  assert.ok(res.cand.id.startsWith('rück:'), 'Ersatz stammt aus der Rückwärtssuche');
  assert.ok(!isOld(b)(res.cand));
  assert.equal(res.lin, null);
  assert.ok(res.lout.dist >= 75 && res.lout.dist <= 250, `Fußweg ${res.lout.dist}`);
  assert.ok(air(last(res.cand.v.pts), c.v.pts[0]) >= 75);
});

test('replacement in der Mitte: Übergänge zum vorigen Ziel und zum nächsten Start', () => {
  const { G, W, r, base, isOld } = chained();
  const [a, b, c] = r.order;
  const res = Planner.replacement(G, W, 'MT-I', Planner.rng(7), {
    base, minDist: 30, prevEnd: last(a.v.pts), nextStart: c.v.pts[0], later: [c.v.pts], earlier: [], obstacles: [a, c], isOld: isOld(b),
  });
  assert.ok(res && res.full, 'kein lückenloser Ersatz');
  assert.ok(!isOld(b)(res.cand));
  for (const w of [res.lin, res.lout]) assert.ok(w.dist >= 75 && w.dist <= 250, `Fußweg ${w.dist}`);
  assert.ok(air(last(a.v.pts), res.cand.v.pts[0]) >= 75 && air(last(res.cand.v.pts), c.v.pts[0]) >= 75);
});

test('replacement ohne passenden Übergang: Ersatz mit Lücke statt gar keinem', () => {
  const { G, W, r, base, isOld } = chained();
  const [a, b, c] = r.order;
  const res = Planner.replacement(G, W, 'MT-I', Planner.rng(7), {
    base, minDist: 30, maxLen: 10, prevEnd: last(a.v.pts), nextStart: c.v.pts[0], later: [c.v.pts], earlier: [], obstacles: [a, c], isOld: isOld(b),
  });
  assert.ok(res && res.cand && !res.full);
  assert.equal(res.lin, null);
  assert.equal(res.lout, null);
});

test('replacement: bestehende Lücken müssen sich nicht schließen, dürfen aber', () => {
  const { G, W, r, base, isOld } = chained();
  const [a, b, c] = r.order;
  const o = { base, minDist: 30, prevEnd: last(a.v.pts), nextStart: c.v.pts[0], prevKeep: false, nextKeep: false, later: [c.v.pts], earlier: [], obstacles: [a, c], isOld: isOld(b) };
  const none = Planner.replacement(G, W, 'MT-I', Planner.rng(7), { ...o, maxLen: 10 });
  assert.ok(none.full, 'ohne neue Lücke gilt der Ersatz als passend');
  const closed = Planner.replacement(G, W, 'MT-I', Planner.rng(7), o);
  assert.ok(closed.full && closed.lin && closed.lout, 'Lücken schließen sich, wenn es geht');
});

test('similar: verschobener Start gilt als derselbe Trail, anderer Verlauf nicht', () => {
  const a = [[0, 0], [200, 0], [200, 100]];
  assert.ok(Planner.similar([[12, 0], [200, 0], [200, 112]], a));
  assert.ok(!Planner.similar([[0, 0], [0, 200], [100, 200]], a));
});

test('replacement: bereits gezeigte Trails kommen zuletzt', () => {
  const { G, W, r, base, isOld } = chained();
  const [a, b, c] = r.order;
  const o = { base, minDist: 30, prevEnd: null, nextStart: null, later: [], earlier: [], obstacles: [b, c], isOld: isOld(a) };
  const first = Planner.replacement(G, W, 'MT-I', Planner.rng(7), o).cand;
  const second = Planner.replacement(G, W, 'MT-I', Planner.rng(7), { ...o, seen: x => isOld(first)(x) }).cand;
  assert.ok(!isOld(first)(second));
});

test('Kreisverkehr: in der Prüfung ausgeschlossen, im Training erlaubt', () => {
  const G = Planner.buildGraph(gridOSM({ kreisel: true }), CENTER, 1200);
  Planner.setTerrain(G, 'ort', false, true);
  // Reihe 1 nach Osten, an Spalte 2 links ab auf den „Kreisverkehr“
  const tr = mode => ({ level: 'MT-I', mode, legs: [leg(G, [1, 0], [1, 1], 30), leg(G, [1, 1], [1, 2]), leg(G, [1, 2], [2, 2], 0, 80)] });
  assert.equal(check(Planner.validate(G, tr('pruefung')), /Kreisverkehr/).ok, false);
  assert.equal(check(Planner.validate(G, tr('training')), /Kreisverkehr/), undefined);
});

test('levelByLength ordnet die Länge einer Stufe zu (±10 %)', () => {
  const e = [[270, 'MT-I'], [330, 'MT-I'], [331, null], [450, null], [540, 'MT-II'], [660, 'MT-II'], [661, null], [900, 'MT-III'], [1100, 'MT-III'], [1101, null]];
  for (const [len, lv] of e) assert.equal(Planner.levelByLength(len), lv, `${len} m`);
});

// ---------- GPX-Zuordnung ----------
const gpxOf = (G, tr) => Planner.trailPts(G, tr).map(p => G.toLatLon(p));

test('trackCandidate ordnet eine Linie dem Wegenetz zu und lässt sie unverändert', () => {
  const G = grid(), W = Planner.walkGraph(G);
  const ll = gpxOf(G, oneTurnTwoExtra(G));
  const c = Planner.trackCandidate(G, W, ll, 'MT-I');
  assert.equal(c.matched, true);
  assert.equal(c.v.turns, 1);
  assert.equal(c.v.extraDecisions, 2);
  assert.ok(c.far < 0.05, 'Linie liegt auf den Wegen');
  assert.equal(c.v.pts.length, ll.length);
  c.v.pts.forEach((p, i) => { const q = G.toLatLon(p); assert.ok(Math.abs(q[0] - ll[i][0]) < 1e-9 && Math.abs(q[1] - ll[i][1]) < 1e-9); });
  assert.ok(Math.abs(c.v.length - 298) < 2, `Länge ${c.v.length}`);
});

test('trackCandidate nimmt für die Längenprüfung die Länge der Linie, nicht die der Beine', () => {
  const G = grid(), W = Planner.walkGraph(G);
  const ll = gpxOf(G, oneTurnTwoExtra(G));
  const c = Planner.trackCandidate(G, W, ll, 'MT-I');
  assert.equal(c.v.checks.find(x => /^Länge/.test(x.label)).ok, true);
  // gleiche Strecke, aber als MT-II geprüft: die Länge (298 m) passt nicht zu 600 m
  const c2 = Planner.trackCandidate(G, W, ll, 'MT-II');
  assert.equal(c2.v.checks.find(x => /^Länge/.test(x.label)).ok, false);
});

test('trackCandidate markiert eine Linie neben den Wegen als unsicher', () => {
  const G = grid(), W = Planner.walkGraph(G);
  const ll = gpxOf(G, oneTurnTwoExtra(G)).map(([a, b]) => [a, b + 18 / (111320 * Math.cos(a * Math.PI / 180))]);   // ca. 18 m nach Osten versetzt
  const c = Planner.trackCandidate(G, W, ll, 'MT-I');
  assert.ok(c.far > 0.3 && c.far < 0.7, `far ${c.far}`);   // nur die Nord-Süd-Stücke sind versetzt, die Ost-West-Stücke liegen noch auf ihrem Weg
});

test('trackCandidate stürzt bei einer Linie weit abseits nicht ab', () => {
  const G = grid(), W = Planner.walkGraph(G);
  const ll = [[CENTER.lat + 0.02, CENTER.lon], [CENTER.lat + 0.0227, CENTER.lon]];
  const c = Planner.trackCandidate(G, W, ll, 'MT-I');
  assert.ok(c.far > 0.9 || !c.matched);
  assert.ok(c.v.length > 250);
});

test('describe rechnet die Meterangaben auf die Länge der Linie um', () => {
  const G = grid(), W = Planner.walkGraph(G);
  const ll = gpxOf(G, oneTurnTwoExtra(G));
  const longer = ll.concat([[ll[ll.length - 1][0] + 0.0005, ll[ll.length - 1][1]]]);   // Linie ca. 55 m länger als die Beine
  const c = Planner.trackCandidate(G, W, longer, 'MT-I');
  const steps = Planner.describe(G, c.tr);
  assert.ok(Math.abs(steps[steps.length - 1].at - Math.round(c.v.length)) <= 1);
});

// ---------- Kette „fest“ ----------
function fixedSet() {
  const G = grid(), W = Planner.walkGraph(G);
  const mk = (id, level, legs) => { const tr = { level, mode: 'pruefung', legs }; return Planner.trackCandidate(G, W, gpxOf(G, tr), level, { id }); };
  const a = mk('a', 'MT-I', oneTurnTwoExtra(G).legs);
  const b = mk('b', 'MT-I', [leg(G, [4, 0], [4, 1], 60), leg(G, [4, 1], [4, 2]), leg(G, [4, 2], [4, 3]), leg(G, [4, 3], [4, 4], 0, 30)]);
  const m = mk('m', 'MT-II', [0, 1, 2, 3, 4].map(j => leg(G, [1, j], [1, j + 1])).concat([leg(G, [1, 5], [2, 5]), leg(G, [2, 5], [3, 5])]));
  return { G, W, a, b, m };
}
const teamsOf = (...lv) => lv.map((level, i) => ({ name: 'T' + i, level }));

test('Kette fest: MT-I vor MT-II, alle Trails, keine neuen Kandidaten', () => {
  const { G, W, a, b, m } = fixedSet();
  const R = Planner.rng(1);
  const ch = Planner.chain(G, W, teamsOf('MT-II', 'MT-I', 'MT-I'), { 'MT-I': { list: [a, b] }, 'MT-II': { list: [m] } }, R, 30, { fixed: true });
  const ids = ch.order.map(c => c.id);
  assert.equal(ids.length, 3);
  assert.deepEqual(ids.slice().sort(), ['a', 'b', 'm']);
  assert.equal(ids[2], 'm');
  assert.deepEqual(ch.index.map(i => ['MT-II', 'MT-I', 'MT-I'][i]), ['MT-I', 'MT-I', 'MT-II']);
});

test('Kette fest: Trails, die sich zu nahe kommen, bleiben beide in der Kette', () => {
  const { G, W, a } = fixedSet();
  const twin = { ...a, id: 'a2' };   // gleiche Strecke, überlappt vollständig
  const ch = Planner.chain(G, W, teamsOf('MT-I', 'MT-I'), { 'MT-I': { list: [a, twin] } }, Planner.rng(1), 30, { fixed: true });
  assert.deepEqual(ch.order.map(c => c.id).sort(), ['a', 'a2']);
});

test('Kette fest: auch ein Übergang über 250 m bekommt einen Fußweg (keine harte Grenze mehr)', () => {
  const { G, W, a } = fixedSet();
  // weit entfernter Trail: Start weit über 250 m vom Ziel von a
  const farLL = gpxOf(G, { level: 'MT-I', mode: 'pruefung', legs: [leg(G, [4, 5], [3, 5], 30), leg(G, [3, 5], [2, 5]), leg(G, [2, 5], [1, 5], 0, 40)] });
  const f = Planner.trackCandidate(G, W, farLL, 'MT-I', { id: 'far' });
  const ch = Planner.chain(G, W, teamsOf('MT-I', 'MT-I'), { 'MT-I': { list: [a, f] } }, Planner.rng(1), 30, { fixed: true });
  assert.equal(ch.order.length, 2);
  const w = ch.links[1];
  assert.ok(w && w.dist > 250, `Fußweg ${w && w.dist}`);
  assert.equal(ch.gaps, 0);
});

test('trackCandidate: Linie fast nur abseits der Wege gilt als nicht zuordenbar', () => {
  const G = grid(), W = Planner.walkGraph(G);
  const ll = gpxOf(G, oneTurnTwoExtra(G)).map(([a, b]) => [a + 30 / 110574, b + 30 / (111320 * Math.cos(a * Math.PI / 180))]);   // 30 m diagonal versetzt
  const c = Planner.trackCandidate(G, W, ll, 'MT-I');
  assert.equal(c.matched, false);
  assert.ok(c.far > 0.6);
  assert.equal(c.v.checks.length, 0);
});

test('matchTrack behält ein kurzes letztes Stück', () => {
  const G = grid(), W = Planner.walkGraph(G);
  const tr = { level: 'MT-I', mode: 'pruefung', legs: [leg(G, [1, 0], [1, 1], 30), leg(G, [1, 1], [1, 2]), leg(G, [1, 2], [2, 2], 0, 5)] };
  const m = Planner.matchTrack(G, W, Planner.trailPts(G, tr));
  assert.equal(m.legs.length, 3);
});

test('orderFixed wählt die Reihenfolge mit den kürzesten Übergängen, nicht die Eingabereihenfolge', () => {
  const G = grid(), W = Planner.walkGraph(G);
  const c = (id, level, x0) => ({ id, tr: { level }, v: { pts: [[x0, 45], [x0 + 100, 45]] } });   // gerade Linien, 100 m auseinander
  const r = Planner.orderFixed(G, W, [c('C', 'MT-I', 400), c('A', 'MT-I', 0), c('B', 'MT-I', 200)], 30);
  assert.deepEqual(r.order.map(x => x.id), ['A', 'B', 'C']);
  assert.equal(r.links.length, 3);
  assert.equal(r.links[0], null);
});

test('orderFixed hält MT-I vor MT-II, auch wenn MT-II räumlich vorne liegt', () => {
  const G = grid(), W = Planner.walkGraph(G);
  const c = (id, level, x0) => ({ id, tr: { level }, v: { pts: [[x0, 45], [x0 + 100, 45]] } });
  const r = Planner.orderFixed(G, W, [c('D', 'MT-II', -200), c('C', 'MT-I', 400), c('A', 'MT-I', 0), c('B', 'MT-I', 200)], 30);
  assert.equal(r.order[3].id, 'D');
  assert.deepEqual(r.order.slice(0, 3).map(x => x.tr.level), ['MT-I', 'MT-I', 'MT-I']);
});

test('orderFixed löst auch mehr als 12 Trails ohne Dubletten', () => {
  const G = grid(), W = Planner.walkGraph(G);
  const list = [...Array(14).keys()].map(k => ({ id: 'x' + k, tr: { level: 'MT-I' }, v: { pts: [[((k * 5) % 14) * 40, 45], [((k * 5) % 14) * 40 + 20, 45]] } }));
  const r = Planner.orderFixed(G, W, list, 30);
  assert.equal(new Set(r.order.map(x => x.id)).size, 14);
  // Näherung: Summe der Sprünge (Ziel → nächster Start) nicht größer als in der Eingabereihenfolge
  const jumps = q => q.reduce((s, c, i) => (i ? s + Math.hypot(c.v.pts[0][0] - q[i - 1].v.pts[1][0], c.v.pts[0][1] - q[i - 1].v.pts[1][1]) : 0), 0);
  assert.ok(jumps(r.order) <= jumps(list), `Sprünge ${Math.round(jumps(r.order))} gegenüber ${Math.round(jumps(list))}`);
});

test('orderFixed hält auch bei mehr als 12 Trails und drei Stufen die Stufenfolge ein', () => {
  const G = grid(), W = Planner.walkGraph(G), R = Planner.rng(7), lv = ['MT-I', 'MT-II', 'MT-III'];
  for (let run = 0; run < 20; run++) {
    const n = 13 + (run % 6);
    const list = [...Array(n).keys()].map(k => { const x = Math.floor(R() * 450), y = Math.floor(R() * 450); return { id: 'r' + k, tr: { level: lv[Math.floor(R() * 3)] }, v: { pts: [[x, y], [x + 30, y]] } }; });
    const r = Planner.orderFixed(G, W, list, 30);
    const ranks = r.order.map(c => lv.indexOf(c.tr.level));
    assert.equal(new Set(r.order.map(c => c.id)).size, n);
    assert.ok(ranks.every((x, i) => i === 0 || x >= ranks[i - 1]), `Stufenfolge ${r.order.map(c => c.tr.level)}`);
  }
});

// ---------- Übergangsweg zwischen importierten Trails (transitPath) ----------
function transitSet() {
  const G = grid(), W = Planner.walkGraph(G);
  const cand = (id, legs) => Planner.trackCandidate(G, W, gpxOf(G, { level: 'MT-I', mode: 'pruefung', legs }), 'MT-I', { id });
  // N beginnt auf Reihe 1 bei x = 300 (Startstück bis Knoten (1,4)), läuft dann Spalte 4 hinauf
  const N = cand('N', [leg(G, [1, 3], [1, 4], 30), leg(G, [1, 4], [2, 4])]);
  return { G, W, cand, N };
}
const hasPt = (pts, x, y) => pts.some(p => Math.hypot(p[0] - x, p[1] - y) < 1);

test('transitPath: ein späterer Trail wird nicht gekreuzt, der Weg geht außen herum', () => {
  const { G, W, cand, N } = transitSet();
  const L = cand('L', [leg(G, [0, 2], [1, 2]), leg(G, [1, 2], [2, 2]), leg(G, [2, 2], [3, 2])]);   // Spalte 2, Reihe 0 bis 3
  assert.equal(Math.round(Planner.transitPath(G, W, [30, 90], N, []).dist), 270);
  const r = Planner.transitPath(G, W, [30, 90], N, [L]);
  assert.equal(Math.round(r.dist), 810);
  assert.ok(!r.pts.some(p => Math.abs(p[0] - 180) < 1 && p[1] <= 271), 'kreuzt Spalte 2 nicht im Bereich des späteren Trails');
});

test('transitPath: der weitere Verlauf des nächsten Trails ist tabu, der Start wird von hinten erreicht', () => {
  const { G, W, N } = transitSet();
  const r = Planner.transitPath(G, W, [360, 300], N, []);
  assert.equal(Math.round(r.dist), 330);
  assert.ok(!hasPt(r.pts, 360, 180) && !hasPt(r.pts, 360, 90), 'nicht über Spalte 4 und nicht über den Knoten am Ende des Startstücks');
});

test('transitPath: das Startstück des nächsten Trails darf bis zum Start benutzt werden', () => {
  const { G, W, N } = transitSet();
  assert.equal(Math.round(Planner.transitPath(G, W, [345, 90], N, []).dist), 45);   // vorne auf dem Startstück, zurück zum Start
  const side = Planner.transitPath(G, W, [400, 90], N, []);                         // Seitenweg am Ende des Startstücks, den N nicht benutzt
  assert.equal(Math.round(side.dist), 100);
  assert.ok(hasPt(side.pts, 360, 90));
});

test('transitPath: belegt ein späterer Trail das Startstück auf beiden Seiten, gibt es keinen Weg und den Grund', () => {
  const { G, W, cand, N } = transitSet();
  const L2 = cand('L2', [leg(G, [1, 2], [1, 3]), leg(G, [1, 3], [1, 4]), leg(G, [1, 4], [0, 4])]);
  const r = Planner.transitPath(G, W, [30, 90], N, [L2]);
  assert.equal(r.dist, null);
  assert.equal(r.why, 'start');
  assert.deepEqual(r.by.map(c => c.id), ['L2']);
});

test('transitPath: eine Kreuzung, an der ein späterer Trail abbiegt, bleibt gesperrt, auch wenn die GPX-Linie die Ecke abschneidet', () => {
  const { G, W, cand } = transitSet();
  // späterer Trail: Reihe 2 von Westen bis Spalte 2, dann Spalte 2 hinauf; GPX schneidet die Ecke um etwa 7 m
  const ll = [[0, 180], [170, 180], [180, 190], [180, 360]].map(p => G.toLatLon(p));
  const L = Planner.trackCandidate(G, W, ll, 'MT-I', { id: 'L' });
  const N2 = cand('N2', [leg(G, [2, 2], [2, 3], 50), leg(G, [2, 3], [3, 3])]);   // Start bei x = 230 auf Reihe 2
  const r = Planner.transitPath(G, W, [180, 120], N2, [L]);
  assert.ok(!hasPt(r.pts, 180, 180), 'nicht durch die Kreuzung des späteren Trails');
  assert.equal(Math.round(r.dist), 250);   // 30 m hinauf zu Reihe 1, Spalte 3 hinunter zur ersten Abzweigung von N2, 40 m zurück zum Start
});

test('transitPath: hat der nächste Trail keine Abzweigung, darf der Weg ihn nicht von vorn ablaufen', () => {
  const { G, W, cand } = transitSet();
  const N1 = cand('N1', [leg(G, [1, 3], [1, 4], 10, 80)]);   // nur ein Bein, x = 280 bis 350
  const r = Planner.transitPath(G, W, [400, 90], N1, []);
  assert.ok(!r.pts.some(p => Math.abs(p[1] - 90) < 1 && p[0] > 281 && p[0] < 351), 'nicht über den Trail selbst (x 280 bis 350)');
  assert.equal(Math.round(r.dist), 320);   // außen herum und von hinten an den Start
});
