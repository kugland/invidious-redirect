{pkgs ? import <nixpkgs> {}}:
pkgs.mkShell {
  packages = with pkgs; [
    esbuild
    jq
    just
  ];
  shellHook = "";
}
