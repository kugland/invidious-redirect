// ==UserScript==
// @name        Redirect to Invidious
// @author      André Kugland
// @description Redirects YouTube videos to an Invidious instance.
// @namespace   https://github.com/kugland
// @license     MIT
// @version     0.2.2
// @match       *://*.youtube.com/
// @match       *://*.youtube.com/*
// @run-at      document-start
// @icon         data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgBAMAAACBVGfHAAAAGFBMVEUhAABkZmN1d3ROyPFaXFm0trPR19WJi4ibscP/AAAAAXRSTlMAQObYZgAAALtJREFUeAFiwA4AZVG3FsIwDEzb6ax01vSs9J3qnfhFv8Dvoycd1Zd6Z3X5szzP2h++LYlxmb94UJGgGSuPlDPsWoQdvVH8GsAkkN+HKgkLAxWMfGoW1KOBDzwgMMZeqD8n8wpywA9yXRGT0iEsvaWGyOFaQ7Cm8ycgyFu40H0IQYPeyIYIqmlLajpIqwcVKuHCfMnK5CRBxtqcNaRBLNq3RBrkjAFlBq/EY/yM0BmyswYsCnzsrtJdtosnoyCIGirhmt8AAAAASUVORK5CYII=
// ==/UserScript==
"use strict";
const instanceKey = 'invidious-redirect-instance';
const defaultInstance = 'https://yewtu.be';
// Get the Invidious instance URL from the user.
localStorage.getItem(instanceKey) || localStorage.setItem(instanceKey, defaultInstance);
function makeUrl(videoId) {
    const instance = localStorage.getItem(instanceKey);
    // Let's construct a URL object to make sure it's valid.
    return new URL(`${instance}/watch?v=${videoId}`).href;
}
function getVideoId(href) {
    var _a;
    const url = new URL(href, window.location.href);
    if (url.pathname === '/watch') {
        return url.searchParams.get('v');
    }
    else {
        const videoId = (_a = url.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)$/)) === null || _a === void 0 ? void 0 : _a[1];
        if (videoId)
            return videoId;
    }
    throw new Error(`Unable to parse URL: ${href}`);
}
// Redirect on click.
document.addEventListener('click', (event) => {
    var _a;
    if (event.target instanceof HTMLElement) {
        try {
            const href = (_a = event.target.closest('a')) === null || _a === void 0 ? void 0 : _a.getAttribute('href');
            if (href) {
                event.preventDefault();
                event.stopPropagation();
                window.location.assign(makeUrl(getVideoId(href)));
            }
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
// Add a settings button.
((fn) => {
    if (document.readyState !== 'loading')
        fn();
    else
        document.addEventListener('DOMContentLoaded', fn);
})(() => {
    const button = document.createElement('button');
    button.id = 'set-invidious-url';
    button.tabIndex = -1;
    button.textContent = 'set invidious url';
    button.addEventListener('click', () => {
        let instance = prompt('Enter the URL of the Invidious instance to use:', localStorage.getItem(instanceKey) || defaultInstance);
        if (instance) {
            instance = instance.trim();
            if (instance.endsWith('/'))
                instance = instance.slice(0, -1);
            localStorage.setItem(instanceKey, instance);
        }
        else {
            localStorage.removeItem(instanceKey);
        }
    });
    const css = document.createElement('style');
    css.textContent = `
        button#set-invidious-url {
            font-size: 1.2em;
            cursor: pointer;
            position: fixed;
            padding: 0.5em;
            bottom: 0;
            right: 0;
            opacity: 0.25;
            z-index: 99999;
            font-family: inherit;
            border: 0;
        }
        button#set-invidious-url:hover,
        button#set-invidious-url:focus {
            opacity: 1;
        }
    `;
    document.body.appendChild(button);
    document.head.appendChild(css);
});
