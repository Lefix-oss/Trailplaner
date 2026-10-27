// Trailsuche im Web Worker (V3.2): Planner.planPlace und die Nachrichtenschleife Planner.workerMain
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Planner, Pruefung } from './load.mjs';

const osm = JSON.parse(readFileSync(new URL('../data/osm/giebelstadt-essfeld.json', import.meta.url), 'utf8'));
const CENTER = { lat: 49.6536, lon: 9.9445 };
const graph = () => Planner.buildGraph(osm, CENTER, 1200);
const ARGS = {
  terrain: 'mix', allowPaths: true, avoidLoops: true, strict: false, pid: 'A', label: '', seed: 4711, mode: 'pruefung', minDist: 30,
  teams: [{ name: 'Team 1', level: 'MT-I' }, { name: 'Team 2', level: 'MT-I' }, { name: 'Team 3', level: 'MT-I' }], obstacles: [], levels: ['MT-I'],
};

// Fake-Worker: Nachrichten laufen wie bei postMessage durch structuredClone
function fakeWorker() {
  const sent = [];
  const scope = { postMessage: m => sent.push(structuredClone(m)) };
  Planner.workerMain(scope);
  return { sent, send: m => scope.onmessage({ data: structuredClone(m) }) };
}

test('planPlace: Kette aus einem zweiten, gleich gebauten Wegenetz besteht die PO-Prüfung auf dem Netz der Seite', () => {
  const r = structuredClone(Planner.planPlace(graph(), ARGS));   // wirft, falls etwas nicht per postMessage übertragbar ist
  assert.equal(r.chain.order.length, 3);
  const G = graph();
  Planner.setTerrain(G, 'mix', true, true, false);
  for (const c of [...r.chain.order, ...r.pools['MT-I'].list]) {
    const v = Planner.validate(G, c.tr);
    assert.ok(v.ok, 'Trail besteht die Prüfung');
    assert.deepEqual(v.pts, c.v.pts);
  }
  assert.ok(r.pools['MT-I'].list.every(c => c.id.startsWith('A:MT-I#') && c.place === 'A'));
});

// Die Kette selbst hat ein Zeitlimit und ist deshalb nicht streng wiederholbar; der Vorrat schon
test('planPlace: gleicher Startwert ergibt im Worker und auf der Seite denselben Vorrat', () => {
  const a = Planner.planPlace(graph(), ARGS), b = Planner.planPlace(graph(), ARGS);
  assert.deepEqual(a.pools['MT-I'].list.map(c => c.v.pts), b.pools['MT-I'].list.map(c => c.v.pts));
});

test('planPlace: Training liefert Tagesplan, poolsOnly nur den Vorrat ohne Ortskennung, Hindernisse filtern', () => {
  const t = structuredClone(Planner.planPlace(graph(), { ...ARGS, mode: 'training', levels: ['MT-I', 'MT-II'],
    teams: [...ARGS.teams.slice(0, 2), { name: 'Team 3', level: 'MT-II' }] }));
  assert.ok(t.plans.plans[0].every(c => t.pools[c.tr.level].list.includes(c)), 'Plan verweist auf den Vorrat (c.G wird dort gesetzt)');
  assert.equal(t.chain, undefined);
  assert.equal(t.plans.plans[0].length, 3);
  const p = Planner.planPlace(graph(), { ...ARGS, pid: undefined, poolsOnly: true });
  assert.deepEqual(Object.keys(p), ['pools']);
  const first = p.pools['MT-I'].list[0];
  assert.ok(!first.id.startsWith('A:') && first.place === undefined);
  const G = graph();
  const obst = Pruefung.obstacle({ ll: first.v.pts.map(G.toLatLon) }, G.fromLatLon);
  const f = Planner.planPlace(G, { ...ARGS, pid: undefined, poolsOnly: true, obstacles: [obst] });
  assert.ok(f.pools['MT-I'].list.length > 0);
  assert.ok(f.pools['MT-I'].list.every(c => Planner.compatible(c, obst, 30)));
});

test('workerMain: fordert fehlendes Wegenetz an, meldet Fortschritt und Ergebnis, behält das Netz', () => {
  const w = fakeWorker();
  w.send({ id: 1, key: 7, args: ARGS });
  assert.deepEqual(w.sent, [{ id: 1, missing: true }]);
  w.send({ id: 2, key: 7, args: ARGS, osm, center: CENTER, radius: 1200 });
  const prog = w.sent.filter(m => m.id === 2 && m.progress).map(m => m.progress);
  assert.deepEqual(prog, ['Würfle MT-I-Trails und prüfe sie gegen die PO …', 'Reihe die Trails zu einer Kette …']);
  const res = w.sent.find(m => m.id === 2 && m.result).result;
  assert.equal(res.chain.order.length, 3);
  assert.deepEqual(res.pools['MT-I'].list.map(c => c.id), Planner.planPlace(graph(), ARGS).pools['MT-I'].list.map(c => c.id));
  w.send({ id: 3, key: 7, args: { ...ARGS, poolsOnly: true } });   // ohne OSM: Netz ist noch da
  assert.ok(w.sent.find(m => m.id === 3 && m.result));
});

test('workerMain: Fehler kommen als Meldung zurück, höchstens vier Netze bleiben', () => {
  const w = fakeWorker();
  w.send({ id: 1, key: 1, args: { ...ARGS, levels: ['MT-X'] }, osm, center: CENTER, radius: 1200 });
  const err = w.sent.find(m => m.id === 1 && m.error);
  assert.ok(err && typeof err.error === 'string');
  const tiny = { elements: [] };
  for (const k of [2, 3, 4, 5]) w.send({ id: 10 + k, key: k, args: { ...ARGS, levels: [], poolsOnly: true }, osm: tiny, center: CENTER, radius: 1200 });
  w.send({ id: 20, key: 1, args: { ...ARGS, levels: [], poolsOnly: true } });
  assert.deepEqual(w.sent.at(-1), { id: 20, missing: true });   // ältestes Netz ist weggefallen
  w.send({ id: 21, key: 5, args: { ...ARGS, levels: [], poolsOnly: true } });
  assert.ok(w.sent.at(-1).result);
});
