/** A YouTube video URL in the form `/watch?v=ID` or `/shorts/ID`. */
export type VideoUrl = string;

/** Get the video ID from a YouTube URL in the form `/watch?v=ID` or `/shorts/ID`. */
export function getVideoId(url: string): string {
    try {
        const baseUrl = process.env.NODE_ENV === "production" ? window.location.origin : "https://www.youtube.com";
        const urlObj = new URL(url, baseUrl);

        let videoId: string | null = null;
        if (urlObj.pathname === "/watch") {
            videoId = urlObj.searchParams.get("v");
        } else if (urlObj.pathname.startsWith("/shorts/")) {
            videoId = urlObj.pathname.slice(8);
        } else if (urlObj.pathname.startsWith("/live/")) {
            videoId = urlObj.pathname.slice(6);
        } else if (urlObj.hostname === "youtu.be") {
            videoId = urlObj.pathname.slice(1);
        }
        if (videoId) {
            return videoId;
        }
    } catch (e) {
        console.error(`getVideoId: ${e}`);
    }
    const error = new Error(`Unable to parse URL: ${url}`);
    console.error(`getVideoId: ${error}`);
    throw error;
}

/** Check if the given URL is a YouTube video URL in the form `/watch?v=ID` or `/shorts/ID`. */
export function isVideoUrl(url: string): url is VideoUrl {
    try {
        getVideoId(url);
        return true;
    } catch (e) {
        return false;
    }
}
