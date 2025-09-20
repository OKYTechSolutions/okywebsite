/* ============================================================================
   OKY Tech — Main JS (Structured & Documented)
   ---------------------------------------------------------------------------
   Contents:
     A)  Boot / Utilities
     B)  Scroll Progress Bar
     C)  Parallax Hero (scroll + mouse tilt)
     D)  Reveal-On-Scroll (sections/cards)
     E)  Timeline Node Highlight
     F)  Reduced Motion Safety
     G)  Soft Mode Toggle
     H)  Metric Count-Up (on visibility)
     I)  Typewriter (for .type[data-words])
     J)  Capabilities Tabs (centered pills + sliding underline + a11y)
     K)  Brand Logo Flip (then navigate)
     L)  First-Visit Fullscreen Intro
     M)  Contrast Switcher (Do/Don't)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // ====================== A) BOOT / UTILITIES =============================

  /** Clamp a number between min and max. */
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  /** Shorthand selectors */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /** Respect the user's reduced-motion preference. */
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Scroll rAF batching helper.
   * Usage: onScroll(fn) — fn will be executed at most once per frame.
   */
  let ticking = false;
  const onScroll = (fn) => {
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => { fn(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
  };


  // ====================== B) SCROLL PROGRESS BAR ==========================

  (function initProgressBar() {
    const bar = $('.progress');
    if (!bar) return;

    const update = () => {
      const h = document.documentElement;
      const st = h.scrollTop;
      const sh = h.scrollHeight - h.clientHeight;
      const p = sh > 0 ? st / sh : 0;
      bar.style.transform = `scaleX(${p})`;
      bar.style.transformOrigin = 'left';
    };

    update();
    onScroll(update);
  })();


  // ====================== C) PARALLAX HERO ================================

  (function initParallaxHero() {
    const layers = $$('.layer');
    if (REDUCED_MOTION || !layers.length) return;

    const state = { scrollY: 0, mouseX: 0, mouseY: 0 };

    const paint = () => {
      layers.forEach((el) => {
        const depth = parseFloat(el.dataset.depth || 0.1);
        const sy = state.scrollY * depth * -0.45;        // subtle scroll parallax
        const tx = state.mouseX * depth * 10;           // subtle mouse tilt X
        const ty = state.mouseY * depth * 6;            // subtle mouse tilt Y
        el.style.transform = `translate3d(${tx}px, ${sy + ty}px, 0)`;
      });
    };

    onScroll(() => {
      state.scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      paint();
    });

    window.addEventListener('mousemove', (e) => {
      const { innerWidth: w, innerHeight: h } = window;
      state.mouseX = (e.clientX - w / 2) / w; // -0.5..0.5
      state.mouseY = (e.clientY - h / 2) / h; // -0.5..0.5
      if (!ticking) {
        requestAnimationFrame(() => { paint(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });

    // First paint
    state.scrollY = window.scrollY || 0;
    paint();
  })();


  // ====================== D) REVEAL-ON-SCROLL =============================

  (function initRevealOnScroll() {
    const targets = $$('.reveal');
    if (!targets.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((ent) => {
        if (ent.isIntersecting) {
          ent.target.classList.add('in');
          io.unobserve(ent.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -60px 0px' });

    targets.forEach((el) => io.observe(el));
  })();


  // ====================== E) TIMELINE HIGHLIGHT ===========================

  (function initTimelineNodes() {
    const nodes = $$('.node');
    if (!nodes.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.4 });

    nodes.forEach((n) => io.observe(n));
  })();


  // ====================== F) REDUCED MOTION SAFETY ========================

  (function applyReducedMotionSafety() {
    if (!REDUCED_MOTION) return;
    // Disable transforms on parallax layers
    $$('.layer').forEach((el) => { el.style.transform = 'none'; });
    // Disable smooth scroll (can cause nausea)
    document.documentElement.style.scrollBehavior = 'auto';
  })();


  // ====================== G) SOFT MODE TOGGLE =============================

  (function initSoftModeToggle() {
    const btn = $('#modeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const root = document.documentElement;
      root.dataset.mode = (!root.dataset.mode || root.dataset.mode === 'light') ? 'soft' : 'light';
    });
  })();


  // ====================== H) METRIC COUNT-UP ==============================

  (function initCountUp() {
    const counters = $$('.section [data-count], .card [data-count], [data-count]');
    if (!counters.length) return;

    const animate = (el, to, dur = 1200) => {
      const start = performance.now();
      const from = 0;

      const tick = (now) => {
        const p = clamp((now - start) / dur, 0, 1);
        const val = Math.floor(from + (to - from) * p);
        el.textContent = val.toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((ent) => {
        if (!ent.isIntersecting) return;
        const el = ent.target;
        const to = parseInt(el.getAttribute('data-count'), 10) || 0;
        animate(el, to, 1300);
        io.unobserve(el);
      });
    }, { threshold: 0.35 });

    counters.forEach((el) => io.observe(el));
  })();


  // ====================== I) TYPEWRITER ===================================

  (function initTypewriter() {
    const el = $('.type');
    if (!el || REDUCED_MOTION) return;

    const words = (() => {
      try { return JSON.parse(el.getAttribute('data-words') || '["programmers"]'); }
      catch { return ['programmers']; }
    })();

    let i = 0, j = 0, deleting = false;

    const tick = () => {
      const word = words[i % words.length];
      el.textContent = deleting ? word.slice(0, j--) : word.slice(0, j++);
      const doneTyping = j === word.length;
      const doneDeleting = j === 0;

      if (doneTyping) { deleting = true; setTimeout(tick, 900); }
      else if (doneDeleting) { deleting = false; i++; setTimeout(tick, 400); }
      else setTimeout(tick, deleting ? 40 : 80);
    };

    tick();
  })();


  // ====================== J) CAPABILITIES TABS ============================
  // Centered pill tabs with sliding underline, click + keyboard support,
  // and panel toggling. Keeps ARIA attributes in sync.

  (function initCapabilitiesTabs() {
    const wrap = $('#capabilities .pill-tabs');
    const panels = $$('#capabilities .cap-panel');
    const pills = wrap ? $$('.pill', wrap) : [];
    const underline = wrap ? $('.pill-underline', wrap) : null;

    if (!wrap || !pills.length || !panels.length || !underline) return;

    /** Move the underline under the provided pill element. */
    const moveUnderline = (el) => {
      const pillRect = el.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      const x = pillRect.left - wrapRect.left + wrap.scrollLeft;
      underline.style.width = `${pillRect.width}px`;
      underline.style.transform = `translateX(${x}px)`;
    };

    /** Activate tab & panel by index (and keep ARIA in sync). */
    const setActive = (index) => {
      pills.forEach((p, i) => {
        const on = i === index;
        p.classList.toggle('active', on);
        p.setAttribute('aria-selected', String(on));
        p.tabIndex = on ? 0 : -1;
      });
      panels.forEach((panel, i) => {
        const on = i === index;
        panel.hidden = !on;
        panel.classList.toggle('is-active', on);
      });
      moveUnderline(pills[index]);
    };

    // Click activation
    pills.forEach((pill, i) => pill.addEventListener('click', () => setActive(i)));

    // Hover: preview underline position (does not change active panel)
    wrap.addEventListener('mouseenter', (e) => {
      const pill = e.target.closest('.pill');
      if (pill) moveUnderline(pill);
    }, true);
    wrap.addEventListener('mouseleave', () => moveUnderline($('.pill.active', wrap)));

    // Keyboard navigation (Left/Right arrows)
    wrap.addEventListener('keydown', (e) => {
      const curr = pills.findIndex(p => p.classList.contains('active'));
      if (e.key === 'ArrowRight') { e.preventDefault(); setActive((curr + 1) % pills.length); pills[(curr + 1) % pills.length].focus(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setActive((curr - 1 + pills.length) % pills.length); pills[(curr - 1 + pills.length) % pills.length].focus(); }
    });

    // Initial paint + keep underline aligned on resize
    const initialIndex = pills.findIndex(p => p.classList.contains('active'));
    setActive(initialIndex >= 0 ? initialIndex : 0);
    window.addEventListener('resize', () => moveUnderline($('.pill.active', wrap)));
  })();


  // ====================== K) BRAND LOGO FLIP ==============================

  (function initBrandFlip() {
    const brand = $('.brand');
    if (!brand) return;

    brand.addEventListener('click', (e) => {
      e.preventDefault();
      brand.classList.add('flip');
      setTimeout(() => {
        window.location.href = brand.getAttribute('href');
        brand.classList.remove('flip');
      }, 600); // keep in sync with CSS transition duration
    });
  })();


  // ====================== L) FIRST-VISIT INTRO ============================

  // 5s intro with persistence + ?intro override
  (function initIntroOnce() {
    const intro = document.getElementById('intro');
    if (!intro) return;

    const INTRO_KEY = 'oky:introSeen';
    const forceIntro = new URLSearchParams(location.search).has('intro');

    if (!forceIntro && localStorage.getItem(INTRO_KEY) === 'true') {
      intro.remove(); return;
    }

    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    const finish = () => {
      intro.classList.add('exit');
      setTimeout(() => {
        intro.remove();
        document.documentElement.style.overflow = prev || '';
      }, 550);
      if (!forceIntro) localStorage.setItem(INTRO_KEY, 'true');
    };

    const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(finish, REDUCED ? 1000 : 5000);
  })();
});

// ====================== L) Contrast Switcher (Do/Don't) ============================
(() => {
  const wrap = document.querySelector('#contrast .contrast-toggle');
  if (!wrap) return;

  const pills = Array.from(wrap.querySelectorAll('.seg'));
  const thumb = wrap.querySelector('.seg-underline');
  const panelDo   = document.getElementById('do-panel');
  const panelDont = document.getElementById('dont-panel');

  // Position the thumb under the given pill
  const moveThumb = (el) => {
    if (!el) return;
    const x = el.offsetLeft - parseFloat(getComputedStyle(wrap).paddingLeft);
    thumb.style.width = `${el.offsetWidth}px`;
    thumb.style.transform = `translateX(${x}px)`;
  };

  const setActive = (i) => {
    pills.forEach((p, idx) => p.classList.toggle('active', idx === i));
    const showDo = i === 0;
    panelDo.hidden   = !showDo;
    panelDont.hidden =  showDo;
    moveThumb(pills[i]);
  };

  // Events
  pills.forEach((p, i) => p.addEventListener('click', () => setActive(i)));
  wrap.addEventListener('keydown', (e) => {
    const curr = pills.findIndex(p => p.classList.contains('active'));
    if (e.key === 'ArrowRight') { e.preventDefault(); setActive((curr + 1) % pills.length); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); setActive((curr - 1 + pills.length) % pills.length); }
  });

  // First paint + on resize
  const initial = Math.max(0, pills.findIndex(p => p.classList.contains('active')));
  setActive(initial);
  window.addEventListener('resize', () => moveThumb(wrap.querySelector('.seg.active')));
})();