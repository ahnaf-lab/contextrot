import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderAsciiSparkline, renderSvgSparkline } from '../src/sparkline.js';
import { runSweep } from '../src/sweep.js';
import { perfectAnswerer, lostInMiddleAnswerer } from '../src/answerers.js';

test('renderAsciiSparkline golden output on the lost-in-the-middle sweep', () => {
  const result = runSweep({
    answer: lostInMiddleAnswerer,
    contextLengths: [0, 10, 20, 50, 100],
    trialsPerLength: 8,
    seed: 'golden-lost',
  });
  // Accuracies are [1, 0.875, 0.375, 0.25, 0.25]; quantized into 8 levels.
  assert.equal(renderAsciiSparkline(result), '██▄▃▃');
});

test('renderAsciiSparkline is flat at the top for a perfect answerer', () => {
  const result = runSweep({
    answer: perfectAnswerer,
    contextLengths: [0, 10, 50],
    trialsPerLength: 3,
    seed: 'golden-sweep',
  });
  assert.equal(renderAsciiSparkline(result), '███');
});

test('renderAsciiSparkline accepts a raw accuracy array', () => {
  assert.equal(renderAsciiSparkline([0, 0.5, 1]), '▁▅█');
});

test('renderAsciiSparkline accepts a raw SweepPoint array', () => {
  assert.equal(
    renderAsciiSparkline([{ contextLength: 0, accuracy: 0, trials: 1 }, { contextLength: 1, accuracy: 1, trials: 1 }]),
    '▁█'
  );
});

test('renderAsciiSparkline rejects an empty curve', () => {
  assert.throws(() => renderAsciiSparkline([]), RangeError);
  assert.throws(() => renderAsciiSparkline({ points: [] }), RangeError);
});

test('renderAsciiSparkline rejects an out-of-range accuracy', () => {
  assert.throws(() => renderAsciiSparkline([1.5]), RangeError);
  assert.throws(() => renderAsciiSparkline([-0.1]), RangeError);
});

test('renderAsciiSparkline is deterministic for the same sweep result', () => {
  const result = runSweep({
    answer: lostInMiddleAnswerer,
    contextLengths: [0, 20, 100],
    trialsPerLength: 4,
    seed: 'repeat-sparkline',
  });
  assert.equal(renderAsciiSparkline(result), renderAsciiSparkline(result));
});

test('renderSvgSparkline golden output with simple custom options', () => {
  const svg = renderSvgSparkline([0, 1], { width: 100, height: 10, gap: 0 });
  assert.equal(
    svg,
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="10" viewBox="0 0 100 10">' +
      '<rect x="0" y="10" width="50" height="0" />' +
      '<rect x="50" y="0" width="50" height="10" />' +
      '</svg>'
  );
});

test('renderSvgSparkline defaults produce one rect per point and valid dimensions', () => {
  const result = runSweep({
    answer: perfectAnswerer,
    contextLengths: [0, 10, 50],
    trialsPerLength: 3,
    seed: 'golden-sweep',
  });
  const svg = renderSvgSparkline(result);
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="160" height="32" viewBox="0 0 160 32">/);
  assert.equal(svg.match(/<rect/g).length, 3);
  assert.ok(svg.endsWith('</svg>'));
});

test('renderSvgSparkline rejects invalid options', () => {
  assert.throws(() => renderSvgSparkline([0, 1], { width: 0 }), RangeError);
  assert.throws(() => renderSvgSparkline([0, 1], { height: -5 }), RangeError);
  assert.throws(() => renderSvgSparkline([0, 1], { gap: -1 }), RangeError);
});

test('renderSvgSparkline rejects a width too small for the given points and gap', () => {
  assert.throws(() => renderSvgSparkline([0, 0.5, 1], { width: 1, gap: 5 }), RangeError);
});

test('renderSvgSparkline rejects an empty curve', () => {
  assert.throws(() => renderSvgSparkline([]), RangeError);
});
