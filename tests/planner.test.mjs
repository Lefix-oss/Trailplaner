import test from 'node:test';
import assert from 'node:assert/strict';
import { Planner } from './load.mjs';
import { CENTER, gridOSM, wideOSM, leg } from './fixtures.mjs';

test('Planner exportiert endpointNames', () => {
  assert.equal(typeof Planner.endpointNames, 'function');
});

function grid(allowPaths = false) {
  const G = Planner.buildGraph(gridOSM(), CENTER, 1200);
  Planner.setTerrain(G, 'ort', allowPaths, true);
  return G;
}
const check = (v, re) => v.checks.find(c => re.test(c.label));

test('MT-I mit mehr Entscheidungsstellen als die PO erlaubt ist nicht PO-konform', () => {
  const G = grid();
  // 30 m + 90 m geradeaus, links ab, 90 m + 88 m geradeaus: 3 Entscheidungsstellen, 1 Richtungswechsel
  const tr = { level: 'MT-I', mode: 'pruefung', legs: [leg(G, [1, 0], [1, 1], 60), leg(G, [1, 1], [1, 2]), leg(G, [1, 2], [2, 2]), leg(G, [2, 2], [3, 2], 0, 88)] };
  const v = Planner.validate(G, tr);
  assert.equal(v.decisions, 3);
  assert.equal(v.ok, false);
  assert.equal(check(v, /höchstens 2 Entscheidungsstellen/).ok, false);
});

test('MT-I darf keine Straße mit Verkehr queren (auch keine Kreisstraße)', () => {
  const G = grid();
  // Reihe 1 nach Osten über die Kreisstraße (Spalte 3)
  const tr = { level: 'MT-I', mode: 'pruefung', legs: [leg(G, [1, 2], [1, 3], 30), leg(G, [1, 3], [1, 4]), leg(G, [1, 4], [2, 4], 0, 88)] };
  const v = Planner.validate(G, tr);
  assert.equal(check(v, /gequert/).ok, false);
});

test('MT-II darf eine Kreisstraße queren', () => {
  const G = grid();
  const tr = { level: 'MT-II', mode: 'pruefung', legs: [leg(G, [1, 2], [1, 3], 30), leg(G, [1, 3], [1, 4]), leg(G, [1, 4], [2, 4], 0, 88)] };
  assert.equal(check(Planner.validate(G, tr), /gequert/).ok, true);
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
  const p = Planner.pool(G, 'MT-II', Planner.rng(5), { want: 12, maxTries: 1500, mode: 'pruefung' });
  assert.ok(p.list.length >= 12, `nur ${p.list.length} Trails`);
  for (const c of p.list) assert.ok(c.v.ok && c.v.decisions <= 3);
});

test('pool liefert für MT-I nur Trails innerhalb der PO-Grenzen', () => {
  const G = grid();
  const p = Planner.pool(G, 'MT-I', Planner.rng(3), { want: 30, maxTries: 4000, mode: 'pruefung' });
  for (const c of p.list) {
    assert.ok(c.v.decisions <= 2, `${c.v.decisions} Entscheidungsstellen`);
    assert.ok(c.v.turns <= 2);
  }
});
