import test from 'node:test';
import assert from 'node:assert/strict';
import { Planner } from './load.mjs';

test('Planner exportiert endpointNames', () => {
  assert.equal(typeof Planner.endpointNames, 'function');
});
