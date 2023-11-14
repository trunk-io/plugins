import semver from "semver";
import { customLinterCheckTest } from "tests";
import { skipCPUOS } from "tests/utils";

customLinterCheckTest({
  linterName: "circleci",
  args: "-a",
  skipTestIf: (version?: string) => {
    if (version && semver.gte(version, "0.1.28528")) {
      return true;
    }
    return skipCPUOS([{ os: "darwin", cpu: "arm64" }])(version);
  },
});
