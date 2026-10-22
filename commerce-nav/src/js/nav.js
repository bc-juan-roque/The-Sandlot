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
  document.querySelectorAll('.commerce-bar a[href="#"], .sub-bar a[href="#"]').forEach((a) => {
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

  /* Keep a menu at least 32px from either edge of the viewport */
  function fit(panel) {
    panel.style.setProperty('--shift', '0px');
    // Commerce bar menus line up with their nav item (same 10px overhang as the Solution bar menus)
    if (panel.classList.contains('menu--end')) {
      const trigger = document.querySelector(`[data-menu="${panel.id}"]`);
      const bar = panel.offsetParent;
      if (trigger && bar) {
        panel.style.setProperty('--left', `${Math.round(trigger.getBoundingClientRect().left - bar.getBoundingClientRect().left - 10)}px`);
      }
    }
    const r = panel.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const margin = 32;
    let shift = 0;
    if (r.right > vw - margin) shift = vw - margin - r.right;
    if (r.left + shift < margin) shift = margin - r.left;
    panel.style.setProperty('--shift', `${Math.round(shift)}px`);
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

  function open(trigger, { focusFirst = false } = {}) {
    if (openTrigger === trigger) return;
    // Hand over from the previous menu so the two cross-fade
    if (openTrigger) {
      openTrigger.setAttribute('aria-expanded', 'false');
      panelOf(openTrigger).classList.remove('is-open');
    }
    const panel = panelOf(trigger);
    trigger.setAttribute('aria-expanded', 'true');
    fit(panel);
    panel.classList.add('is-open');
    body.classList.add('menu-open');
    openTrigger = trigger;
    if (focusFirst) {
      const first = panel.querySelector('a, button');
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 60);
    }
  }

  triggers.forEach((t) => {
    t.addEventListener('click', (e) => {
      e.preventDefault();
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
    if (openTrigger.getBoundingClientRect().bottom <= 0) close();
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
  route();
})();
