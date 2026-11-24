/* ============================================================
   supergrowth — "How supergrowth compares" (index.html#compare)
   One table: supergrowth and the other tools side by side, in groups.
   Values: 'yes' | 'no' | 'paid' (paid plans only) | any short text.
   A fact that was not confirmed on a tool's own site shows as a dash,
   so only facts that were checked are ever stated. Keep CHECKED current.
   ============================================================ */
(function () {
  'use strict';
  var head = document.getElementById('cmp3Head'), body = document.getElementById('cmp3Body');
  if (!head || !body) return;

  var CHECKED = 'October 2026';   // when the competitor facts below were last checked, from their own sites

  var GROUPS = [
    { title: 'Your page', rows: [['free', 'Free plan'], ['templates', 'Ready-made templates'], ['links', 'Short links with tap counts'], ['profile_card', 'Profile card: your reach for brands, live from Instagram']] },
    { title: 'Auto-DMs', rows: [['dm_comment', 'Auto-DM when someone comments a word'], ['dm_story', 'Auto-DM on story replies']] },
    { title: 'Selling', rows: [['digital', 'Sell files and digital products'], ['locked', 'Pay-to-unlock content'], ['magnet', 'Free download for an email'], ['upi', 'UPI payments'], ['fee', 'Fee on sales (free plan)']] },
    // from realtors.html; the other tools were not checked for these, so they show a dash
    { title: 'For realtors', rows: [['re_plugins', 'Realtor plugins for your bio page'], ['re_listings', 'Your brokerage’s listings on your bio page'], ['re_sync', 'Listings update when a price drops or a home sells'], ['re_offers', 'See commission offers from your brokerage']] }
  ];

  // the columns. supergrowth: what the product does today (prices from pricing.html).
  // The other tools: only values confirmed from their own pages (see CHECKED); anything missing shows as a dash.
  // Sources (checked October 2026): linktr.ee/s/pricing, linktr.ee/help (articles 9758234, 11126119), linktr.ee/features/link-shortener;
  // beacons.ai/i/pricing, help.beacons.ai (4695681, 4703041); stan.store/blog/stan-store-pricing, help.stan.store (13, 109, 217).
  // Left out on purpose: anything their pages did not state clearly (e.g. Linktree's free-plan sales fee, which its pricing
  // page and help centre disagree on; Beacons' link shortener). Later and Shorby are not compared: too little was confirmed.
  var COLS = [
    { name: 'supergrowth', us: true,
      cta: 'Claim your link', href: '#waitlist',
      facts: { profile_card: 'yes', re_plugins: 'yes', free: 'yes', templates: 'yes', links: 'yes', dm_comment: 'yes', dm_story: 'yes', digital: 'yes', locked: 'yes', magnet: 'yes', upi: 'yes', fee: '5%', re_listings: 'yes', re_sync: 'yes', re_offers: 'yes' } },
    { name: 'Linktree',
      facts: { free: 'yes', templates: 'yes', links: 'yes', dm_comment: 'yes', digital: 'paid', upi: 'no' } },
    { name: 'Beacons',
      facts: { free: 'yes', templates: 'yes', dm_comment: 'yes', dm_story: 'yes', digital: 'yes', magnet: 'yes', fee: '9%' } },
    { name: 'Stan Store',
      facts: { free: 'no', templates: 'yes', dm_comment: 'paid', dm_story: 'paid', digital: 'paid', magnet: 'paid', upi: 'no', fee: 'No free plan' } }
  ];

  var YES = '<svg class="cmp3__ico cmp3__ico--yes" viewBox="0 0 20 20" role="img" aria-label="Yes"><circle cx="10" cy="10" r="9"/><path d="M6 10.4l2.6 2.6L14 7.6"/></svg>';
  var NO = '<svg class="cmp3__ico cmp3__ico--no" viewBox="0 0 20 20" role="img" aria-label="No"><circle cx="10" cy="10" r="9"/><path d="M7.4 7.4l5.2 5.2M12.6 7.4l-5.2 5.2"/></svg>';
  function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
  function cell(v) {
    if (v === 'yes') return YES;
    if (v === 'no') return NO;
    if (v === 'paid') return YES;   // on their paid plans; supergrowth Pro is paid too, so it counts as a yes
    if (v == null) return '<span class="cmp3__none" title="Not stated on their site">–</span>';
    return '<span class="cmp3__txt">' + esc(v) + '</span>';
  }

  // header: name (+ badge), and for supergrowth its price and a button
  var th = '<tr><th scope="col" class="cmp3__corner"><span class="sr-only">Feature</span></th>';
  COLS.forEach(function (c) {
    th += '<th scope="col" class="cmp3__col' + (c.us ? ' cmp3__col--us' : '') + '">' +
      '<span class="cmp3__name">' + esc(c.name) + (c.badge ? '<em class="cmp3__badge">' + esc(c.badge) + '</em>' : '') + '</span>' +
      (c.price ? '<span class="cmp3__price"><b>' + esc(c.price) + '</b><i>' + esc(c.per) + '</i></span>' : '') +
      (c.cta ? '<a class="cmp3__btn" href="' + c.href + '">' + esc(c.cta) + '</a>' : '') +
      '</th>';
  });
  head.innerHTML = th + '</tr>';

  var html = '';
  GROUPS.forEach(function (g) {
    html += '<tr class="cmp3__group"><th scope="rowgroup" colspan="' + (COLS.length + 1) + '">' + esc(g.title) + '</th></tr>';
    g.rows.forEach(function (r, k) {
      html += '<tr class="cmp3__row' + (k === g.rows.length - 1 ? ' is-last' : '') + '"><th scope="row">' + esc(r[1]) + '</th>';
      COLS.forEach(function (c) { html += '<td' + (c.us ? ' class="cmp3__us"' : '') + '>' + cell(c.facts[r[0]]) + '</td>'; });
      html += '</tr>';
    });
  });
  body.innerHTML = html;

  var note = document.getElementById('cmp3Note');
  if (note) note.textContent = (CHECKED ? 'Based on each product’s own website, checked ' + CHECKED + '. A dash means their site did not say. ' : '') + 'Features and prices change; check each site for the latest.';
})();
