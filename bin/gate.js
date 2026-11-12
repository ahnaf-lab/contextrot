#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { checkGate, formatGateReport } from '../src/gate.js';
import { renderAsciiSparkline } from '../src/sparkline.js';

const USAGE =
  'usage: contextrot-gate <sweep-report.json> ' +
  '[--min-accuracy N] [--max-drop N] [--max-relative-drop N]';

const FLAGS = {
  '--min-accuracy': 'minAccuracy',
  '--max-drop': 'maxDrop',
  '--max-relative-drop': 'maxRelativeDrop',
};

/**
 * Parse CLI arguments into a report file path and gate options. Kept as a
 * pure function (no process access) so it can be unit tested directly.
 * @param {string[]} argv - arguments after the script name, e.g.
 *   `process.argv.slice(2)`
 * @returns {{ filePath: string | undefined, options: Object }}
 */
export function parseArgs(argv) {
  const options = {};
  let filePath;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const optionKey = FLAGS[arg];
    if (optionKey) {
      const raw = argv[++i];
      const value = Number(raw);
      if (raw === undefined || Number.isNaN(value)) {
        throw new Error(`${arg} requires a numeric argument`);
      }
      options[optionKey] = value;
    } else if (arg.startsWith('--')) {
      throw new Error(`unknown flag: ${arg}`);
    } else {
      filePath = arg;
    }
  }
  return { filePath, options };
}

function main() {
  let filePath;
  let options;
  try {
    ({ filePath, options } = parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error.message);
    console.error(USAGE);
    process.exitCode = 2;
    return;
  }

  if (!filePath) {
    console.error(USAGE);
    process.exitCode = 2;
    return;
  }

  try {
    const curve = JSON.parse(readFileSync(filePath, 'utf8'));
    const result = checkGate(curve, options);

    console.log(renderAsciiSparkline(curve));
    console.log(formatGateReport(result));

    process.exitCode = result.pass ? 0 : 1;
  } catch (error) {
    console.error(`contextrot-gate: ${error.message}`);
    process.exitCode = 2;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
