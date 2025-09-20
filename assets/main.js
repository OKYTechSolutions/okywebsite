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
     L)  First-Visit Fullscreen Intro (5s, no skip; ?intro to force)
     M)  Contrast Switcher (We do / We don’t)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // ====================== A) BOOT / UTILITIES =============================
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // rAF-batched scroll helper
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
  (function progressBar() {
    const bar = $('.progress');
    if (!bar) return;
    const paint = () => {
      const h = document.documentElement;
      const st = h.scrollTop;
      const sh = h.scrollHeight - h.clientHeight;
      const p = sh > 0 ? st / sh : 0;
      bar.style.transform = `scaleX(${p})`;
      bar.style.transformOrigin = 'left';
    };
    paint();
    onScroll(paint);
  })();

  // ====================== C) PARALLAX HERO ================================
  (function parallaxHero() {
    const layers = $$('.layer');
    if (REDUCED_MOTION || !layers.length) return;

    const state = { scrollY: 0, mouseX: 0, mouseY: 0 };
    const paint = () => {
      layers.forEach((el) => {
        const d = parseFloat(el.dataset.depth || 0.1);
        const sy = state.scrollY * d * -0.45;
        const tx = state.mouseX * d * 10;
        const ty = state.mouseY * d * 6;
        el.style.transform = `translate3d(${tx}px, ${sy + ty}px, 0)`;
      });
    };

    onScroll(() => { state.scrollY = window.scrollY || 0; paint(); });
    window.addEventListener('mousemove', (e) => {
      const { innerWidth: w, innerHeight: h } = window;
      state.mouseX = (e.clientX - w / 2) / w;
      state.mouseY = (e.clientY - h / 2) / h;
      if (!ticking) {
        requestAnimationFrame(() => { paint(); ticking = false; });
        ticking = true;
      }
    }, { passive: true });

    state.scrollY = window.scrollY || 0;
    paint();
  })();

  // ====================== D) REVEAL-ON-SCROLL =============================
  (function revealOnScroll() {
    const targets = $$('.reveal');
    if (!targets.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((ent) => {
        if (ent.isIntersecting) { ent.target.classList.add('in'); io.unobserve(ent.target); }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -60px 0px' });
    targets.forEach((el) => io.observe(el));
  })();

  // ====================== E) TIMELINE HIGHLIGHT ===========================
  (function timelineHighlight() {
    const nodes = $$('.node');
    if (!nodes.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.4 });
    nodes.forEach((n) => io.observe(n));
  })();

  // ====================== F) REDUCED MOTION SAFETY ========================
  (function reducedMotionSafety() {
    if (!REDUCED_MOTION) return;
    $$('.layer').forEach((el) => { el.style.transform = 'none'; });
    document.documentElement.style.scrollBehavior = 'auto';
  })();

  // ====================== G) SOFT MODE TOGGLE =============================
  (function softModeToggle() {
    const btn = $('#modeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const root = document.documentElement;
      root.dataset.mode = (!root.dataset.mode || root.dataset.mode === 'light') ? 'soft' : 'light';
    });
  })();

  // ====================== H) METRIC COUNT-UP ==============================
  (function metricCountUp() {
    const counters = $$('.section [data-count], .card [data-count], [data-count]');
    if (!counters.length) return;

    const animate = (el, to, dur = 1200) => {
      const t0 = performance.now();
      const tick = (t) => {
        const p = clamp((t - t0) / dur, 0, 1);
        el.textContent = Math.floor(to * p).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((ent) => {
        if (!ent.isIntersecting) return;
        const to = parseInt(ent.target.getAttribute('data-count'), 10) || 0;
        animate(ent.target, to, 1300);
        io.unobserve(ent.target);
      });
    }, { threshold: 0.35 });

    counters.forEach((el) => io.observe(el));
  })();

  // ====================== I) TYPEWRITER ===================================
  (function typewriter() {
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
      const typed = j === word.length;
      const erased = j === 0;
      if (typed) { deleting = true; setTimeout(tick, 900); }
      else if (erased) { deleting = false; i++; setTimeout(tick, 400); }
      else { setTimeout(tick, deleting ? 40 : 80); }
    };
    tick();
  })();

  // ====================== J) CAPABILITIES TABS ============================
  // Centered pills, sliding underline, ARIA sync, resize-safe.
  (function capabilitiesTabs() {
    const wrap = $('#capabilities .pill-tabs');
    if (!wrap) return;

    const pills = $$('.pill', wrap);
    const panels = $$('#capabilities .cap-panel');
    const underline = $('.pill-underline', wrap);
    if (!pills.length || !panels.length || !underline) return;

    const moveUnderline = (pill) => {
      if (!pill) return;
      const pillRect = pill.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      const x = pillRect.left - wrapRect.left + wrap.scrollLeft;
      underline.style.width = `${pillRect.width}px`;
      underline.style.transform = `translateX(${x}px)`;
    };

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

    pills.forEach((pill, i) => pill.addEventListener('click', () => setActive(i)));

    wrap.addEventListener('keydown', (e) => {
      const curr = pills.findIndex(p => p.classList.contains('active'));
      if (e.key === 'ArrowRight') { e.preventDefault(); setActive((curr + 1) % pills.length); pills[(curr + 1) % pills.length].focus(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setActive((curr - 1 + pills.length) % pills.length); pills[(curr - 1 + pills.length) % pills.length].focus(); }
    });

    const initial = Math.max(0, pills.findIndex(p => p.classList.contains('active')));
    setActive(initial);
    window.addEventListener('resize', () => moveUnderline($('.pill.active', wrap)));
  })();

  // ====================== K) BRAND LOGO FLIP ==============================
  (function brandFlip() {
    const brand = $('.brand');
    if (!brand) return;
    brand.addEventListener('click', (e) => {
      e.preventDefault();
      brand.classList.add('flip');
      setTimeout(() => {
        window.location.href = brand.getAttribute('href');
        brand.classList.remove('flip');
      }, 600); // keep in sync with CSS
    });
  })();

  // ====================== L) FIRST-VISIT INTRO ============================
  // 5s branded splash (SVG), persisted in localStorage.
  (function introOnce() {
    const intro = document.getElementById('intro');
    if (!intro) return;

    const INTRO_KEY = 'oky:introSeen';
    const forceIntro = new URLSearchParams(location.search).has('intro');
    if (!forceIntro && localStorage.getItem(INTRO_KEY) === 'true') {
      intro.remove(); return;
    }

    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    const finish = () => {
      intro.classList.add('exit');
      setTimeout(() => {
        intro.remove();
        document.documentElement.style.overflow = prevOverflow || '';
      }, 550);
      if (!forceIntro) localStorage.setItem(INTRO_KEY, 'true');
    };

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(finish, reduced ? 1000 : 5000);
  })();

}); // DOMContentLoaded end

// ====================== M) CONTRAST SWITCHER (Do/Don't) ===================
// Lives outside DOMContentLoaded so it also works if injected late.
(() => {
  const wrap = document.querySelector('#contrast .contrast-toggle');
  if (!wrap) return;

  const pills = Array.from(wrap.querySelectorAll('.seg'));
  const thumb = wrap.querySelector('.seg-underline');
  const panelDo = document.getElementById('do-panel');
  const panelDont = document.getElementById('dont-panel');

  const moveThumb = (pill) => {
    if (!pill) return;
    const padLeft = parseFloat(getComputedStyle(wrap).paddingLeft) || 0;
    const x = pill.offsetLeft - padLeft;
    thumb.style.width = `${pill.offsetWidth}px`;
    thumb.style.transform = `translateX(${x}px)`;
  };

  const setActive = (i) => {
    pills.forEach((p, idx) => p.classList.toggle('active', idx === i));
    const showDo = i === 0;
    panelDo.hidden = !showDo;
    panelDont.hidden = showDo;
    moveThumb(pills[i]);
  };

  pills.forEach((p, i) => p.addEventListener('click', () => setActive(i)));
  wrap.addEventListener('keydown', (e) => {
    const curr = pills.findIndex(p => p.classList.contains('active'));
    if (e.key === 'ArrowRight') { e.preventDefault(); setActive((curr + 1) % pills.length); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); setActive((curr - 1 + pills.length) % pills.length); }
  });

  const initial = Math.max(0, pills.findIndex(p => p.classList.contains('active')));
  setActive(initial);
  window.addEventListener('resize', () => moveThumb(wrap.querySelector('.seg.active')));
})();

/* ==========================================================================
   Mobile Navigation & Footer Helpers
   - Hamburger toggle with ARIA
   - Close on link click and on viewport resize to desktop
   - Optional: prevent body scroll when menu is open
   - Footer copy-to-clipboard feedback
   ========================================================================== */

(() => {
  const btn = document.querySelector('.nav-toggle');
  const links = document.getElementById('nav-links');
  if (!btn || !links) return;

  const lockBody = (on) => {
    document.documentElement.style.overflow = on ? 'hidden' : '';
    document.body.style.overflow = on ? 'hidden' : '';
  };

  const setOpen = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    links.classList.toggle('open', open);
    lockBody(open);
  };

  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    setOpen(open);
  });

  // Close menu when a nav link is tapped/clicked
  links.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  // Close the menu when resizing to desktop
  const onResize = () => {
    if (window.innerWidth > 768 && btn.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
    }
  };
  window.addEventListener('resize', onResize);

  // Safety: if JS loads after user resizes, ensure correct initial state
  onResize();
})();

/* Footer: copy-to-clipboard with a tiny toast message */
(() => {
  const btn = document.querySelector('.copy-email');
  const toast = document.querySelector('.copy-toast');
  if (!btn || !toast) return;

  btn.addEventListener('click', async () => {
    const email = btn.getAttribute('data-email') || btn.textContent.trim();
    try {
      await navigator.clipboard.writeText(email);
      toast.textContent = 'Copied!';
      setTimeout(() => (toast.textContent = ''), 1500);
    } catch {
      toast.textContent = 'Press Ctrl/Cmd+C to copy';
      setTimeout(() => (toast.textContent = ''), 2000);
    }
  });
})();