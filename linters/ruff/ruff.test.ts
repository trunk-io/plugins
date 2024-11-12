import semver from "semver";
import { linterCheckTest, linterFmtTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { skipOS } from "tests/utils";

linterCheckTest({ linterName: "ruff", namedTestPrefixes: ["basic", "interface", "syntax"] });

const skipJupyterTestIf = (version?: string) => {
  if (!version || !semver.valid(version)) {
    // Run if version is KGV or a string, or error loudly if malformed.
    return false;
  }
  return semver.lt(version, "0.6.0");
};

linterCheckTest({
  linterName: "ruff",
  namedTestPrefixes: ["basic_nb"],
  skipTestIf: skipJupyterTestIf,
});

// ruff-nbqa still runs correctly on Windows, but the diagnostics are slightly different from the assertions.
linterCheckTest({
  linterName: "ruff-nbqa",
  namedTestPrefixes: ["basic_nb"],
  skipTestIf: skipOS(["win32"]),
});

// Due to ruff's format subcommand being disabled by default, we need to manually enable it in our test's trunk.yaml.
const preCheck = (driver: TrunkLintDriver) => {
  const trunkYamlPath = ".trunk/trunk.yaml";
  const currentContents = driver.readFile(trunkYamlPath);
  const sqlfluffRegex = /- ruff@(.+)\n/;
  const newContents = currentContents.replace(
    sqlfluffRegex,
    "- ruff@$1:\n        commands: [format]\n",
  );
  driver.writeFile(trunkYamlPath, newContents);
};

linterFmtTest({ linterName: "ruff", preCheck, namedTestPrefixes: ["format"] });
