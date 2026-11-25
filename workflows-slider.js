/* ============================================================
   supergrowth — Workflows slider (index.html#workflows)
   Arrows, the progress track and the cards all pick a workflow;
   the gradient panel shows its steps and the text beside it explains it.
   Plays through on its own until someone touches it (not with reduced motion).
   ============================================================ */
(function () {
  'use strict';
  var root = document.getElementById('workflows');
  if (!root || !root.classList.contains('wfx')) return;

  // a page can bring its own workflows (realtors.html sets window.WFX_FLOWS before this script)
  var FLOWS = window.WFX_FLOWS || [
    { niche: 'Food', title: 'Sell the full recipe',
      steps: ['Comment “RECIPE”', 'DM with a button to the recipe', 'Pays ₹49', 'Recipe PDF downloads'],
      text: 'Someone comments RECIPE on your reel. The DM goes out with a button, they pay ₹49 and the recipe PDF downloads straight away.' },
    { niche: 'Beauty', title: 'Send your product links',
      steps: ['Comment “LINK”', 'DM with your short link', 'Every tap counted'],
      text: 'Comment LINK and your short link lands in their DMs. You see every tap, so you know which product people actually want.' },
    { niche: 'Fitness', title: 'Give a free plan, grow your list',
      steps: ['Comment “PLAN”', 'Asked to follow first', 'Leaves their email', 'Free 7-day plan'],
      text: 'They comment PLAN, follow you, leave their email and get your free 7-day plan. Your list grows with every reel.' },
    { niche: 'Fashion', title: 'Turn story replies into shoppers',
      steps: ['Replies “SHOP” to your story', 'DM with your bio page', 'Every pick in one place'],
      text: 'Someone replies SHOP to your story and gets your bio page in their DMs, with every pick you have shared in one place.' },
    { niche: 'Education', title: 'Sell your notes and guides',
      steps: ['Comment “NOTES”', 'DM with a button to the notes', 'Pays ₹99', 'Notes download'],
      text: 'Comment NOTES, get a button, pay ₹99, download the notes. It runs the same way for every student, day or night.' },
    { niche: 'Photography', title: 'Sell your preset pack',
      steps: ['Comment “PRESET”', 'DM with a button to the pack', 'Pays what they want, from ₹49', 'Download link unlocks'],
      text: 'They comment PRESET and pay what they want, from ₹49. The download link unlocks the moment they pay.' }
  ];

  var cards = Array.prototype.slice.call(root.querySelectorAll('[data-wfx]'));
  var cardRow = root.querySelector('.wfx__cards');
  var fill = root.querySelector('.wfx__fill'), knob = root.querySelector('.wfx__knob');
  var flow = document.getElementById('wfxFlow'), title = document.getElementById('wfxTitle'), text = document.getElementById('wfxText');
  var prev = root.querySelector('[data-wfx-prev]'), next = root.querySelector('[data-wfx-next]');
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = 0, timer = 0, touched = false;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function go(i, fromUser) {
    cur = (i + FLOWS.length) % FLOWS.length;
    var f = FLOWS[cur];
    cards.forEach(function (c, k) { c.classList.toggle('is-on', k === cur); c.setAttribute('aria-selected', k === cur); });
    var pct = FLOWS.length > 1 ? (cur / (FLOWS.length - 1)) * 100 : 0;
    fill.style.width = pct + '%'; knob.style.left = pct + '%';
    prev.disabled = cur === 0; next.disabled = cur === FLOWS.length - 1;

    flow.innerHTML = f.steps.map(function (s, k) {
      return '<span class="wfx__step" style="--d:' + (k * 90) + 'ms">' + esc(s) + '</span>' +
        (k < f.steps.length - 1 ? '<i class="wfx__down" aria-hidden="true" style="--d:' + (k * 90 + 45) + 'ms">↓</i>' : '');
    }).join('');
    title.innerHTML = '<span>' + esc(f.niche) + ':</span><em>' + esc(f.title) + '</em>';
    text.textContent = f.text;
    root.classList.remove('is-swap'); void root.offsetWidth; root.classList.add('is-swap');

    // keep the chosen card in view when the row scrolls (phones, narrow windows)
    var c = cards[cur];
    if (fromUser && cardRow.scrollWidth > cardRow.clientWidth) {
      var rr = cardRow.getBoundingClientRect(), cr = c.getBoundingClientRect();
      var pad = parseFloat(getComputedStyle(cardRow).paddingLeft) || 0;
      var off = cr.left < rr.left + pad ? cr.left - rr.left - pad : cr.right > rr.right - pad ? cr.right - rr.right + pad : 0;
      if (off) cardRow.scrollBy({ left: off, behavior: still ? 'auto' : 'smooth' });
    }
  }

  function stop() { touched = true; clearInterval(timer); }
  cards.forEach(function (c, k) { c.addEventListener('click', function () { stop(); go(k, true); }); });
  prev.addEventListener('click', function () { stop(); go(cur - 1, true); });
  next.addEventListener('click', function () { stop(); go(cur + 1, true); });
  root.addEventListener('keydown', function (e) {
    if (!e.target.closest || !e.target.closest('.wfx__cards')) return;
    if (e.key === 'ArrowRight') { stop(); go(cur + 1, true); cards[cur].focus(); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { stop(); go(cur - 1, true); cards[cur].focus(); e.preventDefault(); }
  });

  // the progress track itself: tap anywhere on it to jump
  root.querySelector('.wfx__track').addEventListener('click', function (e) {
    var r = this.getBoundingClientRect();
    stop(); go(Math.round(((e.clientX - r.left) / r.width) * (FLOWS.length - 1)), true);
  });

  go(0);

  // play through on its own while it is on screen, until someone uses it
  if (!still && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      clearInterval(timer);
      if (es[0].isIntersecting && !touched) timer = setInterval(function () { go(cur + 1 >= FLOWS.length ? 0 : cur + 1); }, 4500);
    }, { threshold: 0.35 }).observe(root);
  }
})();
