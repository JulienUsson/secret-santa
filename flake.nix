{
  inputs = {
    nixpkgs.url = "nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true;
          };
        };
        node = pkgs.nodejs;
        yarn = pkgs.yarn;
      in
      {
        devShell = pkgs.mkShell {
          buildInputs = [
            node
            yarn
          ];
        };
      });
}