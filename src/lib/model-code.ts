/**
 * The model code — the string the Monolith paints behind the vehicle, and the ModelPlate
 * prints under it.
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

/**
 * Long codes get the narrow width axis so a six-plus-character code still bleeds off both
 * frame edges without wrapping — a monolith that wraps is a monolith that has stopped being
 * a backdrop and started being a paragraph.
 */
export function monolithIsNarrow(code: string): boolean {
  return code.replace(/[^A-Z0-9]/gi, '').length > 6;
}
