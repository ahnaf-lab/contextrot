import { writeFileSync } from 'node:fs';
import { generateFixture } from './fixtures.js';
import { scoreBatch } from './scorer.js';

/**
 * @typedef {Object} SweepPoint
 * @property {number} contextLength - haystack length (number of filler
 *   sentences) this point was measured at
 * @property {number} accuracy - fraction of trials answered correctly
 * @property {number} trials - number of trials averaged into this point
 */

/**
 * @typedef {Object} SweepResult
 * @property {string} seed - base seed used to derive per-trial seeds
 * @property {number} needleDepth - needle depth used for every fixture
 * @property {number} trialsPerLength - trials averaged per context length
 * @property {SweepPoint[]} points - one point per context length, in the
 *   order contextLengths was given
 */

/**
 * Sweep a range of context (haystack) lengths, scoring a predictor against
 * seeded needle/haystack fixtures at each length, and return an
 * accuracy-vs-context-length curve.
 *
 * Every fixture is generated from a seed derived deterministically from
 * `seed`, the context length, and the trial index, so the same options
 * always produce the exact same curve - which is what makes the result
 * safe to snapshot-test.
 *
 * @param {Object} options
 * @param {(fixture: import('./fixtures.js').Fixture) => string} options.answer
 *   predictor under test: given a fixture, returns a predicted answer
 * @param {number[]} [options.contextLengths] - haystack lengths to sweep
 * @param {number} [options.trialsPerLength=5] - fixtures averaged per length
 * @param {number} [options.needleDepth=0.5] - needle depth for every fixture
 * @param {string} [options.seed='sweep'] - base seed for the sweep
 * @returns {SweepResult}
 */
export function runSweep(options = {}) {
  const {
    answer,
    contextLengths = [0, 10, 20, 50, 100],
    trialsPerLength = 5,
    needleDepth = 0.5,
    seed = 'sweep',
  } = options;

  if (typeof answer !== 'function') {
    throw new TypeError('options.answer must be a function(fixture) => string');
  }
  if (!Array.isArray(contextLengths) || contextLengths.length === 0) {
    throw new RangeError('options.contextLengths must be a non-empty array');
  }
  if (!Number.isInteger(trialsPerLength) || trialsPerLength < 1) {
    throw new RangeError('options.trialsPerLength must be a positive integer');
  }

  const points = contextLengths.map((contextLength) => {
    if (!Number.isInteger(contextLength) || contextLength < 0) {
      throw new RangeError('every contextLength must be a non-negative integer');
    }

    const pairs = [];
    for (let trial = 0; trial < trialsPerLength; trial++) {
      const fixture = generateFixture({
        seed: `${seed}:${contextLength}:${trial}`,
        haystackLength: contextLength,
        needleDepth,
      });
      pairs.push({ predicted: answer(fixture), expected: fixture.answer });
    }

    const { accuracy } = scoreBatch(pairs);
    return { contextLength, accuracy, trials: trialsPerLength };
  });

  return {
    seed: String(seed),
    needleDepth,
    trialsPerLength,
    points,
  };
}

/**
 * Serialize a sweep result to a JSON string.
 * @param {SweepResult} result
 * @returns {string}
 */
export function sweepToJSON(result) {
  return JSON.stringify(result, null, 2);
}

/**
 * Run a sweep and write its JSON representation to a file. The caller
 * chooses and owns `filePath`; this is a thin convenience wrapper around
 * `sweepToJSON` and does no path resolution of its own.
 * @param {string} filePath
 * @param {SweepResult} result
 */
export function writeSweepReport(filePath, result) {
  if (typeof filePath !== 'string' || filePath.length === 0) {
    throw new TypeError('filePath must be a non-empty string');
  }
  writeFileSync(filePath, `${sweepToJSON(result)}\n`, 'utf8');
}
