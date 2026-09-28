/* Smart Smooth Scroll for index page - Lenis + GSAP (part 1/4: setup) */
(function () {
  'use strict';
  var docEl = document.documentElement;
  var prefersReduced = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HEADER_OFFSET = 88;
  var hasGsap = typeof window.gsap !== 'undefined';
  var hasST = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  var hasSTo = hasGsap && typeof window.ScrollToPlugin !== 'undefined';
  if (hasGsap && hasST) { try { window.gsap.registerPlugin(window.ScrollTrigger); } catch (e) {} }
  if (hasGsap && hasSTo) { try { window.gsap.registerPlugin(window.ScrollToPlugin); } catch (e) {} }
  var progressWrap = document.getElementById('smooth-progress');
  if (!progressWrap) {
    progressWrap = document.createElement('div');
    progressWrap.id = 'smooth-progress';
    progressWrap.setAttribute('aria-hidden', 'true');
    progressWrap.appendChild(document.createElement('span'));
    document.body.appendChild(progressWrap);
  }
  var progressBar = progressWrap.querySelector('span');
  var scrollTopBtn = document.querySelector('.scroll-to-top');
  var lenis = null;
  function getMaxScroll() {
    var h = Math.max(document.body.scrollHeight, docEl.scrollHeight,
      document.body.offsetHeight, docEl.offsetHeight);
    return Math.max(0, h - window.innerHeight);
  }
  var ticking = false;
  function updateProgressUI() {
    ticking = false;
    var max = getMaxScroll();
    var y = window.scrollY || window.pageYOffset || 0;
    var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    if (progressBar) progressBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    progressWrap.classList.toggle('is-visible', y > 40 && max > 0);
    if (scrollTopBtn) {
      scrollTopBtn.style.setProperty('--p', (p * 100).toFixed(1));
      scrollTopBtn.classList.toggle('is-visible', y > 400);
    }
  }
  function requestProgress() {
    if (!ticking) { ticking = true; requestAnimationFrame(updateProgressUI); }
  }

  function fallbackTo(targetY, duration) {
    duration = duration || 1.2;
    if (hasGsap && hasSTo) {
      window.gsap.to(window, { duration: duration, ease: 'power3.inOut',
        scrollTo: { y: targetY, autoKill: true } });
    } else if ('scrollBehavior' in docEl.style) {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    } else { window.scrollTo(0, targetY); }
  }
  function smartTo(target, duration) {
    var y = 0;
    if (typeof target === 'number') y = target;
    else if (target === 'html' || target === 'body') y = 0;
    else if (typeof target === 'string') {
      if (target === '#top' || target === '#header') y = 0;
      else {
        var el = null;
        try { el = document.querySelector(target); } catch (e) { return; }
        if (!el) return;
        y = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      }
    } else if (target instanceof Element) {
      y = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    }
    y = Math.max(0, y);
    if (lenis && typeof lenis.scrollTo === 'function') {
      try {
        lenis.scrollTo(y, { duration: duration || 1.4,
          easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
        return;
      } catch (e) {}
    }
    fallbackTo(y, duration || 1.2);
  }
  function initLenis() {
    if (prefersReduced) return false;
    if (typeof window.Lenis === 'undefined') return false;
    try {
      lenis = new window.Lenis({ duration: 1.15, smoothWheel: true,
        wheelMultiplier: 1, touchMultiplier: 1.6,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    } catch (e) { lenis = null; return false; }
    docEl.classList.add('smooth-enabled');
    if (hasGsap && hasST) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      lenis.on('scroll', requestProgress);
    }
    lenis.on('scroll', function () {
      requestProgress();
      if (scrollTopBtn) {
        scrollTopBtn.classList.add('is-scrolling');
        clearTimeout(scrollTopBtn._ssT);
        scrollTopBtn._ssT = setTimeout(function () {
          scrollTopBtn.classList.remove('is-scrolling');
        }, 140);
      }
    });
    try {
      var obs = new MutationObserver(function () {
        var locked = document.body.classList.contains('mobile-menu-visible') ||
          document.body.classList.contains('search-active');
        try { if (locked) lenis.stop(); else lenis.start(); } catch (e) {}
      });
      obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    } catch (e) {}
    var refresh = function () {
      if (hasST) { try { window.ScrollTrigger.refresh(); } catch (err) {} }
      requestProgress();
    };
    window.addEventListener('load', refresh);
    setTimeout(refresh, 400);
    return true;
  }
  var lenisOn = initLenis();
  if (!lenisOn) docEl.classList.add('smooth-fallback');
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var hash = a.getAttribute('href');
    if (!hash || hash === '#' || hash.length < 2) return;
    var targetEl = null;
    try { targetEl = document.querySelector(hash); } catch (err) { return; }
    if (!targetEl) return;
    e.preventDefault();
    smartTo(targetEl, 1.4);
  }, false);
  function bindTop() {
    var btns = document.querySelectorAll('.scroll-to-target');
    if (!btns.length) return;
    if (window.jQuery) {
      try {
        var $ = window.jQuery;
        $('.scroll-to-target').off('click.ss');
        $('.scroll-to-target').on('click.ss', function (ev) {
          ev.preventDefault();
          var t = $(this).attr('data-target') || 'html';
          if (t === 'html' || t === 'body') smartTo(0, 1.5);
          else smartTo(t, 1.4);
        });
        return;
      } catch (e) {}
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindTop);
  } else bindTop();
  window.addEventListener('load', function () { setTimeout(bindTop, 60); });
  function initFx() {
    if (prefersReduced) return;
    if (!hasGsap || !hasST) return;
    try {
      window.gsap.utils.toArray('[data-reveal-group]').forEach(function (group) {
        var items = group.querySelectorAll('.sec-title, .single-service-box');
        if (!items.length) return;
        window.gsap.fromTo(items, { opacity: 0, y: 34 }, { opacity: 1, y: 0,
          duration: 0.9, ease: 'power3.out', stagger: 0.08,
          scrollTrigger: { trigger: group, start: 'top 85%' } });
      });
    } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFx);
  } else initFx();

  window.addEventListener('scroll', requestProgress, { passive: true });
  requestProgress();
  window.__smoothScroll = {
    scrollTo: smartTo,
    get lenis() { return lenis; },
    get active() { return !!lenis; }
  };
})();
