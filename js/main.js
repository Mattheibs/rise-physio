/* RISE Physio · interactions and motion */
(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Hero intro ---------- */
  $$('[data-hero]').forEach(el => el.style.setProperty('--d', el.dataset.hero));
  const start = () => requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-loaded')));
  const heroImg = $('.hero__img');
  if (heroImg && !heroImg.complete) { heroImg.addEventListener('load', start, { once: true }); setTimeout(start, 900); }
  else start();
  setTimeout(() => root.classList.add('is-ready'), 2600);

  /* ---------- Nav: scrolled state ---------- */
  const nav = $('#top-nav');
  const setNavState = () => { nav.dataset.state = window.scrollY > 80 ? 'scrolled' : 'over'; };

  /* ---------- Nav: sliding active pill + scroll-spy ---------- */
  const links = $$('.nav__link');
  const pill = $('.nav__pill');
  const linksBox = $('.nav__links');
  const movePill = (link) => {
    if (!pill || !link || !linksBox.offsetParent) return;
    pill.style.width = link.offsetWidth + 'px';
    pill.style.transform = `translateX(${link.offsetLeft}px)`;
    pill.classList.add('is-ready');
  };
  const setActive = (id) => {
    const target = links.find(l => l.getAttribute('href') === '#' + id) || links[0];
    links.forEach(l => { const on = l === target; l.classList.toggle('is-active', on); on ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current'); });
    movePill(target);
  };
  setActive('about');
  window.addEventListener('resize', () => movePill($('.nav__link.is-active')));
  document.fonts && document.fonts.ready.then(() => movePill($('.nav__link.is-active')));

  const spyIds = ['about', 'areas', 'alex', 'pricing', 'faqs', 'contact'];
  const spyTargets = spyIds.map(id => document.getElementById(id)).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  spyTargets.forEach(t => spy.observe(t));

  /* ---------- Scroll: nav state + parallax ---------- */
  const eiopImg = $('.eiop__photo-inner img');
  const eiop = $('.eiop');
  let ticking = false;
  const onScroll = () => {
    setNavState();
    if (window.scrollY < window.innerHeight * 0.5) setActive('about');
    if (!reduce) {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.2) root.style.setProperty('--parallax', (y * 0.18).toFixed(1) + 'px');
      if (eiop && eiopImg) {
        const r = eiop.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          const p = (window.innerHeight - r.top) / (window.innerHeight + r.height); // 0..1
          eiopImg.style.transform = `translateY(${((p - 0.5) * -40).toFixed(1)}px) scale(1.06)`;
        }
      }
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const reveals = $$('[data-reveal]');
  // stagger siblings that share a parent
  const groups = new Map();
  reveals.forEach(el => { const p = el.parentElement; if (!groups.has(p)) groups.set(p, []); groups.get(p).push(el); });
  groups.forEach(list => list.forEach((el, i) => el.style.setProperty('--d', Math.min(i, 6))));
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('is-in'));
    $$('.reveal-img').forEach(el => el.classList.add('is-in'));
  } else {
    // Elements hidden with clip-path report no visible area to IntersectionObserver,
    // so clipped images are watched through their (unclipped) parent instead.
    const targets = new Map();
    const watch = el => {
      const obs = el.closest('.carousel__track') || (el.classList.contains('reveal-img') ? el.parentElement : el);
      if (!targets.has(obs)) targets.set(obs, []);
      targets.get(obs).push(el);
    };
    reveals.forEach(watch);
    $$('.reveal-img').filter(el => !el.hasAttribute('data-reveal') && !el.closest('[data-reveal]')).forEach(watch);
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        (targets.get(e.target) || []).forEach(el => el.classList.add('is-in'));
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    targets.forEach((_, obs) => io.observe(obs));
  }

  /* ---------- Collapsibles ---------- */
  const setRegion = (region, open) => { if (!region) return; open ? region.removeAttribute('inert') : region.setAttribute('inert', ''); };

  // Area cards
  $$('.card__toggle').forEach(btn => {
    const region = document.getElementById(btn.getAttribute('aria-controls'));
    const label = btn.querySelector('.card__toggle-label');
    setRegion(region, false);
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      region.classList.toggle('is-open', open);
      setRegion(region, open);
      label.textContent = open ? label.dataset.open : label.dataset.closed;
    });
  });

  // FAQs: one open at a time
  const faqs = $$('.faq');
  const setFaq = (faq, open) => {
    const btn = $('.faq__q', faq);
    faq.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    setRegion($('.faq__a', faq), open);
  };
  faqs.forEach(f => setFaq(f, f.classList.contains('is-open')));
  faqs.forEach(f => $('.faq__q', f).addEventListener('click', () => {
    const willOpen = !f.classList.contains('is-open');
    faqs.forEach(o => setFaq(o, false));
    if (willOpen) setFaq(f, true);
  }));

  // Alex "Read more" (mobile only)
  const alexBtn = $('.alex__toggle');
  const alexBio = $('#alex-bio');
  const mqMobile = window.matchMedia('(max-width: 767.98px)');
  const syncAlex = () => {
    if (!mqMobile.matches) { alexBio.classList.remove('is-open'); alexBio.removeAttribute('inert'); alexBtn.setAttribute('aria-expanded', 'false'); return; }
    setRegion(alexBio, alexBtn.getAttribute('aria-expanded') === 'true');
  };
  alexBtn.addEventListener('click', () => {
    const open = alexBtn.getAttribute('aria-expanded') !== 'true';
    alexBtn.setAttribute('aria-expanded', String(open));
    alexBio.classList.toggle('is-open', open);
    setRegion(alexBio, open);
    const s = alexBtn.querySelector('span');
    s.textContent = open ? s.dataset.open : s.dataset.closed;
  });
  mqMobile.addEventListener('change', syncAlex);
  syncAlex();

  /* ---------- Carousel dots ---------- */
  const track = $('.carousel__track');
  const dots = $$('.carousel__dot');
  const cards = $$('.card', track);
  const setDot = (i) => dots.forEach((d, j) => { d.classList.toggle('is-active', i === j); d.setAttribute('aria-selected', String(i === j)); });
  dots.forEach((d, i) => d.addEventListener('click', () => {
    const pad = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
    track.scrollTo({ left: cards[i].offsetLeft - pad - track.offsetLeft * 0, behavior: reduce ? 'auto' : 'smooth' });
  }));
  let raf = 0;
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const max = track.scrollWidth - track.clientWidth;
      if (max <= 0) return setDot(0);
      if (track.scrollLeft >= max - 4) return setDot(cards.length - 1);
      const x = track.scrollLeft;
      let best = 0, bestD = Infinity;
      cards.forEach((c, i) => { const dd = Math.abs(c.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft) - x); if (dd < bestD) { bestD = dd; best = i; } });
      setDot(best);
    });
  }, { passive: true });

  /* ---------- Mobile menu ---------- */
  const menu = $('#mobile-menu');
  const menuBtn = $('.nav__menu');
  $$('.menu__links a, .menu__actions > *', menu).forEach((el, i) => el.style.setProperty('--i', i));
  let lastFocus = null;
  const openMenu = () => {
    lastFocus = document.activeElement;
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('is-open'));
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
    root.classList.add('menu-open');
    setTimeout(() => $('.menu__close', menu).focus(), 50);
  };
  const closeMenu = (restore = true) => {
    menu.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    root.classList.remove('menu-open');
    setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, reduce ? 0 : 700);
    if (restore && lastFocus) lastFocus.focus();
  };
  menuBtn.addEventListener('click', openMenu);
  $$('[data-close]', menu).forEach(el => el.addEventListener('click', () => closeMenu(el.classList.contains('menu__close'))));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu();
    if (e.key === 'Tab' && menu.classList.contains('is-open')) {
      const f = $$('a, button', menu);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.matchMedia('(min-width: 1200px)').addEventListener('change', (e) => { if (e.matches && menu.classList.contains('is-open')) closeMenu(false); });
})();
