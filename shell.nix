{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  packages = with pkgs; [
    dart-sass
    esbuild
    jq
    just
    moreutils
    nodejs
  ];
  shellHook = "";
}
