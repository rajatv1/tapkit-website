/* ============================================================
   tapkit — the live demo in the home page hero (index.html#demo)
   Bio page and Products show the real pages from the tapkit server (data-app on #demo),
   seeded by tapkit-app/server/scripts/seed-demo.js. SuperDM can't run against Instagram here,
   so it is replayed in the page with the same matching rules and messages as the server's
   /api/automations/simulate, using the demo creator's SuperDMs below.
   ============================================================ */
(function () {
  'use strict';
  var root = document.getElementById('demo');
  if (!root) return;
  var APP = (root.getAttribute('data-app') || '').replace(/\/$/, '');
  // a localhost server only from a localhost site: elsewhere Chrome asks visitors for local network access
  var LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/;
  if (LOCAL.test(APP) && !LOCAL.test(location.origin)) APP = '';
  var USER = 'ananya.glows';

  // the demo creator's SuperDMs — keep in step with seed-demo.js
  var AUTOMATIONS = [
    { name: 'Routine reel', where: 'post', keywords: ['routine', 'guide'], public_reply: 'Sent you a DM 📩',
      dm: 'Hey! Here’s my full PM routine 💜 Every step and every product, in one guide.', button: 'Get the guide', product: 'pm-routine' },
    { name: 'Free skin-type checklist', where: 'post', keywords: ['skin', 'quiz'], public_reply: 'Check your DMs ✨',
      dm: 'Here’s my free skin-type checklist 🌿', button: 'Get it free', product: 'skin-type', ask_follow: true, collect_email: true },
    { name: 'Story: shop', where: 'story', keywords: ['shop', 'link'],
      dm: 'Everything I use is on my page 👇', button: 'Open my page', page: true }
  ];
  function match(text, where) {
    var lower = text.toLowerCase(), words = lower.split(/[^a-z0-9#@]+/);
    for (var i = 0; i < AUTOMATIONS.length; i++) {
      var a = AUTOMATIONS[i];
      if (a.where === where && a.keywords.some(function (k) { return words.indexOf(k) > -1 || lower.indexOf(k) > -1; })) return a;
    }
    return null;
  }

  var $ = function (s, el) { return (el || root).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || root).querySelectorAll(s)); };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var timers = [];
  function later(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function clearLater() { timers.forEach(clearTimeout); timers = []; }

  /* ---------- tabs ---------- */
  function show(tab) {
    $$('[data-demo-tab]').forEach(function (b) { var on = b.getAttribute('data-demo-tab') === tab; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
    $$('[data-demo-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-demo-panel') !== tab; });
    if (tab === 'page' && !pageFrame.src) loadPage(curUser);
    if (tab === 'product' && !productFrame.src) loadProduct('pm-routine');
    // SuperDM plays itself while nobody is using it
    if (tab === 'dm') startAuto(); else stopAuto();
  }
  $$('[data-demo-tab]').forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-demo-tab')); }); });

  /* ---------- live pages in the phone ---------- */
  var pageFrame = $('#demoPageFrame'), productFrame = $('#demoProductFrame');
  var online = null;   // null = not checked yet
  function check() {
    if (online !== null) return Promise.resolve(online);
    if (!APP) { online = false; $$('.demo-offline').forEach(function (o) { o.hidden = false; }); return Promise.resolve(online); }
    var ctl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 3000);
    return fetch(APP + '/' + USER, { mode: 'no-cors', cache: 'no-store', signal: ctl && ctl.signal })
      .then(function () { online = true; }, function () { online = false; })
      .then(function () { clearTimeout(t); $$('.demo-offline').forEach(function (o) { o.hidden = online; }); return online; });
  }
  function load(frame, path, urlEl, look) {
    // ?embed=1: the page hides its own scrollbar while it is inside this preview;
    // ?nonav=1 (the Bio page tab): everything reacts to a tap but nothing opens
    check().then(function (ok) { if (ok) frame.src = APP + path + '?embed=1' + (look ? '&nonav=1' : ''); });
    if (urlEl) urlEl.textContent = 'tapkit.in' + path;
  }
  // the demo creators (seed-demo.js) and which page / product each preview is showing
  // the Bio page tab opens on Meera's fitness page; SuperDM and Products stay on Ananya
  var USERS = ['meera.fit', 'ananya.glows', 'kabir.beats'], curUser = 'meera.fit', curProduct = 'pm-routine';
  function loadPage(user) {
    curUser = user;
    load(pageFrame, '/' + user, $('#demoPageUrl'), true);
  }
  function loadProduct(slug) {
    curProduct = slug;
    load(productFrame, '/' + USER + '/p/' + slug, $('#demoProductUrl'));
  }
  // the layouts gallery below the hero: each tile is a creator's page, look-only, loaded once the server answers
  check().then(function (ok) {
    if (ok) $$('[data-lay]', document).forEach(function (f) { f.src = APP + f.getAttribute('data-lay') + '?embed=1&nonav=1'; });
  });

  // "See examples" under the hero sign-up: show the next demo creator's page in the preview
  var seeEx = document.getElementById('seeExamples');
  if (seeEx) seeEx.addEventListener('click', function (e) {
    e.preventDefault();
    var onPage = $('[data-demo-tab="page"]').classList.contains('is-active');
    show('page');
    loadPage(onPage ? USERS[(USERS.indexOf(curUser) + 1) % USERS.length] : curUser);
    if (root.getBoundingClientRect().top > window.innerHeight * 0.6) root.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  $$('[data-demo-retry]').forEach(function (b) { b.addEventListener('click', function () {
    online = null;
    var tab = $('[data-demo-tab].is-active').getAttribute('data-demo-tab');
    if (tab === 'page') loadPage(curUser); else loadProduct(curProduct);
  }); });

  /* ---------- SuperDM ---------- */
  var where = 'post';
  var form = $('#demoComment'), input = $('#demoCommentInput'), list = $('#demoComments'), thread = $('#demoThread');
  var result = $('#demoResult'), tip = result ? result.textContent : '';   // the hint line is optional
  function view(v) { $$('[data-dm-view]').forEach(function (s) { s.hidden = s.getAttribute('data-dm-view') !== v; }); form.hidden = v === 'dm'; }
  function setWhere(w) {
    where = w; clearLater();
    $$('[data-demo-where]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-demo-where') === w); });
    $$('[data-demo-say]').forEach(function (b) { b.hidden = b.getAttribute('data-for') !== w; });
    input.placeholder = w === 'post' ? 'Add a comment for ananya.glows…' : 'Reply to ananya.glows…';
    view(w); say('', tip);
  }
  $$('[data-demo-where]').forEach(function (b) { b.addEventListener('click', function () { setWhere(b.getAttribute('data-demo-where')); }); });
  $$('[data-demo-say]').forEach(function (b) { b.addEventListener('click', function () { input.value = b.textContent; send(); }); });
  form.addEventListener('submit', function (e) { e.preventDefault(); send(); });

  // a comment the way the app lists it: round photo, name, time, the text, then "Reply"
  var count = $('#reelCount');
  function comment(who, text, reply) {
    var li = el('li', 'igc' + (reply ? ' igc--reply' : ''));
    var av = el('span', 'igc__ava', who === 'you' ? 'Y' : who[0].toUpperCase());
    av.style.setProperty('--a', who === 'you' ? '#3b82f6' : '#E8A317');
    var body = el('div');
    body.appendChild(el('b', '', who)); body.appendChild(document.createTextNode(' ')); body.appendChild(el('i', '', 'now'));
    body.appendChild(el('p', '', text)); body.appendChild(el('small', '', 'Reply'));
    li.appendChild(av); li.appendChild(body);
    list.appendChild(li); list.scrollTop = list.scrollHeight;
    if (count) count.textContent = String(Number(count.textContent.replace(/D/g, '')) + 1);
  }
  // the comments sheet slides up from the bottom of the reel
  var sheet = $('#reelSheet');
  function openSheet(noFocus) { if (!sheet) return; sheet.hidden = false; requestAnimationFrame(function () { sheet.classList.add('is-open'); }); if (noFocus !== true) setTimeout(function () { input.focus(); }, 250); }
  function closeSheet() { if (!sheet) return; sheet.classList.remove('is-open'); setTimeout(function () { sheet.hidden = true; }, 220); }
  ['#reelComments', '#reelAsk'].forEach(function (s) { var b = $(s); if (b) b.addEventListener('click', openSheet); });
  var closeBtn = $('#reelClose'); if (closeBtn) closeBtn.addEventListener('click', closeSheet);
  var like = $('#reelLike');
  if (like) like.addEventListener('click', function () { var on = like.getAttribute('aria-pressed') !== 'true'; like.setAttribute('aria-pressed', on); });
  // messages from her sit in a row with her small photo, like the app (the photo shows on the last one of a run)
  function received(node) {
    var row = el('div', 'dmrow'), av = el('span', 'dmrow__ava', 'A');
    row.appendChild(av); row.appendChild(node); thread.appendChild(row); thread.scrollTop = thread.scrollHeight; return node;
  }
  function bubble(cls, text) {
    var m = el('div', cls, text);
    if (cls === 'msg') return received(m);
    thread.appendChild(m); thread.scrollTop = thread.scrollHeight; return m;
  }
  function action(label, onClick, card) {
    var b = el('button', card ? 'msg msg--card dm-btn' : 'dm-btn dm-btn--plain', null); b.type = 'button';
    if (card) { var cov = el('span', 'bio__img' + (card.image ? ' bio__img--photo' : ''), card.image ? '' : card.icon);
      if (card.image) cov.style.backgroundImage = 'url("' + card.image + '")';
      b.appendChild(cov); var d = el('div'); d.appendChild(el('b', '', card.title)); d.appendChild(el('i', '', card.sub)); b.appendChild(d); b.appendChild(el('em', '', label)); }
    else b.textContent = label;
    b.addEventListener('click', onClick); return received(b);
  }
  // the top of a new chat: her photo, name, follower count and "View profile", like the app
  function intro() {
    var box = el('div', 'dmintro');
    box.appendChild(el('span', 'dmintro__ava', 'A')); box.appendChild(el('b', '', 'Ananya Rao'));
    box.appendChild(el('i', '', 'ananya.glows · 48K followers')); box.appendChild(el('span', 'dmintro__btn', 'View profile'));
    thread.appendChild(box);
  }
  function now() { var d = new Date(); return 'Today ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function say(state, text) { if (!result) return; result.className = 'demo__hint' + (state ? ' demo__hint--' + state : ''); result.textContent = text; }

  // image: the cover shown on top of the card in the DM
  var CARDS = { 'pm-routine': { icon: '📄', image: 'assets/dm-guide.png', title: 'My full PM skincare routine', sub: 'PDF guide · ₹99' },
                'skin-type': { icon: '🎁', title: 'Find your skin type', sub: 'Free checklist' } };
  function send() {
    var text = input.value.trim();
    if (!text) { input.focus(); return; }
    input.value = ''; clearLater();
    var a = match(text, where);
    if (where === 'post') comment('you', text);
    if (!a) { say('miss', 'No SuperDM matched “' + text + '”, so nothing is sent. Try one of the words above.'); return; }
    say('hit', 'Matched the SuperDM “' + a.name + '”. Keywords: ' + a.keywords.join(', ') + '.');
    var t = 0;
    if (where === 'post' && a.public_reply) later(t += 700, function () { comment('ananya.glows', a.public_reply, true); });
    later(t += 1100, function () {
      thread.innerHTML = '';
      intro();
      bubble('dm__note', now());
      // what she is answering: your comment, quoted, as the app shows a private reply
      var ctx = el('div', 'dmctx');
      ctx.appendChild(el('span', '', where === 'post' ? 'Replied to your comment' : 'Replied to your story'));
      ctx.appendChild(el('q', '', text));
      received(ctx);
      view('dm');
      if (a.ask_follow) {
        bubble('msg', 'Follow me first so I can send it — tap when done ✅');
        var f = action('I followed you ✅', function () { f.disabled = true; bubble('dm__me', 'Done ✅'); later(600, function () { deliver(a); }); });
      } else later(500, function () { deliver(a); });
    });
  }
  function deliver(a) {
    bubble('msg', a.dm);
    var open = function () { if (a.page) { show('page'); loadPage(USER); } else { show('product'); loadProduct(a.product); } };
    if (a.page) action(a.button + ' ↗', open); else action(a.button, open, CARDS[a.product]);
    if (a.collect_email) later(700, function () {
      bubble('msg', 'Drop your email and I’ll send it there too 💌');
      var f = el('form', 'dm-email'), i = el('input'), b = el('button', '', 'Send');
      i.type = 'email'; i.placeholder = 'you@email.com'; i.setAttribute('aria-label', 'Your email'); b.type = 'submit';
      f.appendChild(i); f.appendChild(b); thread.appendChild(f); thread.scrollTop = thread.scrollHeight;
      f.addEventListener('submit', function (e) { e.preventDefault(); if (!i.value.trim()) return; f.remove(); bubble('dm__me', i.value.trim()); later(500, function () { bubble('msg', 'Got it! It’s on its way 💌 (demo only — nothing was saved)'); }); });
    });
  }
  $('#demoBack').addEventListener('click', function () { view(where); });

  /* ---------- SuperDM autoplay: comment typed → public reply → DM with the guide, fast, on a loop,
     with what it gives the creator popping up on the way. Any tap or key in the demo hands it over. ---------- */
  var dmPanel = $('[data-demo-panel="dm"]'), dmScreen = dmPanel.querySelector('.phone__screen');
  var autoOn = false, autoT = [], startList = list.innerHTML, startCount = count ? count.textContent : '';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function at(ms, fn) { autoT.push(setTimeout(fn, ms)); }
  function badge(text) {
    var b = el('div', 'dmbadge', text); dmScreen.appendChild(b);
    requestAnimationFrame(function () { b.classList.add('is-on'); });
    at(1500, function () { b.classList.remove('is-on'); });
    at(1800, function () { b.remove(); });
  }
  function resetReel() {
    clearLater(); thread.innerHTML = ''; list.innerHTML = startList; if (count) count.textContent = startCount;
    input.value = ''; view('post'); if (sheet) { sheet.classList.remove('is-open'); sheet.hidden = true; }
  }
  function playOnce() {
    if (!autoOn) return;
    resetReel();
    at(500, function () { openSheet(true); });
    var word = 'ROUTINE 🙏', chars = Array.from(word);
    chars.forEach(function (c, i) { at(900 + i * 70, function () { input.value += c; }); });
    var t = 900 + chars.length * 70 + 250;
    at(t, function () { send(); });
    at(t + 2000, function () { badge('⚡ Replied in 0.8 seconds'); });
    at(t + 3700, function () { badge('💬 Every comment gets a DM'); });
    at(t + 5400, function () { badge('🌙 Works 24/7, even while you sleep'); });
    at(t + 7600, playOnce);
  }
  function startAuto() { if (reduce || autoOn) return; autoOn = true; playOnce(); }
  function stopAuto() {
    if (!autoOn) return; autoOn = false; autoT.forEach(clearTimeout); autoT = [];
    $$('.dmbadge', dmScreen).forEach(function (b) { b.remove(); });
  }
  // a real tap or key press inside the demo stops the show and leaves things as they are
  ['pointerdown', 'keydown'].forEach(function (ev) {
    dmPanel.addEventListener(ev, function (e) { if (e.isTrusted && autoOn) { stopAuto(); clearLater(); } }, true);
  });

  setWhere('post');
  show('page');
})();
