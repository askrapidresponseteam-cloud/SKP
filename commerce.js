/* SKP commerce: shop, product, cart, quote, trace, certificates, buyer portal. Data comes from data/catalog.js. */
(() => {
'use strict';
const U = window.SKPU, D = window.SKP; if (!U || !D) return;
const { $, $$, esc, store, url, t, cart, toast } = U;
const app = $('[data-app]'); if (!app) return;
const params = new URLSearchParams(location.search);
const G = id => D.grades.find(g => g.id === id);
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const usd = (n, d = 0) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const money = (n, cur) => cur === 'USD' ? usd(n) : inr(n);
const day = s => { const d = new Date(s); return isNaN(d) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };
const retailPrice = (g, p) => Math.round(g.retailPerKg * p.kg * p.factor / 5) * 5;
const cartonPrice = g => Math.round(g.wholesalePerKg * D.cartonKg / 10) * 10;
const pack = id => D.packs.find(p => p.id === id), packing = id => D.packing.find(p => p.id === id);
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.3"/></svg>';
const check = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2"/></svg>';
const cta = (label, attrs = '', cls = '') => `<button type="button" class="cta ${cls}" ${attrs}><span>${esc(t(label))}</span><i>${arrow}</i></button>`;
const ctaLink = (label, href, cls = '', attrs = '') => `<a class="cta ${cls}" href="${esc(href)}" ${attrs}><span>${esc(t(label))}</span><i>${arrow}</i></a>`;
const demo = text => D.demo ? `<details class="c-demo"><summary>${esc(t('Demo data'))}</summary><p>${esc(t(text))}</p></details>` : '';
const head = (label, title, intro, demoText) => `<header class="c-head"><p class="label">${esc(t(label))}</p><h1 class="thin">${esc(t(title))}</h1><p class="c-intro">${esc(t(intro))}</p>${demoText ? demo(demoText) : ''}</header>`;
const qty = (value, min, max, label, attrs = '') => `<div class="qty"><button type="button" data-step="-1" aria-label="${esc(t('Decrease'))}">-</button><input type="number" inputmode="numeric" min="${min}" max="${max}" value="${value}" aria-label="${esc(t(label))}" ${attrs}><button type="button" data-step="1" aria-label="${esc(t('Increase'))}">+</button></div>`;
const table = obj => `<table class="c-table"><tbody>${Object.entries(obj).map(([k, v]) => `<tr><th scope="row">${esc(t(k))}</th><td>${esc(t(v))}</td></tr>`).join('')}</tbody></table>`;
const steps = (names, at) => `<ol class="c-steps">${names.map((n, i) => `<li class="${i < at ? 'done' : i === at ? 'on' : ''}"${i === at ? ' aria-current="step"' : ''}><span>${i + 1}</span>${esc(t(n))}</li>`).join('')}</ol>`;
const wa = text => 'https://wa.me/' + D.whatsapp + '?text=' + encodeURIComponent(text);
const uid = p => p + '-' + Date.now().toString(36).slice(-6).toUpperCase();
const focusHead = () => { const h = $('h1,h2', app); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' }); };

/* steppers, shared by every page */
app.addEventListener('click', e => {
  const b = e.target.closest('[data-step]'); if (!b) return;
  const i = $('input', b.parentElement), v = Math.min(Number(i.max) || 99999, Math.max(Number(i.min) || 0, (Number(i.value) || 0) + Number(b.dataset.step)));
  i.value = v; i.dispatchEvent(new Event('change', { bubbles: true }));
});
app.addEventListener('change', e => { const i = e.target; if (i.matches('.qty input')) { const v = Math.min(Number(i.max) || 99999, Math.max(Number(i.min) || 0, Math.round(Number(i.value) || 0))); if (String(v) !== i.value) i.value = v; } });

/* lines */
const lineInfo = l => {
  const g = G(l.g); if (!g) return null;
  if (l.mode === 'retail') { const p = pack(l.pack); return p && { g, price: retailPrice(g, p), label: g.name + ', ' + t(p.label) + ' ' + t('pouch'), kg: p.kg }; }
  const p = packing(l.pack) || D.packing[0]; return { g, price: cartonPrice(g), label: g.name + ', ' + D.cartonKg + ' kg ' + t('carton') + ' (' + t(p.label) + ')', kg: D.cartonKg };
};
const totals = lines => {
  const items = lines.map(l => ({ l, i: lineInfo(l) })).filter(x => x.i);
  const sub = items.reduce((n, x) => n + x.i.price * x.l.qty, 0), anyW = items.some(x => x.l.mode === 'wholesale');
  const ship = !items.length || anyW || sub >= D.retailShipping.freeAbove ? 0 : D.retailShipping.fee;
  return { items, sub, ship, total: sub + ship, anyW, kg: items.reduce((n, x) => n + x.i.kg * x.l.qty, 0) };
};

/* ---------- documents ---------- */
function docShell(title, ref, body) {
  return `<div class="doc">${D.demo ? `<div class="doc-mark">${esc(t('SAMPLE'))}</div>` : ''}<header><div><b>SKP GROUP</b><span>Shree Krishnaprasad Groups<br>S. No. 69/3 and 69/4, Billadi, Vandaru Post and Village<br>Udupi 576223, Karnataka, India<br>${esc(D.phones.join(' / '))}</span></div><div><h1>${esc(t(title))}</h1><span>${esc(ref)}</span></div></header>${body}<footer>${D.demo ? esc(t('Simulated document for demonstration. Not a commercial or legal record.')) : esc(t('Generated from the SKP buyer portal.'))}</footer></div>`;
}
function orderLines(o) {
  return o.lines.map(l => {
    const g = G(l.g) || { name: l.g, title: '' };
    if (l.price != null) return { name: g.name + ' ' + g.title, unit: t(l.unit || 'carton'), qty: l.qty, price: l.price, kg: D.cartonKg * l.qty };
    const i = lineInfo(l); return { name: i ? i.label : l.g, unit: l.mode === 'retail' ? t('pouch') : t('carton'), qty: l.qty, price: i ? i.price : 0, kg: (i ? i.kg : 0) * l.qty };
  });
}
function docFor(kind, o) {
  const cur = o.currency || 'INR', L = orderLines(o), c = o.customer || {};
  const buyer = `<section class="doc-two"><div><h2>${esc(t('Buyer'))}</h2><p>${[c.name, c.company, c.address, [c.city, c.pin].filter(Boolean).join(' '), c.country, c.phone, c.email].filter(Boolean).map(esc).join('<br>')}</p></div><div><h2>${esc(t('Order'))}</h2><p>${esc(o.id)}<br>${esc(day(o.date))}${o.lot ? '<br>' + esc(t('Lot')) + ' ' + esc(o.lot) : ''}</p></div></section>`;
  if (kind === 'invoice') return docShell('Proforma invoice', o.id, buyer + `<table><thead><tr><th>${esc(t('Item'))}</th><th>${esc(t('Qty'))}</th><th>${esc(t('Unit price'))}</th><th>${esc(t('Amount'))}</th></tr></thead><tbody>${L.map(x => `<tr><td>${esc(x.name)}</td><td>${x.qty} ${esc(x.unit)}</td><td>${money(x.price, cur)}</td><td>${money(x.price * x.qty, cur)}</td></tr>`).join('')}</tbody><tfoot>${o.ship ? `<tr><td colspan="3">${esc(t('Shipping'))}</td><td>${money(o.ship, cur)}</td></tr>` : ''}<tr><td colspan="3">${esc(t('Total'))}</td><td>${money(o.total, cur)}</td></tr></tfoot></table><p>${esc(t('Payment'))}: ${esc(o.pay ? t(o.pay.method) + ', ' + t(o.pay.status) + ', ' + o.pay.ref : t('As per agreed terms'))}</p>`);
  if (kind === 'packing') { const net = L.reduce((n, x) => n + x.kg, 0); return docShell('Packing list', o.id, buyer + `<table><thead><tr><th>${esc(t('Item'))}</th><th>${esc(t('Packages'))}</th><th>${esc(t('Net weight'))}</th></tr></thead><tbody>${L.map(x => `<tr><td>${esc(x.name)}</td><td>${x.qty} ${esc(x.unit)}</td><td>${x.kg.toFixed(2)} kg</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="2">${esc(t('Total net weight'))}</td><td>${net.toFixed(2)} kg</td></tr></tfoot></table>`); }
  const lot = D.lots.find(x => x.id === o.lot), g = G(o.lines[0].g) || D.grades[0];
  return docShell('Certificate of analysis', o.id, buyer + `<h2>${esc(g.name + ' ' + g.title)}</h2><table><thead><tr><th>${esc(t('Parameter'))}</th><th>${esc(t('Specification'))}</th><th>${esc(t('Result'))}</th></tr></thead><tbody>${Object.entries(g.specs).filter(([k]) => /Moisture|Broken|below|lower/.test(k)).map(([k, v]) => `<tr><td>${esc(t(k))}</td><td>${esc(v)}</td><td>${esc(lot && lot.qc[k] || t('Within specification'))}</td></tr>`).join('')}<tr><td>${esc(t('Foreign matter'))}</td><td>${esc(t('Nil'))}</td><td>${esc(t('Nil'))}</td></tr><tr><td>${esc(t('Infestation'))}</td><td>${esc(t('Nil'))}</td><td>${esc(t('Nil'))}</td></tr></tbody></table>`);
}
function specSheet(g) {
  return docShell('Product specification', g.name, `<h2>${esc(g.name + ' - ' + g.title)}</h2><p>${esc(t(g.line))}</p><p>${esc(t(g.count))}</p>${table(g.specs)}<h2>${esc(t('Packing options'))}</h2>${table(Object.fromEntries(D.packing.map(p => [p.label, p.detail])))}<p>${esc(t('Loading port'))}: ${esc(D.loadingPort)}. ${esc(t('{n} cartons per 20 ft container.', { n: D.cartonsPerFcl20 }))}</p>`);
}
function certDoc(c) {
  return docShell(c.name, c.number, `<section class="doc-cert"><p>${esc(t('This is to certify that'))}</p><h2>Shree Krishnaprasad Groups, Udupi</h2><p>${esc(t(c.scope))}</p>${table({ 'Issued by': c.issuer, 'Certificate number': c.number, 'Valid until': c.validTo ? day(c.validTo) : 'No expiry' })}</section>`);
}


/* grade finder: two questions, one recommendation */
const PICK = { gift: { look: 'w180', price: 'w240' }, snack: { look: 'w240', price: 'w320' }, roast: { look: 'w240', price: 'w320' }, sweets: { look: 'splits', price: 'pieces' }, gravy: { look: 'pieces', price: 'pieces' } };
const USES = [['gift', 'Gifting and premium retail'], ['snack', 'Snacking and retail packs'], ['roast', 'Roasting and flavouring'], ['sweets', 'Sweets and bakery'], ['gravy', 'Gravies and food service']];
function finderHtml(f) {
  if (!f.step) return `<div class="c-finder"><p>${esc(t('Not sure which grade?'))}</p><button type="button" class="btn solid" data-finder="start">${esc(t('Find my grade'))}</button><button type="button" class="btn" data-ask="">${esc(t('Ask SKP'))}</button></div>`;
  if (f.step === 1) return `<div class="c-finder open"><p class="label">${esc(t('Step {n} of 2', { n: 1 }))}</p><h2>${esc(t('What are the cashews for?'))}</h2><div class="c-chips">${USES.map(([k, l]) => `<button type="button" class="c-chip-btn" data-use="${k}">${esc(t(l))}</button>`).join('')}</div><button type="button" class="c-link" data-finder="close">${esc(t('Close'))}</button></div>`;
  if (f.step === 2) return `<div class="c-finder open"><p class="label">${esc(t('Step {n} of 2', { n: 2 }))}</p><h2>${esc(t('What matters more?'))}</h2><div class="c-chips"><button type="button" class="c-chip-btn" data-pri="look">${esc(t('Bigger, whole kernels'))}</button><button type="button" class="c-chip-btn" data-pri="price">${esc(t('Better price per kg'))}</button></div><button type="button" class="c-link" data-finder="back">${esc(t('Back'))}</button></div>`;
  const g = G(PICK[f.use][f.pri]), use = USES.find(u => u[0] === f.use)[1];
  return `<div class="c-finder open pick"><p class="label">${esc(t('Our pick for you'))}</p><div class="c-finder-pick"><div><h2>${esc(g.name)} <span>${esc(g.title)}</span></h2><p>${esc(t('For {use}, with {pri}, buyers choose {g}.', { use: t(use).toLowerCase(), pri: t(f.pri === 'look' ? 'bigger, whole kernels' : 'a better price per kg'), g: g.name }))} ${esc(t(g.line))}</p></div><p class="c-price"><b>${inr(g.retailPerKg)}</b><span>${esc(t('per kg'))}</span></p></div><div class="c-actions"><button type="button" class="btn solid" data-quickadd="${g.id}">${esc(t('Add 500 g to cart'))}</button><a class="btn" href="${esc(url('product/index.html?g=' + g.id))}">${esc(t('See {g}', { g: g.name }))}</a><button type="button" class="c-link" data-finder="start">${esc(t('Start again'))}</button></div></div>`;
}
function compareHtml(open) {
  const rows = [['Best for', g => g.bestFor], ['Count', g => g.count], ['Kernel type', g => g.specs['Kernel type']], ['Retail per kg', g => inr(g.retailPerKg)], ['Wholesale carton', g => inr(cartonPrice(g))], ['Export FOB per lb', g => usd(g.fobUsdPerLb, 2)], ['Shelf life', g => g.specs['Shelf life']]];
  return `<details class="c-compare" id="compare"${open ? ' open' : ''}><summary>${esc(t('Compare all grades'))}</summary><div class="c-compare-wrap" tabindex="0" role="region" aria-label="${esc(t('Compare all grades'))}"><table><thead><tr><th scope="col"><span class="sr-only">${esc(t('Grade'))}</span></th>${D.grades.map(g => `<th scope="col"><a href="${esc(url('product/index.html?g=' + g.id))}">${esc(g.name)}</a></th>`).join('')}</tr></thead><tbody>${rows.map(([l, fn]) => `<tr><th scope="row">${esc(t(l))}</th>${D.grades.map(g => `<td>${esc(t(String(fn(g))))}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
}
function recentHtml(except) {
  const seen = store.get('seen', []).filter(id => id !== except && G(id)).slice(0, 4);
  return seen.length ? `<p class="c-recent"><span>${esc(t('Recently viewed'))}</span>${seen.map(id => `<a class="c-chip-btn" href="${esc(url('product/index.html?g=' + id))}">${esc(G(id).name)}</a>`).join('')}</p>` : '';
}
function quickAdd(id, mode) {
  const p = mode === 'wholesale' ? D.packing[0].id : (D.packs.find(x => x.id === '500') || D.packs[0]).id;
  cart.add({ k: (mode === 'wholesale' ? 'w|' : 'r|') + id + '|' + p, mode: mode === 'wholesale' ? 'wholesale' : 'retail', g: id, pack: p, qty: mode === 'wholesale' ? D.wholesaleMinCartons : 1 });
  toast(t('Added to cart'));
}

/* ---------- shop ---------- */
function gradeBuy(g, mode) {
  if (mode === 'retail') {
    const p0 = D.packs[1] || D.packs[0];
    return `<div class="c-buybox" data-g="${g.id}" data-mode="retail"><div class="c-chips" role="radiogroup" aria-label="${esc(t('Pack size'))}">${D.packs.map(p => `<label class="c-chip"><input type="radio" name="pack-${g.id}" value="${p.id}"${p === p0 ? ' checked' : ''}><span>${esc(t(p.label))}</span></label>`).join('')}</div><p class="c-price"><b data-price>${inr(retailPrice(g, p0))}</b><span>${esc(t('incl. taxes'))}</span></p><div class="c-buy">${qty(1, 1, 50, 'Quantity')}<button type="button" class="btn solid" data-add>${esc(t('Add to cart'))}</button></div></div>`;
  }
  return `<div class="c-buybox" data-g="${g.id}" data-mode="wholesale"><p class="c-price"><b>${inr(cartonPrice(g))}</b><span>${esc(t('per {kg} kg carton', { kg: D.cartonKg }))} · ${inr(g.wholesalePerKg)}/kg</span></p><label class="c-field"><span>${esc(t('Packing'))}</span><select data-packing>${D.packing.map(p => `<option value="${p.id}">${esc(t(p.label))}</option>`).join('')}</select></label><div class="c-buy">${qty(D.wholesaleMinCartons, D.wholesaleMinCartons, 2000, 'Cartons')}<button type="button" class="btn solid" data-add>${esc(t('Add to cart'))}</button></div><p class="c-fine">${esc(t('Minimum {n} cartons. Freight is confirmed by SKP.', { n: D.wholesaleMinCartons }))}</p></div>`;
}
function wireBuy(scope) {
  scope.addEventListener('change', e => { const box = e.target.closest('.c-buybox'); if (box && e.target.matches('input[type=radio]')) $('[data-price]', box).textContent = inr(retailPrice(G(box.dataset.g), pack(e.target.value))); });
  scope.addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const box = b.closest('.c-buybox'), g = box.dataset.g, mode = box.dataset.mode, n = Number($('.qty input', box).value) || 1;
    const p = mode === 'retail' ? $('input[type=radio]:checked', box).value : $('[data-packing]', box).value;
    cart.add({ k: (mode === 'retail' ? 'r|' : 'w|') + g + '|' + p, mode, g, pack: p, qty: n });
    toast(t('Added to cart')); const old = b.textContent; b.textContent = t('Added'); b.disabled = true; setTimeout(() => { b.textContent = old; b.disabled = false; }, 1100);
  });
}
function shop() {
  let mode = params.get('mode') === 'wholesale' ? 'wholesale' : 'retail';
  const paint = () => {
    app.innerHTML = head('SHOP', 'Cashews, graded with care.', 'Pick a grade and a pack. Order in a minute.', 'Prices and stock shown are simulated until SKP adds its rate card. Checkout is a simulation and no money moves.') +
      `<div class="c-tabs" role="tablist" aria-label="${esc(t('Buying mode'))}"><button role="tab" aria-selected="${mode === 'retail'}" data-mode="retail">${esc(t('Retail packs'))}</button><button role="tab" aria-selected="${mode === 'wholesale'}" data-mode="wholesale">${esc(t('Wholesale cartons'))}</button><a href="${esc(url('quote/index.html'))}">${esc(t('Export quote'))}</a></div>` +
      `<div class="c-grid">${D.grades.map(g => `<article class="c-card"><a class="c-card-img" style="--img:${/kernel/.test(g.image) ? 'none' : `url('${esc(url(g.image))}')`}" href="${esc(url('product/index.html?g=' + g.id + (mode === 'wholesale' ? '&mode=wholesale' : '')))}" aria-label="${esc(g.name + ' ' + g.title)}"><img src="${esc(url(g.image))}" alt="" loading="lazy" width="600" height="450"></a><div class="c-card-body"><p class="c-kind">${esc(t(g.kind))}</p><h2><a href="${esc(url('product/index.html?g=' + g.id + (mode === 'wholesale' ? '&mode=wholesale' : '')))}">${esc(g.name)}</a></h2><p class="c-line">${esc(t(g.line))}</p>${gradeBuy(g, mode)}<details class="c-more"><summary>${esc(t('Specs'))}</summary>${table({ 'Count': g.count, 'Moisture': g.specs['Moisture'], 'Colour': g.specs['Colour'] })}<a class="c-link" href="${esc(url('product/index.html?g=' + g.id))}">${esc(t('Full spec sheet'))}</a></details></div></article>`).join('')}</div>`;
  };
  const f = { step: location.hash === '#finder' ? 1 : 0, use: '', pri: '' };
  let cmpOpen = location.hash === '#compare';
  const after = () => {
    const tabs = $('.c-tabs', app); tabs.insertAdjacentHTML('beforebegin', `<div class="c-finder-slot">${finderHtml(f)}</div>`);
    $('.c-grid', app).insertAdjacentHTML('beforebegin', recentHtml());
    $('.c-grid', app).insertAdjacentHTML('afterend', compareHtml(cmpOpen));
    if (f.step === 3) { const id = PICK[f.use][f.pri], card = $(`.c-buybox[data-g="${id}"]`, app)?.closest('.c-card'); if (card) card.classList.add('is-pick'); }
    $('#compare', app).addEventListener('toggle', e => { cmpOpen = e.target.open; });
  };
  const refinder = focusSel => { $('.c-finder-slot', app).innerHTML = finderHtml(f); $$('.c-card.is-pick', app).forEach(c => c.classList.remove('is-pick')); if (f.step === 3) { const card = $(`.c-buybox[data-g="${PICK[f.use][f.pri]}"]`, app)?.closest('.c-card'); card?.classList.add('is-pick'); } const el = $(focusSel || '.c-finder h2, .c-finder button', app); el?.focus({ preventScroll: true }); };
  paint(); after(); wireBuy(app);
  if (f.step || cmpOpen) setTimeout(() => (f.step ? $('.c-finder', app) : $('#compare', app))?.scrollIntoView({ block: 'center' }), 50);
  addEventListener('hashchange', () => {
    if (location.hash === '#compare') { cmpOpen = true; const d = $('#compare', app); d.open = true; d.scrollIntoView({ block: 'center' }); $('summary', d).focus({ preventScroll: true }); }
    else if (location.hash === '#finder') { f.step = 1; refinder('.c-finder [data-use]'); $('.c-finder', app).scrollIntoView({ block: 'center' }); }
  });
  app.addEventListener('click', e => {
    const b = e.target.closest('.c-tabs [data-mode]'); if (b && b.dataset.mode !== mode) { mode = b.dataset.mode; history.replaceState(null, '', mode === 'wholesale' ? '?mode=wholesale' : location.pathname); paint(); after(); $(`.c-tabs [data-mode="${mode}"]`, app).focus(); return; }
    const fb = e.target.closest('[data-finder]'); if (fb) { const a = fb.dataset.finder; f.step = a === 'close' ? 0 : a === 'back' ? 1 : 1; refinder(a === 'close' ? '[data-finder="start"]' : '.c-finder [data-use]'); return; }
    const u = e.target.closest('[data-use]'); if (u) { f.use = u.dataset.use; f.step = 2; refinder('.c-finder [data-pri]'); return; }
    const pr = e.target.closest('[data-pri]'); if (pr) { f.pri = pr.dataset.pri; f.step = 3; refinder('[data-quickadd]'); return; }
    const qa = e.target.closest('[data-quickadd]'); if (qa) { quickAdd(qa.dataset.quickadd, 'retail'); return; }
  });
}

/* ---------- product ---------- */
function product() {
  const g = G(params.get('g')); if (!g) { location.replace(url('shop/index.html')); return; }
  let mode = params.get('mode') === 'wholesale' ? 'wholesale' : 'retail';
  document.title = g.name + ' ' + g.title + ' | SKP Group';
  store.set('seen', [g.id, ...store.get('seen', []).filter(x => x !== g.id)].slice(0, 6));
  const PAIR = { w180: 'w240', w240: 'w320', w320: 'splits', splits: 'pieces', pieces: 'splits' }, mate = G(PAIR[g.id]);
  const extra = () => {
    $('.c-product > div:last-child', app).insertAdjacentHTML('beforeend', `<div class="c-pair"><p class="label">${esc(t('Often ordered with {g}', { g: g.name }))}</p><div><span class="c-frame" style="--img:${/kernel/.test(mate.image) ? 'none' : `url('${esc(url(mate.image))}')`}"><img src="${esc(url(mate.image))}" alt="" width="120" height="90"></span><div><b>${esc(mate.name)}</b><span>${esc(t(mate.bestFor))}</span></div><button type="button" class="btn" data-quickadd="${mate.id}">${esc(t('Add'))}</button></div></div>`);
    const rel = $('.c-related', app); if (rel) rel.insertAdjacentHTML('beforebegin', recentHtml(g.id));
  };
  const paint = () => {
    app.innerHTML = `<nav class="c-crumb" aria-label="${esc(t('Breadcrumb'))}"><a href="${esc(url('shop/index.html'))}">${esc(t('Shop'))}</a><span aria-hidden="true">/</span><span>${esc(g.name)}</span></nav><div class="c-product"><figure><img src="${esc(url(g.image))}" alt="${esc(g.name + ' ' + g.title)}" width="900" height="900"></figure><div><p class="label">${esc(t(g.kind))}</p><h1 class="thin">${esc(g.name)}</h1><p class="c-sub">${esc(g.title)}</p><p class="c-intro">${esc(t(g.line))}</p>${D.demo ? demo('Prices and specifications are simulated until SKP adds its rate card and spec sheets.') : ''}<div class="c-tabs" role="tablist" aria-label="${esc(t('Buying mode'))}"><button role="tab" aria-selected="${mode === 'retail'}" data-mode="retail">${esc(t('Retail packs'))}</button><button role="tab" aria-selected="${mode === 'wholesale'}" data-mode="wholesale">${esc(t('Wholesale cartons'))}</button></div>${gradeBuy(g, mode)}<div class="c-actions"><a class="btn" href="${esc(url('quote/index.html?g=' + g.id))}">${esc(t('Request quote'))}</a><a class="btn" href="${esc(url('quote/index.html?g=' + g.id + '&sample=1'))}">${esc(t('Request sample'))}</a></div></div></div>` +
      `<section class="c-spec"><div><h2 class="thin">${esc(t('Spec sheet'))}</h2><p>${esc(t(g.count))}</p><button type="button" class="btn" data-print-spec>${esc(t('Print or save as PDF'))}</button></div>${table(g.specs)}</section>` +
      `<section class="c-spec"><div><h2 class="thin">${esc(t('Packing options'))}</h2><p>${esc(t('Loading port'))}: ${esc(D.loadingPort)}</p><p>${esc(t('{n} cartons per 20 ft container.', { n: D.cartonsPerFcl20 }))}</p></div>${table(Object.fromEntries(D.packing.map(p => [p.label, p.detail])))}</section>` +
      `<section class="c-related"><h2 class="thin">${esc(t('Other grades'))}</h2><div>${D.grades.filter(x => x !== g).map(x => `<a href="${esc(url('product/index.html?g=' + x.id))}"><span class="c-frame" style="--img:${/kernel/.test(x.image) ? 'none' : `url('${esc(url(x.image))}')`}"><img src="${esc(url(x.image))}" alt="" loading="lazy" width="300" height="300"></span><b>${esc(x.name)}</b><span>${esc(x.title)}</span></a>`).join('')}</div></section>`;
  };
  paint(); extra(); wireBuy(app);
  app.addEventListener('click', e => {
    const b = e.target.closest('.c-tabs [data-mode]'); if (b && b.dataset.mode !== mode) { mode = b.dataset.mode; paint(); extra(); $(`.c-tabs [data-mode="${mode}"]`, app).focus(); }
    if (e.target.closest('[data-print-spec]')) U.print(specSheet(g));
    const qa = e.target.closest('[data-quickadd]'); if (qa) quickAdd(qa.dataset.quickadd, mode);
  });
}

/* ---------- cart and checkout ---------- */
function orderText(o) {
  return ['SKP order ' + o.id, ...orderLines(o).map(x => `${x.qty} x ${x.name} = ${money(x.price * x.qty, o.currency)}`), 'Total: ' + money(o.total, o.currency), '', o.customer.name, o.customer.phone, [o.customer.address, o.customer.city, o.customer.pin].filter(Boolean).join(', ')].join('\n');
}
function cartPage() {
  let stage = 0, order = null, busy = false;
  const names = ['Cart', 'Details', 'Payment', 'Done'];
  const summary = T => `<aside class="c-summary" aria-label="${esc(t('Order summary'))}"><h2>${esc(t('Order summary'))}</h2><dl><div><dt>${esc(t('Subtotal'))}</dt><dd>${inr(T.sub)}</dd></div><div><dt>${esc(t('Shipping'))}</dt><dd>${T.anyW ? esc(t('Confirmed by SKP')) : T.ship ? inr(T.ship) : esc(t('Free'))}</dd></div><div class="tot"><dt>${esc(t('Total'))}</dt><dd>${inr(T.total)}</dd></div></dl>`;
  function paint(focus) {
    const lines = cart.get(), T = totals(lines);
    if (stage < 3 && !T.items.length) { app.innerHTML = head('CART', 'Your cart is empty.', 'Choose a grade to begin.') + `<p class="c-center">${ctaLink('Shop cashews', url('shop/index.html'))}</p>`; return; }
    let body = '';
    if (stage === 0) body = `<div class="c-split"><ul class="c-lines">${T.items.map(({ l, i }) => `<li data-k="${esc(l.k)}"><img src="${esc(url(i.g.image))}" alt="" width="88" height="88"><div class="c-line-main"><b>${esc(i.label)}</b><span>${inr(i.price)} ${esc(t('each'))}</span></div>${qty(l.qty, l.mode === 'wholesale' ? D.wholesaleMinCartons : 1, l.mode === 'wholesale' ? 2000 : 50, 'Quantity')}<b class="c-line-total">${inr(i.price * l.qty)}</b><button type="button" class="c-remove" data-remove aria-label="${esc(t('Remove'))} ${esc(i.label)}">${esc(t('Remove'))}</button></li>`).join('')}</ul>${summary(T)}${cta('Continue', 'data-next')}</aside></div>`;
    if (stage === 1) { const c = store.get('customer', {}); const f = (n, label, type = 'text', extra = '') => `<label class="c-field"><span>${esc(t(label))}</span><input name="${n}" type="${type}" value="${esc(c[n] || '')}" ${extra}></label>`;
      body = `<div class="c-split"><form class="c-form" id="details" novalidate>${f('name', 'Full name', 'text', 'required autocomplete="name"')}${f('phone', 'Phone', 'tel', 'required autocomplete="tel" pattern="[0-9+ \\-]{8,16}"')}${f('email', 'Email', 'email', 'required autocomplete="email"')}${f('address', 'Address', 'text', 'required autocomplete="street-address"')}<div class="c-row">${f('city', 'City', 'text', 'required autocomplete="address-level2"')}${f('pin', 'PIN code', 'text', 'required inputmode="numeric" pattern="[0-9]{6}" autocomplete="postal-code"')}</div><details class="c-more"${c.company || c.gstin ? ' open' : ''}><summary>${esc(t('Buying for a business'))}</summary>${f('company', 'Company name', 'text', 'autocomplete="organization"')}${f('gstin', 'GSTIN', 'text', 'pattern="[0-9A-Za-z]{15}"')}</details><p class="c-error" role="alert" hidden></p></form>${summary(T)}${cta('Continue to payment', 'data-next')}<button type="button" class="c-back" data-back>${esc(t('Back'))}</button></aside></div>`; }
    if (stage === 2) body = `<div class="c-split"><form class="c-form" id="pay"><fieldset class="c-options"><legend>${esc(t('Pay with'))}</legend>${['UPI', 'Card', 'Net banking'].concat(T.anyW ? ['Bank transfer'] : []).map((m, i) => `<label class="c-option"><input type="radio" name="method" value="${m}"${i ? '' : ' checked'}><span>${esc(t(m))}</span></label>`).join('')}</fieldset>${D.demo ? `<p class="c-fine">${esc(t('Simulated payment. No card or bank details are asked for and no money moves.'))}</p>` : ''}</form>${summary(T)}<button type="button" class="cta" data-pay${busy ? ' disabled' : ''}><span>${busy ? esc(t('Processing payment')) : esc(t('Pay {amount}', { amount: inr(T.total) }))}</span><i>${arrow}</i></button><button type="button" class="c-back" data-back>${esc(t('Back'))}</button></aside></div>`;
    if (stage === 3) body = `<div class="c-done"><span class="c-tick">${check}</span><h2 class="thin">${esc(t('Order placed.'))}</h2><p>${esc(t('Order {id}', { id: order.id }))} · ${inr(order.total)}</p><div class="c-actions">${ctaLink('Track in buyer portal', url('portal/index.html?order=' + order.id))}<a class="btn" target="_blank" rel="noopener" href="${esc(wa(orderText(order)))}">${esc(t('Send order to SKP on WhatsApp'))}</a><button type="button" class="btn" data-doc>${esc(t('Print proforma'))}</button></div></div>`;
    app.innerHTML = head('CHECKOUT', ['Your cart.', 'Your details.', 'Payment.', 'Thank you.'][stage], ['Review your order.', 'Where should we send it?', 'Choose how to pay.', 'We have your order.'][stage]) + steps(names, stage) + body;
    if (focus) focusHead();
  }
  paint();
  app.addEventListener('change', e => { const li = e.target.closest('.c-lines li'); if (li && e.target.matches('.qty input')) { const lines = cart.get(), l = lines.find(x => x.k === li.dataset.k); if (l) { l.qty = Number(e.target.value) || 1; cart.set(lines); paint(); $(`.c-lines li[data-k="${CSS.escape(l.k)}"] .qty input`, app)?.focus(); } } });
  app.addEventListener('click', e => {
    const li = e.target.closest('.c-lines li');
    if (e.target.closest('[data-remove]') && li) { cart.set(cart.get().filter(x => x.k !== li.dataset.k)); paint(); return; }
    if (e.target.closest('[data-back]')) { stage--; paint(true); return; }
    if (e.target.closest('[data-next]')) {
      if (stage === 1) { const form = $('#details', app), bad = $$('input', form).find(i => !i.checkValidity()), err = $('.c-error', form);
        if (bad) { const d = bad.closest('details'); if (d) d.open = true; err.textContent = t('Please check: {field}', { field: $('span', bad.closest('label')).textContent }); err.hidden = false; bad.setAttribute('aria-invalid', 'true'); bad.focus(); return; }
        store.set('customer', Object.fromEntries(new FormData(form))); }
      stage++; paint(true); return;
    }
    if (e.target.closest('[data-pay]') && !busy) {
      const method = $('input[name=method]:checked', app).value, lines = cart.get(), T = totals(lines); busy = true; paint();
      setTimeout(() => {
        order = { id: uid(T.anyW ? 'SKP-W' : 'SKP-R'), ts: Date.now(), date: new Date().toISOString(), mode: T.anyW ? 'wholesale' : 'retail', currency: 'INR', lines, ship: T.ship, total: T.total, customer: store.get('customer', {}), pay: { method, status: D.demo ? 'Paid (simulated)' : 'Paid', ref: uid('PAY') } };
        store.set('orders', [order, ...store.get('orders', [])]); cart.clear(); busy = false; stage = 3; paint(true);
      }, 1300);
      return;
    }
    if (e.target.closest('[data-doc]') && order) U.print(docFor('invoice', order));
  });
}

/* ---------- instant quote and sample ---------- */
function quotePage() {
  const zone = (Intl.DateTimeFormat().resolvedOptions().timeZone || '');
  const guessCur = /Dubai|Muscat|Riyadh|Qatar|Bahrain|Kuwait/.test(zone) ? 'AED' : /London/.test(zone) ? 'GBP' : /^Europe\//.test(zone) ? 'EUR' : /Kolkata|Calcutta/.test(zone) ? 'INR' : 'USD';
  let ccy = D.fx[store.get('ccy', '')] ? store.get('ccy', '') : guessCur;
  const fmt = n => { const v = n * D.fx[ccy]; return ccy === 'INR' ? inr(v) : new Intl.NumberFormat('en', { style: 'currency', currency: ccy, maximumFractionDigits: 0 }).format(v); };
  const s = { g: G(params.get('g')) ? params.get('g') : '', cartons: 0, packing: D.packing[0].id, port: '', term: 'FOB', sample: params.get('sample') === '1', booked: null };
  const qn = Number(params.get('qty')); if (qn > 0) s.cartons = Math.min(5000, Math.round(qn));
  const calc = () => {
    const g = G(s.g), lbs = s.cartons * 50, goods = g.fobUsdPerLb * lbs, port = D.ports.find(p => p.id === s.port), boxes = Math.ceil(s.cartons / D.cartonsPerFcl20);
    const freight = s.term === 'CIF' && port ? port.freightUsd * boxes + goods * 0.003 : 0, mid = goods + freight, sp = D.quoteSpread;
    return { g, lbs, goods, freight, port, boxes, low: mid * (1 - sp), high: mid * (1 + sp), perLb: mid / lbs, mt: s.cartons * D.cartonKg / 1000 };
  };
  function planner(q) {
    const cap = q.boxes * D.cartonsPerFcl20, fill = Math.min(100, Math.round(s.cartons / cap * 100)), room = cap - s.cartons;
    const load = new Date(); load.setDate(load.getDate() + D.leadDays); const arrive = new Date(load); arrive.setDate(arrive.getDate() + q.port.days);
    let nudge = '';
    if (room > 0 && fill >= 15) {
      const now = q.port.freightUsd * q.boxes / (s.cartons * D.cartonKg), full = q.port.freightUsd * q.boxes / (cap * D.cartonKg), save = Math.round((1 - full / now) * 100);
      nudge = `<p class="c-nudge">${esc(t('Add {n} cartons to fill the container.', { n: room }))}${save >= 3 ? ' ' + esc(t('Freight per kg drops about {p}%.', { p: save })) : ''} <button type="button" class="c-link" data-cartons="${cap}">${esc(t('Fill it'))}</button></p>`;
    }
    return `<div class="c-plan"><div class="c-plan-head"><span>${esc(t('Container load'))}</span><b>${q.boxes} x 20 ft · ${fill}%</b></div><div class="c-plan-bar" role="img" aria-label="${esc(t('Container load'))} ${fill}%">${Array.from({ length: q.boxes }, (_, i) => { const inBox = Math.max(0, Math.min(D.cartonsPerFcl20, s.cartons - i * D.cartonsPerFcl20)); return `<i><b style="width:${Math.round(inBox / D.cartonsPerFcl20 * 100)}%"></b></i>`; }).join('')}</div>${nudge}<p class="c-eta">${esc(t('Loads by {a}. Arrives around {b}.', { a: day(load), b: day(arrive) }))}</p></div>`;
  }
  const quoteText = q => ['SKP quote request', `${q.g.name} ${q.g.title}`, `${s.cartons} cartons (${q.mt.toFixed(2)} MT), ${packing(s.packing).label}`, `${s.term} ${s.term === 'CIF' ? q.port.name : D.loadingPort}`, `Destination: ${q.port.name}`, `Indicative: ${usd(q.low)} to ${usd(q.high)}` + (ccy !== 'USD' ? ` (${fmt(q.low)} to ${fmt(q.high)})` : '')].join('\n');
  function paint(focusSel) {
    const g = G(s.g);
    let h = head('INSTANT QUOTE', 'A quote in three steps.', 'Grade, quantity, port. See an indicative range at once.', 'Rates and freight are simulated until SKP adds its rate card. Sample bookings are saved on this device only.');
    h += '<div class="c-quote"><div class="c-quote-main">';
    let side = `<section class="c-result is-pending" aria-live="polite"><p class="label">${esc(t('Indicative quote'))}</p><p class="c-hint">${esc(t(!g ? 'Choose a grade to begin.' : !s.cartons ? 'Now set the quantity.' : 'Add the destination port to see your range.'))}</p>${g ? `<p>${esc(g.name)}${s.cartons ? ' · ' + s.cartons + ' ' + esc(t('cartons')) : ''}</p>` : ''}</section>`, sample = '';
    h += `<section class="c-stage"><h2><span>1</span>${esc(t('Grade'))}</h2><div class="c-chips" role="radiogroup" aria-label="${esc(t('Grade'))}">${D.grades.map(x => `<label class="c-chip big"><input type="radio" name="g" value="${x.id}"${x.id === s.g ? ' checked' : ''}><span><b>${esc(x.name)}</b><i>${esc(x.title)}</i></span></label>`).join('')}</div></section>`;
    if (g) h += `<section class="c-stage"><h2><span>2</span>${esc(t('Quantity'))}</h2><div class="c-chips" role="group" aria-label="${esc(t('Quick quantities'))}">${[[100, '100 cartons'], [350, '350 cartons'], [700, '1 x 20 ft container'], [1400, '2 x 20 ft containers']].map(([n, l]) => `<button type="button" class="c-chip-btn${s.cartons === n ? ' on' : ''}" data-cartons="${n}" aria-pressed="${s.cartons === n}">${esc(t(l))}</button>`).join('')}</div><div class="c-row"><label class="c-field"><span>${esc(t('Cartons of {kg} kg', { kg: D.cartonKg }))}</span>${qty(s.cartons || 100, 10, 5000, 'Cartons', 'data-q')}</label><label class="c-field"><span>${esc(t('Packing'))}</span><select data-packing>${D.packing.map(p => `<option value="${p.id}"${p.id === s.packing ? ' selected' : ''}>${esc(t(p.label))}</option>`).join('')}</select></label></div>${s.cartons ? '' : `<button type="button" class="btn solid" data-cartons="${100}" data-use-input>${esc(t('Next'))}</button>`}</section>`;
    if (g && s.cartons) h += `<section class="c-stage"><h2><span>3</span>${esc(t('Destination port'))}</h2><div class="c-row"><label class="c-field"><span>${esc(t('Port'))}</span><select data-port><option value="">${esc(t('Choose a port'))}</option>${D.ports.map(p => `<option value="${p.id}"${p.id === s.port ? ' selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label><fieldset class="c-options inline"><legend>${esc(t('Terms'))}</legend>${[['FOB', 'FOB, ex ' + D.loadingPort], ['CIF', 'CIF, to your port']].map(([v, l]) => `<label class="c-option"><input type="radio" name="term" value="${v}"${s.term === v ? ' checked' : ''}><span>${esc(t(l))}</span></label>`).join('')}</fieldset></div></section>`;
    if (g && s.cartons && s.port) { const q = calc();
      side = `<section class="c-result" aria-live="polite"><p class="label">${esc(t('Indicative quote'))}</p><div class="c-ccy" role="group" aria-label="${esc(t('Currency'))}">${Object.keys(D.fx).map(c => `<button type="button" data-ccy="${c}" aria-pressed="${c === ccy}">${c}</button>`).join('')}</div><p class="c-range">${fmt(q.low)} <span>${esc(t('to'))}</span> ${fmt(q.high)}</p><p>${esc(q.g.name)} · ${s.cartons} ${esc(t('cartons'))} · ${q.mt.toFixed(2)} MT · ${esc(s.term)} · ${esc(q.port.name)}</p>${planner(q)}<details class="c-more"><summary>${esc(t('How this is worked out'))}</summary>${table({ 'Rate': usd(q.g.fobUsdPerLb, 2) + ' / lb FOB', 'Weight': Math.round(q.lbs).toLocaleString('en-US') + ' lb', 'Goods': usd(q.goods), 'Freight and insurance': s.term === 'CIF' ? usd(q.freight) + ' (' + q.boxes + ' x 20 ft)' : 'Not included on FOB', 'Sailing time': q.port.days + ' days', 'Range': 'Plus or minus ' + Math.round(D.quoteSpread * 100) + '%' })}</details><div class="c-actions"><a class="cta yellow" target="_blank" rel="noopener" href="${esc(wa(quoteText(q)))}"><span>${esc(t('Send to SKP on WhatsApp'))}</span><i>${arrow}</i></a><button type="button" class="btn" data-sample>${esc(t('Book a sample'))}</button><button type="button" class="btn" data-save>${esc(t('Save to portal'))}</button></div></section>`; }
    if (g && s.sample) sample = s.booked ? `<section class="c-done" id="sample"><span class="c-tick">${check}</span><h2 class="thin">${esc(t('Sample booked.'))}</h2><p>${esc(t('Reference {id}', { id: s.booked.id }))} · ${esc(g.name)} · 250 g</p><div class="c-actions">${ctaLink('See it in the portal', url('portal/index.html'))}<a class="btn" target="_blank" rel="noopener" href="${esc(wa('SKP sample request ' + s.booked.id + '\n' + g.name + ' ' + g.title + ', 250 g\n' + s.booked.name + ', ' + s.booked.company + '\n' + s.booked.address + ', ' + s.booked.country + '\n' + s.booked.phone))}">${esc(t('Send to SKP on WhatsApp'))}</a></div></section>` : `<section class="c-stage" id="sample"><h2><span>${check}</span>${esc(t('Book a sample dispatch'))}</h2><p class="c-fine">${esc(t('A 250 g sample of {grade}, sent by courier.', { grade: g.name }))}</p><form class="c-form" id="sample-form" novalidate><div class="c-row"><label class="c-field"><span>${esc(t('Full name'))}</span><input name="name" required autocomplete="name"></label><label class="c-field"><span>${esc(t('Company name'))}</span><input name="company" required autocomplete="organization"></label></div><div class="c-row"><label class="c-field"><span>${esc(t('Email'))}</span><input name="email" type="email" required autocomplete="email"></label><label class="c-field"><span>${esc(t('Phone'))}</span><input name="phone" type="tel" required autocomplete="tel" pattern="[0-9+ \\-]{8,16}"></label></div><div class="c-row"><label class="c-field"><span>${esc(t('Delivery address'))}</span><input name="address" required autocomplete="street-address"></label><label class="c-field"><span>${esc(t('Country'))}</span><input name="country" required autocomplete="country-name"></label></div><p class="c-error" role="alert" hidden></p><button type="submit" class="cta"><span>${esc(t('Book sample'))}</span><i>${arrow}</i></button></form></section>`;
    h += `</div><aside class="c-quote-side">${side}</aside>${sample ? `<div class="c-quote-sample">${sample}</div>` : ''}</div>`;
    app.innerHTML = h;
    if (focusSel) { const el = $(focusSel, app); if (el) { el.focus({ preventScroll: true }); if (focusSel === '#sample-form input' || focusSel === '#sample h2') $('#sample', app).scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
  }
  paint();
  app.addEventListener('change', e => {
    const el = e.target;
    if (el.name === 'g') { s.g = el.value; s.booked = null; paint(`input[name=g][value="${s.g}"]`); }
    else if (el.matches('[data-q]')) { s.cartons = Number(el.value); paint('[data-q]'); }
    else if (el.matches('[data-packing]')) { s.packing = el.value; }
    else if (el.matches('[data-port]')) { s.port = el.value; paint('[data-port]'); }
    else if (el.name === 'term') { s.term = el.value; paint(`input[name=term][value="${s.term}"]`); }
  });
  app.addEventListener('click', e => {
    const cc = e.target.closest('[data-ccy]'); if (cc) { ccy = cc.dataset.ccy; store.set('ccy', ccy); paint(`[data-ccy="${ccy}"]`); return; }
    const c = e.target.closest('[data-cartons]');
    if (c) { s.cartons = c.hasAttribute('data-use-input') ? Number($('[data-q]', app).value) : Number(c.dataset.cartons); paint(c.hasAttribute('data-use-input') ? '[data-port]' : `[data-cartons="${s.cartons}"]`); return; }
    if (e.target.closest('[data-sample]')) { s.sample = true; paint('#sample-form input'); return; }
    if (e.target.closest('[data-save]')) { const q = calc(); store.set('quotes', [{ id: uid('QT'), date: new Date().toISOString(), g: s.g, cartons: s.cartons, term: s.term, port: s.port, low: q.low, high: q.high }, ...store.get('quotes', [])]); toast(t('Saved to your portal')); }
  });
  app.addEventListener('submit', e => {
    if (e.target.id !== 'sample-form') return; e.preventDefault();
    const form = e.target, bad = $$('input', form).find(i => !i.checkValidity()), err = $('.c-error', form);
    if (bad) { err.textContent = t('Please check: {field}', { field: $('span', bad.closest('label')).textContent }); err.hidden = false; bad.setAttribute('aria-invalid', 'true'); bad.focus(); return; }
    s.booked = { id: uid('SMP'), date: new Date().toISOString(), g: s.g, ...Object.fromEntries(new FormData(form)) };
    store.set('samples', [s.booked, ...store.get('samples', [])]); paint('#sample h2');
  });
}

/* ---------- lot traceability ---------- */
function qrSvg(text) { try { const q = window.qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true }); } catch { return ''; } }
function tracePage() {
  let stream = null, scanning = false, message = '';
  const lotUrl = id => url('trace/index.html?lot=' + encodeURIComponent(id));
  const parse = v => { v = String(v || '').trim(); const m = v.match(/[?&]lot=([^&#]+)/); return decodeURIComponent(m ? m[1] : v).toUpperCase(); };
  const stop = () => { scanning = false; stream?.getTracks().forEach(x => x.stop()); stream = null; };
  function paint(id) {
    const lot = id && D.lots.find(l => l.id.toUpperCase() === id), g = lot && G(lot.grade);
    let h = head('TRACE A LOT', 'Every carton has a story.', 'Scan the QR on the carton or type the lot number.', 'Lot records shown are simulated until SKP connects its production records.');
    h += `<form class="c-lookup" id="lot-form"><label class="c-field"><span>${esc(t('Lot number'))}</span><input name="lot" value="${esc(id || '')}" placeholder="SKP-DEMO-0001" autocomplete="off" autocapitalize="characters" spellcheck="false" required></label><button type="submit" class="btn solid">${esc(t('Trace'))}</button><button type="button" class="btn" data-scan>${esc(t('Scan QR'))}</button></form>`;
    if (D.demo) h += `<p class="c-try">${esc(t('Try a sample lot'))}: ${D.lots.map(l => `<button type="button" class="c-chip-btn" data-lot="${esc(l.id)}">${esc(l.id)}</button>`).join('')}</p>`;
    h += `<div class="c-scan" hidden><video playsinline muted></video><button type="button" class="btn" data-stop>${esc(t('Stop scanning'))}</button></div><p class="c-error" role="alert"${message ? '' : ' hidden'}>${esc(message)}</p>`;
    if (id && !lot) h += `<p class="c-error" role="alert">${esc(t('No record found for lot {id}. Check the number on the carton.', { id }))}</p>`;
    if (lot) h += `<section class="c-lot" aria-live="polite"><header><div><p class="label">${esc(t('Lot'))}</p><h2 class="thin">${esc(lot.id)}</h2></div><span class="c-status">${check}${esc(t(lot.status))}</span></header><div class="c-facts">${[['Grade', g.name + ' ' + g.title], ['Origin', lot.origin], ['Processed at', lot.processedAt], ['Packing', packing(lot.packing).label], ['Cartons', lot.cartons], ['Net weight', (lot.cartons * D.cartonKg / 1000).toFixed(2) + ' MT']].map(([k, v]) => `<div><span>${esc(t(k))}</span><b>${esc(t(String(v)))}</b></div>`).join('')}</div><div class="c-lot-grid"><div><h3>${esc(t('Journey'))}</h3><ol class="c-timeline">${lot.steps.map(x => `<li class="done"><time datetime="${esc(x.date)}">${esc(day(x.date))}</time><b>${esc(t(x.title))}</b><span>${esc(t(x.note))}</span></li>`).join('')}</ol></div><div><h3>${esc(t('Quality checks'))}</h3>${table(lot.qc)}<h3>${esc(t('Certificates'))}</h3><p class="c-certs">${lot.certificates.map(c => { const x = D.certificates.find(k => k.id === c); return x ? `<a class="c-chip-btn" href="${esc(url('certificates/index.html#' + x.id))}">${esc(t(x.name))}</a>` : ''; }).join('')}</p><div class="c-qr"><div>${qrSvg(lotUrl(lot.id))}</div><p>${esc(t('This QR goes on every carton of the lot.'))}</p><button type="button" class="btn" data-label>${esc(t('Print carton label'))}</button></div></div></div></section>`;
    app.innerHTML = h; return lot;
  }
  const go = id => { stop(); message = ''; id = parse(id); history.replaceState(null, '', id ? '?lot=' + encodeURIComponent(id) : location.pathname); const lot = paint(id); (lot ? $('.c-lot h2', app) : $('#lot-form input', app))?.focus?.({ preventScroll: true }); if (lot) { const h2 = $('.c-lot h2', app); h2.tabIndex = -1; h2.focus({ preventScroll: true }); $('.c-lot', app).scrollIntoView({ behavior: 'smooth', block: 'start' }); } };
  paint(params.get('lot') ? parse(params.get('lot')) : '');
  app.addEventListener('submit', e => { if (e.target.id === 'lot-form') { e.preventDefault(); go(e.target.lot.value); } });
  app.addEventListener('click', async e => {
    const l = e.target.closest('[data-lot]'); if (l) { go(l.dataset.lot); return; }
    if (e.target.closest('[data-stop]')) { stop(); $('.c-scan', app).hidden = true; return; }
    if (e.target.closest('[data-label]')) { const id = parse(params.get('lot') || $('#lot-form input', app).value), lot = D.lots.find(x => x.id === id); if (lot) { const g = G(lot.grade); U.print(`<div class="doc doc-label">${D.demo ? `<div class="doc-mark">${esc(t('SAMPLE'))}</div>` : ''}<div class="doc-label-qr">${qrSvg(lotUrl(lot.id))}</div><div><b>SKP GROUP</b><h1>${esc(g.name)}</h1><p>${esc(g.title)}</p><p>${esc(t('Lot'))} ${esc(lot.id)}</p><p>${D.cartonKg} kg ${esc(t('net'))} · ${esc(packing(lot.packing).label)}</p><p>${esc(t('Scan to trace this lot'))}</p></div></div>`); } return; }
    if (e.target.closest('[data-scan]')) {
      const err = m => { message = m; const p = $$('.c-error', app)[0]; p.textContent = m; p.hidden = false; };
      if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) { err(t('Camera scanning is not supported in this browser. Type the lot number, or scan with your phone camera.')); return; }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const box = $('.c-scan', app), v = $('video', box), det = new BarcodeDetector({ formats: ['qr_code'] }); box.hidden = false; v.srcObject = stream; await v.play(); scanning = true;
        const loop = async () => { if (!scanning) return; try { const codes = await det.detect(v); if (codes.length) { go(codes[0].rawValue); return; } } catch {} setTimeout(loop, 250); }; loop();
      } catch { stop(); err(t('Camera access was not allowed. Type the lot number instead.')); }
    }
  });
  addEventListener('pagehide', stop);
}

/* ---------- certificates ---------- */
function certPage() {
  let verify = null;
  function paint() {
    let h = head('CERTIFICATES', 'Proof, on record.', 'View, verify and download our certificates.', 'Certificates shown are simulated placeholders. SKP adds its real documents in the data file.');
    h += `<form class="c-lookup" id="verify"><label class="c-field"><span>${esc(t('Verify a certificate number'))}</span><input name="n" autocomplete="off" spellcheck="false" required placeholder="${esc(D.certificates[0].number)}" value="${esc(verify ? verify.q : '')}"></label><button type="submit" class="btn solid">${esc(t('Verify'))}</button></form>`;
    if (verify) h += verify.c ? `<p class="c-ok" role="status">${check}${esc(t('{name} matches our records.', { name: t(verify.c.name) }))}${verify.c.validTo ? ' ' + esc(t('Valid until {date}.', { date: day(verify.c.validTo) })) : ''}</p>` : `<p class="c-error" role="alert">${esc(t('That number is not in our records.'))}</p>`;
    h += `<div class="c-grid certs">${D.certificates.map(c => `<article class="c-card cert" id="${esc(c.id)}"><div class="c-card-body"><p class="c-status">${check}${esc(t(D.demo ? 'Sample' : 'Verified'))}</p><h2>${esc(t(c.name))}</h2><p class="c-line">${esc(t(c.scope))}</p><details class="c-more"><summary>${esc(t('Details'))}</summary>${table({ 'Issued by': c.issuer, 'Certificate number': c.number, 'Valid until': c.validTo ? day(c.validTo) : 'No expiry' })}</details><div class="c-actions">${c.file ? `<a class="btn solid" href="${esc(url(c.file))}" download>${esc(t('Download'))}</a>` : `<button type="button" class="btn solid" data-cert="${esc(c.id)}">${esc(t('Save as PDF'))}</button>`}</div></div></article>`).join('')}</div>`;
    app.innerHTML = h;
  }
  paint();
  app.addEventListener('submit', e => { if (e.target.id !== 'verify') return; e.preventDefault(); const q = e.target.n.value.trim(); verify = { q, c: D.certificates.find(c => c.number.toLowerCase() === q.toLowerCase()) }; paint(); $('.c-ok,.c-error', app)?.scrollIntoView({ block: 'nearest' }); $('#verify input', app).focus({ preventScroll: true }); });
  app.addEventListener('click', e => { const b = e.target.closest('[data-cert]'); if (b) U.print(certDoc(D.certificates.find(c => c.id === b.dataset.cert))); });
  if (location.hash) { const el = document.getElementById(location.hash.slice(1)); if (el) { el.classList.add('hl'); el.scrollIntoView({ block: 'center' }); } }
}

/* ---------- buyer portal ---------- */
function portalPage() {
  const STAGES = ['Order placed', 'Payment confirmed', 'Packed', 'Shipped', 'Delivered'];
  const TABS = [['overview', 'Overview'], ['orders', 'Orders'], ['shipments', 'Shipments'], ['documents', 'Documents'], ['requests', 'Quotes and samples'], ['account', 'Account']];
  const DOCS = [['invoice', 'Proforma invoice'], ['packing', 'Packing list'], ['coa', 'Certificate of analysis']];
  let step = 0, phone = '', code = '', filter = 'all', confirmClear = false, sig = '';
  const stageOf = o => o.sample ? o.stage : Math.min(4, 1 + Math.floor((Date.now() - o.ts) / 60000));
  const all = () => [...store.get('orders', []), ...(D.demo ? D.sampleOrders : [])];
  const find = id => all().find(o => o.id === id);
  const cur = o => o.currency || 'INR';
  const items = o => orderLines(o).map(x => x.qty + ' x ' + x.name).join(', ');
  const chip = o => { const st = stageOf(o); return `<span class="c-status s${st}">${esc(t(STAGES[st]))}</span>`; };
  const route = () => { const [a, b] = location.hash.slice(1).split('/'); return a === 'order' && b ? { tab: 'order', id: decodeURIComponent(b) } : TABS.some(x => x[0] === a) ? { tab: a } : { tab: 'overview' }; };
  if (params.get('order') && !location.hash) history.replaceState(null, '', location.pathname + '#order/' + encodeURIComponent(params.get('order')));
  const row = o => `<a class="p-row" href="#order/${encodeURIComponent(o.id)}"><div><b>${esc(o.id)}</b><span>${esc(day(o.date))} · ${esc(items(o))}</span></div>${chip(o)}<b class="p-amt">${money(o.total, cur(o))}</b></a>`;
  const track = o => { const st = stageOf(o); return `<ol class="c-track">${STAGES.map((n, i) => `<li class="${i <= st ? 'done' : ''}"${i === st ? ' aria-current="step"' : ''}><span></span>${esc(t(n))}</li>`).join('')}</ol>`; };
  const events = o => o.tracking ? o.tracking : STAGES.slice(0, stageOf(o) + 1).map((n, i) => ({ date: new Date(o.ts + i * 60000).toISOString(), text: n }));
  const timeline = o => `<ol class="c-timeline">${events(o).map(x => `<li class="done"><time datetime="${esc(x.date)}">${esc(day(x.date))}</time><b>${esc(t(x.text))}</b></li>`).join('')}</ol>`;
  const shipments = () => all().filter(o => (o.mode !== 'retail' || stageOf(o) >= 3) && stageOf(o) >= 2);
  const dest = o => { const port = D.ports.find(p => p.id === o.port); const c = o.customer || {}; return port ? port.name : [c.city, c.country].filter(Boolean).join(', ') || t('Delivery address'); };

  function signin(focus) {
    let h = head('BUYER PORTAL', 'Your orders, in one place.', 'Track shipments, download documents, reorder in one tap.', 'Sign in is simulated. Orders are kept on this device, and sample orders show how a live account looks.');
    h += '<div class="c-split even">' + (step === 0 ? `<form class="c-form narrow" id="si" novalidate><label class="c-field"><span>${esc(t('Phone'))}</span><input name="phone" type="tel" required autocomplete="tel" pattern="[0-9+ \\-]{8,16}" value="${esc(phone)}"></label><p class="c-error" role="alert" hidden></p><button type="submit" class="cta"><span>${esc(t('Send code'))}</span><i>${arrow}</i></button></form>` : `<form class="c-form narrow" id="otp" novalidate><p class="c-fine">${esc(t('Code sent to {phone}.', { phone }))}${D.demo ? ' ' + esc(t('Demo code: {code}', { code })) : ''}</p><label class="c-field"><span>${esc(t('Code'))}</span><input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{4}" maxlength="4" required></label><label class="c-field"><span>${esc(t('Full name'))}</span><input name="name" required autocomplete="name" value="${esc(store.get('customer', {}).name || '')}"></label><p class="c-error" role="alert" hidden></p><button type="submit" class="cta"><span>${esc(t('Sign in'))}</span><i>${arrow}</i></button><button type="button" class="c-back" data-back>${esc(t('Back'))}</button></form>`);
    h += `<aside class="c-summary"><h2>${esc(t('In your portal'))}</h2><ul class="c-benefits">${['Live order and shipment status', 'Invoice, packing list and COA', 'Reorder in one tap', 'Lot traceability for every order'].map(x => `<li>${check}${esc(t(x))}</li>`).join('')}</ul></aside></div>`;
    app.innerHTML = h; if (focus) $('form input', app)?.focus();
  }

  /* predicts the next order from the buyer's own history: the average gap between orders of the same grade,
     or a typical cycle when there is only one order so far */
  function insights() {
    const os = all(); if (!os.length) return '';
    const by = {}; os.forEach(o => o.lines.forEach(l => { (by[l.g] = by[l.g] || []).push(o); }));
    const due = Object.entries(by).filter(([id]) => G(id)).map(([id, list]) => {
      const dates = list.map(o => new Date(o.date).getTime()).sort((a, b) => a - b), last = dates[dates.length - 1];
      const gap = dates.length > 1 ? (last - dates[0]) / (dates.length - 1) : (list[0].mode === 'export' ? 75 : list[0].mode === 'retail' ? 30 : 45) * 864e5;
      return { id, next: last + gap, last, order: list.find(o => new Date(o.date).getTime() === last), n: dates.length };
    }).sort((a, b) => a.next - b.next).slice(0, 2);
    const kg = os.reduce((n, o) => n + orderLines(o).reduce((m, x) => m + x.kg, 0), 0), fav = Object.entries(by).sort((a, b) => b[1].length - a[1].length)[0];
    const when = ts => { const d = Math.round((ts - Date.now()) / 864e5); return d <= 0 ? t('due now') : d <= 14 ? t('in about {n} days', { n: d }) : t('around {date}', { date: day(new Date(ts).toISOString()) }); };
    return `<section class="p-card p-smart"><header><h2>${esc(t('Coming up'))}</h2></header><ul class="p-docs">${due.map(x => `<li><span><b>${esc(G(x.id).name)} · ${esc(when(x.next))}</b><small>${esc(t(x.n > 1 ? 'Based on your order rhythm of {n} orders' : 'Based on your last order on {date}', { n: x.n, date: day(new Date(x.last).toISOString()) }))}</small></span><button type="button" class="btn" data-reorder="${esc(x.order.id)}">${esc(t('Reorder'))}</button></li>`).join('')}</ul><p class="p-insight">${esc(t('{kg} kg bought so far. Most ordered: {g}.', { kg: Math.round(kg).toLocaleString('en-IN'), g: fav && G(fav[0]) ? G(fav[0]).name : '-' }))}</p></section>`;
  }
  const screens = {
    overview(me) {
      const os = all(), active = os.filter(o => stageOf(o) < 4), last = os[0], quotes = store.get('quotes', []), samples = store.get('samples', []);
      return { title: t('Hello, {name}.', { name: me.name }), body:
        `<div class="p-tiles">${[['Active orders', active.length, '#orders'], ['Shipments on the way', shipments().filter(o => stageOf(o) < 4).length, '#shipments'], ['Documents', os.length * DOCS.length, '#documents'], ['Quotes and samples', quotes.length + samples.length, '#requests']].map(([l, n, href]) => `<a class="p-tile" href="${href}"><b>${n}</b><span>${esc(t(l))}</span></a>`).join('')}</div>` +
        (last ? `<section class="p-card"><header><h2>${esc(t('Latest order'))}</h2><a class="c-link" href="#order/${encodeURIComponent(last.id)}">${esc(t('Open'))}</a></header><p class="p-meta"><b>${esc(last.id)}</b> · ${esc(day(last.date))} · ${money(last.total, cur(last))}</p>${track(last)}<div class="c-actions"><button type="button" class="btn solid" data-reorder="${esc(last.id)}">${esc(t('Reorder'))}</button><a class="btn" href="#order/${encodeURIComponent(last.id)}">${esc(t('Track order'))}</a></div></section>` : '') +
        insights() +
        `<section class="p-card"><header><h2>${esc(t('Quick actions'))}</h2></header><div class="c-actions"><a class="btn" href="${esc(url('shop/index.html'))}">${esc(t('Shop cashews'))}</a><a class="btn" href="${esc(url('quote/index.html'))}">${esc(t('Instant quote'))}</a><a class="btn" href="${esc(url('trace/index.html'))}">${esc(t('Trace a lot'))}</a><a class="btn" href="${esc(url('certificates/index.html'))}">${esc(t('Certificates'))}</a></div></section>` };
    },
    orders() {
      const os = all().filter(o => filter === 'all' || (filter === 'active') === (stageOf(o) < 4));
      return { title: t('Orders'), body: `<div class="c-chips p-filter" role="group" aria-label="${esc(t('Filter orders'))}">${[['all', 'All'], ['active', 'Active'], ['done', 'Delivered']].map(([k, l]) => `<button type="button" class="c-chip-btn${filter === k ? ' on' : ''}" data-filter="${k}" aria-pressed="${filter === k}">${esc(t(l))}</button>`).join('')}</div><div class="p-list">${os.length ? os.map(row).join('') : `<p class="p-empty">${esc(t('No orders here yet.'))}</p>`}</div>` };
    },
    order(me, id) {
      const o = find(id); if (!o) return { title: t('Orders'), body: `<p class="p-empty">${esc(t('That order is not on this device.'))}</p><p><a class="c-link" href="#orders">${esc(t('All orders'))}</a></p>` };
      const L = orderLines(o), c = o.customer || {};
      return { title: o.id, back: true, body:
        `<p class="p-meta">${chip(o)} <span>${esc(day(o.date))} · ${money(o.total, cur(o))}</span></p>${track(o)}` +
        `<div class="p-two"><section class="p-card"><header><h2>${esc(t('Items'))}</h2></header><table class="c-table"><tbody>${L.map(x => `<tr><th scope="row">${esc(x.name)}<br><small>${x.qty} ${esc(x.unit)}</small></th><td class="num">${money(x.price * x.qty, cur(o))}</td></tr>`).join('')}${o.ship ? `<tr><th scope="row">${esc(t('Shipping'))}</th><td class="num">${money(o.ship, cur(o))}</td></tr>` : ''}<tr class="tot"><th scope="row">${esc(t('Total'))}</th><td class="num">${money(o.total, cur(o))}</td></tr></tbody></table><div class="c-actions"><button type="button" class="btn solid" data-reorder="${esc(o.id)}">${esc(t('Reorder'))}</button>${o.lot ? `<a class="btn" href="${esc(url('trace/index.html?lot=' + o.lot))}">${esc(t('Trace lot'))}</a>` : ''}</div></section>` +
        `<section class="p-card"><header><h2>${esc(t('Tracking'))}</h2></header>${timeline(o)}${o.sample ? `<p class="c-fine">${esc(t('Sample order, shown to preview a live account.'))}</p>` : D.demo ? `<p class="c-fine">${esc(t('Demo: the status moves forward one step every minute.'))}</p>` : ''}</section></div>` +
        `<div class="p-two"><section class="p-card"><header><h2>${esc(t('Documents'))}</h2></header><ul class="p-docs">${DOCS.map(([k, l]) => `<li><span>${esc(t(l))}</span><button type="button" class="btn" data-doc="${k}" data-id="${esc(o.id)}">${esc(t('Print or save'))}</button></li>`).join('')}</ul></section>` +
        `<section class="p-card"><header><h2>${esc(t('Delivery and payment'))}</h2></header>${table({ 'Deliver to': [c.name, c.company, c.address, [c.city, c.pin].filter(Boolean).join(' '), c.country].filter(Boolean).join(', ') || 'As per order', 'Payment': o.pay ? t(o.pay.method) + ', ' + t(o.pay.status) : 'As per agreed terms', 'Reference': o.pay ? o.pay.ref : o.id })}</section></div>` };
    },
    shipments() {
      const sh = shipments();
      return { title: t('Shipments'), body: sh.length ? sh.map(o => `<section class="p-card"><header><h2>${esc(o.id)}</h2>${chip(o)}</header><p class="p-route"><b>${esc(o.mode === 'export' ? D.loadingPort : 'Udupi')}</b><i aria-hidden="true">${arrow}</i><b>${esc(dest(o))}</b></p><p class="p-meta">${esc(items(o))}</p>${timeline(o)}<div class="c-actions"><a class="btn" href="#order/${encodeURIComponent(o.id)}">${esc(t('Order details'))}</a>${o.lot ? `<a class="btn" href="${esc(url('trace/index.html?lot=' + o.lot))}">${esc(t('Trace lot'))}</a>` : ''}</div></section>`).join('') : `<p class="p-empty">${esc(t('Nothing is on the way right now.'))}</p>` };
    },
    documents() {
      const os = all();
      return { title: t('Documents'), body: `<ul class="p-docs wide">${os.map(o => DOCS.map(([k, l]) => `<li><span><b>${esc(t(l))}</b><small>${esc(o.id)} · ${esc(day(o.date))}</small></span><button type="button" class="btn" data-doc="${k}" data-id="${esc(o.id)}">${esc(t('Print or save'))}</button></li>`).join('')).join('')}</ul><p class="c-fine"><a class="c-link" href="${esc(url('certificates/index.html'))}">${esc(t('Company certificates'))}</a></p>` };
    },
    requests() {
      const samples = store.get('samples', []), quotes = store.get('quotes', []);
      return { title: t('Quotes and samples'), body:
        `<section class="p-card"><header><h2>${esc(t('Quotes'))}</h2><a class="c-link" href="${esc(url('quote/index.html'))}">${esc(t('New quote'))}</a></header>${quotes.length ? `<ul class="p-docs wide">${quotes.map(x => `<li><span><b>${esc((G(x.g) || {}).name || '')} · ${x.cartons} ${esc(t('cartons'))} · ${esc(x.term)}</b><small>${esc(x.id)} · ${esc(day(x.date))} · ${usd(x.low)} ${esc(t('to'))} ${usd(x.high)}</small></span><a class="btn" href="${esc(url('quote/index.html?g=' + x.g + '&qty=' + x.cartons))}">${esc(t('Open'))}</a></li>`).join('')}</ul>` : `<p class="p-empty">${esc(t('No saved quotes yet.'))}</p>`}</section>` +
        `<section class="p-card"><header><h2>${esc(t('Samples'))}</h2><a class="c-link" href="${esc(url('quote/index.html?sample=1'))}">${esc(t('Book a sample'))}</a></header>${samples.length ? `<ul class="p-docs wide">${samples.map(x => `<li><span><b>${esc((G(x.g) || {}).name || '')} · 250 g</b><small>${esc(x.id)} · ${esc(day(x.date))}</small></span><span class="c-status">${esc(t('Booked'))}</span></li>`).join('')}</ul>` : `<p class="p-empty">${esc(t('No samples booked yet.'))}</p>`}</section>` };
    },
    account(me) {
      const c = store.get('customer', {}), f = (n, label, type = 'text', v = c[n] || '', extra = '') => `<label class="c-field"><span>${esc(t(label))}</span><input name="${n}" type="${type}" value="${esc(v)}" ${extra}></label>`;
      return { title: t('Account'), body: `<div class="p-two"><form class="p-card c-form" id="acct" novalidate><header><h2>${esc(t('Your details'))}</h2></header>${f('name', 'Full name', 'text', me.name, 'required autocomplete="name"')}${f('email', 'Email', 'email', c.email || '', 'autocomplete="email"')}${f('company', 'Company name', 'text', c.company || '', 'autocomplete="organization"')}${f('gstin', 'GSTIN', 'text', c.gstin || '', 'pattern="[0-9A-Za-z]{15}"')}${f('address', 'Address', 'text', c.address || '', 'autocomplete="street-address"')}<div class="c-row">${f('city', 'City', 'text', c.city || '', 'autocomplete="address-level2"')}${f('pin', 'PIN code', 'text', c.pin || '', 'inputmode="numeric" pattern="[0-9]{6}" autocomplete="postal-code"')}</div><p class="c-error" role="alert" hidden></p><button type="submit" class="btn solid">${esc(t('Save details'))}</button></form>` +
        `<section class="p-card"><header><h2>${esc(t('Sign in'))}</h2></header>${table({ 'Phone': me.phone, 'Language': (window.SKP_I18N.langs[U.lang] || 'English') })}<div class="c-actions"><button type="button" class="btn" data-out>${esc(t('Sign out'))}</button><button type="button" class="btn" data-clear>${esc(t(confirmClear ? 'Tap again to clear' : 'Clear portal data on this device'))}</button></div><p class="c-fine">${esc(t('Clearing removes your orders, quotes and samples from this browser.'))}</p></section></div>` };
    }
  };

  function render(focus) {
    const me = store.get('session'); if (!me) { signin(focus); return; }
    const r = route(), tab = r.tab === 'order' ? 'orders' : r.tab, s = screens[r.tab](me, r.id);
    sig = all().map(o => o.id + stageOf(o)).join('|');
    app.innerHTML = `<div class="p-app"><nav class="p-nav" aria-label="${esc(t('Buyer portal'))}"><p class="label">${esc(t('BUYER PORTAL'))}</p>${TABS.map(([k, l]) => `<a href="#${k}"${k === tab ? ' aria-current="page"' : ''}>${esc(t(l))}</a>`).join('')}</nav><div class="p-main">${s.back ? `<a class="c-link p-back" href="#orders">${esc(t('All orders'))}</a>` : ''}<h1 class="thin">${esc(s.title)}</h1>${s.body}</div></div>`;
    if (focus) { const h = $('h1', app); h.tabIndex = -1; h.focus({ preventScroll: true }); scrollTo(0, 0); }
  }
  render(false);
  addEventListener('hashchange', () => { confirmClear = false; render(true); });
  app.addEventListener('submit', e => {
    e.preventDefault(); const f = e.target, err = $('.c-error', f), bad = $$('input', f).find(i => !i.checkValidity());
    if (bad) { err.textContent = t('Please check: {field}', { field: $('span', bad.closest('label')).textContent }); err.hidden = false; bad.setAttribute('aria-invalid', 'true'); bad.focus(); return; }
    if (f.id === 'si') { phone = f.phone.value.trim(); code = String(1000 + Math.floor(Math.random() * 9000)); step = 1; signin(true); }
    else if (f.id === 'otp') { if (f.code.value !== code) { err.textContent = t('That code does not match. Try again.'); err.hidden = false; f.code.focus(); return; } store.set('session', { name: f.name.value.trim(), phone }); step = 0; render(true); }
    else if (f.id === 'acct') { const d = Object.fromEntries(new FormData(f)); store.set('customer', { ...store.get('customer', {}), ...d }); store.set('session', { ...store.get('session'), name: d.name.trim() }); toast(t('Details saved')); }
  });
  app.addEventListener('click', e => {
    if (e.target.closest('[data-back]')) { step = 0; signin(true); return; }
    if (e.target.closest('[data-out]')) { store.del('session'); step = 0; history.replaceState(null, '', location.pathname); signin(true); return; }
    if (e.target.closest('[data-clear]')) { if (!confirmClear) { confirmClear = true; render(false); $('[data-clear]', app).focus(); return; } ['orders', 'quotes', 'samples'].forEach(k => store.del(k)); confirmClear = false; toast(t('Portal data cleared')); render(false); return; }
    const fl = e.target.closest('[data-filter]'); if (fl) { filter = fl.dataset.filter; render(false); $(`[data-filter="${filter}"]`, app).focus(); return; }
    const d = e.target.closest('[data-doc]'); if (d) { const o = find(d.dataset.id); if (o) U.print(docFor(d.dataset.doc, o)); return; }
    const ro = e.target.closest('[data-reorder]'); if (ro) { const o = find(ro.dataset.reorder); if (!o) return;
      if (o.mode === 'export') { location.assign(url('quote/index.html?g=' + o.lines[0].g + '&qty=' + o.lines[0].qty)); return; }
      o.lines.forEach(l => { if (!G(l.g)) return; const mode = l.mode || 'wholesale', p = l.pack || D.packing[0].id; cart.add({ k: (mode === 'retail' ? 'r|' : 'w|') + l.g + '|' + p, mode, g: l.g, pack: p, qty: l.qty }); });
      location.assign(url('cart/index.html')); }
  });
  setInterval(() => { if (!store.get('session') || document.hidden || /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.nodeName)) return; if (all().map(o => o.id + stageOf(o)).join('|') !== sig && route().tab !== 'account') render(false); }, 5000);
}


/* ---------- careers ---------- */
function careersPage() {
  const FITS = [['floor', 'Hands-on production'], ['quality', 'Testing and quality'], ['engineering', 'Machines and fixing'], ['trade', 'Selling and trade'], ['outdoors', 'Out in the field'], ['office', 'Numbers and office']];
  const GENERAL = { id: 'general', title: 'General application', team: 'Any team', place: 'Udupi', type: '', exp: '' };
  let fit = '', open = location.hash.startsWith('#role-') ? location.hash.slice(6) : '';
  const apply = {};                    /* per role: { step, data, ref } */
  const job = id => id === 'general' ? GENERAL : D.jobs.find(j => j.id === id);
  const tick = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2"/></svg>';
  const field = (n, label, type, extra = '', v = '') => `<label class="c-field"><span>${esc(t(label))}</span><input name="${n}" type="${type}" value="${esc(v)}" ${extra}></label>`;
  const choose = (n, label, opts, v = '') => `<label class="c-field"><span>${esc(t(label))}</span><select name="${n}" required><option value="">${esc(t('Choose'))}</option>${opts.map(o => `<option${o === v ? ' selected' : ''}>${esc(t(o))}</option>`).join('')}</select></label>`;
  function appText(j, d, ref) { return [`Job application ${ref}`, `Role: ${j.title}${j.place ? ', ' + j.place : ''}`, `Name: ${d.name}`, `Phone: ${d.phone}`, d.email ? `Email: ${d.email}` : '', `Town: ${d.town}`, `Experience: ${d.years}`, d.current ? `Current or last role: ${d.current}` : '', `Can join: ${d.notice}`, d.note ? `Note: ${d.note}` : '', '', 'I will attach my CV in this chat.'].filter(x => x !== '').join('\n'); }
  function form(id) {
    const a = apply[id], j = job(id), d = a.data;
    const head2 = `<ol class="c-steps k-steps-mini">${['Your details', 'Experience', 'Send'].map((n, i) => `<li class="${i < a.step - 1 ? 'done' : i === a.step - 1 ? 'on' : ''}"${i === a.step - 1 ? ' aria-current="step"' : ''}><span>${i + 1}</span>${esc(t(n))}</li>`).join('')}</ol>`;
    if (a.step === 1) return `<form class="k-apply c-form" data-role="${id}" data-stage="1" novalidate>${head2}<div class="c-row">${field('name', 'Full name', 'text', 'required autocomplete="name"', d.name)}${field('phone', 'Phone', 'tel', 'required autocomplete="tel" inputmode="tel" pattern="[0-9+ \\-]{8,16}"', d.phone)}</div><div class="c-row">${field('email', 'Email (optional)', 'email', 'autocomplete="email"', d.email)}${field('town', 'Town or city', 'text', 'required autocomplete="address-level2"', d.town)}</div><p class="c-error" role="alert" hidden></p><div class="c-actions"><button type="submit" class="btn solid">${esc(t('Next'))}</button><button type="button" class="c-link" data-cancel="${id}">${esc(t('Cancel'))}</button></div></form>`;
    if (a.step === 2) return `<form class="k-apply c-form" data-role="${id}" data-stage="2" novalidate>${head2}<div class="c-row">${choose('years', 'Experience', ['Fresher', '1 to 2 years', '3 to 5 years', '6 years or more'], d.years)}${choose('notice', 'Can join', ['Immediately', 'Within 15 days', 'Within 30 days', 'After 30 days'], d.notice)}</div>${field('current', 'Current or last role (optional)', 'text', 'maxlength="80"', d.current)}<label class="c-field"><span>${esc(t('Anything we should know? (optional)'))}</span><textarea name="note" rows="3" maxlength="300">${esc(d.note || '')}</textarea></label><p class="c-error" role="alert" hidden></p><div class="c-actions"><button type="submit" class="btn solid">${esc(t('Review and send'))}</button><button type="button" class="c-link" data-back-step="${id}">${esc(t('Back'))}</button></div></form>`;
    return `<div class="k-apply k-sent" data-role="${id}"><span class="c-tick">${tick}</span><h3 class="thin" tabindex="-1">${esc(t('Almost there, {name}.', { name: d.name.split(' ')[0] }))}</h3><p>${esc(t('Send your application to the SKP team on WhatsApp and attach your CV in the same chat.'))}</p><p class="c-fine">${esc(t('Reference {id}', { id: a.ref }))} · ${esc(j.title)}</p><div class="c-actions"><a class="cta yellow" target="_blank" rel="noopener" href="${esc(wa(appText(j, d, a.ref)))}"><span>${esc(t('Send on WhatsApp'))}</span><i>${arrow}</i></a>${D.careersEmail ? `<a class="btn" href="mailto:${esc(D.careersEmail)}?subject=${encodeURIComponent('Job application ' + a.ref + ': ' + j.title)}&body=${encodeURIComponent(appText(j, d, a.ref))}">${esc(t('Send by email'))}</a>` : ''}<button type="button" class="c-link" data-edit="${id}">${esc(t('Edit details'))}</button></div></div>`;
  }
  function roleHtml(j) {
    const isOpen = open === j.id;
    return `<article class="k-role${isOpen ? ' open' : ''}" id="role-${j.id}"><button type="button" class="k-role-head" aria-expanded="${isOpen}" aria-controls="rb-${j.id}"><span><b>${esc(t(j.title))}</b><span>${esc(t(j.team))} · ${esc(j.place)} · ${esc(t(j.type))} · ${esc(t(j.exp))}</span></span><i aria-hidden="true"></i></button><div class="k-role-body" id="rb-${j.id}"${isOpen ? '' : ' hidden'}>${apply[j.id] ? form(j.id) : `<p class="k-about">${esc(t(j.about))}</p><div class="k-cols"><div><h4>${esc(t("What you'll do"))}</h4><ul>${j.do.map(x => `<li>${esc(t(x))}</li>`).join('')}</ul></div><div><h4>${esc(t('What you bring'))}</h4><ul>${j.bring.map(x => `<li>${esc(t(x))}</li>`).join('')}</ul></div></div><div class="c-actions"><button type="button" class="btn solid" data-apply="${j.id}">${esc(t('Apply for this role'))}</button><button type="button" class="c-link" data-share="${j.id}">${esc(t('Share role'))}</button></div>`}</div></article>`;
  }
  function paint() {
    const list = D.jobs.filter(j => !fit || j.fit === fit);
    app.innerHTML = head('CAREERS', 'Grow with SKP.', 'Roles on the processing floor, in the lab, on export desks and in the field. Most are in Udupi, where SKP began in 2012.', 'Openings shown are examples until SKP adds its current roles. Applications go to SKP on WhatsApp.') +
      `<div class="k-band">${[['factory.webp', 'Processing'], ['harvest.webp', 'Procurement'], ['trade.webp', 'Export']].map(([f, l]) => `<figure><img src="${esc(url('assets/' + f))}" alt="" loading="lazy" width="600" height="400"><figcaption>${esc(t(l))}</figcaption></figure>`).join('')}</div>` +
      `<div class="k-why">${[['Learn a craft', 'Cashew processing is skilled work. You learn it from people who have done it for years.'], ['Grow across the group', 'Six businesses, from cashews and agriculture to infrastructure and trade, means room to move.'], ['Work close to home', 'Most roles are in Udupi and coastal Karnataka, near the people and places you know.']].map(([h, p], i) => `<article><span class="num">0${i + 1}</span><h2>${esc(t(h))}</h2><p>${esc(t(p))}</p></article>`).join('')}</div>` +
      `<section class="k-fit" aria-labelledby="fit-h"><h2 id="fit-h">${esc(t('What do you enjoy most?'))}</h2><div class="c-chips" role="group" aria-label="${esc(t('Filter roles'))}">${FITS.map(([k, l]) => `<button type="button" class="c-chip-btn${fit === k ? ' on' : ''}" data-fit="${k}" aria-pressed="${fit === k}">${esc(t(l))}</button>`).join('')}</div></section>` +
      `<section class="k-roles" id="roles" aria-labelledby="roles-h"><header><h2 id="roles-h" class="thin">${esc(t('Open roles'))}</h2><p aria-live="polite">${esc(t(list.length === 1 ? '{n} role' : '{n} roles', { n: list.length }))}${fit ? ` · <button type="button" class="c-link" data-fit="">${esc(t('Show all'))}</button>` : ''}</p></header>${list.map(roleHtml).join('')}</section>` +
      `<section class="k-process" aria-labelledby="proc-h"><h2 id="proc-h" class="thin">${esc(t('How hiring works'))}</h2><ol>${[['Apply', 'Two short steps, then send it with your CV on WhatsApp.'], ['A call', 'Someone from the team calls to know you better.'], ['Meet us', 'Visit the unit in Udupi and meet the people you would work with.'], ['Offer', 'We share the offer and agree a joining date with you.']].map(([h, p], i) => `<li><span>${i + 1}</span><b>${esc(t(h))}</b><p>${esc(t(p))}</p></li>`).join('')}</ol></section>` +
      `<section class="k-general" aria-labelledby="gen-h"><div><h2 id="gen-h" class="thin">${esc(t("Don't see your role?"))}</h2><p>${esc(t('Tell us what you do well. We keep every application and call when something fits.'))}</p></div><div class="k-general-body">${apply.general ? form('general') : `<button type="button" class="btn solid" data-apply="general">${esc(t('Send a general application'))}</button>`}</div></section>`;
  }
  const refocus = sel => { const el = $(sel, app); if (el) { el.focus({ preventScroll: true }); el.closest('.k-role,.k-general')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } };
  paint();
  if (open && job(open)) setTimeout(() => $('#role-' + open, app)?.scrollIntoView({ block: 'start' }), 60);
  app.addEventListener('click', e => {
    const h = e.target.closest('.k-role-head'); if (h) { const id = h.closest('.k-role').id.slice(5); open = open === id ? '' : id; history.replaceState(null, '', open ? '#role-' + open : location.pathname); paint(); refocus(`#role-${id} .k-role-head`); return; }
    const f = e.target.closest('[data-fit]'); if (f) { fit = fit === f.dataset.fit ? '' : f.dataset.fit; paint(); refocus(fit ? `[data-fit="${fit}"]` : '.k-fit [data-fit]'); return; }
    const a = e.target.closest('[data-apply]'); if (a) { const id = a.dataset.apply; apply[id] = { step: 1, data: { ...store.get('applicant', {}) } }; if (id !== 'general') open = id; paint(); refocus(`.k-apply[data-role="${id}"] input`); return; }
    const c = e.target.closest('[data-cancel]'); if (c) { delete apply[c.dataset.cancel]; paint(); refocus(`[data-apply="${c.dataset.cancel}"]`); return; }
    const b = e.target.closest('[data-back-step]'); if (b) { apply[b.dataset.backStep].step = 1; paint(); refocus(`.k-apply[data-role="${b.dataset.backStep}"] input`); return; }
    const ed = e.target.closest('[data-edit]'); if (ed) { apply[ed.dataset.edit].step = 1; paint(); refocus(`.k-apply[data-role="${ed.dataset.edit}"] input`); return; }
    const sh = e.target.closest('[data-share]'); if (sh) { const link = location.origin + location.pathname + '#role-' + sh.dataset.share, j = job(sh.dataset.share); (navigator.share ? navigator.share({ title: j.title + ' at SKP Group', url: link }) : navigator.clipboard.writeText(link).then(() => toast(t('Link copied')))).catch(() => {}); }
  });
  app.addEventListener('input', e => { const fm = e.target.closest('.k-apply'); if (!fm) return; e.target.removeAttribute('aria-invalid'); const err = $('.c-error', fm); if (err && !$$('[aria-invalid]', fm).length) err.hidden = true; });
  app.addEventListener('submit', e => {
    const fm = e.target.closest('.k-apply'); if (!fm) return; e.preventDefault();
    const id = fm.dataset.role, a = apply[id], err = $('.c-error', fm), bad = $$('input,select,textarea', fm).find(i => !i.checkValidity());
    $$('[aria-invalid]', fm).forEach(i => i.removeAttribute('aria-invalid'));
    if (bad) { err.textContent = t('Please check: {field}', { field: $('span', bad.closest('label')).textContent }); err.hidden = false; bad.setAttribute('aria-invalid', 'true'); bad.focus(); return; }
    Object.assign(a.data, Object.fromEntries(new FormData(fm)));
    if (fm.dataset.stage === '1') { store.set('applicant', { name: a.data.name, phone: a.data.phone, email: a.data.email, town: a.data.town }); a.step = 2; paint(); refocus(`.k-apply[data-role="${id}"] select`); return; }
    a.step = 3; a.ref = a.ref || uid('JOB');
    store.set('applications', [{ ref: a.ref, role: job(id).title, date: new Date().toISOString() }, ...store.get('applications', []).filter(x => x.ref !== a.ref)]);
    paint(); refocus(`.k-apply[data-role="${id}"] h3`);
  });
}

({ shop, product, cart: cartPage, quote: quotePage, trace: tracePage, certificates: certPage, portal: portalPage, careers: careersPage })[app.dataset.app]?.();
})();
