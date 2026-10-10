(function () {
  'use strict';
  var reduced = !!window.__rm;
  var fine = matchMedia('(pointer: fine)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var body = document.body;

  /* ── live open/closed status + today's hours, always in Milwaukee time ──
     Hours below must match the Hours list in index.html. */
  var CLOSE = { 0: 19, 1: 20, 2: 20, 3: 20, 4: 20, 5: 22, 6: 22 }, OPEN = 11;
  function mkeNow() {
    var d = new Date();
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(d);
      var get = function (t) { for (var i = 0; i < parts.length; i++) if (parts[i].type === t) return parts[i].value; };
      var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      if (day > -1) return { day: day, h: (+get('hour') % 24) + (+get('minute')) / 60 };
    } catch (e) {}
    return { day: d.getDay(), h: d.getHours() + d.getMinutes() / 60 };
  }
  function fmt(x) { return (x > 12 ? x - 12 : x) + (x >= 12 ? ' PM' : ' AM'); }
  function renderStatus() {
    var n = mkeNow(), close = CLOSE[n.day], open = n.h >= OPEN && n.h < close;
    var early = n.h < OPEN;
    var tag = document.getElementById('open-status'), hs = document.getElementById('hours-status');
    if (tag) {
      tag.textContent = open ? 'Open now until ' + fmt(close) + ' at 3rd St. Market Hall'
                             : 'Opens ' + (early ? 'today' : 'tomorrow') + ' at 11 AM at 3rd St. Market Hall';
      tag.parentElement.classList.toggle('closed', !open);
    }
    if (hs) {
      hs.textContent = open ? 'Open now. Closes at ' + fmt(close) + ' today.'
                            : 'Closed now. Opens ' + (early ? 'today' : 'tomorrow') + ' at 11 AM.';
      hs.classList.toggle('closed', !open);
    }
    document.querySelectorAll('#hours li').forEach(function (li) {
      li.classList.toggle('today', li.dataset.days.split(',').indexOf(String(n.day)) > -1);
    });
    var gs = document.getElementById('glance-status'), gh = document.getElementById('glance-hours');
    if (gs) {
      gs.textContent = open ? 'Open now, until ' + fmt(close) : 'Closed now, opens ' + (early ? 'today' : 'tomorrow') + ' at 11 AM';
      gs.parentElement.classList.toggle('closed', !open);
    }
    if (gh) gh.textContent = 'Today: 11 AM to ' + fmt(close) + ' · Mon to Thu to 8, Fri and Sat to 10, Sun to 7';
  }
  renderStatus();
  setInterval(renderStatus, 60000);

  /* ── reviews: real Google reviews from reviews.js, rendered as text only. Hidden while empty. ── */
  (function () {
    var list = window.REVIEWS || [], sec = document.getElementById('reviews'), grid = document.getElementById('rev-grid');
    if (!sec || !grid || !list.length) return;
    var more = document.getElementById('rev-more');
    if (more && window.REVIEWS_URL) more.href = window.REVIEWS_URL;
    list.slice(0, 6).forEach(function (r) {
      var li = document.createElement('li'); li.className = 'rev rv';
      var stars = Math.max(0, Math.min(5, Math.round(+r.stars || 0)));
      var st = document.createElement('p'); st.className = 'rev-stars'; st.setAttribute('aria-label', stars + ' out of 5 stars');
      st.textContent = '★★★★★'.slice(0, stars) + '☆☆☆☆☆'.slice(0, 5 - stars);
      var q = document.createElement('blockquote'); q.className = 'rev-text'; q.textContent = r.text || '';
      var who = document.createElement('p'); who.className = 'rev-who';
      who.textContent = (r.name || 'Google reviewer') + (r.when ? ' · ' + r.when : '') + ' · Google';
      li.appendChild(st); li.appendChild(q); li.appendChild(who); grid.appendChild(li);
    });
    sec.hidden = false;
  })();

  /* ── map fallback: if the Google embed never loads, show the address card underneath ── */
  (function () {
    var map = document.querySelector('.map'), fr = map && map.querySelector('iframe');
    if (!fr) return;
    var loaded = false, timer;
    fr.addEventListener('load', function () { loaded = true; clearTimeout(timer); });
    var fail = function () { if (!loaded) map.classList.add('failed'); };
    if (navigator.onLine === false) return fail();
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io.disconnect(); timer = setTimeout(fail, 10000); }
      }, { rootMargin: '200px' });
      io.observe(map);
    }
  })();

  /* ── quick-action bar + back-to-top visibility (works with or without smooth scroll) ── */
  var heroEl = document.getElementById('hero'), ticking = false;
  function onScrollUI() {
    ticking = false;
    var y = window.scrollY || document.documentElement.scrollTop;
    body.classList.toggle('show-qb', y > heroEl.offsetHeight * 0.75);
    body.classList.toggle('show-top', y > window.innerHeight * 1.5);
    var tabsEl = document.querySelector('.tabs');
    if (tabsEl) {
      var top = parseFloat(getComputedStyle(tabsEl).top) || 0, shell = tabsEl.parentElement.getBoundingClientRect();
      tabsEl.classList.toggle('stuck', shell.top < top - 6 && shell.bottom > top + 120);
    }
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScrollUI); } }, { passive: true });
  addEventListener('resize', onScrollUI);
  onScrollUI();

  var lenis = null;
  function scrollToEl(t, done) {
    if (lenis) lenis.scrollTo(t, { offset: t === document.body ? 0 : -10, duration: 1.2, onComplete: done });
    else { (t === document.body ? window.scrollTo(0, 0) : t.scrollIntoView()); if (done) done(); }
  }
  function focusEl(t) {
    if (!t.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
  }
  document.getElementById('to-top').addEventListener('click', function (e) {
    e.preventDefault();
    scrollToEl(document.body, function () { focusEl(document.querySelector('.nav-logo')); });
  });

  /* ── menu tabs with sliding indicator, arrow-key support, sticky-aware ── */
  function setupTabs(animate) {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab')), ind = document.getElementById('tab-ind');
    var shell = document.querySelector('.menu-shell'), bar = document.querySelector('.tabs');
    function moveInd(tb) {
      ind.style.left = tb.offsetLeft + 'px'; ind.style.top = tb.offsetTop + 'px';
      ind.style.width = tb.offsetWidth + 'px'; ind.style.height = tb.offsetHeight + 'px';
    }
    var cur = function () { return document.querySelector('.tab.on'); };
    moveInd(cur());
    addEventListener('resize', function () { moveInd(cur()); });
    if (document.fonts) document.fonts.ready.then(function () { moveInd(cur()); });
    function select(tb) {
      if (tb.classList.contains('on')) return;
      tabs.forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); x.setAttribute('tabindex', '-1'); });
      tb.classList.add('on'); tb.setAttribute('aria-selected', 'true'); tb.setAttribute('tabindex', '0'); moveInd(tb);
      document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('on'); });
      var p = document.getElementById(tb.dataset.panel); p.classList.add('on');
      /* if the tab bar is stuck partway down a long list, jump back to the start of the new list */
      var stickTop = parseFloat(getComputedStyle(bar).top) || 0;
      if (shell.getBoundingClientRect().top < stickTop - 6) {
        /* land the top of the menu card just under the nav so the first item is never hidden */
        var y = shell.getBoundingClientRect().top + (window.scrollY || 0) - 84;
        if (lenis) lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
      }
      if (animate) {
        gsap.fromTo(p.querySelectorAll('.mi, .fish-card'), { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: .55, ease: 'power3.out', stagger: .03 });
        ScrollTrigger.refresh();
      }
    }
    tabs.forEach(function (tb, i) {
      tb.addEventListener('click', function () { select(tb); });
      tb.addEventListener('keydown', function (e) {
        var k = e.key, j = -1;
        if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % tabs.length;
        else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
        else if (k === 'Home') j = 0; else if (k === 'End') j = tabs.length - 1;
        if (j < 0) return;
        e.preventDefault(); tabs[j].focus(); select(tabs[j]);
      });
    });
  }

  /* ── no-motion fallback ── */
  if (reduced || !hasGsap) {
    body.classList.remove('loading');
    var ld = document.getElementById('loader'); if (ld) ld.remove();
    setupTabs(false);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ── split text ── */
  function splitChars(el) {
    var words = el.textContent.split(' '); el.textContent = '';
    words.forEach(function (w, wi) {
      var wrap = document.createElement('span'); wrap.className = 'wd';
      w.split('').forEach(function (c) {
        var s = document.createElement('span'); s.className = 'ch'; s.textContent = c; wrap.appendChild(s);
      });
      el.appendChild(wrap);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }
  function splitWords(el) {
    var nodes = Array.prototype.slice.call(el.childNodes); el.innerHTML = '';
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { el.appendChild(document.createTextNode(' ')); return; }
          var o = document.createElement('span'); o.className = 'w';
          var i = document.createElement('span'); i.textContent = w; o.appendChild(i); el.appendChild(o);
        });
      } else {
        var o = document.createElement('span'); o.className = 'w';
        o.appendChild(n.cloneNode(true)); el.appendChild(o);
      }
    });
  }
  document.querySelectorAll('h1 .chars').forEach(splitChars);
  document.querySelectorAll('.split').forEach(splitWords);

  /* ── smooth scroll ── */
  lenis = new Lenis({ lerp: .085 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);
  lenis.stop();

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = document.querySelector(a.getAttribute('href')); if (!t) return;
      e.preventDefault();
      if (a.id === 'to-top') return;
      lenis.scrollTo(t, { offset: t.id === 'hero' ? 0 : -10, duration: 1.4, onComplete: function () { focusEl(t); } });
    });
  });

  /* ── nav: glass on scroll, hide going down, show going up ── */
  var nav = document.getElementById('nav'), lastY = 0;
  lenis.on('scroll', function (e) {
    var y = e.scroll;
    nav.classList.toggle('scrolled', y > 40);
    if (y > lastY + 2 && y > 500 && !nav.contains(document.activeElement)) nav.classList.add('hide');
    if (y < lastY - 2 || y <= 500) nav.classList.remove('hide');
    body.classList.toggle('nav-hidden', nav.classList.contains('hide'));
    lastY = y;
  });
  nav.addEventListener('focusin', function () { nav.classList.remove('hide'); body.classList.remove('nav-hidden'); });

  /* ── initial hidden states ── */
  gsap.set('.rv', { opacity: 0, y: 40 });
  gsap.set('.sig-grid .tilt', { opacity: 0, y: 70 });
  gsap.set('#loader', { clipPath: 'inset(0% 0% 0% 0%)' });

  /* ── hero intro ── */
  var intro = gsap.timeline({ paused: true });
  intro
    .fromTo('#hero-img', { scale: 1.28 }, { scale: 1, duration: 2.4, ease: 'power3.out' }, 0)
    .from('h1 .ch', { yPercent: 120, rotate: 7, duration: 1.15, ease: 'power4.out', stagger: .03 }, .12)
    .from('h1 .serif', { opacity: 0, y: 24, duration: .9, ease: 'power3.out' }, .75)
    .from('.rv-hero', { opacity: 0, y: 26, duration: .95, ease: 'power3.out', stagger: .12 }, .55)
    .from('#nav', { autoAlpha: 0, duration: .9, ease: 'power2.out', clearProps: 'opacity,visibility' }, .5)
    .from('.scroll-ind', { opacity: 0, duration: .8 }, 1);

  /* ── loader ── */
  var num = document.getElementById('ld-num'), bar = document.getElementById('ld-bar'), prog = { v: 0 };
  var started = false;
  function startSite() {
    if (started) return; started = true;
    body.classList.remove('loading'); lenis.start(); intro.play(); ScrollTrigger.refresh();
  }
  /* The count follows real loading (fonts and the hero photo), eased so it never jumps, with a short
     floor so it reads, then the sheet lifts off the hero. Any key or tap skips it. */
  var parts = { fonts: 0, hero: 0 }, t0 = performance.now(), MIN = 900, MAX = 3200, outPlayed = false;
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { parts.fonts = 1; });
  var heroImg = document.getElementById('hero-img');
  if (!heroImg || heroImg.complete) parts.hero = 1;
  else { heroImg.addEventListener('load', function () { parts.hero = 1; }); heroImg.addEventListener('error', function () { parts.hero = 1; }); }
  gsap.from('#loader img', { scale: .8, opacity: 0, duration: .6, ease: 'back.out(1.7)' });
  var loadTl = gsap.timeline({ paused: true, onComplete: function () { gsap.set('#loader', { display: 'none' }); } });
  loadTl
    .to('#loader img, .ld-row', { opacity: 0, y: -16, duration: .3, ease: 'power2.out', stagger: .05 })
    .to('#loader', { clipPath: 'inset(0% 0% 100% 0%)', duration: .8, ease: 'power4.inOut' }, '-=.05')
    .add(function () { startSite(); }, '-=.6');
  function ldTick() {
    if (outPlayed) return;
    var el = performance.now() - t0;
    var target = Math.min((parts.fonts + parts.hero) / 2, el / MIN) * 100;
    prog.v += (target - prog.v) * 0.16;
    if (target >= 100 && prog.v > 98.5) prog.v = 100;
    num.textContent = Math.round(prog.v); bar.style.width = prog.v + '%';
    if (prog.v >= 100 || el > MAX) { outPlayed = true; gsap.ticker.remove(ldTick); num.textContent = '100'; bar.style.width = '100%'; loadTl.play(); }
  }
  gsap.ticker.add(ldTick);
  var skipLd = function () { if (!outPlayed) { outPlayed = true; gsap.ticker.remove(ldTick); loadTl.timeScale(1.8).play(); } };
  addEventListener('keydown', skipLd, { once: true });
  document.getElementById('loader').addEventListener('pointerdown', skipLd, { once: true });
  setTimeout(function () { if (!started) { gsap.set('#loader', { display: 'none' }); startSite(); intro.progress(1); } }, 5000);
  /* no loader (motion turned off): quicker intro */
  if (document.documentElement.classList.contains('no-loader')) {
    outPlayed = true; gsap.ticker.remove(ldTick); loadTl.kill(); gsap.set('#loader', { display: 'none' }); intro.timeScale(1.6); startSite();
  }

  /* ── hero scroll parallax ── */
  gsap.to('.hero-media img', { yPercent: 12, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-inner', { yPercent: -16, opacity: .15, ease: 'none',
    scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ── ghost type drift ── */
  document.querySelectorAll('[data-ghost]').forEach(function (g) {
    gsap.fromTo(g, { xPercent: 6 }, { xPercent: -24, ease: 'none',
      scrollTrigger: { trigger: g.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ── headline word reveals ── */
  document.querySelectorAll('.split').forEach(function (el) {
    gsap.from(el.querySelectorAll('.w > *'), { yPercent: 115, duration: 1.05, ease: 'power4.out', stagger: .08,
      scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  /* ── generic reveals ── */
  gsap.utils.toArray('.rv').forEach(function (el) {
    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
  ScrollTrigger.batch('.sig-grid .tilt', { start: 'top 90%',
    onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 1.15, ease: 'power3.out', stagger: .11 }); } });

  /* ── story image clip reveal ── */
  gsap.to('#story-frame', { clipPath: 'inset(0% 0% 0% 0% round 26px)', ease: 'none',
    scrollTrigger: { trigger: '#story', start: 'top 85%', end: 'center 55%', scrub: true } });
  gsap.to('#story-img', { scale: 1, ease: 'none',
    scrollTrigger: { trigger: '#story', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ── number counters ── */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var o = { v: 0 }, end = +el.dataset.count; el.textContent = '0';
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () {
      gsap.to(o, { v: end, duration: 1.6, ease: 'power2.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
    } });
  });

  /* ── section transitions: each section's content settles in from below and eases back as it leaves,
     so one section hands off to the next instead of just scrolling past ── */
  gsap.utils.toArray('#signature > .wrap, #menu > .wrap, #story > .wrap, #reviews > .wrap, #visit > .wrap').forEach(function (w) {
    gsap.fromTo(w, { y: 90, scale: .965 }, { y: 0, scale: 1, ease: 'none',
      scrollTrigger: { trigger: w.parentElement, start: 'top bottom', end: 'top 35%', scrub: .6 } });
    gsap.to(w, { y: -60, opacity: .35, ease: 'none',
      scrollTrigger: { trigger: w.parentElement, start: 'bottom 45%', end: 'bottom top', scrub: .6 } });
  });
  /* the at-a-glance strip slides up out of the hero */
  gsap.from('.g-item', { y: 40, opacity: 0, duration: .9, ease: 'power3.out', stagger: .1,
    scrollTrigger: { trigger: '#glance', start: 'top 92%' } });
  /* the 3D dawg: copy slides in from the left while the stage opens */
  gsap.from('.d3-copy', { x: -80, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#dawg3d', start: 'top 85%', end: 'top 35%', scrub: .6 } });
  gsap.fromTo('.d3-stage', { clipPath: 'inset(12% 12% 12% 12% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
    scrollTrigger: { trigger: '#dawg3d', start: 'top 90%', end: 'top 30%', scrub: .6 } });
  /* the map wipes open */
  gsap.fromTo('.map', { clipPath: 'inset(0% 0% 100% 0% round 26px)' }, { clipPath: 'inset(0% 0% 0% 0% round 26px)', ease: 'none',
    scrollTrigger: { trigger: '#visit', start: 'top 80%', end: 'top 30%', scrub: .6 } });

  /* ── final band parallax ── */
  gsap.fromTo('#final-bg', { yPercent: -8 }, { yPercent: 8, ease: 'none',
    scrollTrigger: { trigger: '#final', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.final', { scale: .92, borderRadius: 60, ease: 'none',
    scrollTrigger: { trigger: '#final', start: 'top bottom', end: 'top 30%', scrub: true } });

  /* ── pinned horizontal reel (desktop) ── */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', function () {
    var track = document.getElementById('reel-track');
    /* photos are lazy-loaded; fetch the whole reel just before it pins so none slide in blank */
    ScrollTrigger.create({ trigger: '#reel', start: 'top bottom+=800', once: true, onEnter: function () {
      track.querySelectorAll('img').forEach(function (i) { i.loading = 'eager'; });
    } });
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    var tw = gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: '#reel-pin', start: 'center center', end: function () { return '+=' + dist(); },
        pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
    gsap.utils.toArray('.shot-img img').forEach(function (img) {
      gsap.fromTo(img, { xPercent: -7 }, { xPercent: 7, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
    });
  });

  /* ── pointer-only effects ── */
  if (fine) {
    /* 3D tilt + glare */
    document.querySelectorAll('.tilt').forEach(function (t) {
      var card = t.querySelector('.card');
      t.addEventListener('mousemove', function (e) {
        var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.transition = 'transform .15s ease-out';
        card.style.transform = 'rotateY(' + ((x - .5) * 14) + 'deg) rotateX(' + ((.5 - y) * 12) + 'deg) translateZ(0)';
        card.style.setProperty('--gx', (x * 100) + '%'); card.style.setProperty('--gy', (y * 100) + '%');
      });
      t.addEventListener('mouseleave', function () { card.style.transition = ''; card.style.transform = ''; });
    });

    /* magnetic buttons */
    document.querySelectorAll('.mag').forEach(function (m) {
      m.addEventListener('mousemove', function (e) {
        var r = m.getBoundingClientRect();
        gsap.to(m, { x: (e.clientX - r.left - r.width / 2) * .22, y: (e.clientY - r.top - r.height / 2) * .3, duration: .5, ease: 'power3.out' });
      });
      m.addEventListener('mouseleave', function () { gsap.to(m, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1,.4)' }); });
    });

    /* custom cursor */
    var cur = document.getElementById('cursor'), cx = -100, cy = -100, px = -100, py = -100;
    addEventListener('mousemove', function (e) { cx = e.clientX; cy = e.clientY; body.classList.add('has-cursor'); });
    document.addEventListener('mouseleave', function () { body.classList.remove('has-cursor'); });
    gsap.ticker.add(function () { px += (cx - px) * .2; py += (cy - py) * .2; cur.style.transform = 'translate(' + px + 'px,' + py + 'px)'; });
    document.querySelectorAll('a, button').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cur.classList.add('link'); });
      el.addEventListener('mouseleave', function () { cur.classList.remove('link'); });
    });
    document.querySelectorAll('[data-cursor="view"]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cur.classList.add('view'); });
      el.addEventListener('mouseleave', function () { cur.classList.remove('view'); });
    });
  }

  setupTabs(true);
  addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
