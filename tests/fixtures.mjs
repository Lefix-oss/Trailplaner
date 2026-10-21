// Künstliches Straßenraster im OSM-Overpass-Format (erfundene Namen)
// Zeilen i (Norden), Spalten j (Osten), Abstand 90 m; Spalte 3 ist eine Kreisstraße, Zeile 5 ein Fußweg mit Namen
export const CENTER = { lat: 49.65, lon: 9.95 };
export const STEP = 90;
const N = 6;
const kx = 111320 * Math.cos(CENTER.lat * Math.PI / 180), ky = 110574;
const ll = (x, y) => ({ lat: CENTER.lat + y / ky, lon: CENTER.lon + x / kx });
export const nodeId = (i, j) => 1000 + i * 10 + j;

export function gridOSM() {
  const elements = [];
  const way = (id, ids, tags) => elements.push({ type: 'way', id, nodes: ids.map(([i, j]) => nodeId(i, j)), geometry: ids.map(([i, j]) => ll(j * STEP, i * STEP)), tags });
  for (let i = 0; i < N; i++) {
    const row = [...Array(N)].map((_, j) => [i, j]);
    way(100 + i, row, i === N - 1 ? { highway: 'footway', name: 'Am Bach' } : { highway: 'residential', name: `Reihe ${i}` });
  }
  for (let j = 0; j < N; j++) {
    const col = [...Array(N)].map((_, i) => [i, j]);
    way(200 + j, col, j === 3 ? { highway: 'tertiary', name: 'Kreisstraße', maxspeed: '50' } : { highway: 'residential', name: `Spalte ${j}` });
  }
  const m = 60, e = (N - 1) * STEP + 60;
  const ring = [[-m, -m], [e, -m], [e, e], [-m, e], [-m, -m]].map(([x, y]) => ll(x, y));
  elements.push({ type: 'way', id: 900, nodes: [1, 2, 3, 4, 1], geometry: ring, tags: { landuse: 'residential' } });
  return { elements };
}

// Weitmaschiges Raster (180 m) für MT-II: gültige Trails gibt es, aber nur mit passend gewähltem Start
export function wideOSM() {
  const S = 180, M = 6, elements = [];
  const id = (i, j) => 5000 + i * 10 + j;
  const way = (wid, ids, tags) => elements.push({ type: 'way', id: wid, nodes: ids.map(([i, j]) => id(i, j)), geometry: ids.map(([i, j]) => ll(j * S, i * S)), tags });
  for (let i = 0; i < M; i++) way(300 + i, [...Array(M)].map((_, j) => [i, j]), { highway: 'residential', name: `Weg ${i}` });
  for (let j = 0; j < M; j++) way(400 + j, [...Array(M)].map((_, i) => [i, j]), { highway: 'residential', name: `Gasse ${j}` });
  const e = (M - 1) * S + 60;
  elements.push({ type: 'way', id: 901, nodes: [1, 2, 3, 4, 1], geometry: [[-60, -60], [e, -60], [e, e], [-60, e], [-60, -60]].map(([x, y]) => ll(x, y)), tags: { landuse: 'residential' } });
  return { elements, center: ll((M - 1) * S / 2, (M - 1) * S / 2) };
}

// Segment zwischen zwei benachbarten Rasterknoten als Trail-Bein (Richtung von a nach b)
export function leg(G, a, b, d0 = 0, d1 = null) {
  const A = nodeId(...a), B = nodeId(...b);
  const s = G.segs.find(x => (x.a === A && x.b === B) || (x.a === B && x.b === A));
  if (!s) throw new Error(`kein Segment ${a} → ${b}`);
  return { seg: s.id, fwd: s.a === A, d0, d1: d1 === null ? s.len : d1 };
}
