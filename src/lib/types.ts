/**
 * Phoenix domain model (§5).
 *
 * STORAGE SHAPE vs RUNTIME SHAPE
 * ------------------------------
 * The JSON on disk is normalised: a vehicle stores `licenseId`, `environmentIds` and
 * (optionally) `optionGroupIds` as string references. `src/lib/vehicles.ts` resolves those
 * against `data/asset-manifest.json`, `data/environments.json` and `data/option-groups.json`
 * and hands the rest of the app the fully-hydrated `Vehicle` described in the spec.
 *
 * This exists so there is exactly one place a paint colour or a licence line is written down.
 * Duplicating option definitions per vehicle is what kills you at client four.
 */

export type Locale = 'bn' | 'en';

/** Every user-visible string in the system carries both languages. No exceptions (§16). */
export type Localized = { bn: string; en: string };

export type Vec3 = [number, number, number];

export type Segment = 'car' | 'motorcycle' | 'modification';

// ---------------------------------------------------------------------------
// Licensing (§12.3)
// ---------------------------------------------------------------------------

export type LicenseName = 'CC0' | 'CC-BY-4.0' | 'CC-BY-SA-4.0' | 'commercial-purchased' | 'original';

export type SourceSite =
  | 'polyhaven'
  | 'sketchfab'
  | 'polypizza'
  | 'quaternius'
  | 'kenney'
  | 'freesound'
  | 'ambientcg'
  | 'original';

export type AssetLicense = {
  assetId: string;
  file: string;
  sourceUrl: string;
  sourceSite: SourceSite;
  author: string;
  license: LicenseName;
  attributionRequired: boolean;
  attributionText?: string;
  /** ISO date Hisan personally opened the licence page and read it. */
  verifiedOn: string;
  screenshotPath?: string;
  modifications: string;
};

// ---------------------------------------------------------------------------
// Materials and effects
// ---------------------------------------------------------------------------

export type PBRMaterialSpec = {
  color: string;
  metalness: number;
  roughness: number;
  /** Essential for realistic automotive paint. This, not polygon count, is what sells it. */
  clearcoat?: number;
  clearcoatRoughness?: number;
  /** Window tint (§6.1). */
  opacity?: number;
  transmission?: number;
  /** LED headlights and auxiliary fog lamps (§6.2). */
  emissive?: string;
  emissiveIntensity?: number;
};

/**
 * An Effect mutates the already-loaded scene. It NEVER swaps the model file.
 * `scale` is an addition to the spec's transform effect — §6.2 calls for a wide-profile
 * tyre option, which is a scale change on an existing mesh, not a new mesh.
 */
export type Effect =
  | { kind: 'material'; targetMeshes: string[]; material: PBRMaterialSpec }
  | { kind: 'visibility'; targetMeshes: string[]; visible: boolean }
  | { kind: 'texture'; targetMeshes: string[]; map: string }
  | { kind: 'transform'; targetMeshes: string[]; position?: Vec3; rotation?: Vec3; scale?: Vec3 }
  | { kind: 'sound'; soundId: string };

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export type Option = {
  id: string;
  /** Real manufacturer paint names — 'Attitude Black Mica', not 'Dark'. */
  label: Localized;
  priceDeltaBDT: number;
  swatchHex?: string;
  thumbnailUrl?: string;
  /** Rendered small under the swatch on the paint-chip strip. */
  note?: Localized;
  effects: Effect[];
};

export type OptionGroupType = 'swatch' | 'thumbnail' | 'toggle-list';

export type OptionGroup = {
  id: string;
  /** Gutter code printed beside the group, auction-sheet style: 'OPT-PAINT'. */
  code: string;
  label: Localized;
  type: OptionGroupType;
  appliesTo: Segment[];
  required: boolean;
  multiSelect: boolean;
  /** Only meaningful for required single-select groups. */
  defaultOptionId?: string;
  options: Option[];
};

// ---------------------------------------------------------------------------
// Environment (§7.2)
// ---------------------------------------------------------------------------

export type EnvironmentId = 'showroom' | 'street' | 'sunset' | 'night';

export type EnvironmentPreset = {
  id: EnvironmentId;
  label: Localized;
  /**
   * Poly Haven CC0 HDRI, pre-converted, ≤1 MB. OPTIONAL: when absent the scene falls back to
   * a procedural Lightformer rig keyed off `id`. The rig costs zero bytes and needs no network,
   * which is why the build ships without HDRIs and upgrades to them by editing this field only.
   */
  hdriUrl?: string;
  groundColor: string;
  groundRoughness: number;
  exposure: number;
  /** The colour of the bay behind the vehicle. */
  background: string;
};

// ---------------------------------------------------------------------------
// Hotspots — the hand-annotated damage diagram, not marketing callouts (§3)
// ---------------------------------------------------------------------------

export type Hotspot = {
  id: string;
  /** The numeral printed inside the pin. */
  index: number;
  label: Localized;
  detail?: Localized;
  position: Vec3;
  /** When set, the pin shows only while one of these options is selected. */
  visibleWithOptions?: string[];
};

// ---------------------------------------------------------------------------
// Vehicle
// ---------------------------------------------------------------------------

export type SpecRow = { key: Localized; value: Localized };

export type SoundSet = { idleUrl: string; revUrl: string; label: Localized };

export type VehicleAsset = {
  /** R2 URL. Absent → the procedural placeholder named by `placeholder` is rendered (§12.4). */
  glbUrl?: string;
  /** [high, mid, low] */
  lodUrls?: string[];
  /** iOS AR Quick Look needs a .usdz; Android Scene Viewer takes the .glb above (§2). */
  usdzUrl?: string;
  /** Static hero render, <40 kB WebP/AVIF. Absent → an inline SVG poster is generated. */
  posterUrl?: string;
  placeholder?: 'car' | 'motorcycle';
  /**
   * [halfWidth, halfHeight] in metres of the vehicle as it sits in the bay. The camera rig
   * solves its lens from this so the vehicle fills the frame consistently on a 3:1 hero, a
   * 1.4:1 demo panel and a portrait phone (see CameraRig `solveFraming`). Omit and the rig
   * falls back to the authored 42 degree lens.
   */
  frameExtent?: [number, number];
  scale: number;
  cameraStart: Vec3;
  cameraTarget: Vec3;
  /** Cars only (§7.1). Absent → the interior toggle renders disabled with a 'coming soon' state. */
  interiorCamera?: Vec3;
  minDistance: number;
  maxDistance: number;
};

/** What actually sits in data/vehicles/*.json. */
export type VehicleRecord = {
  id: string;
  slug: string;
  name: Localized;
  segment: Segment;
  asset: VehicleAsset;
  environmentIds: EnvironmentId[];
  /** Optional restriction. When absent, every option group matching `segment` applies. */
  optionGroupIds?: string[];
  sound?: SoundSet;
  /** Keyed by the soundId an Effect selects — one entry per exhaust option (§7.3). */
  sounds?: Record<string, SoundSet>;
  basePriceBDT: number;
  hotspots: Hotspot[];
  specs: SpecRow[];
  /** Motorcycles only — drives the rider height check (§6.2). */
  seatHeightMm?: number;
  licenseId: string;
};

/** What the app consumes. */
export type Vehicle = Omit<VehicleRecord, 'environmentIds' | 'optionGroupIds' | 'licenseId'> & {
  environments: EnvironmentPreset[];
  optionGroups: OptionGroup[];
  license: AssetLicense;
};

// ---------------------------------------------------------------------------
// Configuration state
// ---------------------------------------------------------------------------

/** groupId → selected optionId(s). Single-select groups hold exactly one id. */
export type Selection = Record<string, string[]>;

export type PriceLine = { id: string; label: Localized; amountBDT: number };

// ---------------------------------------------------------------------------
// Prospects (§10)
// ---------------------------------------------------------------------------

export type Prospect = {
  slug: string;
  businessName: Localized;
  logoUrl?: string;
  /** Overrides --ph-signal across the entire site. One variable retints everything. */
  brandAccent: string;
  whatsapp: string;
  phone: string;
  address: Localized;
  segment: Segment;
  heroVehicleId: string;
  vehicleIds: string[];
  /** ISO date. Enforces the 14-day demo window (Playbook §7.3). */
  expiresAt: string;
  ownerName?: string;
};

// ---------------------------------------------------------------------------
// 360° capture (§8)
// ---------------------------------------------------------------------------

export type Frame360Hotspot = {
  id: string;
  label: Localized;
  detail?: Localized;
  /** Percentage of the frame, 0–100. */
  x: number;
  y: number;
  /** Inclusive frame range this pin is visible across — the visibility arc. */
  fromFrame: number;
  toFrame: number;
  severity: 'note' | 'defect';
};

export type Capture360 = {
  id: string;
  slug: string;
  title: Localized;
  frameCount: number;
  /** printf-style, e.g. '/demo-360/axio/frame-%s.webp' where %s is a 2-digit index. */
  framePattern: string;
  width: number;
  height: number;
  auctionGrade: string;
  specs: SpecRow[];
  hotspots: Frame360Hotspot[];
  priceBDT: number;
  licenseId: string;
};
