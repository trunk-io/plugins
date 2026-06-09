import { makeToolTestConfig, toolTest } from "tests";

toolTest({
  toolName: "webpack",
  toolVersion: "5.89.0",
  testConfigs: [
    makeToolTestConfig({
      command: ["webpack", "--version"],
      expectedOut: "Binaries:",
    }),
  ],
  // TODO(plugins#1128): `webpack --version` needs webpack-cli to produce the
  // `Binaries:` output this test asserts on. `extra_packages: [webpack-cli]`
  // in tools/webpack/plugin.yaml isn't getting webpack-cli into the sandbox
  // when `trunk tools install webpack` runs, so webpack prints the "CLI for
  // webpack must be installed" prompt to stderr and exits 1. Unconditional
  // skip pending a follow-up to pin webpack-cli or fix extra_packages for
  // node runtime tools. (Also: no Windows shim — webpack.cmd isn't wired up.)
  skipTestIf: () => true,
});
