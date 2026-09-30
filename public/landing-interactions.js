/* ═══════════════════════════════════════════════════════════
   OquNet — landing interactions
   1. Sticky nav        4. Count-up numbers
   2. Mobile menu       5. "How it works" stepper
   3. Reveal on scroll  6. Marquee, FAQ, misc
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── 1. Sticky nav ─────────────────────────────────────── */
  var nav = $('#nav');
  var onScroll = function () {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── 1b. Hero parallax floating cards ───────────────────── */
  var floats = $$('.float');
  if (floats.length && !reduced) {
    var onParallax = function () {
      var y = window.scrollY;
      floats.forEach(function (el, i) {
        var speed = 0.03 + i * 0.015;
        el.style.transform = 'translateY(' + (-y * speed) + 'px)';
      });
    };
    window.addEventListener('scroll', onParallax, { passive: true });
  }

  /* ── 2. Mobile menu — drawer version ───────────────────── */
  // New nav uses #menuToggle + #drawer instead of #burger + #mobile-menu
  // Both patterns supported for backwards compatibility.
  var burger = $('#menuToggle') || $('#burger');
  var menu   = $('#mobile-menu');   // may be null in new nav
  var drawer = document.getElementById('drawer');

  if (burger && menu) {
    // Legacy pattern
    var setMenu = function (open) {
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Мәзірді жабу' : 'Мәзірді ашу');
      menu.hidden = !open;
      menu.style.display = open ? 'flex' : '';
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); }
    });
  }
  // Drawer pattern is handled by inline <script> in HTML

  /* ── 3. Reveal on scroll ───────────────────────────────── */
  var revealables = $$('[data-reveal]');

  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    // Elements that share a parent animate in sequence, not all at once.
    var seen = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var parent = el.parentElement;
        var n = seen.get(parent) || 0;
        seen.set(parent, n + 1);
        el.style.transitionDelay = Math.min(n, 6) * 80 + 'ms';
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ── 4. Count-up numbers ───────────────────────────────── */
  var groupThousands = function (str) {
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  var format = function (value, decimals) {
    if (decimals) return groupThousands(String(Math.floor(value))) + ',' + value.toFixed(decimals).split('.')[1];
    return groupThousands(String(Math.round(value)));
  };

  var countUp = function (el) {
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || '0', 10);
    var suffix = el.dataset.suffix || '';
    if (isNaN(target)) return;

    if (reduced) { el.textContent = format(target, decimals) + suffix; return; }

    var dur = 1500;
    var start = null;
    var tick = function (now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);          // easeOutQuart
      el.textContent = format(target * eased, decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  var counters = $$('[data-count]');
  if (!('IntersectionObserver' in window)) {
    counters.forEach(countUp);
  } else {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        countUp(entry.target);
        cio.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ── 5. "How it works" stepper ─────────────────────────── */
  var widget = $('#how-widget');
  if (widget) {
    var tabs = $$('.step', widget);
    var panels = $$('.scr', widget);
    var STEP_MS = 6000;
    var current = 0;
    var timer = null;
    var paused = false;
    var visible = false;

    var timerVal = $('#timerVal');

    var animateTimerValue = function () {
      if (!timerVal) return;
      if (reduced) { timerVal.textContent = '00:42'; return; }
      var from = 0, to = 42, t0 = null;
      var run = function (now) {
        if (t0 === null) t0 = now;
        var p = Math.min((now - t0) / 2600, 1);
        var v = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
        timerVal.textContent = '00:' + (v < 10 ? '0' : '') + v;
        if (p < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    };

    var show = function (i) {
      current = i;
      tabs.forEach(function (tab, n) {
        var on = n === i;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        // Restart the progress bar animation on every activation.
        var bar = $('.step__bar i', tab);
        if (bar) {
          bar.style.animation = 'none';
          void bar.offsetWidth;
          bar.style.animation = '';
        }
      });
      panels.forEach(function (panel, n) {
        var on = n === i;
        panel.hidden = !on;
        panel.classList.toggle('is-active', on);
      });
      if (i === 3) animateTimerValue();
    };

    var schedule = function () {
      clearTimeout(timer);
      if (reduced || paused || !visible) return;
      timer = setTimeout(function () {
        show((current + 1) % tabs.length);
        schedule();
      }, STEP_MS);
    };

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { show(i); schedule(); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        e.preventDefault();
        show(next);
        tabs[next].focus();
        schedule();
      });
    });

    widget.addEventListener('mouseenter', function () { paused = true; clearTimeout(timer); });
    widget.addEventListener('mouseleave', function () { paused = false; schedule(); });
    widget.addEventListener('focusin', function () { paused = true; clearTimeout(timer); });
    widget.addEventListener('focusout', function () {
      if (!widget.contains(document.activeElement)) { paused = false; schedule(); }
    });

    // Only run the carousel while it is on screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) { show(current); schedule(); } else clearTimeout(timer);
      }, { threshold: 0.25 }).observe(widget);
    } else {
      visible = true;
      schedule();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearTimeout(timer); else schedule();
    });
  }

  /* ── 6. Marquee: duplicate the track so the loop is seamless */
  var track = $('#marqueeTrack');
  if (track) track.innerHTML += track.innerHTML;

  /* ── 7. FAQ: keep one answer open at a time ────────────── */
  $$('#faq-list .qa').forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (!item.open) return;
      $$('#faq-list .qa').forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ── 8. Misc ───────────────────────────────────────────── */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ── 9. Back to top button ─────────────────────────────── */
  var backTop = $('#backTop');
  if (backTop) {
    var toggleBackTop = function () {
      if (backTop) backTop.classList.toggle('is-visible', window.scrollY > 600);
    };
    window.addEventListener('scroll', toggleBackTop, { passive: true });
    toggleBackTop();
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── 10. Mobile CTA bar ────────────────────────────────── */
  var mobileCta = $('#mobileCta');
  var heroSection = $('#hero');
  if (mobileCta && heroSection) {
    var toggleMobileCta = function () {
      var heroBottom = heroSection.getBoundingClientRect().bottom;
      if (mobileCta) mobileCta.classList.toggle('is-visible', heroBottom < 0);
    };
    window.addEventListener('scroll', toggleMobileCta, { passive: true });
    toggleMobileCta();
  }

  /* ── 11. Active nav link highlighting ──────────────────── */
  var navLinks = $$('.nav__links a');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var sections = navLinks.map(function (a) {
      return document.querySelector(a.getAttribute('href'));
    }).filter(Boolean);
    var sectionIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    sections.forEach(function (s) { sectionIO.observe(s); });
  }
})();