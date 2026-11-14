/* SKP shared layer: language, cart, search, install, reading aids. Loaded on every page. */
(() => {
'use strict';
const rootURL = new URL(document.querySelector('meta[name=skp-root]')?.content || './', location.href);
const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('skp:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('skp:' + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem('skp:' + k); } catch {} }
};
const url = p => new URL(p, rootURL).href;

/* ---------- language ---------- */
const I = window.SKP_I18N || { langs: { en: 'English' }, order: [], dict: {} };
let lang = store.get('lang', 'en'); if (!I.langs[lang]) lang = 'en';
const li = I.order.indexOf(lang);
const lower = {}; for (const k in I.dict) lower[k.toLowerCase()] = I.dict[k];
function t(s, vars) {
  let out = s;
  if (lang !== 'en') { const e = I.dict[s] || lower[String(s).toLowerCase()]; if (e && e[li]) out = e[li]; }
  if (vars) for (const k in vars) out = out.split('{' + k + '}').join(vars[k]);
  return out;
}
function translateDom(scope = document.body) {
  if (lang === 'en') return;
  const w = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, { acceptNode: n => /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName) || !n.nodeValue.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => { const raw = n.nodeValue, key = raw.trim().replace(/\s+/g, ' '), tr = t(key); if (tr !== key) n.nodeValue = raw.replace(raw.trim(), tr); });
  $$('[placeholder],[aria-label]', scope).forEach(el => ['placeholder', 'aria-label'].forEach(a => { const v = el.getAttribute(a); if (v) { const tr = t(v); if (tr !== v) el.setAttribute(a, tr); } }));
}
document.documentElement.lang = lang;
document.documentElement.classList.add('lang-' + lang);
if (lang === 'ar') $$('[data-app],.sk-rtl').forEach(el => el.setAttribute('dir', 'rtl'));
translateDom();
const langToggle = $('.language-toggle'), langList = $('.language-list');
if (langToggle && langList) {
  const node = [...langToggle.childNodes].find(n => n.nodeType === 3 && n.nodeValue.trim());
  if (node) node.nodeValue = lang.toUpperCase() + ' ';
  langToggle.setAttribute('aria-label', 'Language: ' + I.langs[lang]);
  langToggle.setAttribute('aria-haspopup', 'true');
  $$('[data-lang]', langList).forEach(b => {
    const on = b.dataset.lang === lang; b.setAttribute('aria-pressed', String(on));
    b.addEventListener('click', () => { store.set('lang', b.dataset.lang); location.reload(); });
  });
  document.addEventListener('click', e => { if (!langList.hidden && !e.target.closest('.language')) { langList.hidden = true; langToggle.setAttribute('aria-expanded', 'false'); } });
}

/* ---------- cart ---------- */
const cart = {
  get() { return store.get('cart', []); },
  set(lines) { store.set('cart', lines.filter(l => l.qty > 0)); paintCart(); document.dispatchEvent(new CustomEvent('skp:cart')); },
  add(line) { const lines = cart.get(), f = lines.find(l => l.k === line.k); if (f) f.qty += line.qty; else lines.push(line); cart.set(lines); },
  clear() { cart.set([]); },
  count() { return cart.get().reduce((n, l) => n + l.qty, 0); }
};
function paintCart() {
  const n = cart.count();
  $$('[data-cart-count]').forEach(el => { el.textContent = n; el.hidden = !n; });
  $$('.nav-cart,.cart-fab,.app-cart').forEach(el => el.setAttribute('aria-label', t('Cart') + (n ? ', ' + n : '')));
  const fab = $('.cart-fab'); if (fab) fab.hidden = !n || document.body.dataset.page === '/cart/';
}
addEventListener('storage', paintCart);

/* ---------- toast and print ---------- */
let toastTimer;
function toast(msg) {
  let el = $('.sk-toast'); if (!el) { el = document.createElement('div'); el.className = 'sk-toast'; el.setAttribute('role', 'status'); document.body.append(el); }
  el.textContent = msg; el.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), 2600);
}
function print(html) {
  let sheet = $('#print-sheet'); if (!sheet) { sheet = document.createElement('div'); sheet.id = 'print-sheet'; document.body.append(sheet); }
  sheet.innerHTML = html; if (lang === 'ar') sheet.dir = 'rtl';
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); removeEventListener('afterprint', done); };
  addEventListener('afterprint', done);
  setTimeout(() => window.print(), 60);
}

/* ---------- current page in nav (works with and without index.html) ---------- */
const norm = p => p.replace(/index\.html$/, '').replace(/\/+$/, '/') || '/';
$$('.nav-half a').forEach(a => a.classList.toggle('current', norm(a.pathname) === norm(location.pathname)));
$$('.app-bar a').forEach(a => { if (norm(a.pathname) === norm(location.pathname)) a.setAttribute('aria-current', 'page'); });

/* ---------- search ---------- */
let searchEl, searchInput, searchList, searchSel = 0, searchLast = null, searchItems = [];
function searchData() {
  const base = (window.SKP_SEARCH || []).map(x => ({ ...x }));
  const D = window.SKP;
  if (D) D.grades.forEach(g => base.push({ u: 'product/index.html?g=' + g.id, t: g.name + ' - ' + g.title, d: g.line, k: 'cashew grade buy price spec ' + g.kind, c: 'Product' }));
  return base;
}
function runSearch(q) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean), data = searchData();
  if (!terms.length) return data.filter(x => x.f);
  return data.map(x => {
    const T = t(x.t).toLowerCase() + ' ' + x.t.toLowerCase(), all = T + ' ' + (x.d || '').toLowerCase() + ' ' + (x.k || '').toLowerCase();
    let s = 0; for (const w of terms) { if (!all.includes(w)) return null; s += T.includes(w) ? (T.startsWith(w) ? 6 : 4) : 1; }
    return { ...x, s };
  }).filter(Boolean).sort((a, b) => b.s - a.s).slice(0, 8);
}
function paintSearch() {
  searchItems = runSearch(searchInput.value.trim()); searchSel = Math.min(searchSel, Math.max(0, searchItems.length - 1));
  searchList.innerHTML = searchItems.length ? searchItems.map((x, i) => `<a class="sk-hit${i === searchSel ? ' on' : ''}" role="option" aria-selected="${i === searchSel}" href="${esc(url(x.u))}"><span>${esc(t(x.c || 'Page'))}</span><b>${esc(t(x.t))}</b><i>${esc(x.d || '')}</i></a>`).join('') : `<p class="sk-empty">${esc(t('No results. Try a grade like W320, or a topic like quality.'))}</p>`;
}
function openSearch() {
  if (!searchEl) {
    searchEl = document.createElement('div'); searchEl.className = 'sk-search'; searchEl.hidden = true;
    searchEl.innerHTML = `<div class="sk-search-box" role="dialog" aria-modal="true" aria-label="${esc(t('Search'))}"><div class="sk-search-row"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" stroke-width="1.5"/><path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="1.5"/></svg><input type="search" autocomplete="off" spellcheck="false" aria-label="${esc(t('Search SKP'))}" placeholder="${esc(t('Search grades, pages and stories'))}"><button type="button" class="sk-search-close">${esc(t('Close'))}</button></div><div class="sk-hits" role="listbox"></div></div>`;
    document.body.append(searchEl);
    if (lang === 'ar') $('.sk-search-box', searchEl).dir = 'rtl';
    searchInput = $('input', searchEl); searchList = $('.sk-hits', searchEl);
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const mic = document.createElement('button'); mic.type = 'button'; mic.className = 'sk-mic'; mic.setAttribute('aria-label', t('Search by voice')); mic.setAttribute('aria-pressed', 'false');
      mic.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
      $('.sk-search-close', searchEl).before(mic);
      let rec = null;
      mic.addEventListener('click', () => {
        if (rec) { rec.stop(); return; }
        rec = new SR(); rec.lang = { kn: 'kn-IN', hi: 'hi-IN', ar: 'ar-AE', de: 'de-DE' }[lang] || 'en-IN'; rec.interimResults = true;
        mic.setAttribute('aria-pressed', 'true'); searchInput.placeholder = t('Listening');
        rec.onresult = e => { searchInput.value = [...e.results].map(r => r[0].transcript).join(' '); searchSel = 0; paintSearch(); };
        rec.onend = rec.onerror = () => { rec = null; mic.setAttribute('aria-pressed', 'false'); searchInput.placeholder = t('Search grades, pages and stories'); searchInput.focus(); };
        try { rec.start(); } catch { rec = null; mic.setAttribute('aria-pressed', 'false'); }
      });
    }
    searchInput.addEventListener('input', () => { searchSel = 0; paintSearch(); });
    $('.sk-search-close', searchEl).addEventListener('click', closeSearch);
    searchEl.addEventListener('click', e => { if (e.target === searchEl) closeSearch(); });
    searchEl.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = searchItems.length; if (n) { searchSel = (searchSel + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; paintSearch(); $('.sk-hit.on', searchEl)?.scrollIntoView({ block: 'nearest' }); } }
      else if (e.key === 'Enter' && document.activeElement === searchInput) { const hit = $('.sk-hit.on', searchEl); if (hit) { e.preventDefault(); location.assign(hit.href); } }
      else if (e.key === 'Escape') { e.stopPropagation(); closeSearch(); }
      else if (e.key === 'Tab') { const f = $$('input,button,a', searchEl), a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
  }
  const mega = $('.mega-menu'); if (mega && !mega.hidden) $('.menu-close')?.click();
  searchLast = document.activeElement; searchEl.hidden = false; document.body.classList.add('search-open'); searchInput.value = ''; searchSel = 0; paintSearch(); searchInput.focus();
}
function closeSearch() { if (!searchEl || searchEl.hidden) return; searchEl.hidden = true; document.body.classList.remove('search-open'); searchLast?.focus?.({ preventScroll: true }); }
document.addEventListener('click', e => { if (e.target.closest('[data-search-open]')) { e.preventDefault(); openSearch(); } });
document.addEventListener('keydown', e => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.nodeName) || document.activeElement?.isContentEditable;
  if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); openSearch(); }
  else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); openSearch(); }
});

/* ---------- journal reading aids ---------- */
const article = $('.article');
if (article && $('.article-copy', article)) {
  const copy = $('.article-copy', article), words = copy.textContent.trim().split(/\s+/).length, mins = Math.max(1, Math.round(words / 200));
  const bar = document.createElement('div'); bar.className = 'read-bar'; bar.setAttribute('aria-hidden', 'true'); document.body.append(bar);
  const onScroll = () => { const r = article.getBoundingClientRect(), total = r.height - innerHeight; bar.style.transform = `scaleX(${Math.min(1, Math.max(0, total > 0 ? -r.top / total : 1))})`; };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const tools = document.createElement('div'); tools.className = 'read-tools';
  tools.innerHTML = `<span>${esc(t('{n} min read', { n: mins }))}</span>` + ('speechSynthesis' in window ? `<button type="button" class="read-listen" aria-pressed="false">${esc(t('Listen'))}</button>` : '') + `<button type="button" class="read-share">${esc(t('Share'))}</button>`;
  $('header', article)?.append(tools);
  const listen = $('.read-listen', tools);
  if (listen) {
    listen.addEventListener('click', () => {
      if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }
      const u = new SpeechSynthesisUtterance(($('h1', article)?.textContent || '') + '. ' + $$('p', copy).map(p => p.textContent).join(' ')); u.lang = 'en-IN'; u.rate = .96;
      u.onstart = () => { listen.setAttribute('aria-pressed', 'true'); listen.textContent = t('Stop'); };
      u.onend = u.onerror = () => { listen.setAttribute('aria-pressed', 'false'); listen.textContent = t('Listen'); };
      speechSynthesis.speak(u);
    });
    addEventListener('pagehide', () => speechSynthesis.cancel());
  }
  $('.read-share', tools).addEventListener('click', async () => {
    const data = { title: document.title, url: location.href };
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(location.href); toast(t('Link copied')); } } catch (e) { if (e?.name !== 'AbortError') toast(t('Copy the link from the address bar')); }
  });
}

/* ---------- offline and install ---------- */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) addEventListener('load', () => navigator.serviceWorker.register(url('sw.js')).catch(() => {}));

/* ---------- phone bar: out of the way on the first screen, slides in once the visitor scrolls ---------- */
const appBar = $('.app-bar');
if (appBar) {
  let queued = false;
  const update = () => { queued = false; const de = document.documentElement; document.body.classList.toggle('bar-on', scrollY > innerHeight * .5 || scrollY + innerHeight >= de.scrollHeight - 4 || de.scrollHeight <= innerHeight + 4); };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update); update();
}

window.SKPU = { $, $$, esc, store, url, t, lang, cart, toast, print, translateDom, openSearch };
paintCart();
})();
