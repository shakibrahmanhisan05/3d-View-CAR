import { ClientInteractions } from '@/components/studio/ClientInteractions';
import { StudioEngineWrapper } from '@/components/studio/StudioEngineWrapper';

export default function HomePage() {
  return (
    <>
      <StudioEngineWrapper />
      <ClientInteractions />

      {/* ================= HEADER ================= */}
      <header id="site-header">
        <a className="brand" href="#hero" id="brand-link">
          <svg viewBox="0 0 32 32"><path d="M16 2c2 6-6 8-6 15a6 6 0 0012 0c0-3-2-4-2-7 3 2 5 5 5 8A9 9 0 017 18C7 9 14 8 16 2z" fill="#FF4D1C"/></svg>
          <span className="w">PHOENIX</span>
          <span className="tag">3D Showrooms · CTG</span>
        </a>
        <nav id="site-nav">
          <a href="#studio" className="i18n" data-bn="লাইভ ডেমো" data-en="Live demo">লাইভ ডেমো</a>
          <a href="#roi" className="i18n" data-bn="ROI ক্যালকুলেটর" data-en="ROI calculator">ROI ক্যালকুলেটর</a>
          <a href="#pricing" className="i18n" data-bn="প্রাইসিং" data-en="Pricing">প্রাইসিং</a>
          <a href="#process" className="i18n" data-bn="প্রসেস" data-en="Process">প্রসেস</a>
          <a href="#team" className="i18n" data-bn="টিম" data-en="Team">টিম</a>
        </nav>
        <div className="hdr-actions">
          <div className="lang-sw" role="group" aria-label="Language">
            <button id="lang-bn" className="on">বাং</button>
            <button id="lang-en">EN</button>
          </div>
          <a className="btn-wa" id="hdr-wa" href="#contact">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm5.5 14.1c-.2.7-1.4 1.3-1.9 1.4-.5.1-1.1.1-1.8-.1a15 15 0 01-6.6-5.8c-.6-1-1-2.2-.8-3 .1-.6.8-1.6 1.4-1.7h.8c.2 0 .5-.1.8.6l1 2.4c.1.2.1.4 0 .6l-.5.8c-.2.2-.3.4-.1.7a11 11 0 004 3.6c.3.2.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l2.3 1.1c.3.2.5.3.6.4.1.2.1.7-.1 1.2z"/></svg>
            <span className="i18n" data-bn="যোগাযোগ করুন" data-en="Contact us">যোগাযোগ করুন</span>
          </a>
        </div>
      </header>

      <main>
        {/* ================= HERO ================= */}
        <section id="hero">
          <div id="hero-stage-wrap">
            <div className="hero-copy">
              <span className="hero-file"><span className="dot"></span> LIVE 3D — DRAG TO ROTATE</span>
              <h1 className="hero-h1 i18n" data-bn="আপনার শোরুম<br>রাত <span class=&quot;sig num&quot;>২টায়ও</span> খোলা।" data-en="Your showroom,<br>open at <span class=&quot;sig num&quot;>2am</span>." data-html="1">আপনার শোরুম<br />রাত <span className="sig num">২টায়ও</span> খোলা।</h1>
              <p className="hero-sub i18n" data-bn="ক্রেতা ঘরে বসেই গাড়িটা ঘুরিয়ে দেখে, রং বেছে নেয়, দাম জানে — তারপর সিদ্ধান্ত নিয়ে আপনার কাছে আসে।" data-en="Buyers walk around the vehicle, pick the colour, see the price — then arrive at your desk already decided.">ক্রেতা ঘরে বসেই গাড়িটা ঘুরিয়ে দেখে, রং বেছে নেয়, দাম জানে — তারপর সিদ্ধান্ত নিয়ে আপনার কাছে আসে।</p>
              <div className="hero-ctas">
                <a className="btn-primary" id="hero-cta" href="#contact"><span className="i18n" data-bn="আপনার বেস্ট-সেলিং মডেল 3D-তে — ফ্রি" data-en="Your bestseller in 3D — free">আপনার বেস্ট-সেলিং মডেল 3D-তে — ফ্রি</span></a>
                <a className="btn-ghost" href="#studio"><span className="i18n" data-bn="লাইভ ডেমো দেখুন" data-en="See the live demo">লাইভ ডেমো দেখুন</span></a>
              </div>
            </div>

            <div id="hero-stage"></div>

            <div className="seg-toggle" role="group" aria-label="Vehicle segment">
              <button id="seg-car" className="on">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 15l1.5-4.5A2 2 0 016.4 9h11.2a2 2 0 011.9 1.5L21 15v4h-2a2 2 0 11-4 0H9a2 2 0 11-4 0H3v-4z"/><path d="M7 9l1-2.4A1 1 0 018.9 6h6.2a1 1 0 01.9.6L17 9"/></svg>
                <span className="i18n" data-bn="গাড়ি" data-en="Car">গাড়ি</span><span className="mono-tag">SDN</span>
              </button>
              <button id="seg-bike">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="5.5" cy="17" r="3.2"/><circle cx="18.5" cy="17" r="3.2"/><path d="M5.5 17l4-7h4.5M14 10l2 7M14 10l-1.5-3H10M16 7h2.5l1 3"/></svg>
                <span className="i18n" data-bn="মোটরসাইকেল" data-en="Motorcycle">মোটরসাইকেল</span><span className="mono-tag">MCY</span>
              </button>
            </div>

            <div className="chip-strip" id="hero-chips" aria-label="Paint colours"></div>

            <div className="stage-hint" id="hero-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 11V6a1.5 1.5 0 013 0v5m0-2a1.5 1.5 0 013 0v2m0-1a1.5 1.5 0 013 0v4a6 6 0 01-6 6h-1a6 6 0 01-5-2.7L4 15.5A1.5 1.5 0 016.2 14L8 15V8a1.5 1.5 0 011-1.4"/></svg>
              <span className="i18n" data-bn="ঘুরিয়ে দেখুন" data-en="Drag to rotate">ঘুরিয়ে দেখুন</span>
            </div>
          </div>

          <div className="hero-ticker" aria-hidden="true">
            <div className="ticker-track" id="ticker"></div>
          </div>
        </section>

        {/* ================= PROBLEM ================= */}
        <section id="problem" className="sec">
          <div className="sec-head rv">
            <span className="sec-kicker"><span className="idx">01 —</span> <span className="i18n" data-bn="সমস্যাটা আপনি প্রতিদিন শোনেন" data-en="You hear this every day">সমস্যাটা আপনি প্রতিদিন শোনেন</span></span>
          </div>
          <div className="quote-rows">
            <div className="qrow rv">
              <span className="qno mono">CX-014</span>
              <p className="qtxt i18n" data-bn="“ক্রেতা এমন রঙের ছবি চায় যেটা আপনার শোরুমে নেই।”" data-en="“The buyer wants photos of a colour you don't have on the floor.”">“ক্রেতা এমন রঙের ছবি চায় যেটা আপনার শোরুমে নেই।”</p>
              <span className="qwho mono i18n" data-bn="বাইক শোরুম, সিডিএ এভিনিউ" data-en="Bike showroom, CDA Avenue">বাইক শোরুম, সিডিএ এভিনিউ</span>
            </div>
            <div className="qrow rv">
              <span className="qno mono">CX-027</span>
              <p className="qtxt i18n" data-bn="“ফেসবুকে ‘দাম কত?’ ছাড়া কোনো মেসেজ আসে না — কেউ শোরুমে আসে না।”" data-en="“Facebook brings nothing but ‘price?’ messages — nobody actually walks in.”">“ফেসবুকে ‘দাম কত?’ ছাড়া কোনো মেসেজ আসে না — কেউ শোরুমে আসে না।”</p>
              <span className="qwho mono i18n" data-bn="রিকন্ডিশন্ড ডিলার, শেখ মুজিব রোড" data-en="Recon dealer, Sheikh Mujib Road">রিকন্ডিশন্ড ডিলার, শেখ মুজিব রোড</span>
            </div>
            <div className="qrow rv">
              <span className="qno mono">CX-033</span>
              <p className="qtxt i18n" data-bn="“ছবিতে দাগ লুকানো আছে ভেবে ক্রেতা আসতেই ভয় পায়।”" data-en="“Buyers assume the photos are hiding damage, so they never come.”">“ছবিতে দাগ লুকানো আছে ভেবে ক্রেতা আসতেই ভয় পায়।”</p>
              <span className="qwho mono i18n" data-bn="কার গ্যালারি, আগ্রাবাদ" data-en="Car gallery, Agrabad">কার গ্যালারি, আগ্রাবাদ</span>
            </div>
          </div>
        </section>

        {/* ================= STUDIO / DEMO TABS ================= */}
        <section id="studio" className="sec">
          <div className="sec-head rv">
            <span className="sec-kicker"><span className="idx">02 —</span> <span className="i18n" data-bn="লাইভ ডেমো স্টুডিও" data-en="Live demo studio">লাইভ ডেমো স্টুডিও</span></span>
            <h2 className="sec-title i18n" data-bn="এটা স্ক্রিনশট নয়। এখনই হাত দিয়ে ঘুরিয়ে দেখুন।" data-en="This is not a screenshot. Grab it and turn it, right now.">এটা স্ক্রিনশট নয়। এখনই হাত দিয়ে ঘুরিয়ে দেখুন।</h2>
            <p className="sec-lede i18n" data-bn="একটাই ইঞ্জিন, চারটা ডেমো। রং বদলান, পার্টস লাগান, আলো পাল্টান, দাম দেখুন — সব লাইভ, সব আপনার ব্রাউজারে।" data-en="One engine, four demos. Change paint, fit parts, switch lighting, watch the price — all live, all in your browser.">একটাই ইঞ্জিন, চারটা ডেমো। রং বদলান, পার্টস লাগান, আলো পাল্টান, দাম দেখুন — সব লাইভ, সব আপনার ব্রাউজারে।</p>
          </div>

          <div className="studio-shell rv">
            <div className="studio-tabs" role="tablist">
              <button className="on" data-tab="car" role="tab"><span className="tno">T1</span><span className="i18n" data-bn="গাড়ি কনফিগারেটর" data-en="Car configurator">গাড়ি কনফিগারেটর</span></button>
              <button data-tab="bike" role="tab"><span className="tno">T2</span><span className="i18n" data-bn="মোটরসাইকেল" data-en="Motorcycle">মোটরসাইকেল</span></button>
              <button data-tab="mod" role="tab"><span className="tno">T3</span><span className="i18n" data-bn="মডিফিকেশন" data-en="Modification">মডিফিকেশন</span></button>
              <button data-tab="v360" role="tab"><span className="tno">T4</span><span className="i18n" data-bn="৩৬০° রিয়েল ভেহিকেল" data-en="360° real vehicle">৩৬০° রিয়েল ভেহিকেল</span></button>
            </div>

            <div className="studio-grid">
              <div className="studio-stagecol">
                <div id="studio-stage"></div>

                <div className="stage-topbar">
                  <div className="env-switch" id="env-switch">
                    <button data-env="showroom" className="on i18n" data-bn="শোরুম" data-en="Showroom">শোরুম</button>
                    <button data-env="street" className="i18n" data-bn="রাস্তা" data-en="Street">রাস্তা</button>
                    <button data-env="sunset" className="i18n" data-bn="সূর্যাস্ত" data-en="Sunset">সূর্যাস্ত</button>
                    <button data-env="night" className="i18n" data-bn="রাত" data-en="Night">রাত</button>
                  </div>
                  <div className="stage-tools">
                    <button className="tool-btn" id="btn-sound" title="Engine sound" aria-label="Engine sound" disabled>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 010 6" id="snd-wave"/></svg>
                    </button>
                    <button className="tool-btn" id="btn-reset" title="Reset view" aria-label="Reset view">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 10a8 8 0 118 8"/><path d="M4 4v6h6"/></svg>
                    </button>
                  </div>
                </div>

                {/* 360 DOM viewer */}
                <div id="v360-wrap" style={{ display: 'none', position: 'absolute', inset: 0, zIndex: 3, cursor: 'grab', userSelect: 'none', touchAction: 'pan-y' }}>
                  <canvas id="v360-canvas" style={{ width: '100%', height: '100%', display: 'block' }}></canvas>
                  <div id="v360-pins"></div>
                  <div className="split-tag l mono" id="v360-frame">FRAME 01 / 36</div>
                  <div className="split-tag r mono i18n" data-bn="টেনে ঘুরান" data-en="DRAG TO SPIN">টেনে ঘুরান</div>
                </div>

                {/* Modification split slider */}
                <div id="split-ui">
                  <div className="split-tag l mono i18n" data-bn="স্টক" data-en="STOCK">স্টক</div>
                  <div className="split-tag r mono i18n" data-bn="মডিফায়েড" data-en="MODIFIED">মডিফায়েড</div>
                  <div id="split-line"></div>
                  <div id="split-handle">⇔</div>
                </div>

                {/* Rider height (bike) */}
                <div id="rider-ui">
                  <div className="r-head">
                    <span className="r-title i18n" data-bn="রাইডার হাইট চেক" data-en="Rider height check">রাইডার হাইট চেক</span>
                    <span className="r-val mono" id="rider-val">5&apos;6&quot;</span>
                  </div>
                  <input type="range" id="rider-range" min="62" max="72" defaultValue="66" step="1" aria-label="Rider height" />
                  <div className="r-verdict" id="rider-verdict"><span className="led"></span><span className="i18n" data-bn="উভয় পা মাটিতে — আত্মবিশ্বাসে চালান" data-en="Both feet flat — ride with confidence">উভয় পা মাটিতে — আত্মবিশ্বাসে চালান</span></div>
                </div>

                <div className="stage-hint" id="studio-hint">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M9 11V6a1.5 1.5 0 013 0v5m0-2a1.5 1.5 0 013 0v2m0-1a1.5 1.5 0 013 0v4a6 6 0 01-6 6h-1a6 6 0 01-5-2.7L4 15.5A1.5 1.5 0 016.2 14L8 15V8a1.5 1.5 0 011-1.4"/></svg>
                  <span className="i18n" data-bn="ঘুরিয়ে দেখুন · জুম করুন" data-en="Drag to rotate · Pinch to zoom">ঘুরিয়ে দেখুন · জুম করুন</span>
                </div>
              </div>

              <aside className="studio-panel">
                <div className="panel-scroll" id="option-panel"></div>
                <div className="panel-scroll" id="panel-360" style={{ display: 'none' }}>
                  <div className="sheet-doc">
                    <div className="sd-head">
                      <div>
                        <div className="sd-title i18n" data-bn="ভেহিকেল কন্ডিশন শিট" data-en="Vehicle condition sheet">ভেহিকেল কন্ডিশন শিট</div>
                        <div className="sd-sub">AUCTION SHEET FORMAT — HONEST DISCLOSURE</div>
                      </div>
                      <div className="gradebox"><div className="g">4.5</div><div className="gl">GRADE</div></div>
                    </div>
                    <div className="sheet-grid">
                      <div className="cell"><div className="cl i18n" data-bn="মডেল" data-en="Model">মডেল</div><div className="cv">SEDAN 1.5G — 2019</div></div>
                      <div className="cell"><div className="cl i18n" data-bn="রেজিস্ট্রেশন" data-en="Registration">রেজিস্ট্রেশন</div><div className="cv">2022 · CTG-METRO</div></div>
                      <div className="cell"><div className="cl i18n" data-bn="মাইলেজ" data-en="Mileage">মাইলেজ</div><div className="cv">37,420 km — ORIG</div></div>
                      <div className="cell"><div className="cl i18n" data-bn="ইঞ্জিন" data-en="Engine">ইঞ্জিন</div><div className="cv">1,496 cc · HYBRID</div></div>
                      <div className="cell"><div className="cl i18n" data-bn="ট্রান্সমিশন" data-en="Transmission">ট্রান্সমিশন</div><div className="cv">CVT — AUTO</div></div>
                      <div className="cell"><div className="cl i18n" data-bn="রং" data-en="Colour">রং</div><div className="cv">PEARL WHITE III</div></div>
                    </div>
                    <div className="sheet-notes">
                      <div className="nrow neg"><span className="nno">1</span><span className="i18n" data-bn="পেছনের বাম্পারে হালকা দাগ — ডিসক্লোজড" data-en="Light scratch on rear bumper — disclosed">পেছনের বাম্পারে হালকা দাগ — ডিসক্লোজড</span></div>
                      <div className="nrow neg"><span className="nno">2</span><span className="i18n" data-bn="সামনের বাম হুইলে সামান্য কার্ব রাশ" data-en="Minor curb rash, front-left wheel">সামনের বাম হুইলে সামান্য কার্ব রাশ</span></div>
                      <div className="nrow"><span className="nno">3</span><span className="i18n" data-bn="ইঞ্জিন — অকশন গ্রেড অনুযায়ী, কোনো নোট নেই" data-en="Engine — per auction grade, no notes">ইঞ্জিন — অকশন গ্রেড অনুযায়ী, কোনো নোট নেই</span></div>
                    </div>
                    <div className="sd-stamp">INSPECTED</div>
                  </div>
                  <p className="sheet-cta i18n" data-bn="এটাই আসল প্রোডাক্ট: আপনার শোরুমের আসল গাড়ি, ৩৬০°, প্রতিটা দাগসহ। সততাই বিক্রি করে। প্রতি গাড়ি ৳১,৫০০ — ওমলান শুট করে, পরদিন লাইভ।" data-en="This is the real product: your actual car, in 360°, every flaw labelled. Honesty is what sells. ৳1,500 per vehicle — Omlan shoots it, live the next day.">এটাই আসল প্রোডাক্ট: আপনার শোরুমের আসল গাড়ি, ৩৬০°, প্রতিটা দাগসহ। সততাই বিক্রি করে। প্রতি গাড়ি ৳১,৫০০ — ওমলান শুট করে, পরদিন লাইভ।</p>
                </div>

                <div className="price-doc" id="price-doc">
                  <div className="stamp">CONFIG</div>
                  <div className="pd-head">
                    <span className="pd-title i18n" data-bn="লাইভ প্রাইস সামারি" data-en="Live price summary">লাইভ প্রাইস সামারি</span>
                    <span className="pd-no" id="pd-no">BUILD № PHX-0001</span>
                  </div>
                  <div className="price-lines" id="price-lines"></div>
                  <div className="price-total">
                    <span className="k i18n" data-bn="মোট" data-en="TOTAL">মোট</span>
                    <span className="v" id="price-total">৳ 0</span>
                  </div>
                  <button className="btn-wa-big" id="btn-wa-build">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm5.5 14.1c-.2.7-1.4 1.3-1.9 1.4-.5.1-1.1.1-1.8-.1a15 15 0 01-6.6-5.8c-.6-1-1-2.2-.8-3 .1-.6.8-1.6 1.4-1.7h.8c.2 0 .5-.1.8.6l1 2.4c.1.2.1.4 0 .6l-.5.8c-.2.2-.3.4-.1.7a11 11 0 004 3.6c.3.2.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l2.3 1.1c.3.2.5.3.6.4.1.2.1.7-.1 1.2z"/></svg>
                    <span className="i18n" data-bn="এই কনফিগারেশন হোয়াটসঅ্যাপে পাঠান" data-en="Send this build to WhatsApp">এই কনফিগারেশন হোয়াটসঅ্যাপে পাঠান</span>
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* ================= TWO-PRODUCT EXPLAINER ================= */}
        <section id="duo-sec" className="sec">
          <div className="sec-head rv">
            <span className="sec-kicker"><span className="idx">03 —</span> <span className="i18n" data-bn="দুইটা প্রোডাক্ট, দুই ধরনের ব্যবসার জন্য" data-en="Two products, for two kinds of business">দুইটা প্রোডাক্ট, দুই ধরনের ব্যবসার জন্য</span></span>
            <h2 className="sec-title i18n" data-bn="নতুন গাড়ির জন্য এক জিনিস। রিকন্ডিশন্ডের জন্য সম্পূর্ণ অন্য।" data-en="One thing for new vehicles. Something entirely different for reconditioned.">নতুন গাড়ির জন্য এক জিনিস। রিকন্ডিশন্ডের জন্য সম্পূর্ণ অন্য।</h2>
          </div>
          <div className="duo rv">
            <article className="duo-card">
              <span className="dc-code">P2 — CONFIGURATOR</span>
              <h3 className="i18n" data-bn="নতুন গাড়ি বা বাইক?" data-en="New car or bike?">নতুন গাড়ি বা বাইক?</h3>
              <p className="dc-ans i18n" data-bn="→ 3D কনফিগারেটর" data-en="→ The 3D configurator">→ 3D কনফিগারেটর</p>
              <p className="i18n" data-bn="রং, হুইল, এক্সহস্ট, এক্সেসরিজ — ক্রেতা নিজে বেছে নেয়, লাইভ দাম দেখে, আর সম্পূর্ণ কনফিগারেশনটা আপনার হোয়াটসঅ্যাপে পাঠায়। ‘দাম কত?’ মেসেজের বদলে পূর্ণ স্পেক সহ সিরিয়াস ক্রেতা।" data-en="Paint, wheels, exhaust, accessories — the buyer picks them himself, watches the live price, and sends the full configuration to your WhatsApp. Instead of 'price?' messages, you get serious buyers with a full spec.">রং, হুইল, এক্সহস্ট, এক্সেসরিজ — ক্রেতা নিজে বেছে নেয়, লাইভ দাম দেখে, আর সম্পূর্ণ কনফিগারেশনটা আপনার হোয়াটসঅ্যাপে পাঠায়। ‘দাম কত?’ মেসেজের বদলে পূর্ণ স্পেক সহ সিরিয়াস ক্রেতা।</p>
              <ul>
                <li className="i18n" data-bn="বাইক শোরুম — নতুন ইউনিট, ৪–৬টা রং, এক্সেসরি মার্জিন" data-en="Bike showrooms — new units, 4–6 colours, accessory margin">বাইক শোরুম — নতুন ইউনিট, ৪–৬টা রং, এক্সেসরি মার্জিন</li>
                <li className="i18n" data-bn="মডিফিকেশন শপ — বিফোর/আফটার ভিজুয়ালই প্রোডাক্ট" data-en="Modification shops — the before/after visual is the product">মডিফিকেশন শপ — বিফোর/আফটার ভিজুয়ালই প্রোডাক্ট</li>
                <li className="i18n" data-bn="নিউ-ব্র্যান্ড ডিলার — আসল ট্রিম, আসল রং" data-en="New-brand dealers — real trims, real colours">নিউ-ব্র্যান্ড ডিলার — আসল ট্রিম, আসল রং</li>
              </ul>
              <span className="dc-arrow mono">01</span>
            </article>
            <article className="duo-card">
              <span className="dc-code">P3 — 360° CAPTURE</span>
              <h3 className="i18n" data-bn="রিকন্ডিশন্ড গাড়ি?" data-en="Reconditioned car?">রিকন্ডিশন্ড গাড়ি?</h3>
              <p className="dc-ans i18n" data-bn="→ ৩৬০° রিয়েল-ভেহিকেল ক্যাপচার" data-en="→ 360° real-vehicle capture">→ ৩৬০° রিয়েল-ভেহিকেল ক্যাপচার</p>
              <p className="i18n" data-bn="আপনার শোরুমে থাকা আসল গাড়িটাই — চারপাশ থেকে, প্রতিটা দাগসহ, সৎভাবে লেবেল করা। রিকন্ডিশন্ড বিক্রির সবচেয়ে বড় বাধা হলো ক্রেতার সন্দেহ। ৩৬০° স্পিন সেই সন্দেহটাই ভেঙে দেয়।" data-en="The actual car on your floor — from every angle, every flaw honestly labelled. The biggest friction in recon sales is buyer suspicion. The 360° spin breaks exactly that.">আপনার শোরুমে থাকা আসল গাড়িটাই — চারপাশ থেকে, প্রতিটা দাগসহ, সৎভাবে লেবেল করা। রিকন্ডিশন্ড বিক্রির সবচেয়ে বড় বাধা হলো ক্রেতার সন্দেহ। ৩৬০° স্পিন সেই সন্দেহটাই ভেঙে দেয়।</p>
              <ul>
                <li className="i18n" data-bn="৩D মডেল লাগে না — আপনার গাড়ি, আপনার ফ্লোর" data-en="No 3D model needed — your car, your floor">৩D মডেল লাগে না — আপনার গাড়ি, আপনার ফ্লোর</li>
                <li className="i18n" data-bn="প্রতি কনটেইনারে ৮–১৫টা নতুন গাড়ি = রেকারিং শুট" data-en="Every container lands 8–15 cars = recurring shoots">প্রতি কনটেইনারে ৮–১৫টা নতুন গাড়ি = রেকারিং শুট</li>
                <li className="i18n" data-bn="প্রতি গাড়ি ৳১,৫০০ — পরদিন লাইভ" data-en="৳1,500 per vehicle — live the next day">প্রতি গাড়ি ৳১,৫০০ — পরদিন লাইভ</li>
              </ul>
              <span className="dc-arrow mono">02</span>
            </article>
          </div>
        </section>

        {/* ================= ROI ================= */}
        <section id="roi" className="sec">
          <div className="sec-head rv">
            <span className="sec-kicker"><span className="idx">04 —</span> <span className="i18n" data-bn="হিসাবটা নিজেই করুন" data-en="Run the numbers yourself">হিসাবটা নিজেই করুন</span></span>
            <h2 className="sec-title i18n" data-bn="আমরা বাড়িয়ে বলি না। কনজারভেটিভ ১৫% লিফট ধরে হিসাব।" data-en="We don't inflate. The math assumes a conservative 15% lift.">আমরা বাড়িয়ে বলি না। কনজারভেটিভ ১৫% লিফট ধরে হিসাব।</h2>
          </div>
          <div className="roi-grid rv">
            <div className="roi-inputs">
              <div className="seg-mini" role="group">
                <button id="roi-seg-car" className="on i18n" data-bn="গাড়ি" data-en="Car">গাড়ি</button>
                <button id="roi-seg-bike" className="i18n" data-bn="বাইক" data-en="Bike">বাইক</button>
              </div>
              <div className="roi-field">
                <div className="rf-head"><label className="i18n" data-bn="মাসিক শোরুম ওয়াক-ইন" data-en="Monthly showroom walk-ins">মাসিক শোরুম ওয়াক-ইন</label><span className="rf-val" id="rv-walkins">60</span></div>
                <input type="range" id="ri-walkins" min="10" max="300" defaultValue="60" step="5" />
              </div>
              <div className="roi-field">
                <div className="rf-head"><label className="i18n" data-bn="গড় বিক্রয়মূল্য" data-en="Average sale value">গড় বিক্রয়মূল্য</label><span className="rf-val" id="rv-avg">৳ 12,00,000</span></div>
                <input type="range" id="ri-avg" min="100000" max="5000000" defaultValue="1200000" step="50000" />
              </div>
              <div className="roi-field">
                <div className="rf-head"><label className="i18n" data-bn="বর্তমান ক্লোজ রেট" data-en="Current close rate">বর্তমান ক্লোজ রেট</label><span className="rf-val" id="rv-close">12%</span></div>
                <input type="range" id="ri-close" min="2" max="40" defaultValue="12" step="1" />
              </div>
              <div className="roi-field">
                <div className="rf-head"><label className="i18n" data-bn="মাসিক ফেসবুক বুস্ট খরচ" data-en="Monthly Facebook boost spend">মাসিক ফেসবুক বুস্ট খরচ</label><span className="rf-val" id="rv-boost">৳ 15,000</span></div>
                <input type="range" id="ri-boost" min="0" max="100000" defaultValue="15000" step="1000" />
              </div>
            </div>
            <div className="roi-doc">
              <div className="rd-title i18n" data-bn="প্রজেক্টেড রিটার্ন — মাসিক" data-en="Projected return — monthly">প্রজেক্টেড রিটার্ন — মাসিক</div>
              <div className="roi-lines">
                <div className="rl"><span className="k i18n" data-bn="বর্তমান মাসিক রেভিনিউ" data-en="Current monthly revenue">বর্তমান মাসিক রেভিনিউ</span><span id="ro-current">—</span></div>
                <div className="rl"><span className="k i18n" data-bn="১৫% লিড লিফটে প্রজেক্টেড" data-en="Projected at 15% lead lift">১৫% লিড লিফটে প্রজেক্টেড</span><span id="ro-projected">—</span></div>
              </div>
              <div className="roi-big">
                <div className="rb-l i18n" data-bn="অতিরিক্ত মাসিক রেভিনিউ" data-en="Additional monthly revenue">অতিরিক্ত মাসিক রেভিনিউ</div>
                <div className="rb-v" id="ro-extra">—</div>
              </div>
              <div className="roi-small" id="ro-amort">—</div>
              <div className="roi-small" id="ro-boost-line" style={{ marginTop: '4px' }}>—</div>
              <div className="roi-assume i18n" data-bn="অনুমান: কোয়ালিফায়েড লিডে ১৫% বৃদ্ধি, ক্লোজ রেট অপরিবর্তিত। বিদেশি ভেন্ডরদের ৪০%+ দাবি আমরা ব্যবহার করি না — বাড়ানো সংখ্যা বিশ্বাস নষ্ট করে।" data-en="Assumption: 15% increase in qualified leads, close rate unchanged. We do not use the 40%+ claims from foreign vendor marketing — inflated numbers destroy trust.">অনুমান: কোয়ালিফায়েড লিডে ১৫% বৃদ্ধি, ক্লোজ রেট অপরিবর্তিত। বিদেশি ভেন্ডরদের ৪০%+ দাবি আমরা ব্যবহার করি না — বাড়ানো সংখ্যা বিশ্বাস নষ্ট করে।</div>
            </div>
          </div>
        </section>

        {/* ================= CASE ================= */}
        <section id="case" className="sec">
          <div className="sec-head rv">
            <span className="sec-kicker"><span className="idx">05 —</span> <span className="i18n" data-bn="ফ্ল্যাগশিপ কেস স্টাডি" data-en="Flagship case study">ফ্ল্যাগশিপ কেস স্টাডি</span></span>
          </div>
          <div className="case-card rv">
            <div className="case-photo">
              <svg viewBox="0 0 24 24" width="54" height="54" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="9" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>
              <span className="cp-tag i18n" data-bn="মালিকের ছবি — সপ্তাহ ৩-এ যুক্ত হবে" data-en="Owner photo — added in week 3">মালিকের ছবি — সপ্তাহ ৩-এ যুক্ত হবে</span>
            </div>
            <div className="case-body">
              <h3 className="i18n" data-bn="আপনার শোরুমের নাম এখানে লেখা হবে" data-en="Your showroom's name will be written here">আপনার শোরুমের নাম এখানে লেখা হবে</h3>
              <div className="cw">FLAGSHIP BUILD — CDA AVENUE · SLOT OPEN</div>
              <p className="i18n" data-bn="প্রথম ফ্ল্যাগশিপ ক্লায়েন্টের জন্য আমরা সম্পূর্ণ সাইটটা ফ্রি বানাচ্ছি — আপনার লোগো, আপনার বাইক, আপনার দাম, আপনার হোয়াটসঅ্যাপ। বিনিময়ে চাই শুধু একটা নামসহ টেস্টিমোনিয়াল। এই স্লটটা একটাই।" data-en="For the first flagship client we build the entire site free — your logo, your bikes, your prices, your WhatsApp. All we ask is a named testimonial. There is exactly one slot.">প্রথম ফ্ল্যাগশিপ ক্লায়েন্টের জন্য আমরা সম্পূর্ণ সাইটটা ফ্রি বানাচ্ছি — আপনার লোগো, আপনার বাইক, আপনার দাম, আপনার হোয়াটসঅ্যাপ। বিনিময়ে চাই শুধু একটা নামসহ টেস্টিমোনিয়াল। এই স্লটটা একটাই।</p>
            </div>
            <div className="case-nums">
              <div className="cn"><div className="v num">৩ দিন</div><div className="l i18n" data-bn="ডেলিভারি টাইম" data-en="Delivery time">ডেলিভারি টাইম</div></div>
              <div className="cn"><div className="v num">৳ ০</div><div className="l i18n" data-bn="ফ্ল্যাগশিপ খরচ" data-en="Flagship cost">ফ্ল্যাগশিপ খরচ</div></div>
              <div className="cn"><div className="v num">১</div><div className="l i18n" data-bn="স্লট বাকি" data-en="Slot remaining">স্লট বাকি</div></div>
            </div>
          </div>
        </section>

        {/* ================= PRICING ================= */}
        <section id="pricing" className="sec">
          <div className="sec-head rv">
            <span className="sec-kicker"><span className="idx">06 —</span> <span className="i18n" data-bn="স্বচ্ছ প্রাইসিং — টাকায়, একবারের" data-en="Transparent pricing — in Taka, one time">স্বচ্ছ প্রাইসিং — টাকায়, একবারের</span></span>
            <h2 className="sec-title i18n" data-bn="কোনো ‘দামের জন্য যোগাযোগ করুন’ নেই। কোনো মাসিক সাবস্ক্রিপশন নেই।" data-en="No 'contact for pricing'. No monthly subscription.">কোনো ‘দামের জন্য যোগাযোগ করুন’ নেই। কোনো মাসিক সাবস্ক্রিপশন নেই।</h2>
          </div>
          <div className="rate-wrap rv">
            <article className="rate-doc">
              <div className="rate-head">
                <span className="rh-code">P1 — SHOWROOM SITE</span>
                <h3 className="i18n" data-bn="শোরুম সাইট" data-en="Showroom Site">শোরুম সাইট</h3>
              </div>
              <div className="rate-price">
                <div className="v num">৳ 45,000 – 75,000</div>
                <div className="u i18n" data-bn="একবারের প্রজেক্ট + ৳১,৫০০/মাস কেয়ার (ঐচ্ছিক)" data-en="One-time project + ৳1,500/mo care (optional)">একবারের প্রজেক্ট + ৳১,৫০০/মাস কেয়ার (ঐচ্ছিক)</div>
              </div>
              <ul>
                <li className="i18n" data-bn="দ্রুত, বাংলা-ইংরেজি সাইট — আপনার নিজের ডোমেইনে" data-en="Fast bilingual site — on your own domain">দ্রুত, বাংলা-ইংরেজি সাইট — আপনার নিজের ডোমেইনে</li>
                <li className="i18n" data-bn="ইনভেন্টরি লিস্টিং — নিজেই আপডেট করতে পারবেন" data-en="Inventory listings you update yourself">ইনভেন্টরি লিস্টিং — নিজেই আপডেট করতে পারবেন</li>
                <li className="i18n" data-bn="হোমপেজে একটা হিরো ভেহিকেল লাইভ 3D-তে" data-en="One hero vehicle in live 3D on the homepage">হোমপেজে একটা হিরো ভেহিকেল লাইভ 3D-তে</li>
                <li className="i18n" data-bn="হোয়াটসঅ্যাপ লিড ক্যাপচার + গুগল ম্যাপস" data-en="WhatsApp lead capture + Google Maps">হোয়াটসঅ্যাপ লিড ক্যাপচার + গুগল ম্যাপস</li>
                <li className="i18n" data-bn="সার্ভিস বুকিং ফর্ম" data-en="Service booking form">সার্ভিস বুকিং ফর্ম</li>
              </ul>
              <div className="rate-foot"><button className="rate-cta wa-cta" data-msg="আসসালামু আলাইকুম, আমি P1 শোরুম সাইট নিয়ে কথা বলতে চাই।"><span className="i18n" data-bn="কথা বলুন" data-en="Talk to us">কথা বলুন</span></button></div>
            </article>

            <article className="rate-doc hot">
              <span className="r-stamp">MEETING WINNER</span>
              <div className="rate-head">
                <span className="rh-code">P2 — 3D CONFIGURATOR</span>
                <h3 className="i18n" data-bn="3D কনফিগারেটর" data-en="3D Configurator">3D কনফিগারেটর</h3>
              </div>
              <div className="rate-price">
                <div className="v num">৳ 25,000 – 40,000</div>
                <div className="u i18n" data-bn="প্রতি মডেল — অ্যাড-অন হিসেবে" data-en="Per model — sold as an add-on">প্রতি মডেল — অ্যাড-অন হিসেবে</div>
              </div>
              <ul>
                <li className="i18n" data-bn="রং সুইচিং — আসল পেইন্ট নামসহ" data-en="Colour switching with real paint names">রং সুইচিং — আসল পেইন্ট নামসহ</li>
                <li className="i18n" data-bn="হুইল, এক্সহস্ট, গার্ড, এক্সেসরিজ" data-en="Wheels, exhaust, guards, accessories">হুইল, এক্সহস্ট, গার্ড, এক্সেসরিজ</li>
                <li className="i18n" data-bn="লাইভ দামের হিসাব — টাকায়" data-en="Live price total — in Taka">লাইভ দামের হিসাব — টাকায়</li>
                <li className="i18n" data-bn="‘এই বিল্ড হোয়াটসঅ্যাপে পাঠান’ বাটন" data-en="'Send this build to WhatsApp' button">‘এই বিল্ড হোয়াটসঅ্যাপে পাঠান’ বাটন</li>
                <li className="i18n" data-bn="শোরুম / রাস্তা / সূর্যাস্ত / রাত লাইটিং" data-en="Showroom / street / sunset / night lighting">শোরুম / রাস্তা / সূর্যাস্ত / রাত লাইটিং</li>
              </ul>
              <div className="rate-foot"><button className="rate-cta wa-cta" data-msg="আসসালামু আলাইকুম, আমি P2 3D কনফিগারেটর নিয়ে কথা বলতে চাই।"><span className="i18n" data-bn="ডেমো বুক করুন" data-en="Book a demo">ডেমো বুক করুন</span></button></div>
            </article>

            <article className="rate-doc">
              <div className="rate-head">
                <span className="rh-code">P3 — 360° CAPTURE</span>
                <h3 className="i18n" data-bn="৩৬০° ক্যাপচার" data-en="360° Capture">৩৬০° ক্যাপচার</h3>
              </div>
              <div className="rate-price">
                <div className="v num">৳ 1,200 – 2,500</div>
                <div className="u i18n" data-bn="প্রতি ভেহিকেল — আপনার শোরুমে শুট" data-en="Per vehicle — shot at your showroom">প্রতি ভেহিকেল — আপনার শোরুমে শুট</div>
              </div>
              <ul>
                <li className="i18n" data-bn="আপনার আসল গাড়ি — ৩২ ফ্রেম, ৩৬০°" data-en="Your actual car — 32 frames, 360°">আপনার আসল গাড়ি — ৩২ ফ্রেম, ৩৬০°</li>
                <li className="i18n" data-bn="দাগ ও কন্ডিশন সৎভাবে লেবেল করা" data-en="Flaws and condition honestly labelled">দাগ ও কন্ডিশন সৎভাবে লেবেল করা</li>
                <li className="i18n" data-bn="অকশন-শিট স্টাইল ডেটা প্যানেল" data-en="Auction-sheet style data panel">অকশন-শিট স্টাইল ডেটা প্যানেল</li>
                <li className="i18n" data-bn="পুরনো ফোনেও চলে — WebGL লাগে না" data-en="Runs on old phones — no WebGL needed">পুরনো ফোনেও চলে — WebGL লাগে না</li>
                <li className="i18n" data-bn="প্রথম ৫টা গাড়ি ফ্রি — ফল দেখে সিদ্ধান্ত নিন" data-en="First 5 cars free — decide on results">প্রথম ৫টা গাড়ি ফ্রি — ফল দেখে সিদ্ধান্ত নিন</li>
              </ul>
              <div className="rate-foot"><button className="rate-cta wa-cta" data-msg="আসসালামু আলাইকুম, আমি P3 ৩৬০° ক্যাপচার নিয়ে কথা বলতে চাই।"><span className="i18n" data-bn="ফ্রি শুট বুক করুন" data-en="Book a free shoot">ফ্রি শুট বুক করুন</span></button></div>
            </article>
          </div>
          <div className="pricing-note rv">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ flex: 'none', marginTop: '2px' }}><path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>
            <span className="i18n" data-bn="<b>পেমেন্ট:</b> ৫০% অগ্রিম, ৫০% হ্যান্ডওভারে — বিকাশ, নগদ বা ব্যাংক। এক পাতার বাংলা চুক্তি, দুই পক্ষের সই। ডলারে কোনো দাম নেই, মাসিক কোনো সফটওয়্যার ভাড়া নেই।" data-en="<b>Payment:</b> 50% advance, 50% on handover — bKash, Nagad or bank. One-page Bangla agreement, signed by both. No USD pricing, no monthly software rent." data-html="1"><b>পেমেন্ট:</b> ৫০% অগ্রিম, ৫০% হ্যান্ডওভারে — বিকাশ, নগদ বা ব্যাংক। এক পাতার বাংলা চুক্তি, দুই পক্ষের সই। ডলারে কোনো দাম নেই, মাসিক কোনো সফটওয়্যার ভাড়া নেই।</span>
          </div>
        </section>

        {/* ================= PROCESS ================= */}
        <section id="process" className="sec">
          <div className="sec-head rv">
            <span className="sec-kicker"><span className="idx">07 —</span> <span className="i18n" data-bn="কীভাবে কাজ হয়" data-en="How it works">কীভাবে কাজ হয়</span></span>
            <h2 className="sec-title i18n" data-bn="প্রথম দিন থেকে লাইভ পর্যন্ত — ১৪ দিন।" data-en="From day one to live — 14 days.">প্রথম দিন থেকে লাইভ পর্যন্ত — ১৪ দিন।</h2>
          </div>
          <div className="proc-rows rv">
            <div className="prow">
              <span className="pno">01</span>
              <span className="pt i18n" data-bn="১৫ মিনিটের মিটিং" data-en="15-minute meeting">১৫ মিনিটের মিটিং</span>
              <span className="pdesc i18n" data-bn="আপনার শোরুমে আসি। আপনার ফোনেই ডেমো দেখেন। আপনার বেস্ট-সেলিং মডেলটা ঠিক করি।" data-en="We come to your showroom. You see the demo on your own phone. We agree on your bestselling model.">আপনার শোরুমে আসি। আপনার ফোনেই ডেমো দেখেন। আপনার বেস্ট-সেলিং মডেলটা ঠিক করি।</span>
              <span className="pdur i18n" data-bn="দিন ১" data-en="Day 1">দিন ১</span>
            </div>
            <div className="prow">
              <span className="pno">02</span>
              <span className="pt i18n" data-bn="ফ্রি 3D বিল্ড" data-en="Free 3D build">ফ্রি 3D বিল্ড</span>
              <span className="pdesc i18n" data-bn="আপনার বেস্টসেলার 3D-তে বানাই — ফ্রি, কোনো শর্ত ছাড়া। পছন্দ না হলে এমনিই রেখে দিন। ডেমোটা ১৪ দিন সক্রিয় থাকে।" data-en="We build your bestseller in 3D — free, no strings. If you don't like it, keep it anyway. The demo stays live for 14 days.">আপনার বেস্টসেলার 3D-তে বানাই — ফ্রি, কোনো শর্ত ছাড়া। পছন্দ না হলে এমনিই রেখে দিন। ডেমোটা ১৪ দিন সক্রিয় থাকে।</span>
              <span className="pdur i18n" data-bn="দিন ২–৪" data-en="Day 2–4">দিন ২–৪</span>
            </div>
            <div className="prow">
              <span className="pno">03</span>
              <span className="pt i18n" data-bn="শুট ও কনটেন্ট" data-en="Shoot and content">শুট ও কনটেন্ট</span>
              <span className="pdesc i18n" data-bn="ওমলান আপনার শোরুম আর স্টক শুট করে। আপনার লোগো, রং, দাম, হোয়াটসঅ্যাপ নম্বর বসে।" data-en="Omlan shoots your showroom and stock. Your logo, colours, prices and WhatsApp number go in.">ওমলান আপনার শোরুম আর স্টক শুট করে। আপনার লোগো, রং, দাম, হোয়াটসঅ্যাপ নম্বর বসে।</span>
              <span className="pdur i18n" data-bn="দিন ৫–৯" data-en="Day 5–9">দিন ৫–৯</span>
            </div>
            <div className="prow">
              <span className="pno">04</span>
              <span className="pt i18n" data-bn="লাইভ ও হ্যান্ডওভার" data-en="Live and handover">লাইভ ও হ্যান্ডওভার</span>
              <span className="pdesc i18n" data-bn="আপনার ডোমেইনে লাইভ। স্টাফদের ট্রেনিং দিই — নিজেরাই ইনভেন্টরি আপডেট করবেন। ফাইনাল পেমেন্টে সব ক্রেডেনশিয়াল আপনার।" data-en="Live on your domain. We train your staff — you update inventory yourselves. All credentials are yours on final payment.">আপনার ডোমেইনে লাইভ। স্টাফদের ট্রেনিং দিই — নিজেরাই ইনভেন্টরি আপডেট করবেন। ফাইনাল পেমেন্টে সব ক্রেডেনশিয়াল আপনার।</span>
              <span className="pdur i18n" data-bn="দিন ১০–১৪" data-en="Day 10–14">দিন ১০–১৪</span>
            </div>
          </div>
        </section>

        {/* ================= TEAM ================= */}
        <section id="team" className="sec">
          <div className="sec-head rv">
            <span className="sec-kicker"><span className="idx">08 —</span> <span className="i18n" data-bn="চারজনের স্টুডিও, চট্টগ্রাম" data-en="A four-person studio, Chattogram">চারজনের স্টুডিও, চট্টগ্রাম</span></span>
            <h2 className="sec-title i18n" data-bn="একজন 3D ডেভেলপার আর একজন ফটোগ্রাফার একই ঘরে — এটাই বিরল জিনিস।" data-en="A 3D developer and a photographer in the same room — that is the rare thing.">একজন 3D ডেভেলপার আর একজন ফটোগ্রাফার একই ঘরে — এটাই বিরল জিনিস।</h2>
          </div>
          <div className="team-grid rv">
            <div className="tm">
              <span className="tm-role">BUILD — ENGINEERING</span>
              <h3>হিসান</h3>
              <p className="i18n" data-bn="ওয়েবসাইট, 3D কনফিগারেটর, ক্যাপচার-প্রসেসিং পাইপলাইন। আপনি স্ক্রিনে যা দেখছেন, সেটা ওর হাতে বানানো।" data-en="Website, 3D configurator, capture-processing pipeline. What you see on this screen is his work.">ওয়েবসাইট, 3D কনফিগারেটর, ক্যাপচার-প্রসেসিং পাইপলাইন। আপনি স্ক্রিনে যা দেখছেন, সেটা ওর হাতে বানানো।</p>
              <span className="tm-sig">HISAN — R&amp;D / PIPELINE</span>
            </div>
            <div className="tm">
              <span className="tm-role">SALES — THE NUMBER</span>
              <h3>তাসফিয়া</h3>
              <p className="i18n" data-bn="প্রতি সপ্তাহে ছয়টা শোরুমে সরাসরি হাজির। মিটিংয়ের প্রথম অর্ধেক ওর — সমস্যা বোঝা, প্রশ্ন করা, শোনা।" data-en="Six showrooms a week, in person. The first half of every meeting is hers — diagnosis, questions, listening.">প্রতি সপ্তাহে ছয়টা শোরুমে সরাসরি হাজির। মিটিংয়ের প্রথম অর্ধেক ওর — সমস্যা বোঝা, প্রশ্ন করা, শোনা।</p>
              <span className="tm-sig">TASFIA — HEAD OF SALES</span>
            </div>
            <div className="tm">
              <span className="tm-role">PRODUCTION — REVENUE</span>
              <h3>ওমলান</h3>
              <p className="i18n" data-bn="প্রফেশনাল ফটোগ্রাফার। ৩৬০° ক্যাপচার, কেস-স্টাডি ভিডিও, শোরুম শুট — ওর ক্যামেরাই P3 প্রোডাক্ট।" data-en="Professional photographer. 360° captures, case-study films, showroom shoots — his camera is the P3 product.">প্রফেশনাল ফটোগ্রাফার। ৩৬০° ক্যাপচার, কেস-স্টাডি ভিডিও, শোরুম শুট — ওর ক্যামেরাই P3 প্রোডাক্ট।</p>
              <span className="tm-sig">OMLAN — 360° CAPTURE</span>
            </div>
            <div className="tm">
              <span className="tm-role">POSITIONING — OBJECTIONS</span>
              <h3>সিয়াম</h3>
              <p className="i18n" data-bn="প্রতিটা মিটিংয়ের পরে মালিকের নিজের ভাষায় আপত্তিগুলো লিখে রাখে, আর পিচটা নতুন করে সাজায়। ROI-এর সংখ্যাগুলোও ওর।" data-en="After every meeting he records objections in the owner's own words and rewrites the pitch. The ROI numbers are his too.">প্রতিটা মিটিংয়ের পরে মালিকের নিজের ভাষায় আপত্তিগুলো লিখে রাখে, আর পিচটা নতুন করে সাজায়। ROI-এর সংখ্যাগুলোও ওর।</p>
              <span className="tm-sig">SIAM — PITCH / NARRATIVE</span>
            </div>
          </div>
        </section>

        {/* ================= FAQ ================= */}
        <section id="faq" className="sec">
          <div className="sec-head rv">
            <span className="sec-kicker"><span className="idx">09 —</span> <span className="i18n" data-bn="যে প্রশ্নগুলো আসলেই করা হয়" data-en="The questions actually asked">যে প্রশ্নগুলো আসলেই করা হয়</span></span>
          </div>
          <div className="faq-list rv">
            <details className="faq">
              <summary><span className="i18n" data-bn="কতদিন লাগবে?" data-en="How long does it take?">কতদিন লাগবে?</span><span className="fx">+</span></summary>
              <p className="fa i18n" data-bn="ফ্রি 3D ডেমো — ৩ দিন। পুরো শোরুম সাইট — ১৪ দিন, শুটসহ। আমরা তারিখ লিখে দিই, মুখে বলি না।" data-en="The free 3D demo — 3 days. A full showroom site — 14 days including the shoot. We put the date in writing, not in words.">ফ্রি 3D ডেমো — ৩ দিন। পুরো শোরুম সাইট — ১৪ দিন, শুটসহ। আমরা তারিখ লিখে দিই, মুখে বলি না।</p>
            </details>
            <details className="faq">
              <summary><span className="i18n" data-bn="সাইটটার মালিক কে?" data-en="Who owns the site?">সাইটটার মালিক কে?</span><span className="fx">+</span></summary>
              <p className="fa i18n" data-bn="আপনি। ডোমেইন আপনার নামে, ফাইনাল পেমেন্টের পর সব ক্রেডেনশিয়াল আপনার হাতে। কোনো লক-ইন নেই, কোনো মাসিক সফটওয়্যার ভাড়া নেই।" data-en="You do. The domain is in your name, and every credential is handed over on final payment. No lock-in, no monthly software rent.">আপনি। ডোমেইন আপনার নামে, ফাইনাল পেমেন্টের পর সব ক্রেডেনশিয়াল আপনার হাতে। কোনো লক-ইন নেই, কোনো মাসিক সফটওয়্যার ভাড়া নেই।</p>
            </details>
            <details className="faq">
              <summary><span className="i18n" data-bn="আমি শুধু রিকন্ডিশন্ড গাড়ি বেচি — রং তো বদলাতে পারব না?" data-en="I only sell used cars — I can't change colours?">আমি শুধু রিকন্ডিশন্ড গাড়ি বেচি — রং তো বদলাতে পারব না?</span><span className="fx">+</span></summary>
              <p className="fa i18n" data-bn="সঠিক — তাই আপনার জন্য কনফিগারেটর না, ৩৬০° ক্যাপচার। আপনার ফ্লোরের আসল গাড়িটাই, চারপাশ থেকে, প্রতিটা দাগ লেবেল করা। ক্রেতা যা পরখ করতে পারে, তাতেই বিশ্বাস করে।" data-en="Correct — so for you it's not the configurator, it's 360° capture. The actual car on your floor, from every angle, every flaw labelled. Buyers trust what they can inspect.">সঠিক — তাই আপনার জন্য কনফিগারেটর না, ৩৬০° ক্যাপচার। আপনার ফ্লোরের আসল গাড়িটাই, চারপাশ থেকে, প্রতিটা দাগ লেবেল করা। ক্রেতা যা পরখ করতে পারে, তাতেই বিশ্বাস করে।</p>
            </details>
            <details className="faq">
              <summary><span className="i18n" data-bn="3D কি আমার সাইট স্লো করে দেবে?" data-en="Will the 3D slow my site down?">3D কি আমার সাইট স্লো করে দেবে?</span><span className="fx">+</span></summary>
              <p className="fa i18n" data-bn="না। মডেল লোড হয় ব্যাকগ্রাউন্ডে, পেজ আগে দেখা যায়। মিড-রেঞ্জ অ্যান্ড্রয়েডে, মোবাইল ডেটায় টেস্ট করে তবেই ডেলিভারি — এটা আমাদের কাছে ফিচার না, শর্ত।" data-en="No. The model streams in the background while the page paints first. We test on a mid-range Android over mobile data before delivery — for us that's a requirement, not a feature.">না। মডেল লোড হয় ব্যাকগ্রাউন্ডে, পেজ আগে দেখা যায়। মিড-রেঞ্জ অ্যান্ড্রয়েডে, মোবাইল ডেটায় টেস্ট করে তবেই ডেলিভারি — এটা আমাদের কাছে ফিচার না, শর্ত।</p>
            </details>
            <details className="faq">
              <summary><span className="i18n" data-bn="আপনাদের কী কী লাগবে আমার কাছ থেকে?" data-en="What do you need from me?">আপনাদের কী কী লাগবে আমার কাছ থেকে?</span><span className="fx">+</span></summary>
              <p className="fa i18n" data-bn="লোগো (যা আছে তাই), মডেল ও দামের লিস্ট, হোয়াটসঅ্যাপ নম্বর, আর শুটের জন্য এক বিকেল। ব্যস। বাকি সব আমাদের কাজ।" data-en="Your logo (whatever you have), model and price list, WhatsApp number, and one afternoon for the shoot. That's it. Everything else is our job.">লোগো (যা আছে তাই), মডেল ও দামের লিস্ট, হোয়াটসঅ্যাপ নম্বর, আর শুটের জন্য এক বিকেল। ব্যস। বাকি সব আমাদের কাজ।</p>
            </details>
            <details className="faq">
              <summary><span className="i18n" data-bn="হ্যান্ডওভারের পর কী হবে?" data-en="What happens after handover?">হ্যান্ডওভারের পর কী হবে?</span><span className="fx">+</span></summary>
              <p className="fa i18n" data-bn="সাইট আপনার, চলতেই থাকবে। চাইলে ৳১,৫০০/মাস কেয়ার প্ল্যান — আপডেট, ব্যাকআপ, ছোট পরিবর্তন। না নিলেও সাইট বন্ধ হয় না। নতুন গাড়ি এলে ৩৬০° শুট প্রতি গাড়ি হিসেবে।" data-en="The site is yours and keeps running. An optional ৳1,500/mo care plan covers updates, backups and small changes — skip it and nothing shuts off. New stock gets 360° shoots per vehicle.">সাইট আপনার, চলতেই থাকবে। চাইলে ৳১,৫০০/মাস কেয়ার প্ল্যান — আপডেট, ব্যাকআপ, ছোট পরিবর্তন। না নিলেও সাইট বন্ধ হয় না। নতুন গাড়ি এলে ৩৬০° শুট প্রতি গাড়ি হিসেবে।</p>
            </details>
          </div>
        </section>

        {/* ================= CONTACT ================= */}
        <section id="contact" className="sec">
          <div className="sec-head rv">
            <span className="sec-kicker"><span className="idx">10 —</span> <span className="i18n" data-bn="১৫ মিনিটের ডেমো বুক করুন" data-en="Book a 15-minute demo">১৫ মিনিটের ডেমো বুক করুন</span></span>
            <h2 className="sec-title i18n" data-bn="আমরা আপনার শোরুমে আসব। আপনার ফোনেই দেখবেন।" data-en="We come to your showroom. You see it on your own phone.">আমরা আপনার শোরুমে আসব। আপনার ফোনেই দেখবেন।</h2>
          </div>
          <div className="contact-grid rv">
            <form className="lead-form" id="lead-form">
              <div className="lf-row">
                <div className="lf">
                  <label htmlFor="lf-name" className="i18n" data-bn="আপনার নাম" data-en="Your name">আপনার নাম</label>
                  <input id="lf-name" name="name" required autoComplete="name" />
                </div>
                <div className="lf">
                  <label htmlFor="lf-biz" className="i18n" data-bn="শোরুম / ব্যবসার নাম" data-en="Showroom / business name">শোরুম / ব্যবসার নাম</label>
                  <input id="lf-biz" name="business" />
                </div>
              </div>
              <div className="lf-row">
                <div className="lf">
                  <label htmlFor="lf-phone" className="i18n" data-bn="ফোন / হোয়াটসঅ্যাপ" data-en="Phone / WhatsApp">ফোন / হোয়াটসঅ্যাপ</label>
                  <input id="lf-phone" name="phone" required inputMode="tel" className="mono" />
                </div>
                <div className="lf">
                  <label htmlFor="lf-seg" className="i18n" data-bn="আপনার ব্যবসা" data-en="Your business">আপনার ব্যবসা</label>
                  <select id="lf-seg" name="segment">
                    <option value="bike" className="i18n" data-bn="মোটরসাইকেল শোরুম" data-en="Motorcycle showroom">মোটরসাইকেল শোরুম</option>
                    <option value="recon" className="i18n" data-bn="রিকন্ডিশন্ড কার ডিলার" data-en="Reconditioned car dealer">রিকন্ডিশন্ড কার ডিলার</option>
                    <option value="mod" className="i18n" data-bn="মডিফিকেশন / এক্সেসরিজ শপ" data-en="Modification / accessories shop">মডিফিকেশন / এক্সেসরিজ শপ</option>
                    <option value="brand" className="i18n" data-bn="নিউ-ব্র্যান্ড শোরুম" data-en="New-brand showroom">নিউ-ব্র্যান্ড শোরুম</option>
                  </select>
                </div>
              </div>
              <div className="lf">
                <label htmlFor="lf-msg" className="i18n" data-bn="কোন মডেলটা 3D-তে দেখতে চান? (ঐচ্ছিক)" data-en="Which model do you want in 3D? (optional)">কোন মডেলটা 3D-তে দেখতে চান? (ঐচ্ছিক)</label>
                <textarea id="lf-msg" name="message" rows={3}></textarea>
              </div>
              <button className="btn-wa-big" type="submit">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm5.5 14.1c-.2.7-1.4 1.3-1.9 1.4-.5.1-1.1.1-1.8-.1a15 15 0 01-6.6-5.8c-.6-1-1-2.2-.8-3 .1-.6.8-1.6 1.4-1.7h.8c.2 0 .5-.1.8.6l1 2.4c.1.2.1.4 0 .6l-.5.8c-.2.2-.3.4-.1.7a11 11 0 004 3.6c.3.2.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l2.3 1.1c.3.2.5.3.6.4.1.2.1.7-.1 1.2z"/></svg>
                <span className="i18n" data-bn="হোয়াটসঅ্যাপে পাঠান" data-en="Send on WhatsApp">হোয়াটসঅ্যাপে পাঠান</span>
              </button>
              <p style={{ fontSize: '12.5px', color: 'var(--fluor-mute)' }} className="i18n" data-bn="সাবমিট করলে সরাসরি আমাদের হোয়াটসঅ্যাপে মেসেজ খুলবে — ইমেইল নয়, ফর্মের অপেক্ষা নয়।" data-en="Submitting opens a message straight to our WhatsApp — no email, no waiting on a form.">সাবমিট করলে সরাসরি আমাদের হোয়াটসঅ্যাপে মেসেজ খুলবে — ইমেইল নয়, ফর্মের অপেক্ষা নয়।</p>
            </form>
            <aside className="contact-side">
              <div className="cs-block">
                <div className="cs-l">WHATSAPP</div>
                <div className="cs-v mono">+880 1700-000000</div>
              </div>
              <div className="cs-block">
                <div className="cs-l i18n" data-bn="ঠিকানা" data-en="Address">ঠিকানা</div>
                <div className="cs-v i18n" data-bn="জিইসি মোড়, চট্টগ্রাম" data-en="GEC Circle, Chattogram">জিইসি মোড়, চট্টগ্রাম</div>
              </div>
              <div className="cs-block">
                <div className="cs-l i18n" data-bn="সময়" data-en="Hours">সময়</div>
                <div className="cs-v i18n" data-bn="শনি–বৃহস্পতি, সকাল ১০টা – রাত ৮টা" data-en="Sat–Thu, 10am – 8pm">শনি–বৃহস্পতি, সকাল ১০টা – রাত ৮টা</div>
              </div>
              <div className="cs-block">
                <div className="cs-l">FACEBOOK</div>
                <div className="cs-v">fb.com/phoenixctg</div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer id="site-footer">
        <div className="foot-inner">
          <div className="foot-grid">
            <div className="foot-brand">
              <a className="brand" href="#hero">
                <svg viewBox="0 0 32 32"><path d="M16 2c2 6-6 8-6 15a6 6 0 0012 0c0-3-2-4-2-7 3 2 5 5 5 8A9 9 0 017 18C7 9 14 8 16 2z" fill="#FF4D1C"/></svg>
                <span className="w">PHOENIX</span>
              </a>
              <p className="i18n" data-bn="চট্টগ্রামের গাড়ি ও মোটরসাইকেল শোরুমের জন্য 3D ভেহিকেল ওয়েবসাইট। চারজনের স্টুডিও — বানাই, শুট করি, লাইভ করি।" data-en="3D vehicle websites for Chattogram's car and motorcycle showrooms. A four-person studio — we build, we shoot, we ship.">চট্টগ্রামের গাড়ি ও মোটরসাইকেল শোরুমের জন্য 3D ভেহিকেল ওয়েবসাইট। চারজনের স্টুডিও — বানাই, শুট করি, লাইভ করি।</p>
            </div>
            <div className="foot-col">
              <div className="fc-h">SITE</div>
              <a href="#studio" className="i18n" data-bn="লাইভ ডেমো" data-en="Live demo">লাইভ ডেমো</a>
              <a href="#pricing" className="i18n" data-bn="প্রাইসিং" data-en="Pricing">প্রাইসিং</a>
              <a href="#process" className="i18n" data-bn="প্রসেস" data-en="Process">প্রসেস</a>
              <a href="#faq" className="i18n" data-bn="প্রশ্নোত্তর" data-en="FAQ">প্রশ্নোত্তর</a>
            </div>
            <div className="foot-col">
              <div className="fc-h">CONTACT</div>
              <a href="#contact">WhatsApp</a>
              <a href="#contact" className="i18n" data-bn="ফোন" data-en="Phone">ফোন</a>
              <a href="#contact">Facebook</a>
            </div>
            <div className="foot-col">
              <div className="fc-h">STUDIO</div>
              <a href="#team" className="i18n" data-bn="টিম" data-en="Team">টিম</a>
              <a href="#case" className="i18n" data-bn="কেস স্টাডি" data-en="Case study">কেস স্টাডি</a>
            </div>
          </div>
          <div className="foot-base">
            <span>© 2026 PHOENIX STUDIO — CHATTOGRAM, BANGLADESH</span>
            <button id="btn-credits" className="i18n" data-bn="অ্যাসেট ক্রেডিট / Asset credits" data-en="Asset credits">অ্যাসেট ক্রেডিট / Asset credits</button>
          </div>
        </div>
      </footer>

      <a id="wa-float" href="https://wa.me/8801700000000" aria-label="WhatsApp">
        <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm5.5 14.1c-.2.7-1.4 1.3-1.9 1.4-.5.1-1.1.1-1.8-.1a15 15 0 01-6.6-5.8c-.6-1-1-2.2-.8-3 .1-.6.8-1.6 1.4-1.7h.8c.2 0 .5-.1.8.6l1 2.4c.1.2.1.4 0 .6l-.5.8c-.2.2-.3.4-.1.7a11 11 0 004 3.6c.3.2.5.1.7-.1l.9-1c.2-.3.4-.2.7-.1l2.3 1.1c.3.2.5.3.6.4.1.2.1.7-.1 1.2z"/></svg>
      </a>
    </>
  );
}
