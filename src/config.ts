// @ts-ignore
const DEFAULT_INSTANCE_URL = "https://invidious.lunar.icu";
const INSTANCES_JSON_URL = "https://raw.githubusercontent.com/kugland" +
    "/invidious-redirect/master/instances.json";
const INSTANCE_URL_KEY = "invidious-redirect--instance";
const INSTANCES_KEY = "invidious-redirect--public-instances";
const UPDATED_KEY = "invidious-redirect--public-instances-updated";

let instanceUrl = localStorage.getItem(INSTANCE_URL_KEY) || DEFAULT_INSTANCE_URL;
let publicInstances = JSON.parse(localStorage.getItem(INSTANCES_KEY) || "{}") as Record<string, string>;
let instancesUpdated = parseInt(localStorage.getItem(UPDATED_KEY) || "0");

/** Get the instance URL that we should redirect to. */
export function getInstanceUrl() {
    return instanceUrl.replace(/\/$/, "").replace(/^https:\/\//, "");
}

/** Get the full instance URL that we should redirect to. */
export function getFullInstanceUrl() {
    if (instanceUrl.startsWith("http://")) {
        return instanceUrl;
    } else {
        return `https://${instanceUrl}`;
    }
}

/** Set the instance URL that we should redirect to. */
export function setInstanceUrl(url: string) {
    instanceUrl = url.replace(/\/$/, "").replace(/^https:\/\//, "");
    localStorage.setItem(INSTANCE_URL_KEY, url);
}

/** Get the public instances list. */
export async function getInstances(): Promise<Record<string, string>> {
    const now = Date.now();
    const expired = (now - instancesUpdated) > 86400000;
    if (Object.keys(publicInstances).length !== 0 && !expired) {
        return publicInstances;
    } else {
        publicInstances = await loadInstances();
        instancesUpdated = now;
        localStorage.setItem(INSTANCES_KEY, JSON.stringify(publicInstances));
        localStorage.setItem(UPDATED_KEY, instancesUpdated.toString());
        return publicInstances;
    }
}

/** Load the public instances list from the GitHub repository. */
async function loadInstances(): Promise<Record<string, string>> {
    const options = {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    } as const;

    return new Promise((resolve) => {
        const gm_xmlHttpRequest = (typeof GM !== "undefined" ? GM?.xmlHttpRequest : null) ||
            (typeof GM_xmlhttpRequest !== "undefined" ? GM_xmlhttpRequest : null);

        if (gm_xmlHttpRequest) {
            gm_xmlHttpRequest({
                ...options,
                nocache: true,
                url: INSTANCES_JSON_URL,
                onload: (response) => resolve(JSON.parse(response.responseText)),
            });
        } else if (process.env.NODE_ENV === "development") {
            fetch("/instances.json", { cache: "no-cache", ...options })
                .then(async (response) => resolve(await response.json()));
        } else {
            throw new Error(
                "Unable to load instances.json. Is the script running in a userscript manager?",
            );
        }
    }).then((instances) => instances as Record<string, string>);
}

/** Clear the saved instances */
export function clearInstances() {
    publicInstances = {};
    instancesUpdated = 0;
    localStorage.removeItem(INSTANCES_KEY);
    localStorage.removeItem(UPDATED_KEY);
}
