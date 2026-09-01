// ==UserScript==
// @name         Dolnath Calendar Roll20 Sync
// @namespace    dolnath-calendar
// @version      1.0.0
// @description  Sends Dolnath Roll20 calendar sync beacons to a Google Apps Script middleman.
// @match        https://app.roll20.net/editor/*
// @grant        GM_xmlhttpRequest
// @connect      script.google.com
// @connect      script.googleusercontent.com
// ==/UserScript==

(function () {
  'use strict';

  // Paste the deployed Google Apps Script Web App /exec URL here.
  const MIDDLEMAN_URL = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';

  // Must exactly match POST_TOKEN in Code.gs.
  const POST_TOKEN = 'CHANGE_THIS_TO_THE_SAME_LONG_RANDOM_SECRET';

  let lastCode = '';

  function sendCode(code) {
    if (!code || code === lastCode) return;
    if (MIDDLEMAN_URL.indexOf('PASTE_YOUR_') === 0) {
      console.warn('[Dolnath Sync] Configure MIDDLEMAN_URL first.');
      return;
    }

    GM_xmlhttpRequest({
      method: 'POST',
      url: MIDDLEMAN_URL,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      data: 'code=' + encodeURIComponent(code) + '&token=' + encodeURIComponent(POST_TOKEN),
      onload: function (response) {
        if (response.status >= 200 && response.status < 400) {
          lastCode = code;
          console.log('[Dolnath Sync] Updated:', code);
        } else {
          console.error('[Dolnath Sync] Middleman returned HTTP', response.status);
        }
      },
      onerror: function (err) {
        console.error('[Dolnath Sync] Request failed:', err);
      }
    });
  }

  function scanText(text) {
    if (!text) return;
    // Prefer the explicit Mod beacon but also accept the ordinary copyable sync code.
    const beacon = /\[DOLNATH_SYNC:(DOLNATH-\d+-\d{2}-\d{2})\]/i.exec(text);
    const generic = /(DOLNATH-\d+-\d{2}-\d{2})/i.exec(text);
    const match = beacon || generic;
    if (match) sendCode(match[1].toUpperCase());
  }

  function scanNode(node) {
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      scanText(node.nodeValue);
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      scanText(node.innerText || node.textContent || '');
    }
  }

  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(scanNode);
    });
  });

  observer.observe(document.documentElement, {childList:true, subtree:true});

  // Catch a beacon already present when the userscript starts.
  scanText(document.body ? (document.body.innerText || document.body.textContent || '') : '');

  console.log('[Dolnath Sync] Watching Roll20 chat for calendar sync beacons.');
}());
