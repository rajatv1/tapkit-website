/* ============================================================
   tapkit — the animated loop in "Four tools, one loop" (index.html#loop)
   Comment → DM → your page → paid: the steps light up one after another,
   a dot runs along the line, the small screen shows that step, and the
   tool card that does that step lights up below. Tapping a step jumps
   there and pauses the loop for a moment. It only runs while on screen,
   and not at all with reduced motion.
   ============================================================ */
(function () {
  'use strict';
  var root = document.getElementById('loop');
  if (!root) return;
  var steps = Array.prototype.slice.call(root.querySelectorAll('[data-step]'));
  var scenes = Array.prototype.slice.call(root.querySelectorAll('[data-scene]'));
  var line = root.querySelector('.loop__line');
  // which tool card does each step: SuperDM listens and sends, the bio page and links catch them, products get paid
  var CARDS = [['tool-superdm'], ['tool-superdm'], ['tool-page', 'tool-links'], ['tool-products']];
  var STEP_MS = 2600, PAUSE_MS = 8000;
  var cur = 0, timer = 0, resumeAt = 0, visible = false;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function go(i) {
    cur = (i + steps.length) % steps.length;
    steps.forEach(function (b, k) { b.setAttribute('aria-selected', k === cur); b.classList.toggle('is-done', k < cur); });
    scenes.forEach(function (s, k) { s.hidden = k !== cur; });
    line.style.setProperty('--p', cur / (steps.length - 1));
    document.querySelectorAll('.tools .feat').forEach(function (c) { c.classList.toggle('is-lit', CARDS[cur].indexOf(c.id) > -1); });
  }
  function tick() {
    timer = 0;
    if (Date.now() >= resumeAt) go(cur + 1);
    schedule();
  }
  function schedule() { if (!timer && visible && !still && !document.hidden) timer = setTimeout(tick, STEP_MS); }
  function stop() { clearTimeout(timer); timer = 0; }

  steps.forEach(function (b, k) {
    b.addEventListener('click', function () { go(k); resumeAt = Date.now() + PAUSE_MS; });
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) schedule(); else stop(); }, { threshold: 0.3 }).observe(root);
  } else { visible = true; }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else schedule(); });
  go(0);
  schedule();
})();
