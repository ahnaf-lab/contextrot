import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, exactMatch, scoreBatch } from '../src/scorer.js';

test('normalize trims, lowercases, collapses whitespace, strips trailing punctuation', () => {
  assert.equal(normalize('  Amber-1234.  '), 'amber-1234');
  assert.equal(normalize('Quartz   5026!'), 'quartz 5026');
});

test('exactMatch is case- and whitespace-insensitive', () => {
  assert.equal(exactMatch('  Amber-1234.  ', 'amber-1234'), true);
  assert.equal(exactMatch('AMBER-1234', 'amber-1234'), true);
});

test('exactMatch rejects a genuinely different answer', () => {
  assert.equal(exactMatch('amber-1235', 'amber-1234'), false);
});

test('scoreBatch computes accuracy as a fraction of exact matches', () => {
  const { accuracy, results } = scoreBatch([
    { predicted: 'amber-1234', expected: 'amber-1234' },
    { predicted: 'wrong', expected: 'amber-1234' },
    { predicted: 'Amber-1234!', expected: 'amber-1234' },
  ]);
  assert.equal(accuracy, 2 / 3);
  assert.deepEqual(results, [true, false, true]);
});

test('scoreBatch returns 0 accuracy for an empty batch', () => {
  const { accuracy, results } = scoreBatch([]);
  assert.equal(accuracy, 0);
  assert.deepEqual(results, []);
});
