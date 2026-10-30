// Profile page: the follow box posts as JSON instead of navigating away, and the
// sensitive-content gate closes once the visitor chooses to continue.
const gate = document.getElementById('gate');
if (gate) {
  let seen = false;
  try { seen = sessionStorage.getItem('gate:' + location.pathname) === '1'; } catch (e) { /* storage blocked: ask again */ }
  if (seen) gate.remove();
  else {
    const ok = document.getElementById('gateOk');
    ok.focus();
    ok.addEventListener('click', () => { try { sessionStorage.setItem('gate:' + location.pathname, '1'); } catch (e) { /* ignore */ } gate.remove(); });
  }
}
document.querySelectorAll('[data-follow]').forEach(form => {
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const out = form.querySelector('output'), btn = form.querySelector('button');
    const data = Object.fromEntries(new FormData(form));
    btn.disabled = true; out.textContent = '';
    try {
      const r = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Could not follow');
      form.innerHTML = '<b>You\'re following ✨</b><span>Watch your inbox for what\'s next.</span>';
      if (j.gift && /^https?:\/\//.test(j.gift.url)) {
        const a = document.createElement('a');
        a.href = j.gift.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = '🎁 ' + j.gift.title;
        const s = document.createElement('span'); s.className = 'gift'; s.append('Here is your gift: ', a);
        form.append(s);
      }
    } catch (err) { out.textContent = err.message; btn.disabled = false; }
  });
});

// Gradient mesh background: the blobs lean gently toward the cursor (mouse and trackpad only)
const mesh = document.querySelectorAll('.pbg--mesh span');
if (mesh.length && matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const pull = [[20, 15], [-15, -10], [10, 10]];
  let raf = 0;
  document.addEventListener('mousemove', e => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const x = (e.clientX / innerWidth - 0.5) * 2, y = (e.clientY / innerHeight - 0.5) * 2;
      mesh.forEach((b, i) => { b.style.translate = `${x * pull[i][0]}px ${y * pull[i][1]}px`; });
    });
  });
}
