const BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/**
 * Extract accuracy values from the curve-like shapes used elsewhere in this
 * project: a SweepResult (`{ points: [...] }`), a raw array of SweepPoints
 * (`{ accuracy, ... }`), or a plain array of accuracy numbers. This lets
 * both renderers work directly on whatever `runSweep` already returns,
 * without forcing the caller to unwrap it first.
 * @param {*} curve
 * @returns {number[]}
 */
function toAccuracies(curve) {
  const points = Array.isArray(curve) ? curve : curve && curve.points;
  if (!Array.isArray(points) || points.length === 0) {
    throw new RangeError(
      'curve must be a non-empty SweepResult, SweepPoint array, or accuracy array'
    );
  }
  return points.map((point) => {
    const accuracy = typeof point === 'number' ? point : point && point.accuracy;
    if (typeof accuracy !== 'number' || Number.isNaN(accuracy) || accuracy < 0 || accuracy > 1) {
      throw new RangeError(`accuracy must be a number between 0 and 1, got ${accuracy}`);
    }
    return accuracy;
  });
}

/**
 * Render a degradation curve (accuracy vs context length) as a one-line
 * Unicode sparkline, one block character per point. Each accuracy is
 * quantized into 8 levels (▁ lowest .. █ highest), so the same curve always
 * renders to the exact same string - safe to snapshot-test.
 * @param {*} curve - a SweepResult, a SweepPoint array, or an array of
 *   accuracy numbers (each in [0, 1])
 * @returns {string}
 */
export function renderAsciiSparkline(curve) {
  const accuracies = toAccuracies(curve);
  return accuracies
    .map((accuracy) => BLOCKS[Math.min(BLOCKS.length - 1, Math.floor(accuracy * BLOCKS.length))])
    .join('');
}

/**
 * Render a degradation curve as a minimal, dependency-free SVG sparkline:
 * one bar per point, height proportional to accuracy. Every coordinate is
 * rounded to 2 decimal places and dimensions are fixed by `options`, so the
 * same curve and options always render the exact same markup - safe to
 * snapshot-test.
 * @param {*} curve - a SweepResult, a SweepPoint array, or an array of
 *   accuracy numbers (each in [0, 1])
 * @param {Object} [options]
 * @param {number} [options.width=160] - total SVG width in px
 * @param {number} [options.height=32] - total SVG height in px
 * @param {number} [options.gap=1] - gap in px between bars
 * @returns {string} a self-contained `<svg>...</svg>` document
 */
export function renderSvgSparkline(curve, options = {}) {
  const { width = 160, height = 32, gap = 1 } = options;
  if (!Number.isFinite(width) || width <= 0) {
    throw new RangeError('options.width must be a positive number');
  }
  if (!Number.isFinite(height) || height <= 0) {
    throw new RangeError('options.height must be a positive number');
  }
  if (!Number.isFinite(gap) || gap < 0) {
    throw new RangeError('options.gap must be a non-negative number');
  }

  const accuracies = toAccuracies(curve);
  const n = accuracies.length;
  const barWidth = (width - gap * (n - 1)) / n;
  if (barWidth <= 0) {
    throw new RangeError('width is too small to fit this many points with the given gap');
  }

  const round = (value) => Math.round(value * 100) / 100;

  const bars = accuracies
    .map((accuracy, index) => {
      const x = round(index * (barWidth + gap));
      const barHeight = round(accuracy * height);
      const y = round(height - barHeight);
      return `<rect x="${x}" y="${y}" width="${round(barWidth)}" height="${barHeight}" />`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${bars}</svg>`;
}
