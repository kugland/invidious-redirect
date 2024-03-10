import { element } from "./domhelper";
import { clearInstances, getInstances, getInstanceUrl, setInstanceUrl } from "./config";

// @ts-ignore
import refreshImg from "../assets/refresh.svg";

// @ts-ignore
import newTabImg from "../assets/new-tab.svg";

const INVIDIOUS_INSTANCE_CONTAINER = "invidious-instance-container";

export async function showDialog() {
    const instances = await getInstances();

    const tableHtml = Object.keys(instances)
        .map((uri) => `
            <tr data-url="https://${uri}">
                <td>${uri}</td>
                <td>${instances[uri].toLowerCase()}</td>
                <td><a href="https://${uri}" target="_blank">${newTabImg}</a></td>
            </tr>
        `)
        .join("");

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

    document.body.appendChild(dialog);

    dialog.addEventListener("click", (event) => {
        console.info(event);

        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        const dialog = target.closest(`#${INVIDIOUS_INSTANCE_CONTAINER}`);
        const input = dialog?.querySelector<HTMLInputElement>("footer input");
        if (!dialog || !input) return;

        if (target.tagName != "A") {
            event.preventDefault();
            event.stopPropagation();
        }

        if (target.matches(".close")) {
            dialog.remove();
        } else if (target.matches(".refresh")) {
            clearInstances();
            dialog.remove();
            showDialog();
        } else if (target.matches("tr[data-url] *:not(a)")) {
            const url = target.closest("tr")?.getAttribute("data-url");
            if (url) {
                input.value = url.replace(/^https:\/\//, "");
            }
        } else if (target.matches("footer button")) {
            try {
                new URL(`https://${input.value}`);
                setInstanceUrl(input.value);
                dialog.remove();
            } catch (e) {
                alert("Invalid URL");
            }
        }
    }, true);
}
