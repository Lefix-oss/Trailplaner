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

test('Kreisverkehr: in der Prüfung ausgeschlossen, im Training erlaubt', () => {
  const G = Planner.buildGraph(gridOSM({ kreisel: true }), CENTER, 1200);
  Planner.setTerrain(G, 'ort', false, true);
  // Reihe 1 nach Osten, an Spalte 2 links ab auf den „Kreisverkehr“
  const tr = mode => ({ level: 'MT-I', mode, legs: [leg(G, [1, 0], [1, 1], 30), leg(G, [1, 1], [1, 2]), leg(G, [1, 2], [2, 2], 0, 80)] });
  assert.equal(check(Planner.validate(G, tr('pruefung')), /Kreisverkehr/).ok, false);
  assert.equal(check(Planner.validate(G, tr('training')), /Kreisverkehr/), undefined);
});
