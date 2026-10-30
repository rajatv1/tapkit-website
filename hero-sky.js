/* ============================================================
   tapkit — animated night sky behind the hero (Three.js)
   A fragment shader draws a dark gradient sky, twinkling stars
   and two layers of drifting clouds lit from below. With
   .hero__sky--light it draws a light grey sky instead, with the
   stars as small dark dots and the clouds as white see-through smoke.
   The CSS gradient on .hero__sky shows whenever WebGL is
   missing or the viewer prefers less motion.
   ============================================================ */
(function () {
  'use strict';

  var host = document.querySelector('.hero__sky');
  if (!host || !window.THREE) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' });
  } catch (e) {
    return; // no WebGL: keep the CSS gradient
  }

  var canvas = renderer.domElement;
  canvas.className = 'hero__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.insertBefore(canvas, host.firstChild);

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  var uniforms = {
    uTime: { value: 0 },
    uRes:  { value: new THREE.Vector2(1, 1) },
    uDpr:  { value: 1 },
    uLight: { value: host.classList.contains('hero__sky--light') ? 1 : 0 }
  };

  var material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: [
      'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }'
    ].join('\n'),
    fragmentShader: [
      'precision highp float;',
      'uniform float uTime;',
      'uniform vec2  uRes;',
      'uniform float uDpr;',
      'uniform float uLight;',

      // value noise + fbm
      'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
      'float noise(vec2 p){',
      '  vec2 i = floor(p), f = fract(p);',
      '  vec2 u = f * f * (3.0 - 2.0 * f);',
      '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),',
      '             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);',
      '}',
      'float fbm(vec2 p){',
      '  float v = 0.0, a = 0.5;',
      '  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);',
      '  for (int i = 0; i < 5; i++){ v += a * noise(p); p = r * p * 2.02 + 3.1; a *= 0.5; }',
      '  return v;',
      '}',

      'void main(){',
      '  vec2 uv = gl_FragCoord.xy / uRes;',                 // 0..1, y up
      '  float aspect = uRes.x / uRes.y;',
      '  vec2 p = vec2(uv.x * aspect, uv.y);',
      '  float t = uTime;',

      // night gradient in tapkit plum (#281A3B): deeper at the top, lighter towards the horizon
      '  vec3 col = mix(vec3(0.170, 0.118, 0.230), vec3(0.075, 0.050, 0.110), smoothstep(0.0, 0.9, uv.y));',
      '  vec2 g = uv - vec2(0.5, -0.08); g.x *= aspect * 0.55;',
      '  float glow = exp(-dot(g, g) * 3.2);',                // light rising from below the horizon
      '  col += vec3(0.50, 0.42, 0.62) * glow * 0.22;   // a soft, greyed lilac light',

      // stars: one chance per 26px cell, twinkling, fading out towards the horizon
      '  vec2 px = gl_FragCoord.xy / uDpr;',
      '  vec2 cid = floor(px / 26.0);',
      '  vec2 f = fract(px / 26.0) - 0.5;',
      '  float h = hash(cid);',
      '  vec2 off = vec2(hash(cid + 7.1), hash(cid + 3.3)) - 0.5;',
      '  float star = step(0.93, h) * smoothstep(0.06, 0.0, length(f - off * 0.7));',
      '  star *= 0.55 + 0.45 * sin(t * (1.2 + h * 2.0) + h * 40.0);',
      '  star *= smoothstep(0.25, 0.85, uv.y);',

      // far clouds: slow, high up
      '  vec2 pf = p * 1.3 + vec2(t * 0.012, 0.0);',
      '  vec2 qf = vec2(fbm(pf + t * 0.01), fbm(pf + vec2(4.7, 2.1)));',
      '  float nf = fbm(pf + 1.6 * qf);',
      '  float df = smoothstep(0.40, 0.74, nf) * smoothstep(0.05, 0.60, uv.y);',

      // near clouds: faster, lower down
      '  vec2 pn = p * 0.9 + vec2(t * 0.028, 0.0) + 11.0;',
      '  vec2 qn = vec2(fbm(pn + t * 0.015), fbm(pn + vec2(5.2, 1.3) - t * 0.01));',
      '  float nn = fbm(pn + 1.8 * qn);',
      '  float nnUp = fbm(pn + vec2(0.0, 0.04) + 1.8 * qn);',
      '  float dn = smoothstep(0.38, 0.72, nn) * (1.0 - smoothstep(0.50, 1.05, uv.y));',

      // clouds lit from below: brighter where density falls off going up
      '  float rim = clamp((nn - nnUp) * 9.0 + 0.35, 0.0, 1.0);',
      '  vec3 cloudDark = vec3(0.120, 0.085, 0.165);',
      '  vec3 cloudLit  = vec3(0.400, 0.345, 0.500);',
      '  vec3 farCol  = mix(cloudDark, cloudLit, 0.26 + glow * 0.5);',
      '  vec3 nearCol = mix(cloudDark, cloudLit, clamp(rim * (0.55 + glow * 1.2), 0.0, 1.0));',

      // light version: pale grey sky, white smoke, dark dots for stars
      '  if (uLight > 0.5) {',
      '    vec3 lc = mix(vec3(0.925, 0.922, 0.930), vec3(0.965, 0.963, 0.968), smoothstep(0.0, 1.0, uv.y));',
      '    lc = mix(lc, vec3(1.0), df * 0.55);',
      '    lc = mix(lc, vec3(1.0), dn * (0.45 + rim * 0.35));',
      '    lc = mix(lc, vec3(0.17, 0.16, 0.19), star * 0.7 * (1.0 - df * 0.6) * (1.0 - dn * 0.7));',
      '    lc += (hash(floor(px) + vec2(17.0, 43.0)) - 0.5) * 0.025;',
      '    gl_FragColor = vec4(lc, 1.0); return;',
      '  }',
      '  col += vec3(1.0, 0.95, 0.88) * star * (1.0 - df) * (1.0 - dn);',
      '  col = mix(col, farCol, df * 0.30);   // clouds kept faint',
      '  col = mix(col, nearCol, dn * 0.38);',

      // soft vignette so the edges settle
      '  float v = smoothstep(1.25, 0.35, length((uv - 0.5) * vec2(aspect * 0.7, 1.0)));',
      '  col *= 0.84 + 0.16 * v;',

      // film grain: fixed per CSS pixel (does not animate), a touch stronger in the shadows
      '  float grain = hash(floor(px) + vec2(17.0, 43.0)) - 0.5;',
      '  float lum = dot(col, vec3(0.299, 0.587, 0.114));',
      '  col += grain * mix(0.085, 0.05, clamp(lum * 2.5, 0.0, 1.0));',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n'),
    depthTest: false,
    depthWrite: false
  });

  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

  var resize = function () {
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * dpr, h * dpr);
    uniforms.uDpr.value = dpr;
  };
  resize();
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
  else window.addEventListener('resize', resize);

  // Only animate while the hero is on screen and the tab is visible.
  var visible = true, raf = 0, last = performance.now(), shown = false;
  var frame = function (now) {
    raf = 0;
    uniforms.uTime.value += Math.min((now - last) / 1000, 0.05);
    last = now;
    renderer.render(scene, camera);
    if (!shown) { shown = true; canvas.classList.add('is-on'); }
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  var start = function () {
    if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); }
  };

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      start();
    }).observe(host);
  }
  document.addEventListener('visibilitychange', start);
  start();
})();
