/* ==========================================================================
   Dear Callia – app.js
   Rendering, hash routing (home view / collection detail view), order form,
   FAQ, terms, small interactions. Data comes from data.js, settings from config.js.
   Orders are stored in localStorage only (frontend demo, no server).
   ========================================================================== */
(function () {
  'use strict';
  const DC = window.DC, CFG = DC.CONFIG, CS = DC.CollectionService;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => CFG.currency + Number(n).toLocaleString('en-PH');
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const store = {
    get(k, d) { try { const v = localStorage.getItem('dc_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('dc_' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); } ta.remove();
    });
  }

  /* ------------------------------------------------------------ simple state */
  const selected = new Set(store.get('selected', []).filter(id => CS.byId(id)));
  const saveSel = () => store.set('selected', Array.from(selected));

  /* ----------------------------------------------------------------- render */
  function renderSpines() {
    const tones = ['gold', 'rose', 'cream', 'mauve', 'gold'];
    const heights = [58, 80, 42, 100, 66];
    $('#spines').innerHTML = CS.list().map((c, i) =>
      '<a class="spine t-' + tones[i] + '" href="#collection-' + c.id + '" style="height:' + heights[i] + '%;animation-delay:' + (i * 0.09) + 's" aria-label="' + esc(c.name) + '"><span>' + esc(c.name) + '</span></a>').join('');
    $('#stripPrice').textContent = money(CFG.defaultPrice);
  }

  function collCard(c) {
    const p = CS.nameParts(c);
    return '<a class="coll-card reveal" data-search="' + esc((c.name + ' ' + c.includes.join(' ') + ' ' + (DC.KEYWORDS[c.id] || '')).toLowerCase()) + '" href="#collection-' + c.id + '"><div class="coll-no t-' + c.tone + '" title="No. ' + c.no + '">' + ROMAN[Number(c.no) - 1] + '</div>' +
      '<div class="coll-info"><h3 class="coll-name">' + (p.lead ? '<small>' + p.lead + '</small>' : '') + esc(p.rest) + '</h3>' +
      '<p class="coll-meta">' + c.titles + ' titles</p><span class="coll-link">view collection →</span></div></a>';
  }

  function renderCollections() {
    $('#collGrid').innerHTML = CS.list().map(collCard).join('') +
      '<div class="callout reveal"><h3>found something you love?</h3><p>Send us your order and complete your payment. We personally deliver your collection.</p><a href="#order">order now ↗</a></div>';

    /* mood helper */
    $('#moodChips').innerHTML = DC.MOODS.map(m => '<button type="button" class="chip" data-mood="' + m.id + '" aria-pressed="false">' + esc(m.label) + '</button>').join('');
    $('#moodChips').addEventListener('click', function (e) {
      const b = e.target.closest('[data-mood]'); if (!b) return;
      $$('.chip', this).forEach(x => x.setAttribute('aria-pressed', x === b));
      const c = CS.byMood(b.dataset.mood);
      $('#moodResult').innerHTML = c ? 'Try <strong>' + esc(c.name) + '</strong> – ' + esc(c.includes.slice(0, 3).join(', ').toLowerCase()) + '. <a class="textlink" href="#collection-' + c.id + '">View collection →</a>' : '';
    });

    /* pick of the day (same collection all day) */
    const list = CS.list(), day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5);
    const pick = list[day % list.length], p = CS.nameParts(pick);
    const front = $('#flipFront'); front.classList.add('t-' + pick.tone);
    front.innerHTML = '<b>' + pick.no + '</b><i>' + esc(pick.name) + '</i><em>' + 'Tap again to hide</em>';
    const btn = $('#flipCard');
    const link = document.createElement('p'); link.className = 'hidden'; link.style.cssText = 'text-align:center;margin:16px 0 0';
    link.innerHTML = '<a class="textlink" href="#collection-' + pick.id + '">Open ' + esc(p.rest) + ' →</a>';
    btn.after(link);
    btn.addEventListener('click', function () {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', on); link.classList.toggle('hidden', !on);
      btn.setAttribute('aria-label', on ? 'Hide today’s pick' : 'Reveal today’s pick');
    });
  }

  function bindSearch() {
    const input = $('#collSearch'), msg = $('#searchMsg'), chips = $('#searchChips');
    chips.innerHTML = DC.SEARCH_CHIPS.map(t => '<button type="button" class="chip" data-q="' + esc(t) + '">' + esc(t) + '</button>').join('');
    function run() {
      const q = input.value.trim().toLowerCase(); let n = 0;
      $$('#collGrid .coll-card').forEach(c => { const hit = !q || c.dataset.search.indexOf(q) !== -1; c.classList.toggle('hidden', !hit); if (hit) n++; });
      const call = $('#collGrid .callout'); if (call) call.classList.toggle('hidden', !!q && n === 0);
      $$('.chip', chips).forEach(b => b.setAttribute('aria-pressed', b.dataset.q === q));
      msg.innerHTML = !q ? '' : n ? n + (n === 1 ? ' collection matches' : ' collections match') + ' “' + esc(q) + '” ✦'
        : 'nothing matches “' + esc(q) + '” yet. <a class="textlink" href="' + esc(CFG.messengerUrl) + '" target="_blank" rel="noopener noreferrer">message us</a> and we’ll help you find it ♡';
    }
    input.addEventListener('input', run);
    chips.addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (!b) return; input.value = input.value.trim().toLowerCase() === b.dataset.q ? '' : b.dataset.q; run(); });
  }

  function renderSteps() {
    $('#steps').innerHTML = DC.HOW_TO_ORDER.map(s => '<li class="reveal"><h3>' + esc(s.t.toLowerCase()) + '</h3><p>' + esc(s.d) + '</p></li>').join('');
  }

  function draftTag() { return CFG.draftNotes ? '<span class="tag">Draft</span>' : ''; }

  function renderFaq() {
    $('#faqList').innerHTML = DC.FAQ.map((f, i) =>
      '<div class="acc-item reveal"><h3 style="margin:0"><button class="acc-q" aria-expanded="false" aria-controls="fa' + i + '" id="fq' + i + '"><span>' + esc(f.q) + '</span></button></h3>' +
      '<div class="acc-a" id="fa' + i + '" role="region" aria-labelledby="fq' + i + '"><div><p>' + esc(f.a) + '</p></div></div></div>').join('');
    $('#faqList').addEventListener('click', function (e) {
      const q = e.target.closest('.acc-q'); if (!q) return;
      const item = q.closest('.acc-item'), open = item.classList.toggle('open'); q.setAttribute('aria-expanded', open);
    });
  }

  function renderTerms() {
    const tabs = $('#termsTabs'), body = $('#termsBody');
    function show(id) {
      const t = DC.TERMS.find(x => x.id === id) || DC.TERMS[0];
      $$('.tab', tabs).forEach(b => { const on = b.dataset.id === t.id; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
      body.innerHTML = '<h3>' + esc(t.label) + draftTag() + '</h3><ul>' + t.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul>';
    }
    tabs.innerHTML = DC.TERMS.map(t => '<button class="tab" role="tab" data-id="' + t.id + '" aria-selected="false">' + esc(t.label) + '</button>').join('');
    tabs.addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) show(b.dataset.id); });
    tabs.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const all = $$('.tab', tabs), i = all.indexOf(document.activeElement); if (i < 0) return;
      const n = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length]; n.focus(); show(n.dataset.id);
    });
    show(DC.TERMS[0].id);
  }

  function renderFooter() {
    $('#social').innerHTML = CFG.social.map(s => '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.name) + '</a></li>').join('');
    if (CFG.messengerUrl) {
      const fm = $('#footMessenger'); if (fm) fm.href = CFG.messengerUrl;
      const mb = $('#messengerBtn'); if (mb) mb.href = CFG.messengerUrl;
    }
    $('#footEmail').href = 'mailto:' + CFG.email; $('#footEmail').textContent = CFG.email;
    if (CFG.externalOrderFormUrl) { const b = $('#extFormBtn'); b.href = CFG.externalOrderFormUrl; b.target = '_blank'; b.rel = 'noopener noreferrer'; }
  }

  /* ----------------------------------------------------------- detail view */
  function renderDetail(c) {
    const p = CS.nameParts(c), price = CS.price(c);
    const hasSample = c.sample && c.sample.length;
    $('#detailView').innerHTML =
      '<div class="wrap"><p class="eyebrow dark">✦ collection no. ' + c.no + '</p><h2 class="h-title">' + esc(p.lead ? p.lead.toLowerCase() + ' ' : '') + '<em>' + esc(p.rest.toLowerCase()) + '</em></h2>' +
      '<div class="detail-grid"><div class="cover t-' + c.tone + '"><span class="brandline">DEAR CALLIA</span><div><div class="big">No. ' + c.no + '</div><div class="nm">' + esc(c.name) + '</div></div></div>' +
      '<div class="detail-info"><p class="no">Collection No. ' + c.no + '</p><div class="price-row"><span class="price-big">' + money(price) + '</span><span>' + c.summary + '</span></div>' +
      '<div class="detail-cols"><div><h3>Inside this collection</h3><ul>' + c.includes.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></div>' +
      (hasSample ? '<div><h3>Sample titles</h3><ol>' + c.sample.map(i => '<li>' + esc(i) + '</li>').join('') + '</ol></div>'
                 : '<div><h3>Want the full title list?</h3><p>Message us and we will send you every title in this collection before you order.</p></div>') + '</div>' +
      '<div class="detail-cta"><a class="btn btn-wine btn-lg" href="#order" data-pick="' + c.id + '">order this collection ↗</a>' +
      '<a class="textlink" href="#collections">← all collections</a>' + (hasSample ? '<a class="textlink" href="' + esc(CFG.messengerUrl) + '" target="_blank" rel="noopener noreferrer">Ask for the full list</a>' : '<a class="textlink" href="' + esc(CFG.messengerUrl) + '" target="_blank" rel="noopener noreferrer">Message us</a>') + '</div></div></div></div>';
    document.title = c.name + ' – Dear Callia';
  }

  /* ----------------------------------------------------------- order form */
  function renderPick() {
    $('#orderPick').innerHTML = CS.list().map(c =>
      '<label><input type="checkbox" name="coll" value="' + c.id + '"' + (selected.has(c.id) ? ' checked' : '') + '><span class="swatch t-' + c.tone + '">' + c.no + '</span><span class="nm">' + esc(c.name) + '<small>' + money(CS.price(c)) + '</small></span></label>').join('');
  }
  function syncPick() {
    $$('#orderPick input').forEach(i => { i.checked = selected.has(i.value); });
    updateTotal();
  }
  function orderTotal() { return Array.from(selected).reduce((s, id) => s + CS.price(CS.byId(id)), 0); }
  function updateTotal() { $('#orderTotal').textContent = money(orderTotal()); }

  function setErr(input, msg) {
    const f = input.closest('.field'); if (!f) return;
    f.classList.toggle('bad', !!msg);
    const e = $('.error', f); if (e) e.textContent = msg || '';
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }

  function buildMessage(o) {
    return ['Hello Dear Callia! I would like to place an order.', '',
      'Order ref: ' + o.ref,
      'Name: ' + o.name, 'Email: ' + o.email,
      'Collection(s): ' + o.items.map(i => i.name).join('; '),
      'Total: ' + money(o.total),
      'Deliver by: ' + o.delivery + (o.messenger ? ' (' + o.messenger + ')' : ''),
      'Paying with: ' + o.pay,
      o.notes ? 'Notes: ' + o.notes : null, '', 'Thank you!'].filter(x => x !== null).join('\n');
  }

  function showDone(o) {
    const pay = CFG.payment[o.pay.toLowerCase()] || {};
    const msg = buildMessage(o);
    const done = $('#orderDone');
    done.className = 'done';
    done.innerHTML =
      '<h3>Thank you, ' + esc(o.name.split(' ')[0]) + '!</h3>' +
      '<p>Your order reference is <span class="ref">' + esc(o.ref) + '</span></p>' +
      '<ul class="sumlist">' + o.items.map(i => '<li><span>' + esc(i.name) + '</span><span>' + money(i.price) + '</span></li>').join('') +
      '<li><strong>Total</strong><strong>' + money(o.total) + '</strong></li></ul>' +
      '<div class="paybox"><h4>Next: pay with ' + esc(o.pay) + '</h4><dl><dt>Account name</dt><dd>' + esc(pay.name || '') + '</dd><dt>Number</dt><dd>' + esc(pay.number || '') + '</dd><dt>Amount</dt><dd>' + money(o.total) + '</dd></dl>' +
      '<p style="margin:10px 0 0;font-size:.92rem">Then send your payment screenshot with your order message. We confirm your payment before sending your files by ' + esc(o.delivery.toLowerCase()) + '.</p></div>' +
      '<h4>Your order message</h4><p style="font-size:.92rem">Copy this and send it to us on Messenger or email so we can match your payment.</p>' +
      '<textarea class="msgbox" id="msgBox" readonly aria-label="Order message">' + esc(msg) + '</textarea>' +
      '<div class="btn-row"><button class="btn btn-wine" id="copyMsg" type="button">Copy message</button>' +
      '<a class="btn btn-gold" href="' + esc(CFG.messengerUrl) + '" target="_blank" rel="noopener noreferrer">Open Messenger</a>' +
      '<a class="btn btn-outline" href="mailto:' + esc(CFG.email) + '?subject=' + encodeURIComponent('Order ' + o.ref) + '&body=' + encodeURIComponent(msg) + '">Send by email</a></div>' +
      '<p class="demo-note"><strong>Prototype notice:</strong> this form saved your order only in this browser. Nothing was sent to a server, and the payment numbers above are placeholders. Send the message above to place a real order once the shop is connected.</p>' +
      '<p style="margin:18px 0 0"><button class="textlink" style="background:none;border:0;padding:0;font-size:1rem" id="newOrder" type="button">← Start a new order</button></p>';
    $('#orderFormWrap').classList.add('hidden');
    done.classList.remove('hidden');
    $('#copyMsg').addEventListener('click', () => copyText(msg).then(() => toast('Order message copied'), () => { $('#msgBox').select(); toast('Press Ctrl+C to copy'); }));
    $('#newOrder').addEventListener('click', function () {
      done.classList.add('hidden'); $('#orderFormWrap').classList.remove('hidden'); $('#orderForm').reset(); selected.clear(); saveSel(); syncPick(); $('#messengerField').classList.add('hidden');
      $('#orderCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    done.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function bindOrder() {
    const form = $('#orderForm');
    renderPick(); updateTotal();

    /* ---- Payment QR popup ---- */
    const QR = {
      'GCash':     { src: 'assets/logo/CashGQR.png',     title: 'Pay with GCash' },
      'Land Bank': { src: 'assets/logo/LandBankQR.png',  title: 'Pay with Land Bank' }
    };
    const qrModal = $('#qrModal');
    function openQR(method) {
      const q = QR[method]; if (!q) return;
      $('#qrImage').src = q.src;
      $('#qrImage').alt = q.title + ' QR code';
      $('#qrTitle').textContent = q.title;
      qrModal.classList.add('active');
    }
    function closeQR() { qrModal.classList.remove('active'); }
    // "click" (not "change") so re-clicking the already-selected option reopens the popup
    form.addEventListener('click', function (e) {
      if (e.target.name === 'pay') openQR(e.target.value);
    });
    $('#qrClose').addEventListener('click', closeQR);
    qrModal.addEventListener('click', function (e) { if (e.target === qrModal) closeQR(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeQR(); });
    form.addEventListener('change', function (e) {
      if (e.target.name === 'coll') { e.target.checked ? selected.add(e.target.value) : selected.delete(e.target.value); saveSel(); updateTotal(); $('#pickError').textContent = ''; }
      if (e.target.name === 'delivery') $('#messengerField').classList.toggle('hidden', e.target.value !== 'Facebook Messenger');
    });
    form.addEventListener('input', function (e) {if (e.target.closest('.field.bad')) validateOne(e.target); });
    form.addEventListener('focusout', e => { if (e.target.matches('#fName, #fEmail, #fMessenger') && e.target.value) validateOne(e.target); });

    function validateOne(el) {
      const v = el.value.trim();
      if (el.id === 'fName') { setErr(el, v.length < 2 ? 'Please enter your full name.' : ''); return v.length >= 2; }
      if (el.id === 'fEmail') { const ok = EMAIL_RE.test(v); setErr(el, !v ? 'Please enter your email address.' : ok ? '' : 'Please enter a valid email address.'); return ok; }
      if (el.id === 'fMessenger') {
        const need = form.delivery.value === 'Facebook Messenger'; const ok = !need || v.length >= 2;
        setErr(el, ok ? '' : 'Please tell us your Messenger name so we can find you.'); return ok;
      }
      return true;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      let ok = true, first = null;
      [$('#fName'), $('#fEmail'), $('#fMessenger')].forEach(el => { if (!validateOne(el)) { ok = false; first = first || el; } });
      if (!selected.size) { $('#pickError').textContent = 'Please choose at least one collection.'; ok = false; first = first || $('#orderPick input'); }
      const agree = $('#fAgree'), ae = agree.closest('label').nextElementSibling;
      if (!agree.checked) { ae.textContent = 'Please tick this box to continue.'; ok = false; first = first || agree; } else ae.textContent = '';
      if (!ok) { first.focus(); return; }
      const items = CS.list().filter(c => selected.has(c.id)).map(c => ({ id: c.id, name: c.name, price: CS.price(c) }));
      const d = new Date(), ref = 'DC-' + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      const o = { ref: ref, date: d.toISOString(), name: $('#fName').value.trim(), email: $('#fEmail').value.trim(), delivery: form.delivery.value,
        messenger: form.delivery.value === 'Facebook Messenger' ? $('#fMessenger').value.trim() : '', pay: form.pay.value, notes: $('#fNotes').value.trim(),
        items: items, total: items.reduce((s, i) => s + i.price, 0) };
      const orders = store.get('orders', []); orders.unshift(o); store.set('orders', orders);
      showDone(o);
    });

    /* "Open the order form": external form if configured, otherwise jump to the built-in form */
    $('#extFormBtn').addEventListener('click', function (e) {
      if (CFG.externalOrderFormUrl) return;
      e.preventDefault(); $('#orderCard').scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => $('#fName').focus({ preventScroll: true }), 400);
    });
  }

  /* --------------------------------------------------------------- routing */
  const homeView = $('#homeView'), detailView = $('#detailView');
  let lastView = 'home';
  function route(initial) {
    const h = decodeURIComponent(location.hash.replace(/^#/, ''));
    const m = h.match(/^collection-([\w-]+)$/);
    const c = m && CS.byId(m[1]);
    if (c) {
      renderDetail(c);
      homeView.classList.add('hidden'); detailView.classList.remove('hidden');
      window.scrollTo(0, 0); lastView = 'detail'; setNavActive('collections'); updateHeader(); return;
    }
    const wasDetail = lastView === 'detail';
    detailView.classList.add('hidden'); homeView.classList.remove('hidden'); lastView = 'home';
    document.title = 'Dear Callia – Digital Ebook Collections';
    const target = h && document.getElementById(h);
    if (target && h !== 'home') {
      /* After a view switch, scroll immediately (no smooth) so the page doesn't glide from the top. */
      if (wasDetail || initial) { requestAnimationFrame(() => { target.scrollIntoView({ behavior: 'auto', block: 'start' }); updateHeader(); }); }
    } else if (wasDetail || initial) { window.scrollTo(0, 0); }
    updateHeader();
  }

  /* header + scroll-spy */
  const header = $('#siteHeader'), hero = $('#home');
  const sections = ['collections', 'how-to-order', 'order', 'faq', 'terms'].map(id => document.getElementById(id));
  function setNavActive(id) { $$('.nav-links [data-nav]').forEach(a => { const on = a.dataset.nav === id; a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); }); }
  function updateHeader() {
    const onHome = lastView === 'home';
    header.classList.toggle('on-dark', onHome && hero.getBoundingClientRect().bottom > header.offsetHeight + 4);
    if (!onHome) return;
    let cur = 'home';
    sections.forEach(s => { if (s.getBoundingClientRect().top <= header.offsetHeight + 80) cur = s.id; });
    setNavActive(cur === 'order' ? '' : cur);
  }
  let ticking = false;
  window.addEventListener('scroll', function () { if (ticking) return; ticking = true; requestAnimationFrame(() => { updateHeader(); ticking = false; }); }, { passive: true });
  window.addEventListener('resize', updateHeader);

  /* mobile menu */
  const menuBtn = $('#menuBtn'), nav = $('#navLinks');
  function setMenu(open) { nav.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open); menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', e => { if (nav.classList.contains('open') && !e.target.closest('#navLinks, #menuBtn')) setMenu(false); });

  /* "Order this collection" pre-selects it */
  document.addEventListener('click', function (e) {
    const a = e.target.closest('[data-pick]'); if (!a) return;
    selected.add(a.dataset.pick); saveSel(); syncPick();
    if (location.hash === '#order') route(false);
  });

  /* scroll reveal */
  function reveal() {
    const els = $$('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { threshold: .08 });
    els.forEach(e => io.observe(e));
  }

  /* ------------------------------------------------------------------ init */
  renderSpines(); renderCollections(); bindSearch(); renderSteps(); renderFaq(); renderTerms(); renderFooter(); bindOrder();
  window.addEventListener('hashchange', () => route(false));
  route(true); reveal(); updateHeader();
})();
