// ==UserScript==
// @name         YouTube: No Shorts
// @namespace    https://github.com/prominence-chan/yt-no-shorts
// @version      1.1.0
// @description  Hides Shorts everywhere on YouTube. On a Shorts page it hides the player and just says "bruh stop scrolling".
// @author       prominence-chan
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-start
// @grant        none
// @license      MIT
// @homepageURL  https://github.com/prominence-chan/yt-no-shorts
// @downloadURL  https://raw.githubusercontent.com/prominence-chan/yt-no-shorts/main/yt-no-shorts.user.js
// @updateURL    https://raw.githubusercontent.com/prominence-chan/yt-no-shorts/main/yt-no-shorts.user.js
// ==/UserScript==

(function () {
  'use strict';

  // Everything Shorts-shaped: home/subscriptions shelves, search results, channel tabs, sidebar entries, chips.
  const CSS = `
    ytd-rich-shelf-renderer[is-shorts], ytd-reel-shelf-renderer, ytd-shorts, ytm-shorts-lockup-view-model,
    ytm-shorts-lockup-view-model-v2, ytm-reel-shelf-renderer, ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
    ytd-rich-section-renderer:has(ytm-shorts-lockup-view-model), grid-shelf-view-model:has(ytm-shorts-lockup-view-model),
    ytd-video-renderer:has(a[href^="/shorts/"]), ytd-grid-video-renderer:has(a[href^="/shorts/"]),
    ytd-rich-item-renderer:has(a[href^="/shorts/"]), ytd-compact-video-renderer:has(a[href^="/shorts/"]),
    ytd-guide-entry-renderer:has(a[title="Shorts"]), ytd-mini-guide-entry-renderer[aria-label="Shorts"],
    ytd-mini-guide-entry-renderer:has(a[title="Shorts"]), ytd-mini-guide-entry-renderer:has(a[href^="/shorts"]),
    ytd-guide-entry-renderer:has(a[href^="/shorts"]), [data-no-shorts],
    yt-tab-shape[tab-title="Shorts"], tp-yt-paper-tab:has(> .tab-content[title="Shorts"]),
    yt-chip-cloud-chip-renderer:has(yt-formatted-string[title="Shorts"]),
    ytm-pivot-bar-item-renderer:has(.pivot-shorts), ytm-reel-item-renderer { display: none !important; }
    html.no-shorts-page ytd-shorts, html.no-shorts-page ytd-page-manager > ytd-shorts,
    html.no-shorts-page #shorts-container, html.no-shorts-page ytm-reel-watch-player { display: none !important; }
    #bruh-stop-scrolling {
      position: fixed; inset: 0; z-index: 2147483646; display: flex; align-items: center; justify-content: center;
      background: var(--yt-spec-base-background, #0f0f0f); color: var(--yt-spec-text-primary, #f1f1f1);
      font: 700 clamp(28px, 6vw, 72px)/1.2 Roboto, Arial, sans-serif; text-align: center; padding: 24px;
    }`;

  function addStyle() {
    if (document.getElementById('no-shorts-style') || !document.documentElement) return;
    const s = document.createElement('style');
    s.id = 'no-shorts-style';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  const onShorts = () => location.pathname.startsWith('/shorts');

  function stopShortsMedia() {
    document.querySelectorAll('video').forEach(v => { if (!v.paused) v.pause(); v.muted = true; });
  }

  function update() {
    addStyle();
    const root = document.documentElement;
    let msg = document.getElementById('bruh-stop-scrolling');
    if (onShorts()) {
      root.classList.add('no-shorts-page');
      if (!msg && document.body) {
        msg = document.createElement('div');
        msg.id = 'bruh-stop-scrolling';
        msg.textContent = 'bruh stop scrolling';
        document.body.appendChild(msg);
      }
      stopShortsMedia();
    } else {
      root.classList.remove('no-shorts-page');
      if (msg) msg.remove();
    }
  }

  // Things CSS can't select (no :contains): the "Shorts" filter chip and shelves whose header just says "Shorts".
  const SHELVES = 'grid-shelf-view-model, ytd-reel-shelf-renderer, ytd-rich-section-renderer, ytd-item-section-renderer, ytd-shelf-renderer';
  // Polymer rewrites class lists, so mark with an attribute and an inline style instead
  const hide = el => { el.setAttribute('data-no-shorts', ''); el.style.setProperty('display', 'none', 'important'); };
  function sweep() {
    document.querySelectorAll('yt-chip-cloud-chip-renderer, yt-tab-shape, ytm-chip-cloud-chip-renderer').forEach(el => {
      if (el.textContent.trim() === 'Shorts') hide(el);
    });
    document.querySelectorAll('yt-shelf-header-layout, ytd-rich-shelf-renderer #title, ytd-shelf-renderer #title').forEach(h => {
      if (h.textContent.trim() === 'Shorts') { const shelf = h.closest(SHELVES); if (shelf) hide(shelf); }
    });
  }
  let sweepQueued = false;
  const queueSweep = () => { if (!sweepQueued) { sweepQueued = true; requestAnimationFrame(() => { sweepQueued = false; sweep(); }); } };

  // YouTube is a single-page app: re-check on its navigation events, on history changes and as the DOM fills in.
  ['yt-navigate-start', 'yt-navigate-finish', 'yt-page-data-updated', 'popstate', 'DOMContentLoaded']
    .forEach(e => window.addEventListener(e, update, true));
  for (const fn of ['pushState', 'replaceState']) {
    const orig = history[fn];
    history[fn] = function () { const r = orig.apply(this, arguments); setTimeout(update, 0); return r; };
  }
  // At document-start the root element can still be missing, so attach the observer once it exists
  function observe() {
    if (!document.documentElement) return setTimeout(observe, 10);
    new MutationObserver(() => { queueSweep(); if (onShorts()) { update(); stopShortsMedia(); } })
      .observe(document.documentElement, { childList: true, subtree: true });
    update();
    queueSweep();
  }
  ['yt-navigate-finish', 'yt-page-data-updated'].forEach(e => window.addEventListener(e, queueSweep, true));
  observe();
})();
