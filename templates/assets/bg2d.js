// Animated 2D backgrounds for the public page (theme.effect): snow, rain, fireflies, bokeh,
// constellation, meteors, matrix and retro grid. Written for tapkit (the idea list follows the
// shadcn.io background catalogue; none of its code is used). One canvas behind the page, drawn in
// the theme's colours. Visitors who turn off motion get one still frame, and the animation pauses
// while the tab is hidden.
(function () {
  const canvas = document.querySelector('canvas[data-effect2d]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // theme colours, with a fallback to the text colour for any that would vanish into the background
  const css = getComputedStyle(document.documentElement);
  const hex = (name, fallback) => '#' + ((css.getPropertyValue(name).match(/#([0-9a-f]{6})\b/i) || [, fallback])[1]);
  const lum = h => { const n = parseInt(h.slice(1), 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };
  const bg = hex('--bg', 'ffffff'), fg = hex('--fg', '111111');
  const visible = h => (Math.abs(lum(h) - lum(bg)) < 0.2 ? fg : h);
  const C = { a: visible(hex('--accent', '6d4fc2')), b: visible(hex('--accent2', 'c026d3')), fg, dark: lum(bg) < 0.45 };
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  const rnd = (a, b) => a + Math.random() * (b - a);

  let W = 0, H = 0;
  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  fit();

  const EFFECTS = {
    // soft flakes drifting down and swaying
    snow() {
      const flakes = Array.from({ length: 140 }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(1, 3.6), s: rnd(0.3, 1.1), p: rnd(0, 6.3) }));
      const col = C.dark ? '#ffffff' : C.a;
      return (dt, t) => {
        ctx.fillStyle = rgba(col, 0.8);
        for (const f of flakes) {
          f.y += f.s * dt * 0.06; f.x += Math.sin(t * 0.001 + f.p) * 0.3;
          if (f.y > H + 5) { f.y = -5; f.x = rnd(0, W); }
          ctx.globalAlpha = 0.35 + f.r / 6;
          ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
        }
        ctx.globalAlpha = 1;
      };
    },
    // slanted streaks of rain
    rain() {
      const drops = Array.from({ length: 150 }, () => ({ x: rnd(0, W), y: rnd(0, H), l: rnd(10, 22), s: rnd(0.6, 1.2) }));
      return dt => {
        ctx.strokeStyle = rgba(C.a, 0.35); ctx.lineWidth = 1.2; ctx.lineCap = 'round';
        ctx.beginPath();
        for (const d of drops) {
          d.y += d.s * dt * 0.9; d.x -= d.s * dt * 0.15;
          if (d.y > H + 20) { d.y = -20; d.x = rnd(0, W + 100); }
          ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.l * 0.18, d.y - d.l);
        }
        ctx.stroke();
      };
    },
    // glowing specks wandering and pulsing
    fireflies() {
      const flies = Array.from({ length: 45 }, () => ({ x: rnd(0, W), y: rnd(0, H), a: rnd(0, 6.3), v: rnd(0.15, 0.45), p: rnd(0, 6.3), c: Math.random() < 0.7 ? C.a : C.b }));
      return (dt, t) => {
        for (const f of flies) {
          f.a += rnd(-0.08, 0.08); f.x += Math.cos(f.a) * f.v * dt * 0.06; f.y += Math.sin(f.a) * f.v * dt * 0.06;
          if (f.x < -10) f.x = W + 10; if (f.x > W + 10) f.x = -10; if (f.y < -10) f.y = H + 10; if (f.y > H + 10) f.y = -10;
          const glow = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.0015 + f.p));
          const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 14);
          g.addColorStop(0, rgba(f.c, 0.9 * glow)); g.addColorStop(0.25, rgba(f.c, 0.35 * glow)); g.addColorStop(1, rgba(f.c, 0));
          ctx.fillStyle = g; ctx.fillRect(f.x - 14, f.y - 14, 28, 28);
        }
      };
    },
    // big out-of-focus circles of light, drifting slowly
    bokeh() {
      const dots = Array.from({ length: 22 }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(20, 70), vx: rnd(-0.12, 0.12), vy: rnd(-0.18, -0.04), c: Math.random() < 0.5 ? C.a : C.b, o: rnd(0.08, 0.22) }));
      return dt => {
        for (const d of dots) {
          d.x += d.vx * dt * 0.06; d.y += d.vy * dt * 0.06;
          if (d.y < -d.r) { d.y = H + d.r; d.x = rnd(0, W); }
          const g = ctx.createRadialGradient(d.x, d.y, d.r * 0.2, d.x, d.y, d.r);
          g.addColorStop(0, rgba(d.c, d.o)); g.addColorStop(0.85, rgba(d.c, d.o * 0.7)); g.addColorStop(1, rgba(d.c, 0));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
        }
      };
    },
    // drifting points joined by faint lines when they come close
    constellation() {
      const n = Math.round(Math.min(90, (W * H) / 9000));
      const pts = Array.from({ length: n }, () => ({ x: rnd(0, W), y: rnd(0, H), vx: rnd(-0.25, 0.25), vy: rnd(-0.25, 0.25) }));
      const reach = 120;
      return dt => {
        for (const p of pts) {
          p.x += p.vx * dt * 0.06; p.y += p.vy * dt * 0.06;
          if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
        }
        ctx.lineWidth = 1;
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.hypot(dx, dy);
          if (d < reach) { ctx.strokeStyle = rgba(C.a, 0.35 * (1 - d / reach)); ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
        }
        ctx.fillStyle = rgba(C.a, 0.8);
        for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 6.283); ctx.fill(); }
      };
    },
    // still stars, with a meteor streaking across every so often
    meteors() {
      const stars = Array.from({ length: 90 }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(0.4, 1.4), p: rnd(0, 6.3) }));
      const flying = [];
      let next = 0;
      return (dt, t) => {
        for (const s of stars) { ctx.fillStyle = rgba(C.fg, 0.25 + 0.35 * Math.abs(Math.sin(t * 0.001 + s.p))); ctx.fillRect(s.x, s.y, s.r, s.r); }
        if (t > next) { flying.push({ x: rnd(W * 0.2, W * 1.1), y: rnd(-40, H * 0.4), v: rnd(0.5, 0.9), life: 1 }); next = t + rnd(700, 1800); }
        for (let i = flying.length - 1; i >= 0; i--) {
          const m = flying[i];
          m.x -= m.v * dt; m.y += m.v * dt * 0.55; m.life -= dt * 0.0006;
          if (m.life <= 0 || m.x < -150 || m.y > H + 150) { flying.splice(i, 1); continue; }
          const g = ctx.createLinearGradient(m.x, m.y, m.x + 110, m.y - 60);
          g.addColorStop(0, rgba(C.a, 0.9 * m.life)); g.addColorStop(1, rgba(C.a, 0));
          ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x + 110, m.y - 60); ctx.stroke();
        }
      };
    },
    // falling columns of glyphs, brightest at the head
    matrix() {
      const size = 16, gap = 2, cols = Math.ceil(W / (size * gap)), glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789$+-*/<>';
      const heads = Array.from({ length: cols }, () => ({ y: rnd(-H, 0), v: rnd(0.08, 0.2), chars: [] }));
      ctx.font = `${size - 2}px ui-monospace, monospace`;
      return dt => {
        heads.forEach((c, i) => {
          c.y += c.v * dt;
          const row = Math.floor(c.y / size);
          if (row !== c.last) { c.last = row; c.chars.unshift(glyphs[(Math.random() * glyphs.length) | 0]); if (c.chars.length > 18) c.chars.pop(); }
          c.chars.forEach((ch, k) => {
            // kept faint so the page's own text stays easy to read
            ctx.fillStyle = k === 0 ? rgba(C.dark ? '#ffffff' : C.a, 0.5) : rgba(C.a, 0.32 * (1 - k / 18));
            ctx.fillText(ch, i * size * gap, (row - k) * size);
          });
          if ((row - 18) * size > H) { c.y = rnd(-H * 0.5, 0); c.chars = []; }
        });
      };
    },
    // an 80s grid floor rolling toward you under a glowing horizon
    'retro-grid'() {
      return (dt, t) => {
        const hz = H * 0.58, glow = ctx.createLinearGradient(0, hz - 140, 0, hz);
        glow.addColorStop(0, rgba(C.a, 0)); glow.addColorStop(1, rgba(C.a, 0.28));
        ctx.fillStyle = glow; ctx.fillRect(0, hz - 140, W, 140);
        ctx.strokeStyle = rgba(C.a, 0.55); ctx.lineWidth = 1.2;
        ctx.beginPath();
        // lines running away to a vanishing point in the middle of the horizon
        for (let i = -12; i <= 12; i++) { ctx.moveTo(W / 2 + i * 14, hz); ctx.lineTo(W / 2 + i * W * 0.18, H); }
        // lines across, spaced in perspective and rolling forward
        const shift = (t * 0.00035) % 1;
        for (let k = 0; k < 14; k++) { const z = (k + shift) / 14, y = hz + (H - hz) * z * z; ctx.moveTo(0, y); ctx.lineTo(W, y); }
        ctx.stroke();
      };
    },
  };

  const make = EFFECTS[canvas.dataset.effect2d];
  if (!make) return;
  let draw = make();
  window.addEventListener('resize', () => { fit(); draw = make(); });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { draw(16, 4000); return; }
  let last = performance.now(), raf = 0;
  const frame = now => {
    const dt = Math.min(50, now - last); last = now;
    ctx.clearRect(0, 0, W, H);
    draw(dt, now);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
  });
})();
