import test from 'node:test';
import assert from 'node:assert/strict';
import { Planner, Pruefung } from './load.mjs';

test('parseNames trimmt, ignoriert Leerzeilen und Dubletten', () => {
  assert.deepEqual(Pruefung.parseNames('  Anna mit Luna \n\n Ben mit Rex\nAnna mit Luna\n'), ['Anna mit Luna', 'Ben mit Rex']);
});

test('splitTeam trennt am ersten " mit "', () => {
  assert.deepEqual(Pruefung.splitTeam('Eva mit Carl von der Mühle'), { hf: 'Eva', hund: 'Carl von der Mühle' });
  assert.deepEqual(Pruefung.splitTeam('Eva'), { hf: 'Eva', hund: '' });
});

const T = lv => ({ level: lv });

test('draw: Teams bleiben in ihrer Stufe, alle Trails werden besetzt', () => {
  const trails = [T('MT-I'), T('MT-II'), T('MT-I'), T('MT-II')];
  const r = Pruefung.draw(trails, { 'MT-I': ['A', 'B'], 'MT-II': ['C', 'D'] }, ['V1', 'V2', 'V3', 'V4'], Planner.rng(1));
  assert.deepEqual(r.assign.filter((_, i) => trails[i].level === 'MT-I').map(a => a.team).sort(), ['A', 'B']);
  assert.deepEqual(r.assign.filter((_, i) => trails[i].level === 'MT-II').map(a => a.team).sort(), ['C', 'D']);
  assert.deepEqual(r.assign.map(a => a.vp).sort(), ['V1', 'V2', 'V3', 'V4']);
});

test('draw: zu wenige Namen lassen Felder leer, zu viele werden gemeldet', () => {
  const r = Pruefung.draw([T('MT-I'), T('MT-I')], { 'MT-I': ['A', 'B', 'X'] }, ['V1'], Planner.rng(2));
  assert.equal(r.assign.length, 2);
  assert.equal(r.unplaced.teams.length, 1);
  assert.equal(r.assign.filter(a => a.vp === '').length, 1);
  assert.deepEqual(r.unplaced.vps, []);
});

test('draw: gleicher Startwert ergibt gleiche Zuteilung', () => {
  const args = [[T('MT-I'), T('MT-I'), T('MT-I')], { 'MT-I': ['A', 'B', 'C'] }, ['V1', 'V2', 'V3']];
  assert.deepEqual(Pruefung.draw(...args, Planner.rng(7)), Pruefung.draw(...args, Planner.rng(7)));
});

test('setCell tauscht, wenn der Name schon vergeben ist', () => {
  const a = [{ team: 'A', vp: 'V1' }, { team: 'B', vp: 'V2' }];
  Pruefung.setCell(a, 0, 'vp', 'V2');
  assert.deepEqual(a, [{ team: 'A', vp: 'V2' }, { team: 'B', vp: 'V1' }]);
  Pruefung.setCell(a, 1, 'team', '');
  assert.equal(a[1].team, '');
});

test('obstacle + Planner.compatible erkennt zu nahe Trails', () => {
  const id = ll => [ll[1], ll[0]];                       // Test-Projektion: x = lon, y = lat (Meter)
  const a = Pruefung.obstacle({ ll: [[0, 0], [0, 200]] }, id);
  const near = Pruefung.obstacle({ ll: [[10, 0], [10, 200]] }, id);
  const far = Pruefung.obstacle({ ll: [[100, 0], [100, 200]] }, id);
  assert.equal(Planner.compatible(a, near, 30), false);
  assert.equal(Planner.compatible(a, far, 30), true);
});

test('serializeExam/parseExam: Hin und zurück ohne Verlust', () => {
  const exam = { format: 'trailplaner-pruefung', version: 2, savedAt: '2026-10-22T10:00:00Z',
    places: [{ id: 'A', name: 'Musterdorf', center: { lat: 49.65, lon: 9.95 }, terrain: 'ort', radius: 1200 }], settings: { radius: 1200, minDist: 30, allowPaths: false, avoidLoops: true, startTime: '10:00' },
    date: '2026-10-31', trails: [{ level: 'MT-I', ll: [[49.65, 9.95], [49.651, 9.951]], length: 305, turns: 1, decisions: 1, crossings: 0,
      steps: [{ at: 0, kind: 'start', text: 'Start' }], startStreet: 'Industriestraße', endStreet: 'Bavariastraße', checked: true, harder: 'Mehr Abzweige als vorgesehen', place: 'A' }],
    names: { teams: { 'MT-I': ['Anna mit Luna'], 'MT-II': [], 'MT-III': [] }, vps: ['VP1'] }, assign: [{ team: 'Anna mit Luna', vp: 'VP1' }] };
  assert.deepEqual(Pruefung.parseExam(Pruefung.serializeExam(exam)), exam);
});

test('parseExam lehnt fremde und kaputte Dateien mit deutscher Meldung ab', () => {
  assert.throws(() => Pruefung.parseExam('<gpx></gpx>'), /kein gespeicherter Trailplan/);
  assert.throws(() => Pruefung.parseExam('{"format":"x"}'), /kein gespeicherter Trailplan/);
  assert.throws(() => Pruefung.parseExam('{"format":"trailplaner-pruefung","version":3,"trails":[]}'), /neueren Version/);
  assert.throws(() => Pruefung.parseExam('{"format":"trailplaner-pruefung","version":1,"trails":[{"level":"MT-I","ll":[[1,2]]}]}'), /Trail 1 hat keine Strecke/);
});

test('parseExam lehnt Trails mit kaputten Feldern ab', () => {
  const file = trail => JSON.stringify({ format: 'trailplaner-pruefung', version: 1, center: { lat: 49.6, lon: 9.9 }, trails: [trail] });
  const ok = { level: 'MT-I', ll: [[49.6, 9.9], [49.61, 9.91]], steps: [] };
  assert.doesNotThrow(() => Pruefung.parseExam(file(ok)));
  assert.throws(() => Pruefung.parseExam(file({ ...ok, level: undefined })), /Trail 1 ist beschädigt/);
  assert.throws(() => Pruefung.parseExam(file({ ...ok, level: 'MT-X' })), /Trail 1 ist beschädigt/);
  assert.throws(() => Pruefung.parseExam(file({ ...ok, steps: 'x' })), /Trail 1 ist beschädigt/);
  assert.throws(() => Pruefung.parseExam(file({ ...ok, ll: ['a', 'b'] })), /Trail 1 hat keine Strecke/);
  assert.throws(() => Pruefung.parseExam(JSON.stringify({ format: 'trailplaner-pruefung', version: 1, center: { lat: 'x' }, trails: [ok] })), /beschädigt/);
});

test('parseExam lehnt Zahlenfelder mit Text oder HTML ab (werden später in die Seite geschrieben)', () => {
  const file = trail => JSON.stringify({ format: 'trailplaner-pruefung', version: 1, center: { lat: 49.6, lon: 9.9 }, trails: [trail] });
  const ok = { level: 'MT-I', ll: [[49.6, 9.9], [49.61, 9.91]], steps: [{ at: 10, kind: 'turn', text: 'links', options: 2 }], length: 300, turns: 1, decisions: 1, crossings: 0, link: { dist: 120, gap: false, ll: [[49.6, 9.9], [49.601, 9.9]] } };
  assert.doesNotThrow(() => Pruefung.parseExam(file(ok)));
  const evil = '<img src=x onerror=alert(1)>';
  for (const k of ['length', 'turns', 'decisions', 'crossings']) assert.throws(() => Pruefung.parseExam(file({ ...ok, [k]: evil })), /Trail 1 ist beschädigt/, k);
  assert.throws(() => Pruefung.parseExam(file({ ...ok, link: { dist: evil, gap: false } })), /Trail 1 ist beschädigt/);
  assert.throws(() => Pruefung.parseExam(file({ ...ok, link: 'x' })), /Trail 1 ist beschädigt/);
  assert.throws(() => Pruefung.parseExam(file({ ...ok, link: { dist: 1, ll: [evil] } })), /Trail 1 ist beschädigt/);
  assert.throws(() => Pruefung.parseExam(file({ ...ok, steps: [{ at: evil, kind: 'turn', text: 'x' }] })), /Trail 1 ist beschädigt/);
  assert.throws(() => Pruefung.parseExam(file({ ...ok, steps: [{ at: 1, kind: 'turn', text: 'x', options: evil }] })), /Trail 1 ist beschädigt/);
  assert.throws(() => Pruefung.parseExam(file({ ...ok, steps: [null] })), /Trail 1 ist beschädigt/);
  assert.throws(() => Pruefung.parseExam(file({ ...ok, steps: [{ at: 1, kind: 'turn', text: { a: 1 } }] })), /Trail 1 ist beschädigt/);
  assert.equal(Pruefung.parseExam(file({ level: 'MT-I', ll: ok.ll })).trails[0].length, 0);   // ältere Dateien ohne Kennzahlen bleiben lesbar
});

test('parseExam setzt fehlenden Schwierigkeitshinweis auf leer', () => {
  const ex = Pruefung.parseExam('{"format":"trailplaner-pruefung","version":1,"trails":[{"level":"MT-I","ll":[[1,2],[1,3]]}]}');
  assert.equal(ex.trails[0].harder, '');
});

test('shareText listet Start- bzw. Endpunkte mit Stufe, VP und Team', () => {
  const ex = { places: [{ id: 'A', name: 'Musterdorf, Landkreis X' }], trails: [{ level: 'MT-I', place: 'A', ll: [[49.1, 9.1], [49.2, 9.2]] }, { level: 'MT-II', place: 'A', ll: [[49.3, 9.3], [49.4, 9.4]] }],
    assign: [{ team: 'Anna mit Luna', vp: 'VP1' }, { team: '', vp: '' }] };
  const link = ll => `L(${ll[0]},${ll[1]})`;
  assert.equal(Pruefung.shareText(ex, 'start', link),
    'Startpunkte Prüfung Musterdorf\n\nTrail 1 (MT-I) – VP: VP1 – Team: Anna mit Luna\nL(49.1,9.1)\n\nTrail 2 (MT-II)\nL(49.3,9.3)');
  assert.ok(Pruefung.shareText(ex, 'end', link).startsWith('Endpunkte Prüfung Musterdorf\n\nTrail 1 (MT-I) – VP: VP1 – Team: Anna mit Luna\nL(49.2,9.2)'));
});

test('osmKey: gleicher Ort (auf ca. 10 m) und Radius ergeben denselben Schlüssel', () => {
  assert.equal(Pruefung.osmKey({ lat: 49.65312, lon: 9.94528 }, 1200), Pruefung.osmKey({ lat: 49.65309, lon: 9.94531 }, 1200));
  assert.notEqual(Pruefung.osmKey({ lat: 49.6531, lon: 9.9453 }, 1200), Pruefung.osmKey({ lat: 49.6531, lon: 9.9453 }, 1600));
});

test('osmFresh: Zwischenspeicher gilt 14 Tage', () => {
  const day = 864e5, now = Date.UTC(2026, 9, 21);
  assert.equal(Pruefung.osmFresh(now - 13 * day, now), true);
  assert.equal(Pruefung.osmFresh(now - 15 * day, now), false);
  assert.equal(Pruefung.osmFresh(undefined, now), false);
});

test('parseExam ergänzt fehlende Zuteilung und Namenslisten', () => {
  const ex = Pruefung.parseExam('{"format":"trailplaner-pruefung","version":1,"trails":[{"level":"MT-II","ll":[[1,2],[1,3]]}]}');
  assert.deepEqual(ex.assign, [{ team: '', vp: '' }]);
  assert.deepEqual(ex.names, { teams: { 'MT-I': [], 'MT-II': [], 'MT-III': [] }, vps: [] });
  assert.equal(ex.trails[0].checked, false);
});

// ---------- Mehrere Orte (Dateiformat Version 2) ----------
const T2 = (level, place, checked) => ({ level, place, checked, ll: [[49.1, 9.1], [49.1005, 9.101]], steps: [], harder: '', length: 300, turns: 1, decisions: 1, crossings: 0, startStreet: 'S', endStreet: 'E' });
const v2 = () => ({ format: 'trailplaner-pruefung', version: 2, date: '2026-10-31', settings: { radius: 1200, minDist: 30, allowPaths: true, avoidLoops: true, startTime: '10:00' },
  places: [{ id: 'A', name: 'Musterdorf', center: { lat: 49.1, lon: 9.1 }, terrain: 'ort' }, { id: 'B', name: 'Beispielhausen', center: { lat: 49.5, lon: 9.5 }, terrain: 'mix' }],
  trails: [T2('MT-I', 'A', true), T2('MT-II', 'B', true), T2('MT-I', 'A', false)],
  names: { teams: { 'MT-I': [], 'MT-II': [], 'MT-III': [] }, vps: [] },
  assign: [{ team: 'Anna mit Luna', vp: 'VP1' }, { team: 'Ben mit Rex', vp: 'VP2' }, { team: '', vp: 'VP3' }] });

test('parseExam migriert Version 1 auf einen Ort A', () => {
  const ex = Pruefung.parseExam(JSON.stringify({ format: 'trailplaner-pruefung', version: 1, placeName: 'Musterdorf', center: { lat: 49.1, lon: 9.1 },
    settings: { radius: 1200, minDist: 30, terrain: 'mix', allowPaths: true, avoidLoops: true, startTime: '10:00' }, trails: [{ level: 'MT-I', ll: [[1, 2], [1, 3]] }] }));
  assert.equal(ex.version, 2);
  assert.deepEqual(ex.places, [{ id: 'A', name: 'Musterdorf', center: { lat: 49.1, lon: 9.1 }, terrain: 'mix', radius: 1200 }]);
  assert.equal(ex.trails[0].place, 'A');
  assert.equal('terrain' in ex.settings, false);
  assert.equal('placeName' in ex, false);
});

test('parseExam lehnt Trail mit unbekanntem Ort ab', () => {
  const ex = v2(); ex.trails[0].place = 'C';
  assert.throws(() => Pruefung.parseExam(JSON.stringify(ex)), /Trail 1 ist beschädigt/);
  const ex2 = v2(); ex2.places = [];
  assert.throws(() => Pruefung.parseExam(JSON.stringify(ex2)), /beschädigt/);
});

test('replacePlaceTrails ersetzt nur die Trails des Orts', () => {
  const ex = v2(), neu = T2('MT-II', 'B', false); neu.length = 610;
  const r = Pruefung.replacePlaceTrails(ex, 'B', [neu], ex.places[1]);
  assert.equal(r.trails.length, 3);
  assert.deepEqual(r.trails[0], ex.trails[0]);
  assert.deepEqual(r.trails[2], ex.trails[2]);
  assert.equal(r.trails[1].length, 610);
  assert.deepEqual(r.assign, [{ team: 'Anna mit Luna', vp: 'VP1' }, { team: '', vp: '' }, { team: '', vp: 'VP3' }]);
  assert.equal(ex.trails[1].length, 300);   // Original unverändert
});

test('replacePlaceTrails mit weniger neuen Trails entfernt überzählige', () => {
  const ex = v2();
  const r = Pruefung.replacePlaceTrails(ex, 'A', [T2('MT-I', 'A', false)], ex.places[0]);
  assert.deepEqual(r.trails.map(t => t.place), ['A', 'B']);
  assert.equal(r.trails[1].checked, true);
  assert.deepEqual(r.assign, [{ team: '', vp: '' }, { team: 'Ben mit Rex', vp: 'VP2' }]);
});

test('replacePlaceTrails hängt zusätzliche Trails an und ergänzt neuen Ort', () => {
  const ex = v2(), C = { id: 'C', name: 'Neudorf', center: { lat: 49.9, lon: 9.9 }, terrain: 'ort' };
  const r = Pruefung.replacePlaceTrails(ex, 'C', [T2('MT-I', 'C', false), T2('MT-I', 'C', false)], C);
  assert.equal(r.trails.length, 5);
  assert.deepEqual(r.places.map(p => p.id), ['A', 'B', 'C']);
  assert.deepEqual(r.assign.slice(3), [{ team: '', vp: '' }, { team: '', vp: '' }]);
});

test('mergePlaces behält die aktuelle Ortsliste und ergänzt nur fehlende Orte der Prüfung', () => {
  const live = [{ id: 'A', name: 'Musterdorf', center: { lat: 1, lon: 1 }, terrain: 'ort' }, { id: 'C', name: 'Neudorf', center: { lat: 3, lon: 3 }, terrain: 'mix' }];
  const frozen = [{ id: 'A', name: 'Alt', center: { lat: 9, lon: 9 }, terrain: 'frei' }, { id: 'B', name: 'Beispielhausen', center: { lat: 2, lon: 2 }, terrain: 'ort' }];
  assert.deepEqual(Pruefung.mergePlaces(live, frozen).map(p => p.id + ':' + p.name), ['A:Musterdorf', 'C:Neudorf', 'B:Beispielhausen']);
});

test('parseExam ergänzt den Radius je Ort aus den Einstellungen', () => {
  const v1 = Pruefung.parseExam(JSON.stringify({ format: 'trailplaner-pruefung', version: 1, center: { lat: 49.1, lon: 9.1 }, settings: { radius: 800 }, trails: [{ level: 'MT-I', ll: [[1, 2], [1, 3]] }] }));
  assert.equal(v1.places[0].radius, 800);
  const ex = v2(); ex.places[1].radius = 600;
  const r = Pruefung.parseExam(JSON.stringify(ex));
  assert.deepEqual(r.places.map(p => p.radius), [1200, 600]);
});

test('placeOf liefert den Ort eines Trails', () => {
  const ex = v2();
  assert.equal(Pruefung.placeOf(ex, ex.trails[1]).name, 'Beispielhausen');
});

test('shareText gliedert bei mehreren Orten nach Ort', () => {
  const txt = Pruefung.shareText(v2(), 'start', ll => 'L');
  assert.equal(txt, 'Startpunkte Prüfung\n\n— Musterdorf —\n\nTrail 1 (MT-I) – VP: VP1 – Team: Anna mit Luna\nL\n\nTrail 3 (MT-I) – VP: VP3\nL\n\n— Beispielhausen —\n\nTrail 2 (MT-II) – VP: VP2 – Team: Ben mit Rex\nL');
});

// ---------- Wegedaten: feste Auszüge und Abfrage ----------
test('osmBBox: Rechteck um die Mitte mit Radius plus 50 m Rand', () => {
  const b = Pruefung.osmBBox({ lat: 49.65, lon: 9.95 }, 1200);
  assert.ok(Math.abs((b[2] - b[0]) * 110574 / 2 - 1250) < 1);          // halbe Höhe in Metern
  assert.ok(b[1] < 9.95 && b[3] > 9.95);
});

test('findExtract: nimmt einen Auszug nur, wenn er das Suchgebiet ganz enthält', () => {
  const manifest = { extracts: [{ file: 'a.json', bbox: [49.60, 9.90, 49.70, 10.00] }] };
  assert.equal(Pruefung.findExtract(manifest, Pruefung.osmBBox({ lat: 49.65, lon: 9.95 }, 1200)).file, 'a.json');
  assert.equal(Pruefung.findExtract(manifest, Pruefung.osmBBox({ lat: 49.69, lon: 9.95 }, 2200)), null);
  assert.equal(Pruefung.findExtract(null, [1, 2, 3, 4]), null);
});

test('overpassQuery enthält Wege, Wohngebiete und Sperren im Rechteck', () => {
  const q = Pruefung.overpassQuery([49.6, 9.9, 49.7, 10]);
  assert.match(q, /way\["highway"\]\(49\.600000,9\.900000,49\.700000,10\.000000\)/);
  assert.match(q, /node\["barrier"\]/);
  assert.match(q, /out body geom;$/);
});

// ---------- Ortssuche ----------
test('placeChoices: Gemeindefläche fällt weg, wenn es den Ort gleichen Namens gibt', () => {
  const res = [
    { place_id: 1, name: 'Wonfurt', category: 'boundary', osm_type: 'relation', lat: '49.9922', lon: '10.4503' },
    { place_id: 2, name: 'Wonfurt', category: 'place', osm_type: 'node', lat: '50.0116', lon: '10.4662' },
    { place_id: 3, name: 'Steinsfeld', category: 'place', osm_type: 'node', lat: '49.98', lon: '10.43' },
  ];
  assert.deepEqual(Pruefung.placeChoices(res).map(p => p.place_id), [2, 3]);
});

test('placeChoices: nur Gemeindefläche vorhanden bleibt erhalten, doppelte Orte nah beieinander nur einmal', () => {
  const res = [
    { place_id: 1, name: 'Neudorf', category: 'boundary', osm_type: 'relation', lat: '49.5', lon: '10.0' },
    { place_id: 2, name: 'Altdorf', category: 'place', osm_type: 'node', lat: '49.6', lon: '10.0' },
    { place_id: 3, name: 'Altdorf', category: 'place', osm_type: 'node', lat: '49.605', lon: '10.0' },
    { place_id: 4, name: 'Altdorf', category: 'place', osm_type: 'node', lat: '48.0', lon: '11.0' },
  ];
  assert.deepEqual(Pruefung.placeChoices(res).map(p => p.place_id), [1, 2, 4]);
});

test('replacePlaceTrails hält die Trails eines Orts zusammen (Kette bleibt ein Block)', () => {
  const ex = v2();   // Orte A, B, A
  const r = Pruefung.replacePlaceTrails(ex, 'B', [T2('MT-II', 'B', false), T2('MT-II', 'B', false)], ex.places[1]);
  assert.deepEqual(r.trails.map(t => t.place), ['A', 'B', 'B', 'A']);
  assert.deepEqual(r.assign, [{ team: 'Anna mit Luna', vp: 'VP1' }, { team: '', vp: '' }, { team: '', vp: '' }, { team: '', vp: 'VP3' }]);
});

// ---------- GPX-Import ----------
const gpx = body => `<?xml version="1.0"?><gpx version="1.1">${body}</gpx>`;

test('parseGpx liest Segmente, Routen, beliebige Attributreihenfolge und ignoriert Wegpunkte und Kommentare', () => {
  const t = gpx(`<!-- <trkpt lat="1" lon="1"/> --><wpt lat="2" lon="2"><name>Weg</name></wpt>
    <trk><name>Strecke A</name><trkseg><trkpt lat="49.6" lon="9.9"><ele>250</ele></trkpt><trkpt lon='9.901' lat='49.601'/></trkseg>
    <trkseg><trkpt lat="49.602" lon="9.902"/></trkseg></trk>`);
  const r = Pruefung.parseGpx(t);
  assert.deepEqual(r.ll, [[49.6, 9.9], [49.601, 9.901], [49.602, 9.902]]);
  assert.equal(r.name, 'Strecke A');
  assert.equal(Pruefung.parseGpx(gpx('<rte><rtept lat="49.6" lon="9.9"/><rtept lat="49.7" lon="9.9"/></rte>')).ll.length, 2);
});

test('parseGpx gibt den Namen nur als Text zurück', () => {
  const r = Pruefung.parseGpx(gpx('<trk><name>&lt;img onerror=x&gt; &amp; Co</name><trkseg><trkpt lat="49.6" lon="9.9"/><trkpt lat="49.7" lon="9.9"/></trkseg></trk>'));
  assert.equal(r.name, '<img onerror=x> & Co');
});

test('parseGpx lehnt unbrauchbare Dateien ab', () => {
  const two = '<trkpt lat="49.6" lon="9.9"/><trkpt lat="49.7" lon="9.9"/>';
  assert.throws(() => Pruefung.parseGpx('kein xml'), /GPX/);
  assert.throws(() => Pruefung.parseGpx(gpx('<trk><trkseg></trkseg></trk>')), /Punkte/);
  assert.throws(() => Pruefung.parseGpx(gpx('<trkpt lat="49.6" lon="9.9"/>')), /Punkte/);
  assert.throws(() => Pruefung.parseGpx(gpx(two + '<trkpt lat="95" lon="9.9"/>')), /Koordinate/);
  assert.throws(() => Pruefung.parseGpx(gpx(two + '<trkpt lat="abc" lon="9.9"/>')), /Koordinate/);
  assert.throws(() => Pruefung.parseGpx(gpx('<trkpt lat="49.6" lon="9.9"/>'.repeat(5001))), /Punkte/);
  assert.throws(() => Pruefung.parseGpx(gpx(' '.repeat(1e6 + 1))), /groß/);
});

test('placeFor findet den Ort, dessen Kreis Start und Ziel enthält', () => {
  const places = [
    { id: 'A', center: { lat: 49.6, lon: 9.9 }, radius: 1000 },
    { id: 'B', center: { lat: 49.6, lon: 9.92 }, radius: 1000 },
    { id: 'C', center: null, radius: 1000 },
  ];
  assert.equal(Pruefung.placeFor(places, [49.6, 9.9], [49.601, 9.901]).id, 'A');
  assert.equal(Pruefung.placeFor(places, [49.6, 9.92], [49.6, 9.921]).id, 'B');
  assert.equal(Pruefung.placeFor(places, [49.6, 9.908], [49.6, 9.909]).id, 'A');   // beide Kreise passen: A hat die nähere Mitte zum Start
  assert.equal(Pruefung.placeFor(places, [49.6, 9.9], [49.7, 9.9]), null);        // Ziel außerhalb
  assert.equal(Pruefung.placeFor(places, [50, 10], [50, 10.001]), null);
});

test('parseExam übernimmt imported und name und prüft sie', () => {
  const base = () => ({ format: Pruefung.FORMAT, version: 2, places: [{ id: 'A', center: { lat: 49.6, lon: 9.9 }, radius: 1000 }],
    trails: [{ level: 'MT-I', place: 'A', ll: [[49.6, 9.9], [49.601, 9.9]], length: 300, imported: true, name: 'Strecke' }] });
  const ok = Pruefung.parseExam(JSON.stringify(base()));
  assert.equal(ok.trails[0].imported, true);
  assert.equal(ok.trails[0].name, 'Strecke');
  const bad = base(); bad.trails[0].name = { x: 1 };
  assert.throws(() => Pruefung.parseExam(JSON.stringify(bad)), /beschädigt/);
  const bad2 = base(); bad2.trails[0].imported = 'ja';
  assert.throws(() => Pruefung.parseExam(JSON.stringify(bad2)), /beschädigt/);
});

test('parseExam prüft die Befunde (issues) importierter Trails', () => {
  const base = issues => JSON.stringify({ format: Pruefung.FORMAT, version: 2, places: [{ id: 'A', center: { lat: 49.6, lon: 9.9 }, radius: 1000 }],
    trails: [{ level: 'MT-I', place: 'A', ll: [[49.6, 9.9], [49.601, 9.9]], length: 300, imported: true, issues }] });
  assert.deepEqual(Pruefung.parseExam(base(['Länge: 250 m'])).trails[0].issues, ['Länge: 250 m']);
  assert.throws(() => Pruefung.parseExam(base('x')), /beschädigt/);
  assert.throws(() => Pruefung.parseExam(base([{ a: 1 }])), /beschädigt/);
});

test('Prüfungsstand mit importiertem Trail behält die Linie Punkt für Punkt', () => {
  const ll = [[49.600001, 9.900002], [49.6005, 9.9011], [49.60123, 9.90123]];
  const ex = { format: Pruefung.FORMAT, version: 2, places: [{ id: 'A', center: { lat: 49.6, lon: 9.9 }, radius: 1000 }],
    trails: [{ level: 'MT-I', place: 'A', ll, length: 300, imported: true, name: 'Strecke', issues: [] }] };
  const back = Pruefung.parseExam(Pruefung.serializeExam(ex));
  assert.deepEqual(back.trails[0].ll, ll);
  assert.equal(back.trails[0].imported, true);
});

test('parseGpx bleibt bei präparierten Dateien schnell (kein Einfrieren)', () => {
  const evil = [
    '<gpx>' + '<trkpt'.repeat(160000),
    '<gpx>' + '<!--'.repeat(240000),
    '<gpx>' + '<wpt '.repeat(150000),
    '<gpx><trkpt lat="1" lon="1"/><trkpt lat="1" lon="2"/>' + '<trk>'.repeat(150000),
    '<gpx>' + '<trkpt lat="1" lon="1" '.repeat(40000) + '>',
  ];
  for (const t of evil) {
    const t0 = Date.now();
    try { Pruefung.parseGpx(t); } catch { /* Ablehnen ist erlaubt */ }
    assert.ok(Date.now() - t0 < 500, `zu langsam: ${Date.now() - t0} ms`);
  }
});

test('parseGpx nimmt bei Track und Route nur den Track', () => {
  const r = Pruefung.parseGpx('<gpx><rte><rtept lat="1" lon="1"/><rtept lat="1" lon="2"/></rte><trk><trkseg><trkpt lat="2" lon="2"/><trkpt lat="2" lon="3"/></trkseg></trk></gpx>');
  assert.deepEqual(r.ll, [[2, 2], [2, 3]]);
});

test('groupTracks fasst nahe Strecken zu Ortsvorschlägen zusammen und rät nicht', () => {
  const R = [400, 600, 800, 1200, 1600, 2200];
  const at = (dn, de) => [49.65 + dn / 110574, 9.95 + de / (111320 * Math.cos(49.65 * Math.PI / 180))];
  const line = (n0, e0, n1, e1) => [at(n0, e0), at(n1, e1)];
  const tracks = [line(0, 0, 0, 300), line(100, 500, 100, 800), line(3000, 0, 3000, 300), line(9000, 0, 14000, 0)];
  const r = Pruefung.groupTracks(tracks, R);
  assert.equal(r.groups.length, 2);
  assert.deepEqual(r.groups[0].members, [0, 1]);
  assert.equal(r.groups[0].radius, 600);   // 800 m breit: halbe Breite 400 m plus 100 m Rand
  assert.deepEqual(r.groups[1].members, [2]);
  assert.deepEqual(r.unsure, [3]);         // 5 km lang: passt in keinen Kreis (größter Radius 2,2 km)
});

test('reverseName nimmt nur echte Ortsnamen', () => {
  assert.equal(Pruefung.reverseName({ address: { village: 'Musterdorf', county: 'Landkreis X' } }), 'Musterdorf');
  assert.equal(Pruefung.reverseName({ address: { suburb: 'Nord' } }), 'Nord');
  assert.equal(Pruefung.reverseName({ address: { road: 'Feldweg' } }), null);
  assert.equal(Pruefung.reverseName({ error: 'Unable to geocode' }), null);
  assert.equal(Pruefung.reverseName(null), null);
});
