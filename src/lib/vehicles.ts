/**
 * The data layer. Server-only.
 *
 * Vehicles are stored NORMALISED: a vehicle names its `environmentIds`, `licenseId` and
 * (optionally) `optionGroupIds`, and this module resolves them into the fully-hydrated
 * `Vehicle` the rest of the app consumes. One paint colour is written down in exactly one
 * place — duplicating option definitions per vehicle is what kills you at client four (§5).
 *
 * Files are read from disk rather than statically imported so that adding a vehicle or a
 * prospect is *only* a new JSON file. §10's acceptance test — "a complete branded prospect
 * demo must require editing exactly one JSON file and nothing else" — is not survivable if
 * there is also a registry to update. `outputFileTracingIncludes` in next.config.ts keeps
 * `data/**` in the deployment bundle.
 */

import 'server-only';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type {
  AssetLicense,
  Capture360,
  EnvironmentPreset,
  OptionGroup,
  Prospect,
  Segment,
  Vehicle,
  VehicleRecord,
} from '@/lib/types';
import { groupsForSegment } from '@/lib/configurator/selection';

const DATA_DIR = join(process.cwd(), 'data');

function readJson<T>(...segments: string[]): T {
  return JSON.parse(readFileSync(join(DATA_DIR, ...segments), 'utf8')) as T;
}

function readJsonDir<T>(dir: string): T[] {
  const full = join(DATA_DIR, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(readFileSync(join(full, name), 'utf8')) as T);
}

// Read once per server process. These files never change at runtime.
let cachedGroups: OptionGroup[] | null = null;
let cachedEnvironments: EnvironmentPreset[] | null = null;
let cachedLicenses: AssetLicense[] | null = null;

export function getOptionGroups(): OptionGroup[] {
  cachedGroups ??= readJson<OptionGroup[]>('option-groups.json');
  return cachedGroups;
}

export function getEnvironments(): EnvironmentPreset[] {
  cachedEnvironments ??= readJson<EnvironmentPreset[]>('environments.json');
  return cachedEnvironments;
}

export function getLicenses(): AssetLicense[] {
  cachedLicenses ??= readJson<AssetLicense[]>('asset-manifest.json');
  return cachedLicenses;
}

// ---------------------------------------------------------------------------
// Vehicles
// ---------------------------------------------------------------------------

function hydrate(record: VehicleRecord): Vehicle {
  const allGroups = getOptionGroups();
  const environments = getEnvironments();
  const license = getLicenses().find((entry) => entry.assetId === record.licenseId);

  if (!license) {
    // The licence gate should already have caught this at build time; if we are here, the
    // gate was bypassed and shipping an unlicensed asset is the worse outcome (§12).
    throw new Error(
      `Vehicle "${record.id}" references licenseId "${record.licenseId}", which is not in data/asset-manifest.json.`,
    );
  }

  /*
   * `optionGroupIds` narrows; its absence means "everything this segment supports". The
   * modification segment uses the narrowing to reuse the car body with only wrap, wheels,
   * body kit and tint enabled (§6.3).
   */
  const optionGroups = record.optionGroupIds
    ? record.optionGroupIds
        .map((id) => allGroups.find((group) => group.id === id))
        .filter((group): group is OptionGroup => Boolean(group))
    : groupsForSegment(allGroups, record.segment);

  const { environmentIds, optionGroupIds: _ignored, licenseId: _licenseId, ...rest } = record;

  return {
    ...rest,
    environments: environmentIds
      .map((id) => environments.find((preset) => preset.id === id))
      .filter((preset): preset is EnvironmentPreset => Boolean(preset)),
    optionGroups,
    license,
  };
}

let cachedVehicles: Vehicle[] | null = null;

export function getVehicles(): Vehicle[] {
  cachedVehicles ??= readJsonDir<VehicleRecord>('vehicles').map(hydrate);
  return cachedVehicles;
}

export function getVehicle(id: string): Vehicle | undefined {
  return getVehicles().find((vehicle) => vehicle.id === id || vehicle.slug === id);
}

export function getVehicleBySegment(segment: Segment): Vehicle | undefined {
  return getVehicles().find((vehicle) => vehicle.segment === segment);
}

// ---------------------------------------------------------------------------
// Prospects (§10) — one JSON file per branded demo, nothing else
// ---------------------------------------------------------------------------

export function getProspects(): Prospect[] {
  return readJsonDir<Prospect>('prospects');
}

export function getProspect(slug: string): Prospect | undefined {
  return getProspects().find((prospect) => prospect.slug === slug);
}

// ---------------------------------------------------------------------------
// 360° captures (§8)
// ---------------------------------------------------------------------------

export function getCaptures(): Capture360[] {
  return readJsonDir<Capture360>('captures');
}

export function getCapture(slug: string): Capture360 | undefined {
  return getCaptures().find((capture) => capture.slug === slug || capture.id === slug);
}
