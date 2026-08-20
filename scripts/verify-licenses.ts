/**
 * scripts/verify-licenses.ts — the licence gate (§12.3).
 *
 * Wired into `prebuild`. This script FAILS THE BUILD when:
 *   - an asset file exists in a scanned directory with no entry in data/asset-manifest.json
 *   - a manifest entry declares attributionRequired but supplies no attributionText
 *   - a manifest entry declares a licence that is not on the allow-list
 *     (CC-BY-NC, "free for personal use" and unspecified all fail, by design)
 *   - a manifest entry is missing sourceUrl / author / license / verifiedOn
 *   - a vehicle in data/vehicles/*.json references a licenceId that does not exist
 *
 * On success it writes data/generated-credits.json, which the footer credits modal
 * renders from (§12.5).
 *
 * Run directly:  pnpm verify:licenses
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Directories walked for undocumented assets. Paths are repo-root relative. */
const ASSET_ROOTS = [
  'assets-src',
  'public/assets',
  'public/demo-360',
  'public/models',
  'public/posters',
] as const;

/** Extensions the gate is responsible for. */
const TRACKED_EXTENSIONS = ['.glb', '.gltf', '.hdr', '.exr', '.ktx2', '.webp', '.mp3', '.ogg', '.m4a'];

/** Licences Phoenix is commercially permitted to ship. Nothing else passes. */
const ALLOWED_LICENSES = [
  'CC0',
  'CC-BY-4.0',
  'CC-BY-SA-4.0',
  'commercial-purchased',
  'original',
] as const;

const ALLOWED_SOURCE_SITES = [
  'polyhaven',
  'sketchfab',
  'tripo',
  'polypizza',
  'quaternius',
  'kenney',
  'freesound',
  'ambientcg',
  'original',
] as const;

/** Licences that are explicitly rejected, with the reason spelled out for the operator. */
const REJECTED_LICENSE_HINTS: Record<string, string> = {
  'CC-BY-NC': 'non-commercial. Phoenix is a commercial project — this cannot ship.',
  'CC-BY-NC-4.0': 'non-commercial. Phoenix is a commercial project — this cannot ship.',
  'CC-BY-NC-SA-4.0': 'non-commercial. Phoenix is a commercial project — this cannot ship.',
  'CC-BY-ND-4.0': 'no-derivatives. We decimate and re-material every model, so this fails.',
  'free-for-personal-use': 'not a licence. Personal-use terms exclude client work.',
  free: 'not a licence. "Free" without a named licence is unverifiable.',
  unspecified: 'not a licence. Find the licence or discard the asset.',
};

type AssetLicense = {
  assetId: string;
  file: string;
  sourceUrl: string;
  sourceSite: (typeof ALLOWED_SOURCE_SITES)[number];
  author: string;
  license: (typeof ALLOWED_LICENSES)[number];
  attributionRequired: boolean;
  attributionText?: string;
  verifiedOn: string;
  screenshotPath?: string;
  modifications: string;
  /**
   * Files produced FROM `file` by scripts/model/*. One source model yields three
   * LODs, and they all carry the source's licence — listing them here documents
   * every shipped byte without pretending three files are three assets.
   */
  derivedFiles?: string[];
};

const errors: string[] = [];
const warnings: string[] = [];

const fail = (msg: string) => errors.push(msg);
const warn = (msg: string) => warnings.push(msg);

// ---------------------------------------------------------------------------
// 1. Load the manifest
// ---------------------------------------------------------------------------

const manifestPath = join(ROOT, 'data', 'asset-manifest.json');
if (!existsSync(manifestPath)) {
  console.error('\n  LICENCE GATE FAILED\n  data/asset-manifest.json does not exist.\n');
  process.exit(1);
}

let manifest: AssetLicense[];
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as AssetLicense[];
} catch (e) {
  console.error(`\n  LICENCE GATE FAILED\n  data/asset-manifest.json is not valid JSON:\n  ${String(e)}\n`);
  process.exit(1);
}

if (!Array.isArray(manifest)) {
  console.error('\n  LICENCE GATE FAILED\n  data/asset-manifest.json must be a JSON array.\n');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Validate every manifest entry
// ---------------------------------------------------------------------------

const byId = new Map<string, AssetLicense>();
const byFile = new Map<string, AssetLicense>();

/**
 * LOCAL date, not UTC. Hisan verifies licences in Bangladesh (UTC+6): for six hours every
 * evening a licence checked "today" is tomorrow in UTC, and the gate would reject correct
 * entries. A day of slack absorbs the reverse case on a CI box in another zone.
 */
const localDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const today = localDate(1);

for (const [i, entry] of manifest.entries()) {
  const where = `asset-manifest.json[${i}] (${entry?.assetId ?? 'no assetId'})`;

  if (!entry || typeof entry !== 'object') {
    fail(`${where}: not an object.`);
    continue;
  }

  for (const field of ['assetId', 'file', 'sourceUrl', 'sourceSite', 'author', 'license', 'verifiedOn', 'modifications'] as const) {
    if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
      fail(`${where}: "${field}" is required and must be a non-empty string.`);
    }
  }
  if (typeof entry.attributionRequired !== 'boolean') {
    fail(`${where}: "attributionRequired" must be true or false.`);
  }

  if (byId.has(entry.assetId)) fail(`${where}: duplicate assetId "${entry.assetId}".`);
  byId.set(entry.assetId, entry);

  const normalisedFile = entry.file?.split(sep).join(posix.sep);
  if (normalisedFile) {
    if (byFile.has(normalisedFile)) fail(`${where}: duplicate file "${normalisedFile}".`);
    byFile.set(normalisedFile, entry);
  }

  if (entry.derivedFiles !== undefined) {
    if (!Array.isArray(entry.derivedFiles)) {
      fail(`${where}: "derivedFiles" must be an array of repo-relative paths.`);
    } else {
      for (const derived of entry.derivedFiles) {
        const normalisedDerived = String(derived).split(sep).join(posix.sep);
        if (byFile.has(normalisedDerived)) fail(`${where}: duplicate file "${normalisedDerived}".`);
        byFile.set(normalisedDerived, entry);
        // A derived path that no longer exists means the pipeline was re-run and
        // the content hash moved. Left unchecked the manifest silently rots.
        if (!existsSync(join(ROOT, normalisedDerived))) {
          fail(`${where}: derivedFiles entry "${normalisedDerived}" does not exist. Re-run scripts/model/step4-finalize.mjs and update the manifest.`);
        }
      }
    }
  }

  // Licence allow-list. This is the whole point of the gate.
  if (entry.license && !ALLOWED_LICENSES.includes(entry.license)) {
    const hint = REJECTED_LICENSE_HINTS[entry.license] ?? REJECTED_LICENSE_HINTS[entry.license?.toUpperCase?.()];
    fail(
      `${where}: licence "${entry.license}" is not permitted.` +
        (hint ? ` That licence is ${hint}` : ` Allowed: ${ALLOWED_LICENSES.join(', ')}.`),
    );
  }

  if (entry.sourceSite && !ALLOWED_SOURCE_SITES.includes(entry.sourceSite)) {
    fail(`${where}: sourceSite "${entry.sourceSite}" is not a known source. Allowed: ${ALLOWED_SOURCE_SITES.join(', ')}.`);
  }

  if (entry.attributionRequired && !entry.attributionText?.trim()) {
    fail(`${where}: attributionRequired is true but attributionText is empty. Write the credit line the licence demands.`);
  }

  // CC-BY family always requires attribution, whatever the entry claims.
  if (entry.license?.startsWith('CC-BY') && !entry.attributionRequired) {
    fail(`${where}: licence is ${entry.license}, so attributionRequired must be true.`);
  }

  if (entry.sourceSite !== 'original') {
    if (entry.sourceUrl && !/^https?:\/\//.test(entry.sourceUrl)) {
      fail(`${where}: sourceUrl must be the full https:// address of the page the asset came from.`);
    }
    if (!entry.screenshotPath) {
      warn(`${where}: no screenshotPath. Save a screenshot of the licence box — it is the only proof we will have.`);
    }
  }

  if (entry.verifiedOn && !/^\d{4}-\d{2}-\d{2}$/.test(entry.verifiedOn)) {
    fail(`${where}: verifiedOn must be an ISO date, e.g. "2026-08-18".`);
  } else if (entry.verifiedOn > today) {
    fail(`${where}: verifiedOn "${entry.verifiedOn}" is in the future.`);
  }

  if (entry.screenshotPath && !existsSync(join(ROOT, entry.screenshotPath))) {
    warn(`${where}: screenshotPath "${entry.screenshotPath}" does not exist on disk.`);
  }
}

// ---------------------------------------------------------------------------
// 3. Walk the asset directories — every tracked file needs an entry
// ---------------------------------------------------------------------------

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

let scanned = 0;
for (const root of ASSET_ROOTS) {
  for (const full of walk(join(ROOT, root))) {
    const rel = relative(ROOT, full).split(sep).join(posix.sep);
    const ext = rel.slice(rel.lastIndexOf('.')).toLowerCase();
    if (!TRACKED_EXTENSIONS.includes(ext)) continue;
    scanned++;
    if (!byFile.has(rel)) {
      fail(
        `UNDOCUMENTED ASSET: "${rel}" has no entry in data/asset-manifest.json.\n` +
          `      Add one with sourceUrl, author, license, verifiedOn — or delete the file.`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Every vehicle must reference a real licence entry
// ---------------------------------------------------------------------------

const vehicleDir = join(ROOT, 'data', 'vehicles');
if (existsSync(vehicleDir)) {
  for (const name of readdirSync(vehicleDir).filter((f) => f.endsWith('.json'))) {
    const raw = JSON.parse(readFileSync(join(vehicleDir, name), 'utf8')) as { id?: string; licenseId?: string };
    if (!raw.licenseId) {
      fail(`data/vehicles/${name}: missing "licenseId". Every vehicle must name its asset licence (§5).`);
    } else if (!byId.has(raw.licenseId)) {
      fail(`data/vehicles/${name}: licenseId "${raw.licenseId}" is not in data/asset-manifest.json.`);
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Report
// ---------------------------------------------------------------------------

if (warnings.length) {
  console.warn('\n  Licence gate — warnings:');
  for (const w of warnings) console.warn(`    ! ${w}`);
}

if (errors.length) {
  console.error('\n  ══════════════════════════════════════════════════════════════');
  console.error('   LICENCE GATE FAILED — build stopped');
  console.error('  ══════════════════════════════════════════════════════════════\n');
  for (const e of errors) console.error(`    ✗ ${e}`);
  console.error(
    `\n  ${errors.length} problem${errors.length === 1 ? '' : 's'}. ` +
      `Nothing ships until every asset has a verified, commercial-safe licence.\n`,
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 6. Emit credits
// ---------------------------------------------------------------------------

const credits = {
  generatedOn: new Date().toISOString(),
  note: {
    bn: 'এই সাইটে ব্যবহৃত সব ৩ডি মডেল, টেক্সচার, এইচডিআরআই ও শব্দের উৎস ও লাইসেন্স নিচে দেওয়া হলো।',
    en: 'Source and licence for every 3D model, texture, HDRI and sound used on this site.',
  },
  entries: manifest
    .filter((e) => e.sourceSite !== 'original')
    .map((e) => ({
      assetId: e.assetId,
      file: e.file,
      author: e.author,
      license: e.license,
      sourceUrl: e.sourceUrl,
      sourceSite: e.sourceSite,
      attributionText: e.attributionText ?? null,
      modifications: e.modifications,
    })),
  originals: manifest.filter((e) => e.sourceSite === 'original').map((e) => ({ assetId: e.assetId, file: e.file, modifications: e.modifications })),
};

writeFileSync(join(ROOT, 'data', 'generated-credits.json'), `${JSON.stringify(credits, null, 2)}\n`, 'utf8');

console.log(
  `  Licence gate passed — ${manifest.length} manifest ${manifest.length === 1 ? 'entry' : 'entries'}, ` +
    `${scanned} asset file${scanned === 1 ? '' : 's'} scanned, credits written.`,
);
