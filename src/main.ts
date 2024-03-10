import { showDialog } from "./select";
import { element, onload } from "./domhelper";

// @ts-ignore
import buttonImg from "../assets/button.png";

// @ts-ignore
import styleCss from "../css/style.css";

import "./redirect";

// Add a settings button.
onload(() => {
    if (process.env.NODE_ENV === "production") {
        let styles = element<HTMLStyleElement>(`<style>${styleCss}</style>`);
        document.head.appendChild(styles);
    }

    const button = element(`<img id="set-invidious-url" src="${buttonImg}" tabindex="-1">`);
    button.addEventListener("click", () => showDialog());
    document.body.appendChild(button);

    if (process.env.NODE_ENV === "development") {
        localStorage.clear();
        showDialog();
    }
});
