import path from "path";
import semver from "semver";
import { customLinterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { skipOS, TEST_DATA } from "tests/utils";

const testGenerator = ({
  args,
  testName,
  preCheck,
  skipTestIf,
}: {
  args: string;
  testName: string;
  preCheck?: (driver: TrunkLintDriver) => void;
  skipTestIf?: (version?: string) => boolean;
}) => {
  const skipTest = (v1: boolean) => (version?: string) => {
    if ((v1 && version === "Latest") || version === undefined) {
      return true;
    }

    const parsedVersion = semver.parse(version);
    if (!parsedVersion) {
      return false;
    }
    if (v1 && parsedVersion.major >= 2) {
      return true;
    } else if (!v1 && parsedVersion.major < 2) {
      return true;
    }

    if (skipTestIf) {
      return skipTestIf(version);
    }
    return false;
  };

  const preCheckV2 = (driver: TrunkLintDriver) => {
    driver.moveFile(path.join(TEST_DATA, ".golangci.yml"), ".golangci2.yml");
    if (preCheck) {
      preCheck(driver);
    }
  };

  customLinterCheckTest({
    linterName: "golangci-lint",
    args,
    testName,
    preCheck,
    skipTestIf: skipTest(true),
  });

  customLinterCheckTest({
    linterName: "golangci-lint2",
    args,
    testName,
    preCheck: preCheckV2,
    skipTestIf: skipTest(false),
  });
};

// Don't run on Windows since the typecheck errors are dependent on system libs, and the set of diagnostics seems to vary.
testGenerator({
  args: `${TEST_DATA} -y`,
  testName: "all",
  skipTestIf: skipOS(["win32"]),
});

// Adding an empty file will cause some other issues to be suppressed.
const addEmpty = (driver: TrunkLintDriver) => {
  driver.writeFile(path.join(TEST_DATA, "empty.go"), "");
};

// Don't run on Windows since the typecheck errors are dependent on system libs, and for the sake of these tests
// it is easier to simply skip these tests than handle additional setup.
testGenerator({
  args: TEST_DATA,
  testName: "empty",
  skipTestIf: skipOS(["win32"]),
  preCheck: addEmpty,
});

// Having an ignored file and no other files causes an error diagnostic to be surfaced.
const setupUnbuildable = (driver: TrunkLintDriver) => {
  driver.moveFile(path.join(TEST_DATA, "unbuildable.go"), "unbuildable.go");
  driver.deleteFile(TEST_DATA);
};

testGenerator({
  testName: "unbuildable",
  args: "unbuildable.go",
  preCheck: setupUnbuildable,
});
