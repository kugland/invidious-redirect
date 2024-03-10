/** Run a callback when the DOM is ready **/
export function onload(callback: () => void): void {
    if (document.readyState !== "loading") {
        callback();
    } else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}

/** Create an element from an HTML string **/
export function element<T extends HTMLElement = HTMLElement>(html: string): T {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content.firstChild as T;
}
