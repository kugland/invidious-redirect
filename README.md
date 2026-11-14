# Invidious Redirect

This is a maintained fork of [Kugland’s Invidious Redirect](https://github.com/kugland/invidious-redirect). It redirects YouTube videos to an Invidious instance. This fork includes fixes; see the repository’s commit history for the changes.

**Fork:**  
[https://github.com/cryotux/invidious-redirect](https://github.com/cryotux/invidious-redirect)

## Usage

You’ll need a userscript manager, such as Tampermonkey, Violentmonkey, or Greasemonkey. Install the userscript from this repository, or copy the contents of `invidious-redirect.js` into a new script in your userscript manager.

Once installed, the script redirects YouTube videos to an Invidious instance when you open them. By default, it uses `https://inv.nadeko.net`. To change the instance, click the Invidious icon at the bottom-right corner of YouTube.

To use an instance that isn’t listed, enter its address in the instance dialog. For HTTPS, enter the domain name; for HTTP, enter the full URL, including `http://`.

## Credits and license

This is a fork of [Kugland’s Invidious Redirect](https://github.com/kugland/invidious-redirect). The original script is licensed under the MIT License. See the [LICENSE](LICENSE) file for license details.
