/**
 * The model code — the vehicle identifier printed on the configurator's panel header.
 *
 * It lives here rather than in `src/lib/vehicles.ts` for one reason: `vehicles.ts` is
 * `server-only`, and the hero resolves the code again on the CLIENT every time the segment
 * toggle flips car → bike. Importing a `server-only` module from a client component is a
 * build error, so the pure function is split out and `vehicles.ts` re-exports it for server
 * callers.
 *
 * Priority: an authored `modelCode` → the slug in caps (hyphens kept, because `SDG-1500`
 * reads as a chassis code and `SDG1500` reads as a typo) → the English name in caps.
 *
 * The result is NEVER localised. `SDG-1500` is what the BRTA papers say in either language,
 * and a code translated into Bangla numerals reads as decoration rather than as a real
 * vehicle identifier (§16 of the brief; §19 forbids it explicitly).
 */

import type { Vehicle, VehicleRecord } from '@/lib/types';

type CodeSource = Pick<VehicleRecord, 'slug' | 'name'> & { modelCode?: string };

export function getModelCode(vehicle: CodeSource | Vehicle): string {
  if (vehicle.modelCode) return vehicle.modelCode;
  if (vehicle.slug) return vehicle.slug.toUpperCase();
  return vehicle.name.en.toUpperCase();
}
