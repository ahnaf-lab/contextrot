import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkGate, formatGateReport } from '../src/gate.js';
import { runSweep } from '../src/sweep.js';
import { perfectAnswerer, lostInMiddleAnswerer } from '../src/answerers.js';

test('checkGate passes a flat curve against a minAccuracy floor', () => {
  const result = runSweep({
    answer: perfectAnswerer,
    contextLengths: [0, 10, 50],
    trialsPerLength: 3,
    seed: 'golden-sweep',
  });
  const gate = checkGate(result, { minAccuracy: 0.9 });
  assert.equal(gate.pass, true);
  assert.deepEqual(gate.violations, []);
  assert.equal(gate.baselineAccuracy, 1);
});

test('checkGate flags every point that falls below minAccuracy', () => {
  const result = runSweep({
    answer: lostInMiddleAnswerer,
    contextLengths: [0, 10, 20, 50, 100],
    trialsPerLength: 8,
    seed: 'golden-lost',
  });
  // Accuracies are [1, 0.875, 0.375, 0.25, 0.25].
  const gate = checkGate(result, { minAccuracy: 0.5 });
  assert.equal(gate.pass, false);
  assert.deepEqual(
    gate.violations.map((v) => v.contextLength),
    [20, 50, 100]
  );
  assert.ok(gate.violations.every((v) => v.rule === 'minAccuracy'));
});

test('checkGate maxDrop bound catches an absolute drop from baseline', () => {
  const result = runSweep({
    answer: lostInMiddleAnswerer,
    contextLengths: [0, 10, 20, 50, 100],
    trialsPerLength: 8,
    seed: 'golden-lost',
  });
  const gate = checkGate(result, { maxDrop: 0.3 });
  assert.equal(gate.pass, false);
  // baseline 1; drops of 0.625, 0.75, 0.75 at contextLength 20/50/100 exceed 0.3.
  assert.deepEqual(
    gate.violations.map((v) => v.contextLength),
    [20, 50, 100]
  );
  assert.ok(gate.violations.every((v) => v.rule === 'maxDrop'));
});

test('checkGate maxRelativeDrop bound catches a fractional drop from baseline', () => {
  const gate = checkGate([1, 0.6, 0.4], { maxRelativeDrop: 0.5 });
  assert.equal(gate.pass, false);
  assert.deepEqual(
    gate.violations.map((v) => v.contextLength),
    [2]
  );
  assert.equal(gate.violations[0].rule, 'maxRelativeDrop');
});

test('checkGate maxRelativeDrop is skipped when baseline accuracy is 0', () => {
  const gate = checkGate([0, 0, 0.5], { maxRelativeDrop: 0.1 });
  assert.equal(gate.pass, true);
});

test('checkGate accepts a plain accuracy array and SweepPoint array', () => {
  const fromArray = checkGate([1, 0.2], { minAccuracy: 0.5 });
  assert.equal(fromArray.pass, false);
  assert.equal(fromArray.violations[0].contextLength, 1);

  const fromPoints = checkGate(
    [
      { contextLength: 0, accuracy: 1 },
      { contextLength: 25, accuracy: 0.2 },
    ],
    { minAccuracy: 0.5 }
  );
  assert.equal(fromPoints.pass, false);
  assert.equal(fromPoints.violations[0].contextLength, 25);
});

test('checkGate combines multiple bounds into one violation list', () => {
  const gate = checkGate([1, 0.1], { minAccuracy: 0.5, maxDrop: 0.2 });
  assert.equal(gate.pass, false);
  assert.equal(gate.violations.length, 2);
  assert.deepEqual(
    gate.violations.map((v) => v.rule).sort(),
    ['maxDrop', 'minAccuracy']
  );
});

test('checkGate throws when no bound is configured', () => {
  assert.throws(() => checkGate([1, 0.5]), TypeError);
});

test('checkGate rejects out-of-range bounds', () => {
  assert.throws(() => checkGate([1, 0.5], { minAccuracy: 1.5 }), RangeError);
  assert.throws(() => checkGate([1, 0.5], { maxDrop: -0.1 }), RangeError);
  assert.throws(() => checkGate([1, 0.5], { maxRelativeDrop: 2 }), RangeError);
});

test('checkGate rejects an empty curve', () => {
  assert.throws(() => checkGate([], { minAccuracy: 0.5 }), RangeError);
});

test('checkGate is deterministic for the same curve and bounds', () => {
  const result = runSweep({
    answer: lostInMiddleAnswerer,
    contextLengths: [0, 20, 100],
    trialsPerLength: 4,
    seed: 'repeat-gate',
  });
  const options = { minAccuracy: 0.5, maxRelativeDrop: 0.4 };
  assert.deepEqual(checkGate(result, options), checkGate(result, options));
});

test('formatGateReport reports PASS with no violation lines', () => {
  const report = formatGateReport({ pass: true, baselineAccuracy: 1, violations: [] });
  assert.match(report, /^PASS/);
  assert.equal(report.split('\n').length, 1);
});

test('formatGateReport reports FAIL with one line per violation', () => {
  const report = formatGateReport({
    pass: false,
    baselineAccuracy: 1,
    violations: [
      { rule: 'minAccuracy', contextLength: 20, accuracy: 0.3, bound: 0.5 },
      { rule: 'maxDrop', contextLength: 50, accuracy: 0.2, bound: 0.3 },
    ],
  });
  const lines = report.split('\n');
  assert.match(lines[0], /^FAIL: 2 /);
  assert.match(lines[1], /minAccuracy/);
  assert.match(lines[1], /contextLength=20/);
  assert.match(lines[2], /maxDrop/);
  assert.match(lines[2], /contextLength=50/);
});
