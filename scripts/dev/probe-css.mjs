/** Dev-only: list the class selectors Tailwind actually emitted, and probe specific ones. */

import { readFileSync } from 'node:fs';

const css = readFileSync(process.argv[2] ?? '/tmp/ph.css', 'utf8');

const selectors = new Set(
  [...css.matchAll(/\.((?:\\.|[^\s,{:>+~()[\]])+)/g)].map((m) => m[1].replace(/\\/g, '')),
);

console.log('distinct class selectors in compiled CSS:', selectors.size, '\n');

for (const probe of process.argv.slice(3)) {
  console.log(`  ${selectors.has(probe) ? 'OK     ' : 'MISSING'}  ${probe}`);
}
