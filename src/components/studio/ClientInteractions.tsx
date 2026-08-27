'use client';

import { useEffect } from 'react';

export function ClientInteractions() {
  useEffect(() => {
    const WA = '8801700000000';

    /* ---------------- i18n ---------------- */
    let LANG = localStorage.getItem('phx-lang') || 'bn';

    function applyLang(lang: string) {
      LANG = lang;
      localStorage.setItem('phx-lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.classList.toggle('en', lang === 'en');
      const nodes = document.querySelectorAll('.i18n');
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!n) continue;
        const txt = n.getAttribute(lang === 'bn' ? 'data-bn' : 'data-en');
        if (txt == null) continue;
        if (n.getAttribute('data-html') === '1') n.innerHTML = txt;
        else n.textContent = txt;
      }
      const bBn = document.getElementById('lang-bn'), bEn = document.getElementById('lang-en');
      if (bBn && bEn) {
        bBn.classList.toggle('on', lang === 'bn');
        bEn.classList.toggle('on', lang === 'en');
      }
      document.title = lang === 'bn'
        ? 'Phoenix — 3D ভেহিকেল শোরুম ওয়েবসাইট | চট্টগ্রাম'
        : 'Phoenix — 3D Vehicle Showroom Websites | Chattogram';
      document.dispatchEvent(new CustomEvent('phx:lang', { detail: { lang: lang } }));
    }

    (window as any).PHX_LANG = function () { return LANG; };
    (window as any).PHX_T = function (bn: string, en: string) { return LANG === 'bn' ? bn : en; };
    (window as any).PHX_WA = WA;

    const bnBtn = document.getElementById('lang-bn');
    const enBtn = document.getElementById('lang-en');
    if (bnBtn) bnBtn.addEventListener('click', function () { applyLang('bn'); });
    if (enBtn) enBtn.addEventListener('click', function () { applyLang('en'); });
    if (LANG !== 'bn') applyLang(LANG);

    /* ------------- Bangla digit + BDT formatting ------------- */
    const BN_D = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    function bnDigits(s: string | number) {
      return String(s).replace(/\d/g, function (d) { return BN_D[+d] || d; });
    }
    function groupBDT(n: number) {
      n = Math.round(n);
      const neg = n < 0; n = Math.abs(n);
      let s = String(n);
      if (s.length > 3) {
        const last3 = s.slice(-3), rest = s.slice(0, -3);
        s = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
      }
      return (neg ? '-' : '') + s;
    }
    function taka(n: number) {
      const g = groupBDT(n);
      return '৳ ' + (LANG === 'bn' ? bnDigits(g) : g);
    }
    (window as any).PHX_TAKA = taka;
    (window as any).PHX_BND = bnDigits;

    /* ---------------- header scroll shadow ---------------- */
    const hdr = document.getElementById('site-header');
    if (hdr) {
      window.addEventListener('scroll', function () {
        const y = window.scrollY || 0;
        hdr.style.boxShadow = y > 8 ? '0 1px 0 rgba(237,240,242,.09), 0 12px 32px rgba(0,0,0,.45)' : 'none';
      }, { passive: true });
    }

    /* ---------------- scroll reveals ---------------- */
    const rv = document.querySelectorAll('.rv');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      rv.forEach(function (el) { io.observe(el); });
    } else {
      rv.forEach(function (el) { el.classList.add('in'); });
    }

    /* ---------------- hero ticker ---------------- */
    const tick = document.getElementById('ticker');
    if (tick) {
      const items = [
        ['PAINT', 'ATTITUDE BLACK 218'],
        ['WHEELS', '17" GRAM LIGHTS'],
        ['LIVE PRICE', '৳ 32,80,000'],
        ['STATUS', 'SHOWROOM OPEN — 24/7'],
        ['GRADE', '4.5 — AUCTION VERIFIED'],
        ['EXHAUST', 'AKRAPOVIČ SLIP-ON'],
        ['LOCATION', 'CHATTOGRAM 22.35°N'],
        ['CAPTURE', '360° — 36 FRAMES'],
        ['DELIVERY', 'P3: NEXT DAY LIVE'],
        ['ENGINE', '155cc — SOUND ON REQUEST']
      ];
      const half = items.map(function (it) {
        return '<span><b>' + it[0] + '</b> — ' + it[1] + '</span>';
      }).join('');
      tick.innerHTML = half + half;
    }

    /* ---------------- ROI calculator ---------------- */
    const roi: any = {
      seg: 'car',
      el: {
        walkins: document.getElementById('ri-walkins') as HTMLInputElement,
        avg: document.getElementById('ri-avg') as HTMLInputElement,
        close: document.getElementById('ri-close') as HTMLInputElement,
        boost: document.getElementById('ri-boost') as HTMLInputElement,
        vWalkins: document.getElementById('rv-walkins'),
        vAvg: document.getElementById('rv-avg'),
        vClose: document.getElementById('rv-close'),
        vBoost: document.getElementById('rv-boost'),
        cur: document.getElementById('ro-current'),
        proj: document.getElementById('ro-projected'),
        extra: document.getElementById('ro-extra'),
        amort: document.getElementById('ro-amort'),
        boostLine: document.getElementById('ro-boost-line'),
        segCar: document.getElementById('roi-seg-car'),
        segBike: document.getElementById('roi-seg-bike')
      }
    };

    const ROI_CFG: Record<string, any> = {
      car:  { avg: 1200000, avgMin: 500000, avgMax: 5000000, avgStep: 50000, margin: 0.06, buildCost: 60000 },
      bike: { avg: 180000,  avgMin: 80000,  avgMax: 600000,  avgStep: 5000,  margin: 0.05, buildCost: 32000 }
    };

    function roiSetSeg(seg: string) {
      roi.seg = seg;
      if (roi.el.segCar) roi.el.segCar.classList.toggle('on', seg === 'car');
      if (roi.el.segBike) roi.el.segBike.classList.toggle('on', seg === 'bike');
      const c = ROI_CFG[seg];
      if (roi.el.avg) {
        roi.el.avg.min = c.avgMin; roi.el.avg.max = c.avgMax; roi.el.avg.step = c.avgStep;
        roi.el.avg.value = c.avg;
      }
      roiCalc();
    }

    function roiCalc() {
      if (!roi.el.walkins) return;
      const w = +roi.el.walkins.value, a = +roi.el.avg.value,
            cl = +roi.el.close.value / 100, b = +roi.el.boost.value;
      const c = ROI_CFG[roi.seg];
      const pct = LANG === 'bn' ? bnDigits(Math.round(cl * 100)) + '%' : Math.round(cl * 100) + '%';
      if (roi.el.vWalkins) roi.el.vWalkins.textContent = LANG === 'bn' ? bnDigits(w) : w;
      if (roi.el.vAvg) roi.el.vAvg.textContent = taka(a);
      if (roi.el.vClose) roi.el.vClose.textContent = pct;
      if (roi.el.vBoost) roi.el.vBoost.textContent = taka(b);

      const salesNow = w * cl;
      const revNow = salesNow * a;
      const salesNew = salesNow * 1.15;
      const revNew = salesNew * a;
      const extraRev = revNew - revNow;
      const extraProfit = extraRev * c.margin;

      if (roi.el.cur) roi.el.cur.textContent = taka(revNow);
      if (roi.el.proj) roi.el.proj.textContent = taka(revNew);
      if (roi.el.extra) roi.el.extra.textContent = '+' + taka(extraRev);

      const months = extraProfit > 0 ? c.buildCost / extraProfit : Infinity;
      const mTxt = isFinite(months)
        ? (months < 1 ? (LANG === 'bn' ? '১ মাসের কম' : 'under 1 month')
                      : (LANG === 'bn' ? bnDigits(months.toFixed(1)) + ' মাস' : months.toFixed(1) + ' months'))
        : '—';
      if (roi.el.amort) {
        roi.el.amort.textContent = LANG === 'bn'
          ? 'রক্ষণশীল হিসাবে (মার্জিন ' + bnDigits(Math.round(c.margin * 100)) + '%), সাইটের খরচ ' + taka(c.buildCost) + ' উঠে আসে ~' + mTxt + '-এ।'
          : 'Conservatively (at ' + Math.round(c.margin * 100) + '% margin), the ' + taka(c.buildCost) + ' build pays for itself in ~' + mTxt + '.';
      }

      if (roi.el.boostLine) {
        roi.el.boostLine.textContent = LANG === 'bn'
          ? 'তুলনা: আপনার মাসিক বুস্ট খরচ ' + taka(b) + ' — সাইটটা এককালীন, প্রতি মাসে পোড়ে না।'
          : 'Compare: your monthly boost spend is ' + taka(b) + ' — the site is one-time, it doesn’t burn every month.';
      }
    }

    if (roi.el.walkins) {
      ['walkins', 'avg', 'close', 'boost'].forEach(function (k) {
        roi.el[k]?.addEventListener('input', roiCalc);
      });
      roi.el.segCar?.addEventListener('click', function () { roiSetSeg('car'); });
      roi.el.segBike?.addEventListener('click', function () { roiSetSeg('bike'); });
      roiCalc();
    }
    document.addEventListener('phx:lang', roiCalc);

    /* ---------------- WhatsApp CTAs ---------------- */
    function waOpen(msg: string) {
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    }
    (window as any).PHX_WA_OPEN = waOpen;

    document.querySelectorAll('.wa-cta').forEach(function (b: any) {
      b.addEventListener('click', function () {
        waOpen(b.getAttribute('data-msg') || 'আসসালামু আলাইকুম, Phoenix-এর সাথে কথা বলতে চাই।');
      });
    });

    const waFloat = document.getElementById('wa-float') as HTMLAnchorElement;
    if (waFloat) {
      waFloat.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(
        'আসসালামু আলাইকুম, Phoenix-এর 3D শোরুম ডেমোটা দেখলাম — কথা বলতে চাই।');
    }

    /* ---------------- lead form ---------------- */
    const form = document.getElementById('lead-form') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = (document.getElementById('lf-name') as HTMLInputElement).value.trim();
        const biz = (document.getElementById('lf-biz') as HTMLInputElement).value.trim();
        const phone = (document.getElementById('lf-phone') as HTMLInputElement).value.trim();
        const seg = (document.getElementById('lf-seg') as HTMLSelectElement).value;
        const msg = (document.getElementById('lf-msg') as HTMLTextAreaElement).value.trim();

        try {
          fetch('/api/lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, business: biz, phone, segment: seg, message: msg })
          }).catch(function () {});
        } catch (err) {}

        const lines = LANG === 'bn'
          ? ['আসসালামু আলাইকুম, আমি Phoenix-এর ফ্রি 3D ডেমো চাই।',
             'নাম: ' + name,
             biz ? 'শোরুম: ' + biz : '',
             'ফোন: ' + phone,
             'ব্যবসা: ' + seg,
             msg ? 'মডেল: ' + msg : '']
          : ['Hello, I want the free Phoenix 3D demo.',
             'Name: ' + name,
             biz ? 'Showroom: ' + biz : '',
             'Phone: ' + phone,
             'Business: ' + seg,
             msg ? 'Model: ' + msg : ''];
        waOpen(lines.filter(Boolean).join('\n'));

        const btn = form.querySelector('button[type=submit]');
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = LANG === 'bn' ? 'হোয়াটসঅ্যাপ খুলছে…' : 'Opening WhatsApp…';
          setTimeout(function () { btn.textContent = orig; }, 2600);
        }
      });
    }

    /* ---------------- credits modal ---------------- */
    const cm = document.getElementById('credits-modal');
    const cOpen = document.getElementById('btn-credits');
    const cX = document.getElementById('credits-x');
    if (cm && cOpen) {
      cOpen.addEventListener('click', function () { cm.classList.add('on'); });
      cX?.addEventListener('click', function () { cm.classList.remove('on'); });
      cm.addEventListener('click', function (e) { if (e.target === cm) cm.classList.remove('on'); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cm.classList.remove('on'); });
    }

    /* ---------------- FAQ: close others on open ---------------- */
    const faqs = document.querySelectorAll('details.faq');
    faqs.forEach(function (d: any) {
      d.addEventListener('toggle', function () {
        if (d.open) faqs.forEach(function (o: any) { if (o !== d) o.open = false; });
      });
    });

    /* ---------------- smooth anchor offset ---------------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (a: any) {
      a.addEventListener('click', function (e: any) {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const id = href.slice(1);
        const t = document.getElementById(id);
        if (!t) return;
        e.preventDefault();
        const y = t.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  }, []);

  return null;
}
