/* Review-shell bridge. Only active when a prototype page is loaded inside index.html.
   Talks to the shell with postMessage (works over http and file://). */
(() => {
  if (window.parent === window) return;
  const root = document.documentElement;
  const post = (m) => window.parent.postMessage(Object.assign({ src: 'nav-proto' }, m), '*');

  root.classList.add('is-embedded');
  const st = document.createElement('style');
  st.textContent = '.is-embedded .proto-switch,.is-embedded .m-switch{display:none!important}' +
    '.is-embedded.hide-page .page,.is-embedded.hide-page .m-page{visibility:hidden}';
  document.head.appendChild(st);

  window.addEventListener('message', (e) => {
    if (e.source !== window.parent) return;
    const d = e.data;
    if (!d || d.src !== 'nav-proto') return;
    switch (d.type) {
      case 'go': if (typeof d.hash === 'string') location.hash = d.hash; break;
      case 'back': history.back(); break;
      case 'forward': history.forward(); break;
      case 'variant': if (window.__navSetVariant) window.__navSetVariant(d.v); break;
      case 'vars': Object.entries(d.vars || {}).forEach(([k, v]) => root.style.setProperty(k, v)); break;
      case 'page': root.classList.toggle('hide-page', d.show === false); break;
    }
  });

  // The page lives in a srcdoc frame, where a plain "#/..." link resolves against the shell's URL and
  // would load the shell inside the frame. Handle in-page links here instead.
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    const h = a.getAttribute('href');
    if (h && h.length > 1) location.hash = h;
  });

  window.addEventListener('hashchange', () => post({ type: 'route', hash: location.hash }));
  post({ type: 'ready', hash: location.hash });
})();
