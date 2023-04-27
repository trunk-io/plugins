import * as path from "path";
import { linterCheckTest } from "tests";
import { TrunkLintDriver } from "tests/driver";
import { TEST_DATA } from "tests/utils";

// Simulate the creation of a merge conflict
const preCheck = async (driver: TrunkLintDriver) => {
  if (driver.gitDriver) {
    const inputName = "basic.in.txt";
    const inputPath = path.join(TEST_DATA, inputName);

    await driver.gitDriver.checkoutLocalBranch("branchA");
    driver.writeFile(inputPath, "Branch A contents");
    await driver.gitDriver.add(inputPath).commit("Branch A changes");

    await driver.gitDriver.checkoutBranch("branchB", "main");
    driver.writeFile(inputPath, "Branch B contents");
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
