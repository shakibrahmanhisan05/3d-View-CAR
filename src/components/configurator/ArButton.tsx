'use client';

/**
 * AR handoff (§2, §5 ActionBar).
 *
 * Requirement: "AR Quick Look on iOS, Scene Viewer on Android, no app install."
 *
 * A NOTE ON THE IMPLEMENTATION CHOICE
 * §2 names Google's <model-viewer> as the means. model-viewer is a ~200 kB wrapper whose AR
 * button does exactly two things: build a Scene Viewer intent URL on Android and point an
 * `<a rel="ar">` at a .usdz on iOS. Both are done here directly, for zero bytes and zero
 * dependencies — which matters against a 5 MB total budget on mobile data (§14).
 *
 * Swap to <model-viewer> the moment there is a reason to (in-page AR preview, hotspots in AR).
 * Nothing else has to change: this component owns the whole surface.
 *
 * It renders NOTHING until a real GLB exists, because an AR button that opens an empty viewer
 * in front of a showroom owner is worse than no AR button.
 */

import { useDict } from '@/components/i18n/DictionaryProvider';
import type { Vehicle } from '@/lib/types';

export function ArButton({ vehicle, title }: { vehicle: Vehicle; title: string }) {
  const dict = useDict();
  const { glbUrl, usdzUrl } = vehicle.asset;

  // No model, no button. Phase 6 turns this on by adding the URLs to the vehicle JSON.
  if (!glbUrl && !usdzUrl) return null;

  return (
    <>
      {glbUrl ? (
        <a
          href={sceneViewerUrl(glbUrl, title)}
          // The `intent:` scheme is Android-only and inert elsewhere, so this anchor is hidden
          // from other platforms rather than offered and then failing.
          className="tap hidden items-center justify-center bg-bay px-3 text-xs hover:bg-bay-rule [@supports(-webkit-touch-callout:none)]:hidden md:hidden max-md:flex"
          title={dict.configurator.arHint}
        >
          {dict.configurator.viewInAr}
        </a>
      ) : null}

      {usdzUrl ? (
        // iOS AR Quick Look: Safari requires rel="ar" and a single <img> child.
        // eslint-disable-next-line jsx-a11y/anchor-has-content
        <a
          rel="ar"
          href={usdzUrl}
          className="tap flex items-center justify-center bg-bay px-3 text-xs hover:bg-bay-rule"
          title={dict.configurator.arHint}
        >
          {dict.configurator.viewInAr}
        </a>
      ) : null}
    </>
  );
}

/**
 * Android Scene Viewer, launched by intent. `resizable=false` keeps the vehicle at real scale
 * — a car the buyer can shrink to the size of a toy stops being a size reference, which is
 * most of what AR is for here.
 */
function sceneViewerUrl(glbUrl: string, title: string): string {
  const params = new URLSearchParams({
    file: glbUrl,
    mode: 'ar_preferred',
    title,
    resizable: 'false',
  });

  return (
    `intent://arvr.google.com/scene-viewer/1.0?${params.toString()}` +
    `#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;end;`
  );
}
