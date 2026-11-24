/* ============================================================
   supergrowth — ASCII swell behind the hero (2D canvas)
   A grid of monospace characters in orange. Three sine waves,
   bent by a slow fourth one, make a rolling ocean swell; each
   cell's height picks a character from a light-to-dense ramp
   and an opacity. The swell is calmer at the top, where the
   headline sits, and heavier towards the bottom.
   Pauses when the hero is off screen or the tab is hidden.
   With prefers-reduced-motion it draws one still frame.
   ============================================================ */
(function () {
  'use strict';

  var host = document.querySelector('.hero__sky');
  if (!host) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'hero__canvas is-on';
  canvas.setAttribute('aria-hidden', 'true');
  host.insertBefore(canvas, host.firstChild);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var light = host.classList.contains('hero__sky--light');
  var RAMP = ' .,:;-~=+*xo#%@';
  var ORANGE = light ? '242,164,138' : '242,164,138';  // #F2A48A, a light tint of the brand orange so the hero text stays readable
  var MAX_A = light ? 0.5 : 0.6;
  var BUCKETS = 8;                                    // opacity steps: one fillStyle change per step
  var CW = 10, CH = 16;                               // cell size in CSS pixels
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cols = 0, rows = 0, dpr = 1, raf = 0, last = 0, t = 0;
  var visible = true;

  // pointer: characters near the cursor rise, get denser and are pushed outward; a click or tap sends a ripple
  var REACH = 150, PUSH = 10;
  var mx = -9999, my = -9999, pull = 0, ripples = [];
  function local(e) { var r = host.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, r: r }; }
  window.addEventListener("pointermove", function (e) {
    var p = local(e);
    if (p.x < 0 || p.y < 0 || p.x > p.r.width || p.y > p.r.height) { mx = my = -9999; return; }
    mx = p.x; my = p.y; start();
  }, { passive: true });
  host.addEventListener("pointerleave", function () { mx = my = -9999; });
  host.addEventListener("pointerdown", function (e) { var p = local(e); ripples.push({ x: p.x, y: p.y, t0: t }); if (ripples.length > 4) ripples.shift(); start(); });

  function size() {
    var r = host.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    cols = Math.ceil(r.width / CW);
    rows = Math.ceil(r.height / CH);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '600 13px ui-monospace, "SF Mono", Menlo, Consolas, monospace';
    ctx.textBaseline = 'top';
    if (still) draw();
  }

  function draw() {
    pull += ((mx > -9000 ? 1 : 0) - pull) * 0.12;     // ease the pointer effect in and out
    ripples = ripples.filter(function (r) { return t - r.t0 < 1.6; });
    ctx.clearRect(0, 0, cols * CW, rows * CH);
    var buckets = [];
    for (var b = 0; b < BUCKETS; b++) buckets.push([]);

    for (var y = 0; y < rows; y++) {
      var depth = y / rows;                           // 0 at the top, 1 at the bottom
      var weight = 0.25 + 0.75 * depth * depth;
      for (var x = 0; x < cols; x++) {
        var bend = 1.6 * Math.sin(y * 0.045 + t * 0.25);
        var h =
          0.50 * Math.sin(x * 0.085 + t * 0.9 + bend) +
          0.32 * Math.sin(x * 0.037 - y * 0.12 + t * 0.55) +
          0.18 * Math.sin((x + y * 1.7) * 0.16 - t * 1.25);
        var v = ((h + 1) / 2) * weight;               // 0..1
        var px = x * CW, py = y * CH;
        if (pull > 0.01 || ripples.length) {
          var dx = px - mx, dy = py - my, d = Math.sqrt(dx * dx + dy * dy);
          if (d < REACH) {
            var k = 1 - d / REACH, e = k * k * pull;
            v = Math.min(1, v + 0.6 * e);
            px += (dx / (d || 1)) * PUSH * e; py += (dy / (d || 1)) * PUSH * e;
          }
          for (var q = 0; q < ripples.length; q++) {
            var rp = ripples[q], age = t - rp.t0, rad = age * 420;
            var rd = Math.abs(Math.sqrt((px - rp.x) * (px - rp.x) + (py - rp.y) * (py - rp.y)) - rad);
            if (rd < 28) v = Math.min(1, v + (1 - rd / 28) * 0.7 * Math.max(0, 1 - age / 1.6));
          }
        }
        if (v < 0.12) continue;
        var ch = RAMP[Math.min(RAMP.length - 1, Math.floor(v * RAMP.length))];
        if (ch === ' ') continue;
        buckets[Math.min(BUCKETS - 1, Math.floor(v * BUCKETS))].push(ch, px, py);
      }
    }

    for (var i = 0; i < BUCKETS; i++) {
      var list = buckets[i];
      if (!list.length) continue;
      ctx.fillStyle = 'rgba(' + ORANGE + ',' + (MAX_A * (0.18 + 0.82 * (i + 1) / BUCKETS)).toFixed(3) + ')';
      for (var j = 0; j < list.length; j += 3) ctx.fillText(list[j], list[j + 1], list[j + 2]);
    }
  }

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    if (now - last > 1000 / 30) {                     // about 30 frames a second is plenty
      t += Math.min(now - last, 100) / 1000;
      last = now;
      draw();
    }
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!still && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  size();
  window.addEventListener('resize', function () { size(); if (!still) draw(); });
  document.addEventListener('visibilitychange', start);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; start(); }).observe(host);
  }
  draw();
  start();
})();
