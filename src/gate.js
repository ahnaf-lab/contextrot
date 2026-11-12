/**
 * @typedef {Object} GateViolation
 * @property {string} rule - which bound was violated: 'minAccuracy',
 *   'maxDrop', or 'maxRelativeDrop'
 * @property {number} contextLength - the point's haystack length
 * @property {number} accuracy - the point's accuracy
 * @property {number} bound - the configured threshold that was crossed
 */

/**
 * @typedef {Object} GateResult
 * @property {boolean} pass - true if no violations were found
 * @property {number} baselineAccuracy - accuracy of the first point, used
 *   as the reference for maxDrop and maxRelativeDrop
 * @property {GateViolation[]} violations
 */

/**
 * Extract `{ contextLength, accuracy }` points from the curve-like shapes
 * used elsewhere in this project: a SweepResult (`{ points: [...] }`), a raw
 * array of SweepPoints, or a plain array of accuracy numbers (in which case
 * the array index stands in for contextLength).
 * @param {*} curve
 * @returns {{ contextLength: number, accuracy: number }[]}
 */
function extractPoints(curve) {
  const points = Array.isArray(curve) ? curve : curve && curve.points;
  if (!Array.isArray(points) || points.length === 0) {
    throw new RangeError(
      'curve must be a non-empty SweepResult, SweepPoint array, or accuracy array'
    );
  }
  return points.map((point, index) => {
    const isBareNumber = typeof point === 'number';
    const accuracy = isBareNumber ? point : point && point.accuracy;
    if (typeof accuracy !== 'number' || Number.isNaN(accuracy) || accuracy < 0 || accuracy > 1) {
      throw new RangeError(`accuracy must be a number between 0 and 1, got ${accuracy}`);
    }
    const contextLength = isBareNumber || typeof point.contextLength !== 'number'
      ? index
      : point.contextLength;
    return { contextLength, accuracy };
  });
}

function isValidBound(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

/**
 * Check an accuracy-vs-context-length curve against configured degradation
 * bounds, the way a CI gate would. This is a pure function of the curve and
 * the bounds - no network calls, no file I/O - so it is deterministic and
 * safe to unit test directly.
 *
 * At least one bound must be supplied:
 * - `minAccuracy`: every point's accuracy must be >= this floor.
 * - `maxDrop`: no point's accuracy may fall more than this much below the
 *   baseline (the first point in the curve).
 * - `maxRelativeDrop`: no point's accuracy may fall more than this fraction
 *   below the baseline (e.g. 0.5 means it may not drop below half of
 *   baseline). Skipped if the baseline accuracy is 0.
 *
 * @param {*} curve - a SweepResult, a SweepPoint array, or an array of
 *   accuracy numbers (each in [0, 1])
 * @param {Object} options
 * @param {number} [options.minAccuracy]
 * @param {number} [options.maxDrop]
 * @param {number} [options.maxRelativeDrop]
 * @returns {GateResult}
 */
export function checkGate(curve, options = {}) {
  const { minAccuracy, maxDrop, maxRelativeDrop } = options;

  if (minAccuracy !== undefined && !isValidBound(minAccuracy)) {
    throw new RangeError('options.minAccuracy must be a number between 0 and 1');
  }
  if (maxDrop !== undefined && !isValidBound(maxDrop)) {
    throw new RangeError('options.maxDrop must be a number between 0 and 1');
  }
  if (maxRelativeDrop !== undefined && !isValidBound(maxRelativeDrop)) {
    throw new RangeError('options.maxRelativeDrop must be a number between 0 and 1');
  }
  if (minAccuracy === undefined && maxDrop === undefined && maxRelativeDrop === undefined) {
    throw new TypeError(
      'checkGate requires at least one of options.minAccuracy, options.maxDrop, or options.maxRelativeDrop'
    );
  }

  const points = extractPoints(curve);
  const baselineAccuracy = points[0].accuracy;
  const violations = [];

  for (const point of points) {
    if (minAccuracy !== undefined && point.accuracy < minAccuracy) {
      violations.push({
        rule: 'minAccuracy',
        contextLength: point.contextLength,
        accuracy: point.accuracy,
        bound: minAccuracy,
      });
    }

    if (maxDrop !== undefined) {
      const drop = baselineAccuracy - point.accuracy;
      if (drop > maxDrop) {
        violations.push({
          rule: 'maxDrop',
          contextLength: point.contextLength,
          accuracy: point.accuracy,
          bound: maxDrop,
        });
      }
    }

    if (maxRelativeDrop !== undefined && baselineAccuracy > 0) {
      const relativeDrop = (baselineAccuracy - point.accuracy) / baselineAccuracy;
      if (relativeDrop > maxRelativeDrop) {
        violations.push({
          rule: 'maxRelativeDrop',
          contextLength: point.contextLength,
          accuracy: point.accuracy,
          bound: maxRelativeDrop,
        });
      }
    }
  }

  return { pass: violations.length === 0, baselineAccuracy, violations };
}

/**
 * Render a GateResult as a short, human-readable report suitable for CI
 * logs: a PASS/FAIL header followed by one line per violation.
 * @param {GateResult} result
 * @returns {string}
 */
export function formatGateReport(result) {
  if (result.pass) {
    return `PASS: curve stayed within bounds (baseline accuracy ${result.baselineAccuracy})`;
  }
  const header = `FAIL: ${result.violations.length} degradation bound(s) exceeded (baseline accuracy ${result.baselineAccuracy})`;
  const lines = result.violations.map(
    (v) =>
      `  - [${v.rule}] at contextLength=${v.contextLength}: accuracy ${v.accuracy} violates bound ${v.bound}`
  );
  return [header, ...lines].join('\n');
}
