// ==UserScript==
// @name        Redirect to Invidious
// @author      André Kugland
// @description Redirects YouTube videos to an Invidious instance.
// @namespace   https://github.com/kugland
// @license     MIT
// @version     0.3.5
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
(() => {
    // src/domhelper.ts
    function onload(callback) {
        if (document.readyState !== "loading") {
            callback();
        } else {
            document.addEventListener("DOMContentLoaded", callback);
        }
    }
    function element(html) {
        const template = document.createElement("template");
        template.innerHTML = html.trim();
        return template.content.firstChild;
    }

    // src/config.ts
    var DEFAULT_INSTANCE_URL = "https://inv.nadeko.net";
    var INSTANCES_JSON_URL =
        "https://raw.githubusercontent.com/kugland/invidious-redirect/master/instances.json";
    var INSTANCE_URL_KEY = "invidious-redirect--instance";
    var INSTANCES_KEY = "invidious-redirect--public-instances";
    var UPDATED_KEY = "invidious-redirect--public-instances-updated";
    var ATTEMPTED_KEY = "invidious-redirect--public-instances-attempted";
    var RETRY_BACKOFF_MS = 36e5;
    function normalizeInstanceUrl(url) {
        const trimmed = url.trim();
        const scheme = /^http:\/\//i.test(trimmed) ? "http://" : "";
        const rest = trimmed.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
        return rest ? scheme + rest : "";
    }
    var storedInstanceUrl = normalizeInstanceUrl(
        localStorage.getItem(INSTANCE_URL_KEY) || "",
    );
    var instanceUrl = isValidInstanceUrl(storedInstanceUrl)
        ? storedInstanceUrl
        : normalizeInstanceUrl(DEFAULT_INSTANCE_URL);
    function isPlainObject(value) {
        return (
            typeof value === "object" && value !== null && !Array.isArray(value)
        );
    }
    function readCachedInstances() {
        try {
            const cached = JSON.parse(
                localStorage.getItem(INSTANCES_KEY) || "{}",
            );
            return isPlainObject(cached) ? cached : {};
        } catch (e) {
            return {};
        }
    }
    var publicInstances = readCachedInstances();
    var instancesUpdated = parseInt(localStorage.getItem(UPDATED_KEY) || "0");
    var instancesFailedAt = parseInt(
        localStorage.getItem(ATTEMPTED_KEY) || "0",
    );
    function getInstanceUrl() {
        return instanceUrl;
    }
    function toFullUrl(normalized) {
        return normalized.startsWith("http://")
            ? normalized
            : `https://${normalized}`;
    }
    function getFullInstanceUrl() {
        return toFullUrl(instanceUrl);
    }
    function isValidInstanceUrl(url) {
        const normalized = normalizeInstanceUrl(url);
        if (!/^(http:\/\/)?[^\s/?#@\\]+$/i.test(normalized)) return false;
        try {
            const parsed = new URL(toFullUrl(normalized));
            return (
                parsed.hostname !== "" &&
                parsed.username === "" &&
                parsed.password === ""
            );
        } catch (e) {
            return false;
        }
    }
    function setInstanceUrl(url) {
        instanceUrl = normalizeInstanceUrl(url);
        localStorage.setItem(INSTANCE_URL_KEY, instanceUrl);
    }
    async function getInstances() {
        const now = Date.now();
        const expired = now - instancesUpdated > 864e5;
        const backingOff = now - instancesFailedAt < RETRY_BACKOFF_MS;
        if (
            Object.keys(publicInstances).length !== 0 &&
            (!expired || backingOff)
        ) {
            return publicInstances;
        } else {
            let loaded;
            try {
                loaded = await loadInstances();
                if (!isPlainObject(loaded)) {
                    throw new Error("Invalid instances.json: not an object");
                }
            } catch (e) {
                if (Object.keys(publicInstances).length !== 0) {
                    instancesFailedAt = now;
                    localStorage.setItem(ATTEMPTED_KEY, now.toString());
                    return publicInstances;
                }
                throw e;
            }
            publicInstances = loaded;
            instancesUpdated = now;
            instancesFailedAt = 0;
            localStorage.removeItem(ATTEMPTED_KEY);
            localStorage.setItem(
                INSTANCES_KEY,
                JSON.stringify(publicInstances),
            );
            localStorage.setItem(UPDATED_KEY, instancesUpdated.toString());
            return publicInstances;
        }
    }
    function loadInstances() {
        const options = {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        };
        return new Promise((resolve, reject) => {
            const gm_xmlHttpRequest =
                (typeof GM !== "undefined" ? GM?.xmlHttpRequest : null) ||
                (typeof GM_xmlhttpRequest !== "undefined"
                    ? GM_xmlhttpRequest
                    : null);
            if (gm_xmlHttpRequest) {
                gm_xmlHttpRequest({
                    ...options,
                    nocache: true,
                    timeout: 15e3,
                    url: INSTANCES_JSON_URL,
                    onload: (response) => {
                        try {
                            if (
                                response.status < 200 ||
                                response.status >= 300
                            ) {
                                throw new Error(`HTTP ${response.status}`);
                            }
                            resolve(JSON.parse(response.responseText));
                        } catch (e) {
                            reject(e);
                        }
                    },
                    onerror: () =>
                        reject(
                            new Error(
                                "Unable to load instances.json: request failed",
                            ),
                        ),
                    ontimeout: () =>
                        reject(
                            new Error(
                                "Unable to load instances.json: request timed out",
                            ),
                        ),
                    onabort: () =>
                        reject(
                            new Error(
                                "Unable to load instances.json: request aborted",
                            ),
                        ),
                });
            } else if (false) {
                fetch("/instances.json", { cache: "no-cache", ...options })
                    .then((response) => response.json())
                    .then(resolve, reject);
            } else {
                reject(
                    new Error(
                        "Unable to load instances.json. Is the script running in a userscript manager?",
                    ),
                );
            }
        });
    }
    function clearInstances() {
        publicInstances = {};
        instancesUpdated = 0;
        instancesFailedAt = 0;
        localStorage.removeItem(ATTEMPTED_KEY);
        localStorage.removeItem(INSTANCES_KEY);
        localStorage.removeItem(UPDATED_KEY);
    }

    // assets/refresh.svg
    var refresh_default =
        '<svg width="13" height="13" viewBox="0 0 130 130"><path d="M22 63a8 8 0 0 1-16 0 59 59 0 0 1 97.1-45v-6.3a8 8 0 1 1 16.1 0V37a8 8 0 0 1-8 8l-24.4 2.2a8 8 0 1 1-1.4-16l8-.7A43 43 0 0 0 22 63zm22.8 19.6a8 8 0 0 1 1.5 16l-10 .9a43 43 0 0 0 71.7-32 8 8 0 0 1 16 0 59 59 0 0 1-95.6 46.2v4.2a8 8 0 0 1-16 0v-25a8 8 0 0 1 7.2-8l25.3-2.4z" style="fill:currentColor"/></svg>\n';

    // assets/new-tab.svg
    var new_tab_default =
        '<svg width="16" height="16" viewBox="0 0 96 96"><path d="M83 13 44 52m16-40h23v23M45 22H12v62h62l-0-32" style="fill:none;stroke:currentColor;stroke-width:var(--stroke-width);stroke-linecap:round;stroke-linejoin:round"/></svg>\n';

    // src/select.ts
    var INVIDIOUS_INSTANCE_CONTAINER = "invidious-instance-container";
    function escapeHtml(text) {
        return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
    }
    async function showDialog() {
        let instances = {};
        try {
            instances = await getInstances();
        } catch (e) {}
        const tableHtml = Object.entries(instances)
            .map(([uri, region]) => [
                escapeHtml(uri),
                escapeHtml(String(region).toLowerCase()),
            ])
            .map(
                ([uri, region]) => `
            <tr data-url="https://${uri}">
                <td>${uri}</td>
                <td>${region}</td>
                <td><a href="https://${uri}" target="_blank">${new_tab_default}</a></td>
            </tr>
        `,
            )
            .join("");
        const dialog = element(`
        <div id="${INVIDIOUS_INSTANCE_CONTAINER}" ondragstart="return false;">
            <div>
                <header>
                    <span>Select an Invidious instance</span>
                    <span class="refresh">${refresh_default}</span>
                    <span class="close">\u2715</span>
                    <a class="rateme" href="https://greasyfork.org/en/scripts/477967-redirect-to-invidious/feedback" target="_blank">
                        <div>
                            Rate this script! <span class="emoji">\u{1F60A}</span>
                        </div>
                    </a>
                </header>
                <table>${tableHtml}</table>
                <footer>
                    <div class="input-container">
                        <span class="input-helper">Add http:// if it\u2019s not an https:// URL.</span>
                        <input type="text" />
                    </div>
                    <button>Save</button>
                </footer>
            </div>
        </div>
    `);
        const input = dialog.querySelector("footer input");
        if (!input) return;
        input.value = getInstanceUrl() || "";
        input.placeholder = "invidious.snopyta.org";
        document.getElementById(INVIDIOUS_INSTANCE_CONTAINER)?.remove();
        document.body.appendChild(dialog);
        dialog.addEventListener(
            "click",
            (event) => {
                const target = event.target;
                if (!(target instanceof Element)) return;
                if (target.closest("a")) return;
                const dialog2 = target.closest(
                    `#${INVIDIOUS_INSTANCE_CONTAINER}`,
                );
                const input2 = dialog2?.querySelector("footer input");
                if (!dialog2 || !input2) return;
                event.preventDefault();
                event.stopPropagation();
                if (target.closest(".close")) {
                    dialog2.remove();
                } else if (target.closest(".refresh")) {
                    clearInstances();
                    dialog2.remove();
                    showDialog();
                } else if (target.closest("footer button")) {
                    if (isValidInstanceUrl(input2.value)) {
                        setInstanceUrl(input2.value);
                        dialog2.remove();
                    } else {
                        alert("Invalid URL");
                    }
                } else {
                    const url = target
                        .closest("tr[data-url]")
                        ?.getAttribute("data-url");
                    if (url) {
                        input2.value = url.replace(/^https:\/\//, "");
                    }
                }
            },
            true,
        );
    }

    // assets/button.png
    var button_default =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwBAMAAAClLOS0AAAAJFBMVEXv8e7Z4ePn6+kWt/CZzvChpKFrbWrT1dJVV1WJjIm2uLXCxMH33HXYAAAAp0lEQVR4AeXNIQ7CMABG4ceSsXSYIXFVFaCAC5BwgblNV4HDkMwiIA0YDMnkDMHWoHY5PPwGSfjsE4+fNbZIyXIBOszR1iu+lICWFmiuRGsOaPURbXOyKINb6FDyR/AoZlefURyNnuwxelKR6YmHVk2yK3qSd+iJKdATB9Be+PAEPakATIi8STzISVaiJ2lET4YFejIBPbmDnEy3ETmZ9REARr3lP7wAXHImU2sAU14AAAAASUVORK5CYII=";

    // css/style.css
    var style_default =
        '#set-invidious-url{position:fixed;bottom:0;right:0;height:48px;width:48px;z-index:99998;margin:1rem;cursor:pointer;border-radius:50%;box-shadow:0px 0px 3px #000;opacity:.5}#set-invidious-url:hover{opacity:1 !important}#invidious-instance-container,#invidious-instance-container *{font-family:mono;font-size:12px;box-sizing:border-box}#invidious-instance-container{position:fixed;top:0;left:0;right:0;bottom:0;background-color:rgba(0,0,0,.2);backdrop-filter:blur(2px);display:grid;place-content:center;z-index:99999;overflow-y:auto}#invidious-instance-container>div{background-color:#fff;box-shadow:10px 10px 20px rgba(0,0,0,.5);border-radius:5px;user-select:none}#invidious-instance-container header,#invidious-instance-container footer{background-color:#eee}#invidious-instance-container header{border-radius:5px 5px 0 0;display:grid;grid-template:"title refresh close" auto "rateme rateme rateme"/1fr auto auto;align-items:center;border-bottom:1px solid #ccc}#invidious-instance-container header>span{padding-left:10px}#invidious-instance-container footer{border-radius:0 0 5px 5px;padding:10px;display:grid;grid-template-columns:1fr auto;gap:10px;border-top:1px solid #ccc}#invidious-instance-container footer input{padding:5px;border:1px solid #ccc;border-radius:5px;width:100%}#invidious-instance-container footer button{padding:5px 10px;border:1px solid #ccc;border-radius:5px;cursor:pointer;background-color:#eee}#invidious-instance-container footer button:hover,#invidious-instance-container footer button:focus{background-color:#ddd}#invidious-instance-container footer button:active{background-color:#ccc}#invidious-instance-container table{border-collapse:collapse;margin:3px 0}#invidious-instance-container td{padding:0 10px;cursor:pointer}#invidious-instance-container td a{position:relative;top:1px;color:#888;text-decoration:none;--stroke-width: 8}#invidious-instance-container td a:hover{color:#000;--stroke-width: 12}#invidious-instance-container tr:hover td{background-color:#eee}#invidious-instance-container .input-helper{opacity:0;font-size:12px;position:absolute;background-color:rgba(0,0,0,.8);color:#fff;bottom:20px;left:0;right:0;padding:5px 10px;margin:0 25px;pointer-events:none;border-radius:5px;text-align:center;transition:.5s ease all}#invidious-instance-container .input-helper::after{content:"";position:absolute;top:100%;left:50%;border:solid rgba(0,0,0,0);height:0;width:0;border-top-color:#000;border-width:8px;margin-left:-8px}#invidious-instance-container .input-container{position:relative}#invidious-instance-container .input-container:hover .input-helper{opacity:1;bottom:30px}#invidious-instance-container .refresh,#invidious-instance-container .close{cursor:pointer;color:#000;text-decoration:none;font-size:20px}#invidious-instance-container .refresh:hover,#invidious-instance-container .refresh:focus,#invidious-instance-container .close:hover,#invidious-instance-container .close:focus{font-weight:bold}#invidious-instance-container .refresh,#invidious-instance-container .close{padding:5px 10px;border-top-right-radius:5px}#invidious-instance-container .refresh:hover,#invidious-instance-container .close:hover{color:#fff;background-color:rgba(255,0,0,.5)}#invidious-instance-container .refresh{border-top-right-radius:0}#invidious-instance-container .refresh:hover{background-color:rgba(0,192,0,.5)}#invidious-instance-container .rateme{justify-self:stretch;grid-area:rateme;display:flex;justify-content:center;background-color:#ddd;padding:5px 10px}#invidious-instance-container .rateme .emoji{font-variant-emoji:emoji}#invidious-instance-container .rateme{color:#000;text-decoration:none}#invidious-instance-container .rateme:hover,#invidious-instance-container .rateme:focus{font-weight:bold;background-color:#ccc}\n';

    // src/videourl.ts
    var VIDEO_ID_RE = /^[\w-]{11}$/;
    function pathSegment(path) {
        return decodeURIComponent(path.split("/")[0]);
    }
    function getVideoId(url) {
        try {
            const baseUrl = true
                ? window.location.origin
                : "https://www.youtube.com";
            const urlObj = new URL(url, baseUrl);
            let videoId = null;
            if (urlObj.pathname === "/watch") {
                videoId = urlObj.searchParams.get("v");
            } else if (urlObj.pathname.startsWith("/shorts/")) {
                videoId = pathSegment(urlObj.pathname.slice(8));
            } else if (urlObj.pathname.startsWith("/live/")) {
                videoId = pathSegment(urlObj.pathname.slice(6));
            } else if (urlObj.hostname === "youtu.be") {
                videoId = pathSegment(urlObj.pathname.slice(1));
            }
            if (videoId && VIDEO_ID_RE.test(videoId)) {
                return videoId;
            }
        } catch (e) {}
        const error = new Error(`Unable to parse URL: ${url}`);
        throw error;
    }

    // src/redirect.ts
    var currentUrl = window.location.href;
    function tryNavigate(href, replace = true, newTab = false) {
        try {
            const url = `${getFullInstanceUrl()}/watch?v=${encodeURIComponent(getVideoId(href))}`;
            if (newTab) {
                window.open(url, "_blank", "noopener");
            } else if (replace) {
                window.location.replace(url);
            } else {
                window.location.assign(url);
            }
            return true;
        } catch (e) {}
        return false;
    }
    tryNavigate(window.location.href, true);
    function onClick(event) {
        const isAux = event.type === "auxclick";
        if (event.button !== (isAux ? 1 : 0)) return;
        const newTab =
            isAux ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey;
        if (event.target instanceof Element) {
            const href = event.target.closest("a")?.getAttribute("href");
            if (href && tryNavigate(href, false, newTab)) {
                event.preventDefault();
                event.stopPropagation();
            }
        }
    }
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);
    setInterval(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            tryNavigate(window.location.href, true);
        }
    }, 150);

    // src/main.ts
    onload(() => {
        if (true) {
            let styles = element(`<style>${style_default}</style>`);
            document.head.appendChild(styles);
        }
        const button = element(
            `<img id="set-invidious-url" src="${button_default}" tabindex="-1">`,
        );
        button.addEventListener("click", () => showDialog());
        document.body.appendChild(button);
        if (false) {
            localStorage.clear();
            showDialog();
        }
    });
})();
