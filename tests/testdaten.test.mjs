// Regressionstest mit echten GPX-Dateien aus testdaten/ (nicht im Repository; ohne den Ordner wird der Test übersprungen)
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { Planner, Pruefung } from './load.mjs';

const dir = new URL('../testdaten/', import.meta.url);
const files = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.gpx')).sort((a, b) => a.localeCompare(b, 'de', { numeric: true })) : [];

test('testdaten: Reihenfolge der Giebelstädter MT-I-Trails nach kürzesten Übergängen', { skip: files.length !== 8 && 'testdaten/ fehlt' }, () => {
  const osm = JSON.parse(readFileSync(new URL('../data/osm/giebelstadt-essfeld.json', import.meta.url), 'utf8'));
  const G = Planner.buildGraph(osm, { lat: 49.6536, lon: 9.9445 }, 1200);
  Planner.setTerrain(G, 'frei', true, true, false);
  const W = Planner.walkGraph(G);
  const tracks = files.map(f => ({ f, ...Pruefung.parseGpx(readFileSync(new URL(f, dir), 'utf8')) }));
  const mt1 = tracks.filter(t => Planner.levelByLength(lenOf(t.ll)) === 'MT-I');
  assert.equal(mt1.length, 7);
  const cands = mt1.map(t => Planner.trackCandidate(G, W, t.ll, 'MT-I', { id: t.f }));
  const ch = Planner.chain(G, W, cands.map((_, k) => ({ name: 'T' + k, level: 'MT-I' })), { 'MT-I': { list: cands } }, Planner.rng(1), 30, { fixed: true });
  // Nummern wie in der Liste: 1 = export (1) … 6 = export (6), 7 = export
  const num = f => (f === 'export.gpx' ? 7 : +f.match(/\((\d)\)/)[1]);
  assert.deepEqual(ch.order.map(c => num(c.id)), [4, 5, 6, 7, 1, 2, 3]);
  assert.equal(ch.links.length, 7);
  assert.equal(ch.links[0], null);
  // Übergänge nach der Regel „nicht kreuzen, berühren, benutzen“ (Startstück des nächsten Trails erlaubt)
  assert.deepEqual(ch.links.slice(1).map(w => w && Math.round(w.dist)), [253, 759, 323, 63, 146, 501]);
  assert.equal(ch.gaps, 0);
  // Die Linien bleiben unverändert
  ch.order.forEach(c => assert.deepEqual(c.ll, tracks.find(t => t.f === c.id).ll));
});

function lenOf(ll) {
  let s = 0;
  for (let i = 1; i < ll.length; i++) s += Math.hypot((ll[i][0] - ll[i - 1][0]) * 110574, (ll[i][1] - ll[i - 1][1]) * 111320 * Math.cos(ll[i][0] * Math.PI / 180));
  return s;
}
