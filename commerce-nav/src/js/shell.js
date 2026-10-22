/* Review shell: picks the prototype (version + variation), mirrors its page into the
   address bar and the URL, and offers review notes and live controls.
   Links look like  #mobile-2/bigcommerce/pricing  (version-variation/page). */
(() => {
  const $ = (s) => document.querySelector(s);
  const frame = $('#frame');
  const stage = $('#stage');

  const DESKTOP_NOTES = [
    ['Menu buttons have no click-through', 'Solutions, Learning, Product Features, Integrations and Resources only open their menu. Their own pages exist (for example #desktop-1/commerce/learning) but nothing links to them. Consider an Overview link at the top of each menu.'],
    ['Customers, Company and Partners are Commerce-bar only', 'On BigCommerce and Feedonomics pages the Commerce bar scrolls away, so these three are reachable only at the top of the page.'],
    ['Teams sits beside Industries', 'Teams (Marketing, Developers, Ecommerce, IT & Security) is an audience grouping inside Capabilities. Confirm it belongs there.'],
    ['Interaction states are proposed', 'Hover, focus-dim and card states for menu items and buttons are not in the design system file yet. Confirm or replace them.'],
  ];

  /* ---- What can be reviewed ------------------------------------------------ */
  const VERSIONS = {
    desktop: {
      label: 'Desktop',
      mode: 'desktop',
      variations: {
        1: {
          status: 'Commerce bar plus a Solution bar for BigCommerce and Feedonomics. Menus open and close on click.',
          notes: DESKTOP_NOTES,
        },
        2: {
          status: 'Menus open on hover and close when the pointer leaves. No page scrim, and the dropdowns have a gray border. Moving to another menu button glides the dropdown across while the contents fade in and out from the sides.',
          notes: [
            ['The dropdown glides between menus', 'The box moves and resizes from the old menu to the new one while the contents fade out and in from the sides, in the manner of Linear. It is built from each menu keeping its own panel, so check the handover mid-way, especially between the widest and narrowest menus.'],
            ['Hover opens and leaving closes', 'There is no click to open. The menu closes about 200ms after the pointer leaves the buttons and the menu, so the pointer can cross the gap. A mouse click on an open button keeps it open. Touch still taps to open and close. Confirm whether keeping click as an option matters.'],
            ['Switching works across both bars', 'Hovering a Solution bar button while a Commerce bar menu is open switches to it, and the other way round.'],
          ].concat(DESKTOP_NOTES),
        },
      },
    },
    mobile: {
      label: 'Mobile',
      mode: 'mobile',
      variations: {
        1: {
          status: 'Push down: the Commerce menu expands under its bar and pushes the product bar down. Opening one menu collapses the other.',
          notes: [
            ['Direct links show chevrons', 'Customers, Company and Partners go straight to a page but carry the same chevron as rows that open a panel, following the sketch. Decide whether a different mark is needed.'],
            ['Solutions is a long panel', 'The Solutions panel with both product trees is roughly 1,900px tall on a phone. Consider collapsing the trees or splitting Products and Capabilities.'],
            ['One menu at a time', 'Opening the product menu closes the Commerce menu, so both can never be compared or reached together.'],
          ],
        },
        2: {
          status: 'Floating: the Commerce menu is a card below the product bar. Opening it hides the product menu. The product menu can then be opened above it and pushes the card down.',
          notes: [
            ['Opening Commerce hides the product menu', 'Opening the Commerce menu collapses the product menu, as in option 1. Opening the product menu does not close the Commerce card; it expands above it and pushes it down. Confirm that asymmetry is wanted.'],
            ['The card moves', 'When the product menu expands, the card is pushed down and may sit mostly below the fold. It scrolls inside itself.'],
            ['Commerce menu needs the top of the page', 'On BigCommerce and Feedonomics pages the Commerce bar scrolls away, so its menu cannot be reopened until the page is back at the top.'],
          ],
        },
      },
    },
  };

  /* ---- Live controls ------------------------------------------------------- */
  // Each control sets CSS variables inside the prototype frame.
  const CONTROLS = [
    { id: 'showPage', label: 'Show in-page placeholder content', type: 'toggle', value: true, group: 'Content' },
    { id: 'tMenu',    label: 'Desktop menu animation',    type: 'range', value: 500,  min: 0, max: 1200, step: 20, unit: 'ms', group: 'Animation', vars: (v) => ({ '--t-menu': `${v / 1000}s` }) },
    { id: 'mDur',     label: 'Mobile menu animation',     type: 'range', value: 600,  min: 0, max: 1200, step: 20, unit: 'ms', group: 'Animation', vars: (v) => ({ '--m-dur': `${v / 1000}s` }) },
    { id: 'hoverClose', label: 'Desktop var 2, menu switch: wait before closing on leave', type: 'range', value: 200, min: 0, max: 600, step: 20, unit: 'ms', group: 'Menu switching', vars: (v) => ({ '--hover-close': `${v}ms` }) },
    { id: 'hoverDelay', label: 'Desktop var 2, hover intent before opening or switching', type: 'range', value: 90, min: 0, max: 400, step: 10, unit: 'ms', group: 'Menu switching', vars: (v) => ({ '--hover-delay': `${v}ms` }) },
    { id: 'morph',    label: 'Desktop var 2, menu switch: glide duration', type: 'range', value: 420, min: 100, max: 1000, step: 20, unit: 'ms', group: 'Menu switching', vars: (v) => ({ '--switch-morph': `${v}ms` }) },
    { id: 'slide',    label: 'Desktop var 2, menu switch: contents slide distance', type: 'range', value: 18, min: 0, max: 60, step: 2, unit: 'px', group: 'Menu switching', vars: (v) => ({ '--switch-slide': `${v}px` }) },
    { id: 'outFade',  label: 'Desktop var 2, menu switch: old contents fade-out', type: 'range', value: 140, min: 0, max: 600, step: 20, unit: 'ms', group: 'Menu switching', vars: (v) => ({ '--switch-out': `${v / 1000}s` }) },
    { id: 'dim',      label: 'Desktop focus: dimmed items', type: 'range', value: 0.4, min: 0, max: 1, step: 0.05, unit: '', group: 'Hover focus', vars: (v) => ({ '--focus-dim': String(v) }) },
    { id: 'activeIn',  label: 'Desktop focus: hovered item fade-in', type: 'range', value: 150, min: 0, max: 600, step: 10, unit: 'ms', group: 'Hover focus', vars: (v) => ({ '--focus-active-time': `${v / 1000}s` }) },
    { id: 'delay',    label: 'Desktop focus: wait before fading back', type: 'range', value: 320, min: 0, max: 1000, step: 20, unit: 'ms', group: 'Hover focus', vars: (v) => ({ '--focus-return-delay': `${v / 1000}s` }) },
    { id: 'back',     label: 'Desktop focus: fade-back time', type: 'range', value: 700, min: 100, max: 2000, step: 50, unit: 'ms', group: 'Hover focus', vars: (v) => ({ '--focus-return-time': `${v / 1000}s` }) },
  ];
  const values = {};
  CONTROLS.forEach((c) => { values[c.id] = c.value; });
  const changed = () => CONTROLS.filter((c) => values[c.id] !== c.value);

  /* ---- State, hash, frame --------------------------------------------------- */
  const state = { ver: 'desktop', vari: '1', inner: '' };   // inner like "/bigcommerce/pricing" or ""

  function parseHash() {
    const m = /^#(desktop|mobile)-(\d)((?:\/[a-z0-9-]+){0,2})$/.exec(location.hash);
    if (!m || !VERSIONS[m[1]].variations[m[2]]) return { ver: 'desktop', vari: '1', inner: '' };
    return { ver: m[1], vari: m[2], inner: m[3] || '' };
  }
  function writeHash() {
    const h = `#${state.ver}-${state.vari}${state.inner}`;
    if (location.hash !== h) history.replaceState(null, '', h);
  }
  const post = (m) => { if (frame.contentWindow) frame.contentWindow.postMessage(Object.assign({ src: 'nav-proto' }, m), '*'); };
  const innerHash = () => `#/${state.inner ? state.inner.slice(1) : 'commerce'}`;
  const sectionOf = () => { const s = (state.inner || '/commerce').split('/')[1]; return s || 'commerce'; };

  function pushControls() {
    const vars = {};
    CONTROLS.forEach((c) => { if (c.vars) Object.assign(vars, c.vars(values[c.id])); });
    post({ type: 'vars', vars });
    post({ type: 'page', show: values.showPage });
  }

  function loadFrame() {
    const v = VERSIONS[state.ver];
    stage.dataset.mode = v.mode;
    // The prototype pages are embedded in this file. The marker tells the page where to start.
    const boot = JSON.stringify({ hash: innerHash(), v: state.vari }).replace(/</g, '\\u003c');
    frame.srcdoc = window.__PAGES[state.ver].replace('<!--BOOT-->', '<scr' + 'ipt>window.__BOOT=' + boot + '</scr' + 'ipt>');
  }

  function render() {
    const v = VERSIONS[state.ver];
    // Version select and variation buttons
    $('#ver').value = state.ver;
    const vari = $('#vari');
    vari.innerHTML = '';
    Object.keys(v.variations).forEach((k) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = k;
      b.dataset.v = k;
      b.className = k === state.vari ? 'on' : '';
      b.addEventListener('click', () => select(state.ver, k));
      vari.appendChild(b);
    });
    // One variation means nothing to switch between, so hide the control
    const many = Object.keys(v.variations).length > 1;
    $('#vari-label').hidden = !many;
    vari.hidden = !many;
    $('#status').textContent = v.variations[state.vari].status;
    renderPages();
    renderNotes();
    document.title = `${v.label} ${state.vari} · Commerce Navigation Prototypes`;
  }
  function renderPages() {
    const sec = sectionOf();
    document.querySelectorAll('#pages button').forEach((b) => b.classList.toggle('on', b.dataset.page === sec));
    $('#path').textContent = state.inner || '/';
  }
  function renderNotes() {
    const v = VERSIONS[state.ver];
    const notes = v.variations[state.vari].notes;
    $('#legend').innerHTML = `<h4>Open for review · ${v.label} ${state.vari}</h4><ol>` +
      notes.map((n, i) => `<li><i>${i + 1}</i><div><b>${n[0]}</b><br><span>${n[1]}</span></div></li>`).join('') + '</ol>';
  }

  function select(ver, vari) {
    const versionChanged = ver !== state.ver;
    const variChanged = vari !== state.vari;
    if (!versionChanged && !variChanged) return;
    if (versionChanged && !VERSIONS[ver].variations[vari]) vari = '1';
    state.ver = ver; state.vari = vari;
    render();
    writeHash();
    if (versionChanged) loadFrame();
    else post({ type: 'variant', v: vari });
  }

  /* ---- Messages from the prototype ----------------------------------------- */
  window.addEventListener('message', (e) => {
    if (e.source !== frame.contentWindow) return;
    const d = e.data;
    if (!d || d.src !== 'nav-proto') return;
    if (d.type === 'ready') pushControls();
    if (d.type === 'ready' || d.type === 'route') {
      const m = /^#\/(commerce|bigcommerce|feedonomics)(\/[a-z0-9-]+)?$/.exec(d.hash || '');
      const inner = !m ? '' : (m[1] === 'commerce' && !m[2] ? '' : `/${m[1]}${m[2] || ''}`);
      if (inner !== state.inner) { state.inner = inner; writeHash(); }
      renderPages();
    }
  });

  /* ---- Wiring ----------------------------------------------------------------- */
  Object.entries(VERSIONS).forEach(([k, v]) => {
    const o = document.createElement('option');
    o.value = k; o.textContent = v.label;
    $('#ver').appendChild(o);
  });
  $('#ver').addEventListener('change', (e) => select(e.target.value, state.vari));
  document.querySelectorAll('#pages button').forEach((b) => b.addEventListener('click', () => {
    post({ type: 'go', hash: `#/${b.dataset.page}` });
  }));
  document.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => post({ type: b.dataset.nav })));
  $('#review').addEventListener('click', (e) => {
    const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(on));
    $('#legend').hidden = !on;
  });
  window.addEventListener('hashchange', () => {
    const p = parseHash();
    if (p.ver !== state.ver || p.vari !== state.vari) {
      state.inner = p.inner;
      select(p.ver, p.vari);
    } else if (p.inner !== state.inner) {
      state.inner = p.inner;
      renderPages();
      post({ type: 'go', hash: innerHash() });
    }
  });

  /* ---- Controls panel --------------------------------------------------------- */
  const panel = $('#acp-panel');
  const tab = $('#acp-tab');
  const body = $('#acp-body');
  const refs = {};
  let group = null;
  CONTROLS.forEach((c) => {
    if (c.group !== group) {
      group = c.group;
      const g = document.createElement('div');
      g.className = 'acp-group';
      g.textContent = group;
      body.appendChild(g);
    }
    const row = document.createElement('div');
    row.className = 'acp-row';
    const id = `acp-${c.id}`;
    const fmt = (v) => (c.type === 'range' ? `${v}${c.unit}` : '');
    row.innerHTML = c.type === 'toggle'
      ? `<div class="acp-line"><label for="${id}">${c.label}</label><input type="checkbox" id="${id}"></div>`
      : `<div class="acp-line"><label for="${id}">${c.label}</label><span class="acp-val" id="${id}-v"></span></div><input type="range" id="${id}" min="${c.min}" max="${c.max}" step="${c.step}">`;
    body.appendChild(row);
    const input = row.querySelector('input');
    refs[c.id] = { input, out: row.querySelector('.acp-val'), fmt };
    input.addEventListener('input', () => {
      values[c.id] = c.type === 'toggle' ? input.checked : Number(input.value);
      sync();
      pushControls();
    });
  });
  function sync() {
    CONTROLS.forEach((c) => {
      const r = refs[c.id];
      if (c.type === 'toggle') r.input.checked = values[c.id];
      else { r.input.value = values[c.id]; r.out.textContent = r.fmt(values[c.id]); }
    });
    const n = changed().length;
    $('#acp-badge').hidden = n === 0;
    $('#acp-badge').textContent = n;
    $('#acp-copy').disabled = n === 0;
    $('#acp-copy').textContent = n === 0 ? 'No changes yet' : 'Copy changes';
    $('#acp-reset').disabled = n === 0;
  }
  function togglePanel(open) {
    panel.hidden = !open;
    tab.setAttribute('aria-expanded', String(open));
  }
  tab.addEventListener('click', () => togglePanel(panel.hidden));
  $('#acp-x').addEventListener('click', () => togglePanel(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) togglePanel(false); });
  $('#acp-reset').addEventListener('click', () => {
    CONTROLS.forEach((c) => { values[c.id] = c.value; });
    sync(); pushControls();
  });
  $('#acp-copy').addEventListener('click', async (e) => {
    const text = changed().map((c) => `${c.label}: ${values[c.id]}${c.unit || ''}  (was ${c.value}${c.unit || ''})`).join('\n');
    const btn = e.currentTarget;
    try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied'; }
    catch (err) { btn.textContent = 'Copy failed'; }
    setTimeout(sync, 1400);
  });

  /* ---- Start ------------------------------------------------------------------ */
  Object.assign(state, parseHash());
  render();
  sync();
  writeHash();
  loadFrame();
})();
