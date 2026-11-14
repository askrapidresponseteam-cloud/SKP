/* SKP film player. Custom controls over the YouTube player, with fallbacks so the film always has a way to play:
   1. YouTube API player with SKP controls.
   2. If the API is blocked or slow, the standard YouTube player with its own controls.
   3. If the page is opened as a file (no web address), or the embed is refused, a direct link to the film. */
(() => {
'use strict';
const cinemas = [...document.querySelectorAll('.cinema')]; if (!cinemas.length) return;
const tr = s => (window.SKPU ? window.SKPU.t(s) : s);
const hosted = /^https?:$/.test(location.protocol);
let apiPromise;
function loadAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (typeof previous === 'function') previous(); resolve(window.YT); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
    s.onerror = () => { apiPromise = null; reject(Error('blocked')); };
    document.head.append(s);
    setTimeout(() => { if (!window.YT?.Player) { apiPromise = null; reject(Error('slow')); } }, 8000);
  });
  return apiPromise;
}
const playIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m8 4 13 8-13 8Z"/></svg>';
const pauseIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zm8 0h4v16h-4z"/></svg>';
function time(s) { s = Math.max(0, Math.floor(Number(s) || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(sec).padStart(2, '0'); }
const memory = { get(k) { try { return Number(localStorage.getItem(k)) || 0; } catch { return 0; } }, set(k, v) { try { v ? localStorage.setItem(k, String(v)) : localStorage.removeItem(k); } catch {} } };

cinemas.forEach(box => {
  const q = s => box.querySelector(s), mount = q('.cinema-mount'), poster = q('.cinema-poster'), start = q('.cinema-start'), close = q('.cinema-close'), play = q('.cinema-play'), seek = q('.cinema-seek'), mute = q('.cinema-mute'), volume = q('.cinema-volume'), back = q('.cinema-back'), forward = q('.cinema-forward'), full = q('.cinema-fullscreen'), status = q('.cinema-status'), tNow = q('.cinema-time-current'), tAll = q('.cinema-time-total');
  const id = box.dataset.video, watchUrl = 'https://www.youtube.com/watch?v=' + encodeURIComponent(id), key = 'skp:film:' + id, title = 'Sampath Shetty - Yashogathe by News Next';
  let player = null, ready = false, playing = false, tick = null, loading = false, generation = 0, duration = 0, dragging = false, watchdog = null, lastSaved = 0;
  // Playback opens in the reference's edge-to-edge black viewing room.
  const home = document.createComment('film player position');
  box.before(home);
  let previousOverflow = '';
  const controls = q('.cinema-controls'), bar = document.createElement('div'), name = document.createElement('div'), transport = document.createElement('div'), clock = document.createElement('div');
  bar.className = 'cinema-reference-bar'; name.className = 'cinema-reference-title'; transport.className = 'cinema-reference-transport'; clock.className = 'cinema-reference-clock';
  name.textContent = 'Sampath Shetty – Yashogathe';
  clock.append(tNow, document.createTextNode(' / '), tAll);
  transport.append(play, seek, clock); bar.append(name, transport, mute); controls.append(bar);
  close.textContent = 'CLOSE';
  function viewing(on) {
    if (on) { previousOverflow = document.body.style.overflow; document.body.append(box); box.classList.add('cinema-viewing'); document.body.style.overflow = 'hidden'; close.focus({preventScroll:true}); }
    else if (box.classList.contains('cinema-viewing')) { box.classList.remove('cinema-viewing'); home.after(box); document.body.style.overflow = previousOverflow; }
  }
  start.type = 'button';
  [close, play, mute, back, forward, full].forEach(b => { if (b) b.type = 'button'; });

  function enable(on) { [play, seek, mute, volume, back, forward].forEach(b => b.disabled = !on); }
  function notice(message, opts = {}) {
    status.textContent = message; status.hidden = false;
    if (opts.retry) { const b = document.createElement('button'); b.type = 'button'; b.textContent = tr('Retry playback'); b.onclick = () => { reset(); begin(); }; status.append(b); }
    if (opts.link) { const a = document.createElement('a'); a.href = watchUrl; a.target = '_blank'; a.rel = 'noopener'; a.className = 'cinema-external'; a.textContent = tr('Watch on YouTube'); status.append(a); }
  }
  let videoAreaVisible = false;
  function videoMode() { document.body.classList.toggle('watching-film', videoAreaVisible && poster.hidden); }
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { videoAreaVisible = es[0].intersectionRatio > .3; videoMode(); }, { threshold: [0, .3, .7] }).observe(box);

  function paint() {
    if (!ready || !player) return;
    try {
      duration = player.getDuration() || duration;
      const current = player.getCurrentTime() || 0;
      tAll.textContent = duration ? time(duration) : '0:00';
      if (!dragging) { tNow.textContent = time(current); seek.value = duration ? current / duration * 100 : 0; seek.style.setProperty('--progress', seek.value + '%'); seek.setAttribute('aria-valuetext', time(current) + ' / ' + time(duration)); }
      const muted = player.isMuted();
      mute.setAttribute('aria-label', tr(muted ? 'Unmute video' : 'Mute video')); mute.setAttribute('aria-pressed', String(muted)); mute.style.opacity = '1'; mute.textContent = tr(muted ? 'Unmute' : 'Mute');
      if (playing && Math.abs(current - lastSaved) > 4) { lastSaved = current; memory.set(key, duration && current > duration - 20 ? 0 : Math.floor(current)); }
    } catch {}
  }
  function setPlaying(on) { playing = on; box.dataset.playing = String(on); play.textContent = tr(on ? 'Pause' : 'Play'); play.setAttribute('aria-label', tr(on ? 'Pause video' : 'Play video')); }
  function reset() {
    viewing(false); generation++; clearInterval(tick); clearTimeout(watchdog); tick = null;
    try { player?.destroy(); } catch {}
    player = null; ready = false; loading = false; playing = false; duration = 0; dragging = false;
    mount.replaceChildren(); delete box.dataset.native; poster.hidden = false; videoMode(); close.hidden = true; status.hidden = true; enable(false);
    seek.value = 0; tNow.textContent = '0:00'; tAll.textContent = '0:00'; setPlaying(false); start.disabled = false;
  }
  /* The embed follows the pattern proven on the People for Animals founder films:
     the YouTube frame is created straight from the click (so the browser allows it to start),
     on www.youtube.com, and the API attaches to that frame afterwards to drive the SKP controls. */
  const touch = matchMedia('(hover: none)').matches;
  let soundHint = false;
  function embedUrl(driven, startMuted) {
    const at = memory.get(key);
    return 'https://www.youtube.com/embed/' + encodeURIComponent(id) + '?autoplay=1&mute=' + (startMuted ? 1 : 0) + '&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&iv_load_policy=3&fs=' + (driven ? 0 : 1) + (driven ? '&controls=0&disablekb=1' : '') + '&origin=' + encodeURIComponent(location.origin) + (at > 10 ? '&start=' + at : '');
  }
  function makeFrame(driven, startMuted) {
    const frame = document.createElement('iframe'); frame.title = title;
    frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media'; frame.setAttribute('allowfullscreen', ''); frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.src = embedUrl(driven, startMuted);
    return frame;
  }
  /* standard YouTube player with its own controls: used when the API script is blocked or slow */
  function native(thisGeneration) {
    if (generation !== thisGeneration) return;
    clearInterval(tick); clearTimeout(watchdog); try { player?.destroy(); } catch {} player = null; ready = false; loading = false;
    mount.replaceChildren(makeFrame(false, touch)); box.dataset.native = 'true'; enable(false); status.hidden = true;
  }
  function attach(frame, thisGeneration, startMuted) {
    const YT = window.YT;
    player = new YT.Player(frame, {
      events: {
        onReady: e => {
          if (generation !== thisGeneration) return;
          clearTimeout(watchdog); ready = true; loading = false; enable(true);
          try { if (!startMuted) { e.target.unMute(); e.target.setVolume(Number(volume.value) || 80); } e.target.playVideo(); } catch {}
          if (startMuted) { soundHint = true; notice(tr('Started with sound off. Tap the speaker to turn it on.')); } else status.hidden = true;
          tick = setInterval(paint, 500); paint();
        },
        onStateChange: e => {
          if (generation !== thisGeneration) return;
          box.dataset.playerState = String(e.data); setPlaying(e.data === YT.PlayerState.PLAYING);
          if (e.data === YT.PlayerState.ENDED) { memory.set(key, 0); reset(); return; }
          if (e.data === YT.PlayerState.BUFFERING && !soundHint) notice(tr('Buffering')); else if (!soundHint) status.hidden = true;
          paint();
        },
        onAutoplayBlocked: () => {
          if (generation !== thisGeneration) return;
          try { player.mute(); player.playVideo(); } catch {}
          soundHint = true; notice(tr('Started with sound off. Tap the speaker to turn it on.'));
        },
        onError: e => {
          if (generation !== thisGeneration) return;
          clearTimeout(watchdog); loading = false; enable(false);
          const refused = [101, 150, 153].includes(e.data);
          const messages = { 2: 'The film could not be loaded. Please try again.', 5: 'Your browser could not play this video. Please retry.', 100: 'This film is currently unavailable from its publisher.', 101: 'This film can only be watched on YouTube.', 150: 'This film can only be watched on YouTube.', 153: 'The video service needs a web address. Open this site from its hosted address, or watch the film directly.' };
          notice(tr(messages[e.data] || 'The film could not be played in this browser. Please try again.'), { retry: !refused, link: true });
        }
      }
    });
    /* if the API never reports ready, hand over to YouTube's own controls so the film is never stuck */
    watchdog = setTimeout(() => { if (generation === thisGeneration && !ready) native(thisGeneration); }, 9000);
  }
  function begin() {
    if (loading) return;
    if (ready && player) { player.playVideo(); return; }
    if (!hosted) { notice(tr('You opened this page as a file, and YouTube blocks films on pages opened that way. Double-click Start-Preview.command in the site folder (or open the hosted site) and the film plays right here.'), { link: true }); return; }
    const thisGeneration = ++generation; soundHint = false;
    viewing(true); start.disabled = true; poster.hidden = true; videoMode(); close.hidden = false;
    const ambient = document.querySelector('.sound-toggle'); if (ambient?.getAttribute('aria-pressed') === 'true') ambient.click();
    const driven = !!(window.YT && window.YT.Player);
    const frame = makeFrame(driven, touch);
    mount.replaceChildren(frame);
    if (driven) { loading = true; notice(tr('Loading the film')); attach(frame, thisGeneration, touch); }
    else { box.dataset.native = 'true'; enable(false); status.hidden = true; loadAPI().then(() => { if (generation === thisGeneration) { delete box.dataset.native; attach(frame, thisGeneration, touch); } }).catch(() => {}); }
  }
  /* fetch the YouTube API as soon as the player is on screen or touched, so the first click can use the SKP controls */
  if (hosted) {
    const warm = () => loadAPI().catch(() => {});
    ['pointerenter', 'touchstart', 'focusin'].forEach(ev => box.addEventListener(ev, warm, { once: true, passive: true }));
    if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { warm(); io.disconnect(); } }, { rootMargin: '400px' }); io.observe(box); }
  }
  start.addEventListener('click', begin);
  close.addEventListener('click', () => { reset(); start.focus({ preventScroll: true }); });
  play.onclick = () => { if (!ready) return; if (playing) player.pauseVideo(); else player.playVideo(); };
  seek.addEventListener('input', () => { if (!ready || !duration) return; dragging = true; const to = duration * Number(seek.value) / 100; tNow.textContent = time(to); seek.style.setProperty('--progress', seek.value + '%'); player.seekTo(to, false); });
  seek.addEventListener('change', () => { if (ready && duration) player.seekTo(duration * Number(seek.value) / 100, true); dragging = false; });
  back.onclick = () => { if (ready) player.seekTo(Math.max(0, player.getCurrentTime() - 10), true); };
  forward.onclick = () => { if (ready) player.seekTo(Math.min(duration || Infinity, player.getCurrentTime() + 10), true); };
  mute.onclick = () => { if (!ready) return; if (player.isMuted()) { player.unMute(); player.setVolume(Number(volume.value) || 80); soundHint = false; status.hidden = true; } else player.mute(); setTimeout(paint, 120); };
  volume.addEventListener('input', () => { if (!ready) return; player.setVolume(Number(volume.value)); if (Number(volume.value) > 0) player.unMute(); else player.mute(); setTimeout(paint, 120); });
  full.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.webkitFullscreenElement) document.webkitExitFullscreen();
      else if (box.requestFullscreen) await box.requestFullscreen();
      else if (box.webkitRequestFullscreen) box.webkitRequestFullscreen();
      else notice(tr('Full screen is not supported in this browser.'), { link: true });
    } catch { notice(tr('Full screen is not available in this browser.'), { link: true }); }
  });
  const onFs = () => full.setAttribute('aria-label', tr((document.fullscreenElement || document.webkitFullscreenElement) === box ? 'Exit full screen' : 'Enter full screen'));
  document.addEventListener('fullscreenchange', onFs); document.addEventListener('webkitfullscreenchange', onFs);
  box.addEventListener('keydown', e => {
    if (e.target.matches('input,button,a') || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'k') { e.preventDefault(); ready ? play.click() : begin(); }
    else if (k === 'arrowright' && ready) { e.preventDefault(); forward.click(); }
    else if (k === 'arrowleft' && ready) { e.preventDefault(); back.click(); }
    else if (k === 'm' && ready) mute.click();
    else if (k === 'f') full.click();
    else if (k === 'escape' && !document.fullscreenElement && (ready || box.dataset.native)) reset();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('cinema-viewing')) { reset(); start.focus({preventScroll:true}); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && ready && playing) player.pauseVideo(); });
  addEventListener('pagehide', () => { if (ready) paint(); });
});
})();
