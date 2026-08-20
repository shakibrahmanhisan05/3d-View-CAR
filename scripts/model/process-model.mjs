/**
 * scripts/model/process-model.mjs — the whole vehicle pipeline, one command (§13).
 *
 * The spec asks for this to be a single re-runnable script rather than a sequence of
 * copy-pasted commands, because it gets run every time a client supplies a model.
 *
 *   node scripts/model/process-model.mjs assets-src/sedan-source.glb sedan --yaw 90 --length 4.626 --tris 260000
 *
 * Stages, in order:
 *   1  reduce   decimate + cap texture size          -> .cache/models/<slug>-reduced.glb
 *   3  split    recover §13 semantic part names      -> .cache/models/<slug>-split.glb
 *   5  orient   bake yaw + metric scale              -> .cache/models/<slug>-oriented.glb
 *   4  finalize meshopt, three LODs, hashed names    -> public/models/<slug>-{high,mid,low}.<hash>.glb
 *
 * Stage numbers match the standalone step scripts, which stay runnable on their own for
 * debugging a single stage (`--debug` on step3 dumps colour-coded label renders).
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith('--'));
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};

const [input, slug] = positional;
if (!input || !slug) {
  console.error('usage: process-model.mjs <source.glb> <slug> [--yaw deg] [--length m] [--tris n] [--bike] [--debug]');
  process.exit(1);
}
const yaw = flag('yaw', '0');
const length = flag('length', '');
const tris = flag('tris', '150000');
const isBike = argv.includes('--bike');
const debug = argv.includes('--debug');

const cache = path.join('.cache', 'models');
fs.mkdirSync(cache, { recursive: true });
const reduced = path.join(cache, `${slug}-reduced.glb`);
const split = path.join(cache, `${slug}-split.glb`);
const oriented = path.join(cache, `${slug}-oriented.glb`);

const here = path.dirname(fileURLToPath(import.meta.url));
const run = (script, args) => {
  console.log(`\n=== ${script} ${args.join(' ')} ===`);
  const res = spawnSync(
    process.execPath,
    ['--max-old-space-size=8192', path.join(here, script), ...args],
    { stdio: 'inherit' },
  );
  if (res.status !== 0) {
    console.error(`\n${script} failed with exit code ${res.status}`);
    process.exit(res.status ?? 1);
  }
};

run('step1-reduce.mjs', [input, reduced, tris]);
run('step3-split.mjs', [reduced, split, ...(isBike ? ['--bike'] : []), ...(debug ? ['--debug'] : [])]);
run('step5-orient.mjs', [split, oriented, yaw, length]);
run('step4-finalize.mjs', [oriented, slug]);

console.log(`\nDone. Remember to update data/vehicles/*.json and data/asset-manifest.json:`);
console.log(`  node -e "require('fs').readdirSync('public/models').filter(f=>f.startsWith('${slug}-')).forEach(f=>console.log(f))"`);
