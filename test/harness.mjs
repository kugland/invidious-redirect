// Playwright harness: builds the userscript bundle and runs it on a stubbed youtube.com page.
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const HOME = "https://www.youtube.com/";
export const INSTANCES = { "a.example": "US 🇺🇸", "b.example": "DE 🇩🇪" };

const PAGE_HTML = `
    <a id="watch" href="/watch?v=abc">watch</a>
    <a id="shorts-amp" href="/shorts/abc&foo=bar">shorts with extra params</a>
    <a id="shorts-slash" href="/shorts/abc/">shorts with trailing slash</a>
    <a id="svg-link" href="/watch?v=svg"><svg width="40" height="40"><rect width="40" height="40" /></svg></a>
`;

let bundle;

/** Build the production bundle (without dropping console) into a temp dir. */
export function buildBundle() {
    const out = join(mkdtempSync(join(tmpdir(), "ir-test-")), "bundle.js");
    execFileSync(
        "esbuild",
        [
            "./src/main.ts",
            "--bundle",
            "--loader:.png=dataurl",
            "--loader:.css=text",
            "--loader:.svg=text",
            '--define:process.env.NODE_ENV="production"',
            `--outfile=${out}`,
            "--log-level=warning",
        ],
        { stdio: "inherit" },
    );
    bundle = readFileSync(out, "utf8");
}

export function launch() {
    return chromium.launch({
        executablePath: process.env.CHROMIUM_PATH || "chromium",
        args: ["--no-sandbox"],
    });
}

/**
 * Open a fresh browser context with the userscript injected.
 *
 * `mode` controls the GM_xmlhttpRequest stub: "ok" serves `instances`, "html404" responds with a
 * non-JSON body, "error" calls `onerror`.
 */
export async function open(
    browser,
    { mode = "ok", instances = INSTANCES, delay = 50 } = {},
) {
    const context = await browser.newContext();
    const state = { navigations: [], popups: 0 };

    await context.route("**/*", (route) => {
        const request = route.request();
        if (request.resourceType() === "document")
            state.navigations.push(request.url());
        route.fulfill({
            contentType: "text/html",
            body: request.url() === HOME ? PAGE_HTML : "<html></html>",
        });
    });
    await context.addInitScript(`
        window.__gmCalls = 0;
        window.GM_xmlhttpRequest = (o) => {
            window.__gmCalls++;
            setTimeout(() => {
                const mode = ${JSON.stringify(mode)};
                if (mode === "ok") o.onload({ status: 200, responseText: ${JSON.stringify(JSON.stringify(instances))} });
                else if (mode === "html404") o.onload({ status: 404, responseText: "<html>Not Found</html>" });
                else if (o.onerror) o.onerror({});
            }, ${delay});
        };
    `);
    // Like the userscript manager, only run on the @match'ed origin.
    await context.addInitScript(
        `if (location.hostname === "www.youtube.com") {\n${bundle}\n}`,
    );

    const page = await context.newPage();
    page.on("popup", () => state.popups++);
    page.on("pageerror", () => {}); // userscript errors are asserted through behaviour
    await page.goto(HOME);
    return { context, page, state };
}

export const gmCalls = (page) => page.evaluate(() => window.__gmCalls);
export const dialogs = (page) => page.locator("#invidious-instance-container");

/** Click `selector`, then return the URL of the navigation it caused (undefined if none). */
export async function clickAndGetNavigation(page, state, selector) {
    state.navigations.length = 0;
    const navigation = page
        .waitForRequest((request) => request.isNavigationRequest(), {
            timeout: 3000,
        })
        .then(
            (request) => request.url(),
            () => undefined,
        );
    await page.click(selector);
    return navigation;
}
