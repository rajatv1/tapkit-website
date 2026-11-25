/* ============================================================
   supergrowth — the layouts gallery (index.html#layouts)
   Tapping a tile opens that page large in a pop-up (look-only, like the
   tiles: ?embed=1&nonav=1), with "Use this layout", which goes to the
   waitlist. The tiles' slow up-and-down scroll is CSS (.lay__frame).
   ============================================================ */
(function () {
  'use strict';
  var box = document.getElementById('laybox');
  if (!box || typeof box.showModal !== 'function') return;
  var demo = document.getElementById('demo');
  // the pages' folder: #demo's data-app on the home page, or the pop-up's own data-app (realtors.html)
  var APP = ((demo && demo.getAttribute('data-app')) || box.getAttribute('data-app') || '').replace(/\/$/, '');
  var LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/;   // same rule as demo.js
  if (LOCAL.test(APP) && !LOCAL.test(location.origin)) return;
  var frame = document.getElementById('layboxFrame');

  function open(btn) {
    var fig = btn.closest('.lay'), who = fig && fig.querySelector('figcaption i');
    document.getElementById('layboxT').textContent = btn.getAttribute('data-name') + ' layout';
    document.getElementById('layboxWho').textContent = who ? who.textContent : '';
    frame.src = APP + btn.getAttribute('data-open') + '/index.html?embed=1&nonav=1';
    box.showModal();
    document.documentElement.classList.add('wl-open');
  }
  function close() {
    if (box.open) box.close();
  }
  box.addEventListener('close', function () { frame.removeAttribute('src'); document.documentElement.classList.remove('wl-open'); });
  document.querySelectorAll('.lay__open').forEach(function (b) { b.addEventListener('click', function () { open(b); }); });
  // closing runs in the capture phase so it happens before "Use this layout" opens the waitlist (script.js)
  box.addEventListener('click', function (e) {
    if (e.target === box || (e.target.closest && e.target.closest('[data-laybox-close]'))) close();
  }, true);
})();
