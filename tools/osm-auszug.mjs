// Erstellt oder erneuert einen festen Wegedaten-Auszug, den die App ohne OpenStreetMap-Server nutzt.
// Aufruf: node tools/osm-auszug.mjs <datei.json> "<Name>" <Süd> <West> <Nord> <Ost>
// Beispiel: node tools/osm-auszug.mjs giebelstadt-essfeld.json "Giebelstadt und Eßfeld" 49.628 9.909 49.696 9.995
// Daten © OpenStreetMap-Mitwirkende, ODbL
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { Pruefung } from '../tests/load.mjs';

const SERVERS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
const dir = new URL('../data/osm/', import.meta.url);

const [file, name, ...b] = process.argv.slice(2);
const bbox = b.map(Number);
if (!file || !name || bbox.length !== 4 || bbox.some(Number.isNaN)) {
  console.error('Aufruf: node tools/osm-auszug.mjs <datei.json> "<Name>" <Süd> <West> <Nord> <Ost>');
  process.exit(1);
}

const q = Pruefung.overpassQuery(bbox);
let data = null;
for (const url of SERVERS) {
  try {
    console.log('Frage', url, '…');
    const r = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: AbortSignal.timeout(120000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    if (!Array.isArray(d.elements) || /error/i.test(d.remark || '')) throw new Error('unvollständig: ' + (d.remark || ''));
    data = d; break;
  } catch (e) { console.log('  geht nicht:', e.message); }
}
if (!data) { console.error('Kein Server hat vollständig geantwortet. Später noch einmal versuchen.'); process.exit(2); }

mkdirSync(dir, { recursive: true });
writeFileSync(new URL(file, dir), JSON.stringify(data));
const indexUrl = new URL('index.json', dir);
const index = existsSync(indexUrl) ? JSON.parse(readFileSync(indexUrl, 'utf8')) : { extracts: [] };
index.extracts = index.extracts.filter(x => x.file !== file).concat([{ file, name, bbox, savedAt: new Date().toISOString().slice(0, 10) }]);
writeFileSync(indexUrl, JSON.stringify(index, null, 1) + '\n');
console.log(`Gespeichert: data/osm/${file} (${data.elements.length} Elemente, Stand ${data.osm3s && data.osm3s.timestamp_osm_base})`);
