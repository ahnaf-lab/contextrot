import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, randomIndex, randomInt } from '../src/rng.js';

test('createRng is deterministic for a given seed', () => {
  const a = createRng('rng-test');
  const b = createRng('rng-test');
  const seqA = [a(), a(), a()];
  const seqB = [b(), b(), b()];
  assert.deepEqual(seqA, seqB);
});

test('createRng golden sequence for seed "rng-test"', () => {
  const rng = createRng('rng-test');
  const seq = [rng(), rng(), rng()];
  assert.deepEqual(seq, [
    0.18827050598338246,
    0.2775838759262115,
    0.48481821129098535,
  ]);
});

test('createRng produces different sequences for different seeds', () => {
  const a = createRng('seed-a')();
  const b = createRng('seed-b')();
  assert.notEqual(a, b);
});

test('randomIndex stays within bounds', () => {
  const rng = createRng('bounds-check');
  for (let i = 0; i < 50; i++) {
    const index = randomIndex(rng, 7);
    assert.ok(index >= 0 && index < 7);
  }
});

test('randomInt stays within inclusive bounds', () => {
  const rng = createRng('int-bounds-check');
  for (let i = 0; i < 50; i++) {
    const value = randomInt(rng, 1000, 9999);
    assert.ok(value >= 1000 && value <= 9999);
  }
});
