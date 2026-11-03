// Deterministic PRNG utilities (xmur3 hash + mulberry32 generator).
// Public-domain algorithms, reimplemented locally to keep the project
// dependency-free while still giving good distribution from a string seed.

function xmur3(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function hash() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a) {
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Create a deterministic random number generator from a string seed.
 * Calling the returned function repeatedly yields the same sequence of
 * floats in [0, 1) for a given seed, every time, on every machine.
 * @param {string} seed
 * @returns {() => number}
 */
export function createRng(seed) {
  const seedFn = xmur3(String(seed));
  return mulberry32(seedFn());
}

/**
 * Pick a deterministic integer index in [0, length) from an rng.
 * @param {() => number} rng
 * @param {number} length
 * @returns {number}
 */
export function randomIndex(rng, length) {
  return Math.floor(rng() * length) % length;
}

/**
 * Pick a deterministic integer in [min, max] (inclusive) from an rng.
 * @param {() => number} rng
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
