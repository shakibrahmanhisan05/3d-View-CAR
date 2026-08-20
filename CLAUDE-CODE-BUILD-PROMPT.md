# CLAUDE CODE BUILD PROMPT — PHOENIX (v2)
> **Instructions for Hisan:** paste everything below the line into Claude Code as your first message. Do not summarise it. Do not paste it in pieces.
>
> **What changed from v1:** the three uploaded car models are dropped entirely. Assets are now sourced from licence-verified public libraries, and the site showcases **both a car and a motorcycle** as first-class demos with segment-specific features.

---

# MISSION

You are building the marketing and demo website for **Phoenix**, a four-person studio in Chattogram, Bangladesh that builds 3D vehicle showroom websites for local car dealers, motorcycle showrooms, and modification shops.

This site is not a brochure. **The site IS the product demo.** It will be opened on a laptop or phone inside a showroom, in front of a skeptical owner who has 12 minutes and has never heard of us. If the 3D does not load fast and look beautiful on a mid-range Android over Bangladeshi mobile data, we do not get the deal.

The site must prove two things in the first ninety seconds:

1. **We can do cars.** (For the reconditioned-car dealers on Sheikh Mujib Road.)
2. **We can do motorcycles.** (For the bike showrooms on CDA Avenue — our primary revenue target.)

Everything follows from that.

---

# 0 — MANDATORY FIRST ACTIONS

Before writing any code, in this exact order:

1. **Invoke the `ui-ux-pro-max` skill and the `frontend-design` skill.** Read them fully. They govern all visual decisions. Where this prompt and those skills conflict on *aesthetics*, follow the skills. Where they conflict on *performance budgets, licensing, or architecture*, follow this prompt.

2. **Run the `frontend-design` two-pass process explicitly.** Brainstorm a design plan (colour tokens, type pairing, layout concept, signature element), critique it against §3, revise, and show me the revised plan **before writing code**.

3. **Read §12 (Asset Sourcing) completely before touching any 3D file.** There is a hard licence gate in this build and it will block you if you ignore it.

4. **Do not scaffold with `create-next-app` defaults and then restyle.** That path produces exactly the templated look we are paying to avoid. Establish design tokens first, then build components against them.

---

# 1 — CONTEXT YOU MUST HOLD ONTO

**Who visits this site:**
- **Primary:** a showroom owner, 35–60, in Chattogram, being shown the site by us, in person, in his shop. Reads Bangla more comfortably than English. Skeptical. Has been sold a bad website before.
- **Secondary:** his son or sales manager, 22–35, phone-native, who actually decides whether this is impressive.
- **Tertiary:** a dealer who got a link forwarded on WhatsApp. Mid-range Android, mobile data, zero context.

**Commercial constraints that are not negotiable:**
- The price anchor for "a website" in Bangladesh is ৳20,000–70,000, **one time**. Never display USD. Never display monthly SaaS pricing. All money in BDT (৳), presented as project pricing.
- **WhatsApp is the primary business channel.** Every lead path ends in WhatsApp, not email.
- Median mobile download speed in Bangladesh is roughly 27–42 Mbps and degrades badly under congestion. Data costs users real money. Payload size is a business constraint.
- **99% of cars sold in Bangladesh are reconditioned or used** — one-of-one stock that cannot be configured. So the site sells **two** capabilities: the configurator (new bikes, new cars, modifications) *and* 360° capture of real vehicles (used stock). Both must be demoed.

---

# 2 — TECH STACK (fixed — do not substitute)

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 15+, App Router, TypeScript strict** | RSC shell; 3D is the only heavy client island |
| Styling | **Tailwind CSS v4** + CSS custom properties for tokens | Tokens as CSS vars so the theme is swappable per client (§10) |
| 3D | **React Three Fiber + drei + three.js** | WebGL, not pixel streaming. Streaming GPU cost would exceed the revenue of this entire business. |
| Loading | `useGLTF` with `DRACOLoader` + `KTX2Loader` | Non-negotiable for payload targets |
| AR | Google `<model-viewer>`, lazy-loaded on tap | AR Quick Look on iOS, Scene Viewer on Android, no app install |
| Audio | Web Audio API directly (no Howler unless justified) | Engine sound, §7.3 |
| Animation | **Motion** (`motion/react`) for DOM; R3F's loop for 3D | Never animate 3D from React state per frame |
| Forms | React Hook Form + Zod | |
| DB | **Neon Postgres + Drizzle ORM** | Free tier sufficient |
| Assets | **Cloudflare R2** for `.glb`, HDRIs, 360° frames | Cheap egress, which matters when serving 3D |
| Deploy | **Vercel** | |
| i18n | **Bangla + English, Bangla default** — hand-rolled dictionary | Two locales does not justify a library |
| Asset tooling | `@gltf-transform/cli`, Blender headless | §13 |

**Forbidden:** 3D assets served from `/public`; disabled `next/image` optimisation; client-side fetching for static content; any dependency over 15 kB gzipped without written justification.

---

# 3 — ART DIRECTION BRIEF

## Reject these on sight

If your first instinct lands on any of these, that is the signal to go further:

- Cream/off-white background (`#F4F1EA`-ish) + high-contrast serif display + terracotta accent near `#D97757`
- Near-black background with a single acid-green or electric-violet accent
- Purple-to-blue gradients, anywhere, at any opacity
- Glassmorphic cards with `backdrop-blur` over a blurred gradient mesh
- Three-column feature grid of lucide icons in circles, two-word heading, one-line description
- `Inter` as the display face
- Headlines of the form "Elevate your…", "Transform your…", "The future of…", "Unlock…"
- `01 / 02 / 03` numbered markers where the content is not actually a sequence
- Stock photos of handshakes, cityscapes, or people pointing at laptops

## Starting direction — the auction sheet

Ground the design in the actual visual world of this trade, not the world of SaaS websites.

Every reconditioned vehicle in Bangladesh arrives with a **Japanese auction sheet**: a dense, gridded, stamped document with a condition grade (4.5, 4B, R), a hand-drawn damage diagram, and rows of terse coded data. Every dealer on Sheikh Mujib Road reads these fluently. It is the trust document of the industry. Beside it sit the **BRTA registration plate** and the **paint chip strip** — the physical swatch card a buyer holds against a body panel.

**That is the material vocabulary.** Not "automotive tech." Not "premium luxury." The specific paperwork and objects of Chattogram vehicle retail.

Structurally this implies:
- **Data is displayed as data.** Tabular, monospaced figures, tight hairline rules, grade badges. Specs in a grid that echoes an auction sheet — not rounded cards with big icons.
- **Rules and stamps carry hierarchy**, not shadows and blur.
- **The signature element is a physical paint-chip strip** — the colour selector, rendered as real swatch tabs with the manufacturer's actual paint name set small beneath (`Attitude Black Mica`, `Pearl White III`, `Racing Blue`). This is the one thing the page is remembered by. Spend your boldness here; keep everything around it disciplined.
- **Hotspots read like the hand-annotated damage diagram** on an auction sheet: numbered pins, honest labels, no euphemism.

Palette from the workshop, not from a design system: fluorescent showroom white, graphite/oil-stain dark, brushed aluminium, and **one** signal colour used with extreme restraint. Sample the accent from something real in the subject's world.

**You may reject this direction entirely** if the two-pass process produces something better grounded in the same subject matter. What you may not do is default to a generic tech-startup look. Justify your choice in one paragraph before building.

## Typography — a hard constraint

The site is **bilingual with Bangla as default**, which eliminates most fashionable display faces. Handle deliberately:

- **Bangla:** `Hind Siliguri` or `Noto Sans Bengali`. **Verify conjuncts render correctly at display sizes** — test `শোরুম`, `গাড়ি`, `মোটরসাইকেল`, `কনফিগারেশন`, `যোগাযোগ করুন`. Bangla conjuncts break in some variable font builds. Check before committing.
- **Latin display:** mechanical, industrial character, tight apertures. `Archivo` (including its Expanded width axis) is a reasonable start. Not Inter, Poppins, or Montserrat.
- **Data/figures:** monospace — `JetBrains Mono` or `IBM Plex Mono` — for all prices, specs, mileage, grades, cc, and ROI output. **Every numeral on the site is monospaced.** This is a visible design decision.

Self-host via `next/font/google`, explicit subsets (`latin`, `bengali`), `display: 'swap'`. Bangla needs more line-height than Latin at the same size — do not reuse Latin leading values.

## Motion

One orchestrated page-load sequence, not scattered effects. Since the hero *is* a live 3D scene, let the vehicle's arrival be the moment: static render paints instantly, 3D streams in behind, the swap is a deliberate reveal. Scroll effects minimal, never blocking reading.

Respect `prefers-reduced-motion` throughout: no auto-rotation, no scroll reveals, configurator fully functional.

---

# 4 — SITE ARCHITECTURE

```
/                       Home — the demo IS the hero
/demo/car               Full-screen car configurator
/demo/bike              Full-screen motorcycle configurator
/demo/360               360° real-vehicle viewer (used stock)
/work                   Case studies
/pricing                Project pricing in BDT
/process                How it works, timeline, what we need from you
/about                  The four of us
/contact                Booking form → WhatsApp
/for/[slug]             ⚠️ PER-PROSPECT DEMO — §10. Highest-value route on the site.
/pitch                  ⚠️ OFFLINE PRESENTATION MODE — §11.
/api/lead               Lead capture
/api/build              Save configuration, return share ID
/build/[id]             Restore a shared configuration
```

## `/` — Home, section by section

**1. Hero — a live vehicle, and a visible segment switch**

Above the fold, mobile included: a **live, slowly rotating vehicle** with the paint-chip strip visible and tappable **within two seconds.**

Directly on the hero, a two-state toggle: **`গাড়ি` / `মোটরসাইকেল`** (Car / Motorcycle). Switching swaps the hero vehicle in place with a short cross-dissolve. This single control does the most important job on the page — it tells a bike dealer *and* a car dealer, within one second, that we serve them both.

Copy:
- **Bangla (default):** `আপনার শোরুম রাত ২টায়ও খোলা।` / sub: `ক্রেতা ঘরে বসেই গাড়িটা ঘুরিয়ে দেখে, রং বেছে নেয়, দাম জানে — তারপর সিদ্ধান্ত নিয়ে আপনার কাছে আসে।`
- **English:** `Your showroom, open at 2am.` / sub: `Buyers walk around the vehicle, pick the colour, see the price — then arrive at your desk already decided.`
- Primary CTA: `আপনার বেস্ট-সেলিং মডেল ৩ডি-তে — ফ্রি` / `Your bestseller in 3D — free`
- Secondary: `১৫ মিনিটের ডেমো বুক করুন` / `Book a 15-minute demo`

**No hero copy above the canvas on mobile.** The vehicle is the headline.

**2. The problem, in their words** — three short Bangla-first lines from things dealers actually say. Not a card grid; large quiet type with hairline rules. e.g. *"ক্রেতা এমন রঙের ছবি চায় যেটা আপনার শোরুমে নেই।"*

**3. Segmented live demos — tabbed, all interactive**
`গাড়ি` (Car) · `মোটরসাইকেল` (Motorcycle) · `মডিফিকেশন` (Modification) · `৩৬০° রিয়েল ভেহিকেল` (360° Real Vehicle)

**Only one WebGL context alive at a time.** Switching disposes the previous scene and loads the next. Never mount four canvases.

**4. The two-product explainer** — the clearest section on the site, because prospects misunderstand this:

> **নতুন গাড়ি/বাইক?** → কনফিগারেটর। রং, হুইল, এক্সেসরিজ — ক্রেতা নিজে বেছে নেয়।
> **রিকন্ডিশন্ড গাড়ি?** → ৩৬০° ক্যাপচার। আপনার শোরুমে থাকা আসল গাড়িটাই, চারপাশ থেকে, প্রতিটা দাগসহ।

**5. ROI calculator** — §8.
**6. Case study** — one, owner's photo, his name, his showroom, hard numbers. Placeholder-ready; filled week 3.
**7. Pricing** — transparent, BDT. Dealers distrust "contact for pricing" more than a high number.
**8. FAQ** — real objections only: how long, who owns it, what if I only sell used cars, will it slow my site, what do you need from me, what happens after handover.
**9. Footer** — WhatsApp, phone, Chattogram address, Facebook, and the asset credits line (§12.5).

---

# 5 — CONFIGURATOR: SHARED ENGINE

## Data model — variant graph, not one model per variant

**The single most important architectural rule: model each vehicle once, drive every variant as data.** Never ship a separate GLB per colour. One motorcycle master must generate 40+ sellable configurations from a JSON file.

```ts
type Vehicle = {
  id: string;
  slug: string;
  name: { en: string; bn: string };
  segment: 'car' | 'motorcycle' | 'modification';
  asset: {
    glbUrl: string;              // R2, Draco + KTX2
    lodUrls?: string[];          // [high, mid, low]
    posterUrl: string;           // static hero render, <40 kB WebP/AVIF
    scale: number;
    cameraStart: [number, number, number];
    cameraTarget: [number, number, number];
    interiorCamera?: [number, number, number];  // cars only — §7.1
  };
  environments: EnvironmentPreset[];            // §7.2
  sound?: { idleUrl: string; revUrl: string };  // §7.3
  basePriceBDT: number;
  optionGroups: OptionGroup[];
  hotspots: Hotspot[];
  license: AssetLicense;                        // §12 — REQUIRED, build fails without it
};

type OptionGroup = {
  id: string;                    // 'paint' | 'wheels' | 'exhaust' | 'accessories' | ...
  label: { en: string; bn: string };
  type: 'swatch' | 'thumbnail' | 'toggle-list';
  appliesTo: ('car' | 'motorcycle' | 'modification')[];
  required: boolean;
  multiSelect: boolean;
  options: Option[];
};

type Option = {
  id: string;
  label: { en: string; bn: string };   // real paint names: 'Attitude Black Mica'
  priceDeltaBDT: number;
  swatchHex?: string;
  thumbnailUrl?: string;
  effects: Effect[];
};

// An Effect mutates the loaded scene. It NEVER swaps the model file.
type Effect =
  | { kind: 'material';   targetMeshes: string[]; material: PBRMaterialSpec }
  | { kind: 'visibility'; targetMeshes: string[]; visible: boolean }
  | { kind: 'texture';    targetMeshes: string[]; map: string }
  | { kind: 'transform';  targetMeshes: string[]; position?: Vec3; rotation?: Vec3 }
  | { kind: 'sound';      soundId: string };

type PBRMaterialSpec = {
  color: string;
  metalness: number;
  roughness: number;
  clearcoat?: number;            // essential for realistic automotive paint
  clearcoatRoughness?: number;
};
```

Vehicles live as JSON in `/data/vehicles/*.json`, loaded server-side. Move to Postgres only when a client needs self-service editing.

## Component structure

```
<ConfiguratorRoot>              // owns state, no R3F
  <Canvas>                      // dynamic import, ssr:false
    <Suspense fallback={null}>
      <Stage />                 // env map, contact shadows, ground
      <VehicleModel />          // useGLTF, applies effects imperatively
      <HotspotLayer />          // drei Html, occlusion-aware
    </Suspense>
    <CameraRig />               // OrbitControls, clamped, damped
    <AdaptiveQuality />
  </Canvas>
  <PosterFallback />            // static image until first frame
  <OptionPanel />               // segment-aware: renders car or bike groups
  <EnvironmentSwitch />         // §7.2
  <PriceSummary />              // live BDT total, monospaced
  <ActionBar />                 // Share · WhatsApp · AR · Sound · Spec sheet
</ConfiguratorRoot>
```

`<OptionPanel>` filters `optionGroups` by `appliesTo` against the active vehicle's `segment`. **One component, two segments** — do not build a separate car configurator and bike configurator. That duplication will kill you at client four.

## Non-negotiable implementation rules

1. **Never remount the model on option change.** Traverse the loaded scene graph and mutate materials/visibility imperatively in `useLayoutEffect`. A colour change must be instant — zero network, zero re-parse, under one frame.
2. **Cache materials.** Build every `MeshPhysicalMaterial` once at load into a `Map<optionId, Material>`, then reassign `mesh.material`. Never construct materials in a render pass.
3. **Clamp the camera.** `minPolarAngle ≈ 0.15π`, `maxPolarAngle ≈ 0.52π` (never under the floor), `minDistance`/`maxDistance` per vehicle. A user who loses the vehicle off-screen is a lost lead. Provide a visible reset control.
4. **Damping on.** `enableDamping`, `dampingFactor ≈ 0.05`. Undamped orbit reads as amateur instantly.
5. **Auto-rotate until first interaction**, then stop permanently for the session. It signals that the canvas is draggable. Disabled entirely under `prefers-reduced-motion`.
6. **Lighting: baked, not real-time.** One HDRI environment (≤1 MB, pre-converted), drei `ContactShadows`, at most one directional light for a specular highlight. **No real-time shadow maps.** Realism in automotive web 3D comes from the environment map, `clearcoat`, and contact shadows — **not** from polygon count. This is why a modest CC0 mesh with excellent materials will beat a high-poly download with bad ones.
7. **Adaptive quality.** Measure the first 30 frames. If average FPS < 25: drop to low LOD, halve DPR, disable contact shadows. Never let the canvas stutter — a frozen canvas in a live pitch is worse than no canvas.
8. **`dpr={[1, 2]}`** — never uncapped.
9. **Dispose on unmount.** Geometries, materials, textures, render targets, audio buffers. Tab-switching must not leak GPU memory — this is exactly what kills a pitch on the fourth tab.
10. **Touch targets ≥ 44px.** The owner taps swatches one-handed while holding the phone.

## Progressive loading — exact sequence

```
t=0.0s   Server shell paints. Poster (WebP, <40 kB) visible. Swatches look interactive.
t=0.3s   Canvas mounts (dynamic import, ssr:false). Poster still on top.
t~1.5s   Low LOD GLB decoded, first frame rendered behind poster.
t~1.6s   Poster cross-fades out over 400ms. Auto-rotation begins.
t~3.0s   High LOD swaps in silently if the device passed the FPS check.
```

**If the poster is not visible in under 1 second, that is a bug, not a slow network.**

---

# 6 — SEGMENT-SPECIFIC OPTION GROUPS

Both segments run on the same engine. Their option sets are different, and the differences are commercially meaningful — these are the things Chattogram dealers actually upsell.

## 6.1 Car (`segment: 'car'`)

| Group | Type | Options | Notes |
|---|---|---|---|
| `paint` | swatch | 6 colours | Real paint names. Clearcoat on. **The signature element.** |
| `wheels` | thumbnail | 4 alloy designs | Visibility-swap between wheel meshes |
| `tint` | toggle-list | Clear / Light / Dark | Glass material opacity + colour |
| `bodykit` | toggle-list | Spoiler, bull bar, roof rack, side steps | Visibility toggles |
| `interior` | swatch | Fabric / Leather black / Leather beige | Drives interior view (§7.1) |
| `wrap` | thumbnail | 3 wrap patterns | Texture-swap on body — this is the **modification** upsell |

## 6.2 Motorcycle (`segment: 'motorcycle'`) — the priority segment

Bikes are the beachhead. Give this segment the richer option set, because accessory attach is where a Chattogram bike dealer's margin actually lives.

| Group | Type | Options | Notes |
|---|---|---|---|
| `paint` | swatch | 6 colours | Tank + fairing + fender share the paint material |
| `exhaust` | thumbnail | Stock / Short slip-on / Full system | **Visibility swap + sound change** (§7.3). Highest-margin accessory in this market. |
| `crashguard` | toggle-list | None / Standard / Bull guard | Extremely common purchase in Bangladesh — do not omit |
| `seat` | swatch | Stock / Gel / Split seat | Material + geometry swap |
| `handlebar` | thumbnail | Stock / Clip-on / Riser | Transform + visibility |
| `lights` | toggle-list | Stock / LED headlight / Auxiliary fog | Emissive material toggle |
| `tyres` | thumbnail | Stock / Tubeless / Wide profile | Material + scale |
| `tankpad` | thumbnail | 4 decal designs | Texture decal on tank mesh |
| `windscreen` | toggle-list | None / Visor / Touring screen | Visibility |

**Rider height check (do this — it converts):** a control for rider height (5'2" – 6'0") that shows a simple silhouette figure seated on the bike at correct scale, plus a one-line verdict — `উভয় পা মাটিতে` ("both feet flat"), `পায়ের আঙুল` ("tip-toe"). Seat height anxiety is a genuine, near-universal purchase objection for motorcycles in this market and almost nobody addresses it online. It needs only a scaled 2D silhouette overlay, not a rigged 3D character. Cheap to build, disproportionately memorable in a pitch.

## 6.3 Modification (`segment: 'modification'`)

Reuse the car model with only `wrap`, `wheels`, `bodykit`, and `tint` enabled, plus a **before/after split slider** — drag a vertical divider across the canvas to reveal stock versus modified. Two render targets, one canvas.

This is the demo for Fast and Furious BD, Automart, and the Dewanhat accessory shops, where visual change *is* the product being sold.

---

# 7 — THE FOUR SIGNATURE FEATURES

These come from the Phoenix team's own brainstorm. Build all four. They are what makes this site memorable rather than merely competent.

## 7.1 Interior / driver's seat view (cars)

A toggle: `বাইরে` / `ভেতরে` (Outside / Inside).

Inside animates the camera smoothly to the driver's eye position (`asset.interiorCamera`) over ~1.2s with an eased path, narrows the FOV slightly, and unlocks a constrained look-around (yaw ±120°, pitch ±40°) instead of orbit. Interior material selections from §6.1 are visible here.

**Do not build a second scene.** Same loaded GLB, different camera and controls mode. If the sourced model has no interior geometry, ship the toggle disabled with a `শীঘ্রই আসছে` state rather than faking it — and note it in the asset requirements so we source a model that has one.

## 7.2 Environment switch (both segments)

Four presets, switchable live: **Showroom · Street · Sunset · Night.**

Each preset = one HDRI + a ground material + a subtle camera reframe. Implementation:

```ts
type EnvironmentPreset = {
  id: 'showroom' | 'street' | 'sunset' | 'night';
  label: { en: string; bn: string };
  hdriUrl: string;        // Poly Haven, CC0, pre-converted, ≤1 MB
  groundColor: string;
  groundRoughness: number;
  exposure: number;
};
```

**The team's original brainstorm proposed a background video for the off-road view. Do not do that** — a video will not composite correctly behind a 3D object, will not respond to the vehicle's reflections, and will add several megabytes to a payload budget that has no room. Swapping the HDRI achieves the same emotional effect, costs a fraction of the bytes, and *actually changes the reflections on the paint*, which is the thing that sells it. Preload the showroom HDRI; lazy-load the other three on first switch.

Sunset and night are the strongest sales moments — **colour-under-different-light is the single most common source of post-purchase colour regret**, and being able to answer it is a real, sayable benefit.

## 7.3 Engine / exhaust sound (motorcycles primarily)

Genuinely valuable in this market — exhaust note is an emotional purchase driver for a Bangladeshi bike buyer, not a gimmick. And it **changes with the exhaust option selected**, which is what turns it from a toy into a sales tool.

Rules:
- **Muted by default. Never autoplay.** A speaker icon with an explicit tap. We will be demoing inside quiet showrooms; surprise audio is embarrassing.
- Two clips per exhaust option: `idle` (loop, ~4s) and `rev` (one-shot, ~3s).
- Web Audio API. Lazy-load the buffer only on first tap. Total audio budget **≤ 400 kB** across all clips, mono, 96 kbps AAC or Opus.
- Selecting a different exhaust while sound is on cross-fades to that exhaust's clip. **That moment — tap a slip-on exhaust and hear the note change — is worth more in a bike showroom than any statistic on the page.**
- Visible mute control persists in the action bar.

Source sounds as CC0 from Freesound (filter: Creative Commons 0) and record them in the manifest exactly as with models. If no clean CC0 clip exists, ship the feature with the button disabled rather than with a bad clip.

## 7.4 Live BDT price summary

Always visible, monospaced, updating instantly on every option change:

```
বেস দাম          ৳ 1,85,000
স্লিপ-অন এক্সহস্ট   ৳   12,500
এলইডি হেডলাইট     ৳    4,200
ক্র্যাশ গার্ড        ৳    2,800
─────────────────────────────
মোট              ৳ 2,04,500
```

Below it, one button: **`এই কনফিগারেশন হোয়াটসঅ্যাপে পাঠান`** ("Send this build to WhatsApp"). This is the single most important conversion action on the entire site.

---

# 8 — 360° REAL-VEHICLE VIEWER

A **separate component from the configurator**, and commercially the more important of the two — it sells to the reconditioned-car dealers, the largest prospect cluster in Chattogram.

**Input:** 32 JPEG/WebP frames shot at even intervals around a real vehicle.

- Drag / swipe to rotate. Momentum with friction, snapping to nearest frame.
- **Preload frames 0, 8, 16, 24 first** so a quarter-turn works before full load; fill the rest in background.
- Each frame ≤ 60 kB (WebP q≈78, 1200px wide). 32 frames ≈ 1.9 MB, streamed.
- **Hotspot pins anchored to specific frames with a visibility arc** — a pin on the rear bumper appears only across frames where that bumper is visible. Label honestly: `পেছনের বাম্পারে হালকা দাগ` ("light scratch on rear bumper"). **Honesty is the entire product here.**
- **Auction-sheet data panel** beside the viewer: grade, year, registration year, mileage, engine, transmission, colour. Monospaced figures, tight grid, hairline rules.
- **Zero WebGL.** DOM and images only. Must work on the oldest phone in any showroom.

Ship with placeholder frames; Omlan supplies real frames in week 2. Build a `scripts/process-360.sh` that takes a folder of raw JPEGs and outputs the optimised WebP sequence plus a manifest — we will run this dozens of times.

---

# 9 — ROI CALCULATOR

On `/` and `/pricing`. Must be usable live, in a meeting, while the owner watches.

**Inputs (BDT, sliders with monospaced numeric display), with a car/bike segment toggle:**
- Monthly showroom walk-ins — default 60
- Average sale value — default ৳12,00,000 (car) / ৳1,80,000 (bike)
- Current close rate % — default 12
- Current monthly Facebook boost spend — default ৳15,000

**Output:**
- Current monthly revenue
- Projected at a **conservative 15% lift in qualified leads** — do not use the 40%+ figures from foreign vendor marketing. An inflated number destroys credibility with a man who has run a showroom for twenty years.
- Additional revenue in BDT, shown large
- Phoenix project cost amortised over 12 months, shown small beside it
- One line: `আপনার বর্তমান বুস্ট খরচের X% — কিন্তু একবারের`

State the assumption openly beneath the result. **A calculator that visibly under-claims wins the room; one that overclaims loses it.**

---

# 10 — `/for/[slug]` — THE HIGHEST-VALUE ROUTE ON THE SITE

**Read this twice.** Our entire go-to-market is: walk into a showroom, offer to build their bestselling model in 3D free, deliver in three days, then ask for the deal. That only works if producing a bespoke demo takes **under an hour**.

```jsonc
// /data/prospects/twenty-eight-motors.json
{
  "slug": "twenty-eight-motors",
  "businessName": { "bn": "টুয়েন্টি এইট মোটরস", "en": "Twenty Eight Motors" },
  "logoUrl": "...",
  "brandAccent": "#0B3D91",
  "whatsapp": "8801XXXXXXXXX",
  "phone": "...",
  "address": { "bn": "সিডিএ এভিনিউ, চট্টগ্রাম", "en": "CDA Avenue, Chattogram" },
  "segment": "motorcycle",
  "heroVehicleId": "naked-commuter-150",
  "vehicleIds": ["naked-commuter-150", "sport-155"],
  "expiresAt": "2026-09-01"
}
```

`/for/[slug]` renders the **entire site experience** with that prospect's name, logo, accent, phone, and vehicles substituted throughout. It must feel like *their* website, not a Phoenix page with a logo pasted on.

- Accent flows through the CSS custom property layer — one variable retints the whole site. **This is the main reason tokens must be CSS vars, not hard-coded Tailwind classes.**
- `noindex, nofollow` on all `/for/*`.
- `expiresAt` renders a quiet banner: `এই ডেমোটি {date} পর্যন্ত সক্রিয়`. Enforces the 14-day demo window.
- Every WhatsApp CTA points at **their** number, so the owner watches a real lead land on his own phone during the meeting. That moment closes deals.
- `pnpm new-prospect <slug>` scaffolds the JSON from a template.

**Acceptance test: a complete branded prospect demo must require editing exactly one JSON file and nothing else.**

---

# 11 — `/pitch` — OFFLINE PRESENTATION MODE

Showroom wifi is unreliable; mobile data inside a concrete building is worse. **We will be presenting in these rooms.** A spinner mid-pitch is a lost deal.

- Aggressively preloads every asset for a chosen prospect on first visit, while still on good wifi at home.
- Service worker caches GLBs, HDRIs, 360° frames, audio, fonts.
- Renders `Assets cached ✓ — ready to present offline` so we can verify before leaving.
- Keyboard/swipe navigation between states: hero → car configurator → bike configurator → 360° → ROI → pricing.
- No browser chrome, no scroll, full-screen, landscape-optimised for a tablet held out toward the owner.

Two-hour build. Will save at least one deal.

---

# 12 — ASSET SOURCING AND THE LICENCE GATE

**This section is a hard requirement. A model without documented licence metadata must fail the build.**

## 12.1 Why we are using generic, unbranded vehicles

We deliberately do **not** want branded supercars. Three reasons, all commercial:

1. **Zero trademark exposure.** Vehicle body shapes, badges, grille patterns and model names are protected IP. An unbranded sedan carries none of that risk.
2. **The client mentally substitutes his own vehicle.** Show a Chattogram recon dealer a Mercedes GLS and he thinks *"that is not my business."* Show him a clean generic sedan and he sees his Axio.
3. **We can modify, retint and reuse it forever** across every client without renegotiating anything.

**Target shapes:** a **mid-size 4-door sedan** (reads as Axio/Premio/Allion — the volume cars in Bangladesh) and a **naked commuter motorcycle, 125–160cc** (reads as FZ/Pulsar/Hornet — the volume bikes). Not a supercar. Not a cruiser. Not an SUV.

## 12.2 Approved sources, in priority order

| Priority | Source | Licence | Fetchable by you? | Use for |
|---|---|---|---|---|
| 1 | **Poly Haven** (`polyhaven.com`) | **CC0** — confirmed, commercial use, no attribution required | ✅ Yes, public API + direct URLs | **HDRIs and textures.** Their Vehicles category is currently empty — do not look for cars here. |
| 2 | **Sketchfab**, filtered `Downloadable` + `CC0` or `CC-BY` | CC0 / CC-BY | ❌ Requires login — **Hisan downloads manually** | The primary model source. glTF export is standard on all downloadable models. |
| 3 | **poly.pizza** | Mixed CC0 / CC-BY, stated per model | ✅ Direct download URLs | Fallback models, props |
| 4 | **Quaternius** / **Kenney** | CC0 | ✅ Direct zip URLs | **Stylised low-poly — emergency placeholder only.** Too toy-like for a premium pitch. Do not ship these as the hero. |
| 5 | **Freesound**, filter CC0 | CC0 | ✅ | Engine/exhaust audio (§7.3) |
| 6 | **ambientCG** | CC0 | ✅ | PBR materials for ground, wraps, tank decals |

**Search Sketchfab by generic shape, never by brand name.** Use: `sedan car low poly`, `generic sedan gltf`, `naked motorcycle`, `commuter motorcycle`, `city bike 3d`. A model titled with a manufacturer's name is a signal to skip it regardless of the stated licence — the uploader usually had no right to model it.

## 12.3 The licence manifest — enforced

Every asset in the project must have an entry in `/data/asset-manifest.json`:

```ts
type AssetLicense = {
  assetId: string;
  file: string;                    // 'vehicles/sedan-generic.glb'
  sourceUrl: string;               // the exact page it came from
  sourceSite: 'polyhaven' | 'sketchfab' | 'polypizza' | 'quaternius'
            | 'kenney' | 'freesound' | 'ambientcg' | 'original';
  author: string;
  license: 'CC0' | 'CC-BY-4.0' | 'CC-BY-SA-4.0' | 'commercial-purchased' | 'original';
  attributionRequired: boolean;
  attributionText?: string;        // required when attributionRequired is true
  verifiedOn: string;              // ISO date Hisan checked the licence page
  screenshotPath?: string;         // saved screenshot of the licence page
  modifications: string;           // 'decimated to 45k tris, rebuilt PBR materials, badges removed'
};
```

**Build-time enforcement — implement this, do not skip it:**

Write `scripts/verify-licenses.ts` and wire it into `prebuild`. It must:
- Walk every `.glb`, `.hdr`, `.ktx2`, `.webp` in the asset directories
- Fail the build with a clear error if any file has no manifest entry
- Fail if `attributionRequired: true` and `attributionText` is empty
- Fail if any `license` is not on the allowed list — **`CC-BY-NC`, "free for personal use", and unspecified all fail**
- Emit `/data/generated-credits.json` for the footer

**Rejection rules:** never accept a model whose licence page cannot be reached; never accept "free" without an explicit licence name; never accept CC-BY-NC (we are a commercial project); never ship badge or logo geometry on a model without written clearance. If a sourced model has badges, **delete that geometry in Blender** and note it in `modifications`.

## 12.4 Build unblocked: procedural placeholders first

**Do not block Phase 3 waiting for asset acquisition.** Build `<PlaceholderVehicle segment="car" | "motorcycle">` from three.js primitives — a boxy sedan and a simple bike silhouette, correctly scaled, with named meshes matching the real manifest (`body_paint`, `wheel_fl`, `exhaust_stock`, `tank`, …).

The configurator must run **fully** against placeholders: colour swaps, visibility toggles, price maths, camera behaviour, environment switching, adaptive quality. Real assets then drop in by editing the vehicle JSON — **zero code changes.**

If that swap requires touching a component, the abstraction is wrong. Fix it before shipping.

## 12.5 Attribution in the footer

Render a small `অ্যাসেট ক্রেডিট / Asset credits` link in the footer opening a modal generated from `generated-credits.json`. CC0 needs no attribution but list it anyway — it costs nothing and signals professionalism to any client who asks where the models came from.

---

# 13 — 3D ASSET PIPELINE

Whatever you source will be an authoring format. Convert it. Report actual before/after sizes at each step.

```bash
# 1. Blender headless → glTF (if source is .blend/.fbx/.obj)
blender -b input.blend --python-expr "
import bpy
bpy.ops.export_scene.gltf(
  filepath='/tmp/out.glb',
  export_format='GLB',
  export_draco_mesh_compression_enable=False,
  export_apply=True,
  export_yup=True
)"

# 2. Inspect
npx @gltf-transform/cli inspect /tmp/out.glb

# 3. Optimise: dedupe, prune, weld, resample, Draco, KTX2
npx @gltf-transform/cli optimize /tmp/out.glb ./assets-src/vehicle.glb \
  --compress draco --texture-compress ktx2 --texture-size 2048

# 4. LODs
npx @gltf-transform/cli simplify ./assets-src/vehicle.glb ./assets-src/vehicle-mid.glb --ratio 0.5  --error 0.001
npx @gltf-transform/cli simplify ./assets-src/vehicle.glb ./assets-src/vehicle-low.glb --ratio 0.25 --error 0.005
```

**Critical manual step before export:** in Blender, **rename meshes to stable semantic names.** `Effect.targetMeshes` references these directly. If they are called `Cube.003` the configurator is unmaintainable.

Required naming convention:

```
Car:   body_paint · wheel_fl · wheel_fr · wheel_rl · wheel_rr · tyre_* · glass_windshield
       glass_side · chrome_trim · headlight_lens · taillight_lens · interior_seats
       interior_dash · badge_front · badge_rear · spoiler · bullbar · roofrack

Bike:  body_paint · tank · fairing_l · fairing_r · fender_front · fender_rear
       wheel_front · wheel_rear · tyre_front · tyre_rear · exhaust_stock
       exhaust_slipon · exhaust_full · seat_stock · seat_gel · handlebar_stock
       handlebar_clipon · crashguard · headlight_lens · engine · badge_tank
```

Alternate parts (three exhausts, three seats) all ship **in the same GLB**, hidden by default, toggled by visibility. That is why one file generates forty configurations. Keep total triangles within budget across all variants combined.

**Strip badge geometry into separate `badge_*` nodes** so it can be toggled per client — some will not have brand clearance.

**Targets — enforce, do not aspire:**

| Metric | Budget |
|---|---|
| Hero GLB, high LOD (all variants included) | **≤ 3.5 MB** |
| Mid LOD | ≤ 1.8 MB |
| Low LOD | ≤ 900 kB |
| HDRI, per environment | ≤ 1 MB pre-converted |
| Poster image | ≤ 40 kB |
| Triangles, hero vehicle | ≤ 120,000 |
| Audio, all clips combined | ≤ 400 kB |
| Textures | 2048 max; 1024 for anything that is not body paint |

Write this as `scripts/process-model.sh <input> <slug>`. We will run it dozens of times; it must not be a sequence of copy-pasted commands.

---

# 14 — PERFORMANCE BUDGET (business-critical)

| Metric | Target | Measured on |
|---|---|---|
| LCP | **< 2.0s** | Moto G Power class, 4G throttled |
| Time to interactive 3D | **< 3.0s** | same |
| Initial JS (excl. 3D chunk) | **< 130 kB gzipped** | |
| Total first-load payload | **< 5 MB** including GLB | |
| Sustained FPS, mid-tier Android | **≥ 30** | |
| Sustained FPS, desktop | 60 | |
| Lighthouse Performance (mobile) | ≥ 88 | |
| Lighthouse Accessibility | 100 | |

**Enforcement:**
- Dynamic-import the whole R3F tree with `ssr: false`. Three.js must never enter the main bundle.
- `@next/bundle-analyzer` in the repo; check before any commit adding a dependency.
- `Cache-Control: public, max-age=31536000, immutable` on all R2 assets, hashed filenames.
- Preconnect to the R2 domain in `<head>`.
- Every image via `next/image` with explicit dimensions. Zero CLS.
- If `WebGLRenderingContext` is unavailable, render the 360° image viewer instead. Never an error, never a blank box.

**Test on a real mid-range Android over mobile data — not a laptop on wifi, not a simulator.** Report measured numbers.

---

# 15 — BUILD ORDER

Show me the result at each checkpoint before continuing.

**Phase 0 — Design plan.** Run the frontend-design two-pass process. Output token system (4–6 named hex values), type pairing with Bangla verified, layout concept, signature element, plus your critique against §3 and what you revised. **Stop and show me before writing code.**

**Phase 1 — Licence gate + placeholders.** `asset-manifest.json` schema, `scripts/verify-licenses.ts` wired to `prebuild`, and the procedural placeholder car and bike with correct mesh names. **Prove the build fails on an undocumented asset.**

**Phase 2 — Shell + tokens.** Next.js scaffold, CSS var token layer, typography with Bangla verified against real strings, header/footer, bilingual routing and dictionary, empty pages.

**Phase 3 — Configurator engine.** Full R3F per §5, running on placeholders. Paint swatches, live BDT pricing, camera clamps, adaptive quality, dispose-on-unmount, environment switching. **Hardest part of the build — budget accordingly.**

**Phase 4 — Segment option sets.** §6 car and bike groups, one `<OptionPanel>` serving both. Rider height check. Modification before/after slider.

**Phase 5 — Signature features.** §7: interior view, environment presets, engine sound, price summary with WhatsApp handoff.

**Phase 6 — Real assets.** Source per §12, run the pipeline per §13, swap in via JSON. **If this requires component changes, Phase 3's abstraction was wrong — fix it, do not patch around it.**

**Phase 7 — Homepage + 360° viewer.** All nine sections, tabbed demos with single-context switching, ROI calculator, 360° with placeholder frames.

**Phase 8 — Leads + WhatsApp + admin.** `/api/lead`, `/api/build`, share links, WhatsApp deep links, `/admin` table behind an env-var password with CSV export. No auth system.

**Phase 9 — `/for/[slug]` + `/pitch`.** The two commercial multipliers. Do not skip these because they feel like extras — they are the reason the site earns money.

**Phase 10 — Remaining pages, SEO, QA.** Metadata, OG images, `sitemap.ts`, `robots.ts`, JSON-LD LocalBusiness with the Chattogram address.

---

# 16 — ACCEPTANCE CRITERIA

Do not report complete until every one passes:

**Assets & licensing**
- [ ] Build **fails** when any asset lacks a manifest entry — demonstrate this
- [ ] Every model, HDRI, texture and audio clip has `sourceUrl`, `author`, `license`, `verifiedOn`
- [ ] No `CC-BY-NC`, no "free for personal use", no unspecified licences anywhere
- [ ] No manufacturer badge or logo geometry on any shipped model
- [ ] Footer credits modal renders from `generated-credits.json`

**Both segments**
- [ ] Hero car/bike toggle swaps the vehicle in place, in under 1.5s, on mobile
- [ ] `/demo/car` and `/demo/bike` both fully functional, sharing one `<OptionPanel>`
- [ ] Bike shows exhaust, crash guard, seat, handlebar, lights, tyres, tank pad
- [ ] Car shows paint, wheels, tint, body kit, interior, wrap
- [ ] Rider height check renders correctly at all four heights
- [ ] Modification before/after slider works on touch and mouse

**Signature features**
- [ ] Interior view animates smoothly and constrains look-around correctly
- [ ] All four environment presets swap HDRI, ground, and exposure; reflections visibly change on the paint
- [ ] Engine sound is muted by default, loads only on tap, and **changes with the exhaust selection**
- [ ] Price summary updates instantly; WhatsApp message contains the full itemised build in Bangla

**Performance & quality**
- [ ] Poster visible **< 1s**, interactive 3D **< 3s**, real mid-range Android, mobile data
- [ ] Colour change instant — no network, no visible frame drop
- [ ] Camera cannot go under the floor; vehicle cannot be lost; reset control present
- [ ] Switching all four demo tabs six times leaks no GPU memory and does not degrade FPS
- [ ] ≥30 FPS sustained on mid-tier Android; adaptive quality demonstrably engages when throttled
- [ ] Site fully usable with WebGL disabled (360° fallback, no error state)
- [ ] `prefers-reduced-motion` disables rotation and reveals; configurator stays fully functional
- [ ] Keyboard navigable with visible focus; canvas has an accessible text alternative describing the vehicle and current configuration
- [ ] Lighthouse mobile: Performance ≥88, Accessibility 100

**Commercial**
- [ ] A new prospect demo at `/for/<slug>` requires editing **exactly one JSON file**
- [ ] `/pitch` works fully **with the network disabled** after a warm visit
- [ ] Every string renders in both Bangla and English — including hotspots, options, errors, empty states
- [ ] Bangla conjuncts correct at display sizes (`শোরুম`, `যোগাযোগ`, `মোটরসাইকেল`, `কনফিগারেশন`)
- [ ] **Zero USD. Zero monthly SaaS pricing.** All money in BDT as project pricing.
- [ ] No purple gradients, no glassmorphic cards, no icon-circle feature grid, no Inter as display

---

# 17 — THINGS NOT TO DO

- Do not build auth, user accounts, multi-tenancy, or a dealer dashboard. Out of scope for months.
- Do not build separate car and bike configurator components. One engine, data-driven segments.
- Do not use a background video for the off-road/environment effect. HDRI swap, per §7.2.
- Do not autoplay audio, ever.
- Do not ship Kenney/Quaternius stylised low-poly as the hero vehicle. Placeholder only.
- Do not download any model whose licence page you cannot reach and record.
- Do not add a blog, newsletter, or chatbot.
- Do not use pixel streaming, Unity WebGL, or Unreal.
- Do not put 3D assets in `/public`. R2 with cache headers.
- Do not use real-time shadow maps or more than one directional light.
- Do not use lorem ipsum. Write real Bangla and English copy — bad placeholder copy in a live pitch is worse than an empty section.
- Do not add a feature not in this document without asking me first.

---

# 18 — FIRST RESPONSE

Reply with:

1. Confirmation that you have read the `ui-ux-pro-max` and `frontend-design` skills
2. **Your Phase 0 design plan** — token system, type pairing with Bangla handling, layout concept, signature element — plus your self-critique against the anti-defaults list in §3, and what you revised and why
3. **Your asset sourcing plan** — which specific sources you will pull from directly, and a shortlist of exactly what I need to download manually from Sketchfab (search terms, shape requirements, whether interior geometry is needed)
4. Any question where this brief is genuinely ambiguous

Then stop and wait for my approval before writing code.
