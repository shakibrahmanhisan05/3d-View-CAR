# PHOENIX — PRODUCTION‑GRADE VISUAL & UX REBUILD BRIEF
> **For:** Claude Code (or an equivalent senior full‑stack agent)
> **Repo:** `3d-View-CAR-main` (Phoenix, Chattogram — Next.js 15 App Router, TS strict, Tailwind v4, shadcn/ui, Motion, R3F).
> **Task:** Take the current "Obsidian" build from *functional* to *client‑ready, cinema‑grade production*, using the attached McLaren 750S composition as the **energetic reference**. Do **not** copy McLaren — steal the *composition, layering, cinematic light, and editorial confidence*, then re‑graft it onto Phoenix's `--ph-signal` (ember) + `--ph-accent` (champagne) system and the Bangla‑default, auction‑sheet DNA that already exists.
> **Read first, in this order:** `PROJECT-STATE.md` → `docs/DESIGN-PLAN.md` (Revision 1 "Obsidian") → `YOUR_TASK.md` → this file. **Do not re‑litigate any decision locked in §4 of PROJECT‑STATE**. The current build ships; the *look* does not.

---

## 0 — WHY THIS BRIEF EXISTS

The Phoenix site currently **works** end‑to‑end (3D configurator, 360° viewer, ROI, pricing, prospect retinting, bilingual routing, licence gate). It **does not sell**. On first paint it reads as an AI‑generated dark template — a symmetrical stack of glass cards on a neutral obsidian floor with a single ember accent and a section‑code gutter that never earns its keep. It has no *frame*, no *stage*, no *first breath*, no editorial rhythm. That is the entire problem this brief solves.

**Concretely, the failures a Chattogram showroom owner will see in the first eight seconds:**

1. The hero is a floating 3D model in a flat dark rectangle. There is no *set* around it — no giant model wordmark behind the car, no volumetric light, no stage floor reflection, no framing masthead. Compare to the reference: the vehicle sits **inside a composition**, and the composition itself is the pitch.
2. The paint‑chip strip lives on top of the canvas *and* under a hero copy block that is too small and too centred. The chips are 5.25rem wide, un‑swatchable at arm's length, and their price delta is 0.65rem — invisible in a showroom under strip lighting.
3. Every section below the hero uses the **same layout** (`gutter‑code · h2 · sub · content`) with the same 16 px reveal. Eight sections × one motion pattern = a slideshow, not a magazine.
4. The two accents (ember `#C8382A` and champagne `#D4A857`) are used almost interchangeably as decorative text colour. Neither reads as *the* action colour. `--ph-signal-lit` on obsidian looks like brown text.
5. The 3D bay uses a single soft radial pool of light and then hard‑cuts into the paper section — the "vehicle sitting in a lit room" story survives the CSS but never survives the composition.
6. The FAQ, pricing, ROI, contact, footer are all `bg-glass + border-glass-border` rectangles. No hierarchy, no visual anchor per section, no editorial artefacts (rules, plates, seals, index numerals) large enough to catch a moving eye.
7. Bangla and English are typographically identical past the first line — same weight, same size, same rhythm. There is no *voice*.
8. Every interactive control (nav pill, tab pill, segment pill, chip lift, card lift) uses the **same 260 ms spring / 3 px translate** motion, so nothing feels heavier or lighter than anything else. The signature paint‑chip strip is meant to be the site's memorable object; right now it moves like a nav pill.
9. The 360° viewer and the configurator both live inside identical `overflow-hidden rounded-2xl border` containers — a $60,000 product and a $2,500 product look the same on screen, and that quietly destroys the price ladder on `/pricing`.
10. Empty‑state screens (`/work`, `/for/[slug]` before content, `/pitch`) still use flat borders from the pre‑Obsidian design.

Everything below is written to fix those ten failures while **preserving every commercial decision, every accessibility contract, and every architectural rule already in the codebase**.

---

## 1 — DECISIONS THAT ARE LOCKED (do not touch)

Do not open these back up. If a proposed change would break one of them, discard the change.

- **Framework, styling, motion, i18n, prospect retinting, licence gate, one WebGL context, imperative material swap, adaptive quality, dpr caps, camera clamps** — all as documented in `PROJECT-STATE.md` §4 and §5.
- **Token names** `--ph-paper / ink / bay / rule / alu / signal / accent` and the semantic flip (paper = dark ground, ink = light text). ~300 utility usages depend on the names.
- **`--ph-signal` is the only token a prospect overrides.** All new derived tokens must be re‑declared under `.signal-scope` too, or they will not retint on `/for/[slug]`.
- **Bangla is the default locale.** Every new string ships in both `bn.ts` and `en.ts` — a missing English key is a TypeScript error and stays that way. Bangla numerals only where the number is prose; ৳ figures stay in Western digits with `2,04,500` grouping.
- **Project pricing in ৳, one time.** No monthly SaaS pricing anywhere. Care plan stays annual.
- **Every lead path ends in WhatsApp.** Every WhatsApp href must be built through `whatsappUrl()` and read `useBrand()` — never the module‑level `PHOENIX_WHATSAPP`.
- **`prefers-reduced-motion` disables reveals and rotation entirely** (final state, no transition) — not a fast animation, an *absent* one. The configurator stays fully usable.
- **Touch targets ≥ 44 px, Lighthouse Accessibility target 100, First‑load JS per public route: home / `/for/[slug]` ≤ 190 kB (current), `/demo/*` ≤ 145 kB, everything else ≤ 175 kB.** If a change pushes any route over budget, offset it in the same commit.
- **`/pitch` and `/admin`** still use the flat pre‑Obsidian look. Do **not** touch them in this pass — they are back‑office and no client sees them. Restyling them is a separate ticket.

---

## 2 — WHAT TO STEAL FROM THE McLAREN 750S REFERENCE

The reference is a screenshot of a McLaren 750S landing hero. **The car and the brand are irrelevant.** What is relevant is the compositional grammar. Steal these ten things and only these ten things:

1. **Framed cinema stage.** The whole viewport is *inside* a frame: rounded outer container, a thick top and bottom letterbox, a very slight inner glow, and a distinct sense that we are looking at a screen inside a room, not a website spilling to the browser edges. Adopt this on the hero and on the `/demo/*` full‑bleed configurator only — not on scrollable content sections.
2. **Giant background model wordmark, occluded by the vehicle.** The word "750S" sits behind the car, painted in the accent colour, at a size that runs off both edges of the frame, and the *roofline of the car passes in front of the letterforms*. This single move — three real depth planes (backdrop → giant type → vehicle) — is the difference between "3D on a page" and "3D inside a scene". We will replicate it with the vehicle's *model code* (`SEDAN‑1500` / `CBR‑150` / prospect override).
3. **Warm volumetric haze behind the car.** A soft orange‑amber cloud fills the middle third of the frame, brightest near the ground behind the wheels, fading into black. This is the *bay pool* upgraded from a flat radial gradient to a genuine stage‑light plume. Reproduce with ember at 8‑12 % + champagne at 6 % in two offset radial gradients + a very subtle animated horizontal drift under `motion.div` (paused on reduced motion).
4. **Ground reflection under the wheels.** A shallow specular streak on the "floor" of the bay that anchors the vehicle. Currently absent — the hero looks like a cutout on paper.
5. **Rim‑lit vehicle silhouette.** In the reference, the *upper edge* of the bodywork is lit and the tyres are almost black. That is a lighting decision, not a paint decision. In R3F: add a warm rim `<directionalLight>` behind‑and‑above the vehicle, intensity capped so it does not clip clearcoat, and *reduce* the front fill light. The vehicle should read as a silhouette with a warm edge from any angle.
6. **Bottom‑left technical stat pair.** `740 hp / Power` and `332 km/h / Top Speed` stacked, huge numeric with a small unit and a small label, hard‑aligned to the left edge, all monospaced numerals with all‑caps labels. Replicate as a live‑binding pair: **base price** and **the currently‑selected paint's manufacturer name** (or engine cc / seat height for bike). Two facts, monumental type, no card around them.
7. **Bottom‑centre model code plate.** "JC96" set enormous in white above a small centred paragraph. Replicate with the vehicle's real chassis / model code (e.g. `SDG‑1500` / `CBR‑150R`) as the visual anchor, and one *plain, translated* sentence below it — never the marketing tagline.
8. **Floating explore card in the bottom‑right.** A small pale‑grey rounded thumbnail of the vehicle from a second angle, plus a pill CTA underneath with a subtle horizontal gradient and a hair‑thin arrow. Replicate as the "সম্পূর্ণ কনফিগারেটর খুলুন / Open full configurator" affordance, using the vehicle's `posterUrl` as the thumbnail. The gradient uses `--ph-signal` → `--ph-signal-lit`. The arrow is a 12 px stroked line, not a lucide icon.
9. **Left vertical page‑pip rail.** Five dots stacked, the active one boxed in a hair rule. Replicate as a **scroll pip rail** binding to the eight page sections — one dot per section, active dot filled with `--ph-accent`, ring in the hair rule. Hidden below `lg`; on `lg+` it sits fixed at the left inner edge inside the outer frame. Click to `scrollIntoView({ block: 'start' })`. Keyboard accessible.
10. **Transparent‑until‑scrolled header with a centred wordmark and left/right minimalist nav.** The current header is already close; refine to match the reference's silence: the wordmark centred (not left), the language toggle + WhatsApp CTA right, the mobile menu icon left, at 68 px header height. On scroll, fuse to glass as it already does — but the border hairline becomes a *warm* champagne gradient the way the footer's ceiling strip already does.

**Do not steal** the McLaren orange (`#FF6B00`) — we have ember (`#C8382A`) and champagne (`#D4A857`) and a prospect can override the ember. **Do not steal** the McLaren typography personality — we have Bangla to serve first. **Do not steal** the "premium supercar" tone — we sell to a man who runs a reconditioned‑car showroom on Sheikh Mujib Road. The site must read as *editorial and confident*, not *aspirational and unaffordable*.

---

## 3 — DESIGN LANGUAGE UPGRADE — the concept, in one paragraph

> **"The Bay, framed."** The site is a cinema of one vehicle at a time. The hero and `/demo/*` sit inside a rounded 24 px inner frame with a hairline champagne rim, a subtle inner shadow, and letterbox padding, so every visitor understands within one glance that they are watching something. Behind the vehicle, a giant model code is painted in ember. In front of the vehicle, an editorial invoice of specs is laid down in monospaced type. To the right, one small floating card offers the full configurator; to the left, five pips let a thumb walk the whole page. The rest of the site — the auction sheet — sits *outside* the frame, on the deeper obsidian floor. The move from bay to sheet is now a *fold*, not a rule: the frame dissolves, the paperwork begins, and every section carries *one* editorial artefact big enough to be seen from three feet away.

Everything below is the implementation of that paragraph.

---

## 4 — COLOR & LIGHT REFINEMENTS

Add these to `globals.css`. **Do not delete or rename any existing token.**

### 4.1 New derived tokens (add inside `:root` AND repeat inside `.signal-scope` for anything derived from `--ph-signal`)

```css
:root {
  /* Frame — the cinema border */
  --ph-frame-radius: 28px;
  --ph-frame-inset: clamp(12px, 1.6vw, 26px);
  --ph-frame-rim: color-mix(in oklab, var(--ph-accent) 26%, transparent);
  --ph-frame-shadow:
    inset 0 1px 0 color-mix(in oklab, var(--ph-accent) 32%, transparent),
    inset 0 0 0 1px color-mix(in oklab, var(--ph-ink) 8%, transparent),
    0 40px 80px -40px rgb(0 0 0 / 0.9),
    0 0 120px -30px color-mix(in oklab, var(--ph-signal) 22%, transparent);

  /* Volumetric bay plume — replaces the single radial in .bay-lit */
  --ph-plume-ember: color-mix(in oklab, var(--ph-signal) 14%, transparent);
  --ph-plume-champ: color-mix(in oklab, var(--ph-accent) 9%, transparent);

  /* Editorial ink shades — for the giant background wordmark */
  --ph-monolith-ember: color-mix(in oklab, var(--ph-signal) 62%, var(--ph-bay));
  --ph-monolith-alu:   color-mix(in oklab, var(--ph-ink) 8%, var(--ph-bay));

  /* Ground reflection floor tone */
  --ph-floor-line: color-mix(in oklab, var(--ph-accent) 22%, transparent);

  /* Section‑header plate — a real object, not text on a background */
  --ph-plate: color-mix(in oklab, var(--ph-ink) 3.5%, var(--ph-paper));
  --ph-plate-border: color-mix(in oklab, var(--ph-ink) 14%, transparent);
}

.signal-scope {
  --ph-plume-ember: color-mix(in oklab, var(--ph-signal) 14%, transparent);
  --ph-monolith-ember: color-mix(in oklab, var(--ph-signal) 62%, var(--ph-bay));
  --ph-frame-shadow:
    inset 0 1px 0 color-mix(in oklab, var(--ph-accent) 32%, transparent),
    inset 0 0 0 1px color-mix(in oklab, var(--ph-ink) 8%, transparent),
    0 40px 80px -40px rgb(0 0 0 / 0.9),
    0 0 120px -30px color-mix(in oklab, var(--ph-signal) 22%, transparent);
}
```

### 4.2 The role of each accent, hardened

- `--ph-signal` (ember) — **the action colour and only the action colour.** It appears on: primary buttons (WhatsApp / lead), the price total figure on the configurator, the giant background wordmark in the hero, the active dot in the scroll pip rail. Nowhere else. If it is decorative, it is wrong.
- `--ph-accent` (champagne) — **the elegance layer.** Section codes, hairline highlights, focus rings, the ROI output figure, the ceiling‑light strips (top of surface cards and top of footer), the scroll pip inactive ring, the seal on the selected paint chip. Never a button ground.
- Neutrals — everything else. If a piece of text is currently in one of the two accents and does not appear on the list above, move it to `--ph-ink-soft` or `--ph-alu`.

### 4.3 Body plume (replaces the current `body::before`)

Replace the current single‑layer gradient with a two‑layer plume that offsets slightly on scroll. The plume is a fixed backdrop; it does not paint per frame — the offset is set once by a `matchMedia`/`IntersectionObserver` gate, not by `scroll`.

```css
body::before {
  content: '';
  position: fixed;
  inset: -10%;
  z-index: -1;
  pointer-events: none;
  background:
    radial-gradient(60rem 42rem at 22% 8%,  var(--ph-plume-ember), transparent 60%),
    radial-gradient(72rem 48rem at 82% 18%, var(--ph-plume-champ), transparent 65%),
    radial-gradient(90rem 38rem at 50% 110%, color-mix(in oklab, var(--ph-signal) 6%, transparent), transparent 60%);
  transform: translate3d(0, 0, 0);
  will-change: transform;
}
```

---

## 5 — TYPOGRAPHY UPGRADE

Keep the three faces (Archivo / Hind Siliguri / JetBrains Mono). Add these editorial classes to `globals.css`:

```css
/* Editorial monolith — the giant background wordmark that sits behind the vehicle. */
.monolith {
  font-family: var(--font-display);
  font-variation-settings: 'wdth' 118;
  font-weight: 900;
  letter-spacing: -0.045em;
  line-height: 0.82;
  color: var(--ph-monolith-ember);
  text-shadow:
    0 0 60px color-mix(in oklab, var(--ph-signal) 30%, transparent),
    0 0 120px color-mix(in oklab, var(--ph-signal) 18%, transparent);
  /* Read the number below at the letterform's inner counter, not at its cap height. */
  font-size: clamp(9rem, 22vw, 22rem);
}
[lang='bn-BD'] .monolith {
  /* Bangla monolith uses the vehicle's model NUMBER only — Bangla display face at these
     sizes causes conjunct instability. If the code is alphanumeric, keep it Latin. */
  font-family: var(--font-display);
}

/* Metropolis stat — the bottom‑left pair (base price + paint / cc / seat height). */
.stat-figure { font-family: var(--font-mono); font-variant-numeric: tabular-nums;
  font-size: clamp(2rem, 3.4vw, 3.25rem); font-weight: 700; letter-spacing: -0.02em; line-height: 1; }
.stat-unit   { font-family: var(--font-mono); font-size: 0.85rem; letter-spacing: 0.06em;
  color: var(--ph-alu); text-transform: uppercase; margin-inline-start: 0.35rem; }
.stat-label  { font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.22em;
  color: var(--ph-alu); text-transform: uppercase; margin-top: 0.5rem; display: block; }

/* Model plate — the "JC96" replacement in the bottom‑centre. */
.model-plate {
  font-family: var(--font-display);
  font-variation-settings: 'wdth' 90;
  font-weight: 800;
  font-size: clamp(3rem, 6vw, 5.75rem);
  letter-spacing: -0.02em;
  color: var(--ph-ink);
  text-shadow: 0 2px 30px rgb(0 0 0 / 0.55);
  line-height: 0.95;
}

/* Overline — small, wide, spaced. Used above every h2 outside the hero. */
.overline {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.24em;
  color: var(--ph-accent);
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
}

/* Bangla body distinguisher — Bangla body text is +1 step in size and +0.08 in line‑height
   relative to English at the same class, so the language doesn't feel undersold. */
[lang='bn-BD'] .display,
[lang='bn-BD'] .display-lit { line-height: 1.28; }
[lang='bn-BD'] p { line-height: 1.82; }
```

**Enforce:** Every section h2 outside the hero uses `overline` + `display display-lit`, in that order. No h2 that is just text.

---

## 6 — GLOBAL LAYOUT PRIMITIVES

Add two new components. Do **not** replace `Section` — augment it.

### 6.1 `<Frame>` — the cinema container

- Wraps the hero on `/`, `/for/[slug]`, and every `/demo/*` page.
- Renders a full‑bleed `bay` background with rounded outer corners (`--ph-frame-radius`), the champagne rim (`--ph-frame-rim`), the inner shadow / outer glow (`--ph-frame-shadow`), and inner padding of `--ph-frame-inset`.
- On mobile (`< sm`), the frame drops to 12 px rounded corners and 8 px inset — never zero, so the "we are watching a screen" reading survives.
- Exposes a `letterbox?: boolean` prop (default true on hero, false on `/demo/*` full‑bleed) that adds an inner top/bottom letterbox of `min(6vh, 56px)` filled with `--ph-bay`.
- Exposes a `pipRail?: PipItem[]` prop that renders the vertical pip rail on `lg+` fixed inside the frame's left inner padding.

Structure sketch (single file, `src/components/frame/Frame.tsx`, all Tailwind + inline style vars, no new deps):

```tsx
<section className="relative isolate mx-auto max-w-[min(94rem,calc(100vw-2rem))] px-0 py-0">
  <div className="relative overflow-hidden"
       style={{ borderRadius: 'var(--ph-frame-radius)',
                boxShadow: 'var(--ph-frame-shadow)',
                background: 'var(--ph-bay)' }}>
    <FrameRim />         {/* the 1px champagne hairline, drawn as a gradient border via ::before */}
    <Letterbox top />
    {pipRail && <PipRail items={pipRail} className="hidden lg:flex" />}
    {children}
    <Letterbox bottom />
  </div>
</section>
```

### 6.2 `<Monolith>` — the giant background wordmark

- Absolutely positioned inside `<Frame>`, `z-index: 0`, sits behind the R3F canvas (which is `z-index: 1`) but **the canvas has transparent background** and shows the wordmark through it.
- Text is the vehicle's model code — `SDG-1500`, `CBR-150`, `AXIO-4B`, etc — resolved from `Vehicle.slug.toUpperCase()` if no dedicated `modelCode` field exists yet. **Add `modelCode?: string` to `VehicleRecord`** (optional, backward compatible; when absent, derive from slug).
- Uses `.monolith`. Wraps once. If the code is longer than 6 characters at `2xl`, drop `font-variation-settings: 'wdth' 82` and let it stay on one line.
- Sits vertically centred inside the frame; horizontally its centre aligns with the vehicle's centre (which the R3F rig already knows). Bleeds off both frame edges by design.
- On a segment swap (car ↔ bike) the monolith cross‑fades (Motion `AnimatePresence`, `duration: 0.35`, no y motion) so the code changes at the same instant the car does.
- Under `prefers-reduced-motion`, no cross‑fade — instant swap.

### 6.3 `<PipRail>` — the left vertical index

- Fixed inside the frame, on `lg+` only.
- Items are hard‑coded per page: for `/` that is `['hero','problem','demos','products','maths','case','pricing','faq']` — read from the section IDs already in `SiteExperience`.
- Uses `IntersectionObserver` with a `rootMargin: '-45% 0px -45% 0px'` band so exactly one item is active at any scroll position.
- Active dot: 6 px, filled ember, ringed by a 12 px champagne 1 px hair rule.
- Inactive dot: 4 px, `--ph-alu`, opacity 0.55.
- Click scrolls to `#section` with `scrollIntoView({ block: 'start', behavior: 'smooth' })` — the browser respects reduced‑motion for `smooth`.
- Keyboard: `Tab` reaches it, arrow up/down moves between pips, Enter jumps.

### 6.4 `<StageFloor>` — the ground streak under the R3F canvas

- Absolutely positioned inside the bay, `bottom: 0`, `height: 22%`, `z-index: 2` (above the canvas but below any DOM chrome).
- One CSS radial: `radial-gradient(60% 100% at 50% 100%, var(--ph-floor-line), transparent 68%)`.
- Plus a 1 px `linear-gradient(90deg, transparent, var(--ph-floor-line), transparent)` at exactly `bottom: 22%` — the horizon line the tyres sit on.
- Zero JS. Zero raster. Reads as ground reflection at the composition level.

---

## 7 — HERO REBUILD (`src/components/home/Hero.tsx`)

**Reflow the entire hero to match the reference composition.** The current file's props stay the same (`car`, `bike`, `initialSegment`), the R3F integration stays the same, but the DOM structure changes fundamentally.

### 7.1 New DOM tree (top to bottom, all inside `<Frame letterbox pipRail={SECTIONS}>`)

```
<Frame letterbox pipRail>
  ├── <Header /> stays where it is in the layout (sticky above frame)
  ├── <Monolith text={modelCode(vehicle)} />                       z:0
  ├── <Scene ... transparent-canvas />                             z:1
  ├── <StageFloor />                                               z:2
  ├── <SegmentToggle />       top‑left, inside inset, glass pill   z:20
  ├── <DragHint />            top‑right, mono small caps           z:20
  ├── <StatPair>              bottom‑left                          z:20
  │     ├── figure: formatBDT(vehicle.basePriceBDT)   unit: ৳    label: MRP / বেস প্রাইস
  │     └── figure: paint.label or cc              unit: —        label: paint / cc
  ├── <ModelPlate>            bottom‑centre                        z:20
  │     ├── .model-plate text={modelCode(vehicle)}
  │     └── <p> one‑line vehicle name in the active locale
  ├── <ExploreCard>           bottom‑right                         z:20
  │     ├── <img src={vehicle.asset.posterUrl} 128×86 rounded />
  │     └── <a> gradient pill → localePath('/demo/{segment}')
  └── <PaintChipStrip>        floats over the bottom bleed         z:20
        chips are now 6.5rem, price delta 0.75rem, name 0.7rem
```

### 7.2 Rules the new hero must honour

- **The R3F canvas is transparent.** Set `<color attach="background" args={[environment.background]} />` in `Scene.tsx` to `[null]` **only when the vehicle is rendered inside `<Frame>`** — add a `transparentBg?: boolean` prop to `Scene` and gate the `<color>` and `<fog>` primitives on it. Fog stays off in the transparent case; use `--ph-bay` under the canvas via CSS instead.
- **Hero height:** `100dvh − var(--ph-header-h) − 2 * frame-inset`. Clamp to `min: 620 px` desktop, `min: 560 px` mobile. Never `76vh` again — the vehicle is the headline; it needs the room.
- **No hero title above the canvas on mobile.** The title lives *below* the frame on all viewports.
- **The primary CTA below the frame is one button, not two.** "আপনার বেস্ট‑সেলিং মডেল ৩ডি‑তে — ফ্রি / Your bestseller in 3D — free". The secondary "book a demo" becomes a plain underlined link to the right of it. Two visually equal buttons steal from the WhatsApp CTA that lives in the header.
- **`allowZoom={false}` stays.** The hero is not a play surface; it is a poster that moves.
- **Auto‑rotate:** as today (until first interaction, then stop for the session, disabled under reduced motion). Additionally: pause when the frame is off‑screen (already implemented via `WhenVisible` — verify it still triggers with the new DOM).

### 7.3 The paint‑chip strip, upgraded

The strip is the site's signature. It must **read as physical, from the third row of a showroom, on a phone**. Change:

- Chip width **→ 6.75 rem** (from 5.25 rem). Height of the colour swatch **→ 3.25 rem** (from 2 rem).
- Paint name font‑size **→ 0.7 rem**, tracking **+0.06 em**, uppercase, `--ph-ink-soft` (not `--ph-bay-alu`).
- Price delta **→ 0.75 rem** in JetBrains Mono, tabular. Colour matches state.
- Selected state: the whole chip translates up **6 px** (was 4), a *champagne rule* (1 px) appears along the top edge (`.lit-edge`), and the seal in the corner becomes a small ember filled circle **on a champagne outer ring** — an inkan stamp reading. The current bare tick disappears.
- Add a *shadowed float* under the chip on selection: `filter: drop-shadow(0 10px 20px color-mix(in oklab, var(--ph-signal) 30%, transparent))`.
- On the strip container, add a soft **left/right edge fade** so the row bleeds into the frame instead of ending in a hard clip: two 32 px gradient masks (`mask-image`) at the strip's left and right.
- Scroll‑snap stays. `--ph-glass` bg drops to `color-mix(in oklab, var(--ph-bay) 60%, transparent)` so the chips do not read as extra chrome — they read as sitting *on the floor*.

### 7.4 Model code resolution

Add `getModelCode(vehicle: Vehicle, locale: Locale): string` in `src/lib/vehicles.ts`. Priority: `vehicle.modelCode` → uppercase `vehicle.slug` with any hyphen kept → `vehicle.name[en]` in caps. This runs on server for the hero, so it can be sync. Add `modelCode?: string` to two existing vehicle JSON files (`sedan-generic` → `"SDG-1500"`, `naked-commuter-150` → `"NC-150"`), plus the modification one. Update the `VehicleRecord` type.

---

## 8 — SECTION‑BY‑SECTION UPGRADES BELOW THE HERO

Each section drops its current sameness. Every section from here down gets **one distinguishing artefact** (a *heaviness*) — a big number, a big rule, a big plate, a big pull‑quote — sized to be seen from three feet.

### 8.1 §2 — The problem (`problems`)

Currently a list of three lines. Rebuild as:

- Left column (`lg:col-span-5`): a huge stamped **`SEC‑02`** plate in `.overline` + a very large pull‑quote in `.display display-lit` (`clamp(2.5rem, 4vw, 4rem)`) that reads the *last* problem line as a single sentence. This is the anchor.
- Right column (`lg:col-span-7`): the three lines as before, but as a numbered list of **rows with a champagne left border 2 px**, monospaced index (`01 / 02 / 03`), and each line at `text-xl leading-snug`. The row lifts 4 px on hover and the champagne bar grows to 4 px.
- Footnote stays.
- Motion: pull‑quote reveals once with a 40 px `x` shift (not `y`) — the only section on the page that reveals horizontally, so it earns the eye.

### 8.2 §3 — Demos (`demos`) — the tab rail becomes a shelf

The tab rail is currently four glass pills. It becomes a *shelf of tabs*, each tab carrying a thumbnail + label + a monospaced short‑code:

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│  [car pic]   │  [bike pic]  │  [mod pic]   │  [360 pic]   │
│  গাড়ি        │  মোটরসাইকেল   │  মডিফিকেশন    │  ৩৬০°        │
│  CFG‑CAR     │  CFG‑BIKE    │  CFG‑MOD     │  CAP‑360     │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

- Each tab is a 96 × 108 rounded rectangle (`--radius`), a poster image with a 12 px inner padding, glass background.
- Active tab: the whole tile lifts 3 px, gains a champagne top hairline (`.lit-edge`), and the underlying panel (below) opens with a ember rim (`--ph-glass-border-lit`).
- **Keep the one‑WebGL‑context rule.** The R3F canvas re‑mounts to identical DOM; `TabsContent` is still hand‑rolled.
- The panel container becomes a real *product*: `<Frame letterbox={false}>` (a cinema frame, no letterbox, less inset) — so the demo reads as a stage of its own, not another glass card.

### 8.3 §4 — Two products (`twoProducts`) — big‑number juxtaposition

Two cards side by side today. Rebuild as **two split panels** with a shared vertical rule between them:

- Left panel: an extremely large `A` in `.monolith` sized `clamp(6rem, 12vw, 12rem)` in ember, followed by the current `newTitle` / `newAnswer` / `newBody`.
- Right panel: same, with `B` in champagne (the elegance layer — deliberate reversal, because §4B is the higher‑margin product for Phoenix and the champagne signals it).
- 1 px vertical champagne‑to‑ember gradient rule between them on `lg+`.
- The `openFull` link becomes a plate‑style pill: `border border-glass-border rounded-full px-4 py-2` with the arrow inside, matching the ExploreCard style.

### 8.4 §5 — ROI (`roi`) — a real ledger

The current split (`Inputs | Card`) is right; the output card needs weight:

- Wrap the whole ROI in `<Frame letterbox={false}>` with a *plate* background (`--ph-plate`), not glass. This is the one section that is a *document*, so it looks like one.
- The result card `.additional` figure grows to `clamp(3rem, 5vw, 4.5rem)`, becomes ember (not champagne — this is *the* number the section produces, and the section's whole job is to produce it), and gets a hairline champagne baseline directly under it.
- Add a small ember "SEAL" stamp in the top‑right of the result card — a 40 × 40 disk with `border 1px solid --ph-signal` and the mono text `SEC-05 · OUT` inside. Editorial artefact of the section.
- Sliders keep their current visuals but the track gets a champagne fill from 0 → thumb.

### 8.5 §6 — Case study — a real empty state

Currently a single `Card` with pending copy. Rebuild as a **large landscape plate**:

- A 16:7 rectangle at `bg-paper-sunk`, a dashed champagne outline (`border-dashed border-2 border-[color-mix(in_oklab,var(--ph-accent)_36%,transparent)]`), and the copy laid out as a *filed‑but‑empty document*: `CS‑00 · PENDING` in the top‑left corner, the pending title huge in `.display-lit`, the body left, the CTA plate pill on the right.
- Nothing about this should read as a broken card. It should read as *reserved space, sealed until week 3*.

### 8.6 §7 — Pricing — carve the ladder

Three price cards today, all identical. **Preserve the "no most popular badge" rule.** But signal the *product ladder* through *size*, not colour:

- P1 (Showroom Site) — 40 % column width.
- P2 (Configurator) — 32 % — the sale.
- P3 (360° Capture) — 28 % — the volume product.
- Same visual treatment (glass surface, lit edge, champagne code, ember `From`), but the price figure sizes step: 3rem / 2.5rem / 2.25rem.
- Each card carries the manufacturer‑paint‑swatch treatment on its `sheet-code` — an actual 6 px champagne square at the same baseline as the code letters — so `P1`, `P2`, `P3` read as *chips on a card*, tying pricing back to the paint‑chip signature.
- The care‑plan strip stays but its `--ph-plate` background and a thicker top rule (`2px`) tie it visually to the ROI ledger — same document, different row.
- On mobile they stack full‑width in the same order.

### 8.7 §8 — FAQ — the ledger you can open

Radix accordion stays. Restyle:

- Each item's trigger row grows to `min-h-72px` and a champagne left border **4 px** appears when open — it slides in with `layoutId`.
- The mono index (`01`, `02`, …) becomes larger (1.25rem) and champagne.
- The answer body is set to `max-w-2xl leading-relaxed` and the entire item is wrapped in a hairline‑ruled row, not a card. FAQ is not stacked cards; it is a ledger with rows.
- Add a right‑side chevron rotating 180° on open (drawn inline SVG, 12 px stroke 1.5).

### 8.8 Footer — the closing plate

Keep the current 3‑column structure. Change:

- Move Phoenix wordmark up to `text-2xl` at `wdth: 118`.
- Under the tagline, add a **`STK‑ISSUE‑<year>‑<week>`** monospaced serial (mock) as a bit of editorial jewellery — dealers like paperwork; this reads as a stock number and costs nothing.
- Add a **big rear rule**: a 1 px champagne gradient across the top of the footer that already exists — thicken to 2 px with a soft glow (`box-shadow: 0 -12px 32px -8px color-mix(in oklab, var(--ph-accent) 22%, transparent)`).
- Credits link gets the same plate‑pill treatment as `openFull` for internal consistency.

---

## 9 — CONFIGURATOR SURFACE (`/demo/*` pages)

The full‑bleed configurator pages are the second highest‑value screens on the site. Currently they render `<ConfiguratorRoot fullHeight />` with no framing. Wrap them:

- Wrap in `<Frame letterbox={false} pipRail={false}>` at the page level — same cinema container as the hero, no letterbox because the option panel needs the vertical real estate.
- Add the same **Monolith** behind the vehicle, sized down 60 % (still huge, less bleed).
- Add the **StatPair** in the bottom‑left of the bay, wired to the *live* selection: `figure = breakdown.total`, `label = TOTAL`. This mirrors the hero's stat and turns the total into a *stage element*, not a sidebar number.
- Add the **ExploreCard**'s twin: a "Send this build to WhatsApp" pill in the bottom‑right of the bay, glass‑backed, so the primary CTA is always visible without leaving the bay. The sidebar PriceSummary stays for the itemised breakdown.
- The Option Panel (right column) becomes a **narrower plate** (`--ph-plate` background, `--ph-plate-border`) with a top ceiling strip (`.lit-edge`) and a hard hairline between groups instead of the current fade. The panel reads as an *inspection card*, not a widget.
- The Action Bar under the bay: unchanged in behaviour, but grouped visually into three plates — `[env] [interior/sound/AR/rev/reset] [share]` — with 8 px gaps between plates instead of one continuous strip.

**Critical:** the WebGL context rule is untouched, `Scene.tsx` is still the only three‑importing file, and `applySelection` still runs in `useLayoutEffect`.

---

## 10 — 360° VIEWER

The Viewer360 is the highest‑ROI product for Phoenix. Give it the framing to match:

- Same `<Frame letterbox={false}>` wrap.
- The drag stage's *floor* gets the same `StageFloor` treatment as the hero — champagne horizon line + soft floor bleed under the frame count.
- Add a **big auction‑grade seal** in the top‑right of the frame, sized 80 × 80, mono `4B` (from `capture.auctionGrade`) — the actual grade the sheet says. Border ember, inner ink. This is one of the section's editorial artefacts and it must not read as decoration.
- The right‑hand data panel (specs, hotspots list) becomes a `--ph-plate` sheet with a top ceiling strip and a hairline row per spec — same treatment as the option panel, tying the two flagship products together visually.
- The frame count / progress indicator moves from a subtle bar to a monospaced fraction (`14 / 32`) in the bottom‑left of the frame, huge in `.stat-figure`.

---

## 11 — CONTACT PAGE

Currently `LeadForm` on the left, phone/address stack on the right. Rebuild as an **envelope**:

- Wrap the whole page below the header in a **plate** (`--ph-plate` bg, 1 px `--ph-plate-border`), 2 columns on `lg`, hairline vertical rule between them.
- Left column: the form. Fields now get a champagne bottom rule instead of a full glass border — cleaner, more paper‑forward. Focus rule becomes 2 px ember.
- Right column: the *contact card* — a small stamped block that reads as if pulled off the auction sheet:
  - `DIRECT` overline
  - Phone number `.stat-figure` (huge, mono)
  - Address `.leading-relaxed text-ink-soft`
  - A single ember "SEND ON WHATSAPP" plate pill under it, mirroring the submit button on the form.
- Add a **`FORM‑A / LEAD‑INTAKE`** stamp in the top‑right corner of the envelope — same treatment as the Grade seal on the 360° viewer.

---

## 12 — SHADCN & UI PRIMITIVES

`src/components/ui/*` gets tuned, not rewritten.

- `Button` gains a new variant: `variant="plate"` — the pill treatment used by `openFull` and every `Explore` affordance. Ships as: `rounded-full border border-glass-border bg-glass px-4 py-2 text-sm font-600 text-ink hover:border-[var(--ph-glass-border-lit)] hover:bg-glass-strong`.
- `Button size="lg"` grows to `h-14 px-8` (from `h-12 px-6`) — the primary CTA below the hero is now the visual anchor, so it earns the height.
- `Card` grows a `tone` prop: `'glass' | 'plate'`. `glass` is today's behaviour; `plate` uses `--ph-plate` background and `--ph-plate-border` border, and is the surface for ROI, contact, pricing‑care, and option panel.
- Accordion top rule matches the pricing top rule — 1 px `--ph-glass-border-lit`.

Any component the shadcn generator would create that is *not* in `src/components/ui/*` today must be justified in the PR body — first‑load JS matters.

---

## 13 — MOTION UPGRADES

Keep `LazyMotion` + `m` and the reveal‑on‑scroll contract. Add *distinct* motion for distinct objects:

| Object | Motion |
|---|---|
| Section reveal (default) | 620 ms, 16 px y rise, ease `[0.16, 1, 0.3, 1]`, `once: true`. **Unchanged.** |
| Hero title & sub | 720 ms, 24 px y rise, staggered 80 ms. Slower than a section reveal — the hero earns it. |
| Pull‑quote (§2 problem) | 700 ms, **40 px x shift**, no fade of surrounding. The *only* horizontal reveal in the whole site. |
| Paint chip select | 320 ms cubic bezier `[0.16, 1, 0.3, 1]`, 6 px lift + drop‑shadow spring‑to‑rest. Heavier than a nav pill. |
| Nav / tab / segment pill | 260 ms spring 400/34 — **unchanged**. |
| Monolith cross‑fade on segment swap | 350 ms, opacity only, no y. Instant under reduced motion. |
| Scroll pip active | 220 ms, opacity + scale 0.9 → 1. |
| StageFloor | static (no motion). |
| Plume | static (no motion). Adding animation here is the single biggest way to trash a mid‑range Android. |

Under `prefers-reduced-motion`, **none** of the above run — every element renders in its final state with zero transition, per the existing contract. Verify in `Reveal.tsx`, no changes needed there.

---

## 14 — ACCESSIBILITY & PERFORMANCE — the guardrails

Every change above must land without regressing these numbers. Verify with `pnpm build && pnpm start && lighthouse` on a throttled 4G profile:

- **Lighthouse Performance ≥ 92 on `/`**, ≥ 90 on `/for/[slug]`, ≥ 95 on the rest.
- **Accessibility 100** on every public route. Focus rings must remain the 2 px champagne outline everywhere. New buttons (`plate` variant) inherit the `Button` focus contract; verify explicitly.
- **CLS = 0** everywhere. The `<Frame>` container has a fixed aspect that reserves layout before the R3F canvas mounts — do this with a padding‑bottom trick, not an intrinsic size.
- **First‑load JS**: home stays ≤ 195 kB (5 kB tolerance for the new Frame + Monolith + PipRail; if it goes over, drop `tailwind-merge` from `cn()` and inline the two‑merge cases — the levers are already listed in `docs/DESIGN-PLAN.md` Rev 1).
- **LCP element on `/`** must be the vehicle poster (`vehicle.asset.posterUrl`) — verify with the perf panel that the Monolith is not stealing LCP. If it does, add `content-visibility: auto` to the monolith wrapper.
- **No new fonts, no new families, no new axes.** Archivo `wdth`, Hind Siliguri, JetBrains Mono. Anything else needs a written justification.
- **Reduced motion honoured** on every new component (Monolith, PipRail, StageFloor, paint‑chip lift). Add tests in `useReducedMotion()` branches — the PipRail must still work with `behavior: 'smooth'` because Chromium respects the OS setting for scrollIntoView.
- **RTL/Bangla:** every new class uses logical properties (`inset-inline`, `padding-inline`, `margin-inline-start`) where directional. `[lang='bn-BD']` line‑height rules apply to every new text style.
- **Touch targets:** every new interactive element ≥ 44 px on the touch axis. Chips, pips, plate pills — verified with the outline pass.
- **Colour contrast:** re‑measure `--ph-signal` on `--ph-plate` (new plate ground). Current `--ph-signal-lit` on `--ph-paper` is ~7:1; on `--ph-plate` it will be marginally lower. If it drops below 4.5:1 for text uses, tighten the mix in `.signal-scope` too.

---

## 15 — PROSPECT DEMO (`/for/[slug]`) — retinting integrity

The whole visual upgrade must retint from **one** JSON edit. Verify explicitly by running the existing `twenty-eight-motors` fixture (navy `#0B3D91`) after the rebuild:

1. The Monolith goes navy. (Because it uses `--ph-monolith-ember` derived from `--ph-signal`.)
2. The plume's ember layer goes navy. (Same.)
3. Every primary Button, the price total, the seal outlines, the paint‑chip selected‑seal outer ring, the CTA gradient — all navy. **`text-signal-ink` (white) stays white on all of them.**
4. Champagne stays champagne everywhere (accent is Phoenix‑only, per §10 of the build prompt).
5. If any new derived token forgets to re‑declare under `.signal-scope`, note in `PROJECT-STATE.md` §5.13 and fix — that section already documents this trap.

If `--ph-signal-lit` reads too dark against a navy override on obsidian, the mix ratio in `.signal-scope` needs a lift for prospects only. The rule: it must stay legible against **any** hue a prospect hands us. Test at least two more colours in a scratch fixture (a saturated green `#0F7A3B` and a warm yellow `#C99A17`) before shipping.

---

## 16 — BILINGUAL CONTRACT — new copy

Every new string added by this rebuild ships in both `bn.ts` and `en.ts`. Below is the minimum set. If a required key is missing at TypeScript compile time, the build breaks — that is the design.

```ts
hero: {
  // existing keys stay
  statMrp:         { bn: 'বেস প্রাইস',        en: 'Base price' },
  statPaint:       { bn: 'পেইন্ট',              en: 'Paint' },
  statCc:          { bn: 'ইঞ্জিন',              en: 'Engine' },
  statSeat:        { bn: 'সিট হাইট',            en: 'Seat height' },
  modelPlateSubBn: { bn: '৭৫০ কেজি হালকা, প্রতিটা রাস্তার সাথে সংযুক্ত।',
                     en: '750 kg lighter, connected to every road.' },
  exploreCta:      { bn: 'সম্পূর্ণ কনফিগারেটর', en: 'Open full configurator' },
},
scroll: {
  hero:     { bn: 'হোম',           en: 'Home' },
  problem:  { bn: 'সমস্যা',         en: 'Problem' },
  demos:    { bn: 'লাইভ ডেমো',      en: 'Live demo' },
  products: { bn: 'দুই পণ্য',        en: 'Two products' },
  maths:    { bn: 'গণিত',           en: 'The maths' },
  case:     { bn: 'কেস স্টাডি',      en: 'Case study' },
  pricing:  { bn: 'দাম',             en: 'Pricing' },
  faq:      { bn: 'প্রশ্ন',           en: 'Questions' },
},
common: {
  // …
  stampGrade:   { bn: 'অকশন গ্রেড',   en: 'Auction grade' },
  stampSection: { bn: 'সেকশন',         en: 'Section' },
},
```

Do not localise `SDG‑1500`, `CBR‑150`, `SEC‑02`, `CFG‑CAR` etc — these are codes and stay Latin in both locales.

---

## 17 — FILE‑LEVEL EXECUTION PLAN

Do the work in this order, one commit per group. Do not skip a commit boundary — reviewability matters.

1. **Tokens & primitives** — `globals.css` additions (§4, §5, §6.4), `Frame` component, `Monolith` component, `PipRail` component, `StageFloor` component. No page uses them yet.
2. **Type + data** — `VehicleRecord.modelCode`, `getModelCode()` in `vehicles.ts`, three JSON files updated, dictionary keys added in `bn.ts` + `en.ts`.
3. **Hero rebuild** — `Hero.tsx` reflowed to §7 spec. `Scene.tsx` gains `transparentBg` prop. Verify hero visually against the reference at three widths: 380 px, 900 px, 1440 px.
4. **Section‑by‑section pass** — Problem, Demos, Two Products, ROI, Case Study, Pricing, FAQ, Footer, in that order. One PR each, so a broken section can be reverted without losing the rest.
5. **Configurator surface** — `/demo/car`, `/demo/bike`, `/demo/modification` reflowed to §9.
6. **360° viewer** — reflowed to §10, grade seal added.
7. **Contact envelope** — §11.
8. **UI primitive tune** — `Button` gains `plate` variant, `Card` gains `tone`. All existing usages verified.
9. **Retint verification** — run `twenty-eight-motors`, capture navy screenshots, plus two scratch fixtures (green, yellow) as per §15.
10. **Perf & a11y regression pass** — Lighthouse on all six public routes, tab through every new component, verify reduced‑motion path.

Update `PROJECT-STATE.md` §11 to mark the pages that were flat as no longer flat, and add a §5.18 rule for any new invariant (e.g. "Every new derived token from `--ph-signal` must be re‑declared under `.signal-scope`" — already there as §5.13; extend if needed). Update `YOUR_TASK.md` with a "look at these" checklist matching this brief's order.

---

## 18 — WHAT DONE LOOKS LIKE

A Chattogram showroom owner opens the site on his phone. In the first eight seconds he sees:

1. A vehicle **inside a cinema screen**, with his‑own model code ember‑painted behind it and a warm plume behind that. The car sits *in a lit room*, on a floor with a horizon line.
2. Two facts, huge and monospaced, in the bottom‑left of the screen — the base price and the paint. He can read them from where he is sitting.
3. A model code, huge and white, in the bottom‑centre — the same code his BRTA papers use.
4. A small card in the bottom‑right with a second angle of the vehicle and a warm gradient pill saying `সম্পূর্ণ কনফিগারেটর →`.
5. A row of paint chips on the frame's bottom edge, each one physical enough that his thumb wants to touch it.
6. Five pips on the left, and he can already see which one is glowing.

He scrolls. A single sentence — his own words about his own showroom — arrives from the right of the screen. He keeps scrolling. Every section shows him **one thing** and shows it big. Nothing on the page reads as a template he has seen before.

He gets to the total in the ROI ledger and it is ember, and it is his number, and it is stamped `SEC‑05 · OUT` in the corner like an auction sheet he can already read. He gets to the pricing and sees the ladder in the *width* of the cards, not in a "most popular" badge. He gets to WhatsApp — always, from any button, from any screen.

At no point does he think *this looks like a template*, and at no point does he think *this is not for me*. **That is what done looks like.**

---

## 19 — ANTI‑PATTERNS (do not do any of these)

- Do not add gradients over content. Gradients are for the plume and the CTA pill only.
- Do not add glassmorphism on top of the R3F canvas — the transparent canvas + StageFloor + plume already read as depth. A `backdrop-blur` layer on top would flatten it.
- Do not add scroll‑linked parallax. The PipRail is the only scroll‑bound element on the site.
- Do not replace the hairline‑ruled tables in the ROI, price, spec, and 360° data panels with cards. Rows are the brand.
- Do not import a new icon library. New arrows are inline 12 px stroked SVG.
- Do not `motion.div` a section wrapper — leave `Reveal` alone. New animations attach to specific children.
- Do not add a testimonials carousel, a stat‑counter grid, or a "trusted by" logo row. None of them exist yet, none of them belong on this site until real clients exist.
- Do not localise anything into Bangla numerals that is a price or a spec. `2,04,500` stays Western digits with Bangladeshi grouping.
- Do not paste the model code into the middle of translated Bangla body copy — codes go into their own DOM node with `lang="en"` set.
- Do not open `PROJECT-STATE.md` §4 to renegotiate a locked decision. If one of them seems to block a change, the change is wrong.

---

## 20 — REVIEW CHECKLIST (paste into every PR body)

```
[ ] Hero matches §7 at 380 / 900 / 1440 px
[ ] Monolith reads through the transparent R3F canvas at every viewport
[ ] Paint‑chip strip: chips ≥ 6.75rem, deltas ≥ 0.75rem, seal has champagne outer ring
[ ] PipRail: exactly one dot active per scroll position, keyboard navigable
[ ] StageFloor draws behind the vehicle wheels — not floating on top
[ ] Every section has one editorial artefact ≥ 3 feet visible
[ ] ember is on: primary CTAs, price total, monolith, active pip. Nothing else.
[ ] champagne is on: overlines, seals, focus rings, hairlines, ceiling strips. Never a button ground.
[ ] `--ph-signal-lit` legibility ≥ 4.5:1 on `--ph-paper` AND `--ph-plate`
[ ] `/for/twenty-eight-motors` retints Monolith, plume, all primaries — champagne untouched
[ ] Two scratch prospect colours (green, yellow) also retint legibly
[ ] Reduced‑motion path renders every component in final state, no transition
[ ] Lighthouse a11y = 100 on every route
[ ] Lighthouse perf ≥ 92 on `/`, ≥ 90 on `/for/[slug]`, ≥ 95 elsewhere
[ ] First‑load JS ≤ 195 kB on `/` (5 kB tolerance)
[ ] LCP element is the vehicle poster, not the Monolith
[ ] Every new string exists in bn.ts AND en.ts; build type‑errors otherwise
[ ] `.signal-scope` re‑declares every new `var(--ph-signal)`‑derived token
[ ] Touch targets ≥ 44 px on every new interactive element
[ ] `pnpm build && pnpm start` clean; `pnpm dev` was not running while building
[ ] YOUR_TASK.md updated with the "look at these" list
[ ] PROJECT-STATE.md rules extended if a new invariant was introduced
```

---

**End of brief. Read once, plan once, ship section by section. When in doubt: the vehicle is the star, the paperwork is the trust, the frame is the theatre, and every editorial artefact on the page must be big enough to be read from three feet.**
