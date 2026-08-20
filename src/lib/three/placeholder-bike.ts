/**
 * Procedural placeholder motorcycle (§12.4).
 *
 * Shape target per §12.1: a naked commuter, 125–160cc, that reads as an FZ / Pulsar / Hornet.
 * Not a cruiser, not a supersport. This is the beachhead segment (Playbook §1.3A), so it
 * carries the richer part set — every accessory in §6.2 exists in this one tree.
 *
 * MESH NAMES ARE THE CONTRACT (§13 bike convention). Alternate exhausts, seats, handlebars,
 * guards and screens are all present and hidden; options toggle visibility, never files.
 */

import * as THREE from 'three';
import {
  arc,
  blob,
  chamferedBox,
  group,
  mirrorZ,
  panel,
  part,
  shell,
  strut,
  tube,
  tubeX,
  tubeY,
  tyre,
} from './build-helpers';
import { createDefaultMaterials, type DefaultMaterials } from './materials';

const AXLE_FRONT = 0.665;
const AXLE_REAR = -0.67;
const R_FRONT = 0.305;
const R_REAR = 0.315;
const RIM_FRONT = 0.203;
const RIM_REAR = 0.208;
const TYRE_W_FRONT = 0.1;
const TYRE_W_REAR = 0.14;

/**
 * Mudguard arcs, in the angle convention `shell()` produces after its X rotation: theta 0 is
 * the BOTTOM of the wheel and theta π is the top. A guard therefore lives either side of π —
 * sweeping up from 0 puts the shell under the bike, detached, which is not a mudguard.
 */
const FENDER_FRONT_ARC: [number, number] = [Math.PI * 0.74, Math.PI * 0.46];
const FENDER_REAR_ARC: [number, number] = [Math.PI * 0.92, Math.PI * 0.5];
const STEERING_HEAD: [number, number, number] = [0.44, 0.95, 0];

/** Seat height in metres, used by the rider-height check (§6.2). */
export const BIKE_SEAT_HEIGHT = 0.79;

function buildSpokedWheel(name: string, rimRadius: number, m: DefaultMaterials): THREE.Group {
  const children: THREE.Object3D[] = [
    part(name, tube(rimRadius, rimRadius, 0.05, 24), m.alu),
    part(name, tube(0.05, 0.05, 0.11, 14), m.chrome),
  ];
  const spokeGeo = new THREE.BoxGeometry(0.028, rimRadius * 0.86, 0.02);
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    children.push(
      part(name, spokeGeo, m.alu, {
        position: [Math.cos(angle) * rimRadius * 0.48, Math.sin(angle) * rimRadius * 0.48, 0],
        rotation: [0, 0, angle + Math.PI / 2],
      }),
    );
  }
  return group(`${name}_rim`, children);
}

export function buildPlaceholderBike(): THREE.Group {
  const m = createDefaultMaterials();
  const root = new THREE.Group();
  root.name = 'placeholder_motorcycle';

  // --- Wheels and tyres ----------------------------------------------------
  const frontWheel = buildSpokedWheel('wheel_front', RIM_FRONT, m);
  frontWheel.position.set(AXLE_FRONT, R_FRONT, 0);
  root.add(frontWheel);

  const rearWheel = buildSpokedWheel('wheel_rear', RIM_REAR, m);
  rearWheel.position.set(AXLE_REAR, R_REAR, 0);
  root.add(rearWheel);

  // Sidewalls are annuli so the rim shows through — a capped cylinder makes every wheel a
  // black disc and hides the alloys entirely.
  for (const geometry of tyre(R_FRONT, RIM_FRONT, TYRE_W_FRONT)) {
    root.add(part('tyre_front', geometry, m.rubber, { position: [AXLE_FRONT, R_FRONT, 0] }));
  }
  for (const geometry of tyre(R_REAR, RIM_REAR, TYRE_W_REAR)) {
    root.add(part('tyre_rear', geometry, m.rubber, { position: [AXLE_REAR, R_REAR, 0] }));
  }

  // --- Forks and steering --------------------------------------------------
  for (const [name, z] of [['fork_l', -0.085] as const, ['fork_r', 0.085] as const]) {
    root.add(strut(name, [0.5, 0.9, z], [AXLE_FRONT, R_FRONT, z], 0.021, m.chrome));
    root.add(strut(name, [0.52, 0.83, z], [0.61, 0.52, z], 0.028, m.plastic));
  }
  root.add(part('frame', tubeY(0.038, 0.2, 12), m.engine, { position: STEERING_HEAD }));

  // --- Frame ---------------------------------------------------------------
  const spineFront: [number, number, number] = [0.4, 0.9, 0];
  const spineRear: [number, number, number] = [-0.2, 0.78, 0];
  root.add(strut('frame', spineFront, spineRear, 0.034, m.engine));
  root.add(strut('frame', [0.42, 0.86, 0], [0.2, 0.42, 0], 0.03, m.engine));
  root.add(strut('frame', spineRear, [-0.62, 0.86, 0], 0.026, m.engine));
  root.add(strut('frame', [-0.2, 0.72, 0], [-0.55, 0.8, 0], 0.022, m.engine));
  for (const z of [-0.11, 0.11]) {
    root.add(strut('swingarm', [-0.2, 0.42, z], [AXLE_REAR, R_REAR, z], 0.026, m.alu));
  }
  root.add(strut('shock', [-0.24, 0.74, 0], [-0.42, 0.4, 0], 0.03, m.chrome));

  // --- Engine --------------------------------------------------------------
  root.add(part('engine', chamferedBox(0.3, 0.28, 0.3, 0.05), m.engine, { position: [0.16, 0.44, 0] }));
  root.add(part('engine', chamferedBox(0.22, 0.22, 0.26, 0.04), m.engine, { position: [0.28, 0.64, 0], rotation: [0, 0, -0.35] }));
  root.add(part('engine', tube(0.13, 0.13, 0.34, 16), m.engine, { position: [0.06, 0.42, 0] }));

  // --- Bodywork (the paint targets) ---------------------------------------
  root.add(part('tank', blob(0.28, 0.15, 0.19), m.paint, { position: [0.09, 0.87, 0] }));
  root.add(part('tank', chamferedBox(0.34, 0.16, 0.2, 0.07), m.paint, { position: [0.02, 0.79, 0] }));
  // Tank shoulder knee-cutouts, which is most of what makes a tank read as a tank.
  for (const z of [-1, 1]) {
    root.add(part('tank', blob(0.2, 0.1, 0.07), m.paint, { position: [-0.02, 0.8, z * 0.16] }));
  }

  const fairing = group('fairing_l', [
    part('fairing_l', panel(0.26, 0.3, 0.02), m.paint, { rotation: [0, 0.28, 0.2] }),
  ]);
  fairing.position.set(0.4, 0.95, -0.13);
  root.add(fairing);
  root.add(mirrorZ(fairing, 'fairing_r'));

  root.add(part('tail_cowl', chamferedBox(0.42, 0.14, 0.2, 0.06), m.paint, { position: [-0.7, 0.87, 0], rotation: [0, 0, 0.12] }));

  root.add(
    part('fender_front', shell(R_FRONT + 0.032, TYRE_W_FRONT + 0.035, ...FENDER_FRONT_ARC), m.paint, {
      position: [AXLE_FRONT, R_FRONT, 0],
    }),
  );
  root.add(
    part('fender_rear', shell(R_REAR + 0.04, TYRE_W_REAR + 0.04, ...FENDER_REAR_ARC), m.paint, {
      position: [AXLE_REAR, R_REAR, 0],
    }),
  );

  // Decal panel on the tank — the §6.2 tank-pad texture target, off until chosen.
  root.add(part('tankpad', panel(0.24, 0.15, 0.006), m.plastic, { position: [0.07, 1.015, 0], rotation: [Math.PI / 2, 0, 0], visible: false, renderOrder: 1 }));
  root.add(part('badge_tank', panel(0.11, 0.035, 0.006), m.chrome, { position: [0.02, 0.83, 0.19] }));

  // --- Seats: three fitted, one visible (§6.2) -----------------------------
  root.add(
    group('seat_stock', [
      part('seat_stock', chamferedBox(0.46, 0.09, 0.24, 0.045), m.fabric, { position: [-0.36, BIKE_SEAT_HEIGHT, 0] }),
      part('seat_stock', chamferedBox(0.24, 0.08, 0.22, 0.04), m.fabric, { position: [-0.68, BIKE_SEAT_HEIGHT + 0.03, 0] }),
    ]),
  );
  root.add(
    group(
      'seat_gel',
      [part('seat_gel', chamferedBox(0.66, 0.13, 0.27, 0.06), m.fabric, { position: [-0.44, BIKE_SEAT_HEIGHT + 0.02, 0] })],
      { visible: false },
    ),
  );
  root.add(
    group(
      'seat_split',
      [
        part('seat_split', chamferedBox(0.36, 0.09, 0.24, 0.045), m.fabric, { position: [-0.33, BIKE_SEAT_HEIGHT, 0] }),
        part('seat_split', chamferedBox(0.22, 0.1, 0.2, 0.045), m.fabric, { position: [-0.72, BIKE_SEAT_HEIGHT + 0.09, 0], rotation: [0, 0, 0.16] }),
      ],
      { visible: false },
    ),
  );

  // --- Handlebars: three fitted, one visible -------------------------------
  const grip = (name: string, z: number) => part(name, tube(0.028, 0.028, 0.11, 12), m.plastic, { position: [0, 0, z], rotation: [Math.PI / 2, 0, 0] });

  root.add(
    group(
      'handlebar_stock',
      [
        part('handlebar_stock', tube(0.018, 0.018, 0.72, 12), m.alu),
        grip('handlebar_stock', -0.3),
        grip('handlebar_stock', 0.3),
      ],
      { position: [0.42, 1.06, 0] },
    ),
  );
  root.add(
    group(
      'handlebar_clipon',
      [
        part('handlebar_clipon', tubeX(0.017, 0.2, 10), m.alu, { position: [-0.06, 0, -0.19], rotation: [0, 0.25, 0] }),
        part('handlebar_clipon', tubeX(0.017, 0.2, 10), m.alu, { position: [-0.06, 0, 0.19], rotation: [0, -0.25, 0] }),
        grip('handlebar_clipon', -0.24),
        grip('handlebar_clipon', 0.24),
      ],
      { position: [0.46, 0.94, 0], visible: false },
    ),
  );
  root.add(
    group(
      'handlebar_riser',
      [
        part('handlebar_riser', tube(0.019, 0.019, 0.78, 12), m.alu),
        part('handlebar_riser', tubeY(0.02, 0.09, 10), m.alu, { position: [0, -0.05, 0] }),
        grip('handlebar_riser', -0.33),
        grip('handlebar_riser', 0.33),
      ],
      { position: [0.4, 1.16, 0], visible: false },
    ),
  );

  // --- Exhausts: three fitted, stock visible. Each also drives §7.3 audio. --
  root.add(
    group('exhaust_stock', [
      strut('exhaust_stock', [0.2, 0.42, 0.05], [-0.1, 0.3, 0.13], 0.024, m.chrome),
      part('exhaust_stock', tube(0.055, 0.062, 0.44, 16), m.chrome, { position: [-0.42, 0.36, 0.16], rotation: [0, Math.PI / 2, 0.06] }),
    ]),
  );
  root.add(
    group(
      'exhaust_slipon',
      [
        strut('exhaust_slipon', [0.2, 0.42, 0.05], [-0.14, 0.34, 0.14], 0.024, m.chrome),
        part('exhaust_slipon', tube(0.062, 0.07, 0.26, 16), m.alu, { position: [-0.36, 0.42, 0.17], rotation: [0, Math.PI / 2, 0.14] }),
        part('exhaust_slipon', tube(0.072, 0.072, 0.03, 16), m.chrome, { position: [-0.5, 0.44, 0.17], rotation: [0, Math.PI / 2, 0.14] }),
      ],
      { visible: false },
    ),
  );
  root.add(
    group(
      'exhaust_full',
      [
        strut('exhaust_full', [0.3, 0.5, 0.04], [0.34, 0.22, 0.06], 0.026, m.chrome),
        strut('exhaust_full', [0.34, 0.22, 0.06], [-0.1, 0.26, 0.12], 0.026, m.chrome),
        part('exhaust_full', tube(0.058, 0.066, 0.3, 16), m.engine, { position: [-0.36, 0.36, 0.15], rotation: [0, Math.PI / 2, 0.1] }),
        part('exhaust_full', tube(0.068, 0.068, 0.03, 16), m.chrome, { position: [-0.52, 0.38, 0.15], rotation: [0, Math.PI / 2, 0.1] }),
      ],
      { visible: false },
    ),
  );

  // --- Lights --------------------------------------------------------------
  root.add(part('headlight_lens', blob(0.06, 0.11, 0.1), m.lensClear, { position: [0.55, 0.98, 0] }));
  root.add(part('taillight_lens', chamferedBox(0.06, 0.06, 0.14, 0.02), m.lensRed, { position: [-0.9, 0.86, 0] }));

  const auxLight = group('light_aux_l', [
    part('light_aux_l', tube(0.045, 0.045, 0.05, 14), m.lensClear, { rotation: [0, Math.PI / 2, 0] }),
    part('light_aux_l', tube(0.05, 0.05, 0.03, 14), m.plastic, { position: [-0.03, 0, 0], rotation: [0, Math.PI / 2, 0] }),
  ]);
  auxLight.position.set(0.42, 0.62, -0.2);
  auxLight.visible = false;
  root.add(auxLight);
  const auxRight = mirrorZ(auxLight, 'light_aux_r');
  auxRight.visible = false;
  root.add(auxRight);

  // --- Crash guards: near-universal purchase in this market (§6.2) ---------
  const guardStd = group('crashguard_standard', [
    strut('crashguard_standard', [0.3, 0.62, 0.06], [0.28, 0.42, 0.26], 0.019, m.chrome),
    strut('crashguard_standard', [0.28, 0.42, 0.26], [-0.02, 0.36, 0.27], 0.019, m.chrome),
    strut('crashguard_standard', [-0.02, 0.36, 0.27], [-0.04, 0.4, 0.08], 0.019, m.chrome),
  ]);
  guardStd.visible = false;
  root.add(guardStd);
  const guardStdR = mirrorZ(guardStd, 'crashguard_standard');
  guardStdR.visible = false;
  root.add(guardStdR);

  const guardBull = group('crashguard_bull', [
    strut('crashguard_bull', [0.34, 0.68, 0.05], [0.4, 0.36, 0.3], 0.022, m.chrome),
    strut('crashguard_bull', [0.4, 0.36, 0.3], [-0.04, 0.3, 0.31], 0.022, m.chrome),
    strut('crashguard_bull', [-0.04, 0.3, 0.31], [-0.06, 0.42, 0.08], 0.022, m.chrome),
    part('crashguard_bull', arc(0.16, 0.02, Math.PI, -Math.PI / 2), m.chrome, { position: [0.36, 0.5, 0.3], rotation: [0, Math.PI / 2, 0] }),
  ]);
  guardBull.visible = false;
  root.add(guardBull);
  const guardBullR = mirrorZ(guardBull, 'crashguard_bull');
  guardBullR.visible = false;
  root.add(guardBullR);

  // --- Screens -------------------------------------------------------------
  root.add(
    group(
      'windscreen_visor',
      [part('windscreen_visor', panel(0.22, 0.18, 0.012), m.glass, { rotation: [0, 0, 0.5] })],
      { position: [0.5, 1.12, 0], visible: false },
    ),
  );
  root.add(
    group(
      'windscreen_touring',
      [part('windscreen_touring', panel(0.34, 0.4, 0.014), m.glass, { rotation: [0, 0, 0.38] })],
      { position: [0.47, 1.24, 0], visible: false },
    ),
  );

  // --- Footpegs, stand, mirrors -------------------------------------------
  for (const z of [-0.19, 0.19]) {
    root.add(part('footpeg', tube(0.016, 0.016, 0.1, 8), m.alu, { position: [-0.1, 0.36, z] }));
  }
  root.add(strut('sidestand', [-0.14, 0.36, -0.16], [-0.3, 0.02, -0.24], 0.016, m.engine));

  const bikeMirror = group('mirror_l', [
    strut('mirror_l', [0, 0, 0], [0.02, 0.16, -0.1], 0.012, m.plastic),
    part('mirror_l', panel(0.11, 0.07, 0.012), m.chrome, { position: [0.02, 0.17, -0.1], rotation: [0, 0.5, 0] }),
  ]);
  bikeMirror.position.set(0.42, 1.07, -0.2);
  root.add(bikeMirror);
  root.add(mirrorZ(bikeMirror, 'mirror_r'));

  root.updateMatrixWorld(true);
  return root;
}
