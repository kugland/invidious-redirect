# Invidious Redirect

![Greasy Fork Version](https://img.shields.io/greasyfork/v/477967-redirect-to-invidious)
![Greasy Fork Downloads](https://img.shields.io/greasyfork/dt/477967-redirect-to-invidious)
![Greasy Fork Rating](https://img.shields.io/greasyfork/rating-count/477967-redirect-to-invidious)
![Greasy Fork License](https://img.shields.io/greasyfork/l/477967-redirect-to-invidious)

This userscript redirects YouTube videos to an Invidious instance.

**GitHub page:**
[https://github.com/kugland/invidious-redirect](https://github.com/kugland/invidious-redirect)

**Greasy Fork page:**
[https://greasyfork.org/scripts/477967-redirect-to-invidious](https://greasyfork.org/scripts/477967-redirect-to-invidious)

## Usage

To use this script, you'll need a userscript manager like Tampermonkey or
Greasemonkey. You can install it from its page at
[GreasyFork](https://greasyfork.org/scripts/477967-redirect-to-invidious), or by
copying the contents of
[invidious-redirect.js](https://raw.githubusercontent.com/kugland/invidious-redirect/master/invidious-redirect.js)
into a new userscript.

Once the script is installed, it will automatically redirect YouTube videos to
your Invidious instance when you click on a YouTube link. By default, the script
is configured to redirect to `https://invidious.protokolla.fi`, but you can change
this by clicking on the Invidious icon at the bottom right corner of YouTube main
page.

If you want to use an instance that is not listed, you can just enter it manually.
In the instance URL dialog, the `https://` is implied, so, for HTTPS instances you
can just enter the domain name, but for HTTP instances, you need to enter the full
URL.

## License

This script is released under the MIT License. See the [LICENSE](https://raw.githubusercontent.com/kugland/invidious-redirect/master/LICENSE) file
for details.
