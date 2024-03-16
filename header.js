// ==UserScript==
// @name        Redirect to Invidious
// @author      André Kugland
// @description Redirects YouTube videos to an Invidious instance.
// @namespace   https://github.com/kugland
// @license     MIT
// @version     0.3.4
// @match       https://www.youtube.com/*
// @match       https://m.youtube.com/*
// @exclude     *://music.youtube.com/*
// @exclude     *://*.music.youtube.com/*
// @run-at      document-start
// @noframes
// @grant       GM_xmlhttpRequest
// @grant       GM.xmlhttpRequest
// @homepageURL https://greasyfork.org/scripts/477967-redirect-to-invidious
// @downloadURL https://update.greasyfork.org/scripts/477967/Redirect%20to%20Invidious.user.js
// @updateURL   https://update.greasyfork.org/scripts/477967/Redirect%20to%20Invidious.meta.js
// ==/UserScript==

/* This script is transpiled from TypeScript, that’s why it looks a bit weird. For the original
   source code, see https://github.com/kugland/invidious-redirect/. */
