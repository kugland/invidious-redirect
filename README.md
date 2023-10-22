# Invidious Redirect

This userscript redirects YouTube videos to an Invidious instance.

## Usage

To use this script, you'll need a userscript manager like Tampermonkey or Greasemonkey.
You can install it from its page at [GreasyFork](https://greasyfork.org/en/scripts/477967-redirect-to-invidious),
or by copying the contents of [invidious-redirect.js](invidious-redirect.js) into a new userscript.

Once the script is installed, it will automatically redirect YouTube videos to your Invidious
instance when you click on a YouTube link. By default, the script is configured to redirect to
`http://127.0.0.1:3000`, but you can change this by editing the `makeUrl` function in the script.

## License

This script is released under the MIT License. See the [LICENSE](LICENSE) file for details.
