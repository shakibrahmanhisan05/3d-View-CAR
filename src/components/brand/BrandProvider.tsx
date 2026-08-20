'use client';

/**
 * Carries the active <Brand> down the tree.
 *
 * Nothing downstream of this provider is allowed to reach for a hard-coded phone number,
 * which is what makes §10's acceptance test — "a complete branded prospect demo requires
 * editing exactly one JSON file" — actually true rather than aspirational.
 *
 * The Brand type and the prospect mapping live in `src/lib/brand.ts` so the prospect layout,
 * which is a server component, can build one.
 */

import { createContext, useContext } from 'react';
import { type Brand, PHOENIX_BRAND } from '@/lib/brand';

const BrandContext = createContext<Brand>(PHOENIX_BRAND);

export function BrandProvider({ brand, children }: { brand: Brand; children: React.ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): Brand {
  return useContext(BrandContext);
}

export { PHOENIX_BRAND, type Brand };
