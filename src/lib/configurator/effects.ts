/**
 * The effect engine (§5, "non-negotiable implementation rules").
 *
 * THE TWO RULES THAT MATTER
 * 1. The model is NEVER remounted on an option change. We traverse the already-loaded scene
 *    graph and mutate `mesh.material` / `object.visible` imperatively. A colour change is
 *    zero network, zero re-parse, under one frame.
 * 2. Materials are built ONCE at load into a Map, never inside a render pass.
 *
 * HOW A SELECTION IS APPLIED
 * Restore every object to the state the model was authored in (from a snapshot taken at
 * load), then apply the effects of the selected options in group order. Restoring first is
 * what makes the result independent of the order options were clicked in — the alternative,
 * each option knowing how to undo every other option, is the bug factory that kills these
 * things at client four.
 *
 * MATCHING
 * - `material` / `texture` effects match MESHES by exact name.
 * - `visibility` / `transform` effects match ANY object by exact name, so a name can address
 *   a whole group (`wheelset_touring`, `bullbar`) — which is how one GLB holds every variant.
 */

import * as THREE from 'three';
import { buildMaterial } from '@/lib/three/materials';
import type { Effect, OptionGroup, Selection } from '@/lib/types';
import { getProceduralTexture, isProcedural, proceduralId } from './textures';

// ---------------------------------------------------------------------------
// Snapshot
// ---------------------------------------------------------------------------

export type SceneSnapshot = {
  materials: Map<THREE.Mesh, THREE.Material | THREE.Material[]>;
  visibility: Map<THREE.Object3D, boolean>;
  transforms: Map<THREE.Object3D, { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3 }>;
  /** name → objects, so applying an effect is a Map hit, not a full traverse. */
  byName: Map<string, THREE.Object3D[]>;
  meshesByName: Map<string, THREE.Mesh[]>;
};

/**
 * GLTFLoader guarantees unique names: the second mesh called `body_paint` is loaded as
 * `body_paint_1`, the third as `body_paint_2`, and so on (`createUniqueName`).
 *
 * A real vehicle has eight or nine separately-modelled painted panels, and naming them all
 * `body_paint` is exactly how you express "one paint option drives all of these". Without
 * this, only the first panel a loader happened to reach would take the colour — which is
 * precisely what happened: tapping a paint chip repainted the bumpers and left the doors,
 * roof and bonnet in the factory colour.
 *
 * So every object is indexed under its base name as well as its loaded name.
 */
const BASE_NAME = /_\d+$/;
function indexName(map: Map<string, THREE.Object3D[]>, name: string, object: THREE.Object3D) {
  const list = map.get(name);
  if (list) list.push(object);
  else map.set(name, [object]);
}

export function snapshotScene(root: THREE.Object3D): SceneSnapshot {
  const snapshot: SceneSnapshot = {
    materials: new Map(),
    visibility: new Map(),
    transforms: new Map(),
    byName: new Map(),
    meshesByName: new Map(),
  };

  root.traverse((object) => {
    snapshot.visibility.set(object, object.visible);
    snapshot.transforms.set(object, {
      position: object.position.clone(),
      rotation: object.rotation.clone(),
      scale: object.scale.clone(),
    });

    if (object.name) {
      indexName(snapshot.byName, object.name, object);
      const base = object.name.replace(BASE_NAME, '');
      if (base !== object.name && base) indexName(snapshot.byName, base, object);
    }

    const mesh = object as THREE.Mesh;
    if (mesh.isMesh) {
      snapshot.materials.set(mesh, mesh.material);
      if (mesh.name) {
        const meshes = snapshot.meshesByName as unknown as Map<string, THREE.Object3D[]>;
        indexName(meshes, mesh.name, mesh);
        const base = mesh.name.replace(BASE_NAME, '');
        if (base !== mesh.name && base) indexName(meshes, base, mesh);
      }
    }
  });

  return snapshot;
}

function restore(snapshot: SceneSnapshot) {
  for (const [mesh, material] of snapshot.materials) mesh.material = material;
  for (const [object, visible] of snapshot.visibility) object.visible = visible;
  for (const [object, t] of snapshot.transforms) {
    object.position.copy(t.position);
    object.rotation.copy(t.rotation);
    object.scale.copy(t.scale);
  }
}

// ---------------------------------------------------------------------------
// Material cache — built once, at load
// ---------------------------------------------------------------------------

export type MaterialCache = Map<string, THREE.MeshPhysicalMaterial>;

function cacheKey(groupId: string, optionId: string, index: number) {
  return `${groupId}:${optionId}:${index}`;
}

/**
 * Every material the vehicle can ever wear, constructed up front. Roughly one
 * MeshPhysicalMaterial per option — a few dozen — which costs nothing at load and removes
 * all allocation from the interaction path.
 */
export function buildMaterialCache(groups: OptionGroup[]): MaterialCache {
  const cache: MaterialCache = new Map();

  for (const group of groups) {
    for (const option of group.options) {
      option.effects.forEach((effect, index) => {
        if (effect.kind !== 'material') return;
        cache.set(
          cacheKey(group.id, option.id, index),
          buildMaterial(effect.material, `${group.id}_${option.id}`),
        );
      });
    }
  }

  return cache;
}

export function disposeMaterialCache(cache: MaterialCache) {
  for (const material of cache.values()) material.dispose();
  cache.clear();
}

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

/**
 * Everything the engine needs to mutate the scene, created once per loaded vehicle.
 * `clones` exists because `texture` effects must clone the material they sit on top of —
 * without tracking them, cycling wraps leaks one MeshPhysicalMaterial per click.
 */
export type EffectRuntime = {
  snapshot: SceneSnapshot;
  cache: MaterialCache;
  clones: Set<THREE.Material>;
};

/**
 * Carry the authored normal map from the model onto every option material.
 *
 * `buildMaterial` constructs from a data spec alone, which is exactly right for the
 * procedural placeholders — they carry no maps at all. A real GLB does. On the salvaged
 * sedan the shut lines, panel gaps, badge recesses and surface grain live entirely in the
 * normal map, so without this the first tap on a paint chip would replace a car with a
 * smooth plastic blob — the swatch would work and the vehicle would get worse.
 *
 * Runs once per loaded vehicle, never in a render pass (§5.2). The texture itself stays
 * owned by the useGLTF cache; `disposeMaterialCache` only disposes materials, so sharing
 * the map here cannot free a texture the model is still using.
 */
function inheritNormalMaps(snapshot: SceneSnapshot, cache: MaterialCache, groups: OptionGroup[]) {
  for (const group of groups) {
    for (const option of group.options) {
      option.effects.forEach((effect, index) => {
        if (effect.kind !== 'material') return;
        const material = cache.get(cacheKey(group.id, option.id, index));
        if (!material || material.normalMap) return;

        for (const name of effect.targetMeshes) {
          for (const mesh of snapshot.meshesByName.get(name) ?? []) {
            const authored = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as
              | THREE.MeshPhysicalMaterial
              | undefined;
            if (!authored?.normalMap) continue;
            material.normalMap = authored.normalMap;
            material.normalScale.copy(authored.normalScale);
            material.needsUpdate = true;
            return;
          }
        }
      });
    }
  }
}

export function createRuntime(root: THREE.Object3D, groups: OptionGroup[]): EffectRuntime {
  const snapshot = snapshotScene(root);
  const cache = buildMaterialCache(groups);
  inheritNormalMaps(snapshot, cache, groups);
  return { snapshot, cache, clones: new Set() };
}

export function disposeRuntime(runtime: EffectRuntime) {
  disposeMaterialCache(runtime.cache);
  for (const material of runtime.clones) material.dispose();
  runtime.clones.clear();
}

function applyEffect(effect: Effect, runtime: EffectRuntime, key: string) {
  const { snapshot, cache } = runtime;
  switch (effect.kind) {
    case 'material': {
      const material = cache.get(key);
      if (!material) return;
      for (const name of effect.targetMeshes) {
        for (const mesh of snapshot.meshesByName.get(name) ?? []) mesh.material = material;
      }
      return;
    }

    case 'texture': {
      // Applied on top of whatever material the mesh currently wears — so a wrap over a
      // colour keeps the colour's clearcoat. Cloning is required: the base material is
      // shared with other meshes that must NOT receive the map.
      const texture = isProcedural(effect.map) ? getProceduralTexture(proceduralId(effect.map)) : null;
      if (!texture) return;
      for (const name of effect.targetMeshes) {
        for (const mesh of snapshot.meshesByName.get(name) ?? []) {
          const base = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          if (!base) continue;
          const wrapped = (base as THREE.MeshPhysicalMaterial).clone();
          wrapped.map = texture;
          wrapped.color.set('#FFFFFF');
          wrapped.needsUpdate = true;
          mesh.material = wrapped;
          runtime.clones.add(wrapped);
        }
      }
      return;
    }

    case 'visibility': {
      for (const name of effect.targetMeshes) {
        for (const object of snapshot.byName.get(name) ?? []) object.visible = effect.visible;
      }
      return;
    }

    case 'transform': {
      for (const name of effect.targetMeshes) {
        for (const object of snapshot.byName.get(name) ?? []) {
          if (effect.position) object.position.set(...effect.position);
          if (effect.rotation) object.rotation.set(...effect.rotation);
          if (effect.scale) object.scale.set(...effect.scale);
        }
      }
      return;
    }

    case 'sound':
      // Handled by the audio layer (§7.3), not the scene graph.
      return;
  }
}

/**
 * Reconcile the whole scene to `selection`. Called from useLayoutEffect, so the change is
 * committed before the browser paints — which is why a colour swap never shows an
 * intermediate frame.
 */
export function applySelection(groups: OptionGroup[], selection: Selection, runtime: EffectRuntime) {
  const { snapshot } = runtime;

  restore(snapshot);

  // Clones from the previous selection are now unreferenced by the scene. Free them here
  // rather than on unmount, so a user cycling wraps does not accumulate GPU memory.
  for (const material of runtime.clones) material.dispose();
  runtime.clones.clear();

  for (const group of groups) {
    const selected = new Set(selection[group.id] ?? []);

    /*
     * Everything this group can show is hidden first, then the chosen options turn their own
     * parts back on. That is the literal meaning of an option group — a set of alternatives —
     * so it belongs in the engine rather than being spelled out in every option's JSON.
     */
    for (const option of group.options) {
      for (const effect of option.effects) {
        if (effect.kind !== 'visibility' || !effect.visible) continue;
        for (const name of effect.targetMeshes) {
          for (const object of snapshot.byName.get(name) ?? []) object.visible = false;
        }
      }
    }

    for (const option of group.options) {
      if (!selected.has(option.id)) continue;
      option.effects.forEach((effect, index) => {
        applyEffect(effect, runtime, cacheKey(group.id, option.id, index));
      });
    }
  }
}
