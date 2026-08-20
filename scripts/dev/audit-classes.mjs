/**
 * Dev-only: cross-check every Tailwind class used in src/ against the CSS Tailwind actually
 * generated. Not wired into any build script.
 *
 *   curl -s http://localhost:3000/_next/static/css/app/%5Blocale%5D/layout.css -o /tmp/ph.css
 *   node scripts/dev/audit-classes.mjs /tmp/ph.css
 *
 * Why this exists: Tailwind silently ignores a class it does not recognise. `font-700` looks
 * exactly like a real utility, compiles without a warning, and renders at weight 400 — so an
 * entire site can lose its typographic hierarchy with nothing anywhere reporting a problem.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const cssPath = process.argv[2] ?? '/tmp/ph.css';
const css = readFileSync(cssPath, 'utf8');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(full)) out.push(full);
  }
  return out;
}

const tokens = new Map();

for (const file of walk('src')) {
  const src = readFileSync(file, 'utf8');
  for (const match of src.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/gs)) {
    const raw = (match[1] ?? match[2] ?? match[3] ?? '')
      .replace(/\$\{[^}]*\}/g, ' ') // drop interpolations; they are conditionals, not classes
      .replace(/[?:]/g, ' ');

    for (const token of raw.split(/\s+/)) {
      if (!token || token.length > 60) continue;
      if (!/^[a-z[-]/.test(token)) continue;
      if (!tokens.has(token)) tokens.set(token, new Set());
      tokens.get(token).add(file.split('\\').join('/'));
    }
  }
}

/** Escape a class name for use inside a selector-matching regex. */
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\/:%#!,&<>'"=@~]/g, (c) => `\\${c}`);

const VARIANTS =
  /^(?:sm|md|lg|xl|2xl|max-sm|max-md|max-lg|hover|focus|focus-visible|focus-within|active|disabled|first|last|odd|even|group-open|group-hover|peer-checked|dark|print|motion-safe|motion-reduce|has-\[[^\]]*\]|\[[^\]]*\]):/;

const missing = [];

for (const [token, where] of tokens) {
  let base = token;
  // Strip any number of stacked variants: `sm:hover:bg-x` → `bg-x`.
  let guard = 0;
  while (VARIANTS.test(base) && guard++ < 6) base = base.replace(VARIANTS, '');
  if (!base) continue;

  // Arbitrary values (`w-[4.5rem]`) and CSS-var syntax are always emitted verbatim; a literal
  // match on the escaped name is enough to confirm Tailwind produced a rule for it.
  const selector = new RegExp(`\\.${escape(base)}(?![\\w-])`);
  if (!selector.test(css)) missing.push([token, [...where]]);
}

console.log(`checked ${tokens.size} distinct class tokens against ${cssPath}\n`);

if (!missing.length) {
  console.log('  every class used in src/ has a matching rule in the compiled CSS.\n');
  process.exit(0);
}

console.log(`  NOT PRESENT IN COMPILED CSS — these silently do nothing (${missing.length}):\n`);
for (const [token, where] of missing.sort((a, b) => b[1].length - a[1].length)) {
  console.log(`    ${token.padEnd(30)} ${String(where.length).padStart(2)} file(s)   e.g. ${where[0].replace('src/', '')}`);
}
console.log('');
