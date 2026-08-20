/**
 * Procedural placeholder sedan (§12.4).
 *
 * Shape target per §12.1: a mid-size 4-door sedan that reads as an Axio / Premio / Allion.
 * Not a supercar, not an SUV. A Chattogram dealer has to look at it and see his own stock.
 *
 * MESH NAMES ARE THE CONTRACT. Every name below is from the §13 car convention. When Hisan's
 * real GLB lands, it carries these same names and the vehicle JSON changes — no component
 * changes. If a swap ever requires editing a component, this abstraction is wrong (§15 Phase 6).
 *
 * Alternate parts (four wheel designs, body kit, wraps) all live in this one tree, hidden by
 * default, toggled by visibility. That is why one file generates forty configurations.
 */

import * as THREE from 'three';
import {
  arc,
  chamferedBox,
  edgeAngle,
  edgeLength,
  edgeMid,
  group,
  mirrorZ,
  panel,
  part,
  profileExtrude,
  slab,
  strut,
  tube,
  tubeX,
  tubeY,
  tyre,
} from './build-helpers';
import { createDefaultMaterials, type DefaultMaterials } from './materials';

const BODY_WIDTH = 1.62;
const CABIN_WIDTH = 1.44;
// Track is wider than the body's half-width minus a tyre: the wheels must sit PROUD of the
// bodywork or they vanish inside the extrusion and the car reads as a slab on the floor.
const TRACK = 0.775;
const AXLE_FRONT = 1.35;
const AXLE_REAR = -1.35;
const WHEEL_R = 0.325;
/** Where the rubber ends and the alloy begins — the tyre's sidewalls are cut to this. */
const RIM_R = 0.212;
const TYRE_W = 0.215;

/** Waistline silhouette: rear bumper → boot → cowl → bonnet → front bumper → underfloor. */
const LOWER_PROFILE: Array<[number, number]> = [
  [-2.24, 0.44],
  [-2.22, 0.74],
  [-2.06, 0.94],
  [-0.55, 1.01],
  [0.94, 0.97],
  [1.74, 0.85],
  [2.16, 0.72],
  [2.24, 0.5],
  [2.18, 0.3],
  [1.4, 0.24],
  [-1.4, 0.24],
  [-2.18, 0.3],
];

/** Greenhouse hard points: windscreen base → roof → rear screen base. */
const WINDSCREEN_BASE: [number, number] = [0.96, 0.95];
const ROOF_FRONT: [number, number] = [0.26, 1.43];
const ROOF_REAR: [number, number] = [-0.9, 1.45];
const REAR_SCREEN_BASE: [number, number] = [-1.84, 1.0];


// ---------------------------------------------------------------------------
// Wheels — four designs, all present, one visible
// ---------------------------------------------------------------------------

type RimDesign = 'sport' | 'touring' | 'classic' | 'turbine';

/**
 * A rim, built as one merged-looking group. Each design is a different spoke arrangement on
 * the same hub so the visibility swap between them reads as a real wheel change.
 */
function buildRim(design: RimDesign, m: DefaultMaterials, name: string): THREE.Group {
  // Brushed alloy, never chrome: a mirror rim sunk in a wheel well reflects the dark room
  // and reads as a black hole, hiding the very option the client is paying for.
  const face = m.alu;
  const children: THREE.Object3D[] = [
    part(name, tube(RIM_R, RIM_R, TYRE_W * 0.5, 24), face),
    part(name, tube(0.075, 0.075, TYRE_W * 0.72, 16), m.chrome),
  ];

  const spokes: Record<RimDesign, { count: number; width: number; thickness: number; skew: number }> = {
    sport: { count: 5, width: 0.055, thickness: 0.03, skew: 0 },
    touring: { count: 10, width: 0.024, thickness: 0.022, skew: 0 },
    classic: { count: 6, width: 0.09, thickness: 0.018, skew: 0 },
    turbine: { count: 8, width: 0.062, thickness: 0.026, skew: 0.32 },
  };

  const { count, width, thickness, skew } = spokes[design];
  const spokeGeo = new THREE.BoxGeometry(width, 0.135, thickness);

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const spoke = part(name, spokeGeo, face, {
      position: [Math.cos(angle) * 0.135, Math.sin(angle) * 0.135, 0],
      rotation: [0, skew, angle + Math.PI / 2],
    });
    children.push(spoke);
  }

  // Classic wheels wear a hubcap rather than showing the spokes.
  if (design === 'classic') {
    children.push(part(name, tube(0.155, 0.155, 0.02, 24), m.chrome, { position: [0, 0, TYRE_W * 0.3] }));
  }

  return group(`${name}_rim`, children);
}

function buildWheelset(design: RimDesign, m: DefaultMaterials, id: string): THREE.Group {
  const positions: Array<[string, number, number]> = [
    ['wheel_fl', AXLE_FRONT, -TRACK],
    ['wheel_fr', AXLE_FRONT, TRACK],
    ['wheel_rl', AXLE_REAR, -TRACK],
    ['wheel_rr', AXLE_REAR, TRACK],
  ];

  return group(
    id,
    positions.map(([name, x, z]) => {
      const rim = buildRim(design, m, name);
      rim.position.set(x, WHEEL_R, z);
      return rim;
    }),
  );
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

export function buildPlaceholderCar(): THREE.Group {
  const m = createDefaultMaterials();
  const root = new THREE.Group();
  root.name = 'placeholder_sedan';

  // --- Body ----------------------------------------------------------------
  root.add(part('body_paint', profileExtrude(LOWER_PROFILE, BODY_WIDTH, 0.07), m.paint));

  // Sills, which stop the body reading as a floating slab.
  for (const z of [-1, 1]) {
    root.add(
      part('body_paint', chamferedBox(2.6, 0.14, 0.1, 0.03), m.paint, {
        position: [0, 0.34, z * (BODY_WIDTH / 2 - 0.05)],
      }),
    );
  }

  /*
   * GREENHOUSE AS A SHELL, NOT A SOLID.
   *
   * Extruding the cabin profile as a solid block is the cheap way, and it is why primitive
   * cars look like toys: the windows become painted-on panels and there is nothing behind
   * them. Building roof + pillars and leaving the apertures OPEN means you see the seats and
   * the dashboard through the glass — which is also what makes the §7.1 interior view
   * possible against the same geometry rather than a second scene.
   */
  const PILLAR_Z = CABIN_WIDTH / 2 - 0.04;

  root.add(
    part('body_paint', chamferedBox(1.24, 0.07, CABIN_WIDTH, 0.05), m.paint, {
      position: [-0.31, 1.42, 0],
      rotation: [0, 0, -0.017],
    }),
  );

  for (const z of [-PILLAR_Z, PILLAR_Z]) {
    // A-pillar, along the windscreen edge.
    root.add(strut('body_paint', [0.98, 0.9, z], [0.28, 1.4, z], 0.048, m.paint));
    // B-pillar.
    root.add(strut('body_paint', [-0.34, 0.9, z], [-0.34, 1.43, z], 0.042, m.paint));
    // C-pillar, along the rear screen edge.
    root.add(strut('body_paint', [-0.9, 1.43, z], [-1.8, 0.98, z], 0.055, m.paint));
    // Cant rail joining them along the roof edge.
    root.add(strut('body_paint', [0.3, 1.4, z], [-0.92, 1.42, z], 0.038, m.paint));
  }

  // --- Glass: now it actually fills an aperture -----------------------------
  const glassSpec: Array<[string, [number, number], [number, number], number]> = [
    ['glass_windshield', WINDSCREEN_BASE, ROOF_FRONT, CABIN_WIDTH - 0.06],
    ['glass_rear', ROOF_REAR, REAR_SCREEN_BASE, CABIN_WIDTH - 0.1],
  ];

  for (const [name, a, b, width] of glassSpec) {
    const [x, y] = edgeMid(a, b);
    root.add(
      part(name, slab(edgeLength(a, b) * 1.02, width, 0.016), m.glass, {
        position: [x, y, 0],
        rotation: [0, 0, edgeAngle(a, b)],
        renderOrder: 2,
      }),
    );
  }

  // Front and rear door glass, split by the B-pillar.
  for (const z of [-1, 1]) {
    root.add(
      part('glass_side', panel(0.62, 0.44, 0.016), m.glass, {
        position: [0.0, 1.16, z * PILLAR_Z],
        renderOrder: 2,
      }),
    );
    root.add(
      part('glass_side', panel(0.86, 0.42, 0.016), m.glass, {
        position: [-0.79, 1.15, z * PILLAR_Z],
        renderOrder: 2,
      }),
    );
  }

  // --- Trim ----------------------------------------------------------------
  for (const z of [-1, 1]) {
    root.add(
      part('chrome_trim', chamferedBox(1.9, 0.035, 0.03, 0.012), m.chrome, {
        position: [-0.26, 0.96, z * (CABIN_WIDTH / 2 + 0.02)],
      }),
    );
  }
  root.add(part('chrome_trim', chamferedBox(0.1, 0.16, 1.1, 0.02), m.chrome, { position: [2.16, 0.66, 0] }));
  root.add(part('chrome_trim', chamferedBox(0.12, 0.1, 1.2, 0.02), m.chrome, { position: [-2.18, 0.62, 0] }));

  // --- Lamps ---------------------------------------------------------------
  for (const z of [-1, 1]) {
    root.add(
      part('headlight_lens', chamferedBox(0.12, 0.11, 0.42, 0.035), m.lensClear, {
        position: [2.14, 0.7, z * 0.52],
      }),
    );
    root.add(
      part('taillight_lens', chamferedBox(0.09, 0.13, 0.44, 0.035), m.lensRed, {
        position: [-2.2, 0.8, z * 0.55],
      }),
    );
  }

  // --- Mirrors -------------------------------------------------------------
  const mirror = group('mirror_l', [
    part('body_paint', chamferedBox(0.14, 0.08, 0.05, 0.02), m.paint, { position: [0.03, 0.01, 0.06] }),
    part('body_paint', chamferedBox(0.09, 0.11, 0.16, 0.03), m.paint),
    part('chrome_trim', panel(0.08, 0.09, 0.01), m.chrome, { position: [-0.045, 0, 0], rotation: [0, Math.PI / 2, 0] }),
  ]);
  mirror.position.set(0.84, 1.0, -(CABIN_WIDTH / 2 + 0.11));
  root.add(mirror);
  root.add(mirrorZ(mirror, 'mirror_r'));

  // --- Badges (§13: kept as separate nodes so they can be toggled off per client) ---
  root.add(part('badge_front', tube(0.055, 0.055, 0.018, 16), m.chrome, { position: [2.21, 0.68, 0], rotation: [0, Math.PI / 2, 0] }));
  root.add(part('badge_rear', tube(0.055, 0.055, 0.018, 16), m.chrome, { position: [-2.24, 0.78, 0], rotation: [0, Math.PI / 2, 0] }));

  // --- Interior (visible through the glass; drives §7.1) --------------------
  // Sized to sit UNDER the windscreen rather than through it: the cowl is at x 0.96, and a
  // dash that reaches past it pokes out over the bonnet as a black bar.
  root.add(part('interior_dash', chamferedBox(0.36, 0.16, 1.26, 0.05), m.plastic, { position: [0.7, 0.99, 0] }));
  // Steering wheel: the torus lies in XY, so yaw it onto the X axis inside a group whose own
  // Z rotation supplies the column rake. Composing both on one Euler would cancel out.
  root.add(
    group('interior_dash', [part('interior_dash', arc(0.15, 0.016, Math.PI * 2), m.plastic, { rotation: [0, Math.PI / 2, 0] })], {
      position: [0.5, 1.03, -0.34],
      rotation: [0, 0, 0.35],
    }),
  );

  const seat = group('interior_seats', [
    part('interior_seats', chamferedBox(0.5, 0.12, 0.48, 0.05), m.fabric, { position: [0, 0.72, 0] }),
    part('interior_seats', chamferedBox(0.14, 0.6, 0.48, 0.05), m.fabric, { position: [-0.24, 1.0, 0], rotation: [0, 0, -0.12] }),
    part('interior_seats', chamferedBox(0.13, 0.18, 0.26, 0.05), m.fabric, { position: [-0.3, 1.33, 0] }),
  ]);
  for (const z of [-0.36, 0.36]) {
    const s = seat.clone(true);
    s.position.set(0.16, 0, z);
    root.add(s);
  }
  root.add(
    group('interior_seats', [
      part('interior_seats', chamferedBox(0.52, 0.12, 1.3, 0.05), m.fabric, { position: [-0.75, 0.7, 0] }),
      part('interior_seats', chamferedBox(0.14, 0.56, 1.3, 0.05), m.fabric, { position: [-1.0, 0.96, 0], rotation: [0, 0, -0.1] }),
    ]),
  );

  // --- Wheels: four designs in one file, one visible (§13) ------------------
  root.add(buildWheelset('sport', m, 'wheelset_sport'));
  root.add(buildWheelset('touring', m, 'wheelset_touring'));
  root.add(buildWheelset('classic', m, 'wheelset_classic'));
  root.add(buildWheelset('turbine', m, 'wheelset_turbine'));
  for (const id of ['wheelset_touring', 'wheelset_classic', 'wheelset_turbine']) {
    const g = root.getObjectByName(id);
    if (g) g.visible = false;
  }

  // Sidewalls are annuli, so the rim behind them is visible. See `tyre()`.
  const tyreParts = tyre(WHEEL_R, RIM_R, TYRE_W);
  const tyres: Array<[string, number, number]> = [
    ['tyre_fl', AXLE_FRONT, -TRACK],
    ['tyre_fr', AXLE_FRONT, TRACK],
    ['tyre_rl', AXLE_REAR, -TRACK],
    ['tyre_rr', AXLE_REAR, TRACK],
  ];
  for (const [name, x, z] of tyres) {
    for (const geometry of tyreParts) {
      root.add(part(name, geometry, m.rubber, { position: [x, WHEEL_R, z] }));
    }
  }

  // Wheel arch lips, so the wheels sit in the body rather than beside it.
  for (const x of [AXLE_FRONT, AXLE_REAR]) {
    for (const z of [-1, 1]) {
      root.add(
        part('body_paint', arc(0.4, 0.035, Math.PI), m.paint, {
          position: [x, WHEEL_R + 0.01, z * (BODY_WIDTH / 2 - 0.01)],
        }),
      );
    }
  }

  // --- Body kit: present, hidden, toggled by §6.1 --------------------------
  root.add(
    group(
      'spoiler',
      [
        part('spoiler', chamferedBox(0.24, 0.05, 1.36, 0.02), m.paint, { position: [0, 0.14, 0] }),
        part('spoiler', chamferedBox(0.09, 0.14, 0.07, 0.02), m.paint, { position: [0.02, 0.05, -0.5] }),
        part('spoiler', chamferedBox(0.09, 0.14, 0.07, 0.02), m.paint, { position: [0.02, 0.05, 0.5] }),
      ],
      { position: [-2.0, 0.94, 0], visible: false },
    ),
  );

  root.add(
    group(
      'bullbar',
      [
        part('bullbar', tube(0.035, 0.035, 1.26, 12), m.chrome),
        part('bullbar', tubeY(0.035, 0.44, 12), m.chrome, { position: [0, 0.22, 0] }),
        part('bullbar', tubeY(0.03, 0.5, 10), m.chrome, { position: [-0.02, 0.14, -0.42] }),
        part('bullbar', tubeY(0.03, 0.5, 10), m.chrome, { position: [-0.02, 0.14, 0.42] }),
      ],
      { position: [2.28, 0.5, 0], visible: false },
    ),
  );

  root.add(
    group(
      'roofrack',
      [
        part('roofrack', tubeX(0.026, 1.5, 10), m.alu, { position: [0, 0, -0.56] }),
        part('roofrack', tubeX(0.026, 1.5, 10), m.alu, { position: [0, 0, 0.56] }),
        part('roofrack', tube(0.022, 0.022, 1.14, 10), m.alu, { position: [0.6, 0, 0] }),
        part('roofrack', tube(0.022, 0.022, 1.14, 10), m.alu, { position: [-0.6, 0, 0] }),
      ],
      { position: [-0.3, 1.5, 0], visible: false },
    ),
  );

  root.add(
    group(
      'sidesteps',
      [
        part('sidesteps', chamferedBox(2.0, 0.08, 0.16, 0.03), m.alu, { position: [0, 0, -0.9] }),
        part('sidesteps', chamferedBox(2.0, 0.08, 0.16, 0.03), m.alu, { position: [0, 0, 0.9] }),
      ],
      { position: [0, 0.3, 0], visible: false },
    ),
  );

  root.add(part('exhaust_tip', tube(0.045, 0.05, 0.16, 14), m.chrome, { position: [-2.2, 0.32, 0.52] }));

  root.updateMatrixWorld(true);
  return root;
}
