/* ============================================================
   tapkit — landing page interactions
   ============================================================ */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky nav shadow ---------- */
  var nav = $('#nav');
  var onScroll = function () {
    nav.classList.toggle('is-stuck', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = $('#burger');
  var mobileMenu = $('#mobileMenu');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open);
    });
    $$('a', mobileMenu).forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Product dropdown: hover on desktop, tap to open on touch ---------- */
  var productMenu = $('#productMenu');
  if (productMenu) {
    var productBtn = $('button', productMenu);
    var setOpen = function (open) {
      productMenu.classList.toggle('is-open', open);
      productBtn.setAttribute('aria-expanded', open);
    };
    productBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!productMenu.classList.contains('is-open'));
    });
    document.addEventListener('click', function (e) { if (!productMenu.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setOpen(false); } });
    $$('.dropdown a', productMenu).forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); a.blur(); });
    });
  }

  /* ---------- Hero headline: "Send your ___." cycles through what creators make ---------- */
  var rot = $('#heroRot');
  if (rot && !reduceMotion) {
    var words = rot.getAttribute('data-words').split(','), wi = 0;
    setInterval(function () {
      if (document.hidden) return;
      rot.classList.add('is-out');
      setTimeout(function () {
        wi = (wi + 1) % words.length;
        rot.textContent = words[wi];
        rot.classList.remove('is-out');
      }, 280);
    }, 2200);
  }

  /* ---------- Hero phones: fanned, auto-rotating, synced with the tabs ---------- */
  var heroTabs = $('#heroTabs');
  var fan = $('#heroFan');
  if (heroTabs && fan) {
    var order = ['reply', 'page', 'video', 'biz'];
    var POS = ['center', 'right', 'back', 'left'];   // offset from the front phone
    var active = 0, timer = 0, paused = false;
    var ROTATE_MS = 4000;

    var show = function (i) {
      active = (i + order.length) % order.length;
      order.forEach(function (name, idx) {
        var panel = $('[data-panel="' + name + '"]', fan);
        panel.dataset.pos = POS[(idx - active + order.length) % order.length];
      });
      $$('.tabs__btn', heroTabs).forEach(function (b) {
        var on = b.dataset.tab === order[active];
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on);
      });
    };

    var schedule = function () {
      clearInterval(timer);
      if (reduceMotion) return;
      timer = setInterval(function () { if (!paused && !document.hidden) show(active + 1); }, ROTATE_MS);
    };

    $$('.tabs__btn', heroTabs).forEach(function (btn) {
      btn.addEventListener('click', function () { show(order.indexOf(btn.dataset.tab)); schedule(); });
    });
    // clicking a phone at the side brings it to the front
    order.forEach(function (name, idx) {
      $('[data-panel="' + name + '"]', fan).addEventListener('click', function () {
        if (idx !== active) { show(idx); schedule(); }
      });
    });
    fan.addEventListener('mouseenter', function () { paused = true; });
    fan.addEventListener('mouseleave', function () { paused = false; });

    show(0);
    schedule();
  }

  /* ---------- Shared helpers ---------- */
  // Accepts an email, or an Indian mobile number with or without +91.
  var contactError = function (raw) {
    var v = raw.trim();
    var digits = v.replace(/[\s\-()+]/g, '');
    var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    var isPhone = /^(91)?[6-9]\d{9}$/.test(digits);
    return !v ? 'Add an email or WhatsApp number so we can reach you.'
      : !(isEmail || isPhone) ? 'That doesn’t look like an email or a 10-digit mobile number.'
      : '';
  };

  var setErr = function (input, errId, msg) {
    $('#' + errId).textContent = msg;
    var box = input.closest('.input') || input.closest('.heroform') || input.closest('.claim') || input.closest('.claim2');
    if (box) box.classList.toggle('is-bad', !!msg);
  };

  var scrollToEl = function (el) {
    var top = el.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  /* ---------- Where signups are sent ----------
     Paste your Google Apps Script web-app URL here (see README → "Getting the responses").
     Any endpoint that accepts a form POST also works (e.g. a Formspree form URL).
     Left empty, the form still works but nothing is saved. */
  var WAITLIST_ENDPOINT = '';

  var sendSignup = function (data) {
    if (!WAITLIST_ENDPOINT) {
      if (window.console) console.warn('[tapkit] WAITLIST_ENDPOINT is not set, so this signup was not saved:', data);
      return Promise.resolve();
    }
    var body = new URLSearchParams(data);
    // Apps Script web apps redirect cross-origin, so send without CORS and treat "no network error" as success.
    if (WAITLIST_ENDPOINT.indexOf('script.google.com') !== -1) {
      return fetch(WAITLIST_ENDPOINT, { method: 'POST', mode: 'no-cors', body: body });
    }
    return fetch(WAITLIST_ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' }, body: body })
      .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); });
  };

  /* ---------- Waitlist: step 1 saves the contact, step 2 asks the questions ---------- */
  var dialog = $('#wlDialog');
  var start = $('#wlStart');
  var form = $('#waitlistForm');
  var done = $('#waitlistDone');
  var handle = $('#wlHandle');
  var contact = $('#wlContact');
  var entrySource = 'direct';
  // One id per visitor, so the step-2 answers update the step-1 row instead of adding a second one.
  var leadId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  var savedContact = '';

  var cleanHandle = function (v) { return v.trim().replace(/^@+/, ''); };

  var checkHandle = function () {
    var v = cleanHandle(handle.value);
    var msg = !v ? 'Add your Instagram handle.'
      : !/^[A-Za-z0-9._]{1,30}$/.test(v) ? 'Handles use letters, numbers, dots and underscores only.'
      : '';
    setErr(handle, 'errHandle', msg);
    return !msg;
  };

  var checkContact = function () {
    var msg = contactError(contact.value);
    setErr(contact, 'errContact', msg);
    return !msg;
  };

  var baseData = function (stage) {
    return {
      lead_id: leadId,
      stage: stage,
      submitted_at: new Date().toISOString(),
      contact: savedContact,
      contact_type: savedContact.indexOf('@') !== -1 ? 'email' : 'whatsapp',
      source: entrySource,
      ref: new URLSearchParams(location.search).get('ref') || '',
      page: location.href.split('#')[0]
    };
  };

  var steps = {
    1: ['Get early access', 'We’re letting creators in batches.'],
    2: ['A few quick questions', 'You’re on the list. These help us decide who gets in first.']
  };
  var showStep = function (n) {
    start.hidden = n !== 1;
    form.hidden = n !== 2;
    done.hidden = n !== 3;
    if (steps[n]) {
      $('#wlTitle').textContent = steps[n][0];
      $('#wlLede').textContent = steps[n][1];
    }
    if (n === 2) $('#wlSavedAs').textContent = savedContact;
    setTimeout(function () { (n === 1 ? contact : n === 2 ? handle : $('#copyInvite')).focus(); }, 30);
  };

  var startBtn = $('#wlStartBtn');
  var submitStart = function () {
    if (!checkContact()) { contact.focus(); return; }
    var value = contact.value.trim();
    if (value === savedContact) { showStep(2); return; }
    savedContact = value;
    $('#errStart').textContent = '';
    startBtn.disabled = true;
    startBtn.textContent = 'Saving…';
    sendSignup(baseData('contact')).then(function () {
      showStep(2);
    }).catch(function () {
      savedContact = '';
      $('#errStart').textContent = 'We couldn’t save that. Check your connection and try again.';
    }).then(function () {
      startBtn.disabled = false;
      startBtn.textContent = 'Continue';
    });
  };

  var openWaitlist = function (prefill, source) {
    if (!dialog) return;
    if (!savedContact) entrySource = source || 'direct';
    if (typeof dialog.showModal === 'function') { if (!dialog.open) dialog.showModal(); }
    else dialog.setAttribute('open', '');
    document.documentElement.classList.add('wl-open');
    if (!done.hidden) { showStep(3); return; }
    if (prefill) {
      contact.value = prefill;
      setErr(contact, 'errContact', '');
      showStep(1);
      submitStart();
      return;
    }
    showStep(savedContact ? 2 : 1);
  };
  var closeWaitlist = function () {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
  };

  if (dialog && form && start) {
    dialog.addEventListener('close', function () { document.documentElement.classList.remove('wl-open'); });
    $$('[data-wl-close]', dialog).forEach(function (b) { b.addEventListener('click', closeWaitlist); });
    // click on the dimmed backdrop closes it
    dialog.addEventListener('click', function (e) { if (e.target === dialog) closeWaitlist(); });

    handle.addEventListener('blur', function () { if (handle.value) checkHandle(); });
    contact.addEventListener('blur', function () { if (contact.value) checkContact(); });
    handle.addEventListener('input', function () { if ($('#errHandle').textContent) checkHandle(); });
    contact.addEventListener('input', function () { if ($('#errContact').textContent) checkContact(); });

    start.addEventListener('submit', function (e) { e.preventDefault(); submitStart(); });
    $('#wlChange').addEventListener('click', function () { showStep(1); });

    var submitBtn = $('#wlSubmit');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!checkHandle()) { handle.focus(); return; }

      var picked = function (name) { var el = form.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; };
      var data = baseData('complete');
      data.handle = cleanHandle(handle.value);
      data.niche = $('#wlNiche').value;
      data.followers = picked('followers');
      data.tool = picked('tool');
      data.brand_deals = picked('brand_deals');

      $('#errSubmit').textContent = '';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      sendSignup(data).then(function () {
        $('#inviteLink').textContent = 'tapkit.in/join?ref=' + encodeURIComponent(data.handle.toLowerCase());
        showStep(3);
      }).catch(function () {
        $('#errSubmit').textContent = 'We couldn’t send that. Check your connection and try again.';
      }).then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Finish';
      });
    });

    var copyBtn = $('#copyInvite');
    copyBtn.addEventListener('click', function () {
      var text = 'https://' + $('#inviteLink').textContent;
      var flash = function (label) {
        copyBtn.textContent = label;
        setTimeout(function () { copyBtn.textContent = 'Copy your invite link'; }, 2200);
      };
      var fallback = function () {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        document.body.removeChild(ta);
        flash(ok ? 'Copied ✓' : 'Select and copy it above');
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { flash('Copied ✓'); }, fallback);
      } else {
        fallback();
      }
    });

    // email step: hero box and the bottom "Get early access" box
    [['#heroForm', '#heroContact', 'errHero', 'hero'], ['#ctaForm', '#ctaContact', 'errCta', 'bottom']].forEach(function (cfg) {
      var f = $(cfg[0]); if (!f) return;
      var input = $(cfg[1]);
      input.addEventListener('input', function () { if ($('#' + cfg[2]).textContent) setErr(input, cfg[2], contactError(input.value)); });
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var msg = contactError(input.value);
        setErr(input, cfg[2], msg);
        if (msg) { input.focus(); return; }
        openWaitlist(input.value.trim(), cfg[3]);
      });
    });

    // hero "tapkit.in/ yourname · Reserve": the name they want goes into the waitlist's handle field
    var claim = $('#heroClaim');
    if (claim) {
      var alias = $('#heroAlias');
      var aliasError = function (v) {
        return !v ? 'Type the name you want after tapkit.in/'
          : !/^[a-z0-9._]{3,30}$/.test(v) ? 'Use 3–30 letters, numbers, dots or underscores.'
          : '';
      };
      alias.addEventListener('input', function () {
        alias.value = alias.value.toLowerCase().replace(/^@+/, '').replace(/\s+/g, '');
        if ($('#errClaim').textContent) setErr(alias, 'errClaim', aliasError(alias.value));
      });
      claim.addEventListener('submit', function (e) {
        e.preventDefault();
        var msg = aliasError(alias.value);
        setErr(alias, 'errClaim', msg);
        if (msg) { alias.focus(); return; }
        handle.value = alias.value;
        openWaitlist('', 'hero-claim');
      });
    }

    // other "Join the waitlist" buttons on this page open the dialog directly
    $$('a[href="#waitlist"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (mobileMenu) mobileMenu.classList.remove('is-open');
        openWaitlist('', 'button');
      });
    });

    // arriving from another page's "Join the waitlist" (index.html#waitlist)
    // #waitlist opens it; #waitlist-agency and friends also say where the person came from
    if (location.hash.indexOf('#waitlist') === 0) {
      var from = location.hash.slice(9).replace(/^-/, '') || 'other-page';
      setTimeout(function () { openWaitlist('', from); }, 150);
    }
  }

  /* ---------- Business connect interest ---------- */
  var bizOpen = $('#bizOpen');
  if (bizOpen) {
    var bizForm = $('#bizForm');
    var bizName = $('#bizName');
    var bizContact = $('#bizContact');

    bizOpen.addEventListener('click', function () {
      $('#bizPrompt').hidden = true;
      bizForm.hidden = false;
      bizName.focus();
    });

    bizForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameMsg = bizName.value.trim() ? '' : 'Add your business name.';
      var contactMsg = contactError(bizContact.value);
      setErr(bizName, 'errBizName', nameMsg);
      setErr(bizContact, 'errBizContact', contactMsg);
      if (nameMsg) { bizName.focus(); return; }
      if (contactMsg) { bizContact.focus(); return; }
      bizForm.hidden = true;
      $('#bizDone').hidden = false;
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealTargets = $$('.section__head, .card, .featurelist li, .flow li, .tabs, .dive__title')
    .filter(function (el) { return !el.closest('[hidden]'); });

  if ('IntersectionObserver' in window && !reduceMotion) {
    revealTargets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (Math.min(i % 6, 5) * 55) + 'ms';
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealTargets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Smooth anchor offset under sticky nav ---------- */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      scrollToEl(target);
    });
  });
})();
