import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
    buildBundle,
    clickAndGetNavigation,
    dialogs,
    gmCalls,
    HOME,
    launch,
    open,
} from "./harness.mjs";

let browser;
before(async () => {
    buildBundle();
    browser = await launch();
});
after(() => browser?.close());

/** Run `fn` with a fresh page, and always close its context. */
async function withPage(options, fn) {
    const { context, page, state } = await open(browser, options);
    try {
        await fn(page, state);
    } finally {
        await context.close();
    }
}

async function saveInstance(page, value) {
    await page.click("#set-invidious-url");
    await page.waitForSelector("footer input");
    await page.fill("footer input", value);
    await page.click("footer button");
}

describe("instance URL normalization", () => {
    test("the default instance redirects to a well-formed URL", () =>
        withPage({}, async (page, state) => {
            const url = await clickAndGetNavigation(page, state, "#watch");
            assert.equal(url, "https://inv.nadeko.net/watch?v=abc");
        }));

    for (const [typed, expected] of [
        ["foo.example", "https://foo.example/watch?v=abc"],
        ["https://foo.example", "https://foo.example/watch?v=abc"],
        ["foo.example/", "https://foo.example/watch?v=abc"],
        ["http://foo.example/", "http://foo.example/watch?v=abc"],
    ]) {
        test(`saved ${JSON.stringify(typed)} survives a reload`, () =>
            withPage({}, async (page, state) => {
                await saveInstance(page, typed);
                await page.goto(HOME); // fresh load reads the persisted value
                const url = await clickAndGetNavigation(page, state, "#watch");
                assert.equal(url, expected);
            }));
    }
});

describe("instance list loading", () => {
    for (const mode of ["html404", "error"]) {
        test(`the dialog still opens when loading fails (${mode})`, () =>
            withPage({ mode }, async (page) => {
                await page.click("#set-invidious-url");
                await dialogs(page).waitFor({ timeout: 2000 });
                // A manual URL can still be entered.
                await page.fill("footer input", "foo.example");
                await page.click("footer button");
                assert.equal(await dialogs(page).count(), 0);
            }));
    }

    test("a failed refresh does not leave a failure cached", () =>
        withPage({ mode: "error" }, async (page) => {
            await page.click("#set-invidious-url");
            await dialogs(page).waitFor({ timeout: 2000 });
            await page.click(".close");
            await page.click("#set-invidious-url");
            await dialogs(page).waitFor({ timeout: 2000 });
            assert.equal(await gmCalls(page), 2); // retried instead of serving a cached failure
        }));
});

describe("stale instance list", () => {
    test("a failed refresh of an expired list is not retried on every dialog open", () =>
        withPage({ mode: "error", delay: 3000 }, async (page) => {
            // Seed a cache that is older than 24h, then reload so the script picks it up.
            await page.evaluate(() => {
                localStorage.setItem(
                    "invidious-redirect--public-instances",
                    JSON.stringify({ "stale.example": "US" }),
                );
                localStorage.setItem(
                    "invidious-redirect--public-instances-updated",
                    "1",
                );
            });
            await page.reload();
            await page.click("#set-invidious-url");
            await dialogs(page).waitFor({ timeout: 10000 }); // first open waits for the failure
            assert.equal(await gmCalls(page), 1);
            await page.click(".close");
            await page.click("#set-invidious-url");
            // Must not wait for another (3s) failed request.
            await dialogs(page).waitFor({ timeout: 1000 });
            assert.equal(await gmCalls(page), 1);
            await page.locator("tr", { hasText: "stale.example" }).waitFor();
        }));
});

describe("dialog click handling", () => {
    test("clicking inside the rate-me link opens it", () =>
        withPage({}, async (page, state) => {
            await page.click("#set-invidious-url");
            await page.waitForSelector("table tr");
            await page.locator(".rateme div").click();
            await page.waitForTimeout(500);
            assert.equal(state.popups, 1);
        }));

    test("clicking the refresh icon reloads the instance list", () =>
        withPage({}, async (page) => {
            await page.click("#set-invidious-url");
            await page.waitForSelector("table tr");
            assert.equal(await gmCalls(page), 1);
            await page.locator(".refresh svg").click();
            await page.waitForFunction(() => window.__gmCalls === 2, null, {
                timeout: 2000,
            });
            await page.waitForSelector("table tr");
            assert.equal(await dialogs(page).count(), 1);
        }));

    test("clicking a row fills the input; the close button closes", () =>
        withPage({}, async (page) => {
            await page.click("#set-invidious-url");
            await page
                .locator("tr", { hasText: "b.example" })
                .locator("td")
                .first()
                .click();
            assert.equal(await page.inputValue("footer input"), "b.example");
            await page.click(".close");
            assert.equal(await dialogs(page).count(), 0);
        }));
});

describe("video ID encoding", () => {
    test("extra characters in the path cannot inject query parameters", () =>
        withPage({}, async (page, state) => {
            const url = new URL(
                await clickAndGetNavigation(page, state, "#shorts-amp"),
            );
            assert.deepEqual([...url.searchParams.keys()], ["v"]);
        }));

    test("a trailing slash is not part of the video ID", () =>
        withPage({}, async (page, state) => {
            const url = await clickAndGetNavigation(
                page,
                state,
                "#shorts-slash",
            );
            assert.equal(url, "https://inv.nadeko.net/watch?v=abc");
        }));
});

describe("click redirection", () => {
    test("clicking an SVG inside a video link is redirected", () =>
        withPage({}, async (page, state) => {
            const url = await clickAndGetNavigation(
                page,
                state,
                "#svg-link svg",
            );
            assert.equal(url, "https://inv.nadeko.net/watch?v=svg");
        }));

    for (const modifier of ["Control", "Meta", "Shift", "Alt"]) {
        test(`${modifier}+click is left to the browser`, () =>
            withPage({}, async (page) => {
                const navigations = [];
                page.on("request", (request) => {
                    if (
                        request.isNavigationRequest() &&
                        request.frame() === page.mainFrame()
                    ) {
                        navigations.push(request.url());
                    }
                });
                await page.click("#watch", { modifiers: [modifier] });
                await page.waitForTimeout(500);
                // What the browser does with a modified click is up to it (new tab, download, native
                // same-tab navigation...), but the click handler itself must not send this page
                // straight to the instance.
                const first = navigations[0];
                assert.ok(
                    first === undefined || first.startsWith(HOME),
                    `first navigation: ${first}`,
                );
            }));
    }
});

describe("dialog robustness", () => {
    test("opening the dialog twice quickly shows only one", () =>
        withPage({ delay: 300 }, async (page) => {
            await page.click("#set-invidious-url");
            await page.click("#set-invidious-url");
            await page.waitForSelector("table tr");
            await page.waitForTimeout(700);
            assert.equal(await dialogs(page).count(), 1);
        }));

    test("instance data is escaped, not interpreted as HTML", () =>
        withPage(
            {
                instances: {
                    [`x.example"><img src=x onerror="window.__xss=1">`]: `<img src=x onerror="window.__xss=2">`,
                },
            },
            async (page) => {
                await page.click("#set-invidious-url");
                await page.waitForSelector("table tr");
                await page.waitForTimeout(300);
                assert.equal(
                    await page.evaluate(() => window.__xss),
                    undefined,
                );
                assert.equal(await page.locator("table img").count(), 0);
                // The data is still shown, as text, and usable.
                assert.match(
                    await page.locator("table tr td").nth(1).innerText(),
                    /<img/,
                );
                await page.locator("table tr td").first().click();
                assert.match(
                    await page.inputValue("footer input"),
                    /^x\.example"><img/,
                );
            },
        ));

    for (const bad of ["http://", "https://", "", "   "]) {
        test(`saving ${JSON.stringify(bad)} is rejected`, () =>
            withPage({}, async (page) => {
                const alerts = [];
                page.on("dialog", (d) => {
                    alerts.push(d.message());
                    d.dismiss();
                });
                await page.click("#set-invidious-url");
                await page.waitForSelector("footer input");
                await page.fill("footer input", bad);
                await page.click("footer button");
                await page.waitForTimeout(200);
                assert.deepEqual(alerts, ["Invalid URL"]);
                assert.equal(await dialogs(page).count(), 1);
            }));
    }
});
