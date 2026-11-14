{
  description = "Development environment for invidious-redirect";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  inputs.flake-parts.url = "github:hercules-ci/flake-parts";
  inputs.devshell.url = "github:numtide/devshell";
  inputs.flake-compat.url = "https://flakehub.com/f/edolstra/flake-compat/1.tar.gz";

  outputs = inputs @ {
    nixpkgs,
    flake-parts,
    ...
  }:
    flake-parts.lib.mkFlake {inherit inputs;} {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      imports = [inputs.devshell.flakeModule];
      perSystem = {pkgs, ...}: let
        basePackages = with pkgs; [
          alejandra
          curl
          dart-sass
          deno
          esbuild
          jq
          just
          moreutils
          nodejs
        ];
      in {
        # Light shell for building and day-to-day development.
        devshells.default.packages = basePackages;

        # Adds Chromium for the Playwright end-to-end tests (`nix develop .#test`).
        devshells.test = {
          env = [
            {
              name = "CHROMIUM_PATH";
              value = "${pkgs.chromium}/bin/chromium";
            }
            {
              name = "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD";
              value = "1";
            }
          ];
          packages = basePackages ++ [pkgs.chromium];
        };
      };
    };
}
