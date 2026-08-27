'use client';

import { useEffect, useRef } from 'react';

export function StudioEngine() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function loadEngine() {
      try {
        const THREE = await import('three');
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');

        const $ = (id: string) => document.getElementById(id);
        const T = (bn: string, en: string) => (window as any).PHX_T ? (window as any).PHX_T(bn, en) : bn;
        const TAKA = (n: number) => (window as any).PHX_TAKA ? (window as any).PHX_TAKA(n) : '৳ ' + n;

        /* ============================================================
           PART MAPS
           ============================================================ */
        const CAR_PARTS: Record<string, number[]> = {
          paint:   [2, 3, 4, 6, 9, 11, 14, 16, 17, 21, 22, 23, 24, 25, 27],
          roof:    [11],
          glass:   [8, 32, 39, 43, 48],
          wheels:  [0, 1, 5, 10, 13, 26, 36, 62],
          trims:   [7, 12, 15, 20, 33, 60, 63],
          headl:   [29, 30],
          taill:   [37, 38]
        };
        const BIKE_PARTS: Record<string, number[]> = {
          paint:   [2, 5, 8, 9, 11, 26, 36, 51],
          forks:   [23, 35, 48, 50],
          wheels:  [0, 1],
          exhaust: [37, 24, 38],
          headl:   [21],
          seatish: [13, 15]
        };

        const N = (i: number) => 'tripo_part_' + i;

        /* ============================================================
           OPTION CATALOGUE (BDT)
           ============================================================ */
        const CAR_BASE = 3250000;
        const BIKE_BASE = 285000;

        const CAR_PAINTS = [
          { id: 'stock', bn: 'স্টক ফিনিশ', en: 'Stock finish', hex: null, chip: '#2E2F31', price: 0 },
          { id: 'pearl', bn: 'পার্ল হোয়াইট', en: 'Pearl White', hex: '#E9EAEA', chip: '#E9EAEA', price: 25000 },
          { id: 'black', bn: 'অ্যাটিটিউড ব্ল্যাক', en: 'Attitude Black', hex: '#0F1113', chip: '#141619', price: 15000 },
          { id: 'silver', bn: 'সিলভার মেটালিক', en: 'Silver Metallic', hex: '#AEB4B9', chip: '#B7BCC1', price: 15000 },
          { id: 'wine', bn: 'ওয়াইন রেড', en: 'Wine Red', hex: '#5E1220', chip: '#6E1423', price: 30000 },
          { id: 'ocean', bn: 'ওশান ব্লু', en: 'Ocean Blue', hex: '#16335F', chip: '#1B3B6F', price: 30000 },
          { id: 'beige', bn: 'ডেজার্ট বেজ', en: 'Desert Beige', hex: '#B9A17C', chip: '#C9B18C', price: 25000 }
        ];
        const BIKE_PAINTS = [
          { id: 'stock', bn: 'রেসিং ব্লু (স্টক)', en: 'Racing Blue (stock)', hex: null, chip: '#3B66B2', price: 0 },
          { id: 'matte', bn: 'ম্যাট ব্ল্যাক', en: 'Matte Black', hex: '#1A1C1F', chip: '#1F2226', price: 6500 },
          { id: 'orange', bn: 'ফিনিক্স অরেঞ্জ', en: 'Phoenix Orange', hex: '#D93A12', chip: '#FF4D1C', price: 8500 },
          { id: 'white', bn: 'পার্ল হোয়াইট', en: 'Pearl White', hex: '#E6E8EA', chip: '#E8EAEC', price: 7500 },
          { id: 'army', bn: 'আর্মি গ্রিন', en: 'Army Green', hex: '#41522F', chip: '#4A5D3A', price: 8500 }
        ];

        const CAR_GROUPS = [
          { key: 'paint', code: 'GRP-01 · PAINT', bn: 'পেইন্ট', en: 'Paint', type: 'swatch', opts: CAR_PAINTS },
          { key: 'wheels', code: 'GRP-02 · WHEELS', bn: 'হুইল', en: 'Wheels', type: 'row', opts: [
            { id: 'stock', bn: 'স্টক অ্যালয়', en: 'Stock alloy', price: 0 },
            { id: 'gunmetal', bn: '১৭" গানমেটাল', en: '17" gunmetal', price: 45000 },
            { id: 'glossblk', bn: '১৭" গ্লস ব্ল্যাক', en: '17" gloss black', price: 38000 }
          ]},
          { key: 'tint', code: 'GRP-03 · GLASS', bn: 'গ্লাস টিন্ট', en: 'Glass tint', type: 'row', opts: [
            { id: 'none', bn: 'ক্লিয়ার (স্টক)', en: 'Clear (stock)', price: 0 },
            { id: 'mid', bn: 'মিডিয়াম টিন্ট', en: 'Medium tint', price: 8000 },
            { id: 'dark', bn: 'ডার্ক টিন্ট', en: 'Dark tint', price: 12000 }
          ]},
          { key: 'kit', code: 'GRP-04 · BODY', bn: 'বডি কিট', en: 'Body kit', type: 'row', opts: [
            { id: 'none', bn: 'স্টক বডি', en: 'Stock body', price: 0 },
            { id: 'street', bn: 'স্ট্রিট কিট — ব্ল্যাকআউট ট্রিম', en: 'Street kit — blackout trims', price: 55000 }
          ]},
          { key: 'wrap', code: 'GRP-05 · WRAP', bn: 'রুফ র‍্যাপ', en: 'Roof wrap', type: 'row', opts: [
            { id: 'none', bn: 'বডি কালার', en: 'Body colour', price: 0 },
            { id: 'black', bn: 'গ্লস ব্ল্যাক রুফ', en: 'Gloss black roof', price: 15000 }
          ]},
          { key: 'interior', code: 'GRP-06 · CABIN', bn: 'ইন্টেরিয়র', en: 'Interior', type: 'row', opts: [
            { id: 'fabric', bn: 'ফেব্রিক (স্টক)', en: 'Fabric (stock)', price: 0 },
            { id: 'leather', bn: 'প্রিমিয়াম লেদার', en: 'Premium leather', price: 85000 }
          ]}
        ];

        const BIKE_GROUPS = [
          { key: 'paint', code: 'GRP-01 · PAINT', bn: 'পেইন্ট', en: 'Paint', type: 'swatch', opts: BIKE_PAINTS },
          { key: 'forks', code: 'GRP-02 · FORKS', bn: 'ফ্রন্ট ফর্ক', en: 'Front forks', type: 'row', opts: [
            { id: 'gold', bn: 'গোল্ড অ্যানোডাইজ (স্টক)', en: 'Gold anodize (stock)', price: 0 },
            { id: 'black', bn: 'ব্ল্যাক অ্যানোডাইজ', en: 'Black anodize', price: 9500 },
            { id: 'titan', bn: 'টাইটানিয়াম ফিনিশ', en: 'Titanium finish', price: 12000 }
          ]},
          { key: 'exhaust', code: 'GRP-03 · EXHAUST', bn: 'এগজস্ট', en: 'Exhaust', type: 'row', opts: [
            { id: 'stock', bn: 'স্টক সাইলেন্সার', en: 'Stock silencer', price: 0 },
            { id: 'slip', bn: 'স্লিপ-অন — ডিপ নোট', en: 'Slip-on — deep note', price: 28000 },
            { id: 'full', bn: 'ফুল সিস্টেম — রেস নোট', en: 'Full system — race note', price: 52000 }
          ]},
          { key: 'wheelcol', code: 'GRP-04 · WHEELS', bn: 'হুইল ফিনিশ', en: 'Wheel finish', type: 'row', opts: [
            { id: 'stock', bn: 'স্টক', en: 'Stock', price: 0 },
            { id: 'dark', bn: 'ডার্ক স্মোক', en: 'Dark smoke', price: 5500 }
          ]},
          { key: 'headlight', code: 'GRP-05 · LIGHTS', bn: 'হেডলাইট', en: 'Headlight', type: 'row', opts: [
            { id: 'stock', bn: 'হ্যালোজেন (স্টক)', en: 'Halogen (stock)', price: 0 },
            { id: 'led', bn: 'LED প্রজেক্টর', en: 'LED projector', price: 6500 }
          ]},
          { key: 'protect', code: 'GRP-06 · GUARD', bn: 'প্রোটেকশন', en: 'Protection', type: 'multi', opts: [
            { id: 'crash', bn: 'ক্র্যাশ গার্ড', en: 'Crash guard', price: 4500 },
            { id: 'tank', bn: 'ট্যাংক প্যাড', en: 'Tank pad', price: 800 },
            { id: 'screen', bn: 'উইন্ডস্ক্রিন', en: 'Windscreen', price: 3200 }
          ]}
        ];

        /* config state */
        const cfg: any = {
          car:  { paint: 'stock', wheels: 'stock', tint: 'none', kit: 'none', wrap: 'none', interior: 'fabric' },
          bike: { paint: 'stock', forks: 'gold', exhaust: 'stock', wheelcol: 'stock', headlight: 'stock', protect: [] }
        };

        /* ============================================================
           BOOT — fetch models with real progress
           ============================================================ */
        const boot: any = {
          el: $('boot'),
          bars: { car: $('bb-car'), bike: $('bb-bike'), eng: $('bb-eng') },
          txt: { car: $('bt-car'), bike: $('bt-bike'), eng: $('bt-eng'), total: $('bt-total') },
          got: { car: 0, bike: 0 }, tot: { car: 31247376, bike: 32168560 }
        };
        function mb(n: number) { return (n / 1048576).toFixed(1); }
        function bootProg(key: 'car' | 'bike', got: number, total: number) {
          boot.got[key] = got; if (total) boot.tot[key] = total;
          const p = Math.min(100, got / boot.tot[key] * 100);
          if (boot.bars[key]?.firstElementChild) {
            (boot.bars[key].firstElementChild as HTMLElement).style.width = p + '%';
          }
          if (p >= 100 && boot.bars[key]) boot.bars[key].classList.add('ok');
          if (boot.txt[key]) boot.txt[key].textContent = mb(got) + ' MB / ' + mb(boot.tot[key]) + ' MB';
          const g = boot.got.car + boot.got.bike, t = boot.tot.car + boot.tot.bike;
          if (boot.txt.total) boot.txt.total.textContent = Math.min(99, Math.round(g / t * 92)) + '%';
        }
        async function fetchProgress(url: string, key: 'car' | 'bike') {
          const res = await fetch(url);
          if (!res.ok) throw new Error('HTTP ' + res.status + ' — ' + url);
          const total = +(res.headers.get('content-length') || 0) || boot.tot[key];
          const reader = res.body?.getReader();
          if (!reader) {
            const buf = await res.arrayBuffer();
            bootProg(key, buf.byteLength, buf.byteLength);
            return buf;
          }
          const chunks = []; let got = 0;
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value); got += value.length;
            bootProg(key, got, total);
          }
          const buf = new Uint8Array(got);
          let o = 0; for (const c of chunks) { buf.set(c, o); o += c.length; }
          return buf.buffer;
        }

        /* ============================================================
           THREE core
           ============================================================ */
        const DPR = Math.min(window.devicePixelRatio || 1, 1.75);
        let sedanRoot: any = null, bikeRoot: any = null;
        let sedanHero: any = null, bikeHero: any = null;
        let pmremEnv: any = null;

        function makeRenderer(container: HTMLElement) {
          const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
          r.setPixelRatio(DPR);
          r.setSize(container.clientWidth, container.clientHeight);
          r.toneMapping = THREE.ACESFilmicToneMapping;
          r.toneMappingExposure = 1.0;
          r.outputColorSpace = THREE.SRGBColorSpace;
          container.appendChild(r.domElement);
          r.domElement.style.display = 'block';
          return r;
        }

        function groundTexture(inner: string, outer: string) {
          const c = document.createElement('canvas'); c.width = c.height = 512;
          const x = c.getContext('2d')!;
          const g = x.createRadialGradient(256, 256, 40, 256, 256, 256);
          g.addColorStop(0, inner); g.addColorStop(1, outer);
          x.fillStyle = g; x.fillRect(0, 0, 512, 512);
          const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
          return t;
        }
        function shadowTexture() {
          const c = document.createElement('canvas'); c.width = c.height = 256;
          const x = c.getContext('2d')!;
          const g = x.createRadialGradient(128, 128, 8, 128, 128, 128);
          g.addColorStop(0, 'rgba(0,0,0,.62)'); g.addColorStop(.55, 'rgba(0,0,0,.30)'); g.addColorStop(1, 'rgba(0,0,0,0)');
          x.fillStyle = g; x.fillRect(0, 0, 256, 256);
          return new THREE.CanvasTexture(c);
        }

        function normalize(root: any, rotY: number) {
          const wrap = new THREE.Group();
          root.rotation.y = rotY;
          wrap.add(root);
          const box = new THREE.Box3().setFromObject(wrap);
          const size = box.getSize(new THREE.Vector3());
          const s = 4 / Math.max(size.x, size.y, size.z);
          wrap.scale.setScalar(s);
          const box2 = new THREE.Box3().setFromObject(wrap);
          const c = box2.getCenter(new THREE.Vector3());
          wrap.position.x -= c.x; wrap.position.z -= c.z; wrap.position.y -= box2.min.y;
          const spin = new THREE.Group(); spin.add(wrap);
          return spin;
        }

        function collectParts(spin: any) {
          const map: Record<string, any[]> = {};
          spin.traverse((o: any) => {
            if (o.isMesh) {
              let n = o.name;
              let p = o.parent;
              while (p && !/^tripo_part_\d+$/.test(n)) { n = p.name; p = p.parent; }
              if (/^tripo_part_\d+$/.test(n)) (map[n] = map[n] || []).push(o);
              if (o.material) o.material.envMapIntensity = 0.9;
              o.frustumCulled = true;
            }
          });
          return map;
        }

        /* ---------- material machinery ---------- */
        const matCache: Record<string, any> = {};
        function paintMat(hex: string | null, opts: any = {}) {
          const k = 'p' + hex + JSON.stringify(opts);
          if (!matCache[k]) {
            matCache[k] = new THREE.MeshPhysicalMaterial({
              color: hex ? new THREE.Color(hex) : new THREE.Color('#ffffff'),
              metalness: opts.metal ?? 0.25, roughness: opts.rough ?? 0.34,
              clearcoat: opts.coat ?? 1.0, clearcoatRoughness: 0.08,
              envMapIntensity: 1.1
            });
          }
          return matCache[k];
        }
        function storeOriginals(parts: any) {
          const orig: Record<string, any[]> = {};
          for (const n in parts) orig[n] = parts[n].map((m: any) => m.material);
          return orig;
        }
        function setParts(parts: any, idxList: number[] = [], mat: any = null) {
          (idxList || []).forEach((i) => {
            const arr = parts[N(i)]; if (!arr) return;
            arr.forEach((m: any) => { m.material = mat; });
          });
        }
        function restoreParts(parts: any, orig: any, idxList: number[] = []) {
          (idxList || []).forEach((i) => {
            const arr = parts[N(i)]; if (!arr) return;
            arr.forEach((m: any, j: number) => { m.material = orig[N(i)]?.[j]; });
          });
        }
        function tintClone(parts: any, orig: any, idxList: number[] = [], fn: (c: any) => void) {
          (idxList || []).forEach((i) => {
            const arr = parts[N(i)]; if (!arr) return;
            arr.forEach((m: any, j: number) => {
              const src = orig[N(i)]?.[j];
              if (!src) return;
              const c = src.clone(); fn(c); m.material = c;
            });
          });
        }

        /* ============================================================
           STAGES
           ============================================================ */
        class Stage {
          box: HTMLElement;
          renderer: any;
          scene: any;
          camera: any;
          controls: any;
          autoRotate = true;
          visible = true;
          key: any; rim: any; amb: any;
          gdisc: any; groundGroup: any;

          constructor(container: HTMLElement) {
            this.box = container;
            this.renderer = makeRenderer(container);
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
            this.camera.position.set(5.4, 2.1, 5.6);
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            Object.assign(this.controls, {
              enableDamping: true, dampingFactor: 0.07, enablePan: false,
              minDistance: 3.4, maxDistance: 11, minPolarAngle: 0.22, maxPolarAngle: 1.48
            });
            this.controls.target.set(0, 0.72, 0);
            this.lights();
            this.groundGroup = this.ground();
            new IntersectionObserver((es) => { if (es[0]) this.visible = es[0].isIntersecting; },
              { threshold: 0.02 }).observe(container);
            window.addEventListener('resize', () => this.resize());
            this.resize();
          }
          lights() {
            this.key = new THREE.DirectionalLight(0xffffff, 1.5); this.key.position.set(4, 7, 3);
            this.rim = new THREE.DirectionalLight(0xbfd4ff, 0.7); this.rim.position.set(-5, 3, -5);
            this.amb = new THREE.AmbientLight(0xffffff, 0.25);
            this.scene.add(this.key, this.rim, this.amb);
          }
          ground() {
            const g = new THREE.Group();
            this.gdisc = new THREE.Mesh(
              new THREE.CircleGeometry(7.5, 72),
              new THREE.MeshStandardMaterial({ map: groundTexture('#23272b', '#0d1012'), roughness: 0.9, metalness: 0 })
            );
            this.gdisc.rotation.x = -Math.PI / 2; this.gdisc.position.y = -0.002;
            const sh = new THREE.Mesh(
              new THREE.PlaneGeometry(4.6, 4.6),
              new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false })
            );
            sh.rotation.x = -Math.PI / 2; sh.position.y = 0.005;
            const ring = new THREE.Mesh(
              new THREE.RingGeometry(3.16, 3.2, 96),
              new THREE.MeshBasicMaterial({ color: 0x3a4148, transparent: true, opacity: 0.5 })
            );
            ring.rotation.x = -Math.PI / 2; ring.position.y = 0.006;
            g.add(this.gdisc, sh, ring);
            this.scene.add(g);
            return g;
          }
          resize() {
            const w = this.box.clientWidth, h = this.box.clientHeight;
            if (!w || !h) return;
            this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
            this.renderer.setSize(w, h);
          }
          render() { this.renderer.render(this.scene, this.camera); }
        }

        /* environment presets */
        const ENVS: Record<string, any> = {
          showroom: { bg: null, exp: 1.05, key: [0xffffff, 1.5], rim: [0xbfd4ff, .7], amb: .25, gIn: '#2a2f34', gOut: '#101315', envI: 1.0 },
          street:   { bg: 0x14171a, exp: .92, key: [0xf2f5ff, 1.1], rim: [0x8fa8c8, .5], amb: .18, gIn: '#1e2226', gOut: '#0b0d0f', envI: .75 },
          sunset:   { bg: 0x1d1410, exp: 1.0, key: [0xffb066, 1.6], rim: [0x7a86c8, .55], amb: .16, gIn: '#2b211a', gOut: '#0e0b09', envI: .85 },
          night:    { bg: 0x07090c, exp: .8,  key: [0x9db8e8, .55], rim: [0x4d6a9a, .8], amb: .08, gIn: '#12161c', gOut: '#05070a', envI: .5 }
        };
        function applyEnv(stage: Stage, name: string) {
          const e = ENVS[name];
          stage.scene.background = e.bg == null ? null : new THREE.Color(e.bg);
          stage.renderer.toneMappingExposure = e.exp;
          stage.key.color.setHex(e.key[0]); stage.key.intensity = e.key[1];
          stage.rim.color.setHex(e.rim[0]); stage.rim.intensity = e.rim[1];
          stage.amb.intensity = e.amb;
          stage.gdisc.material.map = groundTexture(e.gIn, e.gOut);
          stage.gdisc.material.needsUpdate = true;
          stage.scene.traverse((o: any) => {
            if (o.isMesh && o.material && 'envMapIntensity' in o.material) o.material.envMapIntensity = e.envI;
          });
        }

        /* ============================================================
           ENGINE SOUND (WebAudio synth)
           ============================================================ */
        const snd: any = { ctx: null, on: false, nodes: null };
        function sndParams() {
          const seg = state.tab === 'car' ? 'car' : 'bike';
          if (seg === 'car') return { base: 34, lp: 420, gain: .22, wob: 2.2 };
          const ex = cfg.bike.exhaust;
          if (ex === 'slip') return { base: 52, lp: 1500, gain: .34, wob: 5.5 };
          if (ex === 'full') return { base: 60, lp: 2300, gain: .4, wob: 7 };
          return { base: 46, lp: 850, gain: .28, wob: 4.5 };
        }
        function sndStart() {
          if (!snd.ctx) snd.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const c = snd.ctx; if (c.state === 'suspended') c.resume();
          const p = sndParams();
          const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = p.base;
          const o2 = c.createOscillator(); o2.type = 'square'; o2.frequency.value = p.base * 2.02;
          const lfo = c.createOscillator(); lfo.frequency.value = p.wob;
          const lfoG = c.createGain(); lfoG.gain.value = p.base * 0.12;
          lfo.connect(lfoG); lfoG.connect(o1.frequency); lfoG.connect(o2.frequency);
          const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = p.lp; lp.Q.value = 1.4;
          const g = c.createGain(); g.gain.value = 0;
          const g2 = c.createGain(); g2.gain.value = .4;
          o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(c.destination);
          o1.start(); o2.start(); lfo.start();
          g.gain.linearRampToValueAtTime(p.gain, c.currentTime + .5);
          snd.nodes = { o1, o2, lfo, lp, g, g2 };
          snd.on = true;
        }
        function sndStop() {
          if (!snd.nodes) return;
          const { o1, o2, lfo, g } = snd.nodes, c = snd.ctx;
          g.gain.linearRampToValueAtTime(0, c.currentTime + .3);
          setTimeout(() => { try { o1.stop(); o2.stop(); lfo.stop(); } catch (e) {} }, 380);
          snd.nodes = null; snd.on = false;
        }
        function sndRetune(rev?: boolean) {
          if (!snd.on || !snd.nodes) return;
          const p = sndParams(), c = snd.ctx, n = snd.nodes;
          const t = c.currentTime;
          if (rev) {
            n.o1.frequency.cancelScheduledValues(t);
            n.o1.frequency.setValueAtTime(n.o1.frequency.value, t);
            n.o1.frequency.linearRampToValueAtTime(p.base * 3.2, t + .55);
            n.o1.frequency.linearRampToValueAtTime(p.base, t + 1.5);
            n.o2.frequency.linearRampToValueAtTime(p.base * 6.4, t + .55);
            n.o2.frequency.linearRampToValueAtTime(p.base * 2.02, t + 1.5);
          } else {
            n.o1.frequency.linearRampToValueAtTime(p.base, t + .4);
            n.o2.frequency.linearRampToValueAtTime(p.base * 2.02, t + .4);
          }
          n.lp.frequency.linearRampToValueAtTime(p.lp, t + .4);
          n.g.gain.linearRampToValueAtTime(p.gain, t + .4);
        }

        /* ============================================================
           STATE
           ============================================================ */
        const state: any = {
          heroSeg: 'car',
          tab: 'car',
          env: 'showroom',
          split: 0.5,
          v360: { angle: 0, drag: false },
          buildNo: 'PHX-' + String(1000 + Math.floor(Math.random() * 9000))
        };

        let hero: Stage, studio: Stage;
        let sedanParts: any, bikeParts: any, sedanOrig: any, bikeOrig: any;
        let heroSedanParts: any, heroBikeParts: any, heroSedanOrig: any, heroBikeOrig: any;
        let headlightGlow: any = null;

        /* ============================================================
           CONFIG → MATERIAL application
           ============================================================ */
        function applyCarConfig(parts: any, orig: any, c: any) {
          if (c.paint === 'stock') restoreParts(parts, orig, CAR_PARTS.paint || []);
          else {
            const p = CAR_PAINTS.find((x) => x.id === c.paint);
            if (p) setParts(parts, CAR_PARTS.paint || [], paintMat(p.hex));
          }
          if (c.wrap === 'black') setParts(parts, CAR_PARTS.roof || [], paintMat('#0B0C0E', { rough: .18 }));
          if (c.wheels === 'stock') restoreParts(parts, orig, CAR_PARTS.wheels || []);
          else if (c.wheels === 'gunmetal') tintClone(parts, orig, CAR_PARTS.wheels || [], (m) => { m.color = new THREE.Color('#8a939b'); m.metalness = .85; m.roughness = .3; });
          else tintClone(parts, orig, CAR_PARTS.wheels || [], (m) => { m.color = new THREE.Color('#17181a'); m.metalness = .7; m.roughness = .22; });

          if (c.tint === 'none') restoreParts(parts, orig, CAR_PARTS.glass || []);
          else tintClone(parts, orig, CAR_PARTS.glass || [], (m) => {
            m.color = new THREE.Color(c.tint === 'mid' ? '#3a3f45' : '#121417');
            m.roughness = .05; m.metalness = .1;
          });

          if (c.kit === 'none') restoreParts(parts, orig, CAR_PARTS.trims || []);
          else setParts(parts, CAR_PARTS.trims || [], paintMat('#101214', { rough: .5, coat: .2, metal: .1 }));
        }

        function applyBikeConfig(parts: any, orig: any, c: any) {
          if (c.paint === 'stock') restoreParts(parts, orig, BIKE_PARTS.paint || []);
          else {
            const p = BIKE_PAINTS.find((x) => x.id === c.paint);
            if (p) setParts(parts, BIKE_PARTS.paint || [], paintMat(p.hex, c.paint === 'matte' ? { coat: 0, rough: .6 } : {}));
          }
          if (c.forks === 'gold') restoreParts(parts, orig, BIKE_PARTS.forks || []);
          else if (c.forks === 'black') setParts(parts, BIKE_PARTS.forks || [], paintMat('#131417', { metal: .8, rough: .3, coat: .4 }));
          else setParts(parts, BIKE_PARTS.forks || [], paintMat('#7d8288', { metal: .95, rough: .25, coat: .2 }));

          if (c.exhaust === 'stock') restoreParts(parts, orig, BIKE_PARTS.exhaust || []);
          else if (c.exhaust === 'slip') tintClone(parts, orig, BIKE_PARTS.exhaust || [], (m) => { m.color = new THREE.Color('#9aa1a8'); m.metalness = .9; m.roughness = .25; });
          else tintClone(parts, orig, BIKE_PARTS.exhaust || [], (m) => { m.color = new THREE.Color('#3a63b8'); m.metalness = .95; m.roughness = .2; });

          if (c.wheelcol === 'stock') restoreParts(parts, orig, BIKE_PARTS.wheels || []);
          else tintClone(parts, orig, BIKE_PARTS.wheels || [], (m) => { m.color = new THREE.Color('#57595c'); });

          if (c.headlight === 'stock') { restoreParts(parts, orig, BIKE_PARTS.headl || []); if (headlightGlow) headlightGlow.visible = false; }
          else {
            tintClone(parts, orig, BIKE_PARTS.headl || [], (m) => { m.emissive = new THREE.Color('#cfe6ff'); m.emissiveIntensity = 1.6; });
            if (headlightGlow) headlightGlow.visible = (state.tab !== 'car');
          }
        }

        const STOCK_BIKE = { paint: 'stock', forks: 'gold', exhaust: 'stock', wheelcol: 'stock', headlight: 'stock', protect: [] };

        let splitSnap: any = null;
        function takeSnapshot(parts: any) {
          const meshes: any[] = [], mats: any[] = [];
          for (const n in parts) parts[n].forEach((m: any) => { meshes.push(m); mats.push(m.material); });
          return { meshes, mats };
        }
        function rebuildSplitSnapshots() {
          applyBikeConfig(bikeParts, bikeOrig, STOCK_BIKE);
          const s = takeSnapshot(bikeParts);
          applyBikeConfig(bikeParts, bikeOrig, cfg.bike);
          const b = takeSnapshot(bikeParts);
          splitSnap = {
            meshes: s.meshes, stock: s.mats, build: b.mats,
            glowStock: false, glowBuild: cfg.bike.headlight === 'led'
          };
        }
        function assignSnapshot(which: 'stock' | 'build') {
          if (!splitSnap) return;
          const mats = which === 'stock' ? splitSnap.stock : splitSnap.build;
          splitSnap.meshes.forEach((m: any, i: number) => { m.material = mats[i]; });
          if (headlightGlow) headlightGlow.visible = which === 'stock' ? splitSnap.glowStock : splitSnap.glowBuild;
        }

        /* ============================================================
           PRICE
           ============================================================ */
        function priceItems(seg: 'car' | 'bike') {
          const items: any[] = [];
          const groups = seg === 'car' ? CAR_GROUPS : BIKE_GROUPS;
          const c = cfg[seg];
          items.push({ bn: seg === 'car' ? 'বেস — সেডান ১.৫G হাইব্রিড' : 'বেস — ন্যাকেড ১৫৫cc',
                       en: seg === 'car' ? 'Base — Sedan 1.5G Hybrid' : 'Base — Naked 155cc',
                       price: seg === 'car' ? CAR_BASE : BIKE_BASE });
          groups.forEach((g: any) => {
            if (g.type === 'multi') {
              (c[g.key] || []).forEach((id: string) => {
                const o = g.opts.find((x: any) => x.id === id);
                if (o) items.push({ bn: o.bn, en: o.en, price: o.price });
              });
            } else {
              const o = g.opts.find((x: any) => x.id === c[g.key]);
              if (o && o.price > 0) items.push({ bn: o.bn, en: o.en, price: o.price });
            }
          });
          return items;
        }
        function renderPrice() {
          const seg = state.tab === 'car' ? 'car' : 'bike';
          const items = priceItems(seg);
          const lines = $('price-lines');
          if (lines) {
            lines.innerHTML = items.map((it) =>
              '<div class="pl"><span class="k">' + T(it.bn, it.en) + '</span><span class="v">' +
              (it.price ? TAKA(it.price) : ((window as any).PHX_LANG && (window as any).PHX_LANG() === 'bn' ? 'অন্তর্ভুক্ত' : 'INCL.')) + '</span></div>'
            ).join('');
          }
          const total = items.reduce((s, it) => s + it.price, 0);
          const pt = $('price-total');
          if (pt) pt.textContent = TAKA(total);
          const pdNo = $('pd-no');
          if (pdNo) pdNo.textContent = 'BUILD № ' + state.buildNo;
        }
        function waBuildMessage() {
          const seg = state.tab === 'car' ? 'car' : 'bike';
          const items = priceItems(seg);
          const total = items.reduce((s, it) => s + it.price, 0);
          const bn = (window as any).PHX_LANG && (window as any).PHX_LANG() === 'bn';
          const head = bn
            ? 'আসসালামু আলাইকুম! Phoenix ডেমো থেকে আমার কনফিগারেশন (' + state.buildNo + '):'
            : 'Hello! My build from the Phoenix demo (' + state.buildNo + '):';
          const body = items.map((it) => '• ' + (bn ? it.bn : it.en) + ' — ' + TAKA(it.price)).join('\n');
          const foot = (bn ? 'মোট: ' : 'Total: ') + TAKA(total);
          return head + '\n' + body + '\n' + foot;
        }

        /* ============================================================
           OPTION PANEL
           ============================================================ */
        function renderPanel() {
          const seg = state.tab === 'car' ? 'car' : 'bike';
          const groups = seg === 'car' ? CAR_GROUPS : BIKE_GROUPS;
          const c = cfg[seg];
          const el = $('option-panel');
          if (!el) return;
          let html = '';
          if (state.tab === 'mod') {
            html += '<div class="pgroup"><div class="pgroup-h"><span class="t">' +
              T('বাম পাশ স্টক · ডান পাশ আপনার বিল্ড', 'Left is stock · right is your build') +
              '</span><span class="code">SPLIT</span></div><p style="font-size:13px;color:var(--fluor-dim);margin:0;">' +
              T('নিচের অপশন বদলান — মাঝের হ্যান্ডেল টেনে আগে-পরে তুলনা করুন।',
                'Change options below — drag the centre handle to compare before and after.') + '</p></div>';
          }
          groups.forEach((g: any) => {
            html += '<div class="pgroup"><div class="pgroup-h"><span class="t">' + T(g.bn, g.en) +
                    '</span><span class="code">' + g.code + '</span></div>';
            if (g.type === 'swatch') {
              html += '<div class="opt-swatches">' + g.opts.map((o: any) =>
                '<button class="opt-swatch' + (c[g.key] === o.id ? ' on' : '') + '" data-g="' + g.key + '" data-o="' + o.id +
                '" title="' + T(o.bn, o.en) + (o.price ? ' (+' + TAKA(o.price) + ')' : '') +
                '"><i style="background:' + o.chip + '"></i></button>').join('') + '</div>';
              const sel = g.opts.find((x: any) => x.id === c[g.key]);
              if (sel) {
                html += '<div style="margin-top:8px;font-size:12.5px;color:var(--fluor-dim);display:flex;justify-content:space-between;">' +
                  '<span>' + T(sel.bn, sel.en) + '</span><span class="mono">' + (sel.price ? '+' + TAKA(sel.price) : '৳ 0') + '</span></div>';
              }
            } else if (g.type === 'multi') {
              html += '<div class="opt-list">' + g.opts.map((o: any) => {
                const on = (c[g.key] || []).includes(o.id);
                return '<button class="opt-row' + (on ? ' on' : '') + '" data-g="' + g.key + '" data-o="' + o.id + '" data-multi="1">' +
                  '<span class="radio" style="border-radius:3px;"></span><span class="ol">' + T(o.bn, o.en) +
                  '</span><span class="op">+' + TAKA(o.price) + '</span></button>';
              }).join('') + '</div>';
            } else {
              html += '<div class="opt-list">' + g.opts.map((o: any) =>
                '<button class="opt-row' + (c[g.key] === o.id ? ' on' : '') + '" data-g="' + g.key + '" data-o="' + o.id + '">' +
                  '<span class="radio"></span><span class="ol">' + T(o.bn, o.en) +
                  '</span><span class="op">' + (o.price ? '+' + TAKA(o.price) : '৳ 0') + '</span></button>').join('') + '</div>';
            }
            html += '</div>';
          });
          el.innerHTML = html;
          el.querySelectorAll('[data-g]').forEach((b: any) => {
            b.addEventListener('click', () => {
              const gk = b.getAttribute('data-g'), oid = b.getAttribute('data-o');
              if (b.getAttribute('data-multi')) {
                const arr = cfg[seg][gk];
                const ix = arr.indexOf(oid);
                if (ix >= 0) arr.splice(ix, 1); else arr.push(oid);
              } else {
                cfg[seg][gk] = oid;
              }
              onConfigChanged(gk);
              renderPanel(); renderPrice();
            });
          });
        }

        function onConfigChanged(groupKey: string) {
          if (state.tab === 'car') {
            applyCarConfig(sedanParts, sedanOrig, cfg.car);
          } else {
            applyBikeConfig(bikeParts, bikeOrig, cfg.bike);
            if (state.tab === 'mod') rebuildSplitSnapshots();
            if (groupKey === 'exhaust') sndRetune(true);
          }
        }

        /* ============================================================
           TABS
           ============================================================ */
        function setTab(tab: string) {
          state.tab = tab;
          document.querySelectorAll('.studio-tabs [data-tab]').forEach((b: any) =>
            b.classList.toggle('on', b.getAttribute('data-tab') === tab));

          const isBikeVisible = tab !== 'car';
          if (sedanRoot) sedanRoot.visible = (tab === 'car' || tab === 'v360');
          if (bikeRoot) bikeRoot.visible = (tab === 'bike' || tab === 'mod');
          if (tab === 'v360') { if (sedanRoot) sedanRoot.visible = true; if (bikeRoot) bikeRoot.visible = false; }

          $('split-ui')?.classList.toggle('on', tab === 'mod');
          $('rider-ui')?.classList.toggle('on', tab === 'bike');
          const vWrap = $('v360-wrap'); if (vWrap) vWrap.style.display = tab === 'v360' ? 'block' : 'none';
          const optPanel = $('option-panel'); if (optPanel) optPanel.style.display = tab === 'v360' ? 'none' : 'block';
          const p360 = $('panel-360'); if (p360) p360.style.display = tab === 'v360' ? 'block' : 'none';
          const pDoc = $('price-doc'); if (pDoc) pDoc.style.display = tab === 'v360' ? 'none' : 'block';
          $('studio-hint')?.classList.toggle('gone', tab === 'v360');

          if (headlightGlow) headlightGlow.visible = isBikeVisible && cfg.bike.headlight === 'led' && tab !== 'v360';

          if (tab === 'car') applyCarConfig(sedanParts, sedanOrig, cfg.car);
          if (tab === 'bike' || tab === 'mod') applyBikeConfig(bikeParts, bikeOrig, cfg.bike);
          if (tab === 'v360') { applyEnv(studio, 'street'); restoreAllCar(); v360Draw(true); }
          else applyEnv(studio, state.env);

          if (snd.on) sndRetune(false);
          if (tab === 'mod') rebuildSplitSnapshots();
          renderPanel(); renderPrice();
        }
        function restoreAllCar() {
          const all = Object.keys(sedanOrig || {}).map((n) => +n.replace('tripo_part_', ''));
          restoreParts(sedanParts, sedanOrig, all);
        }

        /* ============================================================
           SPLIT (mod tab)
           ============================================================ */
        function renderSplit() {
          const r = studio.renderer, w = r.domElement.clientWidth, h = r.domElement.clientHeight;
          const px = Math.floor(w * state.split);
          if (!splitSnap) rebuildSplitSnapshots();
          r.setScissorTest(true);
          r.setViewport(0, 0, w, h);

          assignSnapshot('stock');
          r.setScissor(0, 0, px, h);
          r.render(studio.scene, studio.camera);

          assignSnapshot('build');
          r.setScissor(px, 0, w - px, h);
          r.render(studio.scene, studio.camera);
          r.setScissorTest(false);

          const sLine = $('split-line'), sHandle = $('split-handle');
          if (sLine) sLine.style.left = (state.split * 100) + '%';
          if (sHandle) sHandle.style.left = (state.split * 100) + '%';
        }

        /* ============================================================
           360 VIEWER
           ============================================================ */
        const V360_FRAMES = 36;
        const V360_PINS = [
          { bn: 'পেছনের বাম্পারে হালকা দাগ', en: 'Light scratch — rear bumper', neg: true, no: 1, p: new THREE.Vector3(0.45, 0.86, -1.86) },
          { bn: 'সামনের বাম হুইলে কার্ব রাশ', en: 'Curb rash — front-left wheel', neg: true, no: 2, p: new THREE.Vector3(0.74, 0.33, 1.18) },
          { bn: 'ইঞ্জিন — গ্রেড অনুযায়ী পরিষ্কার', en: 'Engine — clean per grade', neg: false, no: 3, p: new THREE.Vector3(0, 0.95, 1.82) }
        ];
        function v360Draw(force?: boolean) {
          const wrap = $('v360-wrap'), cv: any = $('v360-canvas');
          if (!wrap || wrap.style.display === 'none' || !cv) return;
          const w = wrap.clientWidth, h = wrap.clientHeight;
          if (cv.width !== Math.floor(w * DPR)) { cv.width = Math.floor(w * DPR); cv.height = Math.floor(h * DPR); }
          const frame = ((Math.round(state.v360.angle / (360 / V360_FRAMES)) % V360_FRAMES) + V360_FRAMES) % V360_FRAMES;
          const rad = frame * (Math.PI * 2 / V360_FRAMES);
          if (sedanRoot) sedanRoot.rotation.y = rad;
          studio.render();
          const ctx = cv.getContext('2d');
          if (!ctx) return;
          ctx.clearRect(0, 0, cv.width, cv.height);
          ctx.drawImage(studio.renderer.domElement, 0, 0, cv.width, cv.height);

          ctx.fillStyle = 'rgba(0,0,0,.16)';
          ctx.fillRect(0, 0, cv.width, 10); ctx.fillRect(0, cv.height - 10, cv.width, 10);
          const fno = String(frame + 1).padStart(2, '0');
          const vf = $('v360-frame');
          if (vf) vf.textContent = 'FRAME ' + fno + ' / ' + V360_FRAMES;

          const pinBox = $('v360-pins');
          if (!pinBox) return;
          pinBox.innerHTML = '';
          V360_PINS.forEach((pin) => {
            const world = pin.p.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rad);
            const toCam = studio.camera.position.clone().sub(world).normalize();
            const nrm = world.clone().setY(0).normalize();
            if (nrm.dot(toCam) < 0.05) return;
            const v = world.clone().project(studio.camera);
            if (v.z > 1) return;
            const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
            if (x < 0 || x > w || y < 0 || y > h) return;
            const d = document.createElement('div');
            d.className = 'pin' + (pin.neg ? ' neg' : '');
            d.style.left = x + 'px'; d.style.top = y + 'px';
            d.innerHTML = '<span class="pdot">' + pin.no + '</span><span class="plabel">' + T(pin.bn, pin.en) + '</span>';
            d.addEventListener('click', () => d.classList.toggle('open'));
            pinBox.appendChild(d);
          });
        }

        /* ============================================================
           RIDER HEIGHT
           ============================================================ */
        function riderUpdate() {
          const rr: any = $('rider-range');
          if (!rr) return;
          const inches = +rr.value;
          const ft = Math.floor(inches / 12), inch = inches % 12;
          const rv = $('rider-val'); if (rv) rv.textContent = ft + "'" + inch + '"';
          const v = $('rider-verdict');
          if (!v) return;
          const span = v.querySelector('.i18n');
          let bn: string, en: string, warn = false;
          if (inches < 64) { bn = 'পায়ের আঙুল ছোঁবে — লোয়ারিং কিট জিজ্ঞেস করুন'; en = 'Toes only — ask about a lowering kit'; warn = true; }
          else if (inches <= 70) { bn = 'উভয় পা মাটিতে — আত্মবিশ্বাসে চালান'; en = 'Both feet flat — ride with confidence'; }
          else { bn = 'লম্বা রাইডার — হ্যান্ডেলবার রাইজার ভালো লাগবে'; en = 'Tall rider — bar risers recommended'; }
          if (span) {
            span.setAttribute('data-bn', bn); span.setAttribute('data-en', en);
            span.textContent = T(bn, en);
          }
          v.classList.toggle('warn', warn);
        }

        /* ============================================================
           HERO CHIPS
           ============================================================ */
        const heroChipSel: Record<string, string> = { car: 'stock', bike: 'stock' };
        function renderChips() {
          const el = $('hero-chips');
          if (!el) return;
          const seg = state.heroSeg;
          const paints = seg === 'car' ? CAR_PAINTS : BIKE_PAINTS;
          const cur = heroChipSel[seg];
          el.innerHTML = paints.map((p) =>
            '<button class="chip' + (p.id === cur ? ' on' : '') + '" data-p="' + p.id + '" title="' + T(p.bn, p.en) + '">' +
            '<span class="swatch" style="background:' + p.chip + '"><span class="hole"></span></span>' +
            '<span class="label">' + (p.id === 'stock' ? 'STOCK' : (p.en.split(' ')[0] || '').toUpperCase()) + '</span></button>'
          ).join('');
          el.querySelectorAll('.chip').forEach((b: any) => {
            b.addEventListener('click', () => {
              heroChipSel[seg] = b.getAttribute('data-p');
              applyHeroPaint();
              renderChips();
            });
          });
        }

        function applyHeroPaint() {
          if (state.heroSeg === 'car') {
            const id = heroChipSel.car;
            if (id === 'stock') restoreParts(heroSedanParts, heroSedanOrig, CAR_PARTS.paint || []);
            else {
              const p = CAR_PAINTS.find((x) => x.id === id);
              if (p) setParts(heroSedanParts, CAR_PARTS.paint || [], paintMat(p.hex));
            }
          } else {
            const id = heroChipSel.bike;
            if (id === 'stock') restoreParts(heroBikeParts, heroBikeOrig, BIKE_PARTS.paint || []);
            else {
              const p = BIKE_PAINTS.find((x) => x.id === id);
              if (p) setParts(heroBikeParts, BIKE_PARTS.paint || [], paintMat(p.hex, id === 'matte' ? { coat: 0, rough: .6 } : {}));
            }
          }
        }
        function setHeroSeg(seg: string) {
          state.heroSeg = seg;
          $('seg-car')?.classList.toggle('on', seg === 'car');
          $('seg-bike')?.classList.toggle('on', seg === 'bike');
          if (sedanHero) sedanHero.visible = seg === 'car';
          if (bikeHero) bikeHero.visible = seg === 'bike';
          renderChips();
          applyHeroPaint();
        }

        /* ============================================================
           MAIN INIT
           ============================================================ */
        async function init() {
          const loader = new GLTFLoader();
          const parse = (buf: ArrayBuffer) => new Promise((res, rej) => loader.parse(buf, '', res as any, rej));

          let carBuf: any, bikeBuf: any;
          try {
            [carBuf, bikeBuf] = await Promise.all([
              fetchProgress('/models/sedan.glb', 'car'),
              fetchProgress('/models/bike.glb', 'bike')
            ]);
          } catch (err) {
            if (boot.txt?.eng) boot.txt.eng.textContent = 'LOAD ERROR — RETRYING';
            setTimeout(() => location.reload(), 4000);
            throw err;
          }

          if (boot.txt?.eng) boot.txt.eng.textContent = 'PARSING GEOMETRY';
          if (boot.bars?.eng?.firstElementChild) (boot.bars.eng.firstElementChild as HTMLElement).style.width = '20%';

          const [carGltf, bikeGltf]: any = await Promise.all([parse(carBuf), parse(bikeBuf)]);

          if (boot.bars?.eng?.firstElementChild) (boot.bars.eng.firstElementChild as HTMLElement).style.width = '45%';
          if (boot.txt?.eng) boot.txt.eng.textContent = 'BUILDING STAGES';

          const heroStage = $('hero-stage');
          const studioStage = $('studio-stage');
          if (!heroStage || !studioStage) return;

          hero = new Stage(heroStage);
          studio = new Stage(studioStage);
          hero.controls.enableZoom = false;
          hero.camera.position.set(6.1, 1.9, 5.2);
          hero.controls.target.set(0, 0.7, 0);

          const pm1 = new THREE.PMREMGenerator(hero.renderer);
          hero.scene.environment = pm1.fromScene(new RoomEnvironment(), 0.04).texture;
          const pm2 = new THREE.PMREMGenerator(studio.renderer);
          pmremEnv = pm2.fromScene(new RoomEnvironment(), 0.04).texture;
          studio.scene.environment = pmremEnv;

          sedanRoot = normalize(carGltf.scene, Math.PI / 2);
          bikeRoot = normalize(bikeGltf.scene, 0);
          studio.scene.add(sedanRoot, bikeRoot);
          sedanParts = collectParts(sedanRoot); sedanOrig = storeOriginals(sedanParts);
          bikeParts = collectParts(bikeRoot); bikeOrig = storeOriginals(bikeParts);
          bikeRoot.visible = false;

          const glowTex = (() => {
            const c = document.createElement('canvas'); c.width = c.height = 128;
            const x = c.getContext('2d')!;
            const g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
            g.addColorStop(0, 'rgba(215,235,255,.95)'); g.addColorStop(.4, 'rgba(160,200,255,.35)'); g.addColorStop(1, 'rgba(120,170,255,0)');
            x.fillStyle = g; x.fillRect(0, 0, 128, 128);
            return new THREE.CanvasTexture(c);
          })();
          headlightGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false }));
          headlightGlow.scale.setScalar(1.1);
          headlightGlow.position.set(0, 1.83, 1.5);
          headlightGlow.visible = false;
          bikeRoot.add(headlightGlow);

          const cloneMats = (root: any) => { root.traverse((o: any) => { if (o.isMesh) o.material = o.material.clone(); }); return root; };
          sedanHero = normalize(cloneMats(carGltf.scene.clone(true)), Math.PI / 2);
          bikeHero = normalize(cloneMats(bikeGltf.scene.clone(true)), 0);
          hero.scene.add(sedanHero, bikeHero);
          heroSedanParts = collectParts(sedanHero); heroSedanOrig = storeOriginals(heroSedanParts);
          heroBikeParts = collectParts(bikeHero); heroBikeOrig = storeOriginals(heroBikeParts);
          bikeHero.visible = false;
          hero.scene.background = null;
          if (hero.groundGroup?.children[0]) hero.groundGroup.children[0].visible = false;
          applyEnv(studio, 'showroom');
          hero.renderer.toneMappingExposure = 1.05;

          if (boot.bars?.eng?.firstElementChild) (boot.bars.eng.firstElementChild as HTMLElement).style.width = '70%';
          if (boot.txt?.eng) boot.txt.eng.textContent = 'FIRST LIGHT';

          hero.renderer.compile(hero.scene, hero.camera);
          studio.renderer.compile(studio.scene, studio.camera);
          hero.render(); studio.render();

          if (boot.bars?.eng?.firstElementChild) (boot.bars.eng.firstElementChild as HTMLElement).style.width = '100%';
          if (boot.bars?.eng) boot.bars.eng.classList.add('ok');
          if (boot.txt?.eng) boot.txt.eng.textContent = 'READY';
          if (boot.txt?.total) boot.txt.total.textContent = '100%';

          renderChips();
          renderPanel();
          renderPrice();
          wireUI();

          setTimeout(() => {
            if (boot.el) {
              boot.el.classList.add('done');
              setTimeout(() => { if (boot.el) boot.el.style.display = 'none'; }, 900);
            }
            hero.resize(); studio.resize();
          }, 450);

          const clock = new THREE.Clock();
          let heroIdle = true, studioIdle = true;
          hero.renderer.domElement.addEventListener('pointerdown', () => {
            heroIdle = false; $('hero-hint')?.classList.add('gone');
          });
          studio.renderer.domElement.addEventListener('pointerdown', () => {
            studioIdle = false; $('studio-hint')?.classList.add('gone');
          });

          function loop() {
            requestAnimationFrame(loop);
            const dt = clock.getDelta();
            if (document.hidden) return;

            if (hero.visible) {
              if (heroIdle) {
                (state.heroSeg === 'car' ? sedanHero : bikeHero).rotation.y += dt * 0.28;
              }
              hero.controls.update();
              hero.render();
            }
            if (studio.visible) {
              studio.controls.update();
              if (state.tab === 'mod') {
                renderSplit();
              } else if (state.tab === 'v360') {
                v360Draw();
              } else {
                if (studioIdle) {
                  (state.tab === 'car' ? sedanRoot : bikeRoot).rotation.y += dt * 0.22;
                }
                studio.render();
              }
            }
          }
          loop();
        }

        /* ============================================================
           UI WIRING
           ============================================================ */
        function wireUI() {
          $('seg-car')?.addEventListener('click', () => setHeroSeg('car'));
          $('seg-bike')?.addEventListener('click', () => setHeroSeg('bike'));

          document.querySelectorAll('.studio-tabs [data-tab]').forEach((b: any) =>
            b.addEventListener('click', () => setTab(b.getAttribute('data-tab'))));

          document.querySelectorAll('#env-switch [data-env]').forEach((b: any) =>
            b.addEventListener('click', () => {
              state.env = b.getAttribute('data-env');
              document.querySelectorAll('#env-switch [data-env]').forEach((x: any) => x.classList.toggle('on', x === b));
              if (state.tab !== 'v360') applyEnv(studio, state.env);
            }));

          const sb: any = $('btn-sound');
          if (sb) {
            sb.disabled = false;
            sb.addEventListener('click', () => {
              if (snd.on) { sndStop(); sb.classList.remove('on'); sb.style.color = ''; }
              else { sndStart(); sb.classList.add('on'); sb.style.color = 'var(--signal)'; }
            });
          }

          $('btn-reset')?.addEventListener('click', () => {
            studio.camera.position.set(5.4, 2.1, 5.6);
            studio.controls.target.set(0, 0.72, 0);
            if (sedanRoot) sedanRoot.rotation.y = 0;
            if (bikeRoot) bikeRoot.rotation.y = 0;
            studio.controls.update();
          });

          const stageEl = $('studio-stage');
          const handle = $('split-handle');
          let dragging = false;
          const setSplit = (clientX: number) => {
            if (!stageEl) return;
            const r = stageEl.getBoundingClientRect();
            state.split = Math.min(0.92, Math.max(0.08, (clientX - r.left) / r.width));
          };
          if (handle) {
            handle.addEventListener('pointerdown', (e: any) => { dragging = true; handle.setPointerCapture(e.pointerId); });
            handle.addEventListener('pointermove', (e: any) => { if (dragging) setSplit(e.clientX); });
            handle.addEventListener('pointerup', () => { dragging = false; });
          }

          const wrap = $('v360-wrap');
          let vDrag = false, vLastX = 0;
          if (wrap) {
            wrap.addEventListener('pointerdown', (e: any) => { vDrag = true; vLastX = e.clientX; wrap.setPointerCapture(e.pointerId); wrap.style.cursor = 'grabbing'; });
            wrap.addEventListener('pointermove', (e: any) => {
              if (!vDrag) return;
              state.v360.angle += (e.clientX - vLastX) * 0.45;
              vLastX = e.clientX;
            });
            wrap.addEventListener('pointerup', () => { vDrag = false; wrap.style.cursor = 'grab'; });
          }

          $('rider-range')?.addEventListener('input', riderUpdate);
          riderUpdate();

          $('btn-wa-build')?.addEventListener('click', () => {
            (window as any).PHX_WA_OPEN ? (window as any).PHX_WA_OPEN(waBuildMessage())
              : window.open('https://wa.me/8801700000000?text=' + encodeURIComponent(waBuildMessage()), '_blank');
          });

          document.addEventListener('phx:lang', () => { renderPanel(); renderPrice(); renderChips(); riderUpdate(); });
        }

        init().catch((e) => {
          console.error('PHX init failed:', e);
          if (boot.txt?.eng) boot.txt.eng.textContent = 'ERROR: ' + (e.message || e);
        });

      } catch (err) {
        console.error('Failed to load Three.js studio engine:', err);
      }
    }

    loadEngine();
  }, []);

  return null;
}
