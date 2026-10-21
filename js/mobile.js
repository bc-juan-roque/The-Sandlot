/* Commerce mobile navigation prototype
   - Option 1 (push down) / Option 2 (floating): body[data-variant]
   - Drill-in menus, accordion (option 1) or independent (option 2) product menu
   - Same routes as desktop: #/<section>  or  #/<section>/<item>
*/
(() => {
  const body = document.body;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const SECTIONS = { commerce: 'Commerce', bigcommerce: 'BigCommerce', feedonomics: 'Feedonomics' };
  const heading = $('[data-page-title]');
  const switchLinks = $$('.m-switch a');

  /* ---- Pages (same rules as desktop) ------------------------------------ */
  const clean = (s) => s.replace(/[✦™]/g, '').replace(/\s+/g, ' ').trim();
  const slugify = (s) => clean(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const titleize = (slug) => slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const sectionOf = (el) => { const t = el.closest('[data-section]'); return t ? t.dataset.section : 'commerce'; };
  const labelOf = (el) => {
    const inner = el.querySelector('.link__label, .m-row__label') || el.querySelector('span');
    return (inner || el).textContent;
  };

  const pages = new Map();
  const register = (section, label, owner, slugOverride) => {
    const key = `${section}/${slugOverride || slugify(label)}`;
    if (!pages.has(key)) pages.set(key, { title: clean(label), owner });
    return key;
  };

  // Which root row "owns" a link: the row that drills into its view, or the row itself
  const drillRowFor = (viewId) => $(`[data-drill="${viewId}"]`);
  $$('.m-head a[href="#"]').forEach((a) => {
    const section = sectionOf(a);
    const label = a.dataset.title || labelOf(a);
    const view = a.closest('.m-view--sub');
    const owner = view ? drillRowFor(view.id) : (a.classList.contains('m-row') ? a : null);
    a.setAttribute('href', `#/${register(section, label, owner, a.dataset.slug)}`);
  });

  /* ---- Menus ------------------------------------------------------------ */
  const menus = {
    commerce: { el: $('#m-commerce-menu'), toggle: $('[data-toggle="commerce"]') },
    bigcommerce: { el: $('#m-bigcommerce-menu'), toggle: $('[data-product="bigcommerce"]') },
    feedonomics: { el: $('#m-feedonomics-menu'), toggle: $('[data-product="feedonomics"]') },
  };
  const isOpen = (k) => menus[k].el.classList.contains('is-open');
  const variant = () => body.dataset.variant;

  function size(el) {
    const views = $('.m-views', el);
    const active = $('.m-view.is-active', el);
    if (views && active) views.style.height = `${active.offsetHeight}px`;
  }
  function resetViews(el) {
    $$('.m-view', el).forEach((v) => v.classList.toggle('is-active', v.classList.contains('m-view--root')));
    size(el);
  }
  function syncScrim() {
    body.classList.toggle('m-scrim-on', variant() === '2' && isOpen('commerce'));
  }

  function open(k) {
    const m = menus[k];
    // Option 1: one menu at a time, the other collapses
    if (variant() === '1') Object.keys(menus).forEach((o) => { if (o !== k && isOpen(o)) close(o); });
    size(m.el);
    m.el.classList.add('is-open');
    m.toggle.setAttribute('aria-expanded', 'true');
    syncScrim();
  }
  function close(k) {
    const m = menus[k];
    if (!isOpen(k)) return;
    m.el.classList.remove('is-open');
    m.toggle.setAttribute('aria-expanded', 'false');
    syncScrim();
    // Back to the top-level list once it has finished collapsing
    setTimeout(() => { if (!isOpen(k)) resetViews(m.el); }, 700);
  }
  const closeAll = () => Object.keys(menus).forEach(close);

  Object.keys(menus).forEach((k) => {
    menus[k].toggle.addEventListener('click', () => (isOpen(k) ? close(k) : open(k)));
  });

  // Drill in / back
  $$('[data-drill]').forEach((row) => row.addEventListener('click', () => {
    const el = row.closest('.m-menu');
    const root = $('.m-view--root', el);
    const target = document.getElementById(row.dataset.drill);
    root.classList.remove('is-active');
    target.classList.add('is-active');
    size(el);
    const back = $('[data-back]', target);
    setTimeout(() => back && back.focus({ preventScroll: true }), 80);
  }));
  $$('[data-back]').forEach((btn) => btn.addEventListener('click', () => {
    const el = btn.closest('.m-menu');
    const drillBtn = $(`[data-drill="${btn.closest('.m-view').id}"]`, el);
    resetViews(el);
    if (drillBtn) setTimeout(() => drillBtn.focus({ preventScroll: true }), 80);
  }));

  // Choosing anything closes the menus (the hash change does the rest)
  $$('.m-menu a').forEach((a) => a.addEventListener('click', () => closeAll()));
  $('[data-scrim]').addEventListener('click', () => close('commerce'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { const k = Object.keys(menus).find(isOpen); if (k) { e.preventDefault(); close(k); menus[k].toggle.focus(); } }
  });
  // If the Commerce bar scrolls out of view, its menu goes with it
  window.addEventListener('scroll', () => {
    if (isOpen('commerce') && menus.commerce.toggle.getBoundingClientRect().bottom <= 0) close('commerce');
  }, { passive: true });
  const resizeAll = () => Object.values(menus).forEach((m) => size(m.el));
  window.addEventListener('resize', resizeAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resizeAll);

  /* ---- Option 1 / Option 2 ---------------------------------------------- */
  const commerceMenu = menus.commerce.el;
  const slots = { 1: $('[data-slot="inline"]'), 2: $('[data-slot="float"]') };
  const variantBtns = $$('.m-switch [data-variant]');

  function setVariant(v, { push = true } = {}) {
    closeAll();
    body.dataset.variant = v;
    slots[v].appendChild(commerceMenu);
    variantBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.variant === v)));
    syncScrim();
    resizeAll();
    if (push) {
      try {
        const u = new URL(location.href);
        u.searchParams.set('v', v);
        history.replaceState(null, '', u);
      } catch (e) { /* file:// or sandboxed: the choice just isn't remembered */ }
    }
  }
  variantBtns.forEach((b) => b.addEventListener('click', () => setVariant(b.dataset.variant)));

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

    closeAll();
    body.dataset.page = section;
    body.dataset.view = slug || 'home';
    if (heading) heading.textContent = title;
    document.title = title;

    $$('.m-row[data-current]').forEach((n) => n.removeAttribute('data-current'));
    if (section !== 'commerce') { const s = drillRowFor('v-solutions'); if (s) s.setAttribute('data-current', ''); }
    if (owner) owner.setAttribute('data-current', '');

    switchLinks.forEach((a) => {
      if (!slug && a.dataset.route === section) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    if (lastHash !== null && lastHash !== location.hash) window.scrollTo({ top: 0, behavior: 'smooth' });
    lastHash = location.hash;
  }
  window.addEventListener('hashchange', route);

  const start = new URLSearchParams(location.search).get('v') === '2' ? '2' : '1';
  setVariant(start, { push: false });
  route();
})();
