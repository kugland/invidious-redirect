import { element } from "./domhelper";
import {
    clearInstances,
    getInstances,
    getInstanceUrl,
    isValidInstanceUrl,
    setInstanceUrl,
} from "./config";

// @ts-ignore
import refreshImg from "../assets/refresh.svg";

// @ts-ignore
import newTabImg from "../assets/new-tab.svg";

const INVIDIOUS_INSTANCE_CONTAINER = "invidious-instance-container";

/** Escape a string for use in HTML text and quoted attribute values. */
function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export async function showDialog() {
    let instances: Record<string, string> = {};
    let loadFailed = false;
    try {
        instances = await getInstances();
    } catch (e) {
        // Still show the dialog, so that an instance can be entered manually.
        loadFailed = true;
        console.error(`showDialog: ${e}`);
    }

    // The list comes from the network, so everything in it is escaped before going into the HTML.
    const tableHtml = Object.entries(instances)
        .map(([uri, region]) => [
            escapeHtml(uri),
            escapeHtml(region.toLowerCase()),
        ])
        .map(
            ([uri, region]) => `
            <tr data-url="https://${uri}">
                <td>${uri}</td>
                <td>${region}</td>
                <td><a href="https://${uri}" target="_blank">${newTabImg}</a></td>
            </tr>
        `,
        )
        .join("");

    const errorHtml = loadFailed
        ? `<div class="load-error" role="alert">Failed to load the instance list. Click the refresh icon (top right) to try again, or enter an instance below.</div>`
        : "";

    const dialog = element<HTMLDivElement>(`
        <div id="${INVIDIOUS_INSTANCE_CONTAINER}" ondragstart="return false;">
            <div>
                <header>
                    <span>Select an Invidious instance</span>
                    <span class="refresh">${refreshImg}</span>
                    <span class="close">✕</span>
                    <a class="rateme" href="https://greasyfork.org/en/scripts/477967-redirect-to-invidious/feedback" target="_blank">
                        <div>
                            Rate this script! <span class="emoji">😊</span>
                        </div>
                    </a>
                </header>
                ${errorHtml}
                <table>${tableHtml}</table>
                <footer>
                    <div class="input-container">
                        <span class="input-helper">Add http:// if it’s not an https:// URL.</span>
                        <input type="text" />
                    </div>
                    <button>Save</button>
                </footer>
            </div>
        </div>
    `);

    const input = dialog.querySelector<HTMLInputElement>("footer input");
    if (!input) return;

    input.value = getInstanceUrl() || "";
    input.placeholder = "invidious.snopyta.org";

    // Only one dialog at a time (showDialog may have been called again while loading the list).
    document.getElementById(INVIDIOUS_INSTANCE_CONTAINER)?.remove();
    document.body.appendChild(dialog);

    dialog.addEventListener(
        "click",
        (event) => {
            console.info(event);

            const target = event.target;
            if (!(target instanceof Element)) return;

            // Let links (and anything inside them, like icons) behave normally.
            if (target.closest("a")) return;

            const dialog = target.closest(`#${INVIDIOUS_INSTANCE_CONTAINER}`);
            const input =
                dialog?.querySelector<HTMLInputElement>("footer input");
            if (!dialog || !input) return;

            // Only act on elements we recognise; leave everything else (e.g. the input) alone.
            const row = target.closest("tr[data-url]");
            const isClose = target.closest(".close");
            const isRefresh = target.closest(".refresh");
            const isSave = target.closest("footer button");
            if (!isClose && !isRefresh && !isSave && !row) return;

            event.preventDefault();
            event.stopPropagation();

            if (isClose) {
                dialog.remove();
            } else if (isRefresh) {
                clearInstances();
                dialog.remove();
                showDialog();
            } else if (isSave) {
                if (isValidInstanceUrl(input.value)) {
                    setInstanceUrl(input.value);
                    dialog.remove();
                } else {
                    alert("Invalid URL");
                }
            } else {
                const url = row?.getAttribute("data-url");
                if (url) {
                    input.value = url.replace(/^https:\/\//, "");
                }
            }
        },
        true,
    );
}
