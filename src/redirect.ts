import { getFullInstanceUrl } from "./config";
import { getVideoId } from "./videourl";

let currentUrl = window.location.href;

function tryNavigate(href: string, replace = true): boolean {
    console.info(`tryNavigate: ${href}`);
    try {
        const url = `${getFullInstanceUrl()}/watch?v=${encodeURIComponent(getVideoId(href))}`;
        console.info(`tryNavigate: ${url}`);
        if (replace) {
            window.location.replace(url);
        } else {
            window.location.assign(url);
        }
        return true;
    } catch (e) {
        console.error(`tryNavigate: ${e}`);
    }
    return false;
}

// When loading, try to redirect to the Invidious instance.
tryNavigate(window.location.href, true);

// Redirect on click.
document.addEventListener(
    "click",
    (event: MouseEvent) => {
        // Leave modified and non-primary clicks (e.g. Ctrl+click to open in a new tab) to the browser.
        if (
            event.button !== 0 ||
            event.ctrlKey ||
            event.metaKey ||
            event.shiftKey ||
            event.altKey
        )
            return;

        if (event.target instanceof Element) {
            const href = event.target.closest("a")?.getAttribute("href");
            if (href && tryNavigate(href, false)) {
                event.preventDefault();
                event.stopPropagation();
            }
        }
    },
    true,
);

// Redirect on location change.
setInterval(() => {
    if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        tryNavigate(window.location.href, true);
    }
}, 150);
