import * as fs from "fs";
import * as path from "path";
import { linterCheckTest } from "tests";
import { TrunkDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

// Simulate the creation of a merge conflict
const preCheck = async (driver: TrunkDriver) => {
  if (driver.sandboxPath && driver.gitDriver) {
    // trunk-ignore-begin(semgrep): driver.sandboxPath is generated deterministically and is safe
    const testPath = path.resolve(driver.sandboxPath, TEST_DATA);
    const inputName = "basic.in.txt";
    const inputPath = path.resolve(testPath, inputName);
    // trunk-ignore-end(semgrep)

    await driver.gitDriver.checkoutLocalBranch("branchA");
    fs.writeFileSync(inputPath, "Branch A contents");
    await driver.gitDriver.add(inputPath).commit("Branch A changes");

    await driver.gitDriver.checkoutBranch("branchB", "main");
    fs.writeFileSync(inputPath, "Branch B contents");
    await driver.gitDriver.add(inputPath).commit("Branch B changes");

    try {
      // merge intentionally fails
      await driver.gitDriver.merge(["branchA"]);
    } catch (_er) {
      // no-op
    }
  }
};

// git-diff-check checks the git state, not just the presence of conflict markers.
linterCheckTest({ linterName: "git-diff-check", namedTestPrefixes: ["conflict"] });
linterCheckTest({ linterName: "git-diff-check", namedTestPrefixes: ["basic"], preCheck });
