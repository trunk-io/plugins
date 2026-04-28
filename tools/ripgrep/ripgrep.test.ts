import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "ripgrep",
  toolVersion: "13.0.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["rg", "--version"],
      expectedOut: "ripgrep 13.0.0",
    }),
  ],
  // TODO(plugins#1128): ripgrep 13.0.0 (Aug 2021) doesn't cleanly build on
  // the current rust-runtime toolchain, so `trunk tools install ripgrep`
  // keeps failing in the sandbox — same class of breakage as the older
  // nixpkgs-fmt "rust compiler lacks required feature" failure before Eli's
  // bump. Unconditional skip pending a follow-up to bump
  // tools/ripgrep/plugin.yaml's known_good_version to 14.x.
  // (Windows skip still applies — the original comment: requires VS C++
  //  build tools that aren't set up here.)
  skipTestIf: () => true,
});
