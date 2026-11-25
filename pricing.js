/* ============================================================
   supergrowth — plans and prices (pricing.html, realtors.html)
   One source for every price on the site. Prices are in dollars.
   Markup:  <div data-plans="creators|realtors"></div>          the three plan cards
            <div data-plans-table="creators|realtors"></div>    the "what's in each plan" table
            <div data-plans-tabs></div>                          optional Creators / Realtors switch
                                                                 (switches every [data-plans] and [data-plans-table] on the page)
   ============================================================ */
(function () {
  'use strict';

  var PRICE = {
    free:   { usd: '$0',  per: '/month' },
    pro:    { usd: '$10', per: '/month' },
    annual: { usd: '$99', per: '/year', note: 'About $8.25 a month' }
  };

  var PLANS = {
    creators: {
      label: 'Creators',
      free:   ['Bio page', 'Links with tap counts', 'Shareable profile card', 'Basic analytics', 'Limited products'],
      pro:    ['Everything in Free', 'Advanced SuperDM', 'SuperDM workflows', 'Unlimited products', 'Advanced analytics', 'Customization'],
      soon:   ['Business Connect', 'Brand and agency discovery, plus creator-business workflows.'],
      flag:   'Free for founding creators',
      founding: 'Founding creators on the waitlist get Pro free for their first year.',
      table: [
        ['Bio page', 'yes', 'yes', 'yes'], ['Links with tap counts', 'yes', 'yes', 'yes'], ['Shareable profile card', 'yes', 'yes', 'yes'],
        ['Basic analytics', 'yes', 'yes', 'yes'], ['Products', 'Limited', 'Unlimited', 'Unlimited'], ['Advanced SuperDM', 'no', 'yes', 'yes'],
        ['SuperDM workflows', 'no', 'yes', 'yes'], ['Advanced analytics', 'no', 'yes', 'yes'], ['Customization', 'no', 'yes', 'yes'],
        ['Business Connect', 'no', 'Coming soon', 'Coming soon'], ['Fee per sale', '5%', '5%', '5%']
      ]
    },
    realtors: {
      label: 'Realtors',
      free:   ['Bio page', 'Links with tap counts', 'Shareable profile', 'Basic analytics'],
      pro:    ['Everything in Free', 'Trust card: homes sold, reviews, areas, licence', 'Your brokerage’s listings on your page', 'Price drops and sales update on their own', 'SuperDM for open houses', 'Commission offers from your brokerage', 'Advanced analytics and customization'],
      soon:   null,
      flag:   'Best value',
      founding: 'Brokerages: join the waitlist as a brokerage and we’ll set up your team with you.',
      table: [
        ['Bio page', 'yes', 'yes', 'yes'], ['Links with tap counts', 'yes', 'yes', 'yes'], ['Basic analytics', 'yes', 'yes', 'yes'],
        ['Trust card', 'no', 'yes', 'yes'], ['Your brokerage’s listings on your page', 'no', 'yes', 'yes'],
        ['Price drops and sales update on their own', 'no', 'yes', 'yes'], ['SuperDM for open houses', 'no', 'yes', 'yes'],
        ['Commission offers from your brokerage', 'no', 'yes', 'yes'], ['Advanced analytics', 'no', 'yes', 'yes'], ['Customization', 'no', 'yes', 'yes']
      ]
    }
  };

  var TICK = '<svg class="plx__tick" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9"/><path d="M6 10.4l2.6 2.6L14 7.6"/></svg>';
  function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
  var join = document.body.getAttribute('data-join') || 'index.html#waitlist';

  function card(kind, name, p, items, opts) {
    opts = opts || {};
    return '<div class="plx__card' + (opts.hot ? ' plx__card--hot' : '') + '">' +
      (opts.flag ? '<span class="plx__flag">' + esc(opts.flag) + '</span>' : '') +
      '<b class="plx__name">' + esc(name) + '</b>' +
      '<div class="plx__price"><b>' + esc(p.usd) + '</b><i>' + esc(p.per) + '</i></div>' +
      (p.note ? '<p class="plx__note">' + esc(p.note) + '</p>' : '') +
      '<ul>' + items.map(function (t) { return '<li>' + TICK + '<span>' + esc(t) + '</span></li>'; }).join('') + '</ul>' +
      (opts.soon ? '<div class="plx__soon"><span>Coming soon</span><b>' + esc(opts.soon[0]) + '</b><p>' + esc(opts.soon[1]) + '</p></div>' : '') +
      '<a class="plx__btn' + (opts.hot ? ' plx__btn--hot' : '') + '" href="' + join + '">Join the waitlist</a>' +
      '</div>';
  }

  function plans(aud) {
    var a = PLANS[aud];
    return '<div class="plx__grid">' +
      card('free', 'Free', PRICE.free, a.free) +
      card('pro', 'Pro', PRICE.pro, a.pro, { soon: a.soon }) +
      card('annual', 'Pro Annual', PRICE.annual, ['Everything in Pro', 'Two months free compared with monthly'], { hot: true, flag: a.flag }) +
      '</div><p class="plx__founding"><span>★</span> ' + esc(a.founding) + '</p>';
  }

  function cell(v) {
    if (v === 'yes') return TICK.replace('aria-hidden="true"', 'role="img" aria-label="Included"');
    if (v === 'no') return '<span class="plx__dash" aria-label="Not included">—</span>';
    return esc(v);
  }
  function table(aud) {
    var a = PLANS[aud];
    var head = '<tr><th scope="col"><span class="sr-only">Feature</span></th>' +
      [['Free', PRICE.free], ['Pro', PRICE.pro], ['Pro Annual', PRICE.annual]].map(function (c, i) {
        return '<th scope="col"' + (i === 2 ? ' class="plx__hotcol"' : '') + '>' + c[0] + '<i>' + c[1].usd + c[1].per + '</i></th>';
      }).join('') + '</tr>';
    var rows = a.table.map(function (r) {
      return '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + cell(r[1]) + '</td><td>' + cell(r[2]) + '</td><td>' + cell(r[3]) + '</td></tr>';
    }).join('');
    return '<div class="plx__tablewrap"><table class="plx__table"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>';
  }

  var planEls = Array.prototype.slice.call(document.querySelectorAll('[data-plans]'));
  var tableEls = Array.prototype.slice.call(document.querySelectorAll('[data-plans-table]'));
  function render(aud) {
    planEls.forEach(function (el) { if (el.hasAttribute('data-plans-follow') || !el.getAttribute('data-plans')) el.setAttribute('data-plans', aud); el.innerHTML = plans(el.getAttribute('data-plans')); });
    tableEls.forEach(function (el) { if (el.hasAttribute('data-plans-follow')) el.setAttribute('data-plans-table', aud); el.innerHTML = table(el.getAttribute('data-plans-table')); });
  }

  // the Creators / Realtors switch (pricing.html); remembers the choice in the address (#realtors)
  var tabs = document.querySelector('[data-plans-tabs]');
  var start = /realtor/.test(location.hash) ? 'realtors' : 'creators';
  if (tabs) {
    tabs.setAttribute('role', 'tablist');
    tabs.innerHTML = ['creators', 'realtors'].map(function (k) {
      return '<button type="button" role="tab" data-aud="' + k + '" aria-selected="' + (k === start) + '">For ' + PLANS[k].label.toLowerCase() + '</button>';
    }).join('');
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('[data-aud]'); if (!b) return;
      var k = b.getAttribute('data-aud');
      Array.prototype.forEach.call(tabs.children, function (x) { x.setAttribute('aria-selected', x === b); });
      render(k);
      try { history.replaceState(null, '', k === 'realtors' ? '#realtors' : location.pathname); } catch (err) {}
    });
    planEls.forEach(function (el) { el.setAttribute('data-plans-follow', ''); });
    tableEls.forEach(function (el) { el.setAttribute('data-plans-follow', ''); });
    render(start);
  } else {
    render(null);
  }
})();
