// ==UserScript==
// @name        Redirect to Invidious
// @author      André Kugland
// @description Redirects YouTube videos to an Invidious instance.
// @namespace   https://github.com/kugland
// @license     MIT
// @version     0.3.0
// @match       *://*.youtube.com/
// @match       *://*.youtube.com/*
// @run-at      document-start
// @noframes
// @homepageURL https://greasyfork.org/scripts/477967-redirect-to-invidious
// @downloadURL https://update.greasyfork.org/scripts/477967/Redirect%20to%20Invidious.user.js
// @updateURL https://update.greasyfork.org/scripts/477967/Redirect%20to%20Invidious.meta.js
// ==/UserScript==
(() => {
  // instances.ts
  var instances_default = {
    "grwp24hodrefzvjjuccrkw3mjq4tzhaaq32amf33dzpmuxe7ilepcmad.onion": "US \u{1F1FA}\u{1F1F8}",
    "http://pjsfhqamc7k6htnumrvn4cwqqdoggeepj7u5viyimgnxg3gar72q.b32.i2p": "FR \u{1F1EB}\u{1F1F7}",
    "http://pjsfi2szfkb4guqzmfmlyq4no46fayertjrwt4h2uughccrh2lvq.b32.i2p": "LU \u{1F1F1}\u{1F1FA}",
    "inv.n8pjl.ca": "CA \u{1F1E8}\u{1F1E6}",
    "inv.nadeko.net": "CL \u{1F1E8}\u{1F1F1}",
    "inv.nadekonw7plitnjuawu6ytjsl7jlglk2t6pyq6eftptmiv3dvqndwvyd.onion": "CL \u{1F1E8}\u{1F1F1}",
    "inv.pjsfkvpxlinjamtawaksbnnaqs2fc2mtvmozrzckxh7f3kis6yea25ad.onion": "FR \u{1F1EB}\u{1F1F7}",
    "inv.tux.pizza": "US \u{1F1FA}\u{1F1F8}",
    "inv.us.projectsegfau.lt": "US \u{1F1FA}\u{1F1F8}",
    "invidious.drgns.space": "US \u{1F1FA}\u{1F1F8}",
    "invidious.einfachzocken.eu": "DE \u{1F1E9}\u{1F1EA}",
    "invidious.fdn.fr": "FR \u{1F1EB}\u{1F1F7}",
    "invidious.flokinet.to": "RO \u{1F1F7}\u{1F1F4}",
    "invidious.g4c3eya4clenolymqbpgwz3q3tawoxw56yhzk4vugqrl6dtu3ejvhjid.onion": "FR \u{1F1EB}\u{1F1F7}",
    "invidious.jing.rocks": "JP \u{1F1EF}\u{1F1F5}",
    "invidious.lunar.icu": "DE \u{1F1E9}\u{1F1EA}",
    "invidious.nerdvpn.de": "DE \u{1F1E9}\u{1F1EA}",
    "invidious.perennialte.ch": "AU \u{1F1E6}\u{1F1FA}",
    "invidious.privacydev.net": "FR \u{1F1EB}\u{1F1F7}",
    "invidious.private.coffee": "AT \u{1F1E6}\u{1F1F9}",
    "invidious.projectsegfau.lt": "FR \u{1F1EB}\u{1F1F7}",
    "invidious.protokolla.fi": "DE \u{1F1E9}\u{1F1EA}",
    "iv.datura.network": "DE \u{1F1E9}\u{1F1EA}",
    "iv.ggtyler.dev": "US \u{1F1FA}\u{1F1F8}",
    "iv.melmac.space": "DE \u{1F1E9}\u{1F1EA}",
    "iv.nboeck.de": "FI \u{1F1EB}\u{1F1EE}",
    "jemgkaq2xibfu37hm2xojsxoi7djtwb25w6krhl63lhn52xfzgeyc2ad.onion": "DE \u{1F1E9}\u{1F1EA}",
    "ng27owmagn5amdm7l5s3rsqxwscl5ynppnis5dqcasogkyxcfqn7psid.onion": "DE \u{1F1E9}\u{1F1EA}",
    "vid.puffyan.us": "US \u{1F1FA}\u{1F1F8}",
    "yewtu.be": "DE \u{1F1E9}\u{1F1EA}",
    "youtube.owacon.moe": "JP \u{1F1EF}\u{1F1F5}",
    "yt.artemislena.eu": "DE \u{1F1E9}\u{1F1EA}",
    "yt.cdaut.de": "DE \u{1F1E9}\u{1F1EA}",
    "yt.drgnz.club": "CZ \u{1F1E8}\u{1F1FF}",
    "zzlsbhhfvwg3oh36tcvx4r7n6jrw7zibvyvfxqlodcwn3mfrvzuq.b32.i2p": "CL \u{1F1E8}\u{1F1F1}"
  };

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
  function getTable(current) {
    let sorted = Array.from(Object.keys(instances_default)).sort((a, b) => {
      const region_a = instances_default[a];
      const region_b = instances_default[b];
      if (region_a !== region_b)
        return region_a.localeCompare(region_b);
      else
        return a.localeCompare(b);
    }).map((uri) => [uri, instances_default[uri]]);
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
  function showTable(current) {
    const table = document.createElement("div");
    table.id = "invidious-instance-container";
    table.innerHTML = `<table id="invidious-instance-table">${getTable(current)}</table>`;
    table.appendChild(getStyle());
    document.body.appendChild(table);
    return new Promise((resolve) => {
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
      return url.searchParams.get("v");
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
