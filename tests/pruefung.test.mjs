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
