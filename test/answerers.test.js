import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateFixture } from '../src/fixtures.js';
import { perfectAnswerer, lostInMiddleAnswerer } from '../src/answerers.js';

test('perfectAnswerer always returns the expected answer', () => {
  const fixture = generateFixture({ seed: 'answerer-1', haystackLength: 40 });
  assert.equal(perfectAnswerer(fixture), fixture.answer);
});

test('lostInMiddleAnswerer is correct on an empty haystack', () => {
  const fixture = generateFixture({ seed: 'answerer-2', haystackLength: 0 });
  assert.equal(lostInMiddleAnswerer(fixture), fixture.answer);
});

test('lostInMiddleAnswerer is deterministic for the same fixture', () => {
  const fixture = generateFixture({ seed: 'answerer-3', haystackLength: 30, needleDepth: 0.5 });
  const a = lostInMiddleAnswerer(fixture);
  const b = lostInMiddleAnswerer(fixture);
  assert.equal(a, b);
});

test('lostInMiddleAnswerer golden output for a mid-depth needle with long filler', () => {
  const fixture = generateFixture({ seed: 'golden-lost-single', haystackLength: 60, needleDepth: 0.5 });
  assert.equal(lostInMiddleAnswerer(fixture), 'unknown');
});

test('lostInMiddleAnswerer returns "unknown" on failure, not the real answer', () => {
  const fixture = generateFixture({ seed: 'golden-lost-single', haystackLength: 60, needleDepth: 0.5 });
  const predicted = lostInMiddleAnswerer(fixture);
  assert.notEqual(predicted, fixture.answer);
});
