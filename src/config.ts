// @ts-ignore
const DEFAULT_INSTANCE_URL = "https://inv.nadeko.net";
const INSTANCES_JSON_URL =
    "https://raw.githubusercontent.com/kugland" +
    "/invidious-redirect/master/instances.json";
const INSTANCE_URL_KEY = "invidious-redirect--instance";
const INSTANCES_KEY = "invidious-redirect--public-instances";
const UPDATED_KEY = "invidious-redirect--public-instances-updated";
const ATTEMPTED_KEY = "invidious-redirect--public-instances-attempted";
/** After a failed refresh, keep serving the stale list for this long before trying again. */
const RETRY_BACKOFF_MS = 3600000;

/**
 * Normalize an instance URL: trim whitespace and trailing slashes, and drop the `https://` scheme,
 * which is implied. An explicit `http://` scheme is kept. Returns "" if nothing is left.
 */
function normalizeInstanceUrl(url: string): string {
    const trimmed = url.trim();
    const scheme = /^http:\/\//i.test(trimmed) ? "http://" : "";
    const rest = trimmed.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    return rest ? scheme + rest : "";
}

const storedInstanceUrl = normalizeInstanceUrl(
    localStorage.getItem(INSTANCE_URL_KEY) || "",
);
let instanceUrl = isValidInstanceUrl(storedInstanceUrl)
    ? storedInstanceUrl
    : normalizeInstanceUrl(DEFAULT_INSTANCE_URL);

/**
 * Validate and sanitize a parsed instances list. This is the single place where the shape of
 * the list is checked, so consumers can rely on the result: a non-empty `{ host: region }`
 * object whose keys are bare `host[:port]` values and whose values are strings. Entries that
 * don't fit are dropped. Throws if the value is not an object or nothing valid is left.
 */
export function parseInstances(value: unknown): Record<string, string> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new Error("Invalid instances list: not an object");
    }
    const instances: Record<string, string> = {};
    for (const [host, region] of Object.entries(value)) {
        if (
            typeof region === "string" &&
            !/^https?:\/\//i.test(host) &&
            isValidInstanceUrl(host)
        ) {
            instances[host] = region;
        }
    }
    if (Object.keys(instances).length === 0) {
        throw new Error("Invalid instances list: no valid entries");
    }
    return instances;
}

/** Read the cached instances list, ignoring anything that is not valid. */
function readCachedInstances(): Record<string, string> {
    try {
        return parseInstances(
            JSON.parse(localStorage.getItem(INSTANCES_KEY) || "null"),
        );
    } catch (e) {
        return {};
    }
}

let publicInstances = readCachedInstances();
let instancesUpdated = parseInt(localStorage.getItem(UPDATED_KEY) || "0");
let instancesFailedAt = parseInt(localStorage.getItem(ATTEMPTED_KEY) || "0");

/** Get the instance URL that we should redirect to. */
export function getInstanceUrl() {
    return instanceUrl;
}

/** Turn a normalized instance URL into a full one, with its scheme. */
function toFullUrl(normalized: string): string {
    return normalized.startsWith("http://")
        ? normalized
        : `https://${normalized}`;
}

/** Get the full instance URL that we should redirect to. */
export function getFullInstanceUrl() {
    return toFullUrl(instanceUrl);
}

/** Check whether the user-provided string is a usable instance URL. */
export function isValidInstanceUrl(url: string): boolean {
    const normalized = normalizeInstanceUrl(url);
    // Only host[:port] is allowed: no path, query, fragment or userinfo.
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

/** Set the instance URL that we should redirect to. */
export function setInstanceUrl(url: string) {
    instanceUrl = normalizeInstanceUrl(url);
    localStorage.setItem(INSTANCE_URL_KEY, instanceUrl);
}

/** Get the public instances list. */
export async function getInstances(): Promise<Record<string, string>> {
    const now = Date.now();
    const expired = now - instancesUpdated > 86400000;
    const backingOff = now - instancesFailedAt < RETRY_BACKOFF_MS;
    if (Object.keys(publicInstances).length !== 0 && (!expired || backingOff)) {
        return publicInstances;
    } else {
        let loaded: Record<string, string>;
        try {
            loaded = parseInstances(await loadInstances());
        } catch (e) {
            console.error(`getInstances: ${e}`);
            // Serve a stale list if we have one, otherwise let the caller deal with it.
            if (Object.keys(publicInstances).length !== 0) {
                // Remember the failure, so that we don't wait for a timeout on every call.
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
        localStorage.setItem(INSTANCES_KEY, JSON.stringify(publicInstances));
        localStorage.setItem(UPDATED_KEY, instancesUpdated.toString());
        return publicInstances;
    }
}

/** Load the public instances list from the GitHub repository. Rejects if it can't be loaded. */
function loadInstances(): Promise<unknown> {
    const options = {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    } as const;

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
                timeout: 15000,
                url: INSTANCES_JSON_URL,
                onload: (response) => {
                    try {
                        if (response.status < 200 || response.status >= 300) {
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
        } else if (process.env.NODE_ENV === "development") {
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

/** Clear the saved instances */
export function clearInstances() {
    publicInstances = {};
    instancesUpdated = 0;
    instancesFailedAt = 0;
    localStorage.removeItem(ATTEMPTED_KEY);
    localStorage.removeItem(INSTANCES_KEY);
    localStorage.removeItem(UPDATED_KEY);
}
