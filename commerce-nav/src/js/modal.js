/* Contact sales modal. Opens from any [data-open-modal] button; closes with the X, the dimmed page,
   Esc, or by choosing a link. Shared by the desktop and mobile prototypes. */
(() => {
  const root = document.getElementById('contact-modal');
  if (!root) return;
  const body = document.body;
  let opener = null;

  const isOpen = () => root.classList.contains('is-open');
  const focusables = () => [...root.querySelectorAll('a[href], button:not([disabled])')];

  function open(from) {
    if (isOpen()) return;
    opener = from || document.activeElement;
    document.dispatchEvent(new CustomEvent('modal:open'));     // menus close themselves
    root.setAttribute('aria-hidden', 'false');
    root.classList.add('is-open');
    body.classList.add('modal-open');
    setTimeout(() => { const f = root.querySelector('.product__head') || root.querySelector('.modal'); f.focus({ preventScroll: true }); }, 80);
  }
  function close(restore = true) {
    if (!isOpen()) return;
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
    if (restore && opener && opener.focus) opener.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-open-modal]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); open(a); }));
  root.querySelectorAll('[data-close-modal]').forEach((el) => el.addEventListener('click', () => close()));
  root.querySelectorAll('a[href]').forEach((a) => a.addEventListener('click', () => close(false)));    // the hash change does the rest
  window.addEventListener('hashchange', () => close(false));

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') {                                       // keep focus inside the modal
      const f = focusables(); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === root.querySelector('.modal'))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, true);
})();
