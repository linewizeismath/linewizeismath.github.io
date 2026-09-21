/* ==========================================================================
   KRYPTON - games list, search and player
   ========================================================================== */
(() => {
  'use strict';

  const API_URL = 'api/games.json';
  const FALLBACK_IMG = 'assets/placeholder.svg';

  const ICON_PLAY =
    '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3"/></svg>';

  const $ = (id) => document.getElementById(id);
  const els = {
    page: $('page'),
    grid: $('games-grid'),
    search: $('search'),
    clear: $('search-clear'),
    count: $('games-count'),
    status: $('status'),
    statusText: $('status-text'),
    player: $('player'),
    title: $('player-title'),
    stage: $('player-stage'),
    frame: $('player-frame'),
    loader: $('player-loader'),
    reload: $('btn-reload'),
    fullscreen: $('btn-fullscreen'),
    close: $('btn-close')
  };

  let cards = [];      // [{ el, name }]
  let current = null;  // game currently open
  let lastFocus = null;
  let pseudoFs = false;

  /* ------------------------------------------------------------------ */
  /* Games API                                                           */
  /* ------------------------------------------------------------------ */

  const pick = (obj, keys) => {
    for (const key of keys) {
      if (obj && obj[key] != null && String(obj[key]).trim() !== '') return String(obj[key]).trim();
    }
    return '';
  };

  function normalize(raw) {
    const list = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.games) ? raw.games : []);
    return list
      .map((item) => ({
        name: pick(item, ['name', 'GAME NAME', 'GAME_NAME']),
        image: pick(item, ['image', 'IMAGE']),
        path: pick(item, ['path', 'GAME PLACE ON GITHUB REPO', 'GAME_PLACE_ON_GITHUB_REPO'])
      }))
      .filter((g) => g.name && g.path);
  }

  async function loadGames() {
    try {
      const res = await fetch(API_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const games = normalize(await res.json());
      buildCards(games);
      applyFilter();
    } catch (err) {
      console.error('[KRYPTON] Could not load ' + API_URL, err);
      showStatus(
        location.protocol === 'file:'
          ? 'Browsers block the games list when a page is opened from a file. Run a local server or open the site on GitHub Pages.'
          : 'The games list could not be loaded. Check that api/games.json exists and contains valid JSON.'
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /* Cards                                                               */
  /* ------------------------------------------------------------------ */

  function createCard(game, delay) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.style.setProperty('--d', delay.toFixed(2) + 's');
    card.setAttribute('aria-label', 'Play ' + game.name);

    const media = document.createElement('div');
    media.className = 'card-media';

    const img = new Image();
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    img.addEventListener('error', () => { img.src = FALLBACK_IMG; }, { once: true });
    img.src = game.image || FALLBACK_IMG;

    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    overlay.innerHTML = '<span class="card-play">' + ICON_PLAY + '</span>';

    const name = document.createElement('span');
    name.className = 'card-name';
    name.textContent = game.name;
    overlay.appendChild(name);

    media.append(img, overlay);
    card.appendChild(media);
    card.addEventListener('click', () => openGame(game));
    return card;
  }

  function buildCards(games) {
    els.grid.replaceChildren();
    // Wait for the intro animation before the first cards appear
    const base = Math.max(0, 2.1 - performance.now() / 1000);

    cards = games.map((game, i) => {
      const el = createCard(game, base + Math.min(i, 20) * 0.06);
      els.grid.appendChild(el);
      return { el, name: game.name.toLowerCase() };
    });
  }

  /* ------------------------------------------------------------------ */
  /* Search                                                              */
  /* ------------------------------------------------------------------ */

  function showStatus(message) {
    els.statusText.textContent = message;
    els.status.hidden = false;
  }

  function applyFilter() {
    const raw = els.search.value;
    const query = raw.trim().toLowerCase();
    els.clear.hidden = raw === '';

    let visible = 0;
    for (const c of cards) {
      const match = !query || c.name.includes(query);
      c.el.hidden = !match;
      if (match) visible++;
    }

    els.count.textContent = visible + (visible === 1 ? ' game' : ' games');

    if (cards.length === 0) {
      showStatus('No games yet. Add one to api/games.json and it will show up here.');
    } else if (visible === 0) {
      showStatus('No games match "' + raw.trim() + '". Try a different name.');
    } else {
      els.status.hidden = true;
    }
  }

  els.search.addEventListener('input', applyFilter);

  els.search.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && els.search.value) {
      els.search.value = '';
      applyFilter();
    }
  });

  els.clear.addEventListener('click', () => {
    els.search.value = '';
    applyFilter();
    els.search.focus();
  });

  /* ------------------------------------------------------------------ */
  /* Player                                                              */
  /* ------------------------------------------------------------------ */

  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;

  function syncFullscreenState() {
    els.player.classList.toggle('is-fs', Boolean(fsElement()) || pseudoFs);
  }

  function setPseudoFullscreen(on) {
    pseudoFs = on;
    els.player.classList.toggle('is-pseudo-fs', on);
    syncFullscreenState();
  }

  function openGame(game) {
    current = game;
    lastFocus = document.activeElement;

    els.title.textContent = game.name;
    els.frame.title = game.name;
    els.loader.hidden = false;
    els.frame.src = game.path;

    els.player.hidden = false;
    els.page.inert = true;
    document.body.classList.add('no-scroll');
    els.close.focus();
  }

  function closeGame() {
    if (fsElement()) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) { try { exit.call(document); } catch (_) { /* ignore */ } }
    }
    setPseudoFullscreen(false);

    current = null;
    els.player.hidden = true;
    els.frame.src = 'about:blank'; // stops any game audio
    els.page.inert = false;
    document.body.classList.remove('no-scroll');

    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function reloadGame() {
    if (!current) return;
    els.loader.hidden = false;
    try {
      els.frame.contentWindow.location.reload();
    } catch (_) {
      els.frame.src = current.path; // cross-origin game: reload by re-navigating
    }
  }

  function toggleFullscreen() {
    if (fsElement()) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) exit.call(document);
      return;
    }
    if (pseudoFs) { setPseudoFullscreen(false); return; }

    const el = els.stage;
    const request = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!request) { setPseudoFullscreen(true); return; }

    try {
      const result = request.call(el);
      if (result && typeof result.catch === 'function') {
        result.catch(() => setPseudoFullscreen(true));
      }
    } catch (_) {
      setPseudoFullscreen(true);
    }
  }

  els.frame.addEventListener('load', () => {
    if (!current) return;
    els.loader.hidden = true;
    try { els.frame.contentWindow.focus(); } catch (_) { /* ignore */ }
  });

  els.reload.addEventListener('click', reloadGame);
  els.fullscreen.addEventListener('click', toggleFullscreen);
  els.close.addEventListener('click', closeGame);

  document.addEventListener('fullscreenchange', syncFullscreenState);
  document.addEventListener('webkitfullscreenchange', syncFullscreenState);

  // Click on the dark area around the player closes it
  els.player.addEventListener('mousedown', (e) => {
    if (e.target === els.player) closeGame();
  });

  document.addEventListener('keydown', (e) => {
    if (!els.player.hidden) {
      if (e.key === 'Escape' && !fsElement()) {
        e.preventDefault();
        if (pseudoFs) setPseudoFullscreen(false);
        else closeGame();
      }
      return;
    }

    // Press "/" anywhere to jump to the search bar
    const tag = document.activeElement ? document.activeElement.tagName : '';
    if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
      e.preventDefault();
      els.search.focus();
    }
  });

  /* ------------------------------------------------------------------ */

  loadGames();
})();
