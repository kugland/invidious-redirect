// ==UserScript==
// @name        Redirect to Invidious
// @author      André Kugland
// @description Redirects YouTube videos to an Invidious instance.
// @namespace   invidious-redirect
// @version     0.1
// @match       *://*.youtube.com/
// @match       *://*.youtube.com/*
// @grant       none
// @run-at      document-start
// ==/UserScript==
(function () {
    "use strict";
    function makeUrl(videoId) {
        // Here you should put the URL to your Invidious instance.
        return new URL(`http://127.0.0.1:3000/watch?v=${videoId}`).href;
    }
    function getVideoId(href) {
        const url = new URL(href, window.location.href);
        if (url.pathname === '/watch') {
            return url.searchParams.get('v');
        }
        else {
            const match = url.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)$/);
            if (match && match[1])
                return match[1];
        }
        throw new Error(`Unable to parse URL: ${href}`);
    }
    // Redirect on click.
    document.addEventListener('click', (event) => {
        if (event.target instanceof HTMLElement) {
            const anchor = event.target.closest('a');
            const href = anchor.getAttribute('href');
            if (!href)
                return;
            try {
                event.preventDefault();
                event.stopPropagation();
                window.location.assign(makeUrl(getVideoId(href)));
            }
            catch (e) { }
        }
    }, true);
    // Redirect on url change.
    let currentUrl = window.location.href;
    setInterval(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            try {
                window.location.replace(makeUrl(getVideoId(currentUrl)));
            }
            catch (e) { }
        }
    }, 150);
    // Redirect on page load.
    try {
        window.location.replace(makeUrl(getVideoId(currentUrl)));
    }
    catch (e) { }
}());
