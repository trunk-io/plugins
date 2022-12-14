import path from "path";
import { LinterVersion, TestingArguments } from "tests/types";

export const REPO_ROOT = path.resolve(__dirname, "../..");

/**
 * Parse the environment variable-specified linter version. This can either be:
 * 1. KnownGoodVersion, which parses the linter definition and attempts to specify a known_good_version
 * 2. Latest, which automatically retrieves the latest linter version if network connectivity is available.
 * 3. A specified version. Note that this will apply to all tests, so only use this environment variable when tests are filtered.
 */
const parseLinterVersion = (value: string): LinterVersion | undefined => {
  if (value && value.length > 0) {
    return undefined;
  }
  return value;
};

/**
 * Parses the global testing config inputs, specified as environment variables.
 * - PLUGINS_TEST_CLI_VERSION replaces the repo-wide trunk.yaml's specified cli-version.
 * - PLUGINS_TEST_CLI_PATH specifies an alternative path to a trunk binary.
 * - PLUGINS_TEST_LINTER_VERSION specifies a linter version semantic (see `parseLinterVersion`).
 */
export const ARGS: TestingArguments = {
  cliVersion: process.env.PLUGINS_TEST_CLI_VERSION,
  cliPath: process.env.PLUGINS_TEST_CLI_PATH,
  linterVersion: parseLinterVersion(process.env.PLUGINS_TEST_LINTER_VERSION ?? ""),
};
if (ARGS.cliVersion || ARGS.cliPath || ARGS.linterVersion) {
  console.debug(ARGS);
}
