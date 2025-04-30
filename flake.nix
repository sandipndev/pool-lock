{
  description = "pool-lock";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachSystem ["aarch64-darwin" "x86_64-darwin" "x86_64-linux"] (
      system: let
        pkgs = import nixpkgs {
          inherit system;
        };
        nativeBuildInputs = with pkgs; [
          nodejs_20
          alejandra
        ];
      in {
        devShells.default = pkgs.mkShell {
          inherit nativeBuildInputs;
        };
      }
    );
}
