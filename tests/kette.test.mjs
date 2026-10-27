// Prüfungskette mit Rechenbudget (V3.7): Grenzen der Übergänge, Abstände, Längenvarianten, Startstück, Worker-Protokoll
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Planner } from './load.mjs';

const osm = JSON.parse(readFileSync(new URL('../data/osm/giebelstadt-essfeld.json', import.meta.url), 'utf8'));
const CENTER = { lat: 49.6536, lon: 9.9445 };
const graph = () => Planner.buildGraph(osm, CENTER, 1200);
const teams = [...Array(3)].map((_, i) => ({ name: 'Team ' + (i + 1), level: 'MT-I' })).concat([{ name: 'Team 4', level: 'MT-II' }, { name: 'Team 5', level: 'MT-II' }]);
const ARGS = { terrain: 'ort', allowPaths: true, avoidLoops: true, strict: false, pid: 'A', label: '', seed: 1, mode: 'pruefung', minDist: 30, teams, obstacles: [], levels: ['MT-I', 'MT-II'], budgetMs: 8000 };
const len = pts => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const air = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

let run = null;
const planned = () => {
  if (!run) { const G = graph(), best = []; const r = Planner.planPlace(G, ARGS, () => {}, b => best.push(b)); run = { G, r, best }; }
  return run;
};

test('Kette mit Budget: Übergänge 75–250 m Fußweg, mind. 75 m Luftlinie, unabhängige Prüfung ohne Befund', () => {
  const { G, r } = planned(), ch = r.chain;
  assert.equal(ch.order.length, 5);
  assert.equal(r.status, 'beste im Budget gefundene Lösung');
  for (let k = 1; k < ch.order.length; k++) {
    const w = ch.links[k]; if (!w) continue;
    assert.ok(w.dist >= 75 && w.dist <= 250, `Übergang ${k}: ${w.dist} m`);
    assert.ok(len(w.pts) >= 74 && len(w.pts) <= 251, `Übergang ${k}: Linie ${len(w.pts)} m`);
    assert.ok(air(ch.order[k - 1].v.pts.at(-1), ch.order[k].v.pts[0]) >= 75, `Übergang ${k}: Luftlinie`);
  }
  assert.equal(ch.gaps, ch.links.filter((w, i) => i > 0 && !w).length);
  const levels = ch.order.map(c => c.tr.level);
  assert.deepEqual(Planner.checkChain(G, ch.order, ch.links, levels, 30), []);
  assert.deepEqual(levels, ['MT-I', 'MT-I', 'MT-I', 'MT-II', 'MT-II']);
  assert.deepEqual([...ch.index].sort(), [0, 1, 2, 3, 4]);
});

test('Kette mit Budget: Mindestabstand zwischen Trails, Längen nur Soll und ±6 %, mind. 15 m bis zur ersten Entscheidungsstelle', () => {
  const { G, r } = planned(), o = r.chain.order;
  for (let i = 0; i < o.length; i++) for (let j = i + 1; j < o.length; j++) assert.ok(Planner.compatible(o[i], o[j], 30), `Trail ${i + 1}/${j + 1}`);
  for (const c of o) {
    const soll = Planner.LEVELS[c.tr.level].length;
    assert.ok([0.94, 1, 1.06].some(f => Math.abs(c.v.length - soll * f) < 1), `Länge ${c.v.length}`);
    assert.ok(Planner.firstDecision(G, c.tr) >= 15);
    assert.ok(Planner.validate(G, { ...c.tr, mode: 'pruefung' }).ok);
  }
});

test('Kette mit Budget: jede gemeldete Zwischenlösung ist geprüft und nicht schlechter als die vorige', () => {
  const { G, best } = planned();
  assert.ok(best.length >= 1);
  for (const b of best) assert.deepEqual(Planner.checkChain(G, b.order, b.links, b.order.map(c => c.tr.level), 30), []);
  for (let i = 1; i < best.length; i++) assert.ok(best[i].gaps <= best[i - 1].gaps, 'Lücken nehmen nicht zu');
});

test('Übergang über 250 m wird nicht genommen, auch wenn die GPX-Regel (bis 1,5 km) einen Weg fände', () => {
  const { G, r } = planned();
  const W = Planner.walkGraph(G), cands = r.pools['MT-I'].list.concat(r.pools['MT-II'].list).slice(0, 40);
  let found = 0;
  for (const a of cands) for (const b of cands) {
    if (a === b || found >= 3) continue;
    const g = Planner.transitPath(G, W, a.v.pts.at(-1), b, []);
    if (g.dist === null || g.dist <= 260) continue;
    found++;
    assert.equal(Planner.chainLink(G, W, a, b, []), null, `GPX-Weg ${Math.round(g.dist)} m darf in der Kette nicht gelten`);
  }
  assert.ok(found > 0, 'Beispiel mit Weg über 250 m gefunden');
});

test('Übergang unter 75 m Luftlinie wird nicht genommen', () => {
  const { G, r } = planned();
  const W = Planner.walkGraph(G), list = r.pools['MT-I'].list;
  const pair = list.flatMap(a => list.map(b => [a, b])).find(([a, b]) => a !== b && air(a.v.pts.at(-1), b.v.pts[0]) < 75);
  assert.ok(pair, 'Paar mit kurzer Luftlinie gefunden');
  assert.equal(Planner.chainLink(G, W, pair[0], pair[1], []), null);
});

test('Worker: meldet geprüfte Zwischenstände (best) vor dem Ergebnis; ohne Budget bleibt die bisherige Kette', () => {
  const sent = [], scope = { postMessage: m => sent.push(structuredClone(m)) };
  Planner.workerMain(scope);
  scope.onmessage({ data: structuredClone({ id: 1, key: 1, args: { ...ARGS, budgetMs: 4000 }, osm, center: CENTER, radius: 1200 }) });
  const firstBest = sent.findIndex(m => m.best), result = sent.findIndex(m => m.result);
  assert.ok(firstBest >= 0 && firstBest < result);
  assert.ok(sent[result].result.chain.order.length === 5);
  scope.onmessage({ data: structuredClone({ id: 2, key: 1, args: { ...ARGS, budgetMs: 0 } }) });
  const r2 = sent.find(m => m.id === 2 && m.result).result;
  assert.equal(r2.status, undefined, 'ohne Budget: bisherige Kette ohne Status');
  assert.ok(!sent.some(m => m.id === 2 && m.best));
  assert.ok(r2.chain.order.every(c => Math.abs(c.v.length - Planner.LEVELS[c.tr.level].length) < 0.5), 'bisherige Kette: nur Solllängen');
});
