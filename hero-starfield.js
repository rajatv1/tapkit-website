/* ============================================================
   tapkit — dot-grid starfield behind the home hero (2D canvas)
   A fine grid of dots that slowly breathe in waves; some dots are
   four-point stars that twinkle (the brightest with a soft glow and
   thin cross rays); dots near the pointer are pushed aside and
   brighten, then spring back; now and then a shooting star crosses.
   Dark plum dots on the hero's light background. With reduced
   motion it draws one still frame and stops.
   ============================================================ */
(function () {
  'use strict';

  var host = document.querySelector('.hero__sky--stars');
  if (!host) return;
  var canvas = document.createElement('canvas');
  canvas.className = 'hero__canvas is-on';
  canvas.setAttribute('aria-hidden', 'true');
  host.insertBefore(canvas, host.firstChild);
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var INK = '40,26,59';                 // tapkit plum, #281A3B
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.innerWidth < 768;
  var GAP = small ? 16 : 12, MAX = small ? 1500 : 7000;
  var REACH = 100, PUSH = 14;            // pointer: how far it reaches, how far dots move

  var W = 0, H = 0, dpr = 1, n = 0;
  var bx, by, x, y, vx, vy, kind, size, base, phase, speed, spin, alpha, grow;
  var stars = [];                        // indexes of the dots that are stars
  var shooting = [], nextShot = 3;
  var px = -1e4, py = -1e4, sx = -1e4, sy = -1e4, inside = false;

  function build() {
    W = host.clientWidth; H = host.clientHeight;
    if (!W || !H) return;
    dpr = Math.min(window.devicePixelRatio || 1, small ? 1 : 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    var gap = GAP;
    if ((W / gap) * (H / gap) > MAX) gap = Math.ceil(Math.sqrt(W * H / MAX));
    var cols = Math.floor(W / gap), rows = Math.floor(H / gap);
    var ox = (W - (cols - 1) * gap) / 2, oy = (H - (rows - 1) * gap) / 2;
    n = cols * rows;
    bx = new Float32Array(n); by = new Float32Array(n); x = new Float32Array(n); y = new Float32Array(n);
    vx = new Float32Array(n); vy = new Float32Array(n); kind = new Uint8Array(n); size = new Float32Array(n);
    base = new Float32Array(n); phase = new Float32Array(n); speed = new Float32Array(n); spin = new Float32Array(n);
    alpha = new Float32Array(n); grow = new Float32Array(n);
    stars = [];
    for (var r = 0, i = 0; r < rows; r++) for (var c = 0; c < cols; c++, i++) {
      var k = 0, roll = Math.random();
      if (roll > 0.985) k = 3; else if (roll > 0.955) k = 2; else if (roll > 0.89) k = 1;
      var jitter = k ? gap * 0.8 : 0;
      bx[i] = x[i] = ox + c * gap + (Math.random() - 0.5) * jitter;
      by[i] = y[i] = oy + r * gap + (Math.random() - 0.5) * jitter;
      kind[i] = k;
      size[i] = [1.1, 1.5 + Math.random() * 0.4, 2.1 + Math.random() * 0.8, 3 + Math.random() * 1.4][k];
      base[i] = [0.14 + Math.random() * 0.08, 0.22 + Math.random() * 0.14, 0.38 + Math.random() * 0.22, 0.6 + Math.random() * 0.3][k];
      phase[i] = Math.random() * 6.283;
      speed[i] = k ? 0.5 + Math.random() * 2 : 0;
      spin[i] = Math.random() * 1.57;
      if (k) stars.push(i);
    }
  }

  // a four-point star: eight corners, alternating long and short
  function star(cx, cy, R, rot) {
    ctx.beginPath();
    for (var j = 0; j < 8; j++) {
      var a = rot + j * Math.PI / 4, rr = j % 2 ? R * 0.3 : R;
      j ? ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill();
  }

  var LEVELS = 40, buckets = [];
  for (var b = 0; b <= LEVELS; b++) buckets.push([]);

  function frame(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // the pointer position eases in, and drifts away when the pointer leaves
    sx += ((inside ? px : -1e4) - sx) * (inside ? 0.12 : 0.05);
    sy += ((inside ? py : -1e4) - sy) * (inside ? 0.12 : 0.05);
    var reach2 = REACH * REACH;

    for (var i = 0; i < n; i++) {
      var a = base[i], s = 1, k = kind[i];
      if (!k) a += (Math.sin(bx[i] * 0.012 + by[i] * 0.008 + t * 0.6) * 0.5 + 0.5) * 0.05 + (Math.sin(bx[i] * 0.007 - by[i] * 0.011 + t * 0.4) * 0.5 + 0.5) * 0.04;
      else {
        var f = Math.sin(t * speed[i] + phase[i]) * 0.35 + Math.sin(t * speed[i] * 0.37 + phase[i] * 2.1) * 0.15 + 0.5;
        a *= (k === 3 ? 0.55 : k === 2 ? 0.35 : 0.15) + f * (k === 3 ? 0.45 : k === 2 ? 0.65 : 0.85);
        spin[i] += k === 3 ? 0.003 : k === 2 ? 0.005 : 0.008;
      }
      var tx = bx[i], ty = by[i], dx = bx[i] - sx, dy = by[i] - sy, d2 = dx * dx + dy * dy;
      if (d2 < reach2) {
        var d = Math.sqrt(d2) || 1, e = Math.pow(1 - d / REACH, 3);
        tx += dx / d * PUSH * e; ty += dy / d * PUSH * e;
        a += 0.45 * e; if (k) s += e * 0.6;
      }
      vx[i] = (vx[i] + (tx - x[i]) * 0.15) * 0.75; vy[i] = (vy[i] + (ty - y[i]) * 0.15) * 0.75;
      x[i] += vx[i]; y[i] += vy[i];
      alpha[i] = Math.min(1, a); grow[i] = s;
      if (!k) buckets[Math.round(alpha[i] * LEVELS)].push(i);
    }

    // plain dots: one path per brightness level
    for (var lv = 1; lv <= LEVELS; lv++) {
      var list = buckets[lv]; if (!list.length) continue;
      ctx.fillStyle = 'rgba(' + INK + ',' + (lv / LEVELS) + ')';
      ctx.beginPath();
      for (var j = 0; j < list.length; j++) { var q = list[j]; ctx.moveTo(x[q] + 1.1, y[q]); ctx.arc(x[q], y[q], 1.1, 0, 6.283); }
      ctx.fill(); list.length = 0;
    }
    buckets[0].length = 0;

    // stars, with a glow and cross rays on the bigger ones
    for (var m = 0; m < stars.length; m++) {
      var p = stars[m], al = alpha[p], R = size[p] * grow[p];
      ctx.fillStyle = 'rgba(' + INK + ',' + al + ')';
      star(x[p], y[p], R, spin[p]);
      if (kind[p] >= 2 && !small) {
        var gr = ctx.createRadialGradient(x[p], y[p], R * 0.2, x[p], y[p], R * (kind[p] === 3 ? 4.5 : 3));
        gr.addColorStop(0, 'rgba(' + INK + ',' + al * (kind[p] === 3 ? 0.16 : 0.09) + ')'); gr.addColorStop(1, 'rgba(' + INK + ',0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x[p], y[p], R * 4.5, 0, 6.283); ctx.fill();
        if (kind[p] === 3 && al > 0.4) {
          var L = R * 3.5, cr = Math.cos(spin[p]) * L, sr = Math.sin(spin[p]) * L;
          ctx.strokeStyle = 'rgba(' + INK + ',' + al * 0.2 + ')'; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(x[p] - cr, y[p] - sr); ctx.lineTo(x[p] + cr, y[p] + sr);
          ctx.moveTo(x[p] + sr, y[p] - cr); ctx.lineTo(x[p] - sr, y[p] + cr); ctx.stroke();
        }
      }
    }

    // shooting stars
    if (!still) {
      nextShot -= 1 / 60;
      if (nextShot <= 0) {
        var fromTop = Math.random() < 0.5, ang = fromTop ? 0.47 + Math.random() * 0.63 : 1.88 + Math.random() * 0.94, v = 3 + Math.random() * 3;
        shooting.push({ x: fromTop ? Math.random() * W * 0.6 : W + 5, y: fromTop ? -5 : Math.random() * H * 0.5,
                        vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, life: 1, fade: 0.008 + Math.random() * 0.012, len: 35 + Math.random() * 40 });
        nextShot = 3 + Math.random() * 3;
      }
      for (var z = shooting.length - 1; z >= 0; z--) {
        var o = shooting[z]; o.x += o.vx; o.y += o.vy; o.life -= o.fade;
        if (o.life <= 0 || o.x < -50 || o.x > W + 50 || o.y > H + 50) { shooting.splice(z, 1); continue; }
        var sp = Math.hypot(o.vx, o.vy), tx2 = o.x - o.vx / sp * o.len, ty2 = o.y - o.vy / sp * o.len;
        var lg = ctx.createLinearGradient(tx2, ty2, o.x, o.y);
        lg.addColorStop(0, 'rgba(' + INK + ',0)'); lg.addColorStop(1, 'rgba(' + INK + ',' + o.life * 0.6 + ')');
        ctx.strokeStyle = lg; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(tx2, ty2); ctx.lineTo(o.x, o.y); ctx.stroke();
      }
    }
  }

  build();
  var resizeT;
  var onResize = function () { clearTimeout(resizeT); resizeT = setTimeout(function () { build(); if (still) frame(0); }, 120); };
  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(host); else window.addEventListener('resize', onResize);

  if (still) { frame(0); return; }

  host.addEventListener('pointermove', function (e) { var r = host.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; inside = true; });
  host.addEventListener('pointerleave', function () { inside = false; });

  // only animate while the hero is on screen and the tab is visible
  var visible = true, raf = 0;
  var loop = function (now) { raf = 0; if (n) frame(now / 1000); if (visible && !document.hidden) raf = requestAnimationFrame(loop); };
  var start = function () { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; start(); }).observe(host);
  document.addEventListener('visibilitychange', start);
  start();
})();
