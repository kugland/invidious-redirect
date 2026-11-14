import { getFullInstanceUrl } from "./config";
import { getVideoId } from "./videourl";

let currentUrl = window.location.href;

function tryNavigate(href: string, replace = true, newTab = false): boolean {
    console.info(`tryNavigate: ${href}`);
    try {
        const url = `${getFullInstanceUrl()}/watch?v=${encodeURIComponent(getVideoId(href))}`;
        console.info(`tryNavigate: ${url}`);
        if (newTab) {
            window.open(url, "_blank", "noopener");
        } else if (replace) {
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

// Redirect on click. Modified clicks (Ctrl/Meta/Shift/Alt) and middle-clicks (`auxclick`) open the instance in
// a new tab, like the browser would do natively; plain clicks navigate the current tab.
function onClick(event: MouseEvent) {
    const isAux = event.type === "auxclick";
    // Only the primary button (click) and the middle button (auxclick); the right button is left alone.
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

// Redirect on location change.
setInterval(() => {
    if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        tryNavigate(window.location.href, true);
    }
}, 150);
