// Sternplanung im Training (V3.5): alle Trails starten nahe einem gemeinsamen Punkt und laufen in verschiedene Richtungen
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Planner } from './load.mjs';

const osm = JSON.parse(readFileSync(new URL('../data/osm/giebelstadt-essfeld.json', import.meta.url), 'utf8'));
const CENTER = { lat: 49.6536, lon: 9.9445 };
const graph = (data = osm) => Planner.buildGraph(data, CENTER, 1200);
const ARGS = {
  terrain: 'ort', allowPaths: true, avoidLoops: true, strict: false, pid: 'A', label: '', seed: 99, mode: 'training', minDist: 30, star: true,
  teams: [{ name: 'Trail 1', level: 'MT-I' }, { name: 'Trail 2', level: 'MT-I' }, { name: 'Trail 3', level: 'MT-I' }], obstacles: [], levels: ['MT-I'],
};
const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const segDist = (p, a, b) => { const l = d(a, b) ** 2; const t = l ? Math.max(0, Math.min(1, ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / l)) : 0; return d(p, [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]); };
const lineDist = (p, pts) => Math.min(...pts.slice(1).map((q, i) => segDist(p, pts[i], q)));
// Punkte eines Trails alle 5 m
function dense(pts) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) { const n = Math.ceil(d(pts[i - 1], pts[i]) / 5); for (let k = 1; k <= n; k++) out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k / n, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k / n]); }
  return out;
}
// Regeln des Sterns unabhängig vom Planer nachprüfen
function checkStar(plan, p, minDist, r = 50) {
  for (const c of plan) {
    assert.ok(d(c.v.pts[0], p) <= r, `Start ${Math.round(d(c.v.pts[0], p))} m vom Startpunkt`);
    const q = dense(c.v.pts), k = q.findIndex(x => d(x, p) > r);
    assert.ok(k > 0, 'verlässt den Nahbereich');
    assert.ok(q.slice(k).every(x => d(x, p) > r - 2), 'kehrt nicht in den Nahbereich zurück');
  }
  for (let i = 0; i < plan.length; i++) for (let j = i + 1; j < plan.length; j++) {
    // ab Startkreis + Mindestabstand darf kein Punkt eines Trails näher als minDist an einem anderen liegen (am Kreisrand bleibt ein schmaler Übergang)
    const a = dense(plan[i].v.pts).filter(x => d(x, p) > r + minDist), b = plan[j].v.pts;
    assert.ok(a.every(x => lineDist(x, b) >= minDist - 2), `Trail ${i + 1} und ${j + 1} halten außerhalb des Nahbereichs Abstand`);
  }
}

test('buildGraph erkennt Parkplätze an ihren Fahrgassen', () => {
  const G = graph();
  assert.ok(G.parkings.length > 0);
  assert.ok(G.parkings.every(q => Math.hypot(q[0], q[1]) <= 1200));
});

test('Stern: Start am Parkplatz, alle Starts in 50 m, Abstand außerhalb, kein Zurücklaufen, Ergebnis übertragbar', () => {
  const r = structuredClone(Planner.planPlace(graph(), ARGS));
  assert.ok(r.star.found && r.star.parking);
  const plan = r.plans.plans[0];
  assert.equal(plan.length, 3);
  checkStar(plan, r.star.p, 30);
  assert.ok(plan.every(c => c.place === 'A' && c.star.parking === true));
  assert.ok(plan.every(c => r.pools['MT-I'].list.includes(c)), 'Plan verweist auf den Vorrat');
});

test('Stern: Trails laufen in verschiedene Richtungen', () => {
  const r = Planner.planPlace(graph(), { ...ARGS, teams: [...ARGS.teams, { name: 'Trail 4', level: 'MT-I' }] });
  const plan = r.plans.plans[0], p = r.star.p;
  const ang = c => Math.atan2(c.v.pts.at(-1)[1] - p[1], c.v.pts.at(-1)[0] - p[0]);
  const gap = (x, y) => { const g = Math.abs(x - y) % (2 * Math.PI); return g > Math.PI ? 2 * Math.PI - g : g; };
  let min = Math.PI;
  for (let i = 0; i < plan.length; i++) for (let j = i + 1; j < plan.length; j++) min = Math.min(min, gap(ang(plan[i]), ang(plan[j])));
  assert.ok(min > 0.3, `kleinster Winkel zwischen zwei Zielen ${Math.round(min * 57)}°`);
});

test('Stern: ohne Parkplatz im Gebiet startet er an einer Kreuzung', () => {
  const noPark = { elements: osm.elements.filter(e => !(e.tags && (e.tags.service === 'parking_aisle' || e.tags.amenity === 'parking'))) };
  const G = graph(noPark);
  assert.equal(G.parkings.length, 0);
  const r = Planner.planPlace(G, ARGS);
  assert.ok(r.star.found);
  assert.equal(r.star.parking, false);
  checkStar(r.plans.plans[0], r.star.p, 30);
});

test('Stern: Alternativen halten die Sternregeln ein; ohne Häkchen bleibt das Training wie bisher', () => {
  const r = Planner.planPlace(graph(), ARGS);
  const plan = r.plans.plans[0];
  const alts = Planner.alternatives(plan, 0, r.pools, ARGS.teams, 30);
  assert.ok(alts.length > 0);
  for (const a of alts.slice(0, 5)) checkStar([a, plan[1], plan[2]], r.star.p, 30);
  const t = Planner.planPlace(graph(), { ...ARGS, star: false });
  assert.equal(t.star, undefined);
  assert.equal(t.plans.plans[0].length, 3);
});

test('Stern: zu viele Trails für das Gebiet ergeben eine leere Planung statt eines Fehlers', () => {
  const r = Planner.planPlace(graph(), { ...ARGS, ms: 1500, teams: Array.from({ length: 12 }, (_, i) => ({ name: 'T' + i, level: 'MT-I' })) });
  assert.equal(r.plans.plans.length, 0);
  assert.equal(r.star.found, false);
  assert.equal(r.star.r, 50);
});

// Fünf Trails passen um einen Giebelstädter Parkplatz nicht getrennt in 50 m, mit dem vorgeschlagenen 100-m-Startkreis schon
test('Stern: größerer Startkreis (Vorschlag) – Starts im Kreis, außerhalb keine Überschneidung', () => {
  const teams = Array.from({ length: 5 }, (_, i) => ({ name: 'T' + i, level: 'MT-I' }));
  const r = structuredClone(Planner.planPlace(graph(), { ...ARGS, seed: 2, teams, starR: 100 }));
  assert.ok(r.star.found);
  assert.equal(r.star.r, 100);
  const plan = r.plans.plans[0];
  assert.equal(plan.length, 5);
  assert.ok(plan.every(c => c.star.r === 100));
  checkStar(plan, r.star.p, 30, 100);
  assert.equal(Planner.planPlace(graph(), { ...ARGS, starR: 9999 }).star.r, 150, 'höchstens 150 m');
});
