// ==UserScript==
// @name        Redirect to Invidious
// @author      André Kugland
// @description Redirects YouTube videos to an Invidious instance.
// @namespace   https://github.com/kugland
// @license     MIT
// @version     0.3.1
// @match       *://*.youtube.com/
// @match       *://*.youtube.com/*
// @run-at      document-start
// @noframes
// @grant       GM_xmlhttpRequest
// @grant       GM.xmlhttpRequest
// @homepageURL https://greasyfork.org/scripts/477967-redirect-to-invidious
// @downloadURL https://update.greasyfork.org/scripts/477967/Redirect%20to%20Invidious.user.js
// @updateURL   https://update.greasyfork.org/scripts/477967/Redirect%20to%20Invidious.meta.js
// ==/UserScript==
(() => {
  // select-instance.ts
  function getStyle() {
    const style = document.createElement("style");
    style.textContent = `
        #invidious-instance-container {
            font-family: mono;
            font-size: 12px;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
            display: grid;
            place-content: center;
            z-index: 10000;
        }

        #invidious-instance-table {
            background-color: white;
            padding: 10px 15px;
            box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.5);
        }

        #invidious-instance-table td {
            padding-left: 10px;
        }

        #invidious-instance-table td:first-child {
            padding-left: 0;
        }

        #invidious-instance-table button {
            font-family: mono;
            font-size: 12px;
            padding: 4px 5px;
            border: none;
            background-color: #007bff;
            color: white;
            cursor: pointer;
        }

        #invidious-instance-table .selected {
            font-weight: bold;
        }
    `;
    return style;
  }
  function addProtocol(uri) {
    if (uri.startsWith("http"))
      return uri;
    else
      return `https://${uri}`;
  }
  async function getInstances() {
    const instancesLastUpdatedKey = "invidious-redirect-instances-last-updated";
    const instancesKey = "invidious-redirect-instances";
    const now = Date.now();
    const lastUpdated = parseInt(localStorage.getItem(instancesLastUpdatedKey) ?? "0");
    if (lastUpdated && now - lastUpdated < 864e5) {
      return JSON.parse(localStorage.getItem(instancesKey));
    } else {
      const instances = await new Promise((resolve) => {
        (GM.xmlHttpRequest || GM_xmlhttpRequest)({
          method: "GET",
          headers: { "Content-Type": "application/json" },
          url: "https://raw.githubusercontent.com/kugland/invidious-redirect/master/instances.json",
          onload: function(response) {
            resolve(JSON.parse(response.responseText));
          }
        });
      });
      localStorage.setItem(instancesKey, JSON.stringify(instances));
      localStorage.setItem(instancesLastUpdatedKey, now.toString());
      return instances;
    }
  }
  async function getTable(current) {
    const instances = await getInstances();
    let sorted = Array.from(Object.keys(instances)).sort((a, b) => instances[a] !== instances[b] ? instances[a].localeCompare(instances[b]) : a.localeCompare(b)).map((uri) => [uri, instances[uri]]);
    return sorted.map(([uri, region]) => [uri, region]).filter(([uri]) => !uri.endsWith(".i2p") && !uri.endsWith(".onion")).map(([uri, region]) => {
      let url = addProtocol(uri);
      uri = uri.replace(/^https?:\/\//, "");
      return `
                <tr data-url="${url}" class=${current == url ? "selected" : ""}>
                    <td><a href="${url}" target="_blank">${uri}</a></td>
                    <td>${region.toLowerCase()}</td>
                    <td><button>select</button></td>
                </tr>
            `;
    }).join("");
  }
  async function showTable(current) {
    const table = document.createElement("div");
    table.id = "invidious-instance-container";
    table.innerHTML = `<table id="invidious-instance-table">${await getTable(current)}</table>`;
    table.appendChild(getStyle());
    document.body.appendChild(table);
    return await new Promise((resolve) => {
      table.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", (e) => {
          const tr = e.target.closest("tr");
          if (tr) {
            const url = tr.getAttribute("data-url");
            if (url) {
              table.remove();
              resolve(url);
            }
          }
        });
      });
    });
  }

  // invidious-redirect.ts
  var instanceKey = "invidious-redirect-instance";
  var defaultInstance = "https://yewtu.be";
  localStorage.getItem(instanceKey) || localStorage.setItem(instanceKey, defaultInstance);
  function makeUrl(videoId) {
    const instance = localStorage.getItem(instanceKey);
    return new URL(`${instance}/watch?v=${videoId}`).href;
  }
  function getVideoId(href) {
    const url = new URL(href, window.location.href);
    if (url.pathname === "/watch") {
      return url.searchParams.get("v") ?? "";
    } else {
      const videoId = url.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)$/)?.[1];
      if (videoId)
        return videoId;
    }
    throw new Error(`Unable to parse URL: ${href}`);
  }
  document.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement) {
      try {
        const href = event.target.closest("a")?.getAttribute("href");
        if (href) {
          event.preventDefault();
          event.stopPropagation();
          window.location.assign(makeUrl(getVideoId(href)));
        }
      } catch (e) {
      }
    }
  }, true);
  var currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      try {
        window.location.replace(makeUrl(getVideoId(currentUrl)));
      } catch (e) {
      }
    }
  }, 150);
  try {
    window.location.replace(makeUrl(getVideoId(currentUrl)));
  } catch (e) {
  }
  ((fn) => {
    if (document.readyState !== "loading")
      fn();
    else
      document.addEventListener("DOMContentLoaded", fn);
  })(() => {
    const css = document.createElement("style");
    css.textContent = "#set-invidious-url:hover { opacity: 1 !important; }";
    document.head.appendChild(css);
    const button = document.createElement("img");
    button.id = "set-invidious-url";
    button.tabIndex = -1;
    button.src = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwBAMAAAClLOS0AAAAJFBMVEXv8e7
        Z4ePn6+kWt/CZzvChpKFrbWrT1dJVV1WJjIm2uLXCxMH33HXYAAAAp0lEQVR4AeXNIQ7CMABG4ceSsXSYIXFVFaCAC5
        BwgblNV4HDkMwiIA0YDMnkDMHWoHY5PPwGSfjsE4+fNbZIyXIBOszR1iu+lICWFmiuRGsOaPURbXOyKINb6FDyR/AoZ
        lefURyNnuwxelKR6YmHVk2yK3qSd+iJKdATB9Be+PAEPakATIi8STzISVaiJ2lET4YFejIBPbmDnEy3ETmZ9REARr3l
        P7wAXHImU2sAU14AAAAASUVORK5CYII=`.replace(/\s/g, "");
    Object.assign(button.style, {
      "position": "fixed",
      "bottom": 0,
      "right": 0,
      "height": "48px",
      "width": "48px",
      "z-index": 99999,
      "margin": "1rem",
      "cursor": "pointer",
      "border-radius": "50%",
      "box-shadow": "0px 0px 3px black",
      "opacity": 0.5
    });
    button.addEventListener("click", async () => {
      const current = localStorage.getItem(instanceKey) ?? defaultInstance;
      let instance = await showTable(current);
      try {
        new URL(instance);
        localStorage.setItem(instanceKey, instance);
      } catch (e) {
        alert(`The URL you entered is invalid: ${instance}`);
      }
    });
    document.body.appendChild(button);
  });
})();
