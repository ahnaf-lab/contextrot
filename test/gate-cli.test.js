import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseArgs } from '../bin/gate.js';
import { runSweep, sweepToJSON } from '../src/sweep.js';
import { perfectAnswerer, lostInMiddleAnswerer } from '../src/answerers.js';

const binPath = fileURLToPath(new URL('../bin/gate.js', import.meta.url));

function writeTempReport(result) {
  const filePath = join(tmpdir(), `contextrot-gate-${process.pid}-${Date.now()}-${Math.random()}.json`);
  writeFileSync(filePath, sweepToJSON(result));
  return filePath;
}

test('parseArgs reads the report path and numeric flags', () => {
  const { filePath, options } = parseArgs([
    'report.json',
    '--min-accuracy',
    '0.5',
    '--max-drop',
    '0.3',
  ]);
  assert.equal(filePath, 'report.json');
  assert.deepEqual(options, { minAccuracy: 0.5, maxDrop: 0.3 });
});

test('parseArgs rejects an unknown flag', () => {
  assert.throws(() => parseArgs(['report.json', '--bogus']), /unknown flag/);
});

test('parseArgs rejects a non-numeric flag value', () => {
  assert.throws(() => parseArgs(['report.json', '--min-accuracy', 'nope']), /numeric/);
});

test('contextrot-gate exits 0 and prints PASS for a curve within bounds', () => {
  const result = runSweep({
    answer: perfectAnswerer,
    contextLengths: [0, 10, 50],
    trialsPerLength: 3,
    seed: 'golden-sweep',
  });
  const filePath = writeTempReport(result);
  try {
    const output = execFileSync(
      process.execPath,
      [binPath, filePath, '--min-accuracy', '0.9'],
      { encoding: 'utf8' }
    );
    assert.match(output, /PASS/);
    assert.match(output, /███/);
  } finally {
    rmSync(filePath, { force: true });
  }
});

test('contextrot-gate exits non-zero and prints FAIL for a degraded curve', () => {
  const result = runSweep({
    answer: lostInMiddleAnswerer,
    contextLengths: [0, 10, 20, 50, 100],
    trialsPerLength: 8,
    seed: 'golden-lost',
  });
  const filePath = writeTempReport(result);
  try {
    execFileSync(process.execPath, [binPath, filePath, '--min-accuracy', '0.9'], {
      encoding: 'utf8',
    });
    assert.fail('expected contextrot-gate to exit non-zero');
  } catch (error) {
    assert.equal(error.status, 1);
    assert.match(error.stdout, /FAIL/);
  } finally {
    rmSync(filePath, { force: true });
  }
});

test('contextrot-gate exits 2 with usage when no file path is given', () => {
  try {
    execFileSync(process.execPath, [binPath], { encoding: 'utf8' });
    assert.fail('expected contextrot-gate to exit non-zero');
  } catch (error) {
    assert.equal(error.status, 2);
    assert.match(error.stderr, /usage:/);
  }
});
