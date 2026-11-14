/* Ask SKP: an assistant that answers from SKP's own data (grades, prices, ports, lots, orders, certificates).
   It runs entirely in the page. Anything it cannot answer goes to the SKP team on WhatsApp with the question filled in. */
(() => {
'use strict';
const U = window.SKPU, D = window.SKP; if (!U || !D) return;
const { $, $$, esc, store, url, t } = U;
const G = id => D.grades.find(g => g.id === id);
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const usd = (n, d = 0) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const day = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const cartonPrice = g => Math.round(g.wholesalePerKg * D.cartonKg / 10) * 10;
const STAGES = ['Order placed', 'Payment confirmed', 'Packed', 'Shipped', 'Delivered'];
const wa = text => 'https://wa.me/' + D.whatsapp + '?text=' + encodeURIComponent(text);

/* ---------- understanding a question ---------- */
const GRADE_WORDS = [['w180', /\bw\s?-?180\b|\b180\b/], ['w240', /\bw\s?-?240\b|\b240\b/], ['w320', /\bw\s?-?320\b|\b320\b/], ['splits', /\bsplits?\b/], ['pieces', /\bpieces?\b|\blwp\b|\bbroken\b/]];
const USES = [['w180', /gift|premium|hamper|hotel|festival|diwali/], ['splits', /sweet|mithai|bakery|baking|cake|biscuit/], ['pieces', /gravy|gravies|curry|restaurant|catering|food service|kitchen|paste/], ['w320', /snack|everyday|retail pack|supermarket|grocery/], ['w240', /roast|flavour|flavor|salted|masala/]];
function grade(q) { const m = GRADE_WORDS.find(([, r]) => r.test(q)); return m ? G(m[0]) : null; }
const wordIn = (q, w) => new RegExp('(^|[^a-z])' + w.toLowerCase().replace(/[^a-z ]/g, '') + '([^a-z]|$)').test(q);
function port(q) { return D.ports.find(p => [p.name.split(',')[0], p.id, p.name.split(', ')[1] || ''].some(w => w && wordIn(q, w))) || (/\bdubai\b/.test(q) ? D.ports.find(p => p.id === 'AEJEA') : null); }
function num(q) { const m = q.match(/(\d[\d,]*)\s*(cartons?|ctns?|boxes)/); return m ? Number(m[1].replace(/,/g, '')) : 0; }
function orders() { return [...store.get('orders', []), ...(D.demo ? D.sampleOrders : [])]; }
function stageOf(o) { return o.sample ? o.stage : Math.min(4, 1 + Math.floor((Date.now() - o.ts) / 60000)); }
const link = (label, href) => ({ label, href });

function answer(raw) {
  const q = ' ' + raw.toLowerCase().replace(/[?.!]/g, ' ') + ' ';
  const g = grade(q), p = port(q), n = num(q);
  const lotId = (raw.match(/skp-demo-\d{4}|skp-[a-z]{2,6}-\d{3,6}/i) || [])[0];
  const order = orders().find(o => q.includes(o.id.toLowerCase()));

  if (order) {
    const st = stageOf(order), last = order.tracking ? order.tracking[order.tracking.length - 1] : null;
    return { text: `Order ${order.id} is at "${STAGES[st]}"${last ? `. Latest update on ${day(last.date)}: ${last.text}.` : '.'}`, links: [link('Open the order', url('portal/index.html#order/' + encodeURIComponent(order.id)))] };
  }
  if (lotId) {
    const lot = D.lots.find(l => l.id.toLowerCase() === lotId.toLowerCase());
    if (!lot) return { text: `I could not find lot ${lotId.toUpperCase()}. Check the number printed under the QR on the carton.`, links: [link('Trace a lot', url('trace/index.html'))] };
    const lg = G(lot.grade), lastStep = lot.steps[lot.steps.length - 1];
    return { text: `Lot ${lot.id} is ${lg.name}, ${lot.cartons} cartons. Status: ${lot.status}. Last step: ${lastStep.title} on ${day(lastStep.date)}. Moisture tested at ${lot.qc.Moisture}.`, links: [link('See the full journey', url('trace/index.html?lot=' + lot.id))] };
  }
  if (/\b(hi|hello|hey|namaste|namaskara)\b/.test(q) && q.trim().split(/\s+/).length <= 3) return { text: 'Hello. Ask me about grades, prices, shipping to your port, a lot number or your order.' };
  if (/which grade|what grade|best grade|recommend|suggest|suitable|good for|use for/.test(q) || USES.some(([, r]) => r.test(q)) && !g) {
    const u = USES.find(([, r]) => r.test(q));
    if (u) { const r = G(u[0]); return { text: `For that, most buyers choose ${r.name} (${r.title}). It is used for ${r.use}. ${r.line}`, links: [link('See ' + r.name, url('product/index.html?g=' + r.id)), link('Find my grade', url('shop/index.html#finder'))] }; }
    return { text: 'Tell me what the cashews are for (gifting, snacking, sweets, gravies or roasting) and I will suggest a grade. Or use the grade finder.', links: [link('Find my grade', url('shop/index.html#finder'))] };
  }
  if (/differen|compare|vs\b|versus/.test(q)) return { text: 'Wholes are graded by count: W180 has about 180 kernels per pound, so the bigger the number, the smaller the kernel. Splits are kernels split lengthwise; pieces are broken smaller. ' + D.grades.map(x => `${x.name}: ${x.bestFor.toLowerCase()}`).join('. ') + '.', links: [link('Compare all grades', url('shop/index.html#compare'))] };
  if (/price|cost|rate|how much|per kg|per lb|quote/.test(q)) {
    if (g) return { text: `${g.name}: ${inr(g.retailPerKg)} per kg retail, ${inr(cartonPrice(g))} per ${D.cartonKg} kg carton wholesale, and about ${usd(g.fobUsdPerLb, 2)} per lb FOB for export.`, links: [link('Buy ' + g.name, url('product/index.html?g=' + g.id)), link('Export quote', url('quote/index.html?g=' + g.id + (n ? '&qty=' + n : '')))] };
    return { text: 'Retail per kg: ' + D.grades.map(x => `${x.name} ${inr(x.retailPerKg)}`).join(', ') + '. For export, the instant quote gives a range for your quantity and port.', links: [link('Shop', url('shop/index.html')), link('Export quote', url('quote/index.html'))] };
  }
  if (/ship|deliver|transit|reach|arriv|how long|lead time|when/.test(q) || p) {
    if (p) { const load = addDays(D.leadDays), arrive = new Date(load); arrive.setDate(arrive.getDate() + p.days); return { text: `To ${p.name}: about ${D.leadDays} days to load at ${D.loadingPort}, then about ${p.days} days at sea. An order placed today would arrive around ${day(arrive)}.`, links: [link('Quote to ' + p.name.split(',')[0], url('quote/index.html' + (g ? '?g=' + g.id : '')))] }; }
    return { text: `Within India, retail orders dispatch from Udupi in 2 to 3 days. Export orders load at ${D.loadingPort} about ${D.leadDays} days after confirmation. Tell me your port and I will estimate the arrival date.`, links: [link('Export quote', url('quote/index.html'))] };
  }
  if (/container|fcl|20 ?ft|40 ?ft|how many cartons|load/.test(q)) {
    const mt20 = (D.cartonsPerFcl20 * D.cartonKg / 1000).toFixed(1);
    let text = `A 20 ft container holds ${D.cartonsPerFcl20} cartons (about ${mt20} MT). A 40 ft holds about ${D.cartonsPerFcl40}.`;
    if (n) { const boxes = Math.ceil(n / D.cartonsPerFcl20), fill = Math.round(n / (boxes * D.cartonsPerFcl20) * 100); text += ` ${n} cartons fill ${boxes} x 20 ft to ${fill}%.` + (fill < 100 ? ` Adding ${boxes * D.cartonsPerFcl20 - n} cartons fills it and lowers freight per kg.` : ''); }
    return { text, links: [link('Plan my container', url('quote/index.html' + (g ? '?g=' + g.id : '') + (n ? (g ? '&' : '?') + 'qty=' + n : '')))] };
  }
  if (/minimum|moq|smallest|least/.test(q)) return { text: `Retail: from a single 250 g pouch. Wholesale in India: from ${D.wholesaleMinCartons} cartons of ${D.cartonKg} kg. Export: from ${D.minExportCartons} cartons, with full containers giving the best freight rate.`, links: [link('Shop', url('shop/index.html'))] };
  if (/certif|fssai|iso|haccp|licen|complian|iec|halal|organic/.test(q)) return { text: 'Certificates on record: ' + D.certificates.map(c => c.name).join(', ') + '. Each can be verified by number and saved as a PDF.', links: [link('Open certificates', url('certificates/index.html'))] };
  if (/trace|traceab|lot|batch|origin|where.*from/.test(q)) return { text: 'Every carton carries a QR code. Scan it or type the lot number to see where the nuts came from, every processing step, the quality checks and the certificates.', links: [link('Trace a lot', url('trace/index.html'))] };
  if (/sample/.test(q)) return { text: `You can book a 250 g sample of any grade, sent by courier.${g ? ` I will start it with ${g.name}.` : ''}`, links: [link('Book a sample', url('quote/index.html?sample=1' + (g ? '&g=' + g.id : '')))] };
  if (/shelf|store|storage|expiry|keep|fresh/.test(q)) return { text: 'Sealed, the kernels keep for 12 months in a cool, dry place. Once opened, keep them in an airtight jar, or in the fridge in hot weather.' };
  if (/pack|tin|vacuum|pouch|carton/.test(q)) return { text: 'Retail: 250 g, 500 g and 1 kg pouches. Wholesale and export: ' + D.packing.map(x => `${x.label} (${x.detail})`).join('; ') + '.' };
  if (/pay|upi|lc\b|letter of credit|advance|card|bank/.test(q)) return { text: 'Payment: ' + D.payment + '.' };
  if (/job|career|hiring|vacanc|opening|work at|work for|apply|recruit|naukri|employment/.test(q)) return { text: `SKP is hiring for ${D.jobs.length} roles, including ${D.jobs.slice(0, 3).map(j => j.title).join(', ')}. Most are in Udupi. You can apply in two short steps and send your CV on WhatsApp.`, links: [link('See open roles', url('careers/index.html'))] };
  if (/order|track|status|where is my/.test(q)) return { text: 'Your orders and shipments are in the buyer portal. Or type your order number here, like SKP-EX-1042.', links: [link('Open buyer portal', url('portal/index.html'))] };
  if (/contact|call|phone|whatsapp|talk|speak|human|person|email|address|visit/.test(q)) return { text: `Call ${D.phones.join(' or ')}, or message the team on WhatsApp. SKP is at Billadi, Vandaru, Udupi 576223.`, links: [link('Message on WhatsApp', wa('Hello SKP')), link('Contact page', url('contact/index.html'))] };
  if (g) return { text: `${g.name} (${g.title}): ${g.line} ${g.count}. ${inr(g.retailPerKg)} per kg retail.`, links: [link('See ' + g.name, url('product/index.html?g=' + g.id))] };
  return { text: 'I do not have that answer yet. I can pass your question to the SKP team on WhatsApp.', links: [link('Ask the team', wa('Question from the SKP website: ' + raw))], miss: true };
}
window.SKP_ASK = answer;

/* ---------- the panel ---------- */
const SUGGEST = ['Price of W320?', 'Which grade for sweets?', 'Delivery time to Rotterdam?', 'How many cartons in a container?', 'Trace SKP-DEMO-0001', 'Where is my order SKP-EX-1042?'];
const icon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8.5 8.5h7M8.5 11.5h4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const panel = document.createElement('section');
panel.className = 'ask-panel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', t('Ask SKP'));
if (U.lang === 'ar') panel.dir = 'rtl';
panel.innerHTML = `<header><div><b>${esc(t('Ask SKP'))}</b><span>${esc(t('Answers from SKP data, instantly'))}</span></div><button type="button" class="ask-close">${esc(t('Close'))}</button></header><div class="ask-log" role="log" aria-live="polite"></div><div class="ask-suggest"></div><form class="ask-form"><label class="sr-only" for="ask-in">${esc(t('Type your question'))}</label><input id="ask-in" autocomplete="off" placeholder="${esc(t('Type your question'))}" maxlength="200"><button type="submit" aria-label="${esc(t('Send'))}"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.6"/></svg></button></form>${D.demo ? `<p class="ask-note">${esc(t('Prices and records shown are demo data.'))}</p>` : ''}`;
document.body.append(panel);
let opener = null;
const log = $('.ask-log', panel), input = $('#ask-in', panel), sug = $('.ask-suggest', panel);
const history = store.get('ask', []);
function bubble(who, text, links) {
  const m = document.createElement('div'); m.className = 'ask-msg ' + who;
  const p = document.createElement('p'); p.textContent = text; m.append(p);
  if (links && links.length) { const row = document.createElement('div'); row.className = 'ask-links'; links.forEach(l => { const a = document.createElement('a'); a.href = l.href; a.textContent = l.label; if (/^https:\/\/wa\.me/.test(l.href)) { a.target = '_blank'; a.rel = 'noopener'; } row.append(a); }); m.append(row); }
  log.append(m); log.scrollTop = log.scrollHeight;
}
function suggestions() { sug.innerHTML = SUGGEST.map(s => `<button type="button">${esc(s)}</button>`).join(''); }
function ask(qText) {
  qText = qText.trim(); if (!qText) return;
  bubble('me', qText);
  const a = answer(qText);
  const typing = document.createElement('div'); typing.className = 'ask-msg bot typing'; typing.innerHTML = '<span></span><span></span><span></span>'; typing.setAttribute('aria-label', t('Typing')); log.append(typing); log.scrollTop = log.scrollHeight;
  setTimeout(() => { typing.remove(); bubble('bot', a.text, a.links); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 380);
  history.push({ q: qText }); store.set('ask', history.slice(-12));
  sug.hidden = true;
}
function open() {
  if (!log.childElementCount) { bubble('bot', t('Hello. I can answer questions on grades, prices, shipping, lots and orders.')); suggestions(); }
  const mega = document.querySelector('.mega-menu'); if (mega && !mega.hidden) document.querySelector('.menu-close')?.click();
  opener = document.activeElement; $$('[data-ask]').forEach(b => b.setAttribute('aria-expanded', 'true'));
  panel.hidden = false; document.body.classList.add('ask-open'); input.focus();
}
function close() { panel.hidden = true; $$('[data-ask]').forEach(b => b.setAttribute('aria-expanded', 'false')); document.body.classList.remove('ask-open'); opener?.focus?.({ preventScroll: true }); }
$('.ask-close', panel).addEventListener('click', close);
$('.ask-form', panel).addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; ask(v); });
sug.addEventListener('click', e => { const b = e.target.closest('button'); if (b) ask(b.textContent); });
panel.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
document.addEventListener('click', e => { const a = e.target.closest('[data-ask]'); if (a) { e.preventDefault(); if (!panel.hidden && !a.dataset.ask) { close(); return; } open(); if (a.dataset.ask) ask(a.dataset.ask); } });

/* ---------- suggest the visitor's own language, once ---------- */
const LANGS = (window.SKP_I18N || {}).langs || {};
try {
  if (U.lang === 'en' && !store.get('lang', null) && !store.get('langAsked', false)) {
    const want = (navigator.languages || [navigator.language]).map(l => String(l).slice(0, 2)).find(l => l !== 'en' && LANGS[l]);
    if (want) {
      const bar = document.createElement('div'); bar.className = 'lang-hint'; bar.setAttribute('role', 'status'); bar.lang = want;
      bar.innerHTML = `<span>${esc(LANGS[want])}?</span><button type="button" data-yes>${esc({ kn: 'ಕನ್ನಡದಲ್ಲಿ ನೋಡಿ', hi: 'हिन्दी में देखें', ar: 'اعرض بالعربية', de: 'Auf Deutsch ansehen' }[want] || LANGS[want])}</button><button type="button" data-no aria-label="Close">×</button>`;
      document.body.append(bar);
      bar.addEventListener('click', e => { if (e.target.closest('[data-yes]')) { store.set('lang', want); location.reload(); } else if (e.target.closest('[data-no]')) { store.set('langAsked', true); bar.remove(); } });
    }
  }
} catch {}
})();
