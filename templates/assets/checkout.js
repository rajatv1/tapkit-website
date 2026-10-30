// Product page checkout: slot picker, coupon, price preview, then one of three payment
// paths the server picks — free (straight to the order), Razorpay, or test mode.
(() => {
  const form = document.getElementById('buy');
  if (!form) return;
  const C = window.CHECKOUT;
  const $ = id => document.getElementById(id);
  const err = $('err'), totalEl = $('total'), pay = $('pay');
  const inr = n => '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  let slot = null, coupon = '';

  async function api(path, body) {
    const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Something went wrong');
    return j;
  }

  /* price preview */
  async function refreshTotal() {
    if (form.dataset.free === '1') { totalEl.textContent = ''; return; }
    const amount = $('amount') ? $('amount').value : undefined;
    try {
      const q = await api('/api/checkout/quote', { product_id: C.product, amount, coupon });
      totalEl.innerHTML = q.coupon ? `Total: <s>${inr(q.original)}</s> ${inr(q.amount)} <span class="pill ok">${q.coupon.code} −${inr(q.coupon.off)}</span>` : 'Total: ' + inr(q.amount);
    } catch (e) { totalEl.textContent = ''; }
  }
  if ($('amount')) $('amount').addEventListener('input', refreshTotal);
  if ($('applyCoupon')) $('applyCoupon').addEventListener('click', async () => {
    const code = $('coupon').value.trim(), out = $('couponOut');
    if (!code) return;
    try {
      const q = await api('/api/checkout/quote', { product_id: C.product, amount: $('amount') ? $('amount').value : undefined, coupon: code });
      coupon = code; out.textContent = `Applied — you save ${inr(q.coupon.off)}`; refreshTotal();
    } catch (e) { coupon = ''; out.textContent = e.message; refreshTotal(); }
  });
  refreshTotal();

  /* 1:1 slots */
  const dateEl = $('date');
  if (dateEl) {
    const today = new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
    dateEl.min = today; dateEl.value = today;
    const box = $('slots');
    const fmt = iso => new Date(iso).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' });
    async function load() {
      slot = null; box.innerHTML = '<p>Loading times…</p>';
      try {
        const r = await fetch(`/api/public/slots?product=${encodeURIComponent(C.product)}&date=${dateEl.value}`);
        const { slots } = await r.json();
        box.innerHTML = slots && slots.length ? slots.map(s => `<button type="button" role="radio" aria-checked="false" data-s="${s}">${fmt(s)}</button>`).join('')
          : '<p>No times left on this day — try another date. Times are in IST.</p>';
        box.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
          box.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', 'false'));
          b.setAttribute('aria-checked', 'true'); slot = b.dataset.s;
        }));
      } catch (e) { box.innerHTML = '<p>Could not load times.</p>'; }
    }
    dateEl.addEventListener('change', load); load();
  }

  /* pay */
  form.addEventListener('submit', async e => {
    e.preventDefault(); err.textContent = '';
    if (!form.reportValidity()) return;
    if (dateEl && !slot) { err.textContent = 'Pick a time first.'; return; }
    const answers = {};
    form.querySelectorAll('[name^="q_"]').forEach(el => { answers[el.name.slice(2)] = el.value; });
    pay.disabled = true;
    try {
      const r = await api('/api/checkout/start', { product_id: C.product, name: $('name').value, email: $('email').value, phone: $('phone').value,
        amount: $('amount') ? $('amount').value : undefined, coupon, slot, answers });
      if (r.mode === 'free') { location.href = r.access_url; return; }
      if (r.mode === 'test') return testPay(r);
      if (r.mode === 'razorpay') return razorpay(r);
    } catch (x) { err.textContent = x.message; pay.disabled = false; }
  });

  function testPay(r) {
    const m = $('testpay');
    $('testAmt').textContent = inr(r.amount);
    m.hidden = false; $('testOk').focus();
    $('testCancel').onclick = () => { m.hidden = true; pay.disabled = false; };
    $('testOk').onclick = async () => {
      $('testOk').disabled = true;
      try { const j = await api('/api/checkout/test-pay', { order_id: r.order_id }); location.href = j.access_url; }
      catch (x) { m.hidden = true; err.textContent = x.message; pay.disabled = false; $('testOk').disabled = false; }
    };
  }

  function razorpay(r) {
    if (!window.Razorpay) { err.textContent = 'The payment window could not load. Check your connection and try again.'; pay.disabled = false; return; }
    const rz = new window.Razorpay({
      key: r.razorpay.key, order_id: r.razorpay.order_id, amount: r.razorpay.amount, currency: r.razorpay.currency,
      name: r.razorpay.name, description: r.razorpay.description, prefill: r.razorpay.prefill,
      handler: async resp => {
        try { const j = await api('/api/checkout/verify', { order_id: r.order_id, ...resp }); location.href = j.access_url; }
        catch (x) { err.textContent = x.message + ' — if money was taken, it will show on your order page shortly.'; }
      },
      modal: { ondismiss: () => { pay.disabled = false; } }
    });
    rz.on('payment.failed', resp => { err.textContent = (resp.error && resp.error.description) || 'Payment failed'; pay.disabled = false; });
    rz.open();
  }
})();
