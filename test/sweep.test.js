import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runSweep, sweepToJSON, writeSweepReport } from '../src/sweep.js';
import { perfectAnswerer, lostInMiddleAnswerer } from '../src/answerers.js';
import { containsMatch } from '../src/scorer.js';

test('runSweep with a perfect answerer stays at accuracy 1 across all lengths', () => {
  const result = runSweep({
    answer: perfectAnswerer,
    contextLengths: [0, 10, 50],
    trialsPerLength: 3,
    seed: 'golden-sweep',
  });
  assert.deepEqual(result, {
    seed: 'golden-sweep',
    needleDepth: 0.5,
    trialsPerLength: 3,
    points: [
      { contextLength: 0, accuracy: 1, trials: 3 },
      { contextLength: 10, accuracy: 1, trials: 3 },
      { contextLength: 50, accuracy: 1, trials: 3 },
    ],
  });
});

test('runSweep golden output: lostInMiddleAnswerer degrades as context grows', () => {
  const result = runSweep({
    answer: lostInMiddleAnswerer,
    contextLengths: [0, 10, 20, 50, 100],
    trialsPerLength: 8,
    seed: 'golden-lost',
  });
  assert.deepEqual(result, {
    seed: 'golden-lost',
    needleDepth: 0.5,
    trialsPerLength: 8,
    points: [
      { contextLength: 0, accuracy: 1, trials: 8 },
      { contextLength: 10, accuracy: 0.875, trials: 8 },
      { contextLength: 20, accuracy: 0.375, trials: 8 },
      { contextLength: 50, accuracy: 0.25, trials: 8 },
      { contextLength: 100, accuracy: 0.25, trials: 8 },
    ],
  });
});

test('runSweep is deterministic for the same inputs', () => {
  const options = {
    answer: lostInMiddleAnswerer,
    contextLengths: [0, 15, 30],
    trialsPerLength: 4,
    seed: 'repeat-me',
  };
  assert.deepEqual(runSweep(options), runSweep(options));
});

test('runSweep uses default contextLengths and trialsPerLength when omitted', () => {
  const result = runSweep({ answer: perfectAnswerer, seed: 'defaults' });
  assert.deepEqual(
    result.points.map((p) => p.contextLength),
    [0, 10, 20, 50, 100]
  );
  assert.equal(result.trialsPerLength, 5);
});

test('runSweep rejects a missing answer function', () => {
  assert.throws(() => runSweep({ contextLengths: [0] }), TypeError);
});

test('runSweep rejects a non-function scorer', () => {
  assert.throws(
    () => runSweep({ answer: perfectAnswerer, contextLengths: [0], scorer: 'not-a-function' }),
    TypeError
  );
});

test('runSweep accepts a pluggable scorer in place of the exact-match default', () => {
  const verboseAnswerer = (fixture) => `I think the answer is ${fixture.answer}, probably.`;

  const withExactMatch = runSweep({
    answer: verboseAnswerer,
    contextLengths: [0, 10],
    trialsPerLength: 3,
    seed: 'pluggable-scorer',
  });
  assert.deepEqual(
    withExactMatch.points.map((p) => p.accuracy),
    [0, 0]
  );

  const withContainsMatch = runSweep({
    answer: verboseAnswerer,
    scorer: containsMatch,
    contextLengths: [0, 10],
    trialsPerLength: 3,
    seed: 'pluggable-scorer',
  });
  assert.deepEqual(
    withContainsMatch.points.map((p) => p.accuracy),
    [1, 1]
  );
});

test('runSweep rejects an empty contextLengths array', () => {
  assert.throws(() => runSweep({ answer: perfectAnswerer, contextLengths: [] }), RangeError);
});

test('runSweep rejects a negative context length', () => {
  assert.throws(
    () => runSweep({ answer: perfectAnswerer, contextLengths: [0, -5] }),
    RangeError
  );
});

test('runSweep rejects a non-positive trialsPerLength', () => {
  assert.throws(
    () => runSweep({ answer: perfectAnswerer, contextLengths: [0], trialsPerLength: 0 }),
    RangeError
  );
});

test('sweepToJSON produces parseable JSON matching the sweep result', () => {
  const result = runSweep({
    answer: perfectAnswerer,
    contextLengths: [0, 5],
    trialsPerLength: 2,
    seed: 'json-check',
  });
  const parsed = JSON.parse(sweepToJSON(result));
  assert.deepEqual(parsed, result);
});

test('writeSweepReport writes a JSON file that matches the sweep result', () => {
  const result = runSweep({
    answer: perfectAnswerer,
    contextLengths: [0, 5],
    trialsPerLength: 2,
    seed: 'file-check',
  });
  const filePath = join(tmpdir(), `contextrot-sweep-${process.pid}-${Date.now()}.json`);
  try {
    writeSweepReport(filePath, result);
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    assert.deepEqual(parsed, result);
  } finally {
    rmSync(filePath, { force: true });
  }
});

test('writeSweepReport rejects an empty file path', () => {
  const result = runSweep({ answer: perfectAnswerer, contextLengths: [0] });
  assert.throws(() => writeSweepReport('', result), TypeError);
});
