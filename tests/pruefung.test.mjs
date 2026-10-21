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
  const exam = { format: 'trailplaner-pruefung', version: 1, savedAt: '2026-10-22T10:00:00Z', placeName: 'Musterdorf',
    center: { lat: 49.65, lon: 9.95 }, settings: { radius: 1200, minDist: 30, terrain: 'ort', allowPaths: false, avoidLoops: true, startTime: '10:00' },
    date: '2026-10-31', trails: [{ level: 'MT-I', ll: [[49.65, 9.95], [49.651, 9.951]], length: 305, turns: 1, decisions: 1, crossings: 0,
      steps: [{ at: 0, kind: 'start', text: 'Start' }], startStreet: 'Industriestraße', endStreet: 'Bavariastraße', checked: true }],
    names: { teams: { 'MT-I': ['Anna mit Luna'], 'MT-II': [], 'MT-III': [] }, vps: ['VP1'] }, assign: [{ team: 'Anna mit Luna', vp: 'VP1' }] };
  assert.deepEqual(Pruefung.parseExam(Pruefung.serializeExam(exam)), exam);
});

test('parseExam lehnt fremde und kaputte Dateien mit deutscher Meldung ab', () => {
  assert.throws(() => Pruefung.parseExam('<gpx></gpx>'), /kein gespeicherter Trailplan/);
  assert.throws(() => Pruefung.parseExam('{"format":"x"}'), /kein gespeicherter Trailplan/);
  assert.throws(() => Pruefung.parseExam('{"format":"trailplaner-pruefung","version":2,"trails":[]}'), /neueren Version/);
  assert.throws(() => Pruefung.parseExam('{"format":"trailplaner-pruefung","version":1,"trails":[{"level":"MT-I","ll":[[1,2]]}]}'), /Trail 1 hat keine Strecke/);
});

test('parseExam ergänzt fehlende Zuteilung und Namenslisten', () => {
  const ex = Pruefung.parseExam('{"format":"trailplaner-pruefung","version":1,"trails":[{"level":"MT-II","ll":[[1,2],[1,3]]}]}');
  assert.deepEqual(ex.assign, [{ team: '', vp: '' }]);
  assert.deepEqual(ex.names, { teams: { 'MT-I': [], 'MT-II': [], 'MT-III': [] }, vps: [] });
  assert.equal(ex.trails[0].checked, false);
});
