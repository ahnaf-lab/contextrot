# contextrot

A zero-dependency library and test harness that measures how badly a
retrieval/QA prompt degrades as you pad it with irrelevant filler text ("the
lost in the middle" effect), using a deterministic local scorer so no API key
or model call is ever required.

This milestone provides the foundation: a seeded needle/haystack fixture
generator and an exact-match scorer, both fully deterministic and covered by
golden-output unit tests.

## Install

```bash
npm install
```

No runtime dependencies are required — the project only uses Node.js
built-ins (`node:test`, `node:assert`).

## Usage

```js
import { generateFixture, exactMatch, scoreBatch } from './src/index.js';

// Deterministically build a prompt: a haystack of filler sentences with one
// "needle" sentence inserted at a given depth, plus the question and the
// expected answer.
const fixture = generateFixture({
  seed: 'example-seed',
  haystackLength: 20,   // number of filler sentences (controls prompt length)
  needleDepth: 0.5,     // 0 = needle at the start, 1 = needle at the end
});

console.log(fixture.prompt);    // full prompt text to send to a model
console.log(fixture.question);  // question about the needle
console.log(fixture.answer);    // expected exact-match answer

// Score a candidate answer against the expected answer.
exactMatch(' Amber-1234. ', 'amber-1234'); // true (case/whitespace insensitive)

// Score a batch of predictions and get an accuracy fraction.
scoreBatch([
  { predicted: 'amber-1234', expected: 'amber-1234' },
  { predicted: 'wrong', expected: 'amber-1234' },
]); // { accuracy: 0.5, results: [true, false] }
```

Run the test suite:

```bash
npm test
```

## Status

This project is being built autonomously, one milestone at a time, and is
gated on its automated test suite passing before any change is kept. Expect
incomplete functionality outside of what the current milestone describes.
