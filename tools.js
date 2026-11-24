// The tools collage: when it scrolls into view the follower count counts up, the chart draws,
// the SuperDM replies arrive one by one, and the product sales pop in.
(function () {
  var sec = document.getElementById('tools');
  if (!sec) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  sec.classList.add('js');

  var num = sec.querySelector('.pcm__num');
  var fmt = function (n) { return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(Math.round(n)); };
  function count() {
    if (!num) return;
    var end = +num.getAttribute('data-count'), t0 = performance.now();
    (function step(t) {
      var k = Math.min(1, (t - t0) / 1600);
      num.textContent = fmt(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  // each card plays when it comes into view, so on a phone (cards stacked) none is passed by empty
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      if (e.target.querySelector('.pcm__num')) count();
      io.unobserve(e.target);
    });
  }, { threshold: 0.35 });
  sec.querySelectorAll('.tool').forEach(function (t) { io.observe(t); });
})();

// The profile card's Creator / Realtor switch: the same card becomes a realtor's trust card.
// Two full-width progress lines on top: the active one fills, then the card flips and the other one fills, on a loop.
// A tap on either line jumps to it and the loop carries on from there. The line only runs while the card is on
// screen (.is-playing); with reduced motion nothing runs and the active line is simply full.
(function () {
  var card = document.getElementById('profileCard');
  if (!card) return;
  var btns = Array.prototype.slice.call(card.querySelectorAll('[data-pcx]'));
  var panes = { creator: card.querySelector('.pcx__card--creator'), realtor: card.querySelector('.pcx__card--realtor') };
  var title = document.getElementById('pcxTitle'), text = document.getElementById('pcxText');
  var COPY = {
    creator: ['Profile card', 'Your reach, audience, past brands and rates on one page for brands. Live from Instagram.'],
    realtor: ['Trust card', 'For realtors: homes sold, reviews, areas and licence on one page, so buyers and sellers trust you before they call.']
  };
  var mode = 'creator';
  function set(m) {
    mode = m; card.setAttribute('data-mode', m);
    btns.forEach(function (b) {
      var on = b.getAttribute('data-pcx') === m;
      b.setAttribute('aria-selected', on);
      // restart the fill on the newly active line
      var bar = b.querySelector('.pcx__bar b'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    });
    Object.keys(panes).forEach(function (k) { panes[k].setAttribute('aria-hidden', k !== m); });
    title.textContent = COPY[m][0]; text.textContent = COPY[m][1];
  }
  btns.forEach(function (b) {
    b.addEventListener('click', function () { set(b.getAttribute('data-pcx')); });
    // when the active line has filled, move on to the other card
    b.querySelector('.pcx__bar b').addEventListener('animationend', function () {
      if (b.getAttribute('aria-selected') === 'true') set(mode === 'creator' ? 'realtor' : 'creator');
    });
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { card.classList.toggle('is-playing', es[0].isIntersecting); }, { threshold: 0.35 }).observe(card);
  } else card.classList.add('is-playing');
})();
