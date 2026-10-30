/* ============================================================
   tapkit — "How tapkit compares" (index.html#compare)
   One tab per tool; the table shows tapkit next to it, grouped.
   Values: 'yes' | 'no' | 'paid' (paid plans only) | any short text.
   A feature with no value for a tool is left out of that tool's table,
   so only facts that were checked are ever shown. Keep CHECKED current.
   ============================================================ */
(function () {
  'use strict';
  var tabs = document.querySelector('.cmp2__tabs'), body = document.getElementById('cmp2Body');
  if (!tabs || !body) return;

  var CHECKED = 'October 2026';   // e.g. 'October 2026' — when the competitor facts below were last checked, from their own sites

  var GROUPS = [
    { title: 'Your page', color: '#34d399', rows: [['free', 'Free plan'], ['templates', 'Ready-made templates'], ['links', 'Short links with tap counts']] },
    { title: 'Auto-DMs', color: '#60a5fa', rows: [['dm_comment', 'Auto-DM when someone comments a word'], ['dm_story', 'Auto-DM on story replies']] },
    { title: 'Selling', color: '#c084fc', rows: [['digital', 'Sell files and digital products'], ['locked', 'Pay-to-unlock content'], ['magnet', 'Free download for an email'], ['upi', 'UPI payments'], ['fee', 'Fee on sales (free plan)']] }
  ];

  // tapkit: what the product does today
  var US = { free: 'yes', templates: 'yes', links: 'yes', dm_comment: 'yes', dm_story: 'yes', digital: 'yes', locked: 'yes', magnet: 'yes', upi: 'yes', fee: '5%' };

  // the other tools: only values confirmed from their own pages (see CHECKED); anything not here is not shown
  // Sources (checked October 2026): linktr.ee/s/pricing, linktr.ee/help (articles 9758234, 11126119), linktr.ee/features/link-shortener;
  // beacons.ai/i/pricing, help.beacons.ai (4695681, 4703041); stan.store/blog/stan-store-pricing, help.stan.store (13, 109, 217).
  // Left out on purpose: anything their pages did not state clearly (e.g. Linktree's free-plan sales fee, which its pricing
  // page and help centre disagree on; Beacons' link shortener). Later and Shorby are not compared: too little was confirmed.
  var THEM = [
    { name: 'Linktree', facts: { free: 'yes', templates: 'yes', links: 'yes', dm_comment: 'yes', digital: 'paid', upi: 'no' } },
    { name: 'Beacons', facts: { free: 'yes', templates: 'yes', dm_comment: 'yes', dm_story: 'yes', digital: 'yes', magnet: 'yes', fee: '9%' } },
    { name: 'Stan Store', facts: { free: 'no', templates: 'yes', dm_comment: 'paid', dm_story: 'paid', digital: 'paid', magnet: 'paid', upi: 'no', fee: 'No free plan' } }
  ];

  var TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function pill(v) {
    if (v === 'yes') return '<span class="cmp2__pill cmp2__pill--yes">' + TICK + 'Yes</span>';
    if (v === 'no') return '<span class="cmp2__pill cmp2__pill--no">No</span>';
    if (v === 'paid') return '<span class="cmp2__pill cmp2__pill--paid">Paid plans</span>';
    var s = document.createElement('span'); s.className = 'cmp2__pill cmp2__pill--text'; s.textContent = v; return s.outerHTML;
  }
  function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

  function show(i) {
    var them = THEM[i];
    Array.prototype.forEach.call(tabs.children, function (b, k) { b.setAttribute('aria-selected', k === i); });
    document.getElementById('cmp2Them').textContent = them.name;
    var html = '';
    GROUPS.forEach(function (g) {
      var rows = g.rows.filter(function (r) { return them.facts[r[0]] != null; });
      if (!rows.length) return;
      html += '<tr class="cmp2__group"><td colspan="3"><span style="--g:' + g.color + '"></span>' + esc(g.title) + '</td></tr>';
      rows.forEach(function (r) {
        var a = US[r[0]], b = them.facts[r[0]];
        var pct = function (v) { var m = /^(\d+(?:\.\d+)?)%$/.exec(v || ''); return m ? +m[1] : null; };
        var win = (a === 'yes' && (b === 'no' || b === 'paid')) || (pct(a) != null && pct(b) != null && pct(a) < pct(b));
        html += '<tr class="cmp2__row' + (win ? ' is-win' : '') + '"><td>' + esc(r[1]) + '</td><td>' + pill(a) + '</td><td>' + pill(b) + '</td></tr>';
      });
    });
    body.innerHTML = html || '<tr><td colspan="3" class="cmp2__empty">Comparison coming soon.</td></tr>';
  }

  THEM.forEach(function (t, i) {
    var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.textContent = t.name;
    b.addEventListener('click', function () { show(i); });
    tabs.appendChild(b);
  });
  var note = document.getElementById('cmp2Note');
  if (note) note.textContent = (CHECKED ? 'Based on each product’s own website, checked ' + CHECKED + '. ' : '') + 'Features and prices change; check each site for the latest.';
  show(0);
})();
