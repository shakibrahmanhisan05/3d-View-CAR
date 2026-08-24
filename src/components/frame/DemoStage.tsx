/**
 * The full-bleed demo surface (§9).
 *
 * `/demo/car`, `/demo/bike`, `/demo/modification` and `/demo/360` are the second highest-value
 * screens on the site after the hero, and until now they rendered edge-to-edge with no framing
 * at all — the $60,000 product and the $2,500 product arrived in the same borderless rectangle,
 * which quietly flattened the whole price ladder on `/pricing`.
 *
 * They now sit in the same cinema container as the hero. No letterbox: the option panel needs
 * every pixel of vertical real estate, and the frame's rim and outer bloom already do the
 * "we are watching something" work on their own.
 *
 * No pip rail either — a demo page is one screen, and a rail with nothing to index is chrome.
 */

import type { ReactNode } from 'react';
import { Frame } from './Frame';

export function DemoStage({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pb-10 pt-4 sm:px-5">
      <Frame letterbox={false} shellClassName="shadow-elev-lg">
        {children}
      </Frame>
    </div>
  );
}
