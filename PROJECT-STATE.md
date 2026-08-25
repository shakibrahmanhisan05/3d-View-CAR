# PROJECT-STATE.md â€” Claude's working memory

> **This file is for Claude, not for Hisan.** Hisan's file is `YOUR_TASK.md`.
> **Update this file at the end of every work chunk.** On a fresh context, read this file
> first, then `docs/DESIGN-PLAN.md`, then only the source files the current phase needs.
> Do NOT re-read `CLAUDE-CODE-BUILD-PROMPT.md` end-to-end unless a decision below is genuinely
> unclear â€” Â§-references throughout this file point at the exact section.
>
> Last updated: **2026-08-25** Â· **Phases 0â€“10 done, including Phase 6.**
> The site builds, prerenders and runs end to end **on real vehicle models**.
>
> âš ï¸ **The visual design was replaced twice.** The flat "Sheet" design was rejected by Hisan
> on sight (session 3) and superseded by "Obsidian"; on **2026-08-25 Hisan rejected the
> Obsidian/Rev-2 look in turn** ("the texts, the fonts, the design â€” literally everything")
> and it is superseded by **Revision 3 "Atelier"** â€” a light editorial system with dark
> cinema stages, documented at the bottom of `docs/DESIGN-PLAN.md` and swept in PROJECT-STATE
> Â§11. All commercial decisions, the licence gate, i18n, the configurator engine and the
> prospect-retinting contract are untouched and still bind.

---

## 1. What this is

Marketing + demo website for **Phoenix**, a 4-person studio in Chattogram, Bangladesh selling
3D vehicle showroom websites to local car dealers, bike showrooms and modification shops.

**The site IS the product demo.** It gets opened on a phone in a showroom in front of a
skeptical owner who has 12 minutes. Bangla is the default language. All money in à§³ (BDT),
project pricing, never USD, never monthly SaaS. Every lead path ends in **WhatsApp**.

Two capabilities must both be demoed, because they sell to two different customers:
1. **Configurator** (new bikes, new cars, modifications) â€” colour/accessory choice.
2. **360Â° real-vehicle capture** (reconditioned stock) â€” 99% of BD cars are one-of-one and
   cannot be configured. This is the actual revenue product.

Governing spec: `CLAUDE-CODE-BUILD-PROMPT.md` (authoritative).
Business context: `PHOENIX-90-DAY-PLAYBOOK.md` (why, not what).

## 2. The people

- **Hisan** â€” the user. Sole developer. Everything technical.
- Tasfia â€” sales. Omlan â€” photography / 360Â° capture. Siam â€” pitch, objections, ROI numbers.

---

## 3. Environment facts (verified 2026-08-18)

- Windows 11, PowerShell primary. Repo root: `E:\ROUGH CODING\3d View CAR`
- Node **v25.6.1**, pnpm 10.29.3. **Not a git repo yet** â€” nothing has ever been committed.
- Next **15.5.23**, React 19.2.8, three 0.176, R3F 9, drei 10, Tailwind v4.
- **Blender is NOT on PATH.** No longer blocking: the Â§13 pipeline was rebuilt in pure Node
  (`scripts/model/*` â€” gltf-transform + meshoptimizer + sharp) and needs no Blender at all.
- **`ui-ux-pro-max` / `frontend-design` skills are NOT installed.** Phase 0 was run manually;
  see the note at the top of `docs/DESIGN-PLAN.md`.
- Google Fonts is reachable, so `next/font/google` works.
- `.env.local` exists with `ADMIN_PASSWORD=phoenix-test-2026` (gitignored, dev only).
- `pnpm dev` on :3000. `predev` and `prebuild` both run the licence gate.

### Two traps that already cost time â€” do not repeat

1. **Never run `pnpm build` while `pnpm dev` is running.** The build overwrites `.next` under
   the live dev server and the site loses all CSS. Fix: kill dev, `rm -rf .next`, restart.
2. **Browser automation runs in an occluded window**, so `document.visibilityState` is
   `'hidden'`: rAF never fires and **ResizeObserver never delivers**. Symptom: the R3F canvas
   stays 300Ã—150 and the poster never fades. It is NOT a bug. Before screenshotting a 3D page:
   `window.dispatchEvent(new Event('resize'))`, wait ~1.5 s, dispatch again, then screenshot.

---

## 4. Locked decisions (do not re-litigate)

| Area | Decision | Why |
|---|---|---|
| Framework | Next.js 15 App Router, TS strict, **pnpm** | Â§2 |
| i18n | `app/[locale]/â€¦`, **`[locale]/layout.tsx` IS the root layout** (no `app/layout.tsx`). `src/middleware.ts` **rewrites** `/x` â†’ `/bn/x`. English at `/en/x`. No accept-language sniffing. | Clean Bangla URLs + correct `<html lang>` + fully static |
| Route groups | `[locale]/(site)/*` carries header+footer. `/for/[slug]` and `/pitch` sit OUTSIDE it. `/admin` sits outside `[locale]` entirely with its **own root layout**, and is excluded from the middleware matcher. | Â§10, Â§11; admin is not bilingual |
| Styling | Tailwind v4 `@theme inline` over CSS custom properties in `src/app/globals.css` | `/for/[slug]` retints via one var (Â§10) |
| Tokens | 7 hex values: bay/paper/ink/rule/alu/signal/accent. Everything else `color-mix()`. Token NAMES unchanged from the old palette â€” only values. **Semantic flip: `--ph-paper` is now the DARK ground and `--ph-ink` the LIGHT text.** | `docs/DESIGN-PLAN.md` Rev 1 |
| Signal colour | Three values: `--ph-signal` (ground, carries white), `--ph-signal-ink` (white foreground), `--ph-signal-lit` (derived, for the hue AS TEXT on dark). | A prospect can override the hue with anything; only white survives every hue |
| Component lib | shadcn/ui in `src/components/ui/*` (Button/Card/Badge/Accordion) + `cn()` in `src/lib/utils.ts`. shadcn token names are MAPPED onto `--ph-*`, never duplicated. | Prospect accent cascades into shadcn too |
| Motion | `motion` v12 via `LazyMotion` + `m`. Features load through `src/components/motion/features.ts`. | Read that file's comment before editing â€” the naive lazy setup un-splits the chunk |
| Dictionary | `bn.ts` defines the shape; `en.ts` is `satisfies Dictionary`. A missing English key is a **type error**. | Â§16 bilingual criterion, enforced not hoped |
| Dictionary transport | `<DictionaryProvider>` puts ONE locale on the RSC payload; client components never import `bn`/`en`. | 130 kB JS budget (Â§14) |
| Env lighting | Procedural `<Lightformer>` rigs inside drei `<Environment>`. `EnvironmentPreset.hdriUrl` is optional and wins when set. | 4 HDRIs = 4 MB against a 5 MB budget |
| Showroom rig | **Three narrow ceiling strips against dark walls.** Big bright walls make a bonnet reflect one uniform white field and the car dies. | Learned the hard way; see Â§9 |
| Paint physics | Metalness 0.12â€“0.6 with `clearcoat: 1`, NOT metalness 0.7+. High metalness makes paint mirror the room instead of showing its colour. | Same |
| Wraps / tank pads | `Effect.texture.map` accepts `procedural:<id>` drawn to a canvas. Any other value is a real URL. | Zero bytes; swaps by JSON edit |
| Engine sound | **Synthesised** Web Audio (`engine-audio.ts`), registered as an `original` asset, lazy-imported on first tap. Â§7.3 forbids a *bad clip*, not an original one; a disabled button demos nothing. | Replaceable by pointing `SoundSet.idleUrl` at a CC0 file |
| 360Â° frames | **Now real.** 32 WebP frames rendered from the prepared sedan by `scripts/model/render-parts.mjs <glb> <outDir> 1200 800 --turntable 32`, served at `/demo-360/recon-sedan/frame-%s.webp`. Render from the `.cache` **verify** build, not the published GLB â€” the published one is meshopt-quantized and the raw positions read as garbage. The `procedural:sedan` SVG path stays in `placeholder-frames.ts` for any capture with no shoot yet. | Â§8; see Â§12 |
| AR | **Deviation from Â§2, recorded deliberately.** Â§2 names `<model-viewer>`; this uses the Android Scene Viewer intent URL and iOS `rel="ar"` directly â€” which is all model-viewer's AR button does â€” for 0 kB instead of ~200 kB. Renders nothing until `asset.glbUrl`/`usdzUrl` exist. | No GLB exists to test against; swap is contained in `ArButton.tsx` |
| Client validation | Lead form uses React Hook Form's own rules, **not zod**. The server route is still the zod authority. | zod + resolver was ~20 kB on the two highest-value routes |
| Placeholders | Procedural three.js vehicles with **the real semantic mesh names** (Â§13) | Â§12.4 â€” real GLBs drop in with zero code change |
| 3D loading | Whole R3F tree behind `dynamic(..., { ssr: false })`; **`Scene.tsx` is the only module allowed to import three/@react-three** | three.js must never reach the main bundle |
| Assets | R2 via `NEXT_PUBLIC_ASSET_BASE_URL` remains the production intent. **Until R2 exists, vehicle GLBs and 360Â° frames ship from `public/models` and `public/demo-360`** with content-hashed names under the immutable `Cache-Control` rule already in `next.config.ts`. Recorded deviation â€” Â§12. | Â§14 |
| Data loading | `src/lib/vehicles.ts` reads `data/**` with `fs` (server-only), NOT static imports, so adding a vehicle/prospect is one JSON file. `outputFileTracingIncludes` keeps `data/**` deployed. | Â§10 acceptance test |
| Care plan pricing | Quoted **annually** (à§³18,000/yr, optional), not à§³1,500/month. | Â§16 forbids monthly SaaS pricing; same money, correct framing |

## 5. Architectural rules that will break things if forgotten

1. **One WebGL context alive at a time.** `DemoTabs` keeps ONE `<ConfiguratorRoot>` mounted and
   swaps the `vehicle` prop; the 360Â° tab unmounts the canvas entirely.
2. **Never remount the model on an option change.** `applySelection` restores an authored-state
   snapshot then re-applies selected effects, in `useLayoutEffect`.
3. **Materials are built once at load** into `MaterialCache`. Never in a render pass.
4. **One `<OptionPanel>` serves car and bike**, filtered by `appliesTo` vs `segment`. There is
   no separate bike configurator. Ever.
5. **An `Effect` never swaps the model file.** Variants toggle by visibility.
6. Single-select groups hide **every** visibility target in the group before applying the
   selected option. That rule lives in the engine, not in each option's JSON.
7. Dispose geometries/materials/textures/audio on unmount (`disposeObject3D`, `disposeRuntime`).
8. Every numeral is monospaced (`.num`). Every string exists in both `bn` and `en`.
9. Camera clamped (`minPolar 0.15Ï€`, `maxPolar 0.52Ï€`), damped, auto-rotate until first
   interaction only, visible reset control.
10. `prefers-reduced-motion` kills rotation and reveals; the configurator stays fully usable.
11. **Nothing may read `window.*` during render.** The WhatsApp-href hydration mismatch came
    from exactly that. Use an effect + state.
12. A **capped cylinder is never a tyre** â€” the cap hides the rim and every wheel option
    becomes an invisible black disc. Use `tyre()` (tread + annulus sidewalls).
13. **A derived token that contains `var()` does NOT re-derive for a descendant override.**
    Custom properties are substituted at the element where they are DECLARED, so
    `--ph-signal-lit` declared on `:root` bakes in root's `--ph-signal` and descendants only
    inherit the finished value. `/for/[slug]` overrides `--ph-signal` on a wrapper, so every
    derived signal token silently kept Phoenix red on a prospect's own page. Fixed with the
    `.signal-scope` class in `globals.css`. **Anything that sets `--ph-signal` must also carry
    that class**, and any NEW token derived from `--ph-signal` must be added inside it.
14. **On a signal ground the foreground is `text-signal-ink`, never `text-paper`.**
    `--ph-paper` is the dark ground now, so the old `bg-signal text-paper` pairing renders
    dark-on-accent â€” roughly 1.7:1 against the twenty-eight-motors navy. Six occurrences were
    fixed; keep new ones out.
15. **The configurator grid must stay height-bounded on `lg`.** The panel column carries
    `lg:overflow-y-auto`, and that does nothing on an unbounded box â€” the grid row just
    resolves to the tallest cell. Unbounded, the embedded demo rendered ~2,800px tall beside
    a 528px canvas and the sticky price summary never stuck. See `frameHeight` in
    `ConfiguratorRoot`.
16. **The hero canvas passes `allowZoom={false}`.** OrbitControls consumes the wheel event
    when zoom is on; the hero is full-bleed and 76vh, so a visitor's first scroll would dolly
    the camera into the bodywork instead of moving down the page. The `/demo/*` routes keep
    zoom â€” there the canvas is a panel the user chose to interact with.
17. **Motion is `m`, never `motion`.** `LazyMotion strict` makes the full component a runtime
    error, which is what keeps the lean bundle from silently regressing.
18. **`cn()` no longer runs tailwind-merge, so never layer two utilities from the same CSS
    property group and expect the later one to win.** Dropping tailwind-merge was the
    documented lever for getting Revision 2 back inside the first-load budget (~8 kB on `/`).
    Without it the winner is stylesheet order, not authorial intent, and the failure is
    silent: a `hidden` passed to `<Button>` â€” whose base sets `inline-flex` â€” left the
    WhatsApp CTA spilling off the right edge of a 380px phone. **Branch instead of override**
    (a ternary that emits one or the other), or put the responsive class on a WRAPPER.
    `node scripts/dev/audit-class-conflicts.mjs` renders every public route and fails on any
    element carrying two utilities from one group; run it after touching shared components.
19. **An unlayered custom class (`.seal`, `.plate`, `.field`, `.overline`)
    beats every Tailwind utility on the same property.** Tailwind v4 puts its utilities in
    `@layer`, and unlayered rules outrank layered ones regardless of source order. `size-20`
    on a `.seal` silently loses to the class's own sizing. Use inline `style` when a
    component needs to override one of these.
20. **Never `whitespace-nowrap` on anything that carries a translated label.** Bangla CTA
    copy is a whole sentence; a nowrap button containing one has a ~500px min-content width,
    and inside a grid item (`min-width: auto`) that propagates all the way out. The homepage
    scrolled sideways by 212px on a 380px phone and the English build never showed it.
    Related: **every grid/flex item that can contain a wide subtree needs `min-w-0`** â€”
    `Section`'s content column carries it for exactly this reason.
21. **Every accented piece of TEXT is on `--ph-paint`, not on `--ph-accent`.** Revision 2
    splits the palette into three layers with one job each: `--ph-signal` (ember) is the
    ACTION layer â€” buttons, price total, active pip, nothing else; `--ph-accent` (champagne)
    is the STRUCTURE layer â€” hairlines, ceiling strips, seals, focus rings, never a text
    colour and never a button ground; `--ph-paint` is the EDITORIAL layer, derived live from
    the vehicle's selected paint by `useApplyPaintTint`. Use `text-paint`, not
    `text-accent-gold`, for type. See rule 22 for why the swatch is not used raw.
22. **A paint swatch is a HUE SOURCE, never a text colour.** Swatches are authored to look
    right on sheet metal: `#16181A` "Attitude Black Mica" is invisible on `--ph-paper` and a
    saturated navy sits at ~1.6:1. `readableInk()` in `src/lib/paint.ts` keeps the hue and
    bisects lightness until the result clears 5.6:1 against the page ground â€” and since Rev 3
    it does this in BOTH directions: `--ph-paint-lit` is the ink readable on the LIGHT page,
    `--ph-paint-dark` the ink readable on the DARK stage (the stage scope re-maps
    `--ph-paint-lit` to it, so `text-paint` is correct on either ground with one class).
    A truly achromatic swatch stays achromatic â€” lifting a grey's "hue" would invent pink.
23. **The light page and the dark stage share ONE token set; the stage re-declares it.**
    `.bay`, `.frame-shell`, `.on-bay` and `.stage` re-map the whole `--ph-*` family onto
    stage-black inside their subtree, so components written for the old dark theme render
    correctly on stages without knowing. Consequences: (a) any NEW derived token must be
    added to `:root`, `.signal-scope` AND the stage block, or it silently keeps its root
    value there (same substitution trap as Â§5.13); (b) anything dark-surfaced that renders
    OUTSIDE those wrappers must carry `.stage` explicitly â€” the BootScreen overlay does;
    (c) the header is opaque frosted paper at every scroll position now, because dark-on-dark
    nav only becomes legible after scrolling.
24. **Fixed overlays are not inside any scope.** Modals, boot curtains, the pip rail and any
    future `position: fixed` element inherit `:root` tokens wherever they appear in the tree.
    Decide deliberately which ground they sit on and scope them (`stage`) or style them
    against both grounds before shipping.

---

## 6. Repo map (kept current)

```
CLAUDE-CODE-BUILD-PROMPT.md      spec (authoritative, read-only)
PHOENIX-90-DAY-PLAYBOOK.md       business context (read-only)
PROJECT-STATE.md / YOUR_TASK.md  â† these two, kept in sync with reality
docs/DESIGN-PLAN.md              Phase 0 output + **Revision 1 "Obsidian"** (read Rev 1 first)
components.json                  shadcn/ui config â€” style new-york, css vars, @/components/ui

data/asset-manifest.json         licence gate input â€” 6 entries, all `original` so far
data/environments.json           4 presets (Â§7.2)
data/option-groups.json          every car + bike + mod option group (Â§6)
data/vehicles/*.json             sedan-generic Â· naked-commuter-150 Â· sedan-modified
data/captures/*.json             recon-sedan-demo (360Â°)
data/prospects/*.json            twenty-eight-motors  â† one file per branded demo (Â§10)
data/generated-credits.json      GENERATED by the gate, gitignored

scripts/verify-licenses.ts       the licence gate (predev + prebuild)
scripts/new-prospect.mjs         `pnpm new-prospect <slug> "Name" "à¦¬à¦¾à¦‚à¦²à¦¾"`
scripts/dev/probe-geometry.ts    dev-only scene-graph dump â€” diagnose renders by numbers

scripts/model/                   the vehicle asset pipeline (Â§12). Pure Node, no Blender.
  prepare-vehicle.mjs            â† THE ONE YOU RUN for part-separated sources. Never
                                   decimates the high LOD. --verify first, always.
  prepare-stage.mjs              â† Hisan's circular stage platform â†’ public/models +
                                   src/lib/stage-platform.ts (regenerates the URL module).
  inspect-source.mjs             dump any GLB: parts, materials, textures, triangles.
                                   Run this FIRST to decide which pipeline a source needs.
  analyze-parts.mjs              per-part bbox/colour table + colour-coded render
  verify-labels.mjs              label render + body_paint isolation â€” the accuracy check
  render-parts.mjs               textured multi-part render; --turntable N for 360Â° frames
  pick-part.mjs                  "what part is at pixel (x,y)?" â€” identifies parts by sight
  measure-placeholder.ts         prints placeholder bboxes (the scale targets)

  --- for FUSED sources only (round 1; see Â§12). Do not use on part-separated models. ---
  process-model.mjs              driver: reduce â†’ split â†’ orient â†’ finalize
  step1-reduce.mjs               decimate + cap textures
  step3-split.mjs                infer Â§13 part names from one fused mesh; flatten the badge
  step5-orient.mjs               bake yaw + metric scale into the vertices
  step4-finalize.mjs             meshopt, 3 LODs, content-hashed â†’ public/models
  lib-mesh.mjs                   GLB IO, connected components, exterior visibility,
                                 software rasteriser, PNG writer (shared by both pipelines)
  verify-split.mjs               isolation renders for the fused pipeline
  probe-region.mjs               reads model-space coords off a pixel rectangle
  render-preview.mjs             quick 4-view shaded preview

assets-src/                      raw source models, gitignored, licence-gated
.cache/models/                   pipeline intermediates, gitignored, NOT gated
public/models/*.glb              shipped vehicles, content-hashed, immutable-cached
public/demo-360/recon-sedan/     32 rendered turntable frames

public/sw.js                     offline cache, registered ONLY by /pitch

src/middleware.ts                locale rewrite (excludes _next, api, admin, *.ext)
src/app/globals.css              Obsidian token layer + shadcn bridge + surface/motion
                                 primitives. THE only stylesheet on the site.
src/app/[locale]/layout.tsx      ROOT layout (html/body/providers/fonts)
src/app/[locale]/(site)/         layout(header+footer+JSON-LD) Â· page Â· pricing Â· process Â·
                                 about Â· work Â· contact Â· demo/{car,bike,modification,360} Â·
                                 build/[id] Â· not-found Â· error
src/app/[locale]/for/[slug]/     layout(prospect chrome + accent) Â· page
src/app/[locale]/pitch/page.tsx  offline deck
src/app/admin/{layout,page}.tsx  second root layout, password-gated lead table
src/app/api/{lead,build,admin,admin/export}/route.ts
src/app/{sitemap,robots}.ts

src/lib/  types Â· site Â· brand Â· fonts Â· credits Â· vehicles Â· store Â· validation Â· admin
          utils (cn â€” clsx + tailwind-merge; every ui/* component depends on it)
          i18n/{config,bn,en,index}
          three/{build-helpers,materials,placeholder-car,placeholder-bike}
          configurator/{effects,selection,textures,engine-audio}
          capture360/placeholder-frames
          db/schema

src/components/
  ui/            shadcn/ui â€” button(cva variants) card badge accordion
                 NOTE: no tabs.tsx. Radix Tabs mounts/unmounts per value, which would
                 rebuild the WebGL context; DemoTabs hand-rolls the rail instead (Â§5.1).
  motion/        MotionProvider(LazyMotion strict) Â· features(split boundary â€” read it
                 before editing) Â· Reveal/RevealGroup/RevealItem
  i18n/DictionaryProvider Â· brand/BrandProvider Â· chrome/{Header,Footer}
  sheet/Section Â· seo/LocalBusinessJsonLd Â· util/WhenVisible
  configurator/  ConfiguratorRoot Scene VehicleModel Stage StagePlatform CameraRig
                 EnvironmentRig AdaptiveQuality HotspotLayer PlaceholderVehicle OptionPanel
                 PriceSummary ActionBar ArButton PosterFallback RiderHeightCheck SplitCompare
                 SplitDivider
  home/          Hero DemoTabs SiteExperience PricingTable Faq
  capture360/Viewer360 Â· roi/RoiCalculator Â· contact/{LeadForm,DeferredLeadForm}
  prospect/ProspectChrome Â· pitch/PitchDeck
```

---

## 7. Phase ledger

| # | Phase | Status | Notes |
|---|---|---|---|
| 0 | Design plan (two-pass) | â˜‘ | `docs/DESIGN-PLAN.md`. Skills absent â€” ran manually. |
| 0b | **Redesign â€” "Obsidian"** | â— | Foundation + homepage done. Remaining components listed in Â§11. Budget decision open (Â§10.6). |
| 1 | Licence gate + procedural placeholders | â˜‘ | Gate proven to fail two ways â€” see Â§8. |
| 2 | Shell + tokens + i18n + fonts | â˜‘ | Bangla conjuncts verified in-browser at display size. |
| 3 | Configurator engine (R3F) | â˜‘ | Paint, price, clamps, adaptive quality, dispose, hotspots. |
| 4 | Segment option sets + rider height + before/after | â˜‘ | Split compare is a real two-pass scissor render, camera-synced. |
| 5 | Signature features | â˜‘ | Interior camera Â· 4 env presets Â· synth sound that changes with the exhaust Â· priceâ†’WhatsApp. |
| 6 | Real assets swap-in | â˜‘ | **2026-08-20.** Hisan supplied two Tripo AI models instead of Sketchfab downloads. Salvaged, split, debadged, optimised, wired in â€” Â§13. |
| 7 | Homepage (9 sections) + 360Â° viewer + ROI | â˜‘ | |
| 8 | Leads, `/api/build`, share links, `/admin` | â˜‘ | Verified end to end incl. CSV with BOM. |
| 9 | `/for/[slug]` + `/pitch` | â˜‘ | One-JSON-file acceptance test passes. |
| 10 | Remaining pages, SEO, QA | â˜‘ | sitemap Â· robots Â· LocalBusiness + FAQPage JSON-LD Â· 404 Â· error. |

## 8. Evidence log (already demonstrated â€” do not redo)

- **Licence gate fails on an undocumented asset**: dropping `public/assets/undocumented-test.glb`
  gave `UNDOCUMENTED ASSET â€¦ has no entry in data/asset-manifest.json`, exit 1.
- **Licence gate rejects CC-BY-NC**: `non-commercial. Phoenix is a commercial project`.
- Both locales render; middleware rewrite works; `<html lang>` correct.
- Configurator verified in-browser on car and bike: paint swap, wheel swap, tint, crash guard,
  windscreen, hotspots, price total, share-link decode (`?c=paint~racing-blueâ€¦`).
- Lead API: valid POST â†’ `{ok:true,id}`; bad phone â†’ 422.
- `/admin`: wrong password â†’ `?e=1`; right password â†’ cookie â†’ table; CSV exports with a UTF-8
  BOM so Excel reads Bangla names.
- `pnpm new-prospect nm-honda "NM Honda Center" "à¦à¦¨à¦à¦® à¦¹à§‹à¦¨à§à¦¡à¦¾ à¦¸à§‡à¦¨à§à¦Ÿà¦¾à¦°"` â†’ one JSON file â†’
  `/for/nm-honda` HTTP 200, fully branded. (Test file deleted afterwards.)
- `/for/twenty-eight-motors` serves `--ph-signal:#0B3D91`, the Bangla business name, the
  address and the expiry banner.
- **Production build passes.** Pre-redesign, every public route was â‰¤130 kB first-load JS
  (Â§14): home 128, demos 129, `/for/[slug]` 129, `/contact` 130, `/pricing` 121,
  `/demo/360` 122, `/pitch` 137.
- **Post-redesign the budget is exceeded** (measured 2026-08-18, clean build): home 190,
  `/for/[slug]` 190, `/pitch` 187, `/pricing` 180, `/contact` 171, `/demo/360` 163,
  `/work` 147, `/about` + `/process` 144, `/demo/*` 139. Shared baseline 103 kB.
  The waste is already out â€” the motion feature chunk genuinely splits, `lucide-react` is in
  `optimizePackageImports`. What remains is the libraries Hisan asked for.
  **Open decision, see Â§10.6.**
- Only remaining hydration diffs on the homepage come from a browser extension
  (`bis_skin_checked`), not from our markup.
- **Prospect accent cascade re-verified after the redesign** (`/for/twenty-eight-motors`):
  the wrapper resolves `--ph-signal` to `#0B3D91`, `--ph-signal-lit` now derives to
  `color-mix(in oklab, #0B3D91 55%, â€¦)` rather than staying Phoenix red, and the WhatsApp CTA
  computes `rgb(255,255,255)` on `rgb(11,61,145)`. Both were broken by the palette flip and
  are fixed â€” see Â§5.13 and Â§5.14.
- **Real models verified in-browser 2026-08-20** (`/bn/demo/car`, `/bn/demo/bike`, `/bn`,
  `/bn/demo/360`): sedan GLB 2.6 MB transferred in 233 ms, all 14 named parts resolve, tapping
  Attitude Black Mica repaints only `body_paint` and the price drops the à§³25,000 pearl premium,
  the shut lines and bonnet crease survive the swap (normal-map inheritance), rim-finish group
  renders, hotspot pins read as annotations, and `/demo/360` scrubs real rendered frames.
- **Badge removal verified by isolation render, not by eye**: `badge_front` is a 2,616-vertex
  patch collapsed to one plane with all normals forced forward; the grille now shows a flat
  dark blanking plate. Two earlier attempts LOOKED done and were not â€” see Â§12.
- Bangla default locale re-verified in-browser after the redesign: `<html lang="bn-BD">`,
  Hind Siliguri applied, conjuncts correct at display size under the new gradient headline
  treatment.

## 9. Known gaps (accepted, not bugs)

- The **procedural placeholders** are still used by `sedan-modified` (`/demo/modification`),
  which needs wrap/bodykit/tint geometry the real models do not have. Everywhere else runs on
  the real vehicles now (Â§12). Keep the placeholders: they are the fallback whenever a vehicle
  JSON has no `glbUrl`, and they are what `/demo/modification` demos.
- **`tint` is off but no longer impossible.** The round-2 sedan HAS glass â€” the greenhouse is
  a real part â€” it is simply not labelled `glass_*` yet, because separating it from the
  interior cabin shell needs one more signal (both are large and neutral). Identify it and the
  window-tint option group works. Popular option in BD; worth doing.
- The sedan's door shut lines read as faint creases at hero size. That is in the **AI source
  geometry**, not our processing â€” round 2 ships the source triangles untouched. Accepted.
- No poster images: `PosterFallback` draws an inline SVG elevation instead. Now worth
  revisiting, since `render-360.mjs` can emit a single framed still cheaply.
- **Still not measured on real hardware** (Â§14): LCP, time to interactive 3D, sustained FPS on
  mid-tier Android, Lighthouse. The GLB now exists, so only a device is missing.
- No git repository. Nothing is version-controlled.
- **Mobile layout is still NOT visually verified.** Browser automation could not resize the
  window in this environment (`resize_window` reported success, `innerWidth` never changed).
  Desktop and the Bangla default locale WERE verified in-browser. Check the hero bay, the
  paint-chip scroll row and the demo tab rail on a real phone before the next pitch.
  **The 3D framing part of this should now be right by construction** â€” `solveFraming` (Â§12)
  derives the lens from the live viewport aspect, which is exactly the case that could not be
  tested here â€” but that is reasoning, not observation. Look at it on a phone.
- The FAQ moved from native `<details>` to the Radix accordion, so it now needs JS to open.
  Accepted: it is section 8 of the homepage, far below the fold.

## 10. Open questions for Hisan (ask when relevant, don't block)

1. Real Phoenix WhatsApp number + phone. Placeholder `8801XXXXXXXXX` â€” note `wa.me` strips the
   X's, so **every WhatsApp link is currently broken by design** until this lands.
2. Chattogram street address for the footer and the JSON-LD `LocalBusiness`.
3. Domain name (needed for `metadataBase`, OG images, sitemap).
4. Confirm published pricing. Using Playbook Â§2.2: P1 à§³45â€“75k, P2 à§³25â€“40k/model,
   P3 à§³1,200â€“2,500/vehicle, care à§³18,000/yr optional.
5. `/work` and the case-study section stay placeholder-shaped until the week-3 flagship client.
6. **Does he accept the JS budget going from â‰¤130 kB to ~190 kB on the homepage** in exchange
   for shadcn + Motion? Levers to claw it back, largest first: FAQ back to `<details>`, drop
   `tailwind-merge` from `cn()`, drop the shared-`layoutId` pills. All three â‰ˆ 140 kB.

## 11. Redesign sweep â€” verified state

Checked in-browser 2026-08-18, not inferred. An earlier draft of this section was too
pessimistic: most routes inherit the redesign through `Section` and the token layer and need
no work at all.

**Done â€” verified visually:**

| Route | Why it is already right |
|---|---|
| `/` | Fully redesigned. |
| `/about` `/process` `/work` | Built only from `Section`; inherit everything. |
| `/pricing` | Built from `Section` + `PricingTable` + `Faq`, all redesigned. |
| `/demo/{car,bike,modification}` | Configurator shell, OptionPanel, ActionBar, PriceSummary all redesigned. |
| `/demo/360` | Data panel inherits tokens cleanly; frames are now real renders (Â§12). |
| `/for/[slug]` | Renders `SiteExperience`; accent cascade verified after the Â§13 fix. |

**Swept 2026-08-20, verified in-browser:**

- `contact/LeadForm.tsx` â€” **done.** The "What you sell" control now speaks the paint-chip
  language: the chosen card lifts, takes a champagne edge and carries a gold tick. Form sits on
  a `.surface .lit-edge` card, submit is the shadcn `Button variant="primary"`, the error state
  is a tinted signal panel instead of a bare left rule. Costs ~11 kB on `/contact` (171 â†’ 182).
- `configurator/HotspotLayer.tsx` â€” **done.** Pins were `bg-ink`, which after the palette flip
  is the LIGHT token, so every pin rendered as an opaque white disc sitting on the bodywork.
  Now champagne-ringed glass, and `distanceFactor` dropped 6 â†’ 3.2 because the camera solves
  its own framing now and sits far closer on a wide canvas.
- `capture360/Viewer360.tsx` â€” **done.** Same fix for note pins (defects keep signal red, which
  is correct â€” it is a condition report); popovers are `.surface .lit-edge .glass`; the control
  strip gained a drag affordance before first interaction.

**Revision 2 â€” "The Bay, framed" (PHOENIX-PRODUCTION-REBUILD-PROMPT.md), verified in-browser
at 380 / 900 / 1440 px:**

> **SUPERSEDED 2026-08-25 by Revision 3 "Atelier"** â€” Hisan rejected the whole dark look.
> The Rev-2 table below is kept for archaeology; what ships now is described in the Rev-3
> table underneath it.

| Surface | What it is now |
|---|---|
| `/` hero | Inside `<Frame>`: transparent R3F canvas over a DOM `<Monolith>` (the model code, in the car's own colour, occluded by the roofline), `<StageFloor>`, letterbox, plume, stat pair, model plate, explore card, 6.75rem paint chips, left `<PipRail>`. |
| Header | Menu index left Â· centred wordmark Â· language + WhatsApp right. The seven nav links moved into the sheet, at every viewport. |
| Â§2 problem | Pull-quote anchor with the site's only horizontal reveal; ruled rows with a champagne bar that widens on hover. |
| Â§3 demos | Tab SHELF (silhouette + label + short code); panel is a real `<Frame>`. |
| Â§4 products | Split panels, monumental `A` (ember) / `B` (champagne), gradient vertical rule, plate pills. |
| Â§5 ROI | `<Card tone="plate">` ledger, ember output at `clamp(3rem,5vw,4.5rem)` under a champagne rule, `SEC-05 OUT` seal, champagne slider fill. |
| Â§6 case study | Sealed dashed plate â€” reserved space, not a broken card. Same treatment on `/work`. |
| Â§7 pricing | Ladder in WIDTH (40/32/28) and figure size (3 / 2.5 / 2.25rem). Still no "most popular" badge. |
| Â§8 FAQ | Ledger rows, 1.25rem champagne index, inline chevron. |
| Footer | 2xl wordmark, `STK-ISSUE-<year>-<week>` serial, 2px glowing ceiling strip, plate-pill credits. |
| `/demo/*` | Wrapped in `<DemoStage>`; monolith at 0.6 scale, live total as a bay stat, WhatsApp pill in the bay, option panel is a plate, action bar in three plates. |
| `/demo/360` | Framed; 80px auction-grade seal, monumental frame fraction, plate data sheet. |
| `/contact` | The envelope â€” one plate, hairline centre rule, ruled paper-forward fields, `FORM A` seal, `DirectCard`. |
| Loading | `<BootScreen>` â€” real streamed GLB byte progress behind closing letterbox curtains. |

**Still hand-rolled and visibly flat â€” back-office only, no client ever sees these:**

- `configurator/{SplitDivider,SplitCompare,RiderHeightCheck,ArButton}.tsx`
- `prospect/ProspectChrome.tsx` Â· `pitch/PitchDeck.tsx` Â· `src/app/admin/*`
- `not-found` / `error` route files.

`/pitch` and `/admin` are deliberately untouched by Revision 2 â€” they are back-office and
restyling them is a separate ticket.

**Measured after Revision 2** (first-load JS, `next build`, baseline = commit 5e7cd50):
`/` 189 kB (was 189) Â· `/for/[slug]` 189 (190) Â· `/demo/*` 140 (138) Â· `/demo/360` 165 (162)
Â· `/contact` 180 (182) Â· `/pricing` 172 (180) Â· `/work` 149 (147). lucide-react is no longer
imported anywhere â€” every icon is inline SVG â€” which is most of what paid for the new
components.

**Token hygiene:** `text-signal` (17 uses) is only AA-safe at display sizes, which is how it
is currently used. If any of those become body-sized text, switch them to `text-signal-lit`.

**Revision 3 â€” "Atelier" (2026-08-25), full frontend rebuild.** Hisan's verdict on Rev 2:
"the website looks horrible â€” the texts, the fonts, the design, literally everything," with
full freedom granted. Rebuilt from the token layer up:

| What | Now |
|---|---|
| Ground | Warm porcelain `#F7F5F0`, near-black ink `#17181A`. Dark stages (`--ph-bay #0D0E10`) reserved for hero frame, demo bays, viewer, footer, boot screen â€” daylight for words, spotlight for the car. |
| Stage platform | Hisan's Tripo circular stage (turntable + slatted backdrop + light rig) floors EVERY 3D bay: `scripts/model/prepare-stage.mjs` → 44,994 tris / 0.43 MB meshopt+webp → `public/models/stage-platform.fe76e38e.glb`, URL module `src/lib/stage-platform.ts`, rendered by `configurator/StagePlatform.tsx` (clone tinted `#b0b0b0`, rough 0.62, disc top at y −0.002 under the ContactShadows plane). `Stage` skips its flat ground disc when the platform is present (coplanar z-fight). Manifest entry `stage-platform-tripo`. |
| Accents | ONE action colour: ember `#B8331B` (prospect-overridable as before). Bronze `#8A6C34` for hairline details/seals/focus, never body text, never a button. Champagne-as-decoration is gone. |
| Type | Bangla display is now **Noto Serif Bengali** (500/600/700) via `[lang='bn-BD'] .display`; Latin display Archivo; Hind Siliguri trimmed to 400â€“700; JetBrains Mono for data only. Outfit dropped entirely. `.display-lit` gradient text removed â†’ solid ink headlines. |
| Effects removed | Body plume, the Monolith wordmark entirely (component, CSS and `monolithIsNarrow` â€” the 3D stage platform replaced it as the backdrop per Hisan), stroke-text utilities, glass HUD, pulse badges, STK-ISSUE serials, ceiling glow strips, boot breathe/trace theatre. Seals/stamps are outline chips. |
| Header | Opaque frosted paper at every scroll position (Â§5.23c); wordmark left; real nav links from `xl` (Bangla labels overflowed at `lg`); menu sheet below `xl`. |
| Hero | Stage composition: transparent canvas over the 3D stage platform · CSS floor streak · segment toggle · price/paint stats · paint chips. No model-plate card, no explore thumbnail, no background text. One ghost pill into the configurator. Copy block below the frame gained a two-fact "what it is / what it is not" list (`hero.factOne*/factTwo*`). |
| Section | Gutter-code grid REMOVED (the `code` prop is accepted and ignored). Eyebrow = signal dash + tracked label (`.overline`); h2 at `clamp(1.95rem, â€¦, 2.75rem)` serif Bangla. |
| Buttons | Pills. `primary` signal, `outline` hairline, both adapt per scope. |
| Paint tint | `readableInk()` bisects in both directions; JS sets `--ph-paint / -lit / -dark`; the stage scope re-maps `-litâ†’-dark` (Â§5.22). |
| Boot screen | Curtains kept (real byte progress untouched); carried `.stage` scope (Â§5.24); silhouette + wordmark + honest rail, no glow. |

Verified after the rebuild: `pnpm build` clean; first-load JS home **189 kB**, `/demo/*` 136,
`/contact` 176, everything else â‰¤172 â€” budgets unchanged or better than Rev 2.
`audit-class-conflicts` clean across all 12 routes; prospect retint re-checked
(`signal-scope` + `--ph-signal:#0B3D91` present on `/for/twenty-eight-motors`);
stage-scope rule order confirmed in compiled CSS. **NOT yet verified visually in a browser**
(no browser automation available in this session) â€” see Known gaps.

## 12. Phase 6 â€” the real models

Two rounds. **Round 2 is what ships**; round 1 is kept below because its failure is the
reason the current rule exists.

### Round 1 (superseded) â€” fused models, and why they looked crushed

The first pair arrived as ONE fused mesh with ONE baked 8192Â² atlas: 1.9M triangles, 57 MB
each, 16Ã— over every Â§13 budget, with no separable parts at all. They were decimated 16Ã— to
260k and re-split by inference. Hisan's verdict on the result was immediate and correct â€”
**"the car and bike looked literally crushed"** â€” and a showroom owner would have rejected it
on sight. The decimation did that, not the split.

The lesson is now a rule: **decimation is a last resort, not a pipeline stage.** If a source
is already inside the triangle budget, ship its geometry untouched.

`scripts/model/step1-reduce Â· step3-split Â· step5-orient Â· step4-finalize`, driven by
`process-model.mjs`, are retained for the case they were built for â€” a source that genuinely
arrives fused â€” and for nothing else. Do not point them at a part-separated model.

### Round 2 (shipping) â€” part-separated models

| | Â§13 budget | Sedan | Bike |
|---|---|---|---|
| Source | â€” | 6.4 MB | 7.0 MB |
| Parts | ~18 semantic names | **56 meshes** | **102 meshes** |
| Triangles | â‰¤ 120k | **110,719** | **116,245** |
| Shipped high LOD | â‰¤ 3.5 MB | 1.87 MB | 2.24 MB |
| Geometry processing | â€” | **none** | **none** |

Both arrive already separated and already inside the triangle budget, so the correct amount
of geometry processing is zero. `prepare-vehicle.mjs` does naming, de-branding, placement and
compression â€” and never touches a vertex except to bake the world transform and the scale.

```
node scripts/model/prepare-vehicle.mjs assets-src/sedan-source.glb sedan --yaw 90 --length 4.626
node scripts/model/prepare-vehicle.mjs assets-src/bike-source.glb  bike  --yaw 0  --length 2.02 --bike
```

`--verify` writes the build to `.cache/` and dumps a per-part feature table instead of
publishing. **Always run it first**, then `verify-labels.mjs`, and look at the body_paint
isolation render before publishing.

### Classification â€” what actually separates the parts

Three signals, in this order:

1. **Colour bias.** The sedan's painted panels sample as a desaturated BLUE-biased grey â€”
   blue +6 to +28 above red â€” while tyres, rims, glass, interior and underbody all sit
   between âˆ’3 and +3. The gap at ~4 is empty, so one test takes every panel and nothing else.
   The bike is painted RED, so it flips: `sat > 0.28` with red dominant, and the taillight is
   separated from the tank by being small AND at the extreme rear.
2. **Exterior visibility.** A 32-viewpoint part-id rasteriser. The floor pan and the inner
   cabin shell are large, mid-height and sample almost exactly like a door skin â€” without
   this they land in `body_paint` and a colour tap repaints the underside of the car.
3. **Position**, last and least. Wheels are compact, low, off the centreline and neutral.

**The colour test must run BEFORE the position test.** A front wing is compact, low and far
off the centreline â€” geometrically identical to a wheel. Ordering position first labelled
both front wings `wheel_fl`/`wheel_fr`, and the isolation render caught it.

Only `body_paint` has to be exact. Every other part keeps its own source material, so a
mistake between trim and chrome is invisible; a mistake in `body_paint` is a client watching
a headlight turn blue.

### GLTFLoader renames duplicates â€” the bug that broke paint

`prepare-vehicle` names all 23 painted panels `body_paint`, which is the natural way to say
"one option drives all of these". GLTFLoader's `createUniqueName` then loads them as
`body_paint`, `body_paint_1`, `body_paint_2`, â€¦ so `meshesByName.get('body_paint')` returned
exactly one mesh. On screen: tapping a paint chip painted **the bumpers only** and left the
doors, roof and bonnet in the factory colour.

`snapshotScene` now indexes every object under its base name as well as its loaded name
(`/_\d+$/` stripped). Authoring N meshes with one semantic name is correct; absorbing the
loader's suffix is our job.

### De-branding

The sedan carries a Toyota grille emblem and an invented number plate, both painted into
their own small per-part textures. `debrand()` selects the vertices carrying the mark, reads
their UV rectangle, and inpaints that rectangle by blending inward from the pixels just
outside it. The emblem's geometric boss remains as a blank oval mount, which is what a
debadged car looks like. The plate is now blank.

Selection has to be tight: a generous box erased the grille slats either side of the badge
and read as damage. The bike has no manufacturer mark.

Tripo's commercial licence covers the generated asset; it does not convey Toyota trademark
rights. Do not re-introduce the badge.

### Frame rate

Two changes, both aimed at "60 fps constant":

- **`RenderGate`** â€” the canvas ran `frameloop="always"`, so the hero kept drawing a full
  clearcoat scene at 60 fps for the whole length of the page and in background tabs. An
  IntersectionObserver plus `visibilitychange` now stops the loop dead when the bay is off
  screen. This is the scroll-smoothness fix: those frames were competing with the scroll for
  the same main thread.
- **`AdaptiveQuality` is now a governor, not a one-shot check.** It used to sample thirty
  frames once and only act below 25 fps â€” anything between 25 and 60 was left alone, and it
  latched forever after the first measurement. It now holds a rolling 45-frame average
  against a 60 fps target and steps DPR down (0.7 â€¦ 2.0) to keep it, climbing back when there
  is margin, with an 800 ms settle so one janky frame never moves the level. Resolution is
  the right thing to trade: this scene is fragment-bound, and nobody notices 1.5Ã— instead of
  2Ã— on a phone â€” everybody notices a stutter. The low LOD is now the last resort rather than
  the first move.

**FPS is still unmeasured on real hardware.** Browser automation here runs in an occluded
window where rAF never fires, so a frame-rate probe hangs rather than reporting â€” the same
trap recorded in Â§3. The governor is reasoning, not observation. Check it on a phone.

### Option groups

Unchanged from round 1: sedan `paint Â· rimfinish Â· interior`; bike `paint Â· exhaust`;
`sedan-modified` stays on the procedural placeholder. **These models DO have glass** (the
sedan's greenhouse is a real part) so `tint` is now recoverable â€” it is still off only
because the glass part is not yet labelled, not because it is missing.

### Sizes

| | high | mid | low |
|---|---|---|---|
| sedan | 1.87 MB / 110,719 tris | 0.82 MB | 0.58 MB |
| bike | 2.24 MB / 116,245 tris | 1.24 MB | **0.96 MB** (0.9 budget) |

The bike's low LOD is 7% over. `simplify` runs with `lockBorder: true` and the bike has 102
part seams, so it stalls at 71k triangles instead of the 35k asked for. Cracks between 102
visibly separate parts would look far worse than 60 kB.

---

## 13. Session log

- **2026-08-25 (session 6b)** — Hisan supplied a Tripo circular stage platform and asked for it as the backdrop of every 3D bay, with the background model-code texts removed. Built `scripts/model/prepare-stage.mjs` (weld → simplify 133,791→44,994 tris → 1024 webp atlas → drop inert KHR_materials_volume → meshopt): 6.5 MB → **0.43 MB**, published content-hashed with a generated URL module (`src/lib/stage-platform.ts`) so a re-run re-points the site with no component edits. New `StagePlatform.tsx` clones the scene once, rebuilds materials (tint `#b0b0b0`, rough 0.62, env 0.55) and places the disc top at y −0.002 under the ContactShadows plane; `Stage` now skips its flat ground disc whenever the platform is in the scene (coplanar z-fight). Monolith deleted everywhere — component (file renamed `StageFloor.tsx`), BootScreen watermark + `code` prop, hero and configurator usages, CSS, `monolithIsNarrow`. Licence manifest entry `stage-platform-tripo` added; gate passes. Textured software render of the shipped GLB verified the atlas survived (black + bronze slats — on palette). Build clean, class audit clean, GLB served 200. **Still not browser-verified.**

- **2026-08-25 (session 6)** â€” Hisan rejected the Rev-2 dark design outright and granted full
  freedom. Rebuilt the frontend as **Revision 3 "Atelier"**: light porcelain page, dark
  cinema stages, one ember accent + bronze details, serif Bangla display (Noto Serif
  Bengali), Archivo Latin, mono for data only. Removed the effect stack (plumes, glows,
  gradient headlines, glass noise, serials). Rewrote `globals.css` around one trick: the
  stage scopes re-declare the whole token family against stage-black, so every existing dark
  component re-themes without knowing (Â§5.23). Fixed the two light-flip landmines found by
  reasoning: the header is now opaque paper (dark nav on the dark stage was unreadable), and
  the BootScreen overlay carries `.stage` explicitly (fixed elements sit outside any scope,
  Â§5.24). Paint tint now computes readable ink in both directions (`paint.ts`). Header nav
  moved to `xl:` because Bangla labels overflowed `lg`. Hero/panel copy keys added to both
  dictionaries (`hero.factOne*/factTwo*`, `problems.quoteSource`); Section's gutter codes
  retired (prop accepted, ignored). Build clean; JS budgets â‰¤ Rev 2; class-conflict audit
  clean; prospect retint re-verified. **Next: visual pass in a real browser at three widths,
  then Hisan's Â§10 answers.**

- **2026-08-20 (session 5)** â€” Hisan rejected the round-1 models on sight: *"the car and bike
  looked literally crushed"*, and supplied replacements that arrive **part-separated** (56 and
  102 meshes) and already inside the triangle budget. Wrote `prepare-vehicle.mjs`, which ships
  the source geometry **untouched** â€” decimation was the whole cause of the crushing. Sedan
  110,719 tris at 1.87 MB, bike 116,245 at 2.24 MB. Classification rebuilt around colour bias
  + exterior visibility + position, in that order, verified by isolation render. De-branded the
  Toyota emblem and the invented number plate out of their own textures.
  Two real bugs found: the wheel rule was labelling both front wings as wheels (position tested
  before colour), and **GLTFLoader's `createUniqueName` meant only one of the 23 `body_paint`
  panels ever took the colour** â€” the visible symptom was a car whose bumpers painted and whose
  doors did not. For 60 fps: added `RenderGate` (stop the loop when off-screen or backgrounded
  â€” the scroll fix) and rewrote `AdaptiveQuality` from a one-shot 25 fps rescue into a
  continuous DPR governor targeting 60. Full detail in Â§12.
  **Next: label the glass part so `tint` works; Â§11's back-office surfaces; Â§10 answers.**

- **2026-08-20 (session 4)** â€” Phase 6. Hisan supplied two Tripo AI models. Established they
  were unusable as delivered (one fused mesh, one baked atlas, 16Ã— over every budget, Toyota
  badge modelled in) and, on his instruction to take the full-salvage route, built
  `scripts/model/*`: reduce â†’ split â†’ orient â†’ finalize, plus a 360Â° frame renderer and two
  diagnostic tools. Recovered 14 semantic parts on the sedan and 4 on the bike, erased the
  badge, published three LODs each inside Â§13, and wired both into `data/vehicles/*.json`.
  Added `rimfinish`, restricted `optionGroupIds` to controls that actually do something, and
  replaced the `/demo/360` SVG placeholder with 32 rendered frames of the real car.
  Three real bugs found and fixed on the way: the camera framing that left the car at 22% of
  the hero, paint options dropping the normal map (a colour tap flattened the car to plastic),
  and the badge that stayed visible through two "successful" flattenings because nothing
  recomputed its normals. Swept LeadForm, HotspotLayer and Viewer360. Full details in Â§12.
  **Next: Â§11's remaining back-office surfaces, and Hisan's answers in Â§10.**

- **2026-08-18 (session 1)** â€” Read both specs. Verified toolchain. Recorded the missing skills
  and ran Phase 0 manually. Wrote the design plan, both state files, types, licence gate,
  manifest, environments, configs.
- **2026-08-18 (session 3)** â€” Hisan rejected the flat design on sight. Confirmed direction
  (premium dark automotive, foundation + homepage first) before writing code. Installed
  shadcn/ui deps + `cn()` + `components.json`; rewrote `globals.css` as the Obsidian token
  layer with a shadcn bridge; built `ui/{button,card,badge,accordion}` and
  `motion/{MotionProvider,features,Reveal}`; redesigned Header, Footer, Section, Hero,
  SiteExperience, PricingTable, Faq, DemoTabs, OptionPanel, ActionBar, PriceSummary,
  RoiCalculator. Fixed three real bugs found on the way: the unbounded configurator grid
  (~2,800px tall panel), the hero canvas eating page scroll via OrbitControls zoom, and the
  default paint being near-black on a near-black floor (`defaultOptionId` â†’ `pearl-white-iii`).
  Verified in-browser on desktop in both locales. Then, while auditing routes to write the
  docs, found and fixed two more real bugs the palette flip had introduced: derived signal
  tokens not re-deriving under the `/for/[slug]` accent override (Â§5.13), and six
  `bg-signal text-paper` pairs rendering dark-on-accent (Â§5.14). Updated
  `docs/DESIGN-PLAN.md` (Revision 1), this file, and `YOUR_TASK.md`.
  **Next: the Â§11 sweep â€” LeadForm first â€” and Hisan's call on the JS budget.**
- **2026-08-18 (session 2, after restart)** â€” Re-read the codebase. Completed Phases 1â€“5 and
  7â€“10. Built the shell, i18n, tokens, chrome, the whole configurator engine, both
  placeholders, synth audio, rider-height check, split compare, 360Â° viewer, ROI calculator,
  all nine homepage sections, every static page, the lead pipeline, `/build/[id]`, `/admin`,
  `/for/[slug]`, `/pitch` with a service worker, and full SEO. Fixed in-browser: hydration
  mismatch on the WhatsApp href, wheels buried in the car body, a solid greenhouse with
  painted-on windows, capped tyres hiding every rim, blown-out showroom lighting, mis-arced
  bike mudguards, and `brandFromProspect` stranded in a client module. Brought every public
  route inside the 130 kB JS budget. **Next: Phase 6, the moment Hisan supplies the models.**
