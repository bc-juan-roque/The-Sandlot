/* Commerce navigation prototype
   Everything visual lives in CSS. This file handles:
   - click to open / close menus (one at a time)
   - Esc, outside click and scrim click to close
   - keeping wide menus inside the viewport
   - a page for every nav and sub-nav item, titled with the item's label
   Routes look like  #/<section>  or  #/<section>/<item>
   where section is commerce, bigcommerce or feedonomics.
*/
(() => {
  // Review shell: start on the page it asks for
  if (window.__BOOT && window.__BOOT.hash) location.hash = window.__BOOT.hash;

  const body = document.body;
  // Variation 1: click only. Variation 2: once a menu is open, hovering another menu button switches to it.
  // The review shell picks the variation; opened on its own the page is variation 1.
  body.dataset.variant = (window.__BOOT && window.__BOOT.v) === '2' ? '2' : '1';
  window.__navSetVariant = (v) => { close(); body.dataset.variant = v === '2' ? '2' : '1'; };
  const triggers = [...document.querySelectorAll('[data-menu]')];
  const switchLinks = [...document.querySelectorAll('.proto-switch a')];
  const heading = document.querySelector('[data-page-title]');
  const solutionsTrigger = document.querySelector('[data-menu="menu-solutions"]');

  const SECTIONS = { commerce: 'Commerce', bigcommerce: 'BigCommerce', feedonomics: 'Feedonomics' };

  /* ---- Page registry ---------------------------------------------------- */
  const clean = (s) => s.replace(/[✦™]/g, '').replace(/\s+/g, ' ').trim();
  const slugify = (s) => clean(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const titleize = (slug) => slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const sectionOf = (el) => {
    const tagged = el.closest('[data-section]');
    if (tagged) return tagged.dataset.section;
    const sub = el.closest('.sub-bar');
    return sub ? sub.dataset.brand : 'commerce';
  };
  const labelOf = (el) => {
    const inner = el.querySelector('.link__label, .nav-item__label') || el.querySelector('span');
    return (inner || el).textContent;
  };

  /* key ("section/slug") -> { title, owner }.  owner is the top-level nav item
     that "contains" the page, so it can be marked as current. */
  const pages = new Map();
  const register = (section, label, owner, slugOverride) => {
    const key = `${section}/${slugOverride || slugify(label)}`;
    const existing = pages.get(key);
    if (!existing) pages.set(key, { title: clean(label), owner });
    // Prefer the more specific parent: a sub bar item over the Commerce bar's Solutions
    else if (owner && owner !== solutionsTrigger && (!existing.owner || existing.owner === solutionsTrigger)) existing.owner = owner;
    return key;
  };

  // Menu triggers (Solutions, Learning, Product Features...) get hub pages too
  triggers.forEach((t) => register(sectionOf(t), labelOf(t), t));

  // Every placeholder link becomes a real route
  document.querySelectorAll('.commerce-bar a[href="#"], .sub-bar a[href="#"], #contact-modal a[href="#"]').forEach((a) => {
    const section = sectionOf(a);
    const label = a.dataset.title || labelOf(a);
    const menu = a.closest('.menu');
    const owner = menu
      ? document.querySelector(`[data-menu="${menu.id}"]`)
      : (a.classList.contains('nav-item') ? a : null);
    const key = register(section, label, owner, a.dataset.slug);
    a.setAttribute('href', `#/${key}`);
  });

  /* Links go medium weight on hover, which is slightly wider. Reserve that width up
     front so nothing in a menu shifts, grows or reflows when you hover. */
  function lockLabelWidths() {
    const labels = [...document.querySelectorAll('.menu .link__label')];
    labels.forEach((l) => { l.style.minWidth = ''; });
    // measure everything first, then write, so we don't thrash layout
    const widths = labels.map((l) => {
      l.style.fontWeight = 'var(--w-medium)';
      const w = l.getBoundingClientRect().width;
      l.style.fontWeight = '';
      return w;
    });
    labels.forEach((l, i) => { l.style.minWidth = `${Math.ceil(widths[i])}px`; });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(lockLabelWidths);
  lockLabelWidths();

  /* ---- Menus ------------------------------------------------------------ */
  let openTrigger = null;
  const panelOf = (t) => document.getElementById(t.dataset.menu);

  /* Keep a menu at least 32px from either edge of the viewport.
     Position is read from layout (offsetLeft / offsetWidth), not from getBoundingClientRect, so a
     transform or transition that is still running, or the previous shift, can't throw it off. */
  function fit(panel) {
    // Commerce bar menus line up with their nav item (same 10px overhang as the Solution bar menus)
    if (panel.classList.contains('menu--end')) {
      const trigger = document.querySelector(`[data-menu="${panel.id}"]`);
      const bar = panel.offsetParent;
      if (trigger && bar) {
        panel.style.setProperty('--left', `${Math.round(trigger.getBoundingClientRect().left - bar.getBoundingClientRect().left - 10)}px`);
      }
    }
    const parent = panel.offsetParent;
    const left = (parent ? parent.getBoundingClientRect().left : 0) + panel.offsetLeft;
    const right = left + panel.offsetWidth;
    const vw = document.documentElement.clientWidth;
    const margin = 32;
    let shift = 0;
    if (right > vw - margin) shift = vw - margin - right;
    if (left + shift < margin) shift = margin - left;
    panel.style.setProperty('--shift', `${Math.round(shift)}px`);
    fitHeight(panel);
  }

  /* Keep a menu 24px clear of the bottom of the window. If it is taller than that
     it scrolls inside itself, so the last item can always be reached. */
  function fitHeight(panel) {
    const parent = panel.offsetParent;
    const top = (parent ? parent.getBoundingClientRect().top : 0) + panel.offsetTop;
    const room = Math.floor(window.innerHeight - top - 24);
    panel.style.setProperty('--max-h', `${Math.max(160, room)}px`);
  }

  function close({ restoreFocus = false } = {}) {
    if (!openTrigger) return;
    const t = openTrigger;
    openTrigger = null;
    t.setAttribute('aria-expanded', 'false');
    panelOf(t).classList.remove('is-open');
    body.classList.remove('menu-open');
    if (restoreFocus) t.focus();
  }

  const cssNum = (name, fallback) => {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
    return Number.isNaN(v) ? fallback : v;
  };
  // Change a property with no transition (set, force a reflow, hand transitions back)
  const instantly = (el, fn) => { el.style.transition = 'none'; fn(); void el.offsetWidth; el.style.transition = ''; };
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Variation 2: moving between two open menus. The dropdown itself glides and resizes from the
     old menu's box to the new one's, while the old contents fade out toward where you came from
     and the new contents fade in from the direction you are heading. */
  function morphSwitch(prev, trigger, panel) {
    const prevPanel = panelOf(prev);
    const dx = Math.sign(trigger.getBoundingClientRect().left - prev.getBoundingClientRect().left) || 1;
    const dist = cssNum('--switch-slide', 18);
    const morph = cssNum('--switch-morph', 420);
    const out = cssNum('--switch-out', 0.14) * 1000;

    const from = prevPanel.getBoundingClientRect();            // where the dropdown is now

    // The glide brings its own motion, so the usual rise-in of each column is switched off for this open
    // (and stays off until the menu closes, so it can't restart afterwards and nudge the type)
    panel.classList.add('no-rise');

    // Menus in the Commerce bar paint above menus in the Solution bar. Going down into a Solution bar menu, lift
    // that bar for the length of the glide so the old menu's fading contents can't show over the new one.
    const lift = !!prevPanel.closest('.commerce-bar') && !prevPanel.closest('.sub-bar') && !!panel.closest('.sub-bar');
    if (lift) body.classList.add('morph-lift');

    // Put the new menu in its resting open state to find out where and how big it is
    panel.style.transition = 'none';
    fit(panel);
    panel.classList.add('is-open');
    const to = panel.getBoundingClientRect();
    const shift = parseFloat(panel.style.getPropertyValue('--shift')) || 0;
    void panel.offsetWidth;

    // Old menu: its box disappears (the new menu's box takes over from the same spot), its contents fade out
    prev.setAttribute('aria-expanded', 'false');
    prevPanel.classList.add('is-morph-out');
    const prevCols = prevPanel.querySelector('.menu__cols');
    const fadeOut = prevCols.animate(
      [{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: `translateX(${-dx * dist}px)` }],
      { duration: out, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' }
    );
    // The old box follows the new one (clipping its contents) so nothing is left hanging outside it
    const m = new DOMMatrix(getComputedStyle(prevPanel).transform);
    prevPanel.style.overflow = 'hidden';
    const ease = 'cubic-bezier(.22, 1, .36, 1)';
    const prevBox = prevPanel.animate([
      { transform: `translate(${m.e}px, ${m.f}px)`, width: `${from.width}px`, height: `${from.height}px` },
      { transform: `translate(${m.e + to.left - from.left}px, ${m.f + to.top - from.top}px)`, width: `${to.width}px`, height: `${to.height}px` },
    ], { duration: morph, easing: ease, fill: 'forwards' });
    setTimeout(() => {
      if (openTrigger === prev) return;                        // it was reopened in the meantime
      instantly(prevPanel, () => {
        prevPanel.classList.remove('is-open', 'is-morph-out');
        prevPanel.style.overflow = '';
      });
      fadeOut.cancel();
      prevBox.cancel();
    }, out + 30);

    // New menu: glide and resize from the old box, with its contents fading in from the side
    panel.style.zIndex = '81';
    panel.style.overflow = 'hidden';
    const box = panel.animate([
      { transform: `translate(${shift + from.left - to.left}px, ${from.top - to.top}px)`, width: `${from.width}px`, height: `${from.height}px` },
      { transform: `translate(${shift}px, 0px)`, width: `${to.width}px`, height: `${to.height}px` },
    ], { duration: morph, easing: ease });
    // The columns fade in from the side. The gray side panel (card) does not slide: it fades in smoothly while the
    // box arrives, so it never flashes on.
    const cols = panel.querySelector('.menu__cols');
    const fadeIn = [...cols.children].map((el) => (el.classList.contains('card')
      ? el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: morph * 0.8, delay: morph * 0.2, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'backwards' })
      : el.animate(
        [{ opacity: 0, transform: `translateX(${dx * dist}px)` }, { opacity: 1, transform: 'translateX(0)' }],
        { duration: morph * 0.75, delay: out * 0.45, easing: ease, fill: 'backwards' }
      )));
    const done = () => {
      panel.style.overflow = '';
      panel.style.zIndex = '';
      panel.style.transition = '';
      body.classList.remove('morph-lift');
    };
    box.addEventListener('finish', done);
    box.addEventListener('cancel', done);
    setTimeout(done, morph + 80);     // in case the finish event never arrives (background tab)
    void fadeIn;
  }

  function open(trigger, { focusFirst = false } = {}) {
    if (openTrigger === trigger) return;
    const prev = openTrigger;
    const panel = panelOf(trigger);

    // If this menu was only just handed over from and is still fading, bring it fully back
    panel.classList.remove('is-morph-out');
    panel.style.overflow = '';
    panel.getAnimations().forEach((a) => a.cancel());
    panel.querySelector('.menu__cols').getAnimations().forEach((a) => a.cancel());

    trigger.setAttribute('aria-expanded', 'true');
    if (prev && body.dataset.variant === '2' && !reduceMotion() && panel.animate) {
      morphSwitch(prev, trigger, panel);
    } else {
      panel.classList.remove('no-rise');
      // Variation 1: a plain cross-fade between the two menus
      if (prev) {
        prev.setAttribute('aria-expanded', 'false');
        panelOf(prev).classList.remove('is-open');
      }
      fit(panel);
      panel.classList.add('is-open');
    }
    body.classList.add('menu-open');
    openTrigger = trigger;
    if (focusFirst) {
      const first = panel.querySelector('a, button');
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 60);
    }
  }

  /* Variation 2: menus open on hover. Hovering a button opens its menu (after a short hover intent),
     hovering another button glides to that one, and leaving the buttons and the menu closes it after a
     short grace period, long enough to cross the gap between a button and its menu. */
  const hoverMode = (e) => body.dataset.variant === '2' && e.pointerType !== 'touch';
  let hoverTimer = null;
  let closeTimer = null;
  const keepOpen = () => clearTimeout(closeTimer);
  const scheduleClose = () => {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => { if (openTrigger) close(); }, cssNum('--hover-close', 200));
  };
  triggers.forEach((t) => {
    t.addEventListener('pointerenter', (e) => {
      if (!hoverMode(e)) return;
      keepOpen();
      if (openTrigger === t) return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => { if (openTrigger !== t) open(t); }, cssNum('--hover-delay', 90));
    });
    t.addEventListener('pointerleave', (e) => {
      clearTimeout(hoverTimer);
      if (hoverMode(e)) scheduleClose();
    });
  });
  document.querySelectorAll('.menu').forEach((m) => {
    m.addEventListener('pointerenter', (e) => { if (hoverMode(e)) keepOpen(); });
    m.addEventListener('pointerleave', (e) => { if (hoverMode(e)) scheduleClose(); });
  });

  triggers.forEach((t) => {
    t.addEventListener('click', (e) => {
      e.preventDefault();
      clearTimeout(hoverTimer);
      // Variation 2: with a mouse the menu is already open from hovering, so a click keeps it open
      if (openTrigger === t && body.dataset.variant === '2' && e.pointerType === 'mouse') return;
      if (openTrigger === t) { close(); return; }
      // detail === 0 means the click came from the keyboard
      open(t, { focusFirst: e.detail === 0 });
    });
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' && openTrigger !== t) { e.preventDefault(); open(t, { focusFirst: true }); }
    });
  });

  document.addEventListener('click', (e) => {
    if (!openTrigger) return;
    const inside = e.target.closest('.menu') || e.target.closest('[data-menu]');
    if (!inside) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openTrigger) { e.preventDefault(); close({ restoreFocus: true }); }
  });

  /* Choosing something in a menu closes it (the hash change does the rest) */
  document.querySelectorAll('.menu a').forEach((a) => a.addEventListener('click', () => close()));

  /* If the bar that owns the open menu scrolls out of view, close the menu */
  window.addEventListener('scroll', () => {
    if (!openTrigger) return;
    if (openTrigger.getBoundingClientRect().bottom <= 0) { close(); return; }
    fitHeight(panelOf(openTrigger));
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (openTrigger) fit(panelOf(openTrigger));
  });

  /* ---- Routing ---------------------------------------------------------- */
  let lastHash = null;

  function route() {
    const m = /^#\/(commerce|bigcommerce|feedonomics)(?:\/([a-z0-9-]+))?$/.exec(location.hash);
    const section = m ? m[1] : 'commerce';
    const slug = m ? m[2] : null;
    const key = slug ? `${section}/${slug}` : null;

    let title = SECTIONS[section];
    let owner = null;
    if (key) {
      const page = pages.get(key);
      title = page ? page.title : titleize(slug);
      owner = page ? page.owner : null;
    }

    close();
    body.dataset.page = section;
    body.dataset.view = slug || 'home';
    if (heading) heading.textContent = title;
    document.title = title;

    // Mark where we are: Solutions while inside a Solution, plus the item that owns this page
    document.querySelectorAll('.nav-item[data-current]').forEach((n) => n.removeAttribute('data-current'));
    if (section !== 'commerce' && solutionsTrigger) solutionsTrigger.setAttribute('data-current', '');
    if (owner) owner.setAttribute('data-current', '');

    switchLinks.forEach((a) => {
      if (!slug && a.dataset.route === section) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    if (lastHash !== null && lastHash !== location.hash) window.scrollTo({ top: 0, behavior: 'smooth' });
    lastHash = location.hash;
  }

  window.addEventListener('hashchange', route);
  document.addEventListener('modal:open', () => close());
  route();
})();
