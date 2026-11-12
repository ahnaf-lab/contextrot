import { createRng } from './rng.js';

/**
 * A trivial predictor that always returns the correct answer. Useful as a
 * baseline in sweeps and tests: with this answerer, accuracy is 1 at every
 * context length, since there is no degradation to measure.
 * @param {import('./fixtures.js').Fixture} fixture
 * @returns {string}
 */
export function perfectAnswerer(fixture) {
  return fixture.answer;
}

// Controls how quickly the simulated failure probability below saturates
// as filler sentences are added; larger values need more filler before
// accuracy drops noticeably.
const CONTEXT_SATURATION = 20;

/**
 * A deterministic stand-in predictor that simulates the "lost in the
 * middle" effect: it is always correct with an empty haystack, answers
 * correctly more often when the needle sits near either edge, and becomes
 * increasingly likely to fail as more filler sentences are added and the
 * needle sits closer to the exact middle. This lets the sweep runner be
 * exercised and golden-tested without calling any real model.
 * @param {import('./fixtures.js').Fixture} fixture
 * @returns {string}
 */
export function lostInMiddleAnswerer(fixture) {
  const relativePosition =
    fixture.sentenceCount <= 1
      ? 0
      : fixture.needleIndex / (fixture.sentenceCount - 1);
  const distanceFromEdge = Math.min(relativePosition, 1 - relativePosition);
  const contextPressure =
    fixture.sentenceCount / (fixture.sentenceCount + CONTEXT_SATURATION);
  const failureProbability = distanceFromEdge * 2 * contextPressure;

  const rng = createRng(`${fixture.seed}:lost-in-middle`);
  return rng() < failureProbability ? 'unknown' : fixture.answer;
}
