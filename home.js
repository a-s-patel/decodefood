(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (n, a, b) { return Math.min(b, Math.max(a, n)); };

  /* ── Nav: scrolled state + mobile menu ─────────────────────── */
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }
  toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  document.querySelectorAll('#mobileMenu a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  /* ── Scroll-linked effects share one rAF-throttled handler ──── */
  var hero = document.getElementById('hero');
  var parallax = [].slice.call(document.querySelectorAll('[data-parallax]'));
  var steps = document.getElementById('steps');
  var lit = document.getElementById('lit');
  var words = [];

  if (lit) {
    var text = lit.textContent.trim().split(/\s+/);
    lit.setAttribute('aria-label', text.join(' '));
    lit.textContent = '';
    text.forEach(function (t, i) {
      var s = document.createElement('span');
      s.className = 'w';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = t;
      lit.appendChild(s);
      if (i < text.length - 1) lit.appendChild(document.createTextNode(' '));
      words.push(s);
    });
  }

  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;

    nav.classList.toggle('scrolled', window.scrollY > 24);

    if (!reduce && hero) {
      var max = hero.offsetHeight - vh;
      var t = max > 0 ? clamp(-hero.getBoundingClientRect().top / max, 0, 1) : 1;
      var p = clamp(t / 0.5, 0, 1);          // phase 1: phone rises + straightens
      var q = clamp((t - 0.5) / 0.5, 0, 1);  // phase 2: phone blurs out, app icon + CTAs rise
      hero.style.setProperty('--p', p.toFixed(4));
      hero.style.setProperty('--q', q.toFixed(4));
      hero.classList.toggle('p-late', p > 0.5);
      hero.classList.toggle('q-on', q > 0.55);
    }

    if (!reduce) {
      parallax.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.parallax);
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });

      if (steps) {
        var sr = steps.getBoundingClientRect();
        steps.style.setProperty('--line-p', clamp((vh * 0.75 - sr.top) / sr.height, 0, 1).toFixed(3));
      }

      if (words.length) {
        var lr = lit.getBoundingClientRect();
        var prog = clamp((vh * 0.82 - lr.top) / (lr.height + vh * 0.25), 0, 1);
        var n = Math.round(prog * words.length);
        for (var i = 0; i < words.length; i++) words[i].classList.toggle('lit', i < n);
      }
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  /* ── Reveal on scroll ──────────────────────────────────────── */
  document.querySelectorAll('.page-header, .prose-section, .how-step, .contact-topic, .legal-callout').forEach(function (el) {
    el.setAttribute('data-reveal', '');
  });
  var reveals = document.querySelectorAll('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ── Count-up stats ────────────────────────────────────────── */
  var counters = document.querySelectorAll('[data-count]');
  if (!reduce && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        co.unobserve(en.target);
        var el = en.target, to = +el.dataset.count, t0 = performance.now(), dur = 1400;
        (function tick(t) {
          var k = clamp((t - t0) / dur, 0, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4)));
          if (k < 1) requestAnimationFrame(tick);
        })(t0);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  }

  /* ── Card spotlight follows the pointer ────────────────────── */
  if (!reduce) {
    document.querySelectorAll('[data-spot]').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }
})();
