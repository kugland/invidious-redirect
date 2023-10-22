// ==UserScript==
// @name        Redirect to Invidious
// @author      André Kugland
// @description Redirects YouTube videos to an Invidious instance.
// @namespace   https://github.com/kugland
// @license     MIT
// @version     0.2.6
// @match       *://*.youtube.com/
// @match       *://*.youtube.com/*
// @run-at      document-start
// @noframes
// @homepageURL https://greasyfork.org/scripts/477967-redirect-to-invidious
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
    const css = document.createElement('style');
    css.textContent = `
        #set-invidious-url {
            position: fixed;
            bottom: 0;
            right: 0;
            height: 48px;
            width: 48px;
            z-index: 99999;
            margin: 1rem;
            cursor: pointer;
            border-radius: 50%;
            box-shadow: 0px 0px 3px black;
            opacity: 0.5;
        }
        #set-invidious-url:hover {
            opacity: 1;
            box-shadow: 0px 0px 5px black;
        }
    `;
    document.head.appendChild(css);
    const button = document.createElement('img');
    button.id = 'set-invidious-url';
    button.tabIndex = -1;
    button.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwBAMAAAClLOS0AAAAJFBMVEXv8e7Z4ePn6+kWt/CZzvChpKFrbWrT1dJVV1WJjIm2uLXCxMH33HXYAAAAp0lEQVR4AeXNIQ7CMABG4ceSsXSYIXFVFaCAC5BwgblNV4HDkMwiIA0YDMnkDMHWoHY5PPwGSfjsE4+fNbZIyXIBOszR1iu+lICWFmiuRGsOaPURbXOyKINb6FDyR/AoZlefURyNnuwxelKR6YmHVk2yK3qSd+iJKdATB9Be+PAEPakATIi8STzISVaiJ2lET4YFejIBPbmDnEy3ETmZ9REARr3lP7wAXHImU2sAU14AAAAASUVORK5CYII=';
    button.addEventListener('click', () => {
        let instance = prompt('Enter the URL of the Invidious instance to use:', localStorage.getItem(instanceKey) || defaultInstance);
        if (instance) {
            instance = instance.replace(/^\s*(.*)\/?\s*$/, '$1');
            localStorage.setItem(instanceKey, instance);
        }
        else {
            localStorage.removeItem(instanceKey);
        }
    });
    document.body.appendChild(button);
});
