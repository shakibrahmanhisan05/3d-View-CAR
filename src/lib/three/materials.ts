/**
 * Shared three.js material helpers.
 *
 * Two jobs:
 *  1. Default materials for the procedural placeholders (§12.4) — sane starting values
 *     so the vehicle looks correct before any option is selected.
 *  2. `buildMaterial` / `disposeObject3D`, used by the configurator's material cache (§5).
 *
 * Realism here comes from clearcoat + the environment map, NOT from polygon count (§5.6).
 */

import * as THREE from 'three';
import type { PBRMaterialSpec } from '@/lib/types';

/**
 * Build a MeshPhysicalMaterial from a data-driven spec.
 *
 * Called ONCE per option at load time into a Map<optionId, Material> — never in a render
 * pass (§5.2). Every material this returns must eventually reach `disposeMaterial`.
 */
export function buildMaterial(spec: PBRMaterialSpec, name: string): THREE.MeshPhysicalMaterial {
  const transparent = spec.opacity !== undefined && spec.opacity < 1;

  const material = new THREE.MeshPhysicalMaterial({
    name,
    color: new THREE.Color(spec.color),
    metalness: spec.metalness,
    roughness: spec.roughness,
    clearcoat: spec.clearcoat ?? 0,
    clearcoatRoughness: spec.clearcoatRoughness ?? 0.1,
    transparent,
    opacity: spec.opacity ?? 1,
    // `transmission` is what makes glass read as glass rather than as a grey film.
    transmission: spec.transmission ?? 0,
    side: transparent ? THREE.DoubleSide : THREE.FrontSide,
  });

  if (spec.transmission) {
    material.ior = 1.45;
    material.thickness = 0.02;
  }

  if (spec.emissive) {
    material.emissive = new THREE.Color(spec.emissive);
    material.emissiveIntensity = spec.emissiveIntensity ?? 1;
  }

  return material;
}

/** Default materials for placeholder geometry. Keys are semantic, not per-mesh. */
export function createDefaultMaterials() {
  return {
    paint: buildMaterial(
      // A coloured base coat under a clear layer — not polished metal. High `metalness` on
      // paint makes the body mirror the room instead of showing its own colour.
      { color: '#1B1D1F', metalness: 0.24, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06 },
      'default_paint',
    ),
    glass: buildMaterial(
      { color: '#9FB0B8', metalness: 0, roughness: 0.05, opacity: 0.32, transmission: 0.9 },
      'default_glass',
    ),
    chrome: buildMaterial({ color: '#D8DCDE', metalness: 1, roughness: 0.12 }, 'default_chrome'),
    alu: buildMaterial({ color: '#A9AEB1', metalness: 0.78, roughness: 0.36 }, 'default_alu'),
    rubber: buildMaterial({ color: '#141617', metalness: 0, roughness: 0.92 }, 'default_rubber'),
    plastic: buildMaterial({ color: '#212426', metalness: 0.1, roughness: 0.66 }, 'default_plastic'),
    fabric: buildMaterial({ color: '#33373A', metalness: 0, roughness: 0.95 }, 'default_fabric'),
    lensClear: buildMaterial(
      { color: '#E8EEF2', metalness: 0.1, roughness: 0.08, emissive: '#8FA6B4', emissiveIntensity: 0.25 },
      'default_lens_clear',
    ),
    lensRed: buildMaterial(
      { color: '#8E1512', metalness: 0.2, roughness: 0.14, emissive: '#B4231D', emissiveIntensity: 0.45 },
      'default_lens_red',
    ),
    engine: buildMaterial({ color: '#4A4E51', metalness: 0.85, roughness: 0.46 }, 'default_engine'),
  };
}

export type DefaultMaterials = ReturnType<typeof createDefaultMaterials>;

function disposeMaterial(material: THREE.Material) {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) value.dispose();
  }
  material.dispose();
}

/**
 * Free every GPU resource under `root` (§5.9).
 *
 * Tab-switching on the homepage unmounts whole scenes. Without this the fourth tab
 * switch drops frames, and the fourth tab switch is exactly when the owner is watching.
 */
export function disposeObject3D(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = (mesh as { material?: THREE.Material | THREE.Material[] }).material;
    if (Array.isArray(material)) material.forEach(disposeMaterial);
    else if (material) disposeMaterial(material);
  });
}

export { disposeMaterial };
